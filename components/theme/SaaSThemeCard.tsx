import type { CSSProperties } from "react";
import type { SaaSTheme } from "@/lib/themes/saas-themes";
import { ColorSwatches } from "./ColorSwatches";

export function SaaSThemeCard({
  theme,
  selected,
  recommended,
  actionLabel,
  selectedActionLabel = "Usar este diseño",
  disableSelected,
  onSelectName,
  value
}: {
  theme: SaaSTheme;
  selected?: boolean;
  recommended?: boolean;
  actionLabel: string;
  selectedActionLabel?: string;
  disableSelected?: boolean;
  onSelectName: string;
  value: string;
}) {
  const themeCardStyle: CSSProperties = {
    borderColor: selected ? theme.colors.primary : "var(--app-border)"
  };
  const previewStyle: CSSProperties = {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    color: theme.colors.text
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-[var(--app-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={themeCardStyle}>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-base font-black text-[var(--app-text)]">{theme.name}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--app-text-muted)]">{theme.description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
            {selected ? <span className="rounded-full px-2.5 py-1 text-xs font-black text-[var(--app-button-text)]" style={{ backgroundColor: theme.colors.primary }}>Actual</span> : null}
            {recommended ? (
              <span className="rounded-full bg-[var(--app-surface-muted)] px-2.5 py-1 text-xs font-black text-[var(--app-text-muted)]">Predeterminado</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border p-2 shadow-inner" style={previewStyle}>
          <div className="grid min-h-40 min-w-0 grid-cols-[52px_minmax(0,1fr)] overflow-hidden rounded-2xl border shadow-sm sm:grid-cols-[64px_minmax(0,1fr)]" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
            <div className="space-y-2 p-2.5" style={{ backgroundColor: theme.colors.surfaceMuted }}>
              <span className="block h-7 w-7 rounded-xl" style={{ backgroundColor: theme.colors.primary }} />
              <span className="block h-2.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
              <span className="block h-2.5 rounded-full opacity-60" style={{ backgroundColor: theme.colors.textMuted }} />
              <span className="block h-2.5 rounded-full opacity-60" style={{ backgroundColor: theme.colors.textMuted }} />
            </div>
            <div className="min-w-0 space-y-2.5 p-3">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="block h-2.5 w-24 rounded-full" style={{ backgroundColor: theme.colors.text }} />
                  <span className="block h-1.5 w-2/3 rounded-full opacity-60" style={{ backgroundColor: theme.colors.textMuted }} />
                </div>
                <span className="h-8 w-12 rounded-xl" style={{ backgroundColor: theme.colors.primary }} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border p-2.5" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                  <span className="block h-1.5 w-14 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                  <span className="mt-3 block h-7 rounded-xl" style={{ backgroundColor: theme.colors.surface }} />
                </div>
                <div className="rounded-2xl border p-2.5" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                  <span className="block h-1.5 w-12 rounded-full" style={{ backgroundColor: theme.colors.success }} />
                  <span className="mt-3 block h-7 rounded-xl" style={{ backgroundColor: theme.colors.surface }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="line-clamp-1 text-xs font-semibold text-[var(--app-text)]">{theme.recommendedUsage}</p>
          <ColorSwatches colors={theme.preview} />
        </div>
      </div>

      <div className="border-t border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-sm text-[var(--app-text-muted)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold">{selected ? "Aplicado a tu panel" : recommended ? "Tema inicial recomendado" : "Disponible"}</p>
          <button
            type="submit"
            name={onSelectName}
            value={value}
            disabled={selected && disableSelected}
            className="inline-flex h-9 items-center rounded-2xl px-3 text-sm font-black text-[var(--app-button-text)] transition disabled:cursor-default disabled:bg-[var(--app-surface-muted)] disabled:text-[var(--app-text-muted)]"
            style={selected && disableSelected ? undefined : { backgroundColor: theme.colors.primary }}
          >
            {selected ? selectedActionLabel : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
