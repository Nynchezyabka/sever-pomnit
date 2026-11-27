import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { db } from "@/lib/cabinet";
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
    const c = db();
    if (!c) { setReady(true); return; }
    c.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = c.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export function useIsMaster(userId: string | undefined) {
  const [master, setMaster] = useState<boolean | null>(null);
  useEffect(() => {
    const c = db();
    if (!c || !userId) { setMaster(null); return; }
    c.rpc("is_master").then(({ data }) => setMaster(data === true));
  }, [userId]);
  return master;
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
    const c = db(); if (!c) return;
    setBusy(true); setMsg("");
    if (mode === "up") {
      const { data, error } = await c.auth.signUp({
        email, password,
        options: { data: { full_name: name, phone }, emailRedirectTo: `${window.location.origin}/kabinet` },
      });
      if (error) setMsg(friendly(error.message));
      else if (!data.session) setMsg("Почти готово: мы отправили письмо, откройте ссылку из него, чтобы войти.");
    } else {
      const { error } = await c.auth.signInWithPassword({ email, password });
      if (error) setMsg(friendly(error.message));
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

function friendly(m: string) {
  if (/invalid login/i.test(m)) return "Почта или пароль не подошли. Попробуйте ещё раз.";
  if (/already registered/i.test(m)) return "Такая почта уже есть — просто войдите.";
  if (/not confirmed/i.test(m)) return "Сначала откройте ссылку из письма.";
  return m;
}

/** Required consent checkbox for forms that collect personal data. */
export function Consent() {
  return (
    <label className="flex items-start gap-3 text-sm text-muted-foreground">
      <input type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-primary" />
      <span>Соглашаюсь на <Link to="/privacy" target="_blank" className="underline hover:text-foreground">обработку персональных данных</Link> для связи и записи.</span>
    </label>
  );
}
