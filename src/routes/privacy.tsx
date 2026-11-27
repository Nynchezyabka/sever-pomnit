import { createFileRoute } from "@tanstack/react-router";
import { PHONE, PHONE_HREF, TG_BOOK, meta } from "@/components/site";

export const Route = createFileRoute("/privacy")({
  head: () =>
    meta(
      "Политика конфиденциальности · Север помнит",
      "Какие данные собирает сайт «Север помнит», где они хранятся, как передаются для записи и как их удалить.",
      { path: "/privacy" },
    ),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-sm uppercase tracking-[0.25em] text-amber">Ваши данные</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Политика конфиденциальности</h1>
      <p className="mt-3 text-sm text-muted-foreground">Редакция от 27 ноября 2026 года</p>
      <div className="mt-8 space-y-5 text-muted-foreground">
        <p>
          Оператор персональных данных — мастер ручного массажа Александра Суворова, адрес кабинета: Москва, ЖК «Полярная 25», телефон{" "}
          <a href={PHONE_HREF} className="text-foreground underline underline-offset-4">
            {PHONE}
          </a>
          , Telegram{" "}
          <a href={TG_BOOK} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
            @Sashsa_S
          </a>
          .
        </p>

        <h2 className="text-2xl text-foreground">Какие данные собираются</h2>
        <p>
          Имя, телефон, ник в Telegram, адрес электронной почты, выбранные услуги и удобное время визита. Если вы заполните раздел «Пожелания к сеансу» в личном кабинете — предпочтения по маслу, чаю, силе нажима, тишине и комфортным зонам внимания.
        </p>
        <p>
          Записи в разделе «Зимний сад» (отметки заботы и дневник) сохраняются только в памяти вашего устройства (в браузере) и в базу данных сайта не передаются.
        </p>

        <h2 className="text-2xl text-foreground">Зачем это нужно</h2>
        <p>
          Только чтобы связаться с вами, записать на сеанс, вести учёт визитов, абонементов и подарков, а также учесть ваши пожелания к услуге. Мы не делаем рекламных рассылок и не передаём контакты для рекламы.
        </p>

        <h2 className="text-2xl text-foreground">Где хранятся и как обрабатываются</h2>
        <p>
          Статические страницы сайта размещены в облачном хранилище Yandex Cloud (серверы в Российской Федерации). Персональные данные клиентов хранятся в базе данных на серверах в Российской Федерации; доступ к ним есть только у вас (к своим данным в личном кабинете) и у мастера.
        </p>
        <p>
          Для оперативной обработки заявок имя, контакт и параметры записи могут передаваться в мессенджер Telegram (в рабочий чат-бот мастера).
        </p>

        <h2 className="text-2xl text-foreground">Как изменить или удалить данные</h2>
        <p>
          Согласие на обработку данных действует до его отзыва. Чтобы изменить, выгрузить или полностью удалить свои данные, напишите в Telegram{" "}
          <a href={TG_BOOK} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
            @Sashsa_S
          </a>{" "}
          или позвоните по телефону{" "}
          <a href={PHONE_HREF} className="text-foreground underline underline-offset-4">
            {PHONE}
          </a>
          . Данные будут удалены по вашему запросу.
        </p>
      </div>
    </div>
  );
}
