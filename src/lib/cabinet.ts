import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { GiftId } from "./garden";

export type Profile = {
  id: string; full_name: string; phone: string; telegram: string;
  oil: string; tea: string; pressure: string; silence: boolean; wishes: string; created_at: string;
};
export type Subscription = {
  id: string; client_id: string; title: string; total_sessions: number;
  used_sessions: number; expires_on: string | null; created_at: string;
};
export type Visit = { id: string; client_id: string; visited_on: string; service: string; comment: string };
export type Note = { id: string; client_id: string; body: string; created_at: string };
export type GiftClaim = { id: string; client_id: string; gift: GiftId; claimed_on: string; created_at: string };

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined;

let client: SupabaseClient | null = null;
/** Browser client for the studio's own database; null until the address and key are set on the hosting. */
export function db(): SupabaseClient | null {
  if (!url || !key || typeof window === "undefined") return null;
  client ??= createClient(url, key);
  return client;
}

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
