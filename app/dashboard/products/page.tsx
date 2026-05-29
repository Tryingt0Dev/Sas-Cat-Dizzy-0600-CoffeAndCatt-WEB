import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input, Select } from "@/components/Input";
import { LearningLink } from "@/components/LearningLink";
import { PageHeader } from "@/components/PageHeader";
import { StatusAlert } from "@/components/StatusAlert";
import { StatusBadge } from "@/components/StatusBadge";
import { defaultProductImage } from "@/lib/catalog";
import { formatCLP, getFinalPrice } from "@/lib/format";
import { enumValues, ProductStatus, type ProductStatus as ProductStatusValue } from "@/lib/enums";
import { getAttributeLabels } from "@/lib/store-types";
import { formatPlanLimit, getPlanEntitlements } from "@/lib/plans";
import { ProductCreateDrawer } from "./ProductCreateDrawer";
import { ProductTableActions } from "./ProductTableActions";

type ProductSearchParams = {
  success?: string;
  error?: string;
  q?: string;
  category?: string;
  status?: string;
  stock?: string;
  price?: string;
  create?: string;
  newCategoryId?: string;
};

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<ProductSearchParams | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { business, plan } = await requireStoreAccess({ permission: "manage_products" });
  const q = String(resolvedSearchParams?.q ?? "").trim();
  const category = String(resolvedSearchParams?.category ?? "").trim();
  const status = String(resolvedSearchParams?.status ?? "").trim();
  const stock = String(resolvedSearchParams?.stock ?? "").trim();
  const price = String(resolvedSearchParams?.price ?? "").trim();
  const newCategoryId = String(resolvedSearchParams?.newCategoryId ?? "").trim();
  const validStatus = enumValues(ProductStatus).includes(status as ProductStatusValue) ? status : undefined;
  const dynamicFields = getAttributeLabels(business.businessType);
  const validStock = ["in_stock", "low", "out"].includes(stock) ? stock : "";
  const validPrice = ["under_10000", "10000_50000", "over_50000"].includes(price) ? price : "";
  const priceWhere =
    validPrice === "under_10000"
      ? { price: { lt: 10000 } }
      : validPrice === "10000_50000"
        ? { price: { gte: 10000, lte: 50000 } }
        : validPrice === "over_50000"
          ? { price: { gt: 50000 } }
          : {};

  const [rawProducts, categories, productCount] = await Promise.all([
    prisma.product.findMany({
      where: {
        businessId: business.id,
        ...(validStatus ? { status: validStatus } : {}),
        ...(category ? { categoryId: category } : {}),
        ...(validStock === "in_stock" ? { stock: { gt: 0 } } : {}),
        ...(validStock === "out" ? { stock: { lte: 0 } } : {}),
        ...priceWhere,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { sku: { contains: q } },
                { description: { contains: q } },
                { tags: { contains: q } }
              ]
            }
          : {})
      },
      include: { category: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.category.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
    prisma.product.count({ where: { businessId: business.id } })
  ]);
  const products =
    validStock === "low"
      ? rawProducts.filter((product) => product.stock > 0 && product.stock <= Math.max(product.minStock, 3))
      : rawProducts;
  const productLimit = getPlanEntitlements(plan.type).maxProducts;
  const productLimitReached = productLimit !== "unlimited" && productCount >= productLimit;
  const activeFilters = Boolean(q || category || validStatus || validStock || validPrice);
  const activeProductCount = products.filter((product) => product.status === ProductStatus.ACTIVE).length;
  const lowStockCount = rawProducts.filter((product) => product.stock > 0 && product.stock <= Math.max(product.minStock, 3)).length;
  const statusLabels: Record<ProductStatusValue, string> = {
    [ProductStatus.ACTIVE]: "Visible",
    [ProductStatus.DRAFT]: "No visible",
    [ProductStatus.ARCHIVED]: "Archivado"
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Inventario"
        title="Productos"
        description="Gestiona catálogo, stock y visibilidad desde una vista compacta."
        actions={
          <div className="flex flex-wrap gap-2">
            <ProductCreateDrawer
              businessId={business.id}
              categories={categories}
              dynamicFields={dynamicFields}
              disabled={productLimitReached}
              defaultCategoryId={newCategoryId}
              initialOpen={!productLimitReached && resolvedSearchParams?.create === "1"}
            />
            <a href={`/store/${business.publicSlug}`} target="_blank" className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-black text-[var(--app-text)] shadow-sm transition duration-200 hover:bg-[var(--app-surface-muted)]">
              Ver catálogo
            </a>
            <LearningLink href="/dashboard/learning#productos" className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-black text-[var(--app-text)] shadow-sm transition duration-200 hover:bg-[var(--app-surface-muted)]">
              Guía de productos
            </LearningLink>
          </div>
        }
      />
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />

      {productLimitReached ? (
        <Card className="border-amber-200 bg-amber-50 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-amber-950">Límite de productos alcanzado</h2>
              <p className="mt-1 text-xs text-amber-800">
                Tu plan actual permite hasta {formatPlanLimit(productLimit)} productos. Puedes editar productos existentes, pero para agregar mas necesitas un plan superior.
              </p>
            </div>
            <a href="/settings/billing" className="rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-black text-[var(--app-button-text)] transition duration-200 hover:bg-[var(--app-primary-hover)]">Ver planes</a>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total", productCount],
          ["En vista", products.length],
          ["Visibles", activeProductCount],
          ["Stock bajo", lowStockCount]
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-3">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--app-text-muted)]">{label}</p>
            <p className="mt-1 text-xl font-black text-[var(--app-text)]">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-[var(--app-text)]">{products.length} producto{products.length === 1 ? "" : "s"}</h2>
            <p className="text-xs text-[var(--app-text-muted)]">Busca, filtra y gestiona sin salir de la lista.</p>
          </div>
          {activeFilters ? <a href="/dashboard/products" className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-bold text-[var(--app-text)] transition duration-200 hover:bg-[var(--app-surface-muted)]">Limpiar filtros</a> : null}
        </div>

        <form className="mb-3 grid gap-2 grid-cols-1 min-[520px]:grid-cols-2 md:grid-cols-[minmax(0,1.4fr)_130px_120px_120px_130px_auto]" action="/dashboard/products">
          <Input name="q" defaultValue={q} placeholder="Buscar por nombre, SKU o tags..." className="py-2 text-xs" />
          <Select name="category" defaultValue={category} className="py-2 text-xs">
            <option value="">Categorias</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
          <Select name="status" defaultValue={validStatus ?? ""} className="py-2 text-xs">
            <option value="">Estados</option>
            <option value={ProductStatus.ACTIVE}>Visible</option>
            <option value={ProductStatus.DRAFT}>No visible</option>
            <option value={ProductStatus.ARCHIVED}>Archivado</option>
          </Select>
          <Select name="stock" defaultValue={validStock} className="py-2 text-xs">
            <option value="">Stock</option>
            <option value="in_stock">Con stock</option>
            <option value="low">Stock bajo</option>
            <option value="out">Agotado</option>
          </Select>
          <Select name="price" defaultValue={validPrice} className="py-2 text-xs">
            <option value="">Precio</option>
            <option value="under_10000">{'< $10.000'}</option>
            <option value="10000_50000">$10k-$50k</option>
            <option value="over_50000">{'> $50.000'}</option>
          </Select>
          <button className="rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-bold text-[var(--app-button-text)] hover:bg-[var(--app-primary-hover)]">Filtrar</button>
        </form>

        {products.length === 0 ? (
          <EmptyState
            title={activeFilters ? "No encontramos resultados" : "No hay productos aún"}
            description={activeFilters ? "No encontramos resultados con estos filtros." : "Crea tu primer producto para comenzar a vender."}
            action={
              activeFilters ? (
                <a href="/dashboard/products" className="rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-black text-[var(--app-button-text)]">Limpiar filtros</a>
              ) : (
                <LearningLink href="/dashboard/learning#productos">Aprender a crear un producto</LearningLink>
              )
            }
          />
        ) : (
          <div className="rounded-xl border border-[var(--app-border)]">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[var(--app-surface-muted)] text-left text-[0.65rem] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                <tr>
                  <th className="px-3 py-2">Producto</th>
                  <th className="hidden px-3 py-2 md:table-cell">Categoría</th>
                  <th className="hidden px-3 py-2 lg:table-cell">Estado</th>
                  <th className="hidden px-3 py-2 text-right sm:table-cell">Stock</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {products.map((product) => {
                  const lowStock = product.stock > 0 && product.stock <= Math.max(product.minStock, 3);
                  return (
                    <tr key={product.id} className="align-middle transition duration-200 hover:bg-[var(--app-surface-muted)]/70">
                      <td className="min-w-0 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={product.imageUrl || defaultProductImage}
                            alt={product.name}
                            className="h-11 w-11 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[var(--app-text)]">{product.name}</p>
                            <p className="truncate text-xs text-[var(--app-text-muted)]">SKU {product.sku ?? "-"} · {product.category?.name ?? "Sin categoría"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] md:table-cell">{product.category?.name ?? "Sin categoría"}</td>
                      <td className="hidden px-3 py-2 lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge variant={product.status === ProductStatus.ACTIVE ? "success" : product.status === ProductStatus.DRAFT ? "warning" : "neutral"}>
                            {statusLabels[product.status as ProductStatusValue] ?? product.status}
                          </StatusBadge>
                          {lowStock && <StatusBadge variant="warning">Stock bajo</StatusBadge>}
                        </div>
                      </td>
                      <td className="hidden px-3 py-2 text-right text-xs font-bold text-[var(--app-text)] sm:table-cell">{product.stock}</td>
                      <td className="px-3 py-2 text-right">
                        {product.discountPercent > 0 && <p className="text-[0.65rem] font-bold text-pink-600">-{product.discountPercent}%</p>}
                        <p className="whitespace-nowrap text-sm font-black text-[var(--app-text)]">{formatCLP(getFinalPrice(product.price, product.discountPercent))}</p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <ProductTableActions product={product} categories={categories} dynamicFields={dynamicFields} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
