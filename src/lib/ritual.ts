export const OILS = [
  { id: "hvoya", label: "Хвоя", note: "свежо и ясно" },
  { id: "imbir", label: "Имбирь", note: "согревает до кончиков пальцев" },
  { id: "kedr", label: "Кедр", note: "спокойно и надёжно" },
  { id: "none", label: "Без запаха", note: "просто тёплое масло" },
] as const;

export const TEAS = [
  { id: "ivan", label: "Иван-чай", note: "мягкий, медовый" },
  { id: "brusnika", label: "Брусничный лист", note: "лёгкий, с кислинкой" },
  { id: "chabrec", label: "Чабрец", note: "согревающий, пряный" },
  { id: "voda", label: "Просто тёплая вода", note: "тоже забота" },
] as const;

export function ritualMessage(oilId: string, teaId: string): string {
  const oil = OILS.find((o) => o.id === oilId);
  const tea = TEAS.find((t) => t.id === teaId);
  if (!oil || !tea) return "";
  return `Здравствуйте, Александра! К моему сеансу хочется: масло — ${oil.label.toLowerCase()}, после — ${tea.label.toLowerCase()}.`;
}
