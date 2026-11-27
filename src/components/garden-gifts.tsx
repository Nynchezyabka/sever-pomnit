import { Check, Coffee, Gift, Leaf, LockKeyhole, PackageOpen } from "lucide-react";
import { giftStates, type GiftId } from "@/lib/garden";

const icons = { tea: Coffee, salt: PackageOpen, oil: Leaf } as const;

export function GiftShelf({ visits, claimed, onClaim, busy = false }: {
  visits: number;
  claimed: GiftId[];
  onClaim?: (id: GiftId) => void;
  busy?: boolean;
}) {
  return (
    <div className="space-y-3">
      {giftStates(visits, claimed).map((gift) => {
        const Icon = icons[gift.id];
        return (
          <article key={gift.id} className={`rounded-2xl border p-4 transition ${gift.status === "ready" ? "border-amber/60 bg-secondary/60" : "bg-background/35"}`}>
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${gift.status === "locked" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                {gift.status === "locked" ? <LockKeyhole className="h-5 w-5" aria-hidden /> : gift.status === "given" ? <Check className="h-5 w-5" aria-hidden /> : <Icon className="h-5 w-5" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="font-display text-xl">{gift.title}</h3>
                  <span className="text-sm text-muted-foreground">{gift.at}-й визит</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{gift.description}</p>
                <p className={`mt-2 text-sm ${gift.status === "ready" ? "text-amber" : "text-muted-foreground"}`} aria-live="polite">
                  {gift.status === "given" ? "Подарок выдан" : gift.status === "ready" ? "Открыто — можно получить у меня" : `Откроется после ${gift.at}-го визита`}
                </p>
                {onClaim && gift.status === "ready" && (
                  <button type="button" disabled={busy} onClick={() => onClaim(gift.id)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    <Gift className="h-4 w-4" aria-hidden /> Отметить выдачу
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
      <p className="text-sm text-muted-foreground sm:col-span-full">Визиты не сгорают и не обнуляются — можно приходить в своём ритме.</p>
    </div>
  );
}
