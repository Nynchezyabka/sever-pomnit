import { describe, it, expect } from "vitest";
import { addCare, branches, empty, planLeft, type GardenState } from "./garden";

describe("garden", () => {
  it("a session grows a branch (4 points)", () => {
    expect(branches(addCare(empty, "session"))).toBe(1);
  });
  it("three glasses of water grow one branch", () => {
    let s = empty; for (let i = 0; i < 3; i++) s = addCare(s, "water");
    expect(branches(s)).toBe(1);
  });
  it("session counts toward a 5-session subscription", () => {
    const s = addCare({ ...empty, plan: 5 }, "session");
    expect(planLeft(s)).toBe(4);
  });
  it("subscription never goes below zero", () => {
    let s: GardenState = { ...empty, plan: 5 }; for (let i = 0; i < 7; i++) s = addCare(s, "session");
    expect(planLeft(s)).toBe(0);
  });
});
