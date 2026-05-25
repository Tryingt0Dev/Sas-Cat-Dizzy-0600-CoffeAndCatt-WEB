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
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border bg-[var(--app-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg" style={themeCardStyle}>
      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-lg font-black text-[var(--app-text)]">{theme.name}</p>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">{theme.description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
            {selected ? <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: theme.colors.primary }}>Activo</span> : null}
            {recommended ? (
              <span className="rounded-full bg-[var(--app-surface-muted)] px-3 py-1 text-xs font-black text-[var(--app-text-muted)]">Recomendado</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border p-3 shadow-inner" style={previewStyle}>
          <div className="grid min-h-52 min-w-0 grid-cols-[58px_minmax(0,1fr)] overflow-hidden rounded-2xl border shadow-sm sm:grid-cols-[70px_minmax(0,1fr)]" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
            <div className="space-y-3 p-3" style={{ backgroundColor: theme.colors.surfaceMuted }}>
              <span className="block h-7 w-7 rounded-xl" style={{ backgroundColor: theme.colors.primary }} />
              <span className="block h-2 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
              <span className="block h-2 rounded-full opacity-60" style={{ backgroundColor: theme.colors.textMuted }} />
              <span className="block h-2 rounded-full opacity-60" style={{ backgroundColor: theme.colors.textMuted }} />
            </div>
            <div className="min-w-0 space-y-3 p-3 sm:p-4">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <span className="block h-3 w-24 max-w-full rounded-full" style={{ backgroundColor: theme.colors.text }} />
                  <span className="block h-2 w-2/3 rounded-full opacity-50" style={{ backgroundColor: theme.colors.textMuted }} />
                </div>
                <span className="h-8 w-14 shrink-0 rounded-2xl sm:w-20" style={{ backgroundColor: theme.colors.primary }} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border p-3" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                  <span className="block h-2 w-16 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                  <span className="mt-5 block h-8 rounded-2xl" style={{ backgroundColor: theme.colors.surface }} />
                </div>
                <div className="rounded-2xl border p-3" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.background }}>
                  <span className="block h-2 w-14 rounded-full" style={{ backgroundColor: theme.colors.success }} />
                  <span className="mt-5 block h-8 rounded-2xl" style={{ backgroundColor: theme.colors.surface }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--app-text)]">{theme.recommendedUsage}</p>
          <ColorSwatches colors={theme.preview} />
        </div>
      </div>

      <div className="border-t border-[var(--app-border)] bg-[var(--app-surface)] p-5 text-sm text-[var(--app-text-muted)]">
        <div className="flex items-center justify-between gap-4">
          <p className="font-semibold">{selected ? "Aplicado a tu panel" : recommended ? "Tema inicial recomendado" : "Disponible"}</p>
          <button
            type="submit"
            name={onSelectName}
            value={value}
            disabled={selected && disableSelected}
            className="rounded-2xl px-4 py-2 text-sm font-black text-white transition disabled:cursor-default disabled:bg-[var(--app-surface-muted)] disabled:text-[var(--app-text-muted)]"
            style={selected && disableSelected ? undefined : { backgroundColor: theme.colors.primary }}
          >
            {selected ? selectedActionLabel : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
