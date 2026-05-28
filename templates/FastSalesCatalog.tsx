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
    <main className="min-h-screen bg-[var(--catalog-bg)]" style={themeStyle}>
      <CatalogHeader business={business} productCount={products.length} categoryCount={categories.length} />
      <section className="border-b border-[var(--catalog-border)] bg-[var(--catalog-surface)]">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-8 lg:grid-cols-[1fr_340px] lg:items-center">
          <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-center">
            <SafeImage src={heroImage} fallback={defaultProductImage} alt={business.name} className="aspect-square w-full rounded-[var(--catalog-radius)] object-cover shadow-lg" />
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-accent)]">Compra rápida</p>
              <h1 className="mt-2 text-4xl font-black md:text-5xl">{business.name}</h1>
              <p className="mt-4 max-w-2xl text-[var(--catalog-text-muted)]">{business.description}</p>
              {whatsappHref && (
                <a href={whatsappHref} target="_blank" className="mt-5 inline-flex rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-4 py-2.5 text-sm font-black text-[var(--catalog-button-text)] shadow-lg transition hover:brightness-110">
                  Consultar por WhatsApp
                </a>
              )}
            </div>
          </div>
          <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-secondary)] p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-text)]">Filtros de compra</p>
            <div className="mt-4">
              <CatalogControls categories={categories} searchState={searchState} compact />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          {featuredProducts.length > 0 && (
            <div className="mb-8 rounded-[var(--catalog-radius)] border border-[var(--catalog-accent)]/25 bg-[var(--catalog-surface)] p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--catalog-accent)]">Ofertas destacadas</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featuredProducts.slice(0, 2).map((product) => (
                  <ProductCard key={product.id} business={business} product={product} variant="fast" />
                ))}
              </div>
            </div>
          )}
          {products.length === 0 ? (
            <EmptyCatalogState />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
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
