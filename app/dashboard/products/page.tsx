import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { EmptyState } from "@/components/EmptyState";
import { HelpTooltip } from "@/components/HelpTooltip";
import { ImageDropzone } from "@/components/ImageDropzone";
import { Input, Select, Textarea } from "@/components/Input";
import { LearningLink } from "@/components/LearningLink";
import { PageHeader } from "@/components/PageHeader";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SectionGuide } from "@/components/SectionGuide";
import { StatusAlert } from "@/components/StatusAlert";
import { ProductAttributesFields } from "@/components/ProductAttributesFields";
import { createProductAction, deleteProductAction, duplicateProductAction, updateProductAction } from "./actions";
import { formatCLP, getFinalPrice } from "@/lib/format";
import { enumValues, ProductStatus, type ProductStatus as ProductStatusValue } from "@/lib/enums";
import { parseStringRecord } from "@/lib/safe-json";
import { getAttributeLabels } from "@/lib/store-types";

type ProductSearchParams = {
  success?: string;
  error?: string;
  q?: string;
  category?: string;
  status?: string;
};

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<ProductSearchParams | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { business } = await requireStoreAccess({ permission: "manage_products" });
  const q = String(resolvedSearchParams?.q ?? "").trim();
  const category = String(resolvedSearchParams?.category ?? "").trim();
  const status = String(resolvedSearchParams?.status ?? "").trim();
  const validStatus = enumValues(ProductStatus).includes(status as ProductStatusValue) ? status : undefined;
  const dynamicFields = getAttributeLabels(business.businessType);

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
          <div className="flex flex-wrap gap-2">
            <a href={`/store/${business.publicSlug}`} target="_blank" className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm">
              Ver catálogo
            </a>
            <LearningLink href="/dashboard/learning#productos" className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm">
              Guía de productos
            </LearningLink>
          </div>
        }
      />
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />
      <SectionGuide
        eyebrow="Productos"
        title="Publica productos sin confusión"
        description="Completa los datos esenciales, mantén tu stock actualizado y usa la ayuda contextual para entender cada campo." 
        help="Los productos con stock bajo te llegarán al dashboard y puedes crear un producto activo para comenzar a vender." 
        actions={<LearningLink href="/dashboard/learning#productos">Ver guía</LearningLink>}
      />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Nuevo producto</h2>
              <p className="mt-1 text-sm text-gray-500">Crea un producto activo con precio, stock y una imagen atractiva para tu catálogo público.</p>
            </div>
            <HelpTooltip description="Completa el nombre, precio, stock y al menos una imagen para publicar un producto visible en tu catálogo." />
          </div>
          <form action={createProductAction} className="mt-5 space-y-4">
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">Información básica</h3>
              <label className="block text-sm font-semibold text-gray-900">
                Nombre del producto
                <span className="mt-1 block text-xs text-gray-500">Ej: Polera blanca manga corta.</span>
                <Input name="name" placeholder="Nombre del producto" required />
              </label>
              <label className="block text-sm font-semibold text-gray-900">
                SKU opcional
                <span className="mt-1 block text-xs text-gray-500">Identificador interno para tu inventario.</span>
                <Input name="sku" placeholder="SKU opcional" />
              </label>
              <label className="block text-sm font-semibold text-gray-900">
                Categoría
                <span className="mt-1 block text-xs text-gray-500">Clasifica el producto para que los clientes encuentren más fácil.</span>
                <Select name="categoryId" defaultValue="">
                  <option value="">Sin categoría</option>
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </label>
              <label className="block text-sm font-semibold text-gray-900">
                Descripción
                <span className="mt-1 block text-xs text-gray-500">Describe el producto y sus beneficios en pocas palabras.</span>
                <Textarea name="description" placeholder="Descripción" rows={3} />
              </label>
            </div>
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">Precio y stock</h3>
              <div className="grid gap-3 lg:grid-cols-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Precio
                  <span className="mt-1 block text-xs text-gray-500">Precio final que verá el cliente.</span>
                  <Input name="price" type="number" min={0} placeholder="Precio" required />
                </label>
                <label className="block text-sm font-semibold text-gray-900">
                  Precio antes
                  <span className="mt-1 block text-xs text-gray-500">Opcional. Úsalo para mostrar descuento.</span>
                  <Input name="compareAtPrice" type="number" min={0} placeholder="Precio antes" />
                </label>
                <label className="block text-sm font-semibold text-gray-900">
                  % Descuento
                  <span className="mt-1 block text-xs text-gray-500">Valor entre 0 y 100 para destacar ofertas.</span>
                  <Input name="discountPercent" type="number" placeholder="% descuento" min={0} max={100} />
                </label>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Stock
                  <span className="mt-1 block text-xs text-gray-500">Cantidad real disponible para la venta.</span>
                  <Input name="stock" type="number" min={0} placeholder="Stock" />
                </label>
                <label className="block text-sm font-semibold text-gray-900">
                  Costo
                  <span className="mt-1 block text-xs text-gray-500">Costo interno del producto para tu control.</span>
                  <Input name="costPrice" type="number" min={0} placeholder="Costo" />
                </label>
                <label className="block text-sm font-semibold text-gray-900">
                  Stock mínimo
                  <span className="mt-1 block text-xs text-gray-500">Recibirás alerta cuando el stock sea bajo.</span>
                  <Input name="minStock" type="number" min={0} placeholder="Stock mínimo" />
                </label>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">Imágenes, ficha y publicación</h3>
              <ImageDropzone name="imageUrl" businessId={business.id} label="Imagen principal del producto" />
              <label className="block text-sm font-semibold text-gray-900">
                Tags
                <span className="mt-1 block text-xs text-gray-500">Ej: ropa, oferta, verano. Se usan para búsquedas internas y filtros.</span>
                <Input name="tags" placeholder="Tags: ropa, rosa, oferta" />
              </label>
              <ProductAttributesFields fields={dynamicFields} />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="featured" type="checkbox" />
                Destacado
              </label>
            </div>
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
            const currentProductAttributes = parseStringRecord(product.attributesJson);
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
                      <ProductAttributesFields fields={dynamicFields} currentAttributes={currentProductAttributes} />
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
          {products.length === 0 && (
            <EmptyState
              title="No hay productos aún"
              description="Agrega tu primer producto para empezar a mostrar tu catálogo público y recibir consultas." 
              action={<LearningLink href="/dashboard/learning#productos">Aprender a crear un producto</LearningLink>}
            />
          )}
        </div>
      </div>
    </div>
  );
}
