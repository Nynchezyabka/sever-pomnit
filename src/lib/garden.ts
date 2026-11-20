export type Care = "session" | "water" | "stretch";
export type GardenState = { session: number; water: number; stretch: number; plan: 0 | 5 | 10; planUsed: number };

export const empty: GardenState = { session: 0, water: 0, stretch: 0, plan: 0, planUsed: 0 };
export const POINTS: Record<Care, number> = { session: 4, water: 1, stretch: 2 };
export const MAX_BRANCHES = 18;

export function growth(s: GardenState) {
  return s.session * POINTS.session + s.water * POINTS.water + s.stretch * POINTS.stretch;
}
/** One new branch every 3 points of care. */
export function branches(s: GardenState) {
  return Math.min(MAX_BRANCHES, Math.floor(growth(s) / 3));
}
export function addCare(s: GardenState, c: Care): GardenState {
  const next = { ...s, [c]: s[c] + 1 };
  if (c === "session" && s.plan) next.planUsed = Math.min(s.plan, s.planUsed + 1);
  return next;
}
export function planLeft(s: GardenState) {
  return s.plan ? s.plan - s.planUsed : 0;
}
