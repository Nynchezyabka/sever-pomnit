import { createFileRoute } from "@tanstack/react-router";
import { BookButton, GhostButton, TG_BOOK, meta } from "@/components/site";
import { groups, rub } from "@/lib/prices";
import { GiftBuilder } from "@/components/gift";
import { BookingForm } from "@/components/booking";

export const Route = createFileRoute("/menu")({
  head: () =>
    meta(
      "Массаж и цены — меню заботы · Север помнит",
      "Ручной массаж тела и лица, лимфодренаж, массаж для беременных и детей, абонементы и подарочные сертификаты. Цены и запись у Александры в Москве.",
      { path: "/menu", image: "/images/moodboard.jpg" },
    ),
  component: Menu,
});

function Menu() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-sm uppercase tracking-[0.25em] text-amber">Меню заботы</p>
      <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl">Что сейчас нужно вашему телу?</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">Если трудно выбрать, напишите мне, что вас беспокоит и сколько у вас времени. Я помогу подобрать формат.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Я у вас впервые", "Для знакомства подойдут «Спина Standard» или общий массаж на 50 минут.", "group-0"],
          ["Устали шея и спина", "Посмотрите «Шейно-воротниковую зону» или «Архитектуру спины».", "group-0"],
          ["Хочется отдохнуть и согреться", "Выберите сезонный ритуал с тёплым маслом и травяным чаем.", "ritual"],
        ].map(([t, d, to]) => (
          <a key={t} href={`#${to}`} className="group rounded-2xl border border-primary/30 bg-card/70 p-5 transition hover:border-primary/70 hover:bg-card">
            <p className="font-display text-xl text-amber">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p>
            <p className="mt-3 text-sm text-foreground underline-offset-4 group-hover:underline">Показать ↓</p>
          </a>
        ))}
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {groups.map((g, gi) => (
          <section key={g.title} id={`group-${gi}`} className="scroll-mt-24 target:ring-2 target:ring-primary/60 rounded-3xl border bg-card/70 p-5 sm:p-7">
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
        <section id="ritual" className="scroll-mt-24 target:ring-2 target:ring-primary/60 rounded-3xl border border-primary/40 bg-card/70 p-5 sm:p-7">
          <h2 className="text-3xl">Сезонные ритуалы</h2>
          <div className="mt-4 font-medium">Зимний согревающий ритуал</div>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground"><span>75 мин — <span className="text-foreground">{rub(4300)}</span></span><span>90 мин — <span className="text-foreground">{rub(5000)}</span></span></div>
          <p className="mt-3 text-muted-foreground">Зимой мы кутаемся в свитера, втягиваем голову в плечи — и шея с плечами каменеют. На ритуале я прогреваю спину, шею и стопы тёплым маслом, снимаю зажимы от холода и мягко разгоняю лимфу, чтобы ушли тяжесть и сонливость.</p>
          <p className="mt-3 text-sm text-muted-foreground">После — горячий травяной чай и цукат из молодой сосновой шишки из Приладожья. Варю их сама, на фруктозе.</p>
          <div className="mt-5"><GhostButton href={TG_BOOK}>Спросить о ритуале</GhostButton></div>
        </section>
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card/70 p-5 sm:p-7">
          <h2 className="text-3xl">Абонементы на любой массаж</h2>
          <ul className="mt-4 space-y-3">
            <li className="flex justify-between gap-4"><span>5 сеансов · действует 1,5 месяца</span><span className="text-amber">−10%</span></li>
            <li className="flex justify-between gap-4"><span>10 сеансов · действует 3 месяца</span><span className="text-amber">−15%</span></li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">Абонемент можно заморозить на срок до 2 недель или передать другому человеку — просто предупредите меня.</p>
          <h3 className="mt-8 text-2xl">Депозиты · действуют 4 месяца</h3>
          <p className="mt-2 text-sm text-muted-foreground">Пополните счёт и оплачивайте с него любые массажи из меню.</p>
          <ul className="mt-3 space-y-3">
            <li className="flex justify-between gap-4"><span>10 000–20 000 ₽</span><span className="text-amber">−10%</span></li>
            <li className="flex justify-between gap-4"><span>21 000–30 000 ₽</span><span className="text-amber">−15%</span></li>
            <li className="flex justify-between gap-4"><span>от 31 000 ₽</span><span className="text-amber">−20%</span></li>
          </ul>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-8">
        <GiftBuilder />
        <div id="zapis" className="mt-12 max-w-2xl"><BookingForm /></div>
      </section>
    </div>
  );
}
