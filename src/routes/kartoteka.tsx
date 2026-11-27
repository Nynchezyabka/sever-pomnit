import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { meta } from "@/components/site";
import { NotConfigured, Shell, btn, card, field, ghost, lbl, useIsMaster, useSession } from "@/components/cabinet-ui";
import { GiftShelf } from "@/components/garden-gifts";
import { db, matchesClient, sessionsLeft, subscriptionLine, type GiftClaim, type Note, type Profile, type Subscription, type Visit } from "@/lib/cabinet";
import type { GiftId } from "@/lib/garden";

export const Route = createFileRoute("/kartoteka")({
  ssr: false,
  head: () => ({ ...meta("Картотека · Север помнит", "Рабочий кабинет мастера."), meta: [...meta("Картотека · Север помнит", "Рабочий кабинет мастера.").meta, { name: "robots", content: "noindex" }] }),
  component: Kartoteka,
});

function Kartoteka() {
  const { session, ready } = useSession();
  const master = useIsMaster(session?.user.id);
  if (!ready || (session && master === null)) return <Shell title="Картотека"><p className="text-muted-foreground">Минутку…</p></Shell>;
  if (!db()) return <Shell title="Картотека"><NotConfigured /></Shell>;
  if (!session || !master) return <Shell title="Картотека"><p className="text-muted-foreground">Этот раздел только для мастера.</p><Link to="/kabinet" className={ghost}>Войти</Link></Shell>;
  return <Shell title="Картотека"><Requests /><Clients /></Shell>;
}

function Clients() {
  const [list, setList] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Profile | null>(null);
  const [adding, setAdding] = useState(false);
  const load = () => db()!.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => setList((data ?? []) as Profile[]));
  useEffect(() => { void load(); }, []);
  if (open) return <ClientCard p={open} back={() => { setOpen(null); void load(); }} />;
  if (adding) return <NewClient back={() => setAdding(false)} created={(p) => { setAdding(false); void load(); setOpen(p); }} />;
  const shown = list.filter((p) => matchesClient(p, q));
  return <>
    <div className="flex flex-wrap items-end gap-3">
      <label className={`${lbl} flex-1`}><span>Поиск</span><input className={field} placeholder="Имя, телефон или Telegram" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <button className={btn} onClick={() => setAdding(true)}>+ Добавить клиента</button>
    </div>
    <p className="text-sm text-muted-foreground">Клиентов: {list.length}</p>
    <ul className="space-y-2">{shown.map((p) => (
      <li key={p.id}><button onClick={() => setOpen(p)} className={`${card} w-full text-left hover:border-primary/60`}>
        <span className="font-display text-lg">{p.full_name || "Без имени"}</span>{p.offline && <span className="ml-2 text-sm text-muted-foreground">· внесён вручную</span>}
        <span className="block text-sm text-muted-foreground">{[p.phone, p.telegram].filter(Boolean).join(" · ") || "контакты не указаны"}</span>
      </button></li>))}</ul>
  </>;
}

function NewClient({ back, created }: { back: () => void; created: (p: Profile) => void }) {
  const [f, setF] = useState({ full_name: "", phone: "", telegram: "", note: "", title: "Абонемент: 5 сеансов массажа тела", total: 5, left: 5, until: "" });
  const [withSub, setWithSub] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const c = db()!;
    const { data, error } = await c.from("profiles").insert({ full_name: f.full_name.trim(), phone: f.phone.trim(), telegram: f.telegram.trim().replace(/^@/, ""), offline: true }).select().single();
    if (error || !data) { setBusy(false); setErr("Не получилось сохранить. Обновите SQL-схему по инструкции (раздел 11) и попробуйте ещё раз."); return; }
    const p = data as Profile;
    if (f.note.trim()) await c.from("client_notes").insert({ client_id: p.id, body: f.note.trim() });
    if (withSub && f.total > 0) {
      const used = Math.min(f.total, Math.max(0, f.total - f.left));
      const r = await c.from("subscriptions").insert({ client_id: p.id, title: f.title, total_sessions: f.total, used_sessions: used, expires_on: f.until || null });
      if (r.error) setErr("Клиент сохранён, но абонемент не добавился — добавьте его в карточке.");
    }
    setBusy(false); created(p);
  }
  return <>
    <button className={ghost} onClick={back}>← Все клиенты</button>
    <form onSubmit={save} className={`${card} space-y-3`}>
      <h2 className="font-display text-2xl">Новый клиент</h2>
      <p className="text-sm text-muted-foreground">Для тех, кто ходит давно и ещё не регистрировался на сайте. Если человек потом зарегистрируется с этим же телефоном, карточка привяжется к его кабинету сама.</p>
      <label className={lbl}><span>Имя</span><input className={field} required maxLength={100} value={f.full_name} onChange={set("full_name")} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={lbl}><span>Телефон</span><input className={field} type="tel" value={f.phone} onChange={set("phone")} /></label>
        <label className={lbl}><span>Ник в Telegram</span><input className={field} value={f.telegram} onChange={set("telegram")} /></label>
      </div>
      <label className={lbl}><span>Заметка для себя (клиент не видит)</span><input className={field} value={f.note} onChange={set("note")} /></label>
      <label className="flex items-center gap-3"><input type="checkbox" checked={withSub} onChange={(e) => setWithSub(e.target.checked)} /> Есть действующий абонемент</label>
      {withSub && <div className="grid gap-3 sm:grid-cols-2">
        <label className={`${lbl} sm:col-span-2`}><span>Название</span><input className={field} value={f.title} onChange={set("title")} /></label>
        <label className={lbl}><span>Всего сеансов</span><input className={field} type="number" min={1} value={f.total} onChange={set("total")} /></label>
        <label className={lbl}><span>Осталось сеансов</span><input className={field} type="number" min={0} max={f.total} value={f.left} onChange={set("left")} /></label>
        <label className={lbl}><span>Действует до</span><input className={field} type="date" value={f.until} onChange={set("until")} /></label>
      </div>}
      <button className={btn} disabled={busy}>Сохранить клиента</button>
      {err && <p role="alert" className="text-sm text-amber">{err}</p>}
    </form>
  </>;
}

function ClientCard({ p, back }: { p: Profile; back: () => void }) {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [claims, setClaims] = useState<GiftClaim[]>([]);
  const [busyGift, setBusyGift] = useState<GiftId | null>(null);
  const [giftErr, setGiftErr] = useState("");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState("Абонемент: 5 сеансов массажа тела");
  const [total, setTotal] = useState(5);
  const [until, setUntil] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    const c = db()!;
    const [s, v, n, g] = await Promise.all([
      c.from("subscriptions").select("*").eq("client_id", p.id).order("created_at", { ascending: false }),
      c.from("visits").select("*").eq("client_id", p.id).order("visited_on", { ascending: false }),
      c.from("client_notes").select("*").eq("client_id", p.id).order("created_at", { ascending: false }),
      c.from("gift_claims").select("*").eq("client_id", p.id).order("created_at", { ascending: false }),
    ]);
    setSubs((s.data ?? []) as Subscription[]); setVisits((v.data ?? []) as Visit[]); setNotes((n.data ?? []) as Note[]); setClaims((g.data ?? []) as GiftClaim[]);
  }
  useEffect(() => { void load(); }, [p.id]);

  async function useOne(s: Subscription) {
    const { error } = await db()!.rpc("use_session", { _sub: s.id, _service: "" });
    setErr(error ? "Не получилось списать сеанс." : ""); void load();
  }
  async function addSub(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await db()!.from("subscriptions").insert({ client_id: p.id, title, total_sessions: total, expires_on: until || null });
    setErr(error ? "Не получилось добавить абонемент." : ""); void load();
  }
  async function addNote(e: React.FormEvent) {
    e.preventDefault(); if (!note.trim()) return;
    await db()!.from("client_notes").insert({ client_id: p.id, body: note.trim() }); setNote(""); void load();
  }
  async function addVisit() {
    await db()!.from("visits").insert({ client_id: p.id, service: "Сеанс" }); void load();
  }
  async function claimGift(gift: GiftId) {
    setBusyGift(gift); setGiftErr("");
    const { error } = await db()!.from("gift_claims").insert({ client_id: p.id, gift });
    setGiftErr(error ? "Не получилось отметить подарок. Обновите SQL-схему по инструкции и попробуйте ещё раз." : "");
    setBusyGift(null); await load();
  }
  const tg = p.telegram.replace("@", "");

  return <>
    <button className={ghost} onClick={back}>← Все клиенты</button>
    <div className={card}>
      <h2 className="font-display text-3xl">{p.full_name || "Без имени"}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {p.phone && <a className={ghost} href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}>Позвонить {p.phone}</a>}
        {tg && <a className={ghost} href={`https://t.me/${tg}`} target="_blank" rel="noreferrer">Написать @{tg}</a>}
      </div>
      <dl className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
        {p.oil && <div>Масло: {p.oil}</div>}{p.tea && <div>Чай: {p.tea}</div>}
        {p.pressure && <div>Нажим: {p.pressure}</div>}{p.silence && <div>Сеанс в тишине</div>}
      </dl>
      {p.wishes && <p className="mt-3 text-muted-foreground">«{p.wishes}»</p>}
    </div>

    <div className={card}>
      <h3 className="font-display text-2xl">Абонементы</h3>
      <ul className="mt-3 space-y-3">{subs.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
          <span>{s.title} — <span className="text-amber">{subscriptionLine(s)}</span></span>
          {sessionsLeft(s) > 0 && <button className={btn} onClick={() => useOne(s)}>Списать сеанс сегодня</button>}
        </li>))}</ul>
      <form onSubmit={addSub} className="mt-5 grid gap-2 sm:grid-cols-[1fr_6rem_10rem_auto]">
        <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={field} type="number" min={1} value={total} onChange={(e) => setTotal(Number(e.target.value))} title="Сеансов" />
        <input className={field} type="date" value={until} onChange={(e) => setUntil(e.target.value)} title="Действует до" />
        <button className={ghost}>Добавить</button>
      </form>
      {err && <p className="mt-2 text-sm text-amber">{err}</p>}
    </div>

    <div className={card}>
      <h3 className="font-display text-2xl">Мои заметки <span className="text-sm text-muted-foreground">(клиент не видит)</span></h3>
      <form onSubmit={addNote} className="mt-3 flex gap-2"><input className={field} placeholder="Например: чувствительная шея" value={note} onChange={(e) => setNote(e.target.value)} /><button className={ghost}>Добавить</button></form>
      <ul className="mt-3 space-y-1 text-sm">{notes.map((n) => <li key={n.id}>{new Date(n.created_at).toLocaleDateString("ru-RU")} — {n.body}</li>)}</ul>
    </div>

    <div className={card}>
      <div className="flex items-center justify-between"><h3 className="font-display text-2xl">Визиты</h3><button className={ghost} onClick={addVisit}>+ Визит сегодня</button></div>
      <ul className="mt-3 space-y-1 text-sm">{visits.map((v) => <li key={v.id}>{new Date(v.visited_on).toLocaleDateString("ru-RU")} — {v.service}</li>)}</ul>
    </div>

    <div className={card}>
      <h3 className="font-display text-2xl">Подарки из Зимнего сада</h3>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">Чай на 5-м визите, эфирное масло на 10-м, магниевая соль на 15-м.</p>
      <GiftShelf visits={visits.length} claimed={claims.map((c) => c.gift)} onClaim={claimGift} busy={busyGift !== null} />
      {giftErr && <p className="mt-3 text-sm text-amber">{giftErr}</p>}
    </div>
  </>;
}

type Req = { id: string; name: string; contact: string; service: string; wish_time: string; comment: string; created_at: string };
function Requests() {
  const [list, setList] = useState<Req[]>([]);
  const load = () => db()!.from("booking_requests").select("*").eq("done", false).order("created_at", { ascending: false }).then(({ data }) => setList((data ?? []) as Req[]));
  useEffect(() => { load(); }, []);
  if (list.length === 0) return null;
  return <div className={card}>
    <h2 className="font-display text-2xl">Новые заявки</h2>
    <ul className="mt-3 space-y-3">{list.map((r) => (
      <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div><p>{r.name} · <span className="text-amber">{r.contact}</span></p>
          <p className="text-sm text-muted-foreground">{[r.service, r.wish_time, r.comment].filter(Boolean).join(" · ")}</p>
          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ru-RU")}</p></div>
        <button className={ghost} onClick={async () => { await db()!.from("booking_requests").update({ done: true }).eq("id", r.id); load(); }}>Связались с клиентом</button>
      </li>))}</ul>
  </div>;
}
