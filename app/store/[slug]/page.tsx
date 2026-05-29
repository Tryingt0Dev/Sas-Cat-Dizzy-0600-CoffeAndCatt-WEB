import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { headers } from 'next/headers';
import { prisma } from "@/lib/db";
import { CatalogTemplate, ProductStatus } from "@/lib/enums";
import { getCatalogThemeStyle, type CatalogBusiness, type CatalogSearchState } from "@/lib/catalog";
import { ModernGridCatalog } from "@/templates/ModernGridCatalog";
import { BoutiquePremiumCatalog } from "@/templates/BoutiquePremiumCatalog";
import { FastSalesCatalog } from "@/templates/FastSalesCatalog";
import { TechProCatalog } from "@/templates/TechProCatalog";
import { EmptyState } from "@/components/EmptyState";

type StorePageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string; category?: string; sort?: string } | undefined>;
};

function getOrderBy(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price_asc") return [{ price: "asc" }, { createdAt: "desc" }];
  if (sort === "price_desc") return [{ price: "desc" }, { createdAt: "desc" }];
  if (sort === "recent") return [{ createdAt: "desc" }];
  if (sort === "discount") return [{ discountPercent: "desc" }, { featured: "desc" }, { createdAt: "desc" }];
  return [{ featured: "desc" }, { createdAt: "desc" }];
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const hdrs = await headers();
  const hostHeader = hdrs.get('host') || '';
  const hostname = hostHeader.replace(/:\\d+$/, '');

  // Try to resolve by customDomain first
  let business = null;
  if (hostname) {
    business = await prisma.business.findFirst({
      where: { customDomain: hostname, customDomainVerified: true, isActive: true },
      select: { name: true, description: true, seoTitle: true, seoDescription: true, bannerUrl: true, logoUrl: true }
    });
  }

  if (!business) {
    business = await prisma.business.findFirst({
      where: { OR: [{ slug }, { publicSlug: slug }], isActive: true },
      select: {
        name: true,
        description: true,
        seoTitle: true,
        seoDescription: true,
        bannerUrl: true,
        logoUrl: true
      }
    });
  }

  if (!business) {
    const slugHistory = await prisma.businessSlugHistory.findUnique({
      where: { slug },
      include: { business: { select: { name: true, description: true, seoTitle: true, seoDescription: true, bannerUrl: true, logoUrl: true, isActive: true } } }
    });
    if (slugHistory?.business?.isActive) {
      business = slugHistory.business;
    }
  }

  if (!business) {
    return {
      title: "Tienda no encontrada"
    };
  }

  const title = business.seoTitle ? `${business.seoTitle}` : `${business.name} | Catalogo`;
  const description = business.seoDescription ?? business.description ?? `Catalogo oficial de ${business.name}`;
  const image = business.bannerUrl || business.logoUrl || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image, alt: business.name }] : []
    }
  };
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const searchState: CatalogSearchState = {
    q: String(resolvedSearchParams?.q ?? "").trim(),
    category: String(resolvedSearchParams?.category ?? "").trim(),
    sort: String(resolvedSearchParams?.sort ?? "featured").trim()
  };

  const productWhere: Prisma.ProductWhereInput = {
    status: ProductStatus.ACTIVE,
    ...(searchState.category ? { category: { slug: searchState.category } } : {}),
    ...(searchState.q
      ? {
          OR: [
            { name: { contains: searchState.q } },
            { description: { contains: searchState.q } },
            { tags: { contains: searchState.q } }
          ]
        }
      : {})
  };

  const _hdrs = await headers();
  const hostHeader = _hdrs.get('host') || '';
  const hostname = hostHeader.replace(/:\\d+$/, '');

  // Resolve business by customDomain first, otherwise by publicSlug param
  let business = null;
  if (hostname) {
    business = await prisma.business.findFirst({
      where: { customDomain: hostname, customDomainVerified: true, isActive: true },
      include: {
        categories: { orderBy: { name: 'asc' } },
        products: {
          where: productWhere,
          include: { category: true },
          orderBy: getOrderBy(searchState.sort)
        }
      }
    });
  }

  if (!business) {
    business = await prisma.business.findFirst({
      where: { OR: [{ slug: resolvedParams.slug }, { publicSlug: resolvedParams.slug }], isActive: true },
      include: {
        categories: { orderBy: { name: 'asc' } },
        products: {
          where: productWhere,
          include: { category: true },
          orderBy: getOrderBy(searchState.sort)
        }
      }
    });
  }

  if (!business) {
    const slugHistory = await prisma.businessSlugHistory.findUnique({
      where: { slug: resolvedParams.slug },
      include: { business: { select: { publicSlug: true, isActive: true } } }
    });
    if (slugHistory?.business?.isActive && slugHistory.business.publicSlug) {
      permanentRedirect(`/store/${slugHistory.business.publicSlug}`);
    }
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="Tienda no encontrada"
          description="La tienda que buscas no existe o ha sido eliminada. Regresa al inicio para ver otras tiendas disponibles."
          action={
            <Link href="/" className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">
              Volver al inicio
            </Link>
          }
        />
      </div>
    );
  }

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
  const featuredProducts = business.products.filter((product) => product.featured);
  const props = {
    business: catalogBusiness,
    categories: business.categories,
    products: business.products,
    featuredProducts,
    searchState,
    themeStyle: getCatalogThemeStyle(catalogBusiness)
  };

  if (business.catalogTemplate === CatalogTemplate.BOUTIQUE_PREMIUM) return <BoutiquePremiumCatalog {...props} />;
  if (business.catalogTemplate === CatalogTemplate.FAST_SALES) return <FastSalesCatalog {...props} />;
  if (business.catalogTemplate === CatalogTemplate.TECH_PRO) return <TechProCatalog {...props} />;
  return <ModernGridCatalog {...props} />;
}
