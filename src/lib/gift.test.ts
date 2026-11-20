import { describe, expect, it } from "vitest";
import { giftMessage, giftTitle } from "./gift";

const base = { kind: "deposit" as const, amount: 5000, sessions: 5, area: "тела" as const, minutes: 60, recipient: "", wish: "" };

describe("gift certificate", () => {
  it("deposit title names the sum for any massage", () => {
    expect(giftTitle(base)).toBe("Депозит на 5\u00a0000 ₽ на любые виды массажа");
  });
  it("course title names sessions, area and minutes", () => {
    expect(giftTitle({ ...base, kind: "course", sessions: 10, area: "лица", minutes: 50 })).toBe("Курс: 10 сеансов массажа лица по 50 минут");
  });
  it("message includes recipient and wish only when filled", () => {
    expect(giftMessage(base)).not.toContain("Для кого");
    const m = giftMessage({ ...base, recipient: "Маме", wish: "Время выдохнуть" });
    expect(m).toContain("Для кого: Маме.");
    expect(m).toContain("«Время выдохнуть»");
  });
});
