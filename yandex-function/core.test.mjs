import { describe, expect, it } from "vitest";
import { createBackendHandler, hashPassword, signToken, verifyPassword, verifyToken } from "./core.mjs";

function makeMemoryStore() {
  const users = new Map();
  const profiles = new Map();
  const subscriptions = new Map();
  const visits = new Map();
  const notes = new Map();
  const requests = new Map();
  const gifts = new Map();

  return {
    users,
    profiles,
    async getUserById(id) {
      return users.get(id) ?? null;
    },
    async getUserByEmail(email) {
      for (const u of users.values()) if (u.email === email) return u;
      return null;
    },
    async createUserWithProfile(user, profile) {
      users.set(user.id, { ...user });
      profiles.set(profile.id, { ...profile });
    },
    async createBookingRequest(row) {
      requests.set(row.id, { ...row });
    },
    async listOpenRequests() {
      return [...requests.values()].filter((r) => !r.done);
    },
    async markRequestDone(id) {
      const r = requests.get(id);
      if (r) r.done = true;
    },
    async listProfiles() {
      return [...profiles.values()];
    },
    async createProfile(profile) {
      profiles.set(profile.id, { ...profile });
    },
    async updateProfile(id, patch) {
      const p = profiles.get(id);
      if (!p) return null;
      const next = { ...p, ...patch };
      profiles.set(id, next);
      return next;
    },
    async getClientBundle(clientId, { includeNotes }) {
      return {
        profile: profiles.get(clientId) ?? null,
        subscriptions: [...subscriptions.values()].filter((s) => s.client_id === clientId),
        visits: [...visits.values()].filter((v) => v.client_id === clientId),
        gift_claims: [...gifts.values()].filter((g) => g.client_id === clientId),
        notes: includeNotes ? [...notes.values()].filter((n) => n.client_id === clientId) : [],
      };
    },
    async createSubscription(sub) {
      subscriptions.set(sub.id, { ...sub });
    },
    async useSession(subId, service) {
      const sub = subscriptions.get(subId);
      if (!sub) throw new Error("not_found");
      if (sub.used_sessions >= sub.total_sessions) throw new Error("no_sessions_left");
      sub.used_sessions += 1;
      const id = `v-${visits.size + 1}`;
      visits.set(id, { id, client_id: sub.client_id, visited_on: "2026-11-27", service: service || sub.title, comment: "" });
      return sub.total_sessions - sub.used_sessions;
    },
    async createVisit(v) {
      visits.set(v.id, { ...v });
    },
    async createNote(n) {
      notes.set(n.id, { ...n });
    },
    async createGiftClaim(g) {
      for (const cur of gifts.values()) {
        if (cur.client_id === g.client_id && cur.gift === g.gift) return;
      }
      gifts.set(g.id, { ...g });
    },
    async linkOfflineProfile(offlineId, email) {
      const off = profiles.get(offlineId);
      if (!off || !off.offline) throw Object.assign(new Error("offline_profile_not_found"), { status: 404, code: "offline_profile_not_found" });
      let targetUser = null;
      for (const u of users.values()) if (u.email === email) targetUser = u;
      if (!targetUser) {
        const { ApiError } = await import("./core.mjs");
        throw new ApiError(404, "account_not_found", "not found");
      }
      const cur = profiles.get(targetUser.id);
      const merged = {
        id: targetUser.id,
        full_name: cur?.full_name || off.full_name,
        phone: cur?.phone || off.phone,
        telegram: cur?.telegram || off.telegram,
        oil: cur?.oil || off.oil,
        tea: cur?.tea || off.tea,
        pressure: cur?.pressure || off.pressure,
        silence: Boolean(cur?.silence || off.silence),
        wishes: cur?.wishes || off.wishes,
        offline: false,
        created_at: cur?.created_at || off.created_at,
      };
      profiles.set(targetUser.id, merged);
      for (const s of subscriptions.values()) if (s.client_id === offlineId) s.client_id = targetUser.id;
      for (const v of visits.values()) if (v.client_id === offlineId) v.client_id = targetUser.id;
      for (const n of notes.values()) if (n.client_id === offlineId) n.client_id = targetUser.id;
      const seen = new Set([...gifts.values()].filter((g) => g.client_id === targetUser.id).map((g) => g.gift));
      for (const g of gifts.values()) {
        if (g.client_id === offlineId) {
          if (seen.has(g.gift)) gifts.delete(g.id);
          else g.client_id = targetUser.id;
        }
      }
      profiles.delete(offlineId);
      return merged;
    },
  };
}

async function call(handler, action, payload = {}, token = "") {
  const res = await handler({
    httpMethod: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ action, payload }),
  });
  return { status: res.statusCode, ...JSON.parse(res.body) };
}

describe("yandex-function backend", () => {
  it("hashes and verifies passwords and JWT tokens", () => {
    const h = hashPassword("secret123");
    expect(verifyPassword("secret123", h)).toBe(true);
    expect(verifyPassword("wrong", h)).toBe(false);

    const { token } = signToken({ sub: "u1" }, "super-secret-jwt-key-1234", 60);
    expect(verifyToken(token, "super-secret-jwt-key-1234")?.sub).toBe("u1");
    expect(verifyToken(token, "wrong-secret-key-12345")).toBeNull();
  });

  it("handles signup, signin, booking notifications, cabinet updates, and master offline linking", async () => {
    const store = makeMemoryStore();
    const sent = [];
    const handler = createBackendHandler(store, {
      jwtSecret: "test-jwt-secret-at-least-16-chars",
      masterEmails: "sasha@example.com",
      tgBotToken: "bot-tok",
      tgChatId: "123",
      sendTelegram: async ({ text }) => { sent.push(text); },
    });

    // Public booking sends Telegram notification
    const book = await call(handler, "booking.create", { name: "Анна", contact: "+79990001122", service: "Тело" });
    expect(book.status).toBe(200);
    expect(sent[0]).toContain("Анна");

    // Client signs up and updates wishes
    const up = await call(handler, "auth.signUp", { email: "client@example.com", password: "password1", full_name: "Ольга", phone: "123" });
    expect(up.status).toBe(200);
    expect(up.data.session.user.is_master).toBe(false);
    const clientToken = up.data.session.access_token;
    expect(sent[1]).toContain("Ольга");

    // Client cannot access master overview
    const denied = await call(handler, "master.overview", {}, clientToken);
    expect(denied.status).toBe(403);

    // Master signs up via MASTER_EMAILS
    const mUp = await call(handler, "auth.signUp", { email: "Sasha@Example.com", password: "password1", full_name: "Александра", phone: "" });
    expect(mUp.data.session.user.is_master).toBe(true);
    const masterToken = mUp.data.session.access_token;

    // Master sees booking and marks it done
    const ov1 = await call(handler, "master.overview", {}, masterToken);
    expect(ov1.data.requests).toHaveLength(1);
    await call(handler, "master.doneRequest", { id: ov1.data.requests[0].id }, masterToken);
    const ov2 = await call(handler, "master.overview", {}, masterToken);
    expect(ov2.data.requests).toHaveLength(0);

    // Master creates offline client with subscription and links to registered client
    const off = await call(handler, "master.createClient", {
      full_name: "Ольга (офлайн)",
      telegram: "@olga",
      note: "любит лаванду",
      subscription: { title: "5 сеансов", total_sessions: 5, left_sessions: 3 },
    }, masterToken);
    const offId = off.data.profile.id;
    await call(handler, "master.claimGift", { client_id: offId, gift: "tea" }, masterToken);

    const linked = await call(handler, "master.linkOfflineProfile", { offline_id: offId, email: "client@example.com" }, masterToken);
    expect(linked.status).toBe(200);
    expect(linked.data.profile.telegram).toBe("olga");

    const cab = await call(handler, "cabinet.get", {}, clientToken);
    expect(cab.data.subscriptions[0].used_sessions).toBe(2);
    expect(cab.data.gift_claims[0].gift).toBe("tea");
  });
});
