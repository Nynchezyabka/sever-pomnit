import { describe, expect, it } from "vitest";
import { empty, giftStates, growth } from "./garden";

describe("real visit gifts", () => {
  it("no real visits means no unlocked gifts", () => {
    expect(giftStates(0, []).every((gift) => gift.status === "locked")).toBe(true);
  });
  it("four visits do not unlock tea", () => {
    expect(giftStates(4, []).find((gift) => gift.id === "tea")?.status).toBe("locked");
  });
  it("the fifth real visit unlocks tea", () => {
    expect(giftStates(5, []).find((gift) => gift.id === "tea")?.status).toBe("ready");
  });
  it("the tenth real visit unlocks essential oil", () => {
    expect(giftStates(10, []).find((gift) => gift.id === "oil")?.status).toBe("ready");
  });
  it("nine visits do not unlock essential oil", () => {
    expect(giftStates(9, []).find((gift) => gift.id === "oil")?.status).toBe("locked");
  });
  it("the fifteenth real visit unlocks magnesium salt", () => {
    expect(giftStates(15, []).find((gift) => gift.id === "salt")?.status).toBe("ready");
  });
  it("a gift marked as handed over cannot become available again", () => {
    expect(giftStates(15, ["tea"]).find((gift) => gift.id === "tea")?.status).toBe("given");
  });
  it("a real visit adds four growth points to the garden", () => {
    expect(growth(empty, 1)).toBe(4);
  });
});
