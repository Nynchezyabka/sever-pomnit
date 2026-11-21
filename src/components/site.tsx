import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
const logo = { url: "/images/logo.jpg" };

export const TG_BOOK = "https://t.me/Sashsa_S";
export const TG_CHANNEL = "https://t.me/massage_sever_pomnit";
export const PHONE = "+7 916 636-36-60";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-block overflow-hidden rounded-xl bg-paper ${className}`}>
      <img src={logo.url} alt="Логотип «Север помнит»" className="h-full w-full object-contain mix-blend-multiply" />
    </span>
  );
}

const nav = [
  { to: "/", label: "Главная" },
  { to: "/menu", label: "Меню заботы" },
  { to: "/master", label: "О мастере" },
  { to: "/sad", label: "Зимний сад" },
  { to: "/kabinet", label: "Кабинет" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-5 sm:py-3">
        <Link to="/" className="flex shrink-0 items-center gap-3" onClick={() => setOpen(false)}>
          <Logo className="h-9 w-7 shrink-0 sm:h-11 sm:w-8" />
          <span className="font-display text-xl tracking-wide">Север помнит</span>
        </Link>
        <nav className="hidden flex-wrap gap-1 text-sm md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "whitespace-nowrap rounded-full px-3 py-1.5 bg-secondary text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <button type="button" aria-label={open ? "Закрыть меню" : "Открыть меню"} aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 w-11 items-center justify-center rounded-full border bg-card text-foreground md:hidden">
          <span className="relative block h-3.5 w-5">
            <span className={`absolute left-0 h-0.5 w-5 rounded bg-current transition ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-current transition ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 h-0.5 w-5 rounded bg-current transition ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>
    </header>
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[61px] z-40 overflow-y-auto bg-background px-5 pb-10 pt-4 md:hidden">
          <nav className="flex flex-col">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }} onClick={() => setOpen(false)}
                className="border-b py-4 font-display text-2xl text-foreground"
                activeProps={{ className: "border-b py-4 font-display text-2xl text-primary" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 space-y-2 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            <a href={TG_BOOK} target="_blank" rel="noreferrer"
              className="mb-3 flex items-center justify-center rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">
              Записаться в Telegram
            </a>
            <a href="tel:+79166363660" className="block text-foreground">{PHONE}</a>
            <p className="whitespace-nowrap">ЖК «Полярная 25»</p>
            <p>Вт–Сб, 8:30–22:00</p>
          </div>
        </div>
      )}
    </>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 text-sm text-muted-foreground sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-foreground">Север помнит</p>
          <p>Пространство ручного массажа и заботы</p>
        </div>
        <div>
          <p>Вт–Сб, 8:30–22:00</p>
          <p className="whitespace-nowrap">ЖК «Полярная 25»</p>
        </div>
        <div className="flex flex-col gap-1">
          <a href={TG_BOOK} className="hover:text-foreground">Записаться: @Sashsa_S</a>
          <a href={TG_CHANNEL} className="hover:text-foreground">Канал в Telegram</a>
          <a href="tel:+79166363660" className="hover:text-foreground">{PHONE}</a>
        </div>
      </div>
    </footer>
  );
}

export function BookButton({ children = "Записаться на сеанс" }: { children?: React.ReactNode }) {
  return (
    <a href={TG_BOOK} target="_blank" rel="noreferrer"
      className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 font-medium text-primary-foreground glow transition hover:brightness-110">
      {children}
    </a>
  );
}

export function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="inline-flex items-center justify-center rounded-full border border-primary/50 px-7 py-3.5 font-medium text-foreground transition hover:bg-primary/10">
      {children}
    </a>
  );
}

export function meta(title: string, description: string) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

/** Reserved spot for a photo that will be sent later. */
export function PhotoSlot({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-[2rem] border border-dashed border-primary/40 bg-card/50 p-6 text-center text-sm text-muted-foreground ${className}`}>
      <span className="relative">Здесь будет фото<br /><span className="font-display text-lg italic text-amber">{label}</span></span>
    </div>
  );
}

export const BOOK_TEMPLATE = "Здравствуйте, Александра! Хочу записаться на массаж (например, спины). Мне удобно в такие дни/время: … Я у вас впервые.";

export function CopyButton({ text, children }: { text: string; children: React.ReactNode }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 2500); } catch {} }}
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/50 px-6 py-3 font-medium transition hover:bg-primary/10">
      {done ? "Скопировано ✓" : children}
    </button>
  );
}

/** Gentle Telegram button that appears on phones after scrolling a bit. */
export function FloatingTelegram() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <a href={TG_BOOK} target="_blank" rel="noreferrer" aria-label="Написать Александре в Telegram"
      className={`fixed bottom-4 right-4 z-30 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg glow transition-all duration-500 motion-reduce:transition-none md:hidden ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <span aria-hidden>✉</span> Написать Александре
    </a>
  );
}
