import { CatalogControls } from "@/components/catalog/CatalogControls";
import { EmptyCatalogState } from "@/components/catalog/EmptyCatalogState";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SafeImage } from "@/components/catalog/SafeImage";
import { StoreChat } from "@/components/StoreChat";
import { buildWhatsappHref, defaultProductImage, type CatalogTemplateProps } from "@/lib/catalog";

export function FastSalesCatalog({ business, categories, products, featuredProducts, searchState, themeStyle }: CatalogTemplateProps) {
  const heroImage = business.bannerUrl || featuredProducts[0]?.imageUrl || products[0]?.imageUrl || defaultProductImage;
  const whatsappHref = buildWhatsappHref(business);

  return (
    <main className="min-h-screen" style={themeStyle}>
      <CatalogHeader business={business} productCount={products.length} categoryCount={categories.length} />
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid grid-cols-1 max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1fr_340px] lg:items-center">
          <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
            <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="aspect-square w-full rounded-[var(--catalog-radius)] object-cover" />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-accent)]">Compra rapida</p>
              <h1 className="mt-2 text-4xl font-black md:text-5xl">{business.name}</h1>
              <p className="mt-3 max-w-2xl text-gray-600">{business.description}</p>
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" className="mt-5 inline-flex rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-5 py-3 text-sm font-black text-white">
                  Consultar catalogo por WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-secondary)] p-4">
            <p className="text-sm font-black">Filtros de compra</p>
            <div className="mt-3">
              <CatalogControls categories={categories} searchState={searchState} compact />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid grid-cols-1 max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_390px]">
        <div>
          {featuredProducts.length > 0 && (
            <div className="mb-8 rounded-[var(--catalog-radius)] border border-[var(--catalog-accent)]/30 bg-white p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-accent)]">Ofertas destacadas</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {featuredProducts.slice(0, 2).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} variant="fast" />
                ))}
              </div>
            </div>
          )}
          {products.length === 0 ? (
            <EmptyCatalogState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} business={business} product={product} variant="fast" />
              ))}
            </div>
          )}
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <StoreChat businessSlug={business.publicSlug} accentColor={business.accentColor} buttonRadius={business.buttonRadius} />
        </aside>
      </section>
    </main>
  );
}
