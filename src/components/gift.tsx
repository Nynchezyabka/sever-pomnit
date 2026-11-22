import { useState } from "react";
import { COURSE_SESSIONS, DEPOSIT_PRESETS, WISHES, giftMessage, giftTitle, type GiftInput } from "@/lib/gift";
import { BookButton, CopyButton, PHONE } from "@/components/site";

const chip = (on: boolean) =>
  `min-h-11 rounded-full border px-4 py-2 text-sm transition ${on ? "border-primary bg-primary/15 text-foreground" : "border-foreground/35 text-muted-foreground hover:text-foreground"}`;

const rules = [
  "Приходите за 5–10 минут, чтобы спокойно переодеться и настроиться на отдых.",
  "Если планы изменились, предупредите о переносе или отмене не позднее чем за 24 часа.",
  "Сертификат можно передать другому человеку — просто предупредите меня.",
  "По справке о болезни можно перенести до 2 сеансов курса. Курс также можно заморозить на срок до 2 недель.",
  "При опоздании сеанс всё равно закончится в назначенное время.",
  "Лучше не есть плотно в течение часа перед массажем.",
  "До сеанса расскажите мне о давлении, травмах, хронических заболеваниях и беременности.",
];

export function GiftBuilder() {
  const [g, setG] = useState<GiftInput>({ kind: "deposit", amount: 5000, sessions: 5, area: "тела", minutes: 50, recipient: "", wish: WISHES[0]! });
  const set = (p: Partial<GiftInput>) => setG((s) => ({ ...s, ...p }));
  const msg = giftMessage(g);

  return (
    <div id="gift" className="scroll-mt-24 rounded-3xl border bg-card/70 p-6 md:p-9">
      <p className="text-sm uppercase tracking-[0.25em] text-amber">Подарочный сертификат</p>
      <h2 className="mt-2 text-3xl md:text-4xl">Соберите свой вариант</h2>
      <p className="mt-3 max-w-xl text-muted-foreground">Выберите сумму или курс массажа, добавьте имя и пожелание. Затем отправьте готовую заявку мне.</p>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.95fr]">
        <div className="space-y-7">
          <fieldset>
            <legend className="mb-3 font-medium">Что подарить</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={chip(g.kind === "deposit")} onClick={() => set({ kind: "deposit" })}>Депозит на сумму</button>
              <button type="button" className={chip(g.kind === "course")} onClick={() => set({ kind: "course" })}>Курс сеансов</button>
            </div>
          </fieldset>

          {g.kind === "deposit" ? (
            <fieldset>
              <legend className="mb-3 font-medium">Сумма</legend>
              <div className="flex flex-wrap items-center gap-2">
                {DEPOSIT_PRESETS.map((a) => (
                  <button key={a} type="button" className={chip(g.amount === a)} onClick={() => set({ amount: a })}>{a.toLocaleString("ru-RU")} ₽</button>
                ))}
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  своя:
                  <input type="number" min={1000} step={500} value={g.amount} onChange={(e) => set({ amount: Math.max(0, Number(e.target.value) || 0) })}
                    className="min-h-11 w-28 rounded-full border bg-background/60 px-4 text-foreground" />
                </label>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Можно потратить на любой массаж из меню.</p>
            </fieldset>
          ) : (
            <>
              <fieldset>
                <legend className="mb-3 font-medium">Массаж</legend>
                <div className="flex flex-wrap gap-2">
                  {(["тела", "лица"] as const).map((a) => (
                    <button key={a} type="button" className={chip(g.area === a)} onClick={() => set({ area: a })}>{a === "тела" ? "Тело" : "Лицо"}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-3 font-medium">Сколько сеансов и по сколько минут</legend>
                <div className="flex flex-wrap gap-2">
                  {COURSE_SESSIONS.map((n) => (
                    <button key={n} type="button" className={chip(g.sessions === n)} onClick={() => set({ sessions: n })}>{n} сеансов</button>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[30, 50, 75].map((m) => (
                    <button key={m} type="button" className={chip(g.minutes === m)} onClick={() => set({ minutes: m })}>{m} минут</button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <label className="block">
            <span className="mb-2 block font-medium">Для кого <span className="font-normal text-muted-foreground">(необязательно)</span></span>
            <input value={g.recipient} maxLength={40} onChange={(e) => set({ recipient: e.target.value })} placeholder="Например, для Марины"
              className="min-h-11 w-full rounded-2xl border bg-background/60 px-4" />
          </label>

          <fieldset>
            <legend className="mb-3 font-medium">Тёплые слова</legend>
            <div className="flex flex-wrap gap-2">
              {WISHES.map((w) => (
                <button key={w} type="button" className={chip(g.wish === w)} onClick={() => set({ wish: w })}>{w}</button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/40 bg-gradient-to-br from-secondary via-card to-background p-8 text-center glow" aria-live="polite">
            <p className="text-xs uppercase tracking-[0.3em] text-amber">Север помнит</p>
            <p className="mt-1 text-xs text-muted-foreground">пространство ручного массажа и заботы</p>
            <p className="mt-8 font-display text-3xl italic text-amber">{g.wish || "Сертификат"}</p>
            {g.recipient.trim() && <p className="mt-3 text-lg">{g.recipient.trim()}</p>}
            <p className="mx-auto mt-6 max-w-xs text-foreground/90">{giftTitle(g)}</p>
            <div className="mx-auto mt-8 h-px w-24 bg-primary/40" />
            <p className="mt-4 text-xs text-muted-foreground">Александра Суворова · <span className="whitespace-nowrap">ЖК «Полярная 25»</span><br />по предварительной записи · {PHONE}</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Так будет выглядеть ваш выбор. Готовый сертификат я оформлю и передам после оплаты.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <CopyButton text={msg}>Скопировать заявку</CopyButton>
            <BookButton>Открыть Telegram</BookButton>
          </div>
        </div>
      </div>

      <details className="mt-10 rounded-2xl border bg-background/40 p-5">
        <summary className="cursor-pointer font-medium">Памятка для того, кто получит подарок</summary>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          {rules.map((r) => <li key={r}>· {r}</li>)}
        </ul>
      </details>
    </div>
  );
}
