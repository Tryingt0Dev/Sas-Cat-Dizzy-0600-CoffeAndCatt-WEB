"use client";

import { useEffect, useState } from "react";

function toRgba(hex: string, alpha: number) {
  let normalized = hex.replace(/^#/, "");
  if (normalized.length === 3) {
    normalized = normalized.split("").map((char) => char + char).join("");
  }
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function LiveThemeColorControls({
  initialPrimary,
  initialSecondary,
  initialAccent,
  initialBackground,
  initialText,
  initialButtonRadius
}: {
  initialPrimary: string;
  initialSecondary: string;
  initialAccent: string;
  initialBackground: string;
  initialText: string;
  initialButtonRadius: number;
}) {
  const [primaryColor, setPrimaryColor] = useState(initialPrimary);
  const [secondaryColor, setSecondaryColor] = useState(initialSecondary);
  const [accentColor, setAccentColor] = useState(initialAccent);
  const [backgroundColor, setBackgroundColor] = useState(initialBackground);
  const [textColor, setTextColor] = useState(initialText);
  const [buttonRadius, setButtonRadius] = useState(initialButtonRadius);

  const updateThemeVars = () => {
    const root = document.documentElement.style;
    root.setProperty("--app-primary", primaryColor);
    root.setProperty("--app-accent", accentColor);
    root.setProperty("--app-bg", backgroundColor);
    root.setProperty("--app-surface", backgroundColor);
    root.setProperty("--app-surface-muted", toRgba(backgroundColor, 0.9));
    root.setProperty("--app-text", textColor);
    root.setProperty("--app-text-muted", toRgba(textColor, 0.65));
    root.setProperty("--app-border", accentColor);
    root.setProperty("--app-primary-hover", accentColor);
    root.setProperty("--app-button-text", textColor);
    root.setProperty("--app-button-radius", `${buttonRadius}px`);
  };

  useEffect(() => {
    updateThemeVars();
  }, [primaryColor, secondaryColor, accentColor, backgroundColor, textColor, buttonRadius]);

  return (
    <div className="space-y-4">
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        <label className="text-xs font-bold text-[var(--app-text-muted)]">
          Principal
          <input
            name="primaryColor"
            type="color"
            value={primaryColor}
            onChange={(event) => setPrimaryColor(event.target.value)}
            className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
          />
        </label>
        <label className="text-xs font-bold text-[var(--app-text-muted)]">
          Secundario
          <input
            name="secondaryColor"
            type="color"
            value={secondaryColor}
            onChange={(event) => setSecondaryColor(event.target.value)}
            className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
          />
        </label>
        <label className="text-xs font-bold text-[var(--app-text-muted)]">
          Acento
          <input
            name="accentColor"
            type="color"
            value={accentColor}
            onChange={(event) => setAccentColor(event.target.value)}
            className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
          />
        </label>
        <label className="text-xs font-bold text-[var(--app-text-muted)]">
          Fondo
          <input
            name="backgroundColor"
            type="color"
            value={backgroundColor}
            onChange={(event) => setBackgroundColor(event.target.value)}
            className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
          />
        </label>
        <label className="text-xs font-bold text-[var(--app-text-muted)]">
          Texto
          <input
            name="textColor"
            type="color"
            value={textColor}
            onChange={(event) => setTextColor(event.target.value)}
            className="mt-1.5 h-9 w-full cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs font-bold text-[var(--app-text-muted)]">
          Radio botones
          <input
            name="buttonRadius"
            type="number"
            min={0}
            max={32}
            value={buttonRadius}
            onChange={(event) => setButtonRadius(Number(event.target.value))}
            className="mt-1.5 h-9 w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-text)] shadow-sm focus:border-[var(--app-primary)] focus:outline-none"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 shadow-sm">
        <p className="text-sm font-black text-[var(--app-text)]">Vista previa en vivo</p>
        <div className="mt-3 space-y-3 rounded-2xl border border-[var(--app-border)] p-4" style={{ backgroundColor: backgroundColor, color: textColor }}>
          <div className="rounded-2xl p-3" style={{ backgroundColor: primaryColor, color: textColor }}>
            <p className="text-sm font-black">Botón principal</p>
          </div>
          <div className="rounded-2xl bg-[var(--app-surface)] p-3" style={{ borderColor: accentColor, borderWidth: 1, borderStyle: "solid" }}>
            <p className="text-sm font-black" style={{ color: accentColor }}>Color de acento</p>
          </div>
          <button
            type="button"
            className="h-9 rounded-full px-3 text-sm font-black"
            style={{ backgroundColor: secondaryColor, color: textColor, borderRadius: `${buttonRadius}px` }}
          >
            Botón secundario
          </button>
        </div>
      </div>
    </div>
  );
}
