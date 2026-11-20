export type GiftKind = "deposit" | "course";
export type GiftInput = {
  kind: GiftKind;
  amount: number;
  sessions: number;
  area: "тела" | "лица";
  minutes: number;
  recipient: string;
  wish: string;
};

export const DEPOSIT_PRESETS = [3000, 5000, 10000];
export const COURSE_SESSIONS = [3, 5, 10];
export const WISHES = ["Время выдохнуть", "С любовью и заботой", "Твоё личное убежище"];

export function giftTitle(g: GiftInput): string {
  return g.kind === "deposit"
    ? `Депозит на ${g.amount.toLocaleString("ru-RU")} ₽ на любые виды массажа`
    : `Курс: ${g.sessions} сеансов массажа ${g.area} по ${g.minutes} минут`;
}

export function giftMessage(g: GiftInput): string {
  const lines = [
    "Здравствуйте, Александра! Хочу подарить сертификат.",
    `Формат: ${giftTitle(g)}.`,
  ];
  if (g.recipient.trim()) lines.push(`Для кого: ${g.recipient.trim()}.`);
  if (g.wish.trim()) lines.push(`Подпись: «${g.wish.trim()}».`);
  lines.push("Подскажите, пожалуйста, как оплатить и забрать сертификат?");
  return lines.join("\n");
}
