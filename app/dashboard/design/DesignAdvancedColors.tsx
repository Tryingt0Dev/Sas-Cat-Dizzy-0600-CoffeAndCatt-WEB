"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDesignChangesAction } from "./actions";

function toRgba(hex: string, alpha: number) {
  let normalized = hex.replace(/^#/, "");
  if (normalized.length === 3) normalized = normalized.split("").map((c) => c + c).join("");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyCatalogPreview(colors: {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  radius: number;
}) {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  root.setProperty("--catalog-primary", colors.primary);
  root.setProperty("--catalog-primary-hover", colors.secondary);
  root.setProperty("--catalog-secondary", colors.secondary);
  root.setProperty("--catalog-accent", colors.accent);
  root.setProperty("--catalog-bg", colors.background);
  root.setProperty("--catalog-surface", "#FFFFFF");
  root.setProperty("--catalog-text", colors.text);
  root.setProperty("--catalog-text-muted", toRgba(colors.text, 0.65));
  root.setProperty("--catalog-muted", toRgba(colors.background, 0.6));
  root.setProperty("--catalog-border", toRgba(colors.accent, 0.3));
  root.setProperty("--catalog-radius", `${colors.radius}px`);
}

export function DesignAdvancedColors({
  storeId,
  canUseAdvancedBranding,
  initialPrimary,
  initialSecondary,
  initialAccent,
  initialBackground,
  initialText,
  initialButtonRadius
}: {
  storeId: string;
  canUseAdvancedBranding: boolean;
  initialPrimary: string;
  initialSecondary: string;
  initialAccent: string;
  initialBackground: string;
  initialText: string;
  initialButtonRadius: number;
}) {
  const [open, setOpen] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(initialPrimary);
  const [secondaryColor, setSecondaryColor] = useState(initialSecondary);
  const [accentColor, setAccentColor] = useState(initialAccent);
  const [backgroundColor, setBackgroundColor] = useState(initialBackground);
  const [textColor, setTextColor] = useState(initialText);
  const [buttonRadius, setButtonRadius] = useState(initialButtonRadius);
  const [saved, setSaved] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleColorChange(field: string, value: string | number) {
    setSaved(false);
    const next = {
      primary: field === "primary" ? String(value) : primaryColor,
      secondary: field === "secondary" ? String(value) : secondaryColor,
      accent: field === "accent" ? String(value) : accentColor,
      background: field === "background" ? String(value) : backgroundColor,
      text: field === "text" ? String(value) : textColor,
      radius: field === "radius" ? Number(value) : buttonRadius
    };
    if (field === "primary") setPrimaryColor(String(value));
    else if (field === "secondary") setSecondaryColor(String(value));
    else if (field === "accent") setAccentColor(String(value));
    else if (field === "background") setBackgroundColor(String(value));
    else if (field === "text") setTextColor(String(value));
    else if (field === "radius") setButtonRadius(Number(value));
    applyCatalogPreview(next);
  }

  function handleSave() {
    const formData = new FormData();
    formData.set("storeId", storeId);
    formData.set("primaryColor", primaryColor);
    formData.set("secondaryColor", secondaryColor);
    formData.set("accentColor", accentColor);
    formData.set("backgroundColor", backgroundColor);
    formData.set("textColor", textColor);
    formData.set("buttonRadius", String(buttonRadius));
    startTransition(async () => {
      await saveDesignChangesAction(null, formData);
      setSaved(true);
      router.refresh();
    });
  }

  if (!canUseAdvancedBranding) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black">Colores avanzados</p>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-bold text-amber-700">Premium/Business</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
          El ajuste manual de colores del catálogo requiere un plan superior. La paleta seleccionada define los colores automáticamente.
        </p>
        <a href="/settings/billing" className="mt-3 inline-flex rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-black">
          Ver planes
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl p-4 text-left transition hover:bg-[var(--app-surface-muted)]"
      >
        <div>
          <p className="text-sm font-black text-[var(--app-text)]">Ajustes avanzados de color</p>
          <p className="mt-0.5 text-xs text-[var(--app-text-muted)]">Sobrescribe los colores de la paleta con valores manuales.</p>
        </div>
        <span className="text-xs font-bold text-[var(--app-text-muted)] transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▼
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--app-border)] p-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <label className="text-xs font-bold text-[var(--app-text-muted)]">
              Principal
              <input
                name="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => handleColorChange("primary", e.target.value)}
                className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
              />
            </label>
            <label className="text-xs font-bold text-[var(--app-text-muted)]">
              Secundario
              <input
                name="secondaryColor"
                type="color"
                value={secondaryColor}
                onChange={(e) => handleColorChange("secondary", e.target.value)}
                className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
              />
            </label>
            <label className="text-xs font-bold text-[var(--app-text-muted)]">
              Acento
              <input
                name="accentColor"
                type="color"
                value={accentColor}
                onChange={(e) => handleColorChange("accent", e.target.value)}
                className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
              />
            </label>
            <label className="text-xs font-bold text-[var(--app-text-muted)]">
              Fondo
              <input
                name="backgroundColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => handleColorChange("background", e.target.value)}
                className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
              />
            </label>
            <label className="text-xs font-bold text-[var(--app-text-muted)]">
              Texto
              <input
                name="textColor"
                type="color"
                value={textColor}
                onChange={(e) => handleColorChange("text", e.target.value)}
                className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
              />
            </label>
          </div>

          <div className="mt-3">
            <label className="text-xs font-bold text-[var(--app-text-muted)]">
              Radio de botones
              <input
                name="buttonRadius"
                type="number"
                min={0}
                max={32}
                value={buttonRadius}
                onChange={(e) => handleColorChange("radius", e.target.value)}
                className="mt-1.5 h-9 w-full max-w-[200px] rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-text)] shadow-sm focus:border-[var(--app-primary)] focus:outline-none"
              />
            </label>
          </div>

          <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
            <p className="text-xs font-semibold text-[var(--app-text-muted)]">Vista previa de sobreescritura</p>
            <div className="mt-2 grid gap-2 grid-cols-5">
              <div className="h-8 rounded-lg" style={{ backgroundColor: primaryColor }} />
              <div className="h-8 rounded-lg" style={{ backgroundColor: secondaryColor }} />
              <div className="h-8 rounded-lg" style={{ backgroundColor: accentColor }} />
              <div className="h-8 rounded-lg" style={{ backgroundColor: backgroundColor, border: "1px solid var(--app-border)" }} />
              <div className="h-8 rounded-lg" style={{ backgroundColor: textColor }} />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
            <p className="text-xs text-[var(--app-text-muted)]">
              {saved ? "Sin cambios pendientes" : "Tienes cambios sin guardar en los colores avanzados."}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saved || isPending}
              className="rounded-xl bg-[var(--app-primary)] px-4 py-2 text-xs font-black text-[var(--app-button-text)] shadow-sm transition hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Guardar colores"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
