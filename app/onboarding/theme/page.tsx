"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saasThemes } from "@/lib/themes/saas-themes";
import type { SaaSTheme } from "@/lib/themes/saas-themes";
import { selectSaaSThemeAction } from "./actions";

function ThemePreview({ theme }: { theme: SaaSTheme }) {
  const c = theme.colors;
  return (
    <div
      className="rounded-2xl border p-2 shadow-inner"
      style={{ backgroundColor: c.background, borderColor: c.border, color: c.text }}
    >
      <div
        className="grid min-h-40 min-w-0 grid-cols-[52px_minmax(0,1fr)] overflow-hidden rounded-2xl border shadow-sm sm:grid-cols-[64px_minmax(0,1fr)]"
        style={{ borderColor: c.border, backgroundColor: c.surface }}
      >
        {/* Sidebar */}
        <div className="space-y-2 p-2.5" style={{ backgroundColor: c.surfaceMuted }}>
          <span className="block h-7 w-7 rounded-xl" style={{ backgroundColor: c.primary }} />
          <span className="block h-2.5 rounded-full" style={{ backgroundColor: c.primary }} />
          <span className="block h-2.5 rounded-full opacity-60" style={{ backgroundColor: c.textMuted }} />
          <span className="block h-2.5 rounded-full opacity-60" style={{ backgroundColor: c.textMuted }} />
        </div>
        {/* Content */}
        <div className="min-w-0 space-y-2.5 p-3">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <span className="block h-2.5 w-24 rounded-full" style={{ backgroundColor: c.text }} />
              <span className="block h-1.5 w-2/3 rounded-full opacity-60" style={{ backgroundColor: c.textMuted }} />
            </div>
            <span className="h-8 w-12 rounded-xl" style={{ backgroundColor: c.primary }} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border p-2.5" style={{ borderColor: c.border, backgroundColor: c.background }}>
              <span className="block h-1.5 w-14 rounded-full" style={{ backgroundColor: c.accent }} />
              <span className="mt-3 block h-7 rounded-xl" style={{ backgroundColor: c.surface }} />
            </div>
            <div className="rounded-2xl border p-2.5" style={{ borderColor: c.border, backgroundColor: c.background }}>
              <span className="block h-1.5 w-12 rounded-full" style={{ backgroundColor: c.success }} />
              <span className="mt-3 block h-7 rounded-xl" style={{ backgroundColor: c.surface }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-4 w-4 rounded-full border border-white shadow-sm"
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

export default function OnboardingThemePage() {
  const [selectedSlug, setSelectedSlug] = useState("violet-premium");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedTheme = saasThemes.find((t) => t.slug === selectedSlug) ?? saasThemes[0];

  function handleSave() {
    const formData = new FormData();
    formData.set("themeSlug", selectedSlug);
    startTransition(async () => {
      await selectSaaSThemeAction(formData);
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 rounded-3xl bg-white p-8 shadow-sm border border-gray-200">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-600">Onboarding</p>
          <h1 className="mt-4 text-4xl font-black text-gray-900">Elige el diseno del panel</h1>
          <p className="mt-4 max-w-2xl text-base text-gray-500">
            Selecciona el tema del SaaS que usaras dentro del dashboard. Podras cambiarlo despues desde configuracion.
          </p>
        </div>

        {/* Theme cards */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-600">Disenos disponibles</p>
              <h2 className="mt-3 text-2xl font-black text-gray-900">3 temas listos para tu SaaS</h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {saasThemes.map((theme) => {
                const isSelected = theme.slug === selectedSlug;
                const c = theme.colors;

                return (
                  <button
                    key={theme.slug}
                    type="button"
                    onClick={() => setSelectedSlug(theme.slug)}
                    className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200"
                    }`}
                  >
                    {/* Preview area */}
                    <div className="p-4">
                      <ThemePreview theme={theme} />
                    </div>

                    {/* Info area */}
                    <div className="px-4 pb-3">
                      <p className="text-base font-black text-gray-900">{theme.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{theme.description}</p>
                    </div>

                    {/* Color dots */}
                    <div className="px-4 pb-3 flex items-center gap-1.5">
                      {theme.preview.map((color, i) => (
                        <ColorDot key={i} color={color} />
                      ))}
                    </div>

                    {/* Selection indicator */}
                    <div
                      className={`px-4 py-3 text-center text-sm font-black transition-colors ${
                        isSelected ? "text-white" : "text-gray-600"
                      }`}
                      style={isSelected ? { backgroundColor: c.primary } : { backgroundColor: "#F3F4F6" }}
                    >
                      {isSelected ? "Seleccionado" : "Seleccionar diseno"}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action bar */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    Tema seleccionado:{" "}
                    <span className="font-black text-gray-900">{selectedTheme.name}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Continuar al panel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
