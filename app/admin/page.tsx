import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Card } from "@/components/Card";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { EmptyState } from "@/components/EmptyState";
import { StatusAlert } from "@/components/StatusAlert";
import { prisma } from "@/lib/db";
import { enumValues, ProductStatus, type ProductStatus as ProductStatusValue } from "@/lib/enums";
import { parseJsonRecord } from "@/lib/safe-json";
import { getStoreTypeOptions, getStoreTypeLabel } from "@/lib/store-types";
import { GLOBAL_ADMIN_ROLES, requireAdminPanelUser, isPlatformOwner } from "@/lib/auth";
import { USER_GLOBAL_ROLE_OPTIONS, canManagePlatform } from "@/lib/auth/permissions";
import { PLAN_SLUGS, formatPlanLimit } from "@/lib/plans";
import { planDisplayName } from "@/services/plan-guard";
import { toggleBusinessActiveAction, updateUserRoleAction } from "./actions";

type AdminSearchParams = {
  success?: string;
  error?: string;
  storeQ?: string;
  storeType?: string;
  userQ?: string;
  productQ?: string;
  productStore?: string;
  productStatus?: string;
};

const roleOptions = USER_GLOBAL_ROLE_OPTIONS;
const globalRoleLabels: Record<string, string> = {
  USER: "Usuario",
  SUPPORT: "Soporte",
  DEVELOPER: "Desarrollador",
  PLATFORM_ADMIN: "Admin plataforma",
  SUPER_ADMIN: "Super admin",
  ADMIN_GLOBAL: "Admin global",
  OWNER: "Owner legacy"
};
const globalRoleHelp: Record<string, string> = {
  USER: "Acceso normal a tiendas asignadas.",
  SUPPORT: "Puede revisar diagnostico limitado para ayudar a usuarios.",
  DEVELOPER: "Puede revisar diagnostico tecnico limitado.",
  PLATFORM_ADMIN: "Administra tiendas, usuarios y diagnostico global.",
  SUPER_ADMIN: "Control total del SaaS y asignacion de super admins.",
  ADMIN_GLOBAL: "Alias legacy con permisos de administrador global.",
  OWNER: "Alias legacy con permisos de administrador global."
};
const roadmapGroups = [
  {
    title: "Prioridad alta",
    items: [
      "Activar verificación de correo con proveedor real.",
      "Agregar recuperación de contraseña segura.",
      "Configurar backups automáticos y prueba de restauración.",
      "Ampliar auditoría a cambios de productos, settings y billing.",
      "Aplicar límites de plan en todos los módulos premium."
    ]
  },
  {
    title: "Prioridad media",
    items: [
      "Integrar pagos con Stripe o Mercado Pago.",
      "Agregar analytics por tienda y por producto.",
      "Habilitar dominios personalizados.",
      "Mejorar onboarding por industria.",
      "Agregar importación masiva de productos."
    ]
  },
  {
    title: "Prioridad baja",
    items: [
      "Temas visuales avanzados.",
      "Plantillas públicas adicionales.",
      "Integraciones con redes sociales.",
      "Automatizaciones de marketing."
    ]
  }
];

function cleanParam(value: string | undefined, maxLength = 100) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function dateLabel(date: Date) {
  return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function visibleEmail(email: string, canViewSensitive: boolean) {
  if (canViewSensitive) return email;
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain ?? "correo"}`;
}

function statusBadge(active: boolean) {
  return active
    ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
    : "rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700";
}

function productStatusBadge(status: string) {
  if (status === ProductStatus.ACTIVE) return "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700";
  if (status === ProductStatus.DRAFT) return "rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700";
  return "rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700";
}

function roleLabel(role: string) {
  return globalRoleLabels[role] ?? role;
}

function roleTitle(role: string) {
  return globalRoleHelp[role] ?? "Rol del sistema.";
}

function metricHelp(label: string, value: number, help: string) {
  return (
    <Card key={label}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-gray-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-gray-500">{help}</p>
    </Card>
  );
}

function formatDbLimit(value: number) {
  return value < 0 ? "Ilimitado" : formatPlanLimit(value);
}

function issueCard({
  title,
  count,
  recommendation,
  href,
  severity = "media"
}: {
  title: string;
  count: number;
  recommendation: string;
  href?: string;
  severity?: "alta" | "media" | "baja";
}) {
  const color =
    severity === "alta"
      ? "bg-red-50 text-red-700"
      : severity === "media"
        ? "bg-amber-50 text-amber-700"
        : "bg-gray-100 text-gray-700";

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-gray-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">{recommendation}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${color}`}>{count}</span>
      </div>
      {href ? (
        <Link href={href} className="mt-4 inline-flex rounded-2xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50">
          Revisar
        </Link>
      ) : null}
    </div>
  );
}

export default async function AdminPage({ searchParams }: { searchParams?: Promise<AdminSearchParams | undefined> }) {
  const currentUser = await requireAdminPanelUser();
  const canManage = canManagePlatform(currentUser);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const storeQ = cleanParam(resolvedSearchParams?.storeQ);
  const storeType = cleanParam(resolvedSearchParams?.storeType);
  const userQ = cleanParam(resolvedSearchParams?.userQ);
  const productQ = cleanParam(resolvedSearchParams?.productQ);
  const productStore = cleanParam(resolvedSearchParams?.productStore);
  const productStatus = cleanParam(resolvedSearchParams?.productStatus);
  const validProductStatus = enumValues(ProductStatus).includes(productStatus as ProductStatusValue) ? productStatus : "";

  const storeWhere: Prisma.BusinessWhereInput = {
    ...(storeType ? { businessType: storeType } : {}),
    ...(storeQ
      ? {
          OR: [
            { name: { contains: storeQ } },
            { publicSlug: { contains: storeQ } },
            { slug: { contains: storeQ } },
            { owner: { email: { contains: storeQ } } }
          ]
        }
      : {})
  };
  const userWhere: Prisma.UserWhereInput = userQ
    ? {
        OR: [{ name: { contains: userQ } }, { email: { contains: userQ } }, { role: { contains: userQ } }]
      }
    : {};
  const productWhere: Prisma.ProductWhereInput = {
    ...(validProductStatus ? { status: validProductStatus } : {}),
    ...(productStore ? { businessId: productStore } : {}),
    ...(productQ
      ? {
          OR: [
            { name: { contains: productQ } },
            { sku: { contains: productQ } },
            { tags: { contains: productQ } },
            { business: { name: { contains: productQ } } }
          ]
        }
      : {})
  };

  const [
    totalStores,
    totalUsers,
    totalProducts,
    activeStores,
    inactiveStores,
    activeProducts,
    inactiveProducts,
    openConversations,
    stores,
    users,
    products,
    storeOptions,
    recentStores,
    auditLogs,
    plans,
    noImageProducts,
    noCategoryProducts,
    noPriceProducts,
    negativeStockProducts,
    emptyNameProducts,
    storesWithoutType,
    storesWithoutWhatsapp,
    storesWithoutProducts,
    storesWithSeoIncomplete,
    diagnosticProducts
  ] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.business.count({ where: { isActive: true } }),
    prisma.business.count({ where: { isActive: false } }),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    prisma.product.count({ where: { status: { not: ProductStatus.ACTIVE } } }),
    prisma.conversation.count({ where: { status: { in: ["OPEN", "WAITING_HUMAN"] } } }),
    prisma.business.findMany({
      where: storeWhere,
      include: {
        owner: { select: { id: true, email: true, name: true, role: true } },
        plan: true,
        _count: { select: { products: true, categories: true, conversations: true, customers: true } }
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: 60
    }),
    prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        memberships: {
          take: 3,
          select: { role: true, business: { select: { id: true, name: true, publicSlug: true } } }
        },
        _count: { select: { businesses: true, memberships: true, auditLogs: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        status: true,
        imageUrl: true,
        categoryId: true,
        attributesJson: true,
        updatedAt: true,
        business: { select: { id: true, name: true, publicSlug: true } },
        category: { select: { name: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 80
    }),
    prisma.business.findMany({
      select: { id: true, name: true, publicSlug: true },
      orderBy: { name: "asc" },
      take: 200
    }),
    prisma.business.findMany({
      include: { owner: { select: { email: true, name: true } }, _count: { select: { products: true } } },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
        business: { select: { name: true, publicSlug: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 30
    }),
    prisma.plan.findMany({ where: { type: { in: [...PLAN_SLUGS] } }, orderBy: { maxProducts: "asc" } }),
    prisma.product.count({ where: { OR: [{ imageUrl: null }, { imageUrl: "" }] } }),
    prisma.product.count({ where: { categoryId: null } }),
    prisma.product.count({ where: { price: { lte: 0 } } }),
    prisma.product.count({ where: { stock: { lt: 0 } } }),
    prisma.product.count({ where: { name: "" } }),
    prisma.business.count({ where: { OR: [{ businessType: null }, { businessType: "" }] } }),
    prisma.business.count({ where: { OR: [{ whatsappNumber: null }, { whatsappNumber: "" }] } }),
    prisma.business.count({ where: { products: { none: {} } } }),
    prisma.business.count({
      where: {
        OR: [{ seoTitle: null }, { seoTitle: "" }, { seoDescription: null }, { seoDescription: "" }]
      }
    }),
    prisma.product.findMany({
      where: { attributesJson: { not: null } },
      select: {
        id: true,
        name: true,
        attributesJson: true,
        business: { select: { name: true, publicSlug: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 1000
    })
  ]);

  const invalidAttributeProducts = diagnosticProducts.filter((product) => !parseJsonRecord(product.attributesJson));
  const overviewCards = [
    { label: "Tiendas totales", value: totalStores, help: `${activeStores} activas y ${inactiveStores} suspendidas.` },
    { label: "Usuarios", value: totalUsers, help: "Cuentas registradas sin exponer credenciales." },
    { label: "Productos", value: totalProducts, help: `${activeProducts} publicados y ${inactiveProducts} no activos.` },
    { label: "Conversaciones abiertas", value: openConversations, help: "Chats que pueden requerir atencion del equipo o de la tienda." }
  ];
  const secureBootstrapConfigured = (process.env.ADMIN_BOOTSTRAP_SECRET?.trim().length ?? 0) >= 32;

  return (
    <div className="space-y-8">
      <section id="resumen">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-gray-400">Superadmin</p>
            <h1 className="mt-2 text-4xl font-black text-gray-950">Plataforma CATG</h1>
            <p className="mt-2 max-w-3xl text-gray-500">Control global de tiendas, usuarios, productos, diagnostico operativo y auditoria del SaaS.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className="inline-flex rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm">
              Ir al dashboard
            </Link>
            {isPlatformOwner(currentUser) ? (
              <Link href="/admin/owner" className="inline-flex rounded-2xl bg-black px-4 py-2 text-sm font-black text-white shadow-sm">
                Panel del dueño
              </Link>
            ) : null}
          </div>
        </div>
        <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((metric) => metricHelp(metric.label, metric.value, metric.help))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-950">Tiendas recientes</h2>
              <p className="mt-1 text-sm text-gray-500">Ultimos negocios creados en la plataforma.</p>
            </div>
            <Link href="#tiendas" className="text-sm font-bold text-gray-500">Ver tiendas</Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentStores.map((business) => (
              <div key={business.id} className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 p-4">
                <div className="min-w-0">
                  <p className="truncate font-black text-gray-950">{business.name}</p>
              <p className="text-xs text-gray-500">{visibleEmail(business.owner.email, canManage)} · {business._count.products} productos</p>
                </div>
                <span className={statusBadge(business.isActive)}>{business.isActive ? "Activa" : "Suspendida"}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-gray-950">Senales de salud</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-black text-gray-900">Productos incompletos</p>
              <p className="mt-1 text-sm text-gray-500">{noImageProducts + noCategoryProducts + noPriceProducts} hallazgos principales entre imagen, categoria y precio.</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-black text-gray-900">Tiendas por completar</p>
              <p className="mt-1 text-sm text-gray-500">{storesWithoutType + storesWithoutWhatsapp + storesWithSeoIncomplete} configuraciones pendientes.</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-black text-gray-900">Roles globales</p>
              <p className="mt-1 text-sm text-gray-500">Roles admin: {Array.from(GLOBAL_ADMIN_ROLES).map(roleLabel).join(", ")}. Soporte y desarrolladores tienen vista limitada.</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-black text-gray-900">Correo único</p>
              <p className="mt-1 text-sm text-gray-500">La base de datos protege cuentas duplicadas con índice único por correo.</p>
            </div>
          </div>
        </Card>
      </section>

      <section id="tiendas">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-950">Gestion de tiendas</h2>
              <p className="mt-1 text-sm text-gray-500">Busca, revisa estado, productos y acceso al detalle tecnico de cada tienda.</p>
            </div>
            <form className="grid gap-2 sm:grid-cols-[220px_220px_auto]" action="/admin">
              <input name="storeQ" defaultValue={storeQ} placeholder="Buscar tienda o dueno" className="rounded-2xl border border-gray-200 px-4 py-2 text-sm" />
              <select name="storeType" defaultValue={storeType} className="rounded-2xl border border-gray-200 px-4 py-2 text-sm">
                <option value="">Todos los tipos</option>
                {getStoreTypeOptions().map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button className="rounded-2xl bg-black px-4 py-2 text-sm font-black text-white">Filtrar</button>
            </form>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Tienda</th>
                  <th>Dueno</th>
                  <th>Tipo</th>
                  <th>Plan</th>
                  <th>Estado</th>
                  <th>Datos</th>
                  <th>Creada</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stores.map((business) => (
                  <tr key={business.id} className="border-b border-gray-100 align-top">
                    <td className="py-4">
                      <Link href={`/admin/stores/${business.id}`} className="font-black text-gray-950 hover:underline">{business.name}</Link>
                      <p className="text-xs text-gray-400">/store/{business.publicSlug}</p>
                    </td>
                    <td>
                      <p className="font-semibold">{business.owner.name}</p>
                      <p className="text-xs text-gray-500">{visibleEmail(business.owner.email, canManage)}</p>
                    </td>
                    <td>{getStoreTypeLabel(business.businessType)}</td>
                    <td>{planDisplayName(business.plan, business.owner)}</td>
                    <td><span className={statusBadge(business.isActive)}>{business.isActive ? "Activa" : "Suspendida"}</span></td>
                    <td className="text-xs text-gray-500">
                      {business._count.products} productos<br />
                      {business._count.categories} categorias<br />
                      {business._count.customers} clientes
                    </td>
                    <td>{dateLabel(business.createdAt)}</td>
                    <td className="min-w-40 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/admin/stores/${business.id}`} className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-700">Detalle</Link>
                        {canManage ? (
                          <form action={toggleBusinessActiveAction}>
                            <input type="hidden" name="id" value={business.id} />
                            <input type="hidden" name="isActive" value={business.isActive ? "false" : "true"} />
                            <ConfirmSubmitButton
                              message={business.isActive ? `Suspender ${business.name}?` : `Reactivar ${business.name}?`}
                              className={business.isActive ? "rounded-2xl bg-red-600 px-3 py-2 text-xs font-black text-white" : "rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"}
                            >
                              {business.isActive ? "Suspender" : "Reactivar"}
                            </ConfirmSubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stores.length === 0 ? (
              <EmptyState title="No hay tiendas con ese filtro" description="Ajusta la busqueda o limpia los filtros para ver tiendas registradas." />
            ) : null}
          </div>
        </Card>
      </section>

      <section id="usuarios">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-950">Gestion de usuarios</h2>
              <p className="mt-1 text-sm text-gray-500">Roles globales, tiendas asociadas y antiguedad de cuentas. No se consultan credenciales ni datos sensibles.</p>
            </div>
            <form className="grid gap-2 sm:grid-cols-[260px_auto]" action="/admin#usuarios">
              <input name="userQ" defaultValue={userQ} placeholder="Buscar usuario, email o rol" className="rounded-2xl border border-gray-200 px-4 py-2 text-sm" />
              <button className="rounded-2xl bg-black px-4 py-2 text-sm font-black text-white">Buscar</button>
            </form>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Usuario</th>
                  <th>Rol global</th>
                  <th>Tiendas</th>
                  <th>Creado</th>
                  <th>Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 align-top">
                    <td className="py-4">
                      <p className="font-black text-gray-950">{user.name}</p>
                      <p className="text-xs text-gray-500">{visibleEmail(user.email, canManage)}</p>
                    </td>
                    <td>
                      <span
                        title={roleTitle(user.role)}
                        className={GLOBAL_ADMIN_ROLES.has(user.role) ? "rounded-full bg-black px-3 py-1 text-xs font-black text-white" : "rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700"}
                      >
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="text-xs text-gray-500">
                      <p>{user._count.businesses} propias · {user._count.memberships} membresias</p>
                      {user.memberships.map((membership) => (
                        <p key={membership.business.id}>{membership.business.name} ({membership.role.replace("STORE_", "").toLowerCase()})</p>
                      ))}
                    </td>
                    <td>{dateLabel(user.createdAt)}</td>
                    <td>
                      {canManage ? (
                        <form action={updateUserRoleAction} className="flex min-w-72 flex-wrap gap-2">
                          <input type="hidden" name="id" value={user.id} />
                          <select name="role" defaultValue={user.role} className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold">
                            {roleOptions.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
                          </select>
                          <ConfirmSubmitButton message={`Cambiar rol de ${user.email}?`} className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-black text-gray-700">
                            Guardar
                          </ConfirmSubmitButton>
                        </form>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400">Solo lectura</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section id="productos">
        <Card>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-950">Productos globales</h2>
              <p className="mt-1 text-sm text-gray-500">Vista transversal para detectar productos incompletos sin editar datos sensibles desde UI publica.</p>
            </div>
            <form className="grid gap-2 md:grid-cols-[220px_220px_180px_auto]" action="/admin#productos">
              <input name="productQ" defaultValue={productQ} placeholder="Buscar producto o tienda" className="rounded-2xl border border-gray-200 px-4 py-2 text-sm" />
              <select name="productStore" defaultValue={productStore} className="rounded-2xl border border-gray-200 px-4 py-2 text-sm">
                <option value="">Todas las tiendas</option>
                {storeOptions.map((business) => <option key={business.id} value={business.id}>{business.name}</option>)}
              </select>
              <select name="productStatus" defaultValue={validProductStatus} className="rounded-2xl border border-gray-200 px-4 py-2 text-sm">
                <option value="">Todos</option>
                <option value={ProductStatus.ACTIVE}>Activo</option>
                <option value={ProductStatus.DRAFT}>Borrador</option>
                <option value={ProductStatus.ARCHIVED}>Archivado</option>
              </select>
              <button className="rounded-2xl bg-black px-4 py-2 text-sm font-black text-white">Filtrar</button>
            </form>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Producto</th>
                  <th>Tienda</th>
                  <th>Estado</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Problemas</th>
                  <th>Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const issues = [
                    !product.imageUrl ? "Sin imagen" : "",
                    !product.categoryId ? "Sin categoria" : "",
                    product.price <= 0 ? "Sin precio" : "",
                    product.stock < 0 ? "Stock negativo" : "",
                    product.attributesJson && !parseJsonRecord(product.attributesJson) ? "Ficha técnica inválida" : ""
                  ].filter(Boolean);
                  return (
                    <tr key={product.id} className="border-b border-gray-100 align-top">
                      <td className="py-4">
                        <p className="font-black text-gray-950">{product.name || "Producto sin nombre"}</p>
                        <p className="text-xs text-gray-500">SKU {product.sku ?? "N/D"} · {product.category?.name ?? "Sin categoria"}</p>
                      </td>
                      <td>
                        <Link href={`/admin/stores/${product.business.id}`} className="font-semibold hover:underline">{product.business.name}</Link>
                        <p className="text-xs text-gray-400">/{product.business.publicSlug}</p>
                      </td>
                      <td><span className={productStatusBadge(product.status)}>{product.status}</span></td>
                      <td>{product.price}</td>
                      <td>{product.stock}</td>
                      <td className="text-xs text-gray-500">{issues.length ? issues.join(", ") : "OK"}</td>
                      <td>{dateLabel(product.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 ? (
              <EmptyState title="No hay productos con ese filtro" description="Ajusta la busqueda para revisar productos de la plataforma." />
            ) : null}
          </div>
        </Card>
      </section>

      <section id="diagnostico">
        <div className="mb-4">
          <h2 className="text-2xl font-black text-gray-950">Diagnostico y salud del sistema</h2>
          <p className="mt-1 text-sm text-gray-500">Hallazgos accionables para mejorar datos de tiendas y calidad del catalogo.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {issueCard({ title: "Productos sin imagen", count: noImageProducts, severity: "media", recommendation: "Subir imagen principal mejora confianza, conversion y experiencia movil.", href: "/admin#productos" })}
          {issueCard({ title: "Productos sin precio", count: noPriceProducts, severity: "alta", recommendation: "Revisar precios en cero o negativos antes de publicar ofertas.", href: "/admin#productos" })}
          {issueCard({ title: "Productos sin categoria", count: noCategoryProducts, severity: "media", recommendation: "Categorizar productos mejora busqueda publica y navegacion.", href: "/admin#productos" })}
          {issueCard({ title: "Características inválidas", count: invalidAttributeProducts.length, severity: "alta", recommendation: "Corregir la ficha técnica evita fallos de presentación y productos incompletos.", href: "/admin#productos" })}
          {issueCard({ title: "Stock negativo", count: negativeStockProducts, severity: "alta", recommendation: "Validar inventario para evitar ventas imposibles o reportes incorrectos.", href: "/admin#productos" })}
          {issueCard({ title: "Productos sin nombre", count: emptyNameProducts, severity: "alta", recommendation: "Un producto sin nombre no debe llegar al catalogo publico.", href: "/admin#productos" })}
          {issueCard({ title: "Tiendas sin tipo de negocio", count: storesWithoutType, severity: "media", recommendation: "El tipo de negocio activa atributos dinamicos y recomendaciones de onboarding.", href: "/admin#tiendas" })}
          {issueCard({ title: "Tiendas sin WhatsApp", count: storesWithoutWhatsapp, severity: "media", recommendation: "WhatsApp es el canal principal de cierre comercial del catalogo.", href: "/admin#tiendas" })}
          {issueCard({ title: "Tiendas sin productos", count: storesWithoutProducts, severity: "media", recommendation: "Orientar onboarding para que creen su primer producto.", href: "/admin#tiendas" })}
          {issueCard({ title: "SEO incompleto", count: storesWithSeoIncomplete, severity: "baja", recommendation: "Completar titulo y descripcion ayuda a compartir mejor el catalogo.", href: "/admin#tiendas" })}
        </div>
        {invalidAttributeProducts.length > 0 ? (
          <Card className="mt-5">
            <h3 className="text-lg font-black text-gray-950">Muestra de atributos invalidos</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {invalidAttributeProducts.slice(0, 8).map((product) => (
                <div key={product.id} className="rounded-2xl bg-red-50 p-4 text-sm">
                  <p className="font-black text-red-800">{product.name}</p>
                  <p className="text-red-700">{product.business.name} · /{product.business.publicSlug}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </section>

      <section id="auditoria" className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <h2 className="text-xl font-black text-gray-950">Logs y auditoria</h2>
          <p className="mt-1 text-sm text-gray-500">Acciones recientes registradas por el sistema.</p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Accion</th>
                  <th>Usuario</th>
                  <th>Tienda</th>
                  <th>Recurso</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100">
                    <td className="py-4 font-semibold">{log.action}</td>
                    <td>{log.user?.email ? visibleEmail(log.user.email, canManage) : "Sistema"}</td>
                    <td>{log.business?.name ?? "-"}</td>
                    <td>{log.resourceType}{log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}</td>
                    <td>{log.createdAt.toLocaleString("es-CL")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {auditLogs.length === 0 ? <EmptyState title="Sin eventos de auditoría" description="Cuando existan cambios sensibles de roles, tiendas, uploads o billing, aparecerán en este listado." /> : null}
          </div>
        </Card>
        <Card id="configuracion">
          <h2 className="text-xl font-black text-gray-950">Configuracion global</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-black text-gray-900">Bootstrap admin</p>
              <p className="mt-1">{secureBootstrapConfigured ? "Configurado con longitud segura." : "No configurado o longitud insuficiente."}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-black text-gray-900">Unlock dev por email</p>
              <p className="mt-1">{process.env.PLATFORM_OWNER_EMAILS_DEV_UNLOCK === "true" ? "Activo solo fuera de produccion." : "Inactivo."}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-black text-gray-900">Planes</p>
              <p className="mt-1">{plans.length} planes definidos en base de datos.</p>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <h2 className="text-xl font-black text-gray-950">Planes del SaaS</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Plan</th>
                  <th>Productos</th>
                  <th>Imagenes</th>
                  <th>IA mensual</th>
                  <th>Miembros</th>
                  <th>SEO</th>
                  <th>Analytics</th>
                  <th>Soporte</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_SLUGS
                  .map((slug) => plans.find((plan) => plan.type === slug))
                  .filter((plan): plan is (typeof plans)[number] => Boolean(plan))
                  .map((plan) => (
                  <tr key={plan.id} className="border-b border-gray-100">
                    <td className="py-4 font-black">{plan.name}</td>
                    <td>{formatDbLimit(plan.maxProducts)}</td>
                    <td>{formatDbLimit(plan.maxImages)}</td>
                    <td>{formatDbLimit(plan.maxAiConversationsMonthly)}</td>
                    <td>{formatDbLimit(plan.maxMembers)}</td>
                    <td>{plan.advancedSeoEnabled ? "Si" : "No"}</td>
                    <td>{plan.analyticsEnabled ? "Si" : "No"}</td>
                    <td>{plan.supportLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {plans.length === 0 ? <EmptyState title="No hay planes configurados" description="Crea planes base para aplicar límites comerciales por tienda." /> : null}
        </Card>
      </section>

      <section id="proximas-mejoras">
        <div className="mb-4">
          <h2 className="text-2xl font-black text-gray-950">Próximas mejoras</h2>
          <p className="mt-1 text-sm text-gray-500">Camino recomendado para convertir la plataforma en un SaaS vendible y operable en producción.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {roadmapGroups.map((group) => (
            <Card key={group.title}>
              <h3 className="text-lg font-black text-gray-950">{group.title}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                {group.items.map((item) => (
                  <li key={item} className="rounded-2xl bg-gray-50 px-4 py-3">{item}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
