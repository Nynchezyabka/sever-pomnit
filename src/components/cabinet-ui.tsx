import { useEffect, useState, type ReactNode } from "react";
import { api, getStoredSession, hasBackendUrl, onSessionChange, type Session } from "@/lib/cabinet";
import { Link } from "@tanstack/react-router";

export const field = "w-full rounded-2xl border border-foreground/35 bg-card/60 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
export const lbl = "block space-y-1.5 text-sm text-muted-foreground [&>span]:block";
export const btn = "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:brightness-110 disabled:opacity-50";
export const ghost = "inline-flex items-center justify-center rounded-full border border-primary/50 px-5 py-2.5 text-sm text-foreground transition hover:bg-primary/10";
export const card = "rounded-[2rem] border bg-card/60 p-6";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(getStoredSession());
    setReady(true);
    if (hasBackendUrl()) void api.refreshSession();
    return onSessionChange(setSession);
  }, []);

  return { session, ready };
}

export function useIsMaster(session: Session | null) {
  return session ? session.user.is_master : null;
}

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  );
}

export function NotConfigured() {
  return (
    <div className={card}>
      <p className="font-display text-xl">Кабинет пока недоступен</p>
      <p className="mt-2 text-muted-foreground">Кабинет скоро откроется. Пока запись и остаток абонемента — у меня в Telegram.</p>
    </div>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasBackendUrl()) return;
    setBusy(true); setMsg("");
    if (mode === "up") {
      const { error } = await api.signUp({ email, password, full_name: name, phone });
      if (error) setMsg(error.message);
    } else {
      const { error } = await api.signIn({ email, password });
      if (error) setMsg(error.message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className={`${card} space-y-4`}>
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("in")} className={mode === "in" ? btn : ghost}>Войти</button>
        <button type="button" onClick={() => setMode("up")} className={mode === "up" ? btn : ghost}>Я здесь впервые</button>
      </div>
      {mode === "up" && (
        <>
          <label className={lbl}><span>Как к вам обращаться</span><input className={field} value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label className={lbl}><span>Телефон</span><input className={field} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        </>
      )}
      <label className={lbl}><span>Почта</span><input className={field} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label className={lbl}><span>Пароль (от 6 символов)</span><input className={field} type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      {mode === "up" && <Consent />}
      <button className={btn} disabled={busy}>{mode === "up" ? "Создать кабинет" : "Войти"}</button>
      {msg && <p role="alert" className="text-sm text-amber">{msg}</p>}
    </form>
  );
}

/** Required consent checkbox for forms that collect personal data. */
export function Consent() {
  return (
    <label className="flex items-start gap-3 text-sm text-muted-foreground">
      <input type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-primary" />
      <span>
        Соглашаюсь на обработку персональных данных и принимаю{" "}
        <Link to="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-foreground">
          Политику конфиденциальности
        </Link>
        .
      </span>
    </label>
  );
}
