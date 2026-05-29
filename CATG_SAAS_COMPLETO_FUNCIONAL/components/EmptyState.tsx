import { clsx } from "clsx";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-3xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-8 text-center shadow-sm", className)}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--app-surface-muted)] text-2xl text-[var(--app-text-muted)]">
        {icon ?? <span>?</span>}
      </div>
      <h3 className="mt-5 text-xl font-black text-[var(--app-text)]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--app-text-muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
