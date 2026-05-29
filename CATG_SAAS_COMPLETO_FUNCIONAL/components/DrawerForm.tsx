"use client";

import { clsx } from "clsx";

export function DrawerForm({
  open,
  title,
  description,
  children,
  onClose,
  size = "md"
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "md" | "lg";
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Cerrar panel" className="hidden flex-1 cursor-default lg:block" onClick={onClose} />
      <section
        className={clsx(
          "flex h-full w-full flex-col border-l border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-2xl",
          size === "lg" ? "max-w-3xl" : "max-w-xl"
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--app-border)] px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black">{title}</h2>
            {description ? <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-muted)] text-sm font-black text-[var(--app-text)]"
            aria-label="Cerrar"
          >
            X
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </section>
    </div>
  );
}
