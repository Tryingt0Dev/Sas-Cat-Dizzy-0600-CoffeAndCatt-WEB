import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  FEATURE_KEYS,
  canUseFeature,
  commercialPlans,
  formatPlanLimit,
  getPlanEntitlements,
  normalizePlanSlug,
  normalizeSubscriptionStatus,
  planList,
  type PlanSlug,
  type PlanLimitValue
} from "@/lib/plans";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatusAlert } from "@/components/StatusAlert";
import { requireStoreAccess } from "@/services/authorization";
import { writeAuditLog } from "@/services/audit-log";
import { requestPlanUpgradeAction } from "./actions";

type BillingSearchParams = {
  success?: string;
  error?: string;
};

const subscriptionStatusLabels: Record<string, string> = {
  active: "Activa",
  trialing: "Trial",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  expired: "Expirada"
};

const comparisonRows = [
  { label: "Productos", kind: "limit", key: "maxProducts" },
  { label: "Usuarios por tienda", kind: "limit", key: "maxUsersPerStore" },
  { label: "Tiendas", kind: "limit", key: "maxStores" },
  { label: "IA avanzada", kind: "feature", key: FEATURE_KEYS.aiAdvanced },
  { label: "Analytics avanzado", kind: "feature", key: FEATURE_KEYS.analyticsAdvanced },
  { label: "Automatizaciones", kind: "feature", key: FEATURE_KEYS.automationsUse },
  { label: "Importacion masiva", kind: "feature", key: FEATURE_KEYS.productsBulkImport },
  { label: "Integraciones avanzadas", kind: "feature", key: FEATURE_KEYS.integrationsAdvanced },
  { label: "Dominio personalizado", kind: "feature", key: FEATURE_KEYS.customDomainUse },
  { label: "Paletas de catalogo", kind: "feature", key: FEATURE_KEYS.catalogPaletteChange },
  { label: "Tema SaaS", kind: "feature", key: FEATURE_KEYS.saasThemeChange }
] as const;

function statusLabel(status: string | null | undefined) {
  return subscriptionStatusLabels[normalizeSubscriptionStatus(status)] ?? "Activa";
}

function formatStorage(value: PlanLimitValue) {
  if (value === "unlimited") return "Ilimitado";
  if (value >= 1024) return `${Math.round((value / 1024) * 10) / 10} GB`;
  return `${value} MB`;
}

function usageLine(label: string, used: number, max: PlanLimitValue) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-gray-950">{used} / {formatPlanLimit(max)}</p>
    </div>
  );
}

function featureCell(plan: PlanSlug, row: (typeof comparisonRows)[number]) {
  const entitlements = getPlanEntitlements(plan);
  if (row.kind === "limit") {
    return formatPlanLimit(entitlements[row.key]);
  }
  return canUseFeature(plan, row.key) ? "Incluido" : "No incluido";
}

export default async function BillingSettingsPage({ searchParams }: { searchParams?: Promise<BillingSearchParams | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { user, business } = await requireStoreAccess({ permission: "manage_settings" });
  const billingBusiness = await prisma.business.findUnique({
    where: { id: business.id },
    include: {
      owner: { select: { id: true } },
      plan: true,
      subscription: { include: { plan: true } },
      _count: { select: { products: true, memberships: true } }
    }
  });

  const ownerStoreCount = await prisma.business.count({ where: { ownerId: business.ownerId } });
  const currentPlan = normalizePlanSlug(billingBusiness?.subscription?.plan.type ?? billingBusiness?.plan?.type ?? business.planType);
  const currentPlanDefinition = commercialPlans[currentPlan];
  const currentEntitlements = getPlanEntitlements(currentPlan);
  const subscriptionStatus = statusLabel(billingBusiness?.subscription?.status);

  await writeAuditLog({
    userId: user.id,
    businessId: business.id,
    action: "billing.viewed",
    resourceType: "Billing",
    resourceId: business.id,
    metadata: { plan: currentPlan, status: normalizeSubscriptionStatus(billingBusiness?.subscription?.status) }
  });

  return (
    <main className="min-h-screen bg-[var(--app-bg)] px-4 py-10 text-[var(--app-text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          eyebrow="Billing"
          title="Plan y limites"
          description="Revisa el plan comercial de esta tienda, sus limites y el uso actual sin mezclarlo con roles operativos."
          actions={
            <Link href="/dashboard" className="rounded-2xl bg-[var(--app-surface)] px-4 py-2 text-sm font-black text-[var(--app-text)] shadow-sm hover:bg-[var(--app-surface-muted)]">
              Volver al dashboard
            </Link>
          }
        />
        <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />

        <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <Card>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Plan actual</p>
                <h2 className="mt-2 text-3xl font-black text-gray-950">{currentPlanDefinition.name}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">{currentPlanDefinition.description}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Estado</p>
                <p className="mt-2 text-2xl font-black text-gray-950">{subscriptionStatus}</p>
                <p className="mt-2 text-sm text-gray-500">No hay cobro automatizado activo desde esta pantalla.</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Tienda</p>
                <p className="mt-2 text-2xl font-black text-gray-950">{business.name}</p>
                <p className="mt-2 text-sm text-gray-500">/{business.publicSlug}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black text-gray-950">Uso actual</h2>
            <div className="mt-4 space-y-3">
              {usageLine("Productos", billingBusiness?._count.products ?? 0, currentEntitlements.maxProducts)}
              {usageLine("Usuarios", billingBusiness?._count.memberships ?? 1, currentEntitlements.maxUsersPerStore)}
              {usageLine("Tiendas owner", ownerStoreCount, currentEntitlements.maxStores)}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {planList.map((plan) => {
            const entitlements = getPlanEntitlements(plan.slug);
            const isCurrent = plan.slug === currentPlan;
            return (
              <Card key={plan.slug} className={isCurrent ? "border-gray-950" : undefined}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-gray-950">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-500">{plan.description}</p>
                  </div>
                  {isCurrent ? <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">Actual</span> : null}
                </div>
                <div className="mt-5 grid gap-2 text-sm text-gray-600">
                  <p><strong className="text-gray-950">{formatPlanLimit(entitlements.maxProducts)}</strong> productos</p>
                  <p><strong className="text-gray-950">{formatPlanLimit(entitlements.maxUsersPerStore)}</strong> usuarios por tienda</p>
                  <p><strong className="text-gray-950">{formatStorage(entitlements.maxStorageMb)}</strong> almacenamiento</p>
                  <p><strong className="text-gray-950">{entitlements.aiAssistant}</strong> IA</p>
                </div>
                {isCurrent ? (
                  <button disabled className="mt-6 w-full rounded-2xl bg-gray-100 px-4 py-3 text-sm font-black text-gray-500">Plan actual</button>
                ) : (
                  <form action={requestPlanUpgradeAction} className="mt-6">
                    <input type="hidden" name="businessId" value={business.id} />
                    <input type="hidden" name="requestedPlan" value={plan.slug} />
                    <button className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-black text-white">
                      {plan.slug === "business" ? "Contactar Business" : `Solicitar ${plan.name}`}
                    </button>
                  </form>
                )}
              </Card>
            );
          })}
        </section>

        <Card>
          <h2 className="text-xl font-black text-gray-950">Comparacion de capacidades</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Capacidad</th>
                  {planList.map((plan) => <th key={plan.slug}>{plan.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-gray-100">
                    <td className="py-4 font-black text-gray-950">{row.label}</td>
                    {planList.map((plan) => <td key={plan.slug}>{featureCell(plan.slug, row)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}
