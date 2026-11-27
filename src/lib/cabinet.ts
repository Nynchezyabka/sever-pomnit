import type { GiftId } from "./garden";

export type Profile = {
  id: string; full_name: string; phone: string; telegram: string;
  oil: string; tea: string; pressure: string; silence: boolean; wishes: string; created_at: string; offline?: boolean;
};
export type Subscription = {
  id: string; client_id: string; title: string; total_sessions: number;
  used_sessions: number; expires_on: string | null; created_at: string;
};
export type Visit = { id: string; client_id: string; visited_on: string; service: string; comment: string };
export type Note = { id: string; client_id: string; body: string; created_at: string };
export type GiftClaim = { id: string; client_id: string; gift: GiftId; claimed_on: string; created_at: string };
export type BookingRequest = {
  id: string; name: string; contact: string; service: string; wish_time: string; comment: string; created_at: string;
};

export type SessionUser = { id: string; email: string; is_master: boolean };
export type Session = { user: SessionUser; access_token: string; expires_at: number };
export type ApiError = { code: string; message: string };

const SESSION_KEY = "sever-session-v1";
const rawUrl = import.meta.env["VITE_API_URL"] as string | undefined;
const apiUrl = rawUrl ? rawUrl.trim().replace(/\/+$/, "") : "";

const listeners = new Set<(session: Session | null) => void>();

export function hasBackendUrl(): boolean {
  return Boolean(apiUrl);
}

export function getStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.access_token || !parsed?.user?.id) return null;
    if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setSession(next: Session | null) {
  if (typeof window !== "undefined") {
    try {
      if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      else localStorage.removeItem(SESSION_KEY);
    } catch { /* ignore storage errors */ }
  }
  for (const fn of listeners) fn(next);
}

export function onSessionChange(cb: (session: Session | null) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

async function callApi<T>(
  action: string,
  payload: Record<string, unknown> = {},
  options: { auth?: boolean } = {},
): Promise<{ data: T | null; error: ApiError | null }> {
  if (!apiUrl || typeof window === "undefined") {
    return { data: null, error: { code: "not_configured", message: "Сервер не подключён." } };
  }
  const useAuth = options.auth !== false;
  const current = useAuth ? getStoredSession() : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (useAuth && current?.access_token) {
    headers["Authorization"] = `Bearer ${current.access_token}`;
  }
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ action, payload }),
    });
    const json = (await res.json()) as { data?: T; error?: ApiError };
    if (!res.ok || json.error) {
      const err = json.error ?? { code: "request_failed", message: "Не удалось выполнить запрос." };
      if (res.status === 401 && useAuth) setSession(null);
      return { data: null, error: err };
    }
    return { data: (json.data ?? null) as T | null, error: null };
  } catch {
    return { data: null, error: { code: "network_error", message: "Не удалось связаться с сервером." } };
  }
}

export const api = {
  async signUp(input: { email: string; password: string; full_name: string; phone: string }) {
    const res = await callApi<{ session: Session }>("auth.signUp", input, { auth: false });
    if (res.data?.session) setSession(res.data.session);
    return res;
  },
  async signIn(input: { email: string; password: string }) {
    const res = await callApi<{ session: Session }>("auth.signIn", input, { auth: false });
    if (res.data?.session) setSession(res.data.session);
    return res;
  },
  async refreshSession() {
    const current = getStoredSession();
    if (!current) return null;
    const res = await callApi<{ user: SessionUser }>("auth.session");
    if (res.data?.user) {
      const updated = { ...current, user: res.data.user };
      setSession(updated);
      return updated;
    }
    return getStoredSession();
  },
  signOut() {
    setSession(null);
  },
  createBooking(input: { name: string; contact: string; service: string; wish_time: string; comment: string }) {
    return callApi<{ ok: boolean }>("booking.create", input, { auth: false });
  },
  getCabinet() {
    return callApi<{ is_master: boolean; profile: Profile | null; subscriptions: Subscription[]; visits: Visit[]; gift_claims: GiftClaim[] }>("cabinet.get");
  },
  updateProfile(patch: Pick<Profile, "full_name" | "phone" | "telegram" | "oil" | "tea" | "pressure" | "silence" | "wishes">) {
    return callApi<{ profile: Profile | null }>("cabinet.updateProfile", patch);
  },
  getGardenGifts() {
    return callApi<{ visits_count: number; claimed: GiftId[] }>("garden.gifts");
  },
  getMasterOverview() {
    return callApi<{ requests: BookingRequest[]; clients: Profile[] }>("master.overview");
  },
  markRequestDone(id: string) {
    return callApi<{ ok: boolean }>("master.doneRequest", { id });
  },
  createOfflineClient(input: {
    full_name: string;
    phone: string;
    telegram: string;
    note?: string | undefined;
    subscription?: { title: string; total_sessions: number; left_sessions: number; expires_on: string | null } | undefined;
  }) {
    return callApi<{ profile: Profile }>("master.createClient", input);
  },
  getMasterClient(clientId: string) {
    return callApi<{ profile: Profile | null; subscriptions: Subscription[]; visits: Visit[]; notes: Note[]; gift_claims: GiftClaim[] }>("master.getClient", { client_id: clientId });
  },
  linkOfflineProfile(offlineId: string, email: string) {
    return callApi<{ profile: Profile }>("master.linkOfflineProfile", { offline_id: offlineId, email });
  },
  addSubscription(input: { client_id: string; title: string; total_sessions: number; expires_on: string | null }) {
    return callApi<{ subscription: Subscription }>("master.addSubscription", input);
  },
  useSession(subId: string, service = "") {
    return callApi<{ left: number }>("master.useSession", { sub_id: subId, service });
  },
  addVisit(clientId: string, service = "Сеанс") {
    return callApi<{ visit: Visit }>("master.addVisit", { client_id: clientId, service });
  },
  addNote(clientId: string, body: string) {
    return callApi<{ note: Note }>("master.addNote", { client_id: clientId, body });
  },
  claimGift(clientId: string, gift: GiftId) {
    return callApi<{ claim: GiftClaim }>("master.claimGift", { client_id: clientId, gift });
  },
};

export function sessionsLeft(s: Pick<Subscription, "total_sessions" | "used_sessions">): number {
  return Math.max(0, s.total_sessions - s.used_sessions);
}

export function isExpired(s: Pick<Subscription, "expires_on">, today = new Date()): boolean {
  if (!s.expires_on) return false;
  const d = today.toISOString().slice(0, 10);
  return s.expires_on < d;
}

export function subscriptionLine(s: Subscription, today = new Date()): string {
  if (isExpired(s, today)) return "срок действия закончился";
  const left = sessionsLeft(s);
  return left === 0 ? "все сеансы использованы" : `осталось ${left} из ${s.total_sessions}`;
}

/** Simple client search by name, phone or Telegram nick. */
export function matchesClient(p: Pick<Profile, "full_name" | "phone" | "telegram">, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const digits = t.replace(/\D/g, "");
  return p.full_name.toLowerCase().includes(t)
    || p.telegram.toLowerCase().replace("@", "").includes(t.replace("@", ""))
    || (digits.length >= 3 && p.phone.replace(/\D/g, "").includes(digits));
}
