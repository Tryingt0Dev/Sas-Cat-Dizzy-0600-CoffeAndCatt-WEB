import Link from "next/link";
import { LearningLink } from "@/components/LearningLink";

type OnboardingItem = {
  label: string;
  description: string;
  href: string;
  done: boolean;
};

export function OnboardingChecklist({ items }: { items: OnboardingItem[] }) {
  const completed = items.filter((item) => item.done).length;
  const progress = Math.round((completed / items.length) * 100);

  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--app-text-muted)]">Activacion comercial</p>
          <h2 className="mt-2 text-xl font-black text-[var(--app-text)]">Deja tu tienda lista para vender</h2>
          <p className="mt-1 text-sm text-[var(--app-text-muted)]">Completa estos pasos para publicar una experiencia mas confiable.</p>
        </div>
        <div className="rounded-2xl bg-[var(--app-primary)] px-4 py-3 text-right text-[var(--app-button-text)]">
          <p className="text-xs font-bold text-white/70">Progreso</p>
          <p className="text-2xl font-black">{progress}%</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--app-surface-muted)]">
        <div className="h-full rounded-full bg-[var(--app-primary)]" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--app-primary)] hover:bg-[var(--app-surface)] hover:shadow-sm">
            <div className="flex items-start gap-3">
              <span className={item.done ? "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--app-primary)] text-xs font-black text-[var(--app-button-text)]" : "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--app-surface)] text-xs font-black text-[var(--app-text-muted)]"}>
                {item.done ? "OK" : ""}
              </span>
              <div>
                <p className="font-black text-[var(--app-text)]">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6 rounded-3xl bg-[var(--app-surface-muted)] p-4 text-left text-sm text-[var(--app-text-muted)]">
        <p className="font-bold text-[var(--app-text)]">Más ayuda</p>
        <p className="mt-2 text-[var(--app-text-muted)]">Sigue esta guía para completar los pasos de forma segura y evitar errores comunes.</p>
        <div className="mt-4">
          <LearningLink href="/dashboard/learning">Ver guía paso a paso</LearningLink>
        </div>
      </div>
    </section>
  );
}
