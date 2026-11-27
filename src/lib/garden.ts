export type Care = "session" | "water" | "stretch" | "diary";
export type GardenState = { session: number; water: number; stretch: number; diary: number; plan: 0 | 5 | 10; planUsed: number; day?: string; dayWater?: number; dayStretch?: number };

export const empty: GardenState = { session: 0, water: 0, stretch: 0, diary: 0, plan: 0, planUsed: 0 };
export const POINTS: Record<Care, number> = { session: 4, water: 1, stretch: 2, diary: 2 };
export const MAX_BRANCHES = 14;
/** Daily caps keep the game a gentle habit instead of a tapping contest. */
export const DAILY: Record<"water" | "stretch", number> = { water: 8, stretch: 1 };

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
export function waterToday(s: GardenState, today: string) {
  return s.day === today ? s.dayWater ?? 0 : 0;
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
  { key: "sleep", label: "Сон", low: "беспокойный", high: "хороший сон" },
  { key: "lightness", label: "Лёгкость в теле", low: "тяжесть, усталость", high: "легко" },
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

const CODE_PREFIX = "SP1:";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const nonNegInt = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
const scaleVal = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(5, Math.max(1, Math.round(v))) : 3);

/** Encodes local garden state and diary into a portable transfer code. */
export function exportGardenCode(state: GardenState, diary: DiaryEntry[]): string {
  const payload = JSON.stringify({ s: state, d: diary.slice(-30) });
  return CODE_PREFIX + toBase64Url(new TextEncoder().encode(payload));
}

/** Decodes and validates a garden transfer code; returns null if malformed. */
export function importGardenCode(raw: string): { state: GardenState; diary: DiaryEntry[] } | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(CODE_PREFIX)) return null;
  try {
    const json = new TextDecoder().decode(fromBase64Url(trimmed.slice(CODE_PREFIX.length)));
    const parsed = JSON.parse(json) as { s?: Record<string, unknown>; d?: unknown[] };
    if (!parsed || typeof parsed !== "object" || !parsed.s || typeof parsed.s !== "object") return null;
    const rs = parsed.s;
    const plan = rs["plan"] === 5 || rs["plan"] === 10 ? rs["plan"] : 0;
    const state: GardenState = {
      session: nonNegInt(rs["session"]),
      water: nonNegInt(rs["water"]),
      stretch: nonNegInt(rs["stretch"]),
      diary: nonNegInt(rs["diary"]),
      plan,
      planUsed: Math.min(plan, nonNegInt(rs["planUsed"])),
      ...(typeof rs["day"] === "string" ? { day: rs["day"] } : {}),
      ...(typeof rs["dayWater"] === "number" ? { dayWater: nonNegInt(rs["dayWater"]) } : {}),
      ...(typeof rs["dayStretch"] === "number" ? { dayStretch: nonNegInt(rs["dayStretch"]) } : {}),
    };
    const diary: DiaryEntry[] = Array.isArray(parsed.d)
      ? parsed.d
          .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
          .slice(-30)
          .map((e) => ({
            date: typeof e["date"] === "string" ? e["date"].slice(0, 16) : "",
            energy: scaleVal(e["energy"]),
            sleep: scaleVal(e["sleep"]),
            lightness: scaleVal(e["lightness"]),
            mood: scaleVal(e["mood"]),
            note: typeof e["note"] === "string" ? e["note"].slice(0, 500) : "",
          }))
      : [];
    return { state, diary };
  } catch {
    return null;
  }
}
