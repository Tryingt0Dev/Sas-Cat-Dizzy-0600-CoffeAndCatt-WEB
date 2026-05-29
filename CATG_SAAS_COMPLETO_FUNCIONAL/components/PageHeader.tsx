import { clsx } from "clsx";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--app-primary,#7c3aed)]">{eyebrow}</p>
        <h1 className="mt-2 text-balance text-2xl font-black text-[var(--app-text,#111827)] sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--app-text-muted,#6b7280)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
