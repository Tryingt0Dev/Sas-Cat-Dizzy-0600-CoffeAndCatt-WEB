import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AskAiButton } from "@/components/catalog/AskAiButton";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { CatalogProductTracker } from "@/components/catalog/CatalogProductTracker";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductAttributeDisplay } from "@/components/catalog/ProductAttributeDisplay";
import { SafeImage } from "@/components/catalog/SafeImage";
import { WhatsAppProductButton } from "@/components/catalog/WhatsAppProductButton";
import { StoreChat } from "@/components/StoreChat";
import { buildProductAiQuestion, defaultProductImage, getCatalogThemeStyle, type CatalogBusiness, type ProductAiContext } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { ProductStatus } from "@/lib/enums";
import { formatCLP, getFinalPrice } from "@/lib/format";
import { parseJsonRecord } from "@/lib/safe-json";

type ProductPageProps = {
  params: Promise<{ slug: string; productSlug: string }>;
};

async function getProductPageData(slug: string, productSlug: string) {
  const business = await prisma.business.findFirst({
    where: { publicSlug: slug, isActive: true },
    include: {
      products: {
        where: { slug: productSlug, status: ProductStatus.ACTIVE },
        include: { category: true },
        take: 1
      }
    }
  });

  const product = business?.products[0];
  if (!business) {
    const slugHistory = await prisma.businessSlugHistory.findUnique({
      where: { slug },
      include: { business: { select: { publicSlug: true, isActive: true } } }
    });
    if (slugHistory?.business.isActive) {
      return { redirectTo: `/store/${slugHistory.business.publicSlug}/product/${productSlug}` as const };
    }
    return null;
  }
  if (!product) return null;

  const [relatedProducts, productCount, categoryCount] = await Promise.all([
    prisma.product.findMany({
      where: {
        businessId: business.id,
        status: ProductStatus.ACTIVE,
        id: { not: product.id },
        ...(product.categoryId ? { categoryId: product.categoryId } : {})
      },
      include: { category: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3
    }),
    prisma.product.count({ where: { businessId: business.id, status: ProductStatus.ACTIVE } }),
    prisma.category.count({ where: { businessId: business.id } })
  ]);

  return { business, product, relatedProducts, productCount, categoryCount };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const data = await getProductPageData(slug, productSlug);
  if (!data) return { title: "Producto no encontrado" };
  if ("redirectTo" in data) return { title: "Producto movido" };

  const { business, product } = data;
  const finalPrice = formatCLP(getFinalPrice(product.price, product.discountPercent));
  const title = `${product.name} | ${business.name}`;
  const description = product.description ?? `${product.name} disponible en ${business.name} por ${finalPrice}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: product.imageUrl ? [{ url: product.imageUrl, alt: product.name }] : []
    }
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params;
  const data = await getProductPageData(slug, productSlug);
  if (data && "redirectTo" in data && data.redirectTo) permanentRedirect(data.redirectTo);
  if (!data) notFound();

  const { business, product, relatedProducts, productCount, categoryCount } = data;
  const catalogBusiness: CatalogBusiness = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    publicSlug: business.publicSlug,
    description: business.description,
    logoUrl: business.logoUrl,
    bannerUrl: business.bannerUrl,
    whatsappNumber: business.whatsappNumber,
    businessType: business.businessType,
    address: business.address,
    catalogTemplate: business.catalogTemplate,
    catalogPalette: business.catalogPalette,
    primaryColor: business.primaryColor,
    secondaryColor: business.secondaryColor,
    accentColor: business.accentColor,
    backgroundColor: business.backgroundColor,
    textColor: business.textColor,
    buttonRadius: business.buttonRadius
  };
  const themeStyle = getCatalogThemeStyle(catalogBusiness);
  const finalPrice = getFinalPrice(product.price, product.discountPercent);
  const formattedFinalPrice = formatCLP(finalPrice);
  const lowStock = product.stock > 0 && product.stock <= Math.max(product.minStock, 3);
  const outOfStock = product.stock <= 0;
  const productHref = `/store/${business.publicSlug}/product/${product.slug}`;
  const productAttributes = parseJsonRecord(product.attributesJson);
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
    <main className="min-h-screen bg-[var(--catalog-bg)]" style={themeStyle}>
      <CatalogProductTracker businessSlug={business.publicSlug} productId={product.id} />
      <CatalogHeader business={catalogBusiness} productCount={productCount} categoryCount={categoryCount} />

      <section className="mx-auto grid grid-cols-1 max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-8">
          <Link href={`/store/${business.publicSlug}`} className="inline-flex text-sm font-black text-[var(--catalog-accent)]">
            Volver al catalogo
          </Link>
          <div className="overflow-hidden rounded-[var(--catalog-radius)] border border-black/10 bg-white shadow-sm">
            <SafeImage src={product.imageUrl} fallback={defaultProductImage} alt={product.name} className="aspect-[16/11] w-full object-cover" />
          </div>

          {relatedProducts.length > 0 && (
            <section>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-accent)]">Tambien podria interesarte</p>
              <div className="mt-4 grid gap-5 md:grid-cols-3">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} business={catalogBusiness} product={relatedProduct} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[var(--catalog-radius)] border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[var(--catalog-secondary)] px-3 py-1 text-xs font-black text-[var(--catalog-text)]">
                {product.category?.name ?? "Producto"}
              </span>
              {product.discountPercent > 0 && (
                <span className="rounded-full bg-[var(--catalog-accent)] px-3 py-1 text-xs font-black text-[var(--catalog-accent-text)]">-{product.discountPercent}%</span>
              )}
              {product.featured && <span className="rounded-full bg-black px-3 py-1 text-xs font-black text-white">Destacado</span>}
              {lowStock && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">Stock bajo</span>}
              {outOfStock && <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-black text-white">Sin stock</span>}
            </div>

            <h1 className="mt-4 text-4xl font-black leading-tight">{product.name}</h1>
            <p className="mt-4 text-gray-600">{product.description ?? "Producto disponible en el catalogo de la tienda."}</p>

            <div className="mt-6 rounded-[var(--catalog-radius)] bg-[var(--catalog-secondary)] p-4">
              <p className="text-4xl font-black text-[var(--catalog-primary)]">{formattedFinalPrice}</p>
              {(product.compareAtPrice || product.discountPercent > 0) && (
                <p className="mt-1 text-sm text-gray-500 line-through">{formatCLP(product.compareAtPrice ?? product.price)}</p>
              )}
            </div>

            <div className="mt-5 grid gap-3 text-sm font-bold text-gray-600 sm:grid-cols-2">
              <span className="rounded-[var(--catalog-radius)] bg-gray-50 px-4 py-3">Stock {product.stock}</span>
              <span className="rounded-[var(--catalog-radius)] bg-gray-50 px-4 py-3">SKU {product.sku ?? "N/D"}</span>
            </div>

            {product.tags && (
              <div className="mt-5 flex flex-wrap gap-2">
                {product.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                  <span key={tag.trim()} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {productAttributes ? (
              <div className="mt-6 rounded-[var(--catalog-radius)] border border-black/10 bg-white p-4">
                <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--catalog-accent)]">Ficha tecnica</p>
                <ProductAttributeDisplay attributes={productAttributes} businessType={business.businessType} maxVisible={12} layout="list" />
              </div>
            ) : null}

            <div className="mt-6 grid gap-3">
              <WhatsAppProductButton
                whatsappNumber={business.whatsappNumber}
                businessSlug={business.publicSlug}
                businessName={business.name}
                productId={product.id}
                productName={product.name}
                formattedPrice={formattedFinalPrice}
                storePath={productHref}
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-5 text-center text-sm font-black text-[var(--catalog-button-text)]"
                disabledClassName="inline-flex min-h-12 items-center justify-center rounded-[var(--catalog-radius)] bg-gray-100 px-5 text-center text-sm font-black text-gray-500"
              />
              <AskAiButton
                productId={product.id}
                productContext={productAiContext}
                question={buildProductAiQuestion(productAiContext)}
                className="min-h-12 rounded-[var(--catalog-radius)] border border-black/10 bg-white px-5 text-sm font-black text-[var(--catalog-text)]"
              />
            </div>
          </div>

          <StoreChat businessSlug={business.publicSlug} accentColor={business.accentColor} buttonRadius={business.buttonRadius} />
        </aside>
      </section>
    </main>
  );
}
