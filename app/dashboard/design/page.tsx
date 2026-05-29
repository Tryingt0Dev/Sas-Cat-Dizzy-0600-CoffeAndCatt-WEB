import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAccessibleBusinesses } from "@/services/authorization";
import { getBusinessPlan, allowedTemplatesForPlan } from "@/services/plan-guard";
import { defaultCatalogPaletteSlug } from "@/lib/themes/theme-utils";
import { PageHeader } from "@/components/PageHeader";
import { StatusAlert } from "@/components/StatusAlert";
import { DesignPageClient } from "./DesignPageClient";

export default async function DashboardDesignPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string; saved?: string; storeId?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const user = await requireUser();
  const stores = await getAccessibleBusinesses();
  const selectedStoreId = resolvedSearchParams?.storeId ? String(resolvedSearchParams.storeId).trim() : stores[0]?.id;
  const selectedStore = stores.find((s) => s.id === selectedStoreId) ?? stores[0] ?? null;

  if (!selectedStore) {
    return (
      <main className="min-h-screen bg-[var(--app-bg)] px-3 py-6 text-[var(--app-text)] sm:px-5 lg:px-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <PageHeader eyebrow="Diseño" title="Diseño" description="Personaliza los colores del panel interno y del catálogo público." />
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 text-sm text-[var(--app-text-muted)]">
            <p className="font-black text-[var(--app-text)]">No se encontró una tienda para personalizar</p>
            <p className="mt-2">Asegúrate de contar con permisos de tienda o selecciona una tienda disponible.</p>
          </div>
        </div>
      </main>
    );
  }

  const initialPalette = selectedStore.catalogPalette ?? defaultCatalogPaletteSlug;
  const initialTemplate = selectedStore.catalogTemplate;
  const initialSaaSTheme = user.saasTheme ?? "violet-premium";

  const businessWithPlan = await prisma.business.findUnique({
    where: { id: selectedStore.id },
    include: { plan: true, subscription: { include: { plan: true } } }
  });
  const effectivePlan = getBusinessPlan(businessWithPlan, user);
  const allowedTemplates = allowedTemplatesForPlan(effectivePlan);
  const canUseAdvancedBranding = Boolean(effectivePlan.advancedBranding);

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-3 py-6 text-[var(--app-text)] sm:px-5 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <PageHeader
          eyebrow="Diseño"
          title="Diseño"
          description="Personaliza los colores del panel interno y del catálogo público de tu tienda."
          actions={
            <Link href="/dashboard" className="inline-flex h-9 items-center rounded-2xl bg-[var(--app-surface)] px-3 text-sm font-black text-[var(--app-text)] shadow-sm hover:bg-[var(--app-surface-muted)]">
              Volver al panel
            </Link>
          }
        />

        <StatusAlert
          success={resolvedSearchParams?.saved === "1" ? "Cambios guardados correctamente." : resolvedSearchParams?.success}
          error={resolvedSearchParams?.error}
        />

        <DesignPageClient
          initialSaaSTheme={initialSaaSTheme}
          initialPalette={initialPalette}
          initialTemplate={initialTemplate}
          store={{
            id: selectedStore.id,
            name: selectedStore.name,
            publicSlug: selectedStore.publicSlug,
            catalogTemplate: selectedStore.catalogTemplate,
            primaryColor: selectedStore.primaryColor,
            secondaryColor: selectedStore.secondaryColor,
            accentColor: selectedStore.accentColor,
            backgroundColor: selectedStore.backgroundColor,
            textColor: selectedStore.textColor,
            buttonRadius: selectedStore.buttonRadius
          }}
          stores={stores.map((s) => ({ id: s.id, name: s.name }))}
          allowedTemplates={allowedTemplates}
          canUseAdvancedBranding={canUseAdvancedBranding}
        />
      </div>
    </main>
  );
}
