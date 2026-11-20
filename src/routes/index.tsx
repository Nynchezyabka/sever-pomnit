import { createFileRoute, Link } from "@tanstack/react-router";
import { BOOK_TEMPLATE, BookButton, CopyButton, Logo, PhotoSlot, TG_BOOK, meta } from "@/components/site";
import { TeaRitual } from "@/components/ritual";
import tea from "@/assets/tea-card.jpg.asset.json";
import ginger from "@/assets/gingerbread.jpg.asset.json";
import sign from "@/assets/amber_sign.jpg.asset.json";
import mood from "@/assets/moodboard.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => meta("Север помнит — пространство ручного массажа и заботы", "Только чуткие живые руки. Ручной массаж, лимфодренаж и сезонные ритуалы с северными травами у Александры, ЖК «Полярная 25»."),
  component: Index,
});

const reasons = [
  { t: "Руки слышат фасции", d: "Аппарат работает по программе. Руки замечают, где ткань напряжена, где отпускает, и меняют давление прямо на ходу." },
  { t: "Руки слышат дыхание", d: "Если дыхание сбилось — темп замедляется. Тело ведёт сеанс, а не таймер." },
  { t: "Руки уважают порог боли", d: "Больно — не значит полезно. Вы всегда можете сказать «мягче», и это нормально." },
  { t: "Право на тишину", d: "Можно не разговаривать. Можно не объяснять. Можно просто лежать и греться." },
];

function Index() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 md:grid-cols-[1.1fr_0.9fr] md:pt-24">
        <div>
          <p className="mb-5 text-sm uppercase tracking-[0.25em] text-amber">Пространство ручного массажа и заботы</p>
          <h1 className="text-5xl leading-[1.05] md:text-7xl">Здесь можно <em className="text-amber">не спешить</em></h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Тёплое убежище от холода и шума города. Северные травы, согревающие масла, приглушённый свет — и только чуткие живые руки.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <BookButton />
            <Link to="/menu" hash="gift" className="inline-flex min-h-11 items-center px-3 text-muted-foreground underline underline-offset-4 hover:text-foreground">Подарить заботу</Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">Вт–Сб, 8:30–22:00 · ЖК «Полярная 25»</p>
        </div>
        <div className="relative isolate">
          <img src={tea.url} alt="Чай с хвоей, шишки, свеча и открытка «Здесь можно не спешить»" className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl" />
          <div className="absolute -bottom-6 -left-6 hidden h-28 w-20 rotate-[-6deg] p-1 shadow-xl md:block"><Logo className="h-full w-full" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber">Манифест</p>
          <h2 className="mt-3 text-4xl md:text-5xl">Почему только руки?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Никаких аппаратов, конвейера и «надо было раньше прийти». Ваше тело — не проблема, которую чинят. С ним разговаривают.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {reasons.map((r) => (
            <div key={r.t} className="rounded-3xl border bg-card/70 p-7">
              <h3 className="text-2xl">{r.t}</h3>
              <p className="mt-2 text-muted-foreground">{r.d}</p>
            </div>
          ))}
        </div>
      </section>


      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-sm uppercase tracking-[0.25em] text-amber">С чем приходят</p>
        <h2 className="mt-3 text-4xl md:text-5xl">Если узнаёте себя — вам сюда</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Плечи у ушей", "Шея и спина затекли от экрана и телефона."],
            ["Фоновая тревога", "Голова не выключается, хочется просто полежать в тишине."],
            ["Тяжесть и отёки", "Ноги гудят, тело как будто чужое и тяжёлое."],
            ["Замёрзли", "Хочется согреться — снаружи и немного внутри."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-3xl border bg-card/70 p-6"><h3 className="text-2xl">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-sm uppercase tracking-[0.25em] text-amber">Запись</p>
        <h2 className="mt-3 text-4xl md:text-5xl">Записаться в три шага</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["1. Скопируйте сообщение", "Не нужно придумывать, что писать незнакомому человеку — шаблон уже готов."],
            ["2. Отправьте в Telegram", "Александра отвечает между сеансами, обычно в течение дня."],
            ["3. Приходите налегке", "Простыни, полотенца и чай уже ждут. Можно просто прийти."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-3xl border bg-card/70 p-6"><h3 className="text-2xl">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3"><CopyButton text={BOOK_TEMPLATE}>Скопировать сообщение</CopyButton><BookButton>Открыть Telegram</BookButton></div>
      </section>

      <TeaRitual />

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 md:grid-cols-2">
        <figure className="overflow-hidden rounded-[2rem]"><img src={sign.url} alt="Янтарная светящаяся вывеска «Север помнит» на стене кабинета" loading="lazy" className="aspect-[4/3] w-full object-cover" /></figure>
        <PhotoSlot label="настоящий рог лося" className="aspect-[4/3]" />
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-2">
        <Link to="/menu" className="group relative overflow-hidden rounded-[2rem]">
          <img src={mood.url} alt="Хвоя, мох и травяной чай" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 to-transparent p-7">
            <h3 className="text-3xl">Меню заботы</h3><p className="text-muted-foreground">Массаж тела и лица, лимфодренаж, ритуалы, абонементы →</p>
          </div>
        </Link>
        <Link to="/sad" className="group relative overflow-hidden rounded-[2rem]">
          <img src={ginger.url} alt="Пряник с логотипом и травяной чай" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 to-transparent p-7">
            <h3 className="text-3xl">Зимний сад заботы</h3><p className="text-muted-foreground">Дневник самочувствия и дерево, которое растёт вместе с вами →</p>
          </div>
        </Link>
      </section>
    </>
  );
}
