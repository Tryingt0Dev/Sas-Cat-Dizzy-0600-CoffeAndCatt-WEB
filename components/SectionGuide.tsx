import { clsx } from "clsx";

export function SectionGuide({
  eyebrow,
  title,
  description,
  help,
  actions,
  className
}: {
  eyebrow: string;
  title: string;
  description: string;
  help?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-3xl border border-[var(--app-border,#e5e7eb)] bg-[var(--app-surface,#ffffff)] p-5 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--app-primary,#7c3aed)]">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black text-[var(--app-text,#111827)]">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--app-text-muted,#6b7280)]">{description}</p>
          {help ? (
            <p className="mt-3 max-w-3xl rounded-2xl bg-[var(--app-surface-muted,#f3f4f6)] px-4 py-3 text-sm leading-6 text-[var(--app-text-muted,#6b7280)]">{help}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
