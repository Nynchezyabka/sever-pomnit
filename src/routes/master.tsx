import { createFileRoute } from "@tanstack/react-router";
import { BookButton, GhostButton, Logo, PHONE, TG_CHANNEL, meta } from "@/components/site";

export const Route = createFileRoute("/master")({
  head: () => meta("Александра Суворова — мастер ручного массажа · Север помнит", "Мастер ручного массажа и оздоровления. Вт–Сб 8:30–22:00, ЖК «Полярная 25». Запись в Telegram."),
  component: Master,
});

function Master() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 md:grid-cols-[0.7fr_1.3fr]">
      <div className="mx-auto w-56 md:w-full"><Logo className="aspect-[2/3] w-full p-4" /></div>
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-amber">О мастере</p>
        <h1 className="mt-3 text-5xl md:text-6xl">Александра</h1>
        <p className="mt-6 text-lg text-muted-foreground">Мастер ручного массажа и оздоровления. Работаю только руками — без аппаратов и конвейера. Слушаю ткани, дыхание и ваши «стоп» и «мягче». Сеанс можно провести в тишине.</p>
        <p className="mt-4 text-lg text-muted-foreground">В кабинете — северные травы, тёплые масла, приглушённый свет и настоящий рог лося, который помнит лес.</p>
        <dl className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card/70 p-5"><dt className="text-sm text-muted-foreground">График</dt><dd className="mt-1 text-xl">Вт–Сб, 8:30–22:00</dd></div>
          <div className="rounded-2xl border bg-card/70 p-5"><dt className="text-sm text-muted-foreground">Где</dt><dd className="mt-1 text-xl">ЖК «Полярная 25», ул. Полярная</dd></div>
          <div className="rounded-2xl border bg-card/70 p-5"><dt className="text-sm text-muted-foreground">Телефон</dt><dd className="mt-1 text-xl"><a href="tel:+79166363660">{PHONE}</a></dd></div>
          <div className="rounded-2xl border bg-card/70 p-5"><dt className="text-sm text-muted-foreground">Канал</dt><dd className="mt-1 text-xl"><a href={TG_CHANNEL}>t.me/massage_sever_pomnit</a></dd></div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3"><BookButton /><GhostButton href={TG_CHANNEL}>Читать канал</GhostButton></div>
      </div>
    </div>
  );
}
