import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Droplets, Gift, Lightbulb, RotateCcw, Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { GiftShelf } from "@/components/garden-gifts";
import { useSession } from "@/components/cabinet-ui";
import { CopyButton, TG_BOOK, TG_CHANNEL, meta } from "@/components/site";
import { MAX_BRANCHES, SCALES, addCare, branches, diarySummary, empty, type Care, type DiaryEntry, type GardenState, type GiftId } from "@/lib/garden";
import { db } from "@/lib/cabinet";

export const Route = createFileRoute("/sad")({
  head: () => meta("Зимний сад · Север помнит", "Тихая игра заботы, советы Александры, дневник самочувствия и настоящие подарки за визиты на массаж."),
  component: Garden,
});

const KEY = "sever-garden-v1";
const DKEY = "sever-diary-v1";
const cheers = ["Тело сказало спасибо.", "Ещё одна капелька заботы.", "Тело это запомнит.", "Тепло прибавилось.", "Маленький шаг — тоже шаг.", "Веточка проснулась."];
const tips = [
  { tag: "После массажа", title: "Вода и немного движения", text: "Не забывайте про воду и спокойную прогулку. Не нужно устраивать подвиг — просто дайте телу немного движения." },
  { tag: "За рабочим столом", title: "Дайте плечам передышку", text: "Поставьте стопы на пол, расправьте плечи и медленно сделайте несколько кругов плечами. Без боли и усилия через силу." },
  { tag: "Когда трудно выдохнуть", title: "Прогулка и привычное время сна", text: "Начните с простого: 20–30 минут пешком и одинаковое время отхода ко сну. Организму проще расслабиться, когда у него есть опора." },
  { tag: "Для тёплого вечера", title: "Выберите один уютный ритуал", text: "Приглушённый свет, тёплая ванна или пряный чай. Не всё сразу: одного маленького ритуала достаточно, чтобы сменить темп." },
  { tag: "Перед сном", title: "Три приятных момента", text: "Запишите три хорошие вещи за день. Совсем маленькие тоже считаются: вкусный чай, тёплые носки, доброе сообщение." },
  { tag: "Мягкая разминка", title: "Тянемся без резких движений", text: "Попробуйте осторожный наклон с прямой спиной или мягкие повороты головы. Боль — сигнал остановиться, а не тянуться сильнее." },
];
const tabs = [
  { id: "garden", label: "Сад", icon: Sprout },
  { id: "tips", label: "Советы", icon: Lightbulb },
  { id: "gifts", label: "Подарки", icon: Gift },
  { id: "diary", label: "Дневник", icon: BookOpen },
] as const;
type Tab = (typeof tabs)[number]["id"];

// Branch geometry: alternating sides up the trunk.
const B = Array.from({ length: MAX_BRANCHES }, (_, i) => {
  const y = 440 - i * 21;
  const side = i % 2 ? 1 : -1;
  const len = 120 - i * 4.5;
  return { x1: 200, y1: y, x2: 200 + side * len, y2: y - 38, cx: 200 + side * len * 0.5, cy: y - 2 };
});

function Garden() {
  const { session, ready } = useSession();
  const userId = session?.user.id;
  const [tab, setTab] = useState<Tab>("garden");
  const [s, setS] = useState<GardenState>(empty);
  const [msg, setMsg] = useState("");
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [draft, setDraft] = useState({ energy: 3, sleep: 3, lightness: 3, mood: 3, note: "" });
  const [tip, setTip] = useState(0);
  const [visits, setVisits] = useState(0);
  const [claimed, setClaimed] = useState<GiftId[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(false);
  const [giftError, setGiftError] = useState("");

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v) setS({ ...empty, ...JSON.parse(v) });
      const d = localStorage.getItem(DKEY);
      if (d) setDiary(JSON.parse(d));
    } catch { /* A damaged local entry should not block the garden. */ }
  }, []);

  useEffect(() => {
    let alive = true;
    if (!userId) { setVisits(0); setClaimed([]); setGiftsLoading(false); setGiftError(""); return; }
    const c = db();
    if (!c) { setGiftsLoading(false); return; }
    setGiftsLoading(true); setGiftError("");
    Promise.all([
      c.from("visits").select("id", { count: "exact", head: true }).eq("client_id", userId),
      c.from("gift_claims").select("gift").eq("client_id", userId),
    ]).then(([v, g]) => {
      if (!alive) return;
      if (v.error || g.error) setGiftError("Не получилось загрузить историю визитов. Обновите страницу или напишите мне в Telegram.");
      else {
        setVisits(v.count ?? 0);
        setClaimed(((g.data ?? []) as { gift: GiftId }[]).map((x) => x.gift));
      }
      setGiftsLoading(false);
    }).catch(() => { if (alive) { setGiftError("Не получилось загрузить историю визитов. Проверьте соединение и обновите страницу."); setGiftsLoading(false); } });
    return () => { alive = false; };
  }, [userId]);

  const save = (n: GardenState) => { setS(n); localStorage.setItem(KEY, JSON.stringify(n)); };
  const care = (kind: Care) => {
    save(addCare(s, kind));
    setMsg(cheers[Math.floor(Math.random() * cheers.length)] ?? "Сад тихо растёт.");
  };
  const saveEntry = () => {
    const e: DiaryEntry = { ...draft, date: new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) };
    const next = [...diary, e].slice(-30);
    setDiary(next);
    localStorage.setItem(DKEY, JSON.stringify(next));
    save(addCare(s, "diary"));
    setDraft({ ...draft, note: "" });
    setMsg("Спасибо, что прислушались к себе.");
  };

  const n = branches(s, visits);
  const lights = Math.min(n, s.session + visits);
  const currentTip = tips[tip] ?? tips[0]!;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber">Тихая игра заботы</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Зимний сад</h1>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">Маленькие домашние дела растят дерево. Настоящие подарки открывают только визиты, которые я отметила в кабинете.</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.75rem] border bg-card/60 shadow-lg shadow-background/20">
        <nav className="grid grid-cols-4 border-b bg-background/25 p-1.5" aria-label="Разделы Зимнего сада">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} aria-current={tab === item.id ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs transition sm:flex-row sm:gap-2 sm:text-sm ${tab === item.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/40"}`}>
                <Icon className="h-4 w-4" aria-hidden /> {item.label}
              </button>
            );
          })}
        </nav>

        {tab === "garden" && (
          <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <div className="rounded-3xl border bg-background/30 px-3 py-2">
              <svg viewBox="0 0 400 480" className="mx-auto h-60 w-full sm:h-72 md:h-80" role="img" aria-label={`Дерево: ${n} веточек, ${lights} огоньков`}>
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
              <p className="pb-2 text-center font-display text-lg italic text-muted-foreground">{n === 0 ? "Сад ждёт первую каплю заботы" : n >= MAX_BRANCHES ? "Сад в полном цвету" : `${n} ${n === 1 ? "веточка" : n < 5 ? "веточки" : "веточек"} · сад тихо растёт`}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Что вы уже сделали для себя сегодня?</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => care("water")} className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border border-primary/25 bg-secondary/45 p-3 text-center transition hover:bg-secondary active:scale-[0.98]">
                  <Droplets className="h-7 w-7 text-amber" aria-hidden /><span className="font-medium">Стакан воды</span><span className="text-xs text-muted-foreground">+ капля роста</span>
                </button>
                <button type="button" onClick={() => care("stretch")} className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border border-primary/25 bg-secondary/45 p-3 text-center transition hover:bg-secondary active:scale-[0.98]">
                  <Sprout className="h-7 w-7 text-amber" aria-hidden /><span className="font-medium">Мягкая разминка</span><span className="text-xs text-muted-foreground">+ две капли</span>
                </button>
              </div>
              <button type="button" onClick={() => setTab("diary")} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border px-4 text-sm transition hover:bg-secondary/40">
                <BookOpen className="h-4 w-4" aria-hidden /> Записать самочувствие
              </button>
              <p className="mt-3 min-h-6 text-center font-display text-lg italic text-amber" aria-live="polite">{msg}</p>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Сад хранится на этом устройстве.</span>
                <button type="button" onClick={() => confirm("Начать сад заново? Домашние отметки исчезнут, дневник и подарки за визиты останутся.") && save(empty)} className="inline-flex min-h-11 items-center gap-1 underline"><RotateCcw className="h-3 w-3" aria-hidden /> заново</button>
              </div>
            </div>
          </div>
        )}

        {tab === "tips" && (
          <div className="p-4 sm:p-7">
            <article className="rounded-3xl border bg-background/35 p-5 sm:p-7">
              <p className="text-xs uppercase tracking-[0.18em] text-amber">{currentTip.tag}</p>
              <h2 className="mt-2 text-2xl sm:text-3xl">{currentTip.title}</h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">{currentTip.text}</p>
              <p className="mt-4 text-xs text-muted-foreground">Из моих заметок в Telegram. Это идеи для заботы, а не медицинские назначения.</p>
            </article>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2" aria-label={`Совет ${tip + 1} из ${tips.length}`}>
                {tips.map((_, i) => <button key={i} type="button" aria-label={`Совет ${i + 1}`} onClick={() => setTip(i)} className={`h-2.5 rounded-full transition-all ${i === tip ? "w-7 bg-amber" : "w-2.5 bg-muted hover:bg-muted-foreground"}`} />)}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setTip((tip + 1) % tips.length)} className="min-h-11 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Ещё совет</button>
                <a href={TG_CHANNEL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground underline">Мой канал</a>
              </div>
            </div>
          </div>
        )}

        {tab === "gifts" && (
          <div className="p-4 sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="text-2xl sm:text-3xl">Подарки за визиты</h2><p className="mt-1 text-sm text-muted-foreground">Не игровые баллы, а маленькие настоящие знаки внимания.</p></div>
              {userId && !giftsLoading && <span className="rounded-full bg-secondary px-4 py-2 text-sm">Визитов: {visits}</span>}
            </div>
            {!ready || giftsLoading ? <p className="py-8 text-center text-muted-foreground">Заглядываю в историю визитов…</p> : !userId ? (
              <div className="mb-5 rounded-2xl border border-primary/35 bg-secondary/40 p-4">
                <p className="text-sm">Войдите в кабинет — я увижу ваши визиты и отмечу выданный подарок.</p>
                <Link to="/kabinet" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Войти в кабинет</Link>
              </div>
            ) : null}
            {giftError ? <p className="rounded-2xl border border-primary/35 bg-secondary/40 p-4 text-sm text-amber">{giftError}</p> : ready && !giftsLoading && <GiftShelf visits={userId ? visits : 0} claimed={claimed} />}
          </div>
        )}

        {tab === "diary" && (
          <div className="p-4 sm:p-7">
            <h2 className="text-2xl sm:text-3xl">Дневник самочувствия</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">Записывайте, когда захотите. Здесь нет обязательных дней и штрафов за пропуски.</p>
            <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {SCALES.map((sc) => (
                <label key={sc.key} className="block rounded-2xl bg-background/30 p-3">
                  <span className="flex justify-between gap-3"><span className="font-medium">{sc.label}</span><span className="text-amber">{draft[sc.key]}/5</span></span>
                  <input type="range" min={1} max={5} value={draft[sc.key]} onChange={(e) => setDraft({ ...draft, [sc.key]: Number(e.target.value) })} className="mt-2 w-full accent-[var(--amber)]" />
                  <span className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{sc.low}</span><span className="text-right">{sc.high}</span></span>
                </label>
              ))}
            </div>
            <textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Пара слов для себя: где тянет, что радует, как кожа…" rows={2} className="mt-5 w-full rounded-2xl border bg-background/50 p-4" />
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={saveEntry} className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Сохранить запись</button>
              {diary.length > 0 && <CopyButton text={diarySummary(diary)}>Скопировать для меня</CopyButton>}
              {diary.length > 0 && <a href={TG_BOOK} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center px-2 text-sm text-muted-foreground underline">Открыть Telegram</a>}
            </div>
            {msg && <p className="mt-3 font-display text-lg italic text-amber" aria-live="polite">{msg}</p>}
            {diary.length > 0 && (
              <ul className="mt-6 divide-y divide-border text-sm">
                {diary.slice(-3).reverse().map((e, i) => (
                  <li key={i} className="py-3 text-muted-foreground"><span className="text-foreground">{e.date}</span> · {SCALES.map((sc) => `${sc.label.toLowerCase()} ${e[sc.key]}`).join(" · ")}{e.note && <> — {e.note}</>}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
