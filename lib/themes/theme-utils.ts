import type { CSSProperties } from "react";
import { catalogPalettes, type CatalogPalette } from "./catalog-palettes";
import { saasThemes, type SaaSTheme } from "./saas-themes";

export const defaultSaasThemeSlug = "violet-premium";
export const defaultCatalogPaletteSlug = "minimal-arena";

export function getSaasThemeBySlug(slug: string | null | undefined): SaaSTheme {
  return saasThemes.find((theme) => theme.slug === slug) ?? saasThemes[0];
}

export function isValidSaasThemeSlug(slug: string | null | undefined): slug is string {
  return !!slug && saasThemes.some((theme) => theme.slug === slug);
}

export function getCatalogPaletteBySlug(slug: string | null | undefined): CatalogPalette {
  return catalogPalettes.find((palette) => palette.slug === slug) ?? catalogPalettes.find((palette) => palette.slug === defaultCatalogPaletteSlug)!;
}

export function isValidCatalogPaletteSlug(slug: string | null | undefined): slug is string {
  return !!slug && catalogPalettes.some((palette) => palette.slug === slug);
}

export function getSaasThemeCssVariables(theme: SaaSTheme) {
  return {
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
  } as CSSProperties;
}

export function getCatalogPaletteCssVariables(palette: CatalogPalette, buttonRadius?: number) {
  const radius = buttonRadius ? `${buttonRadius}px` : "18px";
  return {
    "--catalog-bg": palette.colors.background,
    "--catalog-surface": palette.colors.surface,
    "--catalog-text": palette.colors.text,
    "--catalog-text-muted": palette.colors.textMuted,
    "--catalog-primary": palette.colors.primary,
    "--catalog-primary-hover": palette.colors.secondary,
    "--catalog-secondary": palette.colors.secondary,
    "--catalog-accent": palette.colors.accent,
    "--catalog-muted": palette.colors.muted,
    "--catalog-border": palette.colors.border,
    "--catalog-success": palette.colors.success,
    "--catalog-banner": palette.colors.banner,
    "--catalog-price": palette.colors.price,
    "--catalog-discount": palette.colors.discount,
    "--catalog-radius": radius
  } as React.CSSProperties;
}
