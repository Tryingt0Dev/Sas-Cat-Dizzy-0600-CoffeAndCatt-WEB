import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { EmptyState } from "@/components/EmptyState";
import { StatusAlert } from "@/components/StatusAlert";
import { prisma } from "@/lib/db";
import { ProductStatus, StoreRole } from "@/lib/enums";
import { parseJsonRecord } from "@/lib/safe-json";
import { getStoreTypeLabel } from "@/lib/store-types";
import { requireAdminPanelUser } from "@/lib/auth";
import { STORE_ROLE_OPTIONS, canManagePlatform } from "@/lib/auth/permissions";
import { formatPlanLimit, getPlanEntitlements, normalizePlanSlug, planList, SUBSCRIPTION_STATUSES } from "@/lib/plans";
import { planDisplayName } from "@/services/plan-guard";
import {
  addStoreMemberAction,
  removeStoreMemberAction,
  toggleBusinessActiveAction,
  updateStoreMemberRoleAction,
  updateStorePlanAction,
  startDomainVerificationAction,
  verifyDomainAction
} from "../../actions";

type StoreDetailProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ success?: string; error?: string } | undefined>;
};

function dateTimeLabel(date: Date) {
  return date.toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusBadge(active: boolean) {
  return active
    ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
    : "rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700";
}

function metricCard(label: string, value: number, help: string) {
  return (
    <Card>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-gray-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-gray-500">{help}</p>
    </Card>
  );
}

function diagnosticRow(label: string, ok: boolean, recommendation: string) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
      <span className={ok ? "mt-1 h-3 w-3 rounded-full bg-emerald-500" : "mt-1 h-3 w-3 rounded-full bg-amber-400"} />
      <div>
        <p className="font-black text-gray-950">{label}</p>
        <p className="mt-1 text-sm leading-5 text-gray-500">{ok ? "Sin problemas detectados." : recommendation}</p>
      </div>
    </div>
  );
}

function visibleEmail(email: string, canViewSensitive: boolean) {
  if (canViewSensitive) return email;
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain ?? "correo"}`;
}

const globalRoleLabels: Record<string, string> = {
  USER: "Usuario",
  SUPPORT: "Soporte",
  DEVELOPER: "Desarrollador",
  PLATFORM_ADMIN: "Admin plataforma",
  SUPER_ADMIN: "Super admin",
  ADMIN_GLOBAL: "Admin global",
  OWNER: "Owner legacy"
};

const storeRoleLabels: Record<string, string> = {
  STORE_OWNER: "Dueño",
  STORE_ADMIN: "Administrador",
  STORE_MANAGER: "Gestor",
  STORE_STAFF: "Equipo",
  VIEWER: "Lectura"
};

function globalRoleLabel(role: string) {
  return globalRoleLabels[role] ?? role;
}

function storeRoleLabel(role: string) {
  return storeRoleLabels[role] ?? role.replace("STORE_", "").toLowerCase();
}

const subscriptionStatusLabels: Record<string, string> = {
  active: "Activa",
  trialing: "Trial",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  expired: "Expirada"
};

function subscriptionStatusLabel(status: string | null | undefined) {
  return subscriptionStatusLabels[status ?? ""] ?? "Sin suscripcion";
}

export default async function AdminStoreDetailPage({ params, searchParams }: StoreDetailProps) {
  const currentUser = await requireAdminPanelUser();
  const canManage = canManagePlatform(currentUser);
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      plan: true,
      subscription: { include: { plan: true } },
      memberships: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: "asc" }
      },
      aiSettings: {
        select: {
          tone: true,
          allowAutoLead: true,
          humanHandoffEnabled: true,
          fallbackMessage: true,
          updatedAt: true
        }
      },
      _count: {
        select: {
          products: true,
          categories: true,
          customers: true,
          conversations: true,
          quotes: true,
          orders: true,
          memberships: true
        }
      }
    }
  });

  if (!business) notFound();

  const [
    activeProducts,
    draftProducts,
    archivedProducts,
    noImageProducts,
    noPriceProducts,
    noCategoryProducts,
    negativeStockProducts,
    categories,
    recentProducts,
    recentAuditLogs,
    attributeProducts,
    ownerStoreCount
  ] = await Promise.all([
    prisma.product.count({ where: { businessId: business.id, status: ProductStatus.ACTIVE } }),
    prisma.product.count({ where: { businessId: business.id, status: ProductStatus.DRAFT } }),
    prisma.product.count({ where: { businessId: business.id, status: ProductStatus.ARCHIVED } }),
    prisma.product.count({ where: { businessId: business.id, OR: [{ imageUrl: null }, { imageUrl: "" }] } }),
    prisma.product.count({ where: { businessId: business.id, price: { lte: 0 } } }),
    prisma.product.count({ where: { businessId: business.id, categoryId: null } }),
    prisma.product.count({ where: { businessId: business.id, stock: { lt: 0 } } }),
    prisma.category.findMany({
      where: { businessId: business.id },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.product.findMany({
      where: { businessId: business.id },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      take: 12
    }),
    prisma.auditLog.findMany({
      where: { businessId: business.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.product.findMany({
      where: { businessId: business.id, attributesJson: { not: null } },
      select: { id: true, name: true, attributesJson: true },
      take: 500
    }),
    prisma.business.count({ where: { ownerId: business.ownerId } })
  ]);

  const invalidAttributeProducts = attributeProducts.filter((product) => !parseJsonRecord(product.attributesJson));
  const currentPlanSlug = normalizePlanSlug(business.subscription?.plan.type ?? business.plan?.type ?? business.planType);
  const currentEntitlements = getPlanEntitlements(currentPlanSlug);
  const subscriptionStatus = business.subscription?.status ?? "active";
  const configurationChecks = [
    {
      label: "Tipo de negocio",
      ok: Boolean(business.businessType),
      recommendation: "Seleccionar tipo de negocio activa atributos dinamicos correctos para productos."
    },
    {
      label: "WhatsApp configurado",
      ok: Boolean(business.whatsappNumber),
      recommendation: "Agregar WhatsApp permite convertir consultas desde catalogo publico."
    },
    {
      label: "Branding cargado",
      ok: Boolean(business.logoUrl || business.bannerUrl),
      recommendation: "Subir logo o banner mejora confianza y reconocimiento de marca."
    },
    {
      label: "SEO basico",
      ok: Boolean(business.seoTitle && business.seoDescription),
      recommendation: "Completar titulo y descripcion mejora previsualizaciones al compartir."
    },
    {
      label: "Productos activos",
      ok: activeProducts > 0,
      recommendation: "Publicar al menos un producto activo para que el catalogo tenga contenido."
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/admin" className="text-sm font-black text-gray-500 hover:text-gray-900">Volver al admin</Link>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.25em] text-gray-400">Detalle de tienda</p>
          <h1 className="mt-2 text-4xl font-black text-gray-950">{business.name}</h1>
          <p className="mt-2 text-gray-500">Diagnostico operativo, configuracion publica y actividad de esta tienda sin mezclar datos con otros tenants.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/store/${business.publicSlug}`} target="_blank" className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm">
            Ver catalogo
          </Link>
          {canManage ? (
            <form action={toggleBusinessActiveAction}>
              <input type="hidden" name="id" value={business.id} />
              <input type="hidden" name="isActive" value={business.isActive ? "false" : "true"} />
              <ConfirmSubmitButton
                message={business.isActive ? `Suspender ${business.name}?` : `Reactivar ${business.name}?`}
                className={business.isActive ? "rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white" : "rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"}
              >
                {business.isActive ? "Suspender tienda" : "Reactivar tienda"}
              </ConfirmSubmitButton>
            </form>
          ) : null}
        </div>
      </div>
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCard("Productos", business._count.products, `${activeProducts} activos, ${draftProducts} borradores, ${archivedProducts} archivados.`)}
        {metricCard("Categorias", business._count.categories, "Organizacion visible para clientes en el catalogo.")}
        {metricCard("Clientes", business._count.customers, "Leads y compradores asociados solo a esta tienda.")}
        {metricCard("Conversaciones", business._count.conversations, "Chats web vinculados a este tenant.")}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <h2 className="text-xl font-black text-gray-950">Informacion basica</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Estado</p>
              <span className={statusBadge(business.isActive)}>{business.isActive ? "Activa" : "Suspendida"}</span>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Tipo</p>
              <p className="mt-1 font-black text-gray-950">{getStoreTypeLabel(business.businessType)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Dueno</p>
              <p className="mt-1 font-black text-gray-950">{business.owner.name}</p>
              <p className="text-sm text-gray-500">{visibleEmail(business.owner.email, canManage)} · {globalRoleLabel(business.owner.role)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Plan</p>
              <p className="mt-1 font-black text-gray-950">{planDisplayName(business.plan, business.owner)}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">URL publica</p>
              <p className="mt-1 font-black text-gray-950">/store/{business.publicSlug}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Actualizada</p>
              <p className="mt-1 font-black text-gray-950">{dateTimeLabel(business.updatedAt)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-gray-950">Configuracion publica</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p><strong className="text-gray-900">Descripcion:</strong> {business.description || "Sin descripcion publica."}</p>
            <p><strong className="text-gray-900">WhatsApp:</strong> {business.whatsappNumber || "No configurado"}</p>
            <p><strong className="text-gray-900">Instagram:</strong> {business.instagramUrl || "No configurado"}</p>
            <p><strong className="text-gray-900">Direccion:</strong> {business.address || "No configurada"}</p>
            <p><strong className="text-gray-900">SEO:</strong> {business.seoTitle || "Sin titulo"} · {business.seoDescription || "Sin descripcion"}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-gray-950">Dominios personalizados</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p><strong className="text-gray-900">Dominio actual:</strong> {business.customDomain || "No asignado"}</p>
            <p><strong className="text-gray-900">Verificado:</strong> {business.customDomainVerified ? "Si" : "No"}</p>

            {canManage ? (
              <div className="mt-2 space-y-2">
                <form action={startDomainVerificationAction} className="flex items-center gap-2">
                  <input type="hidden" name="businessId" value={business.id} />
                  <input name="domain" placeholder="tienda.midominio.com" defaultValue={business.customDomain ?? ""} className="rounded-2xl border border-gray-200 px-4 py-2 text-sm" />
                  <button className="rounded-2xl bg-black px-4 py-2 text-sm font-black text-white">Iniciar verificacion</button>
                </form>

                <form action={verifyDomainAction} className="flex items-center gap-2">
                  <input type="hidden" name="businessId" value={business.id} />
                  <button className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-black text-gray-700">Verificar DNS</button>
                </form>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Tu rol no permite gestionar dominios.</p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <h2 className="text-xl font-black text-gray-950">Miembros de tienda</h2>
          <p className="mt-1 text-sm text-gray-500">Roles por tienda separados del rol global del SaaS.</p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Usuario</th>
                  <th>Rol tienda</th>
                  <th>Rol global</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {business.memberships.map((membership) => (
                  <tr key={membership.id} className="border-b border-gray-100 align-top">
                    <td className="py-4">
                      <p className="font-black text-gray-950">{membership.user.name}</p>
                      <p className="text-xs text-gray-500">{visibleEmail(membership.user.email, canManage)}</p>
                    </td>
                    <td>
                      {canManage ? (
                        <form action={updateStoreMemberRoleAction} className="flex flex-wrap gap-2">
                          <input type="hidden" name="membershipId" value={membership.id} />
                          <select name="role" defaultValue={membership.role} className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold">
                            {STORE_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{storeRoleLabel(role)}</option>)}
                          </select>
                          <ConfirmSubmitButton message={`Cambiar rol de ${membership.user.email}?`} className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-700">
                            Guardar
                          </ConfirmSubmitButton>
                        </form>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">{storeRoleLabel(membership.role)}</span>
                      )}
                    </td>
                    <td>{globalRoleLabel(membership.user.role)}</td>
                    <td className="text-right">
                      {canManage && membership.userId !== business.ownerId ? (
                        <form action={removeStoreMemberAction}>
                          <input type="hidden" name="membershipId" value={membership.id} />
                          <ConfirmSubmitButton message={`Quitar a ${membership.user.email} de ${business.name}?`} className="rounded-2xl bg-red-600 px-3 py-2 text-xs font-black text-white">
                            Quitar
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {business.memberships.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Sin miembros asociados.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-gray-950">Agregar miembro</h2>
          {canManage ? (
            <form action={addStoreMemberAction} className="mt-4 space-y-3">
              <input type="hidden" name="businessId" value={business.id} />
              <label className="block text-sm font-semibold text-gray-900">
                Email de usuario existente
                <input name="userEmail" type="email" required placeholder="usuario@dominio.com" className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm" />
              </label>
              <label className="block text-sm font-semibold text-gray-900">
                Rol dentro de la tienda
                <select name="role" defaultValue={StoreRole.STORE_STAFF} className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                  {STORE_ROLE_OPTIONS.map((role) => <option key={role} value={role}>{storeRoleLabel(role)}</option>)}
                </select>
              </label>
              <ConfirmSubmitButton message="Agregar o actualizar miembro de tienda?" className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-black text-white">
                Guardar miembro
              </ConfirmSubmitButton>
            </form>
          ) : (
            <p className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">Tu rol tiene acceso de solo lectura al diagnostico.</p>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <h2 className="text-xl font-black text-gray-950">Diagnostico de la tienda</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {configurationChecks.map((check) => <div key={check.label}>{diagnosticRow(check.label, check.ok, check.recommendation)}</div>)}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black text-gray-950">Problemas de productos</h2>
          <div className="mt-4 space-y-3">
            {diagnosticRow("Sin imagen", noImageProducts === 0, "Subir imagen principal en productos incompletos.")}
            {diagnosticRow("Sin precio", noPriceProducts === 0, "Corregir productos con precio cero o negativo.")}
            {diagnosticRow("Sin categoria", noCategoryProducts === 0, "Asignar categorias para mejorar navegacion.")}
            {diagnosticRow("Stock negativo", negativeStockProducts === 0, "Revisar movimientos de inventario.")}
            {diagnosticRow("Ficha técnica inválida", invalidAttributeProducts.length === 0, "Corregir características guardadas para que el producto se muestre correctamente.")}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black text-gray-950">Categorias</h2>
          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="font-black text-gray-950">{category.name}</p>
                  <p className="text-xs text-gray-500">/{category.slug}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-gray-700 shadow-sm">{category._count.products} productos</span>
              </div>
            ))}
            {categories.length === 0 ? <EmptyState title="Sin categorias" description="Esta tienda todavia no tiene categorias para organizar productos." /> : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-gray-950">Configuracion IA</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p><strong className="text-gray-900">Tono:</strong> {business.aiSettings?.tone ?? "No configurado"}</p>
            <p><strong className="text-gray-900">Crear leads automáticamente:</strong> {business.aiSettings?.allowAutoLead === false ? "No" : "Si"}</p>
            <p><strong className="text-gray-900">Derivación humana:</strong> {business.aiSettings?.humanHandoffEnabled === false ? "No" : "Si"}</p>
            <p><strong className="text-gray-900">Respuesta cuando no sabe:</strong> {business.aiSettings?.fallbackMessage ?? "No configurado"}</p>
          </div>
        </Card>
      </section>

      <Card>
        <h2 className="text-xl font-black text-gray-950">Suscripcion y limites</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Estado</p>
            <p className="mt-1 font-black">{subscriptionStatusLabel(subscriptionStatus)}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Plan</p>
            <p className="mt-1 font-black">{business.subscription?.plan.name ?? planDisplayName(business.plan, business.owner)}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Periodo</p>
            <p className="mt-1 font-black">{business.subscription?.currentPeriodEnd ? dateTimeLabel(business.subscription.currentPeriodEnd) : "Sin fecha de termino"}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Cancelacion</p>
            <p className="mt-1 font-black">{business.subscription?.cancelAtPeriodEnd ? "Al final del periodo" : "No programada"}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Uso productos</p>
            <p className="mt-1 font-black">{business._count.products} / {formatPlanLimit(currentEntitlements.maxProducts)}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Usuarios tienda</p>
            <p className="mt-1 font-black">{business._count.memberships} / {formatPlanLimit(currentEntitlements.maxUsersPerStore)}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Tiendas owner</p>
            <p className="mt-1 font-black">{ownerStoreCount} / {formatPlanLimit(currentEntitlements.maxStores)}</p>
          </div>
        </div>
        {canManage ? (
          <form action={updateStorePlanAction} className="mt-5 grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <input type="hidden" name="businessId" value={business.id} />
            <label className="block text-sm font-semibold text-gray-900">
              Plan comercial
              <select name="plan" defaultValue={currentPlanSlug} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
                {planList.map((plan) => <option key={plan.slug} value={plan.slug}>{plan.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-gray-900">
              Estado suscripcion
              <select name="status" defaultValue={subscriptionStatus} className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
                {SUBSCRIPTION_STATUSES.map((status) => <option key={status} value={status}>{subscriptionStatusLabel(status)}</option>)}
              </select>
            </label>
            <ConfirmSubmitButton message={`Cambiar plan de ${business.name}?`} className="rounded-2xl bg-black px-4 py-3 text-sm font-black text-white">
              Guardar plan
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-xl font-black text-gray-950">Productos recientes</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-3">Producto</th>
                <th>Estado</th>
                <th>Categoria</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100">
                  <td className="py-4 font-black">{product.name}</td>
                  <td>{product.status}</td>
                  <td>{product.category?.name ?? "Sin categoria"}</td>
                  <td>{product.price}</td>
                  <td>{product.stock}</td>
                  <td>{dateTimeLabel(product.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentProducts.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Sin productos registrados.</p> : null}
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black text-gray-950">Auditoria de esta tienda</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="py-3">Accion</th>
                <th>Usuario</th>
                <th>Recurso</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentAuditLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100">
                  <td className="py-4 font-semibold">{log.action}</td>
                  <td>{log.user?.email ? visibleEmail(log.user.email, canManage) : "Sistema"}</td>
                  <td>{log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}</td>
                  <td>{dateTimeLabel(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentAuditLogs.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Sin eventos recientes para esta tienda.</p> : null}
        </div>
      </Card>
    </div>
  );
}
