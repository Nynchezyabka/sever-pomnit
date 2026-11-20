import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { meta } from "@/components/site";
import { AuthForm, NotConfigured, Shell, btn, card, field, ghost, useIsMaster, useSession } from "@/components/cabinet-ui";
import { db, subscriptionLine, type Profile, type Subscription, type Visit } from "@/lib/cabinet";

export const Route = createFileRoute("/kabinet")({
  ssr: false,
  head: () => meta("Личный кабинет · Север помнит", "Ваши абонементы, визиты и пожелания к сеансу у Александры."),
  component: Cabinet,
});

function Cabinet() {
  const { session, ready } = useSession();
  const master = useIsMaster(session?.user.id);
  if (!ready) return <Shell title="Личный кабинет"><p className="text-muted-foreground">Минутку…</p></Shell>;
  if (!db()) return <Shell title="Личный кабинет"><NotConfigured /></Shell>;
  if (!session) return (
    <Shell title="Личный кабинет">
      <p className="text-muted-foreground">Здесь видно, сколько сеансов осталось, и можно один раз рассказать о себе — чтобы на сеансе ничего не объяснять.</p>
      <AuthForm />
    </Shell>
  );
  return <Shell title="Личный кабинет">
    {master && <Link to="/kartoteka" className={btn}>Открыть картотеку клиентов</Link>}
    <Mine userId={session.user.id} />
  </Shell>;
}

function Mine({ userId }: { userId: string }) {
  const [p, setP] = useState<Profile | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const c = db()!;
    c.from("profiles").select("*").eq("id", userId).maybeSingle().then(({ data }) => setP(data as Profile | null));
    c.from("subscriptions").select("*").eq("client_id", userId).order("created_at", { ascending: false }).then(({ data }) => setSubs((data ?? []) as Subscription[]));
    c.from("visits").select("*").eq("client_id", userId).order("visited_on", { ascending: false }).then(({ data }) => setVisits((data ?? []) as Visit[]));
  }, [userId]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!p) return;
    const { id: _id, created_at: _c, ...rest } = p;
    const { error } = await db()!.from("profiles").update(rest).eq("id", userId);
    setSaved(!error);
  }
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setSaved(false); setP((x) => (x ? { ...x, [k]: v } : x)); };

  return <>
    <div className={card}>
      <h2 className="font-display text-2xl">Мои абонементы</h2>
      {subs.length === 0 ? <p className="mt-2 text-muted-foreground">Пока пусто. Когда вы купите абонемент или сертификат, Александра добавит его сюда.</p> :
        <ul className="mt-3 space-y-2">{subs.map((s) => (
          <li key={s.id} className="flex flex-wrap justify-between gap-2"><span>{s.title}</span>
            <span className="text-amber">{subscriptionLine(s)}{s.expires_on ? ` · до ${new Date(s.expires_on).toLocaleDateString("ru-RU")}` : ""}</span></li>))}</ul>}
    </div>

    {p && <form onSubmit={save} className={`${card} space-y-3`}>
      <h2 className="font-display text-2xl">О себе</h2>
      <p className="text-sm text-muted-foreground">Всё необязательно. Александра увидит это перед сеансом.</p>
      <input className={field} placeholder="Имя" value={p.full_name} onChange={(e) => set("full_name", e.target.value)} />
      <input className={field} placeholder="Телефон" value={p.phone} onChange={(e) => set("phone", e.target.value)} />
      <input className={field} placeholder="Ник в Telegram" value={p.telegram} onChange={(e) => set("telegram", e.target.value)} />
      <input className={field} placeholder="Любимое масло или аромат" value={p.oil} onChange={(e) => set("oil", e.target.value)} />
      <input className={field} placeholder="Чай после сеанса" value={p.tea} onChange={(e) => set("tea", e.target.value)} />
      <input className={field} placeholder="Нажим: мягче / средний / сильнее" value={p.pressure} onChange={(e) => set("pressure", e.target.value)} />
      <label className="flex items-center gap-3"><input type="checkbox" checked={p.silence} onChange={(e) => set("silence", e.target.checked)} /> Хочу сеанс в тишине</label>
      <textarea className={field} rows={3} placeholder="Что ещё важно знать: чувствительные места, самочувствие" value={p.wishes} onChange={(e) => set("wishes", e.target.value)} />
      <button className={btn}>Сохранить</button>
      {saved && <span className="ml-3 text-sm text-amber">Сохранено</span>}
    </form>}

    <div className={card}>
      <h2 className="font-display text-2xl">Мои визиты</h2>
      {visits.length === 0 ? <p className="mt-2 text-muted-foreground">Здесь появятся ваши сеансы.</p> :
        <ul className="mt-3 space-y-1">{visits.map((v) => <li key={v.id}>{new Date(v.visited_on).toLocaleDateString("ru-RU")} — {v.service}</li>)}</ul>}
    </div>
    <button className={ghost} onClick={() => db()!.auth.signOut()}>Выйти</button>
  </>;
}
