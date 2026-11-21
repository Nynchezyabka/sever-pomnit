export const OILS = [
  { id: "hvoya", label: "Хвоя и кедр", note: "свежо, голова становится ясной" },
  { id: "apelsin", label: "Апельсин и лаванда", note: "спокойно, как в тёплом коконе" },
  { id: "imbir", label: "Имбирь и корица", note: "согревает до кончиков пальцев" },
  { id: "none", label: "Без запаха", note: "просто тёплое масло" },
] as const;

export const TEAS = [
  { id: "ded", label: "Дедушкин чай", note: "сосновые почки, еловые побеги, шиповник" },
  { id: "ivan", label: "Иван-чай со смородиной", note: "мягкий, с летним листом" },
  { id: "sbiten", label: "Пряный сбитень", note: "греет изнутри" },
  { id: "voda", label: "Тёплая вода с мятой и лимоном", note: "легко и свежо" },
] as const;

export function ritualMessage(oilId: string, teaId: string): string {
  const oil = OILS.find((o) => o.id === oilId);
  const tea = TEAS.find((t) => t.id === teaId);
  if (!oil || !tea) return "";
  return `Здравствуйте, Александра! К моему сеансу хочется: масло — ${oil.label.toLowerCase()}, после — ${tea.label.toLowerCase()}.`;
}
