export type Care = "session" | "water" | "stretch" | "diary";
export type GardenState = { session: number; water: number; stretch: number; diary: number; plan: 0 | 5 | 10; planUsed: number };

export const empty: GardenState = { session: 0, water: 0, stretch: 0, diary: 0, plan: 0, planUsed: 0 };
export const POINTS: Record<Care, number> = { session: 4, water: 1, stretch: 2, diary: 2 };
export const MAX_BRANCHES = 18;

export function growth(s: GardenState) {
  return s.session * POINTS.session + s.water * POINTS.water + s.stretch * POINTS.stretch + s.diary * POINTS.diary;
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

export type DiaryEntry = { date: string; energy: number; sleep: number; lightness: number; mood: number; note: string };
export const SCALES = [
  { key: "energy", label: "Энергия", low: "на нуле", high: "бодрость" },
  { key: "sleep", label: "Сон", low: "беспокойный", high: "выспалась" },
  { key: "lightness", label: "Лёгкость в теле", low: "отёки, тяжесть", high: "легко" },
  { key: "mood", label: "Настроение", low: "тревожно", high: "спокойно" },
] as const;
/** Short summary to paste into Telegram before a session. */
export function diarySummary(entries: DiaryEntry[], n = 3): string {
  const last = entries.slice(-n);
  if (!last.length) return "";
  const lines = last.map((e) => {
    const parts = SCALES.map((sc) => `${sc.label}: ${e[sc.key]}/5`).join(", ");
    return `${e.date} — ${parts}${e.note ? `. ${e.note}` : ""}`;
  });
  return `Александра, здравствуйте! Моё самочувствие за последние дни:\n${lines.join("\n")}`;
}
