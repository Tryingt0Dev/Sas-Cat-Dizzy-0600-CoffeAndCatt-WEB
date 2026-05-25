import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { saasThemes } from "@/lib/themes/saas-themes";
import { selectSaaSThemeAction } from "./actions";
import { SaaSThemeSelector } from "@/components/theme/SaaSThemeSelector";
import { Card } from "@/components/Card";

export default async function OnboardingThemePage({ searchParams }: { searchParams?: Promise<{ error?: string; success?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireUser();
  if (user.themeOnboardingCompleted) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[var(--app-bg)] py-16 px-4 text-[var(--app-text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-[var(--app-surface)] p-8 shadow-sm border border-[var(--app-border)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--app-primary)]">Onboarding</p>
          <h1 className="mt-4 text-4xl font-black text-[var(--app-text)]">Elige el diseño del panel</h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--app-text-muted)]">Selecciona el tema del SaaS que usarás dentro del dashboard. Podrás cambiarlo después desde configuración.</p>
          {resolvedSearchParams?.error ? (
            <div className="mt-6 rounded-3xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{resolvedSearchParams.error}</div>
          ) : null}
          {resolvedSearchParams?.success ? (
            <div className="mt-6 rounded-3xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{resolvedSearchParams.success}</div>
          ) : null}
        </div>

        <Card className="border-[var(--app-border)] bg-[var(--app-surface)]">
          <div className="space-y-8">
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--app-primary)]">Diseños disponibles</p>
                <h2 className="mt-3 text-2xl font-black text-[var(--app-text)]">3 temas listos para tu SaaS</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--app-text-muted)]">
                {user.email}
              </span>
            </div>
            <SaaSThemeSelector themes={saasThemes} selectedSlug={user.saasTheme ?? "violet-premium"} action={selectSaaSThemeAction} selectedActionLabel="Usar este diseño" />
          </div>
        </Card>
      </div>
    </main>
  );
}
