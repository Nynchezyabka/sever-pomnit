import { createFileRoute } from "@tanstack/react-router";
import { BookButton, GhostButton, PHONE, PhotoSlot, TG_CHANNEL, meta } from "@/components/site";

export const Route = createFileRoute("/master")({
  head: () => meta("Александра Суворова — мастер ручного массажа · Север помнит", "Мастер ручного массажа и оздоровления. Первый визит без тревоги, противопоказания, как добраться. Вт–Сб 8:30–22:00, ЖК «Полярная 25»."),
  component: Master,
});

const firstVisit = [
  ["Ничего не нужно брать", "Простыни, полотенца и одноразовое бельё уже ждут вас."],
  ["Можно молчать", "Разговаривать не обязательно. Тишина — тоже нормальный сеанс."],
  ["Говорите «мягче» в любой момент", "Больно — не значит полезно. Темп и силу выбираете вы."],
  ["После — чай", "Никто не торопит одеваться и убегать. Можно посидеть и согреться."],
];
const contra = ["Температура или простуда в разгаре", "Острые воспаления и свежие травмы", "Первый триместр беременности", "Кожные высыпания в зоне массажа"];

function Master() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <PhotoSlot label="портрет Александры" className="aspect-[3/4]" />
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-amber">О мастере</p>
          <h1 className="mt-3 text-5xl md:text-6xl">Александра</h1>
          <p className="mt-6 text-lg text-muted-foreground">Мастер ручного массажа и оздоровления. Работаю только руками — без аппаратов и конвейера. Слушаю ткани, дыхание и ваши «стоп» и «мягче».</p>
          <p className="mt-4 text-lg text-muted-foreground">В кабинете — северные травы, тёплые масла, приглушённый свет и настоящий рог лося, который помнит лес.</p>
          <dl className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card/70 p-5"><dt className="text-sm text-muted-foreground">График</dt><dd className="mt-1 text-xl">Вт–Сб, 8:30–22:00</dd></div>
            <div className="rounded-2xl border bg-card/70 p-5"><dt className="text-sm text-muted-foreground">Телефон</dt><dd className="mt-1 text-xl"><a href="tel:+79166363660">{PHONE}</a></dd></div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3"><BookButton /><GhostButton href={TG_CHANNEL}>Читать канал</GhostButton></div>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="text-4xl md:text-5xl">Первый визит без тревоги</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {firstVisit.map(([t, d]) => <div key={t} className="rounded-3xl border bg-card/70 p-6"><h3 className="text-2xl">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></div>)}
        </div>
      </section>

      <section className="mt-16 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card/70 p-7">
          <h2 className="text-3xl">Когда лучше перенести</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">{contra.map((c) => <li key={c}>{c}</li>)}</ul>
          <p className="mt-4 text-amber">Если сомневаетесь — напишите, обсудим.</p>
        </div>
        <div className="rounded-3xl border bg-card/70 p-7">
          <h2 className="text-3xl">Перенос и отмена</h2>
          <p className="mt-4 text-muted-foreground">Жизнь случается. Если планы поменялись — просто напишите заранее, подберём другое время.</p>
          <p className="mt-3 rounded-xl border border-dashed border-primary/40 p-3 text-sm text-muted-foreground">Точные условия переноса и предоплаты скоро появятся здесь.</p>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border bg-card/70 p-7">
          <h2 className="text-3xl">Как нас найти</h2>
          <p className="mt-3 text-lg">ЖК «Полярная 25», ул. Полярная</p>
          <p className="mt-3 rounded-xl border border-dashed border-primary/40 p-3 text-sm text-muted-foreground">Корпус, подъезд, этаж, домофон и как пройти от метро — скоро здесь. А пока Александра подскажет дорогу в Telegram.</p>
        </div>
        <PhotoSlot label="вход и ориентир" className="aspect-[4/3]" />
      </section>
    </div>
  );
}
