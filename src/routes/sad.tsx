import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CopyButton, TG_BOOK, meta } from "@/components/site";
import { MAX_BRANCHES, SCALES, addCare, branches, diarySummary, empty, planLeft, type Care, type DiaryEntry, type GardenState } from "@/lib/garden";

export const Route = createFileRoute("/sad")({
  head: () => meta("Зимний сад заботы · Север помнит", "Мини-дневник самочувствия и сад, который растёт от маленьких дел заботы: вода, растяжка, сеанс массажа."),
  component: Garden,
});

const KEY = "sever-garden-v1";
const DKEY = "sever-diary-v1";
const actions: { id: Care; label: string; hint: string; emoji: string }[] = [
  { id: "session", label: "Сеанс массажа", hint: "ветка и огонёк", emoji: "🕯" },
  { id: "water", label: "Стакан воды", hint: "капля роста", emoji: "💧" },
  { id: "stretch", label: "Мягкая растяжка", hint: "две капли роста", emoji: "🌿" },
];
const cheers = ["Тело сказало спасибо. Сад расцветает.", "Ещё одна капелька заботы.", "Тело это запомнит.", "Север помнит.", "Тепло прибавилось.", "Маленький шаг — тоже шаг.", "Веточка проснулась."];

// branch geometry: alternating sides up the trunk
const B = Array.from({ length: MAX_BRANCHES }, (_, i) => {
  const y = 440 - i * 21;
  const side = i % 2 ? 1 : -1;
  const len = 120 - i * 4.5;
  return { x1: 200, y1: y, x2: 200 + side * len, y2: y - 38, cx: 200 + side * len * 0.5, cy: y - 2 };
});

function Garden() {
  const [s, setS] = useState<GardenState>(empty);
  const [msg, setMsg] = useState("");
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [draft, setDraft] = useState({ energy: 3, sleep: 3, lightness: 3, mood: 3, note: "" });
  useEffect(() => { try { const v = localStorage.getItem(KEY); if (v) setS({ ...empty, ...JSON.parse(v) }); const d = localStorage.getItem(DKEY); if (d) setDiary(JSON.parse(d)); } catch {} }, []);
  const saveEntry = () => {
    const e: DiaryEntry = { ...draft, date: new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) };
    const next = [...diary, e].slice(-30); setDiary(next); localStorage.setItem(DKEY, JSON.stringify(next));
    save(addCare(s, "diary")); setDraft({ ...draft, note: "" }); setMsg("Спасибо, что прислушались к себе.");
  };
  const save = (n: GardenState) => { setS(n); localStorage.setItem(KEY, JSON.stringify(n)); };
  const n = branches(s);
  const lights = Math.min(n, s.session);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-sm uppercase tracking-[0.25em] text-amber">Для клиентов</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Зимний сад заботы</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">Отмечайте маленькие добрые дела для тела. Никаких серий и штрафов: пропустили неделю — сад просто ждёт вас.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border bg-card/60 p-4">
          <svg viewBox="0 0 400 480" className="w-full" role="img" aria-label={`Дерево: ${n} веточек, ${lights} огоньков`}>
            <ellipse cx="200" cy="462" rx="160" ry="14" className="fill-moss/40" />
            <path d="M200 465 C196 380 204 250 200 60" className="stroke-paper-foreground" strokeWidth="9" strokeLinecap="round" fill="none" opacity={0.25 + Math.min(1, n / 6) * 0.75} />
            {B.map((b, i) => {
              const on = i < n;
              return (
                <g key={i} style={{ opacity: on ? 1 : 0.06, transition: "opacity 1.2s ease" }}>
                  <path d={`M${b.x1} ${b.y1} Q${b.cx} ${b.cy} ${b.x2} ${b.y2}`} className="stroke-paper-foreground" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  {[0.45, 0.7, 0.95].map((t) => (
                    <ellipse key={t} cx={b.x1 + (b.x2 - b.x1) * t} cy={b.y1 + (b.y2 - b.y1) * t - 6} rx="9" ry="4.5"
                      transform={`rotate(${b.x2 > 200 ? -30 : 30} ${b.x1 + (b.x2 - b.x1) * t} ${b.y1 + (b.y2 - b.y1) * t - 6})`} className="fill-moss" />
                  ))}
                  {i < lights && <circle cx={b.x2} cy={b.y2 + 10} r="6" className="fill-amber flicker" style={{ filter: "drop-shadow(0 0 8px var(--amber))" }} />}
                </g>
              );
            })}
          </svg>
          <p className="text-center font-display text-lg italic text-muted-foreground">{n === 0 ? "Сад ждёт первую каплю заботы" : n >= MAX_BRANCHES ? "Сад в полном цвету" : "Сад тихо растёт"}</p>
        </div>

        <div className="space-y-4">
          {actions.map((a) => (
            <button key={a.id} onClick={() => { save(addCare(s, a.id as Care)); setMsg(cheers[Math.floor(Math.random() * cheers.length)] ?? ""); }}
              className="flex w-full items-center gap-4 rounded-2xl border bg-card/70 p-5 text-left transition hover:border-primary/60 active:scale-[0.99]">
              <span className="text-3xl" aria-hidden>{a.emoji}</span>
              <span><span className="block text-lg font-medium">{a.label}</span><span className="text-sm text-muted-foreground">{a.hint}</span></span>
            </button>
          ))}
          <p className="min-h-6 text-center font-display text-xl italic text-amber" aria-live="polite">{msg}</p>

          <div className="rounded-2xl border bg-card/70 p-5">
            <p className="font-medium">Мой абонемент</p>
            <div className="mt-3 flex gap-2">
              {([0, 5, 10] as const).map((p) => (
                <button key={p} onClick={() => save({ ...s, plan: p, planUsed: 0 })}
                  className={`rounded-full border px-4 py-1.5 text-sm ${s.plan === p ? "border-primary bg-primary text-primary-foreground" : ""}`}>
                  {p ? `${p} сеансов` : "нет"}
                </button>
              ))}
            </div>
            {s.plan > 0 && (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Array.from({ length: s.plan }, (_, i) => (
                    <span key={i} className={`h-5 w-5 rounded-full border border-primary/60 ${i < s.planUsed ? "bg-amber glow" : ""}`} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{planLeft(s) ? `Осталось ${planLeft(s)} — отмечается кнопкой «Сеанс массажа»` : "Абонемент пройден целиком. Вы большая молодец!"}</p>
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <span />
            <button onClick={() => confirm("Точно начать сад заново? Веточки и огоньки исчезнут, дневник останется.") && save(empty)} className="min-h-11 text-xs text-muted-foreground underline">начать заново</button>
          </div>
          <p className="text-xs text-muted-foreground">Сад и дневник хранятся только на этом устройстве.</p>
        </div>
      </div>
      <section className="mt-16 rounded-[2rem] border bg-card/60 p-7">
        <h2 className="text-4xl">Дневник самочувствия</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">Когда захочется — отметьте, как вы сегодня. Без обязательств: пропуски никто не считает. Каждая запись поливает сад.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {SCALES.map((sc) => (
            <label key={sc.key} className="block">
              <span className="flex justify-between"><span className="font-medium">{sc.label}</span><span className="text-amber">{draft[sc.key]}/5</span></span>
              <input type="range" min={1} max={5} value={draft[sc.key]} onChange={(e) => setDraft({ ...draft, [sc.key]: Number(e.target.value) })} className="mt-2 w-full accent-[var(--amber)]" />
              <span className="flex justify-between text-xs text-muted-foreground"><span>{sc.low}</span><span>{sc.high}</span></span>
            </label>
          ))}
        </div>
        <textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Пара слов для себя: где тянет, что радует, как кожа…" rows={2} className="mt-6 w-full rounded-2xl border bg-background/60 p-4" />
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={saveEntry} className="inline-flex min-h-11 items-center rounded-full bg-primary px-7 py-3 font-medium text-primary-foreground glow">Сохранить запись</button>
          {diary.length > 0 && <CopyButton text={diarySummary(diary)}>Скопировать для Александры</CopyButton>}
          {diary.length > 0 && <a href={TG_BOOK} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center px-3 text-muted-foreground underline">открыть Telegram</a>}
        </div>
        {diary.length > 0 && (
          <ul className="mt-8 divide-y divide-border text-sm">
            {diary.slice(-5).reverse().map((e, i) => (
              <li key={i} className="py-3 text-muted-foreground"><span className="text-foreground">{e.date}</span> · {SCALES.map((sc) => `${sc.label.toLowerCase()} ${e[sc.key]}`).join(" · ")}{e.note && <> — {e.note}</>}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
