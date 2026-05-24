import Link from "next/link";
import { AskAiButton } from "@/components/catalog/AskAiButton";
import { SafeImage } from "@/components/catalog/SafeImage";
import { WhatsAppProductButton } from "@/components/catalog/WhatsAppProductButton";
import { buildProductAiQuestion, defaultProductImage, type CatalogBusiness, type CatalogProduct, type ProductAiContext } from "@/lib/catalog";
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
  const productHref = `/store/${business.publicSlug}/product/${product.slug}`;
  const productAiContext: ProductAiContext = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    discountPercent: product.discountPercent,
    finalPrice,
    formattedFinalPrice,
    stock: product.stock
  };
  const askButtonClass = fast
    ? "min-h-11 rounded-[var(--catalog-radius)] bg-[var(--catalog-accent)] px-4 text-sm font-black text-white"
    : "min-h-11 rounded-[var(--catalog-radius)] border border-black/10 bg-white px-4 text-sm font-black text-[var(--catalog-text)]";

  return (
    <article className={premium ? "flex h-full flex-col overflow-hidden border border-black/10 bg-white" : "flex h-full flex-col overflow-hidden rounded-[var(--catalog-radius)] border border-black/10 bg-white shadow-sm"}>
      <Link href={productHref} className={premium ? "block aspect-[4/5] overflow-hidden bg-gray-100" : fast ? "block aspect-[16/10] overflow-hidden bg-gray-100" : "block aspect-[4/3] overflow-hidden bg-gray-100"}>
        <SafeImage src={product.imageUrl} fallback={defaultProductImage} alt={product.name} className="h-full w-full object-cover" />
      </Link>
      <div className={premium ? "flex flex-1 flex-col p-6" : "flex flex-1 flex-col p-5"}>
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
        <h3 className={premium ? "text-2xl font-semibold" : "text-lg font-black"}>
          <Link href={productHref} className="hover:text-[var(--catalog-accent)]">
            {product.name}
          </Link>
        </h3>
        <p className={tech ? "mt-2 min-h-[2.5rem] line-clamp-2 text-sm text-gray-600" : "mt-2 min-h-[2.5rem] line-clamp-2 text-sm text-gray-500"}>
          {product.description ?? "Disponible para consulta directa con la tienda."}
        </p>
        {tech && (
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-gray-600">
            <span className="rounded-lg bg-gray-50 px-3 py-2">SKU {product.sku ?? "N/D"}</span>
            <span className="rounded-lg bg-gray-50 px-3 py-2">Stock {product.stock}</span>
          </div>
        )}
        <div className={fast ? "mt-auto flex items-end justify-between gap-3 pt-5" : "mt-auto pt-5"}>
          <div>
            <p className="text-2xl font-black text-[var(--catalog-primary)]">{formattedFinalPrice}</p>
            {(product.compareAtPrice || product.discountPercent > 0) && (
              <p className="text-sm text-gray-400 line-through">{formatCLP(product.compareAtPrice ?? product.price)}</p>
            )}
          </div>
          {fast && <p className="text-xs font-black uppercase text-gray-500">Stock {product.stock}</p>}
        </div>
        <Link
          href={productHref}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--catalog-radius)] border border-black/10 bg-white px-4 text-center text-sm font-black text-[var(--catalog-text)]"
        >
          Ver detalles
        </Link>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <WhatsAppProductButton
            whatsappNumber={business.whatsappNumber}
            businessSlug={business.publicSlug}
            businessName={business.name}
            productId={product.id}
            productName={product.name}
            formattedPrice={formattedFinalPrice}
            storePath={productHref}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-4 text-center text-sm font-black text-white"
            disabledClassName="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--catalog-radius)] bg-gray-100 px-4 text-center text-sm font-black text-gray-500"
          />
          <AskAiButton
            productId={product.id}
            productContext={productAiContext}
            question={buildProductAiQuestion(productAiContext)}
            className={`${askButtonClass} w-full`}
          />
        </div>
      </div>
    </article>
  );
}
