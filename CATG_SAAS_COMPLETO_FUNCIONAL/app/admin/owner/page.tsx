export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser, isPlatformOwner } from "@/lib/auth";
import { Card } from "@/components/Card";
import { planList, SUBSCRIPTION_STATUSES } from "@/lib/plans";
import { planDisplayName } from "@/services/plan-guard";
import { toggleBusinessActiveAction, updateStorePlanAction } from "../actions";
import OwnerMetricsSync from "@/components/OwnerMetricsSync";
import OwnerMetricsChart from "@/components/OwnerMetricsChart";

export default async function OwnerAdminPage() {
  const user = await requireUser();
  if (!isPlatformOwner({ email: user.email })) {
    redirect("/dashboard");
  }

  const [businesses, totalStores, activeStores, suspendedStores, planCounts, subscriptionCounts, topOrderRows] = await Promise.all([
    prisma.business.findMany({
      include: {
        owner: { select: { id: true, email: true, name: true, role: true } },
        plan: true,
        subscription: { include: { plan: true } }
      },
      orderBy: [{ createdAt: "desc" }],
      take: 200
    }),
    prisma.business.count(),
    prisma.business.count({ where: { isActive: true } }),
    prisma.business.count({ where: { isActive: false } }),
    prisma.business.groupBy({
      by: ["planType"],
      _count: { id: true }
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { id: true }
    }),
    prisma.order.groupBy({
      by: ["businessId"],
      _sum: { total: true },
      _count: { id: true },
      where: { status: "PAID" },
      orderBy: { _sum: { total: "desc" } },
      take: 5
    })
  ]);

  const topBusinessIds = topOrderRows.map((row) => row.businessId);
  const topBusinesses = await prisma.business.findMany({
    where: { id: { in: topBusinessIds } },
    select: { id: true, name: true, publicSlug: true }
  });

  const topByRevenue = topOrderRows
    .map((row) => ({
      business: topBusinesses.find((business) => business.id === row.businessId),
      total: row._sum.total ?? 0,
      orderCount: row._count.id
    }))
    .filter((entry) => entry.business)
    .sort((a, b) => b.total - a.total);

  // Additional owner-level metrics
  const mrrEstimate = topOrderRows.reduce((s, r) => s + (r._sum.total ?? 0), 0);
  const subscriptionsActive = await prisma.subscription.count({ where: { status: "active" } });
  const totalSubscriptions = await prisma.subscription.count();
  const thirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const nonActiveRecently = await prisma.subscription.count({ where: { status: { not: "active" }, updatedAt: { gte: thirty } } });
  const churnPercent = totalSubscriptions === 0 ? 0 : Math.round((nonActiveRecently / totalSubscriptions) * 1000) / 10; // one decimal
  const newStores30d = await prisma.business.count({ where: { createdAt: { gte: thirty } } });

  // Prepare historical revenue/newStores/churn (last 30 days) for the chart (compute server-side)
  const days = 30;
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const ordersInRange = await prisma.order.findMany({ where: { status: "PAID", createdAt: { gte: startDate, lte: endDate } }, select: { total: true, createdAt: true } });
  const newStoresInRange = await prisma.business.findMany({ where: { createdAt: { gte: startDate, lte: endDate } }, select: { createdAt: true } });
  const churnInRange = await prisma.subscription.findMany({ where: { status: { not: "active" }, updatedAt: { gte: startDate, lte: endDate } }, select: { updatedAt: true } });

  const revenueMap = new Map<string, number>();
  const newStoresMap = new Map<string, number>();
  const churnMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    revenueMap.set(key, 0);
    newStoresMap.set(key, 0);
    churnMap.set(key, 0);
  }
  for (const o of ordersInRange) {
    const key = o.createdAt.toISOString().slice(0, 10);
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + (o.total ?? 0));
  }
  for (const s of newStoresInRange) {
    const key = s.createdAt.toISOString().slice(0, 10);
    newStoresMap.set(key, (newStoresMap.get(key) ?? 0) + 1);
  }
  for (const c of churnInRange) {
    const key = c.updatedAt.toISOString().slice(0, 10);
    churnMap.set(key, (churnMap.get(key) ?? 0) + 1);
  }

  const entries = Array.from(revenueMap.entries());
  const historyLabels = entries.map((e) => e[0]);
  const historyValues = entries.map((e) => revenueMap.get(e[0]) ?? 0);
  const historyNewStores = entries.map((e) => newStoresMap.get(e[0]) ?? 0);
  const historyChurn = entries.map((e) => churnMap.get(e[0]) ?? 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-black">Panel del Propietario</h1>
        <p className="mt-2 text-sm text-gray-600">Acceso exclusivo para el dueño. Gestiona cuentas, planes y el estado de cada tienda.</p>
      </div>

      <section className="grid gap-6">
        <div className="grid gap-4 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">Tiendas totales</p>
            <p className="mt-3 text-3xl font-black text-gray-950">{totalStores}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Activas</p>
            <p className="mt-3 text-3xl font-black text-emerald-700">{activeStores}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Suspendidas</p>
            <p className="mt-3 text-3xl font-black text-red-700">{suspendedStores}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Planes disponibles</p>
            <p className="mt-3 text-3xl font-black text-gray-950">{planCounts.length}</p>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <h2 className="text-lg font-black">Distribución de planes</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              {planCounts.map((item) => (
                <div key={item.planType} className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                  <span>{item.planType}</span>
                  <span className="font-black">{item._count.id}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="text-lg font-black">Suscripciones</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              {subscriptionCounts.map((item) => (
                <div key={item.status} className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
                  <span>{item.status}</span>
                  <span className="font-black">{item._count.id}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-lg font-black">Top tiendas por ingresos</h2>
          <div className="mt-4 space-y-3">
            {topByRevenue.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay pedidos con pago confirmado.</p>
            ) : (
              topByRevenue.map((item) => (
                <div key={item.business?.id} className="rounded-2xl bg-gray-50 p-4">
                  <p className="font-black text-gray-950">{item.business?.name ?? "Tienda desconocida"}</p>
                  <p className="text-sm text-gray-500">Ingresos: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(item.total)}</p>
                  <p className="text-sm text-gray-500">Órdenes pagadas: {item.orderCount}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6">
        <OwnerMetricsChart initialLabels={historyLabels} initialRevenues={historyValues} initialNewStores={historyNewStores} initialChurn={historyChurn} />
      </section>

      <section className="grid gap-6">
        {
          // Compute some owner-wide metrics from DB
        }
        <div className="grid gap-4 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">MRR estimado (últimos 30d)</p>
            <p className="mt-3 text-3xl font-black text-gray-950">
              {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(mrrEstimate)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Suscripciones activas</p>
            <p className="mt-3 text-3xl font-black text-emerald-700">{subscriptionsActive}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Churn (últimos 30d)</p>
            <p className="mt-3 text-3xl font-black text-red-700">{churnPercent}%</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Nuevas tiendas (30d)</p>
            <p className="mt-3 text-3xl font-black text-gray-950">{await prisma.business.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } })}</p>
          </Card>
        </div>

            <Card>
              <h2 className="text-lg font-black">Acciones del dueño</h2>
              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <form method="post" action="/api/admin/export-owner-csv" className="flex items-center gap-2">
                    <input type="date" name="start" className="rounded-2xl border border-gray-200 px-3 py-2 text-sm" />
                    <input type="date" name="end" className="rounded-2xl border border-gray-200 px-3 py-2 text-sm" />
                    <button type="submit" className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-black">Exportar CSV</button>
                  </form>
                </div>
                <div>
                  <OwnerMetricsSync initial={{ mrrEstimate, subscriptionsActive, churnPercent, newStores30d }} />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500">Los valores se generan desde la base de datos. Ajusta filtros y exporta el informe.</p>
            </Card>
      </section>

      <section className="grid gap-6">
        {businesses.map((b) => (
          <Card key={b.id}>
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
              <div>
                <p className="text-lg font-black">{b.name}</p>
                <p className="text-sm text-gray-500">Propietario: {b.owner?.email}</p>
                <p className="text-sm text-gray-500">Tienda pública: /store/{b.publicSlug}</p>
                <p className="text-sm text-gray-500">Plan actual: {planDisplayName(b.subscription?.plan ?? b.plan, b.owner)}</p>
                <p className="text-sm text-gray-500">Estado suscripción: {b.subscription?.status ?? "active"}</p>
              </div>
              <div className="space-y-3">
                <form action={updateStorePlanAction} className="grid gap-3">
                  <input type="hidden" name="businessId" value={b.id} />
                  <label className="block text-sm font-semibold text-gray-900">Cambiar plan</label>
                  <select name="plan" defaultValue={b.subscription?.plan.type ?? b.planType} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                    {planList.map((plan) => (
                      <option key={plan.slug} value={plan.type}>{plan.name}</option>
                    ))}
                  </select>
                  <select name="status" defaultValue={b.subscription?.status ?? "active"} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                    {SUBSCRIPTION_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button type="submit" className="rounded-2xl bg-black px-4 py-3 text-sm font-black text-white">Aplicar plan</button>
                </form>
                <form action={toggleBusinessActiveAction} className="grid gap-3">
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="isActive" value={b.isActive ? "false" : "true"} />
                  <button type="submit" className={`rounded-2xl px-4 py-3 text-sm font-black ${b.isActive ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
                    {b.isActive ? "Suspender tienda" : "Reactivar tienda"}
                  </button>
                </form>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/stores/${b.id}`} className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-black">Abrir tienda</Link>
                  <Link href={`/admin/stores/${b.id}#plan`} className="rounded-2xl bg-black px-3 py-2 text-xs font-black text-white">Editar plan</Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
