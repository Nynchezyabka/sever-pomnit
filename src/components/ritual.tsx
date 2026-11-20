import { useState } from "react";
import { OILS, TEAS, ritualMessage } from "@/lib/ritual";
import { CopyButton, TG_BOOK } from "@/components/site";

function Choice({ title, items, value, onPick }: { title: string; items: readonly { id: string; label: string; note: string }[]; value: string; onPick: (id: string) => void }) {
  return (
    <fieldset>
      <legend className="font-display text-2xl">{title}</legend>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <button key={i.id} type="button" aria-pressed={value === i.id} onClick={() => onPick(i.id)}
            className={`min-h-11 rounded-2xl border px-4 py-3 text-left transition ${value === i.id ? "border-primary bg-primary/15" : "border-border bg-card/60 hover:border-primary/50"}`}>
            <span className="block font-medium">{i.label}</span>
            <span className="block text-sm text-muted-foreground">{i.note}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function TeaRitual() {
  const [oil, setOil] = useState("");
  const [tea, setTea] = useState("");
  const msg = ritualMessage(oil, tea);
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 md:py-16">
      <p className="text-sm uppercase tracking-[0.2em] text-amber">Ритуал перед визитом</p>
      <h2 className="mt-2 font-display text-4xl">Выберите аромат и чай</h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">Необязательно — но приятно, когда вас уже ждут. Можно передумать прямо на сеансе.</p>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <Choice title="Масло" items={OILS} value={oil} onPick={setOil} />
        <Choice title="Чай после" items={TEAS} value={tea} onPick={setTea} />
      </div>
      {msg && (
        <div className="mt-8 rounded-[2rem] border border-primary/40 bg-card/70 p-6">
          <p className="font-display text-xl italic text-amber">Мы заварим это к вашему приходу</p>
          <p className="mt-2 text-muted-foreground">{msg}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <CopyButton text={msg}>Скопировать для Александры</CopyButton>
            <a href={TG_BOOK} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground">Открыть Telegram</a>
          </div>
        </div>
      )}
    </section>
  );
}
