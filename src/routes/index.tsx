import { createFileRoute, Link } from "@tanstack/react-router";
import { BOOK_TEMPLATE, BookButton, CopyButton, Logo, PhotoSlot, meta } from "@/components/site";
import { TeaRitual } from "@/components/ritual";
const tea = { url: "/images/tea-card.jpg" };
const ginger = { url: "/images/gingerbread.jpg" };
const sign = { url: "/images/amber_sign.jpg" };
const mood = { url: "/images/moodboard.jpg" };

export const Route = createFileRoute("/")({
  head: () => meta("Север помнит — ручной массаж у Александры", "Ручной массаж тела и лица, лимфодренаж и сезонные ритуалы с северными травами. Тёплый кабинет Александры в ЖК «Полярная 25», запись в Telegram."),
  component: Index,
});

const reasons = [
  { t: "Только руки, без аппаратов", d: "Александра чувствует, где мышцы напряжены, а где тело уже готово отпустить напряжение. Поэтому нажим и темп меняются по ходу сеанса." },
  { t: "Темп подстраивается под вас", d: "Если вам тревожно или трудно расслабиться, начинаем медленно. Не нужно терпеть и ждать, когда всё закончится." },
  { t: "Силу нажима выбираете вы", d: "В любой момент можно попросить сделать мягче, сильнее или остановиться. Массаж не должен быть испытанием на выносливость." },
  { t: "Можно просто помолчать", d: "Не обязательно поддерживать разговор или рассказывать о себе. Если хочется тишины — так и будет." },
];

function Index() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 md:grid-cols-[1.1fr_0.9fr] md:pt-24">
        <div>
          <p className="mb-5 text-sm uppercase tracking-[0.25em] text-amber">Пространство ручного массажа и заботы</p>
          <h1 className="text-4xl leading-[1.08] sm:text-5xl md:text-7xl">Здесь можно <em className="text-amber">не спешить</em></h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Приходите отдохнуть от городской суеты: тёплый кабинет, северные травы, приглушённый свет и бережный ручной массаж.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <BookButton />
            <Link to="/menu" hash="gift" className="inline-flex min-h-11 items-center px-3 text-muted-foreground underline underline-offset-4 hover:text-foreground">Подарить сертификат</Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">Вт–Сб, 8:30–22:00 · <span className="whitespace-nowrap">ЖК «Полярная 25»</span></p>
        </div>
        <div className="relative isolate">
          <img src={tea.url} alt="Травяной чай, шишки, свеча и открытка «Здесь можно не спешить»" className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-2xl" />
          <div className="absolute -bottom-6 -left-6 hidden h-28 w-20 rotate-[-6deg] p-1 shadow-xl md:block"><Logo className="h-full w-full" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.25em] text-amber">Как проходит сеанс</p>
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl">Вас слушают. И слышат</h2>
          <p className="mt-4 text-lg text-muted-foreground">Здесь нет единой схемы для всех. Перед массажем Александра спросит о самочувствии и пожеланиях, а во время сеанса будет ориентироваться на ваши ощущения.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {reasons.map((r) => (
            <div key={r.t} className="rounded-3xl border bg-card/70 p-5 sm:p-7">
              <h3 className="text-2xl">{r.t}</h3>
              <p className="mt-2 text-muted-foreground">{r.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
        <p className="text-sm uppercase tracking-[0.25em] text-amber">С чем приходят</p>
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl">Если узнали себя — приходите</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Затекли шея и спина", "После долгой работы за компьютером трудно разогнуться и опустить плечи."],
            ["Не получается расслабиться", "Мысли продолжают крутиться, а телу хочется покоя и тишины."],
            ["Тяжёлые ноги и отёки", "К концу дня тело кажется ватным, а ноги гудят."],
            ["Хочется согреться", "Просто нужен час в тепле, заботе и без срочных дел."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-3xl border bg-card/70 p-6"><h3 className="text-2xl">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
        <p className="text-sm uppercase tracking-[0.25em] text-amber">Запись</p>
        <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl">Как записаться</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["1. Скопируйте сообщение", "Не нужно придумывать текст: начало письма уже готово."],
            ["2. Напишите в Telegram", "Расскажите, какой массаж хотите и когда вам удобно. Александра ответит между сеансами."],
            ["3. Приходите без подготовки", "Полотенца, простыни и чай уже будут в кабинете. Лучше прийти за 5–10 минут."],
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

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-10 md:py-16 md:grid-cols-2">
        <Link to="/menu" className="group relative overflow-hidden rounded-[2rem]">
          <img src={mood.url} alt="Хвоя, мох и травяной чай" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 to-transparent p-5 sm:p-7">
            <h3 className="text-3xl">Меню заботы</h3><p className="text-muted-foreground">Массаж тела и лица, лимфодренаж, ритуалы и абонементы →</p>
          </div>
        </Link>
        <Link to="/sad" className="group relative overflow-hidden rounded-[2rem]">
          <img src={ginger.url} alt="Пряник с логотипом и травяной чай" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 to-transparent p-5 sm:p-7">
            <h3 className="text-3xl">Зимний сад</h3><p className="text-muted-foreground">Дневник самочувствия, полезные привычки и подарки за визиты →</p>
          </div>
        </Link>
      </section>
    </>
  );
}
