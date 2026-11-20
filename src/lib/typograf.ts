// Russian typography: glue short words (1–2 letters) to the next word with a
// non-breaking space so they never hang at the end of a line.
const NBSP = "\u00a0";
const SHORT = /(^|[\s\u00a0«(„"—–-])([А-Яа-яЁёA-Za-z]{1,2})[ \t]+(?=\S)/g;

export function typograf(text: string): string {
  if (!text || !/\s/.test(text)) return text;
  let out = text;
  // repeat: "и в лес" needs two passes because matches overlap
  for (let i = 0; i < 3; i++) {
    const next = out.replace(SHORT, (_m, pre: string, w: string) => `${pre}${w}${NBSP}`);
    if (next === out) break;
    out = next;
  }
  return out
    .replace(/Полярная[ \t]+25/g, `Полярная${NBSP}25`)
    .replace(/[ \t]+([—–])(?=\s)/g, `${NBSP}$1`);
}
