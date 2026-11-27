import { ChevronLeft, ChevronRight, Lock, Snowflake, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SCENES, gardenImg, type SceneItem } from "@/lib/garden-scenes";

const FLAKES = Array.from({ length: 16 }, (_, i) => ({ x: (i * 37 + 7) % 98, d: (i % 6) * 1.3, s: 3 + (i % 3) * 2 }));

/** Illustrated garden: finds appear one by one as care points grow; tapping a find opens a tip. */
export function GardenScene({ found, fresh }: { found: number; fresh: number }) {
  const glade = SCENES[0]!;
  const tearoomOpen = found >= glade.items.length;
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState<SceneItem | null>(null);
  const [snow, setSnow] = useState(true);
  useEffect(() => { if (localStorage.getItem("garden-snow") === "off") setSnow(false); }, []);
  const toggleSnow = () => { setSnow(!snow); localStorage.setItem("garden-snow", snow ? "off" : "on"); };
  useEffect(() => { if (tearoomOpen && fresh === glade.items.length + 1) setIdx(1); }, [tearoomOpen, fresh, glade.items.length]);

  const scene = SCENES[idx] ?? glade;
  const offset = idx === 0 ? 0 : glade.items.length;
  const shown = Math.max(0, Math.min(scene.items.length, found - offset));
  const next = scene.items[shown];

  return (
    <div>
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-3xl border border-primary/25 bg-secondary/40">
        <img src={scene.bg} alt={scene.title} className="absolute inset-0 h-full w-full object-cover" loading={idx ? "lazy" : "eager"} />
        {snow && <div className="pointer-events-none absolute inset-0" aria-hidden>
          {FLAKES.map((f, i) => <span key={i} className="garden-flake" style={{ left: `${f.x}%`, width: f.s, height: f.s, animationDelay: `${f.d}s` }} />)}
        </div>}
        <button type="button" onClick={toggleSnow} aria-pressed={!snow} className="absolute bottom-2 left-2 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-background/80 px-3 text-sm backdrop-blur"><Snowflake className="h-4 w-4" aria-hidden />{snow ? "Тише" : "Снег"}</button>
        {scene.items.map((it, i) => i < shown && (
          <button key={it.id} type="button" onClick={() => setOpen(it)} aria-label={`${it.name}: совет`}
            className={`garden-find absolute -translate-x-1/2 -translate-y-full ${i + offset + 1 === fresh ? "garden-pop" : ""}`}
            style={{ left: `${it.x}%`, top: `${it.y}%`, width: `${it.w}%` }}>
            <img src={gardenImg(it.id)} alt="" className="w-full drop-shadow-lg" loading="lazy" />
          </button>
        ))}
        <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setIdx(0)} disabled={idx === 0} aria-label="Северная поляна" className="grid h-10 w-10 place-items-center rounded-full bg-background/75 backdrop-blur disabled:opacity-0"><ChevronLeft className="h-5 w-5" /></button>
          <span className="rounded-full bg-background/75 px-4 py-1.5 font-display text-sm backdrop-blur sm:text-base">{scene.title} · {shown}/{scene.items.length}</span>
          <button type="button" onClick={() => tearoomOpen && setIdx(1)} disabled={idx === 1} aria-label={tearoomOpen ? "Тайная чайная" : "Чайная пока закрыта"} className="grid h-10 w-10 place-items-center rounded-full bg-background/75 backdrop-blur disabled:opacity-0">
            {tearoomOpen ? <ChevronRight className="h-5 w-5" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>
        {open && (
          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-primary/30 bg-background/92 p-4 shadow-xl backdrop-blur sm:inset-x-auto sm:right-4 sm:w-80" role="dialog" aria-label={open.name}>
            <div className="flex items-start gap-3">
              <img src={gardenImg(open.id)} alt="" className="h-12 w-12 object-contain" />
              <div className="flex-1"><p className="font-display text-lg text-amber">{open.name}</p><p className="mt-1 text-sm">{open.tip}</p></div>
              <button type="button" onClick={() => setOpen(null)} aria-label="Закрыть" className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {next ? <>Следующая находка: <span className="text-foreground">{next.name}</span>{idx === 0 && !tearoomOpen ? " · чайная откроется, когда поляна расцветёт" : ""}</> : idx === 0 ? "Поляна расцвела! Загляните в Тайную чайную →" : "Чайная собрана целиком. Тёплого вам вечера."}
        {shown > 0 && <span className="block text-sm">Нажмите на находку — там совет.</span>}
      </p>
    </div>
  );
}
