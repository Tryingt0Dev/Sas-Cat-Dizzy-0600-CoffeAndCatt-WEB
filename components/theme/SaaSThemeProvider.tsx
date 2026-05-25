import type { ReactNode } from "react";
import type { SaaSTheme } from "@/lib/themes/saas-themes";

export function SaaSThemeProvider({ theme, children }: { theme: SaaSTheme; children: ReactNode }) {
  const vars = theme.cssVariables ?? {
    "--app-bg": theme.colors.background,
    "--app-surface": theme.colors.surface,
    "--app-surface-muted": theme.colors.surfaceMuted,
    "--app-text": theme.colors.text,
    "--app-text-muted": theme.colors.textMuted,
    "--app-primary": theme.colors.primary,
    "--app-primary-hover": theme.colors.primaryHover,
    "--app-accent": theme.colors.accent,
    "--app-success": theme.colors.success,
    "--app-border": theme.colors.border,
    "--app-ring": theme.colors.ring,
    "--app-danger": theme.colors.danger,
    "--app-warning": theme.colors.warning
  } as React.CSSProperties;

  return (
    <div style={vars}>
      {children}
    </div>
  );
}
