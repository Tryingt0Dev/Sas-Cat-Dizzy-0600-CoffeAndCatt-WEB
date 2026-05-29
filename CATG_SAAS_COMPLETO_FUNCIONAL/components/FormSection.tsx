import { clsx } from "clsx";

export function FormSection({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4", className)}>
      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--app-text-muted)]">{title}</h3>
        {description ? <p className="mt-1 text-sm text-[var(--app-text-muted)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
