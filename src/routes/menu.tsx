import { createFileRoute } from "@tanstack/react-router";
import { BookButton, GhostButton, TG_BOOK, meta } from "@/components/site";
import { groups, rub } from "@/lib/prices";
import cert from "@/assets/certificate.jpg.asset.json";

export const Route = createFileRoute("/menu")({
  head: () => meta("Меню заботы — цены на ручной массаж · Север помнит", "Оздоровительный массаж, лимфодренаж, массаж лица, сезонные ритуалы с северными травами, абонементы и депозиты."),
  component: Menu,
});

function Menu() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-sm uppercase tracking-[0.25em] text-amber">Меню заботы</p>
      <h1 className="mt-3 text-5xl md:text-6xl">Выберите, чего просит тело</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">Не знаете, что выбрать? Напишите Александре пару слов о самочувствии — она подскажет.</p>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <section key={g.title} className="rounded-3xl border bg-card/70 p-7">
            <h2 className="text-3xl">{g.title}</h2>
            <p className="mb-5 text-sm text-muted-foreground">{g.intro}</p>
            <ul className="divide-y divide-border">
              {g.items.map((i) => (
                <li key={i.name} className="py-3">
                  <div className="font-medium">{i.name}</div>
                  {i.note && <div className="text-xs text-amber">{i.note}</div>}
                  <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    {i.options.map(([d, p]) => <span key={d}>{d} — <span className="text-foreground">{rub(p)}</span></span>)}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="rounded-3xl border border-primary/40 bg-card/70 p-7">
          <h2 className="text-3xl">Сезонные ритуалы с северными травами</h2>
          <p className="mt-3 text-muted-foreground">Распаривание трав, согревающие масла с хвоей и можжевельником, травяной чай после сеанса. Состав ритуала меняется вместе с сезоном — уточняйте актуальный у Александры.</p>
          <div className="mt-5"><GhostButton href={TG_BOOK}>Узнать о ритуале</GhostButton></div>
        </section>
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card/70 p-7">
          <h2 className="text-3xl">Абонементы на любой массаж</h2>
          <ul className="mt-4 space-y-3">
            <li className="flex justify-between gap-4"><span>5 сеансов · 1,5 месяца</span><span className="text-amber">−10%</span></li>
            <li className="flex justify-between gap-4"><span>10 сеансов · 3 месяца</span><span className="text-amber">−15%</span></li>
          </ul>
          <h3 className="mt-8 text-2xl">Депозиты · действуют 4 месяца</h3>
          <ul className="mt-3 space-y-3">
            <li className="flex justify-between gap-4"><span>10 000 – 20 000 ₽</span><span className="text-amber">−10%</span></li>
            <li className="flex justify-between gap-4"><span>21 000 – 30 000 ₽</span><span className="text-amber">−15%</span></li>
            <li className="flex justify-between gap-4"><span>от 31 000 ₽</span><span className="text-amber">−20%</span></li>
          </ul>
        </div>
        <div className="grid items-center gap-5 rounded-3xl border bg-card/70 p-7 sm:grid-cols-[0.8fr_1fr]">
          <img src={cert.url} alt="Подарочный сертификат «Север помнит»" className="rounded-2xl" />
          <div>
            <h2 className="text-3xl">Подарочный сертификат</h2>
            <p className="mt-3 text-muted-foreground">На сумму или на конкретный ритуал. Красиво оформленный, с сургучной печатью.</p>
            <div className="mt-5"><BookButton>Подарить сертификат</BookButton></div>
          </div>
        </div>
      </section>
    </div>
  );
}
