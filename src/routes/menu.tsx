import { createFileRoute } from "@tanstack/react-router";
import { BookButton, GhostButton, TG_BOOK, meta } from "@/components/site";
import { groups, rub } from "@/lib/prices";
import { GiftBuilder } from "@/components/gift";
import { BookingForm } from "@/components/booking";

export const Route = createFileRoute("/menu")({
  head: () => meta("Массаж и цены — меню заботы · Север помнит", "Ручной массаж тела и лица, лимфодренаж, массаж для беременных и детей, абонементы и подарочные сертификаты. Цены и запись у Александры."),
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
          ["Я у вас впервые", "Для знакомства подойдут «Спина Standard» или общий массаж на 50 минут."],
          ["Устали шея и спина", "Посмотрите «Шейно-воротниковую зону» или «Архитектуру спины»."],
          ["Хочется отдохнуть и согреться", "Выберите сезонный ритуал с тёплым маслом и травяным чаем."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-primary/30 bg-card/70 p-5"><p className="font-display text-xl text-amber">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
        ))}
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <section key={g.title} className="rounded-3xl border bg-card/70 p-5 sm:p-7">
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
        <section className="rounded-3xl border border-primary/40 bg-card/70 p-5 sm:p-7">
          <h2 className="text-3xl">Сезонные ритуалы</h2>
          <p className="mt-3 text-muted-foreground">Тёплое масло с ароматом северных трав, неторопливый массаж и чай после сеанса. Состав и детали меняются в зависимости от времени года.</p>
          <p className="mt-3 rounded-xl border border-dashed border-primary/40 p-3 text-sm text-muted-foreground">Скоро расскажу о зимнем ритуале: как он проходит, сколько длится и сколько стоит.</p>
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
