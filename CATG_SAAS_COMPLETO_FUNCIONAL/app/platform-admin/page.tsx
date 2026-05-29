import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Card } from "@/components/Card";
import { CompactCard } from "@/components/CompactCard";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { EmptyState } from "@/components/EmptyState";
import { Input, Select } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { StatusAlert } from "@/components/StatusAlert";
import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/db";
import { PLAN_SLUGS, SUBSCRIPTION_STATUSES, formatPlanLimit } from "@/lib/plans";
import {
  PLATFORM_ADMIN_ROLES,
  PRIMARY_PLATFORM_OWNER_EMAIL,
  canManagePlatformBilling,
  canManagePlatformStores,
  isPrimaryPlatformOwnerEmail,
  listPlatformAdminAccesses,
  requirePlatformAdmin,
  type PlatformAdminAccess
} from "@/lib/platform-admin";
import {
  addPlatformAdminAccessAction,
  deletePlatformAdminAccessAction,
  updateBusinessStatusPlatformAction,
  updateBusinessSubscriptionPlatformAction,
  updatePlanLimitsPlatformAction,
  updatePlatformAdminAccessAction
} from "./actions";
import { PlatformAccessUserPicker } from "./PlatformAccessUserPicker";

type PlatformAdminSearchParams = {
  success?: string;
  error?: string;
  q?: string;
  plan?: string;
  status?: string;
  userQ?: string;
};

function cleanParam(value: string | undefined, max = 100) {
  return String(value ?? "").trim().slice(0, max);
}

function dateLabel(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function inputDate(date: Date | null | undefined) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function limitLabel(value: number) {
  return value < 0 ? "Ilimitado" : formatPlanLimit(value);
}

function storeStatus(business: { isActive: boolean; subscription?: { status: string } | null }) {
  if (!business.isActive) return "suspended";
  const status = business.subscription?.status ?? "active";
  if (status === "trialing") return "trial";
  if (status === "past_due") return "past_due";
  if (status === "canceled" || status === "expired") return "cancelled";
  return "active";
}

function statusVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "trial") return "info" as const;
  if (status === "past_due") return "warning" as const;
  if (status === "suspended" || status === "cancelled") return "danger" as const;
  return "neutral" as const;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Activa",
    trial: "Prueba",
    past_due: "Pago pendiente",
    suspended: "Suspendida",
    cancelled: "Cancelada"
  };
  return labels[status] ?? status;
}

function canRenderAccessForm(item: PlatformAdminAccess, current: PlatformAdminAccess) {
  if (item.source !== "database" || isPrimaryPlatformOwnerEmail(item.email)) return false;
  if (current.role === "OWNER") return true;
  return current.role === "ADMIN" && item.role !== "OWNER";
}

function accessRolesFor(current: PlatformAdminAccess) {
  return PLATFORM_ADMIN_ROLES.filter((role) => current.role === "OWNER" || role !== "OWNER");
}

function lockedAccessMessage(item: PlatformAdminAccess, current: PlatformAdminAccess) {
  if (isPrimaryPlatformOwnerEmail(item.email)) return "El dueño principal no se puede eliminar ni desactivar.";
  if (item.source !== "database") return "Este acceso se controla por configuración de entorno.";
  if (item.role === "OWNER" && current.role !== "OWNER") return "Solo OWNER puede editar otro acceso OWNER.";
  return "Tu rol no permite editar este acceso.";
}

export default async function PlatformAdminPage({ searchParams }: { searchParams?: Promise<PlatformAdminSearchParams | undefined> }) {
  const { access } = await requirePlatformAdmin();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const q = cleanParam(resolvedSearchParams?.q);
  const planFilter = cleanParam(resolvedSearchParams?.plan);
  const statusFilter = cleanParam(resolvedSearchParams?.status);
  const userQ = cleanParam(resolvedSearchParams?.userQ);
  const canManageStores = canManagePlatformStores(access);
  const canManageBilling = canManagePlatformBilling(access);
  const canGrantAccess = access.enabled && (access.role === "OWNER" || access.role === "ADMIN");
  const canGrantOwner = access.enabled && access.role === "OWNER";

  const storeWhere: Prisma.BusinessWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { publicSlug: { contains: q } },
            { owner: { email: { contains: q } } },
            { plan: { name: { contains: q } } }
          ]
        }
      : {}),
    ...(planFilter ? { OR: [{ planType: planFilter }, { plan: { type: planFilter } }] } : {})
  };

  const userWhere: Prisma.UserWhereInput = userQ
    ? { OR: [{ email: { contains: userQ } }, { name: { contains: userQ } }, { role: { contains: userQ } }] }
    : {};

  const [
    totalStores,
    totalUsers,
    totalPlans,
    activeSubscriptions,
    suspendedStores,
    trialStores,
    premiumBusinessStores,
    storesRaw,
    subscriptions,
    plans,
    users,
    auditLogs,
    adminAccesses
  ] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.plan.count(),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.business.count({ where: { isActive: false } }),
    prisma.business.count({ where: { subscription: { status: "trialing" } } }),
    prisma.business.count({ where: { OR: [{ planType: { in: ["premium", "business"] } }, { plan: { type: { in: ["premium", "business"] } } }] } }),
    prisma.business.findMany({
      where: storeWhere,
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        plan: true,
        subscription: { include: { plan: true } },
        _count: { select: { products: true, memberships: true, auditLogs: true } }
      },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      take: 80
    }),
    prisma.subscription.findMany({
      include: {
        plan: true,
        business: { select: { id: true, name: true, publicSlug: true, owner: { select: { email: true } } } }
      },
      orderBy: { updatedAt: "desc" },
      take: 80
    }),
    prisma.plan.findMany({ orderBy: { maxProducts: "asc" } }),
    prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        businesses: { select: { id: true, name: true, publicSlug: true }, take: 3 },
        memberships: { select: { role: true, business: { select: { id: true, name: true, publicSlug: true } } }, take: 3 }
      },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    prisma.auditLog.findMany({
      include: { user: { select: { email: true, name: true } }, business: { select: { name: true, publicSlug: true } } },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    listPlatformAdminAccesses()
  ]);

  const stores = statusFilter ? storesRaw.filter((business) => storeStatus(business) === statusFilter) : storesRaw;
  const alertCount = suspendedStores + subscriptions.filter((subscription) => subscription.status === "past_due").length;
  const metrics = [
    ["Tiendas", totalStores],
    ["Usuarios", totalUsers],
    ["Planes", totalPlans],
    ["Suscripciones activas", activeSubscriptions],
    ["Tiendas suspendidas", suspendedStores],
    ["Tiendas en prueba", trialStores],
    ["Premium/Business", premiumBusinessStores],
    ["Alertas", alertCount]
  ] as const;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plataforma"
        title="Administración global"
        description="Centro seguro para gestionar tiendas, suscripciones, planes, usuarios, accesos globales y auditoría."
      />
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />

      <section id="resumen" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <CompactCard key={label}>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">{label}</p>
            <p className="mt-1 text-2xl font-black">{value}</p>
          </CompactCard>
        ))}
      </section>

      <Card id="tiendas" className="p-3">
        <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-base font-black">Gestión de tiendas</h2>
            <p className="text-xs text-[var(--app-text-muted)]">Busca por tienda, dueño, slug, plan o estado sin mezclar datos entre tenants.</p>
          </div>
          <form className="grid gap-2 md:grid-cols-[220px_140px_150px_auto]" action="/platform-admin#tiendas">
            <Input name="q" defaultValue={q} placeholder="Buscar tienda o dueño" className="py-2" />
            <Select name="plan" defaultValue={planFilter} className="py-2">
              <option value="">Plan</option>
              {PLAN_SLUGS.map((plan) => <option key={plan} value={plan}>{plan.toUpperCase()}</option>)}
            </Select>
            <Select name="status" defaultValue={statusFilter} className="py-2">
              <option value="">Estado</option>
              <option value="active">Activa</option>
              <option value="trial">Prueba</option>
              <option value="past_due">Pago pendiente</option>
              <option value="suspended">Suspendida</option>
              <option value="cancelled">Cancelada</option>
            </Select>
            <button className="rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-black text-[var(--app-button-text)]">Filtrar</button>
          </form>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--app-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--app-surface-muted)] text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
              <tr>
                <th className="px-3 py-2">Tienda</th>
                <th className="px-3 py-2">Dueño</th>
                <th className="px-3 py-2">Plan</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Datos</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {stores.map((business) => {
                const computedStatus = storeStatus(business);
                return (
                  <tr key={business.id} className="align-top">
                    <td className="px-3 py-3">
                      <p className="font-black">{business.name}</p>
                      <p className="text-xs text-[var(--app-text-muted)]">/store/{business.publicSlug}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold">{business.owner.name}</p>
                      <p className="text-xs text-[var(--app-text-muted)]">{business.owner.email}</p>
                    </td>
                    <td className="px-3 py-3 text-xs font-bold">{(business.subscription?.plan.type ?? business.plan?.type ?? business.planType).toUpperCase()}</td>
                    <td className="px-3 py-3"><StatusBadge variant={statusVariant(computedStatus)}>{statusLabel(computedStatus)}</StatusBadge></td>
                    <td className="px-3 py-3 text-xs text-[var(--app-text-muted)]">
                      {business._count.products} productos<br />
                      {business._count.memberships + 1} usuarios<br />
                      {business._count.auditLogs} eventos
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex min-w-[420px] flex-wrap justify-end gap-2">
                        <Link href={`/admin/stores/${business.id}`} className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-black">Detalle</Link>
                        {canManageStores ? (
                          <form action={updateBusinessStatusPlatformAction} className="flex gap-2">
                            <input type="hidden" name="businessId" value={business.id} />
                            <input type="hidden" name="isActive" value={business.isActive ? "false" : "true"} />
                            <input type="hidden" name="reason" value="Cambio manual desde admin plataforma" />
                            <ConfirmSubmitButton message={business.isActive ? `Suspender ${business.name}?` : `Reactivar ${business.name}?`} className={business.isActive ? "rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white" : "rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"}>
                              {business.isActive ? "Suspender" : "Reactivar"}
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}
                        {canManageBilling ? (
                          <form action={updateBusinessSubscriptionPlatformAction} className="flex flex-wrap justify-end gap-2">
                            <input type="hidden" name="businessId" value={business.id} />
                            <Select name="plan" defaultValue={business.subscription?.plan.type ?? business.plan?.type ?? business.planType} className="w-28 py-2 text-xs">
                              {PLAN_SLUGS.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                            </Select>
                            <Select name="status" defaultValue={business.subscription?.status ?? "active"} className="w-32 py-2 text-xs">
                              {SUBSCRIPTION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                            </Select>
                            <Input name="currentPeriodEnd" type="date" defaultValue={inputDate(business.subscription?.currentPeriodEnd)} className="w-36 py-2 text-xs" />
                            <input type="hidden" name="reason" value="Actualización manual de plan" />
                            <ConfirmSubmitButton message={`Actualizar suscripción de ${business.name}?`} className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-black">
                              Guardar
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {stores.length === 0 ? <EmptyState title="No hay tiendas con estos filtros" description="Ajusta búsqueda, plan o estado para revisar tiendas." /> : null}
        </div>
      </Card>

      <section id="suscripciones" className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-3">
          <h2 className="text-base font-black">Suscripciones</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--app-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--app-surface-muted)] text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                <tr>
                  <th className="px-3 py-2">Tienda</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Periodo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td className="px-3 py-2">
                      <p className="font-bold">{subscription.business.name}</p>
                      <p className="text-xs text-[var(--app-text-muted)]">{subscription.business.owner.email}</p>
                    </td>
                    <td className="px-3 py-2">{subscription.plan.name}</td>
                    <td className="px-3 py-2"><StatusBadge variant={subscription.status === "active" ? "success" : subscription.status === "past_due" ? "warning" : "neutral"}>{subscription.status}</StatusBadge></td>
                    <td className="px-3 py-2 text-xs text-[var(--app-text-muted)]">{dateLabel(subscription.currentPeriodStart)} - {dateLabel(subscription.currentPeriodEnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-3">
          <h2 className="text-base font-black">Acceso inicial</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--app-text-muted)]">
            {PRIMARY_PLATFORM_OWNER_EMAIL} es el dueño principal y siempre conserva acceso OWNER por código y migración.
          </p>
          <p className="mt-3 rounded-xl bg-[var(--app-surface-muted)] p-3 text-xs leading-5 text-[var(--app-text-muted)]">
            Para agregar otros correos, usa Accesos admin globales. OWNER puede crear OWNER; ADMIN puede agregar ADMIN, SUPPORT o BILLING.
          </p>
        </Card>
      </section>

      <Card id="planes" className="p-3">
        <h2 className="text-base font-black">Planes y límites</h2>
        <div className="mt-3 grid gap-3 xl:grid-cols-3">
          {plans.map((plan) => (
            <form key={plan.id} action={updatePlanLimitsPlatformAction} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <input type="hidden" name="planId" value={plan.id} />
              <h3 className="text-sm font-black">{plan.name}</h3>
              <p className="text-xs text-[var(--app-text-muted)]">{plan.description}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Input name="maxProducts" type="number" defaultValue={plan.maxProducts} className="py-2 text-xs" aria-label="Máximo de productos" />
                <Input name="maxImages" type="number" defaultValue={plan.maxImages} className="py-2 text-xs" aria-label="Máximo de imágenes" />
                <Input name="maxCategories" type="number" defaultValue={plan.maxCategories} className="py-2 text-xs" aria-label="Máximo de categorías" />
                <Input name="maxAiConversationsMonthly" type="number" defaultValue={plan.maxAiConversationsMonthly} className="py-2 text-xs" aria-label="Máximo IA mensual" />
                <Input name="maxMembers" type="number" defaultValue={plan.maxMembers} className="py-2 text-xs" aria-label="Máximo usuarios internos" />
                <Input name="maxStores" type="number" defaultValue={plan.maxStores} className="py-2 text-xs" aria-label="Máximo tiendas" />
              </div>
              <div className="mt-3 grid gap-2 text-xs font-semibold">
                {[
                  ["aiEnabled", "IA"],
                  ["advancedBranding", "Branding avanzado"],
                  ["advancedSeoEnabled", "SEO avanzado"],
                  ["analyticsEnabled", "Analytics"],
                  ["advancedAttributesEnabled", "Atributos avanzados"],
                  ["quotesAndOrders", "Cotizaciones y pedidos"],
                  ["customDomain", "Dominio propio"]
                ].map(([name, label]) => (
                  <label key={name} className="flex items-center gap-2">
                    <input name={name} type="checkbox" defaultChecked={Boolean(plan[name as keyof typeof plan])} />
                    {label}
                  </label>
                ))}
              </div>
              <Input name="supportLevel" defaultValue={plan.supportLevel} className="mt-3 py-2 text-xs" placeholder="Soporte" />
              <Input name="reason" className="mt-2 py-2 text-xs" placeholder="Motivo del cambio" />
              {canManageBilling ? (
                <ConfirmSubmitButton message={`Guardar límites del plan ${plan.name}?`} className="mt-3 w-full rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-black text-[var(--app-button-text)]">
                  Guardar límites
                </ConfirmSubmitButton>
              ) : (
                <p className="mt-3 text-xs font-bold text-[var(--app-text-muted)]">Solo lectura para tu rol.</p>
              )}
              <p className="mt-2 text-[0.68rem] text-[var(--app-text-muted)]">Usa -1 para ilimitado. Actual: {limitLabel(plan.maxProducts)} productos.</p>
            </form>
          ))}
        </div>
      </Card>

      <Card id="usuarios" className="p-3">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-black">Usuarios</h2>
            <p className="text-xs text-[var(--app-text-muted)]">Revisa pertenencia a tiendas y roles sin exponer contraseñas ni tokens.</p>
          </div>
          <form action="/platform-admin#usuarios" className="flex gap-2">
            <Input name="userQ" defaultValue={userQ} placeholder="Buscar usuario" className="py-2" />
            <button className="rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-black text-[var(--app-button-text)]">Buscar</button>
          </form>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <CompactCard key={user.id}>
              <p className="truncate text-sm font-black">{user.name}</p>
              <p className="truncate text-xs text-[var(--app-text-muted)]">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <StatusBadge variant={user.role.includes("ADMIN") || user.role === "SUPER_ADMIN" ? "dark" : "neutral"}>{user.role}</StatusBadge>
                <StatusBadge>{dateLabel(user.createdAt)}</StatusBadge>
              </div>
              <div className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">
                {user.businesses.map((business) => <p key={business.id}>Dueño: {business.name}</p>)}
                {user.memberships.map((membership) => <p key={membership.business.id}>Miembro: {membership.business.name} ({membership.role})</p>)}
              </div>
            </CompactCard>
          ))}
        </div>
      </Card>

      <Card id="accesos" className="p-3">
        <div className="mb-3">
          <h2 className="text-base font-black">Accesos admin globales</h2>
          <p className="text-xs text-[var(--app-text-muted)]">Este listado controla quién ve el botón flotante y quién puede entrar a /platform-admin.</p>
        </div>
        {canGrantAccess ? (
          <>
            <PlatformAccessUserPicker canGrantAccess={canGrantAccess} canGrantOwner={canGrantOwner} />
            <details className="mb-3 rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
              <summary className="cursor-pointer text-sm font-black">Agregar por correo manual avanzado</summary>
              <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">
                Úsalo solo cuando el usuario aún no aparece en la búsqueda o necesitas preparar un acceso antes del registro.
              </p>
              <form action={addPlatformAdminAccessAction} className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_auto]">
                <Input name="email" type="email" placeholder="correo@empresa.com" className="py-2" required />
                <Select name="role" defaultValue="ADMIN" className="py-2">
                  {accessRolesFor(access).map((role) => <option key={role} value={role}>{role}</option>)}
                </Select>
                <Input name="notes" placeholder="Nota interna opcional" className="py-2" />
                <button className="rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-black text-[var(--app-button-text)]">Agregar</button>
              </form>
            </details>
          </>
        ) : (
          <p className="mb-3 rounded-xl bg-[var(--app-surface-muted)] p-3 text-xs font-bold text-[var(--app-text-muted)]">
            Tu rol permite consultar el panel, pero no crear accesos admin globales.
          </p>
        )}
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {adminAccesses.map((item) => (
            <CompactCard key={item.email} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{item.email}</p>
                  <p className="text-xs text-[var(--app-text-muted)]">{item.enabled ? "Este correo puede ver el botón flotante admin" : "Este correo no tiene acceso global"}</p>
                </div>
                <StatusBadge variant={item.enabled ? "success" : "danger"}>{item.role}</StatusBadge>
              </div>
              <p className="text-xs leading-5 text-[var(--app-text-muted)]">{item.notes ?? (item.source === "database" ? "Sin nota interna." : "Acceso protegido por configuración.")}</p>
              {canRenderAccessForm(item, access) ? (
                <div className="flex flex-wrap gap-2">
                  <form action={updatePlatformAdminAccessAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="email" value={item.email} />
                    <Select name="role" defaultValue={item.role} className="w-28 py-2 text-xs">
                      {accessRolesFor(access).map((role) => <option key={role} value={role}>{role}</option>)}
                    </Select>
                    <Select name="enabled" defaultValue={item.enabled ? "true" : "false"} className="w-28 py-2 text-xs">
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </Select>
                    <Input name="notes" defaultValue={item.notes ?? ""} placeholder="Nota" className="w-36 py-2 text-xs" />
                    <ConfirmSubmitButton message={`Actualizar acceso de ${item.email}?`} className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-xs font-black">
                      Guardar
                    </ConfirmSubmitButton>
                  </form>
                  <form action={deletePlatformAdminAccessAction}>
                    <input type="hidden" name="email" value={item.email} />
                    <ConfirmSubmitButton message={`Eliminar acceso global de ${item.email}?`} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white">
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                </div>
              ) : (
                <p className="text-xs font-bold text-[var(--app-text-muted)]">{lockedAccessMessage(item, access)}</p>
              )}
            </CompactCard>
          ))}
        </div>
      </Card>

      <Card id="auditoria" className="p-3">
        <h2 className="text-base font-black">Auditoría</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--app-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--app-surface-muted)] text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
              <tr>
                <th className="px-3 py-2">Acción</th>
                <th className="px-3 py-2">Usuario</th>
                <th className="px-3 py-2">Tienda</th>
                <th className="px-3 py-2">Recurso</th>
                <th className="px-3 py-2">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border)]">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-3 py-2 font-semibold">{log.action}</td>
                  <td className="px-3 py-2 text-xs">{log.user?.email ?? "Sistema"}</td>
                  <td className="px-3 py-2 text-xs">{log.business?.name ?? "-"}</td>
                  <td className="px-3 py-2 text-xs">{log.resourceType}</td>
                  <td className="px-3 py-2 text-xs">{log.createdAt.toLocaleString("es-CL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {auditLogs.length === 0 ? <EmptyState title="Sin eventos de auditoría" description="Los cambios críticos de plataforma aparecerán aquí." /> : null}
        </div>
      </Card>
    </div>
  );
}
