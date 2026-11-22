// Build-time Russian typography: glues short Cyrillic words to the next word with
// a non-breaking space directly in source text, so lines never reflow after load.
// Cyrillic-only, so code identifiers are never touched.
const NBSP = "\u00a0";
const SHORT = /(^|[\s\u00a0«(„"'`>{—–-])([А-Яа-яЁё]{1,2})[ \t]+(?=[^\s{<])/g;
export function typografSource(code) {
  let out = code;
  for (let i = 0; i < 3; i++) {
    const next = out.replace(SHORT, (_m, pre, w) => `${pre}${w}${NBSP}`);
    if (next === out) break;
    out = next;
  }
  return out.replace(/Полярная[ \t]+25/g, `Полярная${NBSP}25`).replace(/([А-Яа-яЁё»")]) +([—–]) /g, `$1${NBSP}$2 `);
}
export function typografPlugin() {
  return {
    name: "sever-typograf",
    enforce: "pre",
    transform(code, id) {
      if (!/\/src\/.*\.(tsx|ts)$/.test(id) || /\.test\./.test(id)) return null;
      if (!/[А-Яа-яЁё]/.test(code)) return null;
      const out = typografSource(code);
      return out === code ? null : { code: out, map: null };
    },
  };
}
