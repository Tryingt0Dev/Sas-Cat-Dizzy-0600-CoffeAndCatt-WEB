import type { SaaSTheme } from "@/lib/themes/saas-themes";
import { SaaSThemeCard } from "./SaaSThemeCard";

type ThemeSelectionAction = (formData: FormData) => void | Promise<void>;

export function SaaSThemeSelector({
  themes,
  selectedSlug,
  action,
  selectedActionLabel,
  disableSelected
}: {
  themes: SaaSTheme[];
  selectedSlug: string;
  action: ThemeSelectionAction;
  selectedActionLabel?: string;
  disableSelected?: boolean;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {themes.map((theme) => (
        <form key={theme.slug} className="min-h-full" action={action}>
          <input type="hidden" name="themeSlug" value={theme.slug} />
          <SaaSThemeCard
            theme={theme}
            selected={theme.slug === selectedSlug}
            recommended={theme.slug === "violet-premium"}
            actionLabel="Seleccionar diseño"
            selectedActionLabel={selectedActionLabel}
            disableSelected={disableSelected}
            onSelectName="themeSlug"
            value={theme.slug}
          />
        </form>
      ))}
    </div>
  );
}
