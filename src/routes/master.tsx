import { createFileRoute } from "@tanstack/react-router";
import { BookButton, GhostButton, PHONE, PhotoSlot, TG_CHANNEL, meta } from "@/components/site";

export const Route = createFileRoute("/master")({
  head: () =>
    meta(
      "Александра Суворова — мастер ручного массажа · Север помнит",
      "О мастере, первый визит, противопоказания и правила записи. Приём по вторникам–субботам с 8:30 до 22:00 в Москве, ЖК «Полярная 25».",
      { path: "/master", image: "/images/amber_sign.jpg" },
    ),
  component: Master,
});

const firstVisit = [
  ["С собой ничего не нужно", "Простыни, полотенца и одноразовое бельё уже будут готовы. Лучше прийти за 5–10 минут, чтобы не торопиться."],
  ["Можно молчать", "Разговаривать во время массажа не обязательно. Если хочется тишины, просто скажите — я пойму."],
  ["Говорите о своих ощущениях", "Попросить сделать мягче, сильнее или остановиться можно в любой момент. Это нормальная часть сеанса."],
  ["После массажа будет чай", "Не нужно сразу собираться и уходить. Я налью горячего чая — посидите, согрейтесь и спокойно придите в себя."],
];
const contra = ["Температура или острое инфекционное заболевание", "Острое воспаление или недавняя травма", "Первый триместр беременности", "Кожные высыпания или повреждения в зоне массажа"];

function Master() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <PhotoSlot label="портрет Александры" className="aspect-[3/4]" />
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-amber">Обо мне</p>
          <h1 className="mt-3 text-4xl sm:text-5xl md:text-6xl">Я — Александра Суворова</h1>
          <p className="mt-6 text-lg text-muted-foreground">Я мастер ручного массажа и оздоровления. Работаю без аппаратов: технику, темп и силу нажима подбираю под ваше состояние и пожелания.</p>
          <p className="mt-4 text-lg text-muted-foreground">В моём кабинете вас ждут тёплые масла, северные травы, приглушённый свет и тишина. Здесь можно не торопиться и спокойно сказать, что вам нужно.</p>
          <dl className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card/70 p-5"><dt className="text-sm text-muted-foreground">Приём</dt><dd className="mt-1 text-xl">Вт–Сб, 8:30–22:00</dd></div>
            <div className="rounded-2xl border bg-card/70 p-5"><dt className="text-sm text-muted-foreground">Телефон</dt><dd className="mt-1 text-xl"><a href="tel:+79166363660">{PHONE}</a></dd></div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3"><BookButton /><GhostButton href={TG_CHANNEL}>Канал в Telegram</GhostButton></div>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl">Если вы у меня впервые</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">Перед сеансом я коротко расспрошу о самочувствии и пожеланиях. Вот ещё несколько вещей, которые помогут чувствовать себя спокойнее.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {firstVisit.map(([t, d]) => <div key={t} className="rounded-3xl border bg-card/70 p-6"><h3 className="text-2xl">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></div>)}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-primary/40 bg-card/70 p-6 sm:p-9">
        <p className="text-sm uppercase tracking-[0.25em] text-amber">Боитесь первого визита?</p>
        <blockquote className="mt-4 font-display text-2xl italic sm:text-3xl">«Тут складка, тут вены, тут всё неидеально — лучше вообще не пойду, стесняюсь».</blockquote>
        <div className="mt-6 grid gap-4 text-muted-foreground md:grid-cols-2">
          <p>Я слышу это очень часто, и это абсолютно понятная реакция. Тревога обычно появляется не из-за «неидеальности», а из-за неизвестности: нужно довериться незнакомому человеку.</p>
          <p>Скажу прямо: я не оцениваю тело. Мои руки ищут зажимы, спазмы и уставшие мышцы — именно с ними я работаю. Ваша задача — просто лечь и выдохнуть. А я сделаю так, чтобы первый визит прошёл спокойно.</p>
        </div>
      </section>

      <section className="mt-16 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card/70 p-5 sm:p-7">
          <h2 className="text-3xl">Когда массаж лучше отложить</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">{contra.map((c) => <li key={c}>{c}</li>)}</ul>
          <p className="mt-4 text-muted-foreground">Если у вас хроническое заболевание, скачки давления или есть сомнения, сначала обсудите массаж с врачом. И обязательно расскажите мне об этом до сеанса.</p>
          <p className="mt-4 text-amber">Не уверены, можно ли вам массаж? Напишите — разберёмся вместе.</p>
        </div>
        <div className="rounded-3xl border bg-card/70 p-5 sm:p-7">
          <h2 className="text-3xl">Перенос и опоздание</h2>
          <p className="mt-4 text-muted-foreground">Если планы изменились, предупредите меня не позднее чем за 24 часа — подберём другое время.</p>
          <p className="mt-3 text-muted-foreground">При опоздании сеанс заканчивается в назначенное время, чтобы не задерживать следующего гостя.</p>
          <p className="mt-3 text-muted-foreground">Абонемент можно заморозить на срок до 2 недель. Если вы заболели, до 2 сеансов курса можно перенести по справке.</p>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border bg-card/70 p-5 sm:p-7">
          <h2 className="text-3xl">Как найти кабинет</h2>
          <p className="mt-3 text-lg"><span className="whitespace-nowrap">ЖК «Полярная 25»</span>, Москва</p>
          <p className="mt-3 text-muted-foreground">Кабинет может переезжать между корпусами жилого комплекса. Поэтому точный корпус, подъезд, этаж и код домофона я напишу, когда подтвержу запись.</p>
        </div>
        <PhotoSlot label="вход и ориентир" className="aspect-[4/3]" />
      </section>
    </div>
  );
}
