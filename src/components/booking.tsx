import { useState } from "react";
import { db } from "@/lib/cabinet";
import { btn, card, field, lbl } from "@/components/cabinet-ui";
import { BookButton } from "@/components/site";

/** Booking request form; without a database it falls back to the Telegram button. */
export function BookingForm() {
  const [f, setF] = useState({ name: "", contact: "", service: "", wish_time: "", comment: "" });
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const c = typeof window !== "undefined" ? db() : null;
  if (!c) return <div className={card}><p className="text-muted-foreground">Записаться можно у меня в Telegram.</p><div className="mt-4"><BookButton /></div></div>;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function send(e: React.FormEvent) {
    e.preventDefault(); setState("busy");
    const { error } = await c!.from("booking_requests").insert(f);
    setState(error ? "err" : "ok");
  }
  if (state === "ok") return <div className={card}><p className="font-display text-xl">Заявка отправлена</p><p className="mt-2 text-muted-foreground">Спасибо! Я напишу вам, чтобы уточнить детали и согласовать время.</p></div>;
  return (
    <form onSubmit={send} className={`${card} space-y-3`}>
      <h2 className="font-display text-2xl">Оставить заявку на массаж</h2>
      <p className="text-sm text-muted-foreground">Заполните форму — я получу сообщение и свяжусь с вами. Это ещё не подтверждение записи.</p>
      <label className={lbl}><span>Как к вам обращаться</span><input className={field} autoComplete="name" maxLength={100} required value={f.name} onChange={set("name")} /></label>
      <label className={lbl}><span>Телефон или ник в Telegram</span><input className={field} minLength={3} maxLength={100} required value={f.contact} onChange={set("contact")} /></label>
      <label className={lbl}><span>Какой массаж (если уже выбрали)</span><input className={field} maxLength={200} value={f.service} onChange={set("service")} /></label>
      <label className={lbl}><span>Когда удобно: дни, время</span><input className={field} maxLength={200} value={f.wish_time} onChange={set("wish_time")} /></label>
      <label className={lbl}><span>Что-то ещё</span><textarea className={field} rows={3} maxLength={1000} value={f.comment} onChange={set("comment")} /></label>
      <button className={btn} disabled={state === "busy"}>Отправить</button>
      {state === "err" && <p role="alert" className="text-sm text-amber">Не получилось отправить. Напишите мне, пожалуйста, в Telegram.</p>}
    </form>
  );
}
