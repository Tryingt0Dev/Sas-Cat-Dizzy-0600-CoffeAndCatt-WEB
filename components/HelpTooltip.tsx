import { clsx } from "clsx";

export function HelpTooltip({ description, className }: { description: string; className?: string }) {
  return (
    <span className={clsx("group relative inline-flex items-center", className)}>
      <button
        type="button"
        aria-label={description}
        title={description}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[11px] font-black text-[var(--app-text)] shadow-sm transition hover:border-[var(--app-primary)] hover:bg-[var(--app-surface-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)]/20"
      >
        ?
      </button>
      <span className="pointer-events-none invisible absolute right-0 top-full z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-left text-xs text-[var(--app-text)] shadow-lg opacity-0 transition duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 sm:left-1/2 sm:right-auto sm:w-72 sm:-translate-x-1/2">
        {description}
      </span>
    </span>
  );
}
