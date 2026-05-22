import { AskAiButton } from "@/components/catalog/AskAiButton";
import { SafeImage } from "@/components/catalog/SafeImage";
import { WhatsAppProductButton } from "@/components/catalog/WhatsAppProductButton";
import { defaultProductImage, type CatalogBusiness, type CatalogProduct } from "@/lib/catalog";
import { formatCLP, getFinalPrice } from "@/lib/format";

type ProductCardVariant = "modern" | "premium" | "fast" | "tech";

export function ProductCard({
  business,
  product,
  variant = "modern"
}: {
  business: CatalogBusiness;
  product: CatalogProduct;
  variant?: ProductCardVariant;
}) {
  const finalPrice = getFinalPrice(product.price, product.discountPercent);
  const formattedFinalPrice = formatCLP(finalPrice);
  const lowStock = product.stock > 0 && product.stock <= Math.max(product.minStock, 3);
  const outOfStock = product.stock <= 0;
  const premium = variant === "premium";
  const fast = variant === "fast";
  const tech = variant === "tech";
  const askButtonClass = fast
    ? "min-h-11 rounded-[var(--catalog-radius)] bg-[var(--catalog-accent)] px-4 text-sm font-black text-white"
    : "min-h-11 rounded-[var(--catalog-radius)] border border-black/10 bg-white px-4 text-sm font-black text-[var(--catalog-text)]";

  return (
    <article className={premium ? "overflow-hidden border border-black/10 bg-white" : "overflow-hidden rounded-[var(--catalog-radius)] border border-black/10 bg-white shadow-sm"}>
      <div className={premium ? "aspect-[4/5] overflow-hidden bg-gray-100" : fast ? "aspect-[16/10] overflow-hidden bg-gray-100" : "aspect-[4/3] overflow-hidden bg-gray-100"}>
        <SafeImage src={product.imageUrl} fallback={defaultProductImage} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className={premium ? "p-6" : "p-5"}>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--catalog-secondary)] px-3 py-1 text-xs font-black text-[var(--catalog-text)]">
            {product.category?.name ?? "Producto"}
          </span>
          {product.discountPercent > 0 && (
            <span className="rounded-full bg-[var(--catalog-accent)] px-3 py-1 text-xs font-black text-white">-{product.discountPercent}%</span>
          )}
          {product.featured && <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">Destacado</span>}
          {lowStock && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Stock bajo</span>}
          {outOfStock && <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-black text-white">Sin stock</span>}
        </div>
        <h3 className={premium ? "text-2xl font-semibold" : "text-lg font-black"}>{product.name}</h3>
        <p className={tech ? "mt-2 line-clamp-2 text-sm text-gray-600" : "mt-2 line-clamp-2 text-sm text-gray-500"}>{product.description}</p>
        {tech && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-gray-600">
            <span className="rounded-lg bg-gray-50 px-3 py-2">SKU {product.sku ?? "N/D"}</span>
            <span className="rounded-lg bg-gray-50 px-3 py-2">Stock {product.stock}</span>
          </div>
        )}
        <div className={fast ? "mt-4 flex items-end justify-between gap-3" : "mt-5"}>
          <div>
            <p className="text-2xl font-black text-[var(--catalog-primary)]">{formattedFinalPrice}</p>
            {(product.compareAtPrice || product.discountPercent > 0) && (
              <p className="text-sm text-gray-400 line-through">{formatCLP(product.compareAtPrice ?? product.price)}</p>
            )}
          </div>
          {fast && <p className="text-xs font-black uppercase text-gray-500">Stock {product.stock}</p>}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <WhatsAppProductButton
            whatsappNumber={business.whatsappNumber}
            businessName={business.name}
            productName={product.name}
            formattedPrice={formattedFinalPrice}
            storePath={`/store/${business.slug}?product=${product.slug}`}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-4 text-center text-sm font-black text-white"
            disabledClassName="inline-flex min-h-11 items-center justify-center rounded-[var(--catalog-radius)] bg-gray-100 px-4 text-center text-sm font-black text-gray-500"
          />
          <AskAiButton
            productId={product.id}
            question={`Hola, quiero consultar por el producto ${product.name}. ¿Tiene stock, precio y detalles?`}
            className={askButtonClass}
          />
        </div>
      </div>
    </article>
  );
}
