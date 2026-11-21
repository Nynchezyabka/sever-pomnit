export type Care = "session" | "water" | "stretch" | "diary";
export type GardenState = { session: number; water: number; stretch: number; diary: number; plan: 0 | 5 | 10; planUsed: number; day?: string; dayWater?: number; dayStretch?: number };

export const empty: GardenState = { session: 0, water: 0, stretch: 0, diary: 0, plan: 0, planUsed: 0 };
export const POINTS: Record<Care, number> = { session: 4, water: 1, stretch: 2, diary: 2 };
export const MAX_BRANCHES = 14;
/** Daily caps keep the game a gentle habit instead of a tapping contest. */
export const DAILY: Record<"water" | "stretch", number> = { water: 3, stretch: 1 };

export function growth(s: GardenState, realVisits = 0) {
  return (s.session + Math.max(0, realVisits)) * POINTS.session + s.water * POINTS.water + s.stretch * POINTS.stretch + s.diary * POINTS.diary;
}
/** One new branch every 3 points of care. Real visits from the cabinet count too. */
export function branches(s: GardenState, realVisits = 0) {
  return Math.min(MAX_BRANCHES, Math.floor(growth(s, realVisits) / 3));
}
export function careLeft(s: GardenState, c: "water" | "stretch", today: string) {
  const used = s.day === today ? (c === "water" ? s.dayWater ?? 0 : s.dayStretch ?? 0) : 0;
  return Math.max(0, DAILY[c] - used);
}
export function addCare(s: GardenState, c: Care, today?: string): GardenState {
  if (today && (c === "water" || c === "stretch") && careLeft(s, c, today) === 0) return s;
  const next: GardenState = { ...s, [c]: s[c] + 1 };
  if (today && (c === "water" || c === "stretch")) {
    const same = s.day === today;
    next.day = today;
    next.dayWater = (same ? s.dayWater ?? 0 : 0) + (c === "water" ? 1 : 0);
    next.dayStretch = (same ? s.dayStretch ?? 0 : 0) + (c === "stretch" ? 1 : 0);
  }
  if (c === "session" && s.plan) next.planUsed = Math.min(s.plan, s.planUsed + 1);
  return next;
}
export function planLeft(s: GardenState) {
  return s.plan ? s.plan - s.planUsed : 0;
}

export type GiftId = "tea" | "salt" | "oil";
export type GiftStatus = "locked" | "ready" | "given";
export const GIFTS: { id: GiftId; at: number; title: string; description: string }[] = [
  { id: "tea", at: 5, title: "Стакан чая", description: "Тёплая чайная пауза после сеанса." },
  { id: "oil", at: 10, title: "Эфирное масло", description: "Аромат для своего уютного ритуала дома." },
  { id: "salt", at: 15, title: "Магниевая соль", description: "Пакетик соли для тёплой домашней ванны." },
];

/** Gifts depend on visits recorded by the master, never on local game actions. */
export function giftStates(realVisits: number, claimed: GiftId[]) {
  return GIFTS.map((gift) => ({
    ...gift,
    status: (claimed.includes(gift.id) ? "given" : realVisits >= gift.at ? "ready" : "locked") as GiftStatus,
  }));
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
