import { createFileRoute } from "@tanstack/react-router";
import { PHONE, meta } from "@/components/site";

export const Route = createFileRoute("/privacy")({
  head: () =>
    meta(
      "Обработка персональных данных · Север помнит",
      "Какие данные собирает сайт «Север помнит», зачем они нужны и как их удалить.",
      { path: "/privacy" },
    ),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-sm uppercase tracking-[0.25em] text-amber">Ваши данные</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Обработка персональных данных</h1>
      <div className="mt-8 space-y-5 text-muted-foreground">
        <p>Оператор данных — мастер массажа Александра Суворова, ЖК «Полярная 25», телефон {PHONE}.</p>
        <h2 className="text-2xl text-foreground">Что я собираю</h2>
        <p>Имя, телефон, ник в Telegram, почту, выбранные услуги и удобное время. Если вы сами заполните анкету в кабинете — пожелания к сеансу и сведения о самочувствии.</p>
        <h2 className="text-2xl text-foreground">Зачем</h2>
        <p>Только чтобы связаться с вами, записать на сеанс, вести учёт визитов и абонементов и учесть ваши пожелания. Я не делаю рассылок и не передаю данные третьим лицам.</p>
        <h2 className="text-2xl text-foreground">Где хранятся</h2>
        <p>В защищённой базе данных. Доступ к ним есть только у вас (к своим данным) и у меня.</p>
        <h2 className="text-2xl text-foreground">Как отозвать согласие</h2>
        <p>Напишите или позвоните мне — я удалю ваши данные. Согласие действует, пока вы его не отзовёте.</p>
      </div>
    </div>
  );
}
