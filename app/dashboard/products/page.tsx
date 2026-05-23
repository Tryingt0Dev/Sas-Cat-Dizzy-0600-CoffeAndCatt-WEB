import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { Card } from "@/components/Card";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { ImageDropzone } from "@/components/ImageDropzone";
import { Input, Select, Textarea } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { StatusAlert } from "@/components/StatusAlert";
import { createProductAction, deleteProductAction, duplicateProductAction, updateProductAction } from "./actions";
import { formatCLP, getFinalPrice } from "@/lib/format";
import { enumValues, ProductStatus, type ProductStatus as ProductStatusValue } from "@/lib/enums";

type ProductSearchParams = {
  success?: string;
  error?: string;
  q?: string;
  category?: string;
  status?: string;
};

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<ProductSearchParams | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const business = await getCurrentBusiness();
  const q = String(resolvedSearchParams?.q ?? "").trim();
  const category = String(resolvedSearchParams?.category ?? "").trim();
  const status = String(resolvedSearchParams?.status ?? "").trim();
  const validStatus = enumValues(ProductStatus).includes(status as ProductStatusValue) ? status : undefined;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        businessId: business.id,
        ...(validStatus ? { status: validStatus } : {}),
        ...(category ? { categoryId: category } : {}),
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
    prisma.category.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } })
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Inventario"
        title="Productos"
        description="Crea, edita, duplica y controla stock con datos separados por tienda."
        actions={
          <a href={`/store/${business.slug}`} target="_blank" className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm">
            Ver catálogo
          </a>
        }
      />
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <h2 className="text-xl font-black">Nuevo producto</h2>
          <form action={createProductAction} className="mt-5 space-y-3">
            <Input name="name" placeholder="Nombre del producto" required />
            <Input name="sku" placeholder="SKU opcional" />
            <Select name="categoryId" defaultValue="">
              <option value="">Sin categoría</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
            <Textarea name="description" placeholder="Descripción" rows={3} />
            <div className="grid grid-cols-2 gap-3">
              <Input name="price" type="number" min={0} placeholder="Precio" required />
              <Input name="compareAtPrice" type="number" min={0} placeholder="Precio antes" />
              <Input name="discountPercent" type="number" placeholder="% descuento" min={0} max={100} />
              <Input name="stock" type="number" min={0} placeholder="Stock" />
              <Input name="costPrice" type="number" min={0} placeholder="Costo" />
              <Input name="minStock" type="number" min={0} placeholder="Stock mínimo" />
            </div>
            <ImageDropzone name="imageUrl" businessId={business.id} label="Imagen principal del producto" />
            <Input name="tags" placeholder="Tags: ropa, rosa, oferta" />
            <Select name="status" defaultValue={ProductStatus.ACTIVE}>
              <option value={ProductStatus.ACTIVE}>Activo</option>
              <option value={ProductStatus.DRAFT}>Borrador</option>
              <option value={ProductStatus.ARCHIVED}>Archivado</option>
            </Select>
            <label className="flex items-center gap-2 text-sm font-semibold"><input name="featured" type="checkbox" /> Destacado</label>
            <PendingSubmitButton className="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
              Crear producto
            </PendingSubmitButton>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-gray-900">{products.length} resultado{products.length === 1 ? "" : "s"}</p>
                <p className="text-xs text-gray-500">Filtra rápido por categoría, estado o búsqueda.</p>
              </div>
              {(q || category || validStatus) && <a href="/dashboard/products" className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Limpiar</a>}
            </div>
            <form className="grid gap-3 md:grid-cols-[1fr_180px_160px_auto]" action="/dashboard/products">
              <Input name="q" defaultValue={q} placeholder="Buscar por nombre, SKU o tags" />
              <Select name="category" defaultValue={category}>
                <option value="">Todas las categorías</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
              <Select name="status" defaultValue={validStatus ?? ""}>
                <option value="">Todos los estados</option>
                <option value={ProductStatus.ACTIVE}>Activo</option>
                <option value={ProductStatus.DRAFT}>Borrador</option>
                <option value={ProductStatus.ARCHIVED}>Archivado</option>
              </Select>
              <button className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white">Filtrar</button>
            </form>
          </Card>

          {products.map((product) => {
            const lowStock = product.stock > 0 && product.stock <= Math.max(product.minStock, 3);
            return (
              <Card key={product.id} className="grid gap-4 lg:grid-cols-[120px_1fr]">
                <img src={product.imageUrl || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop"} alt={product.name} className="h-28 w-28 rounded-2xl object-cover" />
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">{product.category?.name ?? "Sin categoría"}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">{product.status}</span>
                        {lowStock && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Stock bajo</span>}
                        {product.stock <= 0 && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">Sin stock</span>}
                      </div>
                      <h3 className="mt-2 text-lg font-black">{product.name}</h3>
                      <p className="text-sm text-gray-500">SKU {product.sku ?? "-"} · Stock {product.stock} · Consultas IA {product.aiConsultCount}</p>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                    </div>
                    <div className="text-right">
                      {product.discountPercent > 0 && <p className="text-xs font-bold text-pink-600">-{product.discountPercent}%</p>}
                      <p className="text-xl font-black">{formatCLP(getFinalPrice(product.price, product.discountPercent))}</p>
                      {(product.compareAtPrice || product.discountPercent > 0) && <p className="text-sm text-gray-400 line-through">{formatCLP(product.compareAtPrice ?? product.price)}</p>}
                    </div>
                  </div>

                  <details className="mt-4 rounded-2xl bg-gray-50 p-4">
                    <summary className="cursor-pointer text-sm font-black">Editar producto completo</summary>
                    <form action={updateProductAction} className="mt-4 grid gap-3">
                      <input type="hidden" name="id" value={product.id} />
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input name="name" defaultValue={product.name} required />
                        <Input name="sku" defaultValue={product.sku ?? ""} placeholder="SKU" />
                        <Select name="categoryId" defaultValue={product.categoryId ?? ""}>
                          <option value="">Sin categoría</option>
                          {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </Select>
                        <Select name="status" defaultValue={product.status}>
                          <option value={ProductStatus.ACTIVE}>Activo</option>
                          <option value={ProductStatus.DRAFT}>Borrador</option>
                          <option value={ProductStatus.ARCHIVED}>Archivado</option>
                        </Select>
                      </div>
                      <Textarea name="description" defaultValue={product.description ?? ""} rows={3} />
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
                        <Input name="price" type="number" min={0} defaultValue={product.price} />
                        <Input name="compareAtPrice" type="number" min={0} defaultValue={product.compareAtPrice ?? ""} />
                        <Input name="costPrice" type="number" min={0} defaultValue={product.costPrice ?? ""} />
                        <Input name="discountPercent" type="number" min={0} max={100} defaultValue={product.discountPercent} />
                        <Input name="stock" type="number" min={0} defaultValue={product.stock} />
                        <Input name="minStock" type="number" min={0} defaultValue={product.minStock} />
                      </div>
                      <ImageDropzone name="imageUrl" businessId={business.id} label="Imagen principal del producto" initialUrl={product.imageUrl} />
                      <Input name="tags" defaultValue={product.tags ?? ""} placeholder="Tags" />
                      <label className="flex items-center gap-2 text-sm font-semibold"><input name="featured" type="checkbox" defaultChecked={product.featured} /> Destacado</label>
                      <div className="flex flex-wrap gap-2">
                        <PendingSubmitButton className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                          Guardar cambios
                        </PendingSubmitButton>
                      </div>
                    </form>
                  </details>

                  <div className="mt-3 flex flex-wrap gap-3">
                    <form action={duplicateProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <button className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold">Duplicar</button>
                    </form>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <ConfirmSubmitButton message={`¿Eliminar ${product.name}?`} className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white">
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
          {products.length === 0 && <Card><p className="text-gray-500">No hay productos con esos filtros.</p></Card>}
        </div>
      </div>
    </div>
  );
}
