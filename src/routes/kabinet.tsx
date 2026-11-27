import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { meta } from "@/components/site";
import { AuthForm, NotConfigured, Shell, btn, card, field, lbl, ghost, useIsMaster, useSession } from "@/components/cabinet-ui";
import { api, hasBackendUrl, subscriptionLine, type Profile, type Subscription, type Visit } from "@/lib/cabinet";

export const Route = createFileRoute("/kabinet")({
  ssr: false,
  head: () => meta("Личный кабинет · Север помнит", "Ваши абонементы, визиты и пожелания к сеансу у Александры.", { noindex: true }),
  component: Cabinet,
});

function Cabinet() {
  const { session, ready } = useSession();
  const master = useIsMaster(session);
  if (!ready) return <Shell title="Личный кабинет"><p className="text-muted-foreground">Минутку…</p></Shell>;
  if (!hasBackendUrl()) return <Shell title="Личный кабинет"><NotConfigured /></Shell>;
  if (!session) return (
    <Shell title="Личный кабинет">
      <p className="text-muted-foreground">Здесь хранятся ваши абонементы, история визитов и пожелания к сеансу. Можно один раз рассказать о себе, чтобы не повторять это перед каждым массажем.</p>
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
    let alive = true;
    api.getCabinet().then(({ data }) => {
      if (!alive || !data) return;
      setP(data.profile);
      setSubs(data.subscriptions);
      setVisits(data.visits);
    });
    return () => { alive = false; };
  }, [userId]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!p) return;
    const { data, error } = await api.updateProfile({
      full_name: p.full_name,
      phone: p.phone,
      telegram: p.telegram,
      oil: p.oil,
      tea: p.tea,
      pressure: p.pressure,
      silence: p.silence,
      wishes: p.wishes,
    });
    if (data?.profile) setP(data.profile);
    setSaved(!error);
  }
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setSaved(false); setP((x) => (x ? { ...x, [k]: v } : x)); };

  return <>
    <div className={card}>
      <h2 className="font-display text-2xl">Мои абонементы</h2>
      {subs.length === 0 ? <p className="mt-2 text-muted-foreground">Пока пусто. Когда вы купите абонемент или сертификат, я добавлю его сюда.</p> :
        <ul className="mt-3 space-y-2">{subs.map((s) => (
          <li key={s.id} className="flex flex-wrap justify-between gap-2"><span>{s.title}</span>
            <span className="text-amber">{subscriptionLine(s)}{s.expires_on ? ` · до ${new Date(s.expires_on).toLocaleDateString("ru-RU")}` : ""}</span></li>))}</ul>}
    </div>

    {p && <form onSubmit={save} className={`${card} space-y-3`}>
      <h2 className="font-display text-2xl">Пожелания к сеансу</h2>
      <p className="text-sm text-muted-foreground">Всё необязательно — можно один раз указать комфортные условия для визита.</p>
      <label className={lbl}><span>Имя</span><input className={field} value={p.full_name} onChange={(e) => set("full_name", e.target.value)} /></label>
      <label className={lbl}><span>Телефон</span><input className={field} type="tel" autoComplete="tel" value={p.phone} onChange={(e) => set("phone", e.target.value)} /></label>
      <label className={lbl}><span>Ник в Telegram</span><input className={field} value={p.telegram} onChange={(e) => set("telegram", e.target.value)} /></label>
      <label className={lbl}><span>Любимое масло или аромат</span><input className={field} value={p.oil} onChange={(e) => set("oil", e.target.value)} /></label>
      <label className={lbl}><span>Чай после сеанса</span><input className={field} value={p.tea} onChange={(e) => set("tea", e.target.value)} /></label>
      <label className={lbl}><span>Нажим: мягче / средний / сильнее</span><input className={field} value={p.pressure} onChange={(e) => set("pressure", e.target.value)} /></label>
      <label className="flex items-center gap-3"><input type="checkbox" checked={p.silence} onChange={(e) => set("silence", e.target.checked)} /> Хочу сеанс в тишине</label>
      <label className={lbl}><span>Особые пожелания (комфортный нажим, зоны внимания, предпочтения по маслам)</span><textarea className={field} rows={3} value={p.wishes} onChange={(e) => set("wishes", e.target.value)} /></label>
      <button className={btn}>Сохранить</button>
      {saved && <span className="ml-3 text-sm text-amber">Сохранено</span>}
    </form>}

    <div className={card}>
      <h2 className="font-display text-2xl">Мои визиты</h2>
      {visits.length === 0 ? <p className="mt-2 text-muted-foreground">Здесь появятся ваши сеансы.</p> :
        <ul className="mt-3 space-y-1">{visits.map((v) => <li key={v.id}>{new Date(v.visited_on).toLocaleDateString("ru-RU")} — {v.service}</li>)}</ul>}
    </div>
    <button className={ghost} onClick={() => api.signOut()}>Выйти</button>
  </>;
}
