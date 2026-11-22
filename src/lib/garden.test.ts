import { describe, it, expect } from "vitest";
import { addCare, branches, careLeft, diarySummary, empty, MAX_BRANCHES, planLeft, type GardenState } from "./garden";
import { SCENES } from "./garden-scenes";

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
  it("a diary entry adds growth (2 points)", () => {
    let s = addCare(empty, "diary"); s = addCare(s, "water");
    expect(branches(s)).toBe(1);
  });
  it("diary summary lists ratings for the master", () => {
    const t = diarySummary([{ date: "20.11", energy: 2, sleep: 4, lightness: 3, mood: 5, note: "тянет шею" }]);
    expect(t).toContain("Энергия: 2/5");
    expect(t).toContain("тянет шею");
  });
});

describe("daily limits", () => {
  it("water counts at most 8 glasses (2 litres) a day", () => {
    let s = empty; for (let i = 0; i < 10; i++) s = addCare(s, "water", "2026-11-21");
    expect(s.water).toBe(8);
    expect(careLeft(s, "water", "2026-11-21")).toBe(0);
  });
  it("stretch counts once a day and resets the next day", () => {
    let s = addCare(empty, "stretch", "2026-11-21"); s = addCare(s, "stretch", "2026-11-21");
    expect(s.stretch).toBe(1);
    s = addCare(s, "stretch", "2026-11-22");
    expect(s.stretch).toBe(2);
  });
  it("the two scenes hold 14 finds in total", () => {
    expect(SCENES.reduce((a, sc) => a + sc.items.length, 0)).toBe(MAX_BRANCHES);
  });
});
