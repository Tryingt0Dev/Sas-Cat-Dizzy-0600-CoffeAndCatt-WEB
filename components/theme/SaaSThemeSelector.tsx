"use client";

import type { SaaSTheme } from "@/lib/themes/saas-themes";
import { SaaSThemeCard } from "./SaaSThemeCard";

export function SaaSThemeSelector({
  themes,
  selectedSlug,
  selectedActionLabel,
  disableSelected,
  onSelect
}: {
  themes: SaaSTheme[];
  selectedSlug: string;
  selectedActionLabel?: string;
  disableSelected?: boolean;
  onSelect?: (slug: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {themes.map((theme) => (
        <SaaSThemeCard
          key={theme.slug}
          theme={theme}
          selected={theme.slug === selectedSlug}
          recommended={theme.slug === "violet-premium"}
          actionLabel="Seleccionar diseño"
          selectedActionLabel={selectedActionLabel}
          disableSelected={disableSelected}
          onSelect={() => onSelect?.(theme.slug)}
        />
      ))}
    </div>
  );
}
