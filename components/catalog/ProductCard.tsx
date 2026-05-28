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
  variant: _variant = "modern"
}: {
  business: CatalogBusiness;
  product: CatalogProduct;
  variant?: ProductCardVariant;
}) {
  const finalPrice = getFinalPrice(product.price, product.discountPercent);
  const formattedFinalPrice = formatCLP(finalPrice);
  const lowStock = product.stock > 0 && product.stock <= Math.max(product.minStock, 3);
  const outOfStock = product.stock <= 0;
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

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-surface)] shadow-sm transition duration-200 hover:border-[var(--catalog-accent)] hover:shadow-md">
      <Link href={productHref} className="relative block overflow-hidden bg-[var(--catalog-muted)]">
        <div className="relative aspect-square overflow-hidden">
          <SafeImage
            src={product.imageUrl}
            fallback={defaultProductImage}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          {(product.discountPercent > 0 || product.featured) && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
              {product.discountPercent > 0 && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[0.7rem] font-black text-white">-{product.discountPercent}%</span>
              )}
              {product.featured && (
                <span className="rounded-full bg-[var(--catalog-accent)] px-2 py-0.5 text-[0.7rem] font-black text-[var(--catalog-accent-text)]">Destacado</span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div>
          <p className="truncate text-[0.68rem] font-black uppercase tracking-[0.12em] text-[var(--catalog-text-muted)]">{product.category?.name ?? "Catálogo"}</p>
          <h3 className="mt-1 min-h-10 text-sm font-bold leading-5 text-[var(--catalog-text)] line-clamp-2">
            <Link href={productHref} className="transition hover:text-[var(--catalog-accent)]">
              {product.name}
            </Link>
          </h3>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex min-w-0 items-end justify-between gap-2">
            <p className="truncate text-base font-black text-[var(--catalog-price)]">{formattedFinalPrice}</p>
            {(product.compareAtPrice || product.discountPercent > 0) && (
              <p className="text-xs text-[var(--catalog-text-muted)] line-through">{formatCLP(product.compareAtPrice ?? product.price)}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 text-[0.7rem] font-bold">
            <span className={outOfStock ? "text-[var(--catalog-text-muted)]" : lowStock ? "text-[var(--catalog-discount)]" : "text-[var(--catalog-text-muted)]"}>
              {outOfStock ? "Agotado" : lowStock ? `Quedan ${product.stock}` : "Disponible"}
            </span>
            <Link
              href={productHref}
              className="rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-3 py-1.5 text-center text-xs font-black text-[var(--catalog-button-text)] transition duration-200 hover:bg-[var(--catalog-primary-hover)]"
            >
              Ver detalle
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <WhatsAppProductButton
              whatsappNumber={business.whatsappNumber}
              businessSlug={business.publicSlug}
              businessName={business.name}
              productId={product.id}
              productName={product.name}
              formattedPrice={formattedFinalPrice}
              storePath={productHref}
              className="inline-flex min-h-9 items-center justify-center rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-surface)] px-2 py-1.5 text-center text-[0.7rem] font-black leading-tight text-[var(--catalog-text)] transition duration-200 hover:border-emerald-500 hover:text-emerald-600"
              disabledClassName="inline-flex min-h-9 items-center justify-center rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-muted)] px-2 py-1.5 text-center text-[0.7rem] font-black leading-tight text-[var(--catalog-text-muted)]"
            />
            <AskAiButton
              productId={product.id}
              productContext={productAiContext}
              question={buildProductAiQuestion(productAiContext)}
              className="inline-flex min-h-9 items-center justify-center rounded-[var(--catalog-radius)] border border-[var(--catalog-border)] bg-[var(--catalog-surface)] px-2 py-1.5 text-center text-[0.7rem] font-black leading-tight text-[var(--catalog-text)] transition duration-200 hover:border-[var(--catalog-accent)] hover:text-[var(--catalog-accent)]"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
