import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookButton, meta } from "@/components/site";
import { MAX_BRANCHES, addCare, branches, empty, planLeft, type Care, type GardenState } from "@/lib/garden";

export const Route = createFileRoute("/sad")({
  head: () => meta("Зимний сад заботы · Север помнит", "Отмечайте сеансы, воду и растяжку — и смотрите, как распускаются веточки и зажигаются тёплые огоньки."),
  component: Garden,
});

const KEY = "sever-garden-v1";
const actions: { id: Care; label: string; hint: string; emoji: string }[] = [
  { id: "session", label: "Был сеанс", hint: "+ ветка и огонёк", emoji: "🕯" },
  { id: "water", label: "Выпил(а) воды", hint: "+ капля роста", emoji: "💧" },
  { id: "stretch", label: "Потянулся(лась)", hint: "+ две капли роста", emoji: "🌿" },
];
const cheers = ["Тело это запомнит.", "Север помнит.", "Тепло прибавилось.", "Маленький шаг — тоже шаг.", "Веточка проснулась."];

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
  useEffect(() => { try { const v = localStorage.getItem(KEY); if (v) setS({ ...empty, ...JSON.parse(v) }); } catch {} }, []);
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
          <p className="text-center text-sm text-muted-foreground">{n} из {MAX_BRANCHES} веточек · {lights} огоньков</p>
        </div>

        <div className="space-y-4">
          {actions.map((a) => (
            <button key={a.id} onClick={() => { save(addCare(s, a.id)); setMsg(cheers[Math.floor(Math.random() * cheers.length)] ?? ""); }}
              className="flex w-full items-center gap-4 rounded-2xl border bg-card/70 p-5 text-left transition hover:border-primary/60 active:scale-[0.99]">
              <span className="text-3xl" aria-hidden>{a.emoji}</span>
              <span><span className="block text-lg font-medium">{a.label}</span><span className="text-sm text-muted-foreground">{a.hint} · уже {s[a.id]}</span></span>
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
                <p className="mt-2 text-sm text-muted-foreground">{planLeft(s) ? `Осталось ${planLeft(s)} — отмечается кнопкой «Был сеанс»` : "Абонемент пройден целиком. Вы большая молодец!"}</p>
              </>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <BookButton>Вырастить ветку — записаться</BookButton>
            <button onClick={() => confirm("Начать сад заново?") && save(empty)} className="text-xs text-muted-foreground underline">начать заново</button>
          </div>
          <p className="text-xs text-muted-foreground">Сад хранится на этом устройстве.</p>
        </div>
      </div>
    </div>
  );
}
