import { clsx } from "clsx";
import { HelpTooltip } from "@/components/HelpTooltip";

export function SectionCard({
  title,
  description,
  help,
  actions,
  children,
  className
}: {
  title: string;
  description?: React.ReactNode;
  help?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-[var(--app-text)] shadow-sm", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-lg font-black">{title}</h2>
            {help ? <HelpTooltip description={help} /> : null}
          </div>
          {description ? <div className="mt-1 max-w-3xl text-sm leading-6 text-[var(--app-text-muted)]">{description}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
