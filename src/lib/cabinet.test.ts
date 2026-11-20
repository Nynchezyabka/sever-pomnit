import { describe, expect, it } from "vitest";
import { matchesClient, sessionsLeft, subscriptionLine } from "./cabinet";

const sub = { id: "1", client_id: "c", title: "Абонемент", total_sessions: 5, used_sessions: 2, expires_on: null, created_at: "" };

describe("cabinet", () => {
  it("shows remaining sessions out of total", () => {
    expect(subscriptionLine(sub)).toBe("осталось 3 из 5");
  });
  it("never shows negative sessions", () => {
    expect(sessionsLeft({ total_sessions: 5, used_sessions: 7 })).toBe(0);
  });
  it("expired subscription says so", () => {
    expect(subscriptionLine({ ...sub, expires_on: "2026-01-01" }, new Date("2026-11-20"))).toBe("срок действия закончился");
  });
  it("finds a client by phone digits in any format", () => {
    expect(matchesClient({ full_name: "Екатерина", phone: "+7 916 123-45-67", telegram: "" }, "1234567")).toBe(true);
    expect(matchesClient({ full_name: "Екатерина", phone: "", telegram: "@katya" }, "katya")).toBe(true);
    expect(matchesClient({ full_name: "Екатерина", phone: "", telegram: "" }, "Ольга")).toBe(false);
  });
});
