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
  function hexToRgba(hex: string, alpha = 1) {
    const sanitized = hex.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getReadableTextColor(backgroundColor: string) {
    const sanitized = backgroundColor.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const dark = [r, g, b].map((channel) => channel / 255).map((channel) => {
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * dark[0] + 0.7152 * dark[1] + 0.0722 * dark[2];
    return luminance > 0.55 ? "#0F172A" : "#FFFFFF";
  }

  const mode = theme.mode ?? (theme.colors.background && theme.colors.background.toLowerCase().includes("0b") ? "dark" : "light");
  const hoverAlpha = mode === "dark" ? 0.22 : 0.1;
  const buttonText = getReadableTextColor(theme.colors.primary);
  const sidebarText = getReadableTextColor(theme.colors.surface);
  const sidebarMutedText = sidebarText === "#FFFFFF" ? "rgba(255, 255, 255, 0.72)" : "rgba(15, 23, 42, 0.68)";
  const sidebarActiveText = getReadableTextColor(theme.colors.primary);

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
    "--app-warning": theme.colors.warning,

    // Sidebar / card / button tokens
    "--app-sidebar-bg": theme.colors.surface,
    "--app-sidebar-text": sidebarText,
    "--app-sidebar-text-muted": sidebarMutedText,
    "--app-sidebar-hover": hexToRgba(theme.colors.primary, hoverAlpha),
    "--app-sidebar-active": theme.colors.primary,
    "--app-sidebar-active-text": sidebarActiveText,

    "--app-card-bg": theme.colors.surface,
    "--app-card-text": theme.colors.text,
    "--app-card-text-muted": theme.colors.textMuted,

    "--app-button-bg": theme.colors.primary,
    "--app-button-text": buttonText
  } as CSSProperties;
}

export function getCatalogPaletteCssVariables(palette: CatalogPalette, buttonRadius?: number) {
  function getReadableTextColor(backgroundColor: string) {
    const sanitized = backgroundColor.replace("#", "");
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const dark = [r, g, b].map((channel) => channel / 255).map((channel) => {
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * dark[0] + 0.7152 * dark[1] + 0.0722 * dark[2];
    return luminance > 0.55 ? "#0F172A" : "#FFFFFF";
  }

  const radius = buttonRadius ? `${buttonRadius}px` : "18px";
  const primaryButtonText = getReadableTextColor(palette.colors.primary);
  const accentButtonText = getReadableTextColor(palette.colors.accent);

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
    "--catalog-button-text": primaryButtonText,
    "--catalog-accent-text": accentButtonText,
    "--catalog-banner": palette.colors.banner,
    "--catalog-price": palette.colors.price,
    "--catalog-discount": palette.colors.discount,
    "--catalog-radius": radius
  } as React.CSSProperties;
}
