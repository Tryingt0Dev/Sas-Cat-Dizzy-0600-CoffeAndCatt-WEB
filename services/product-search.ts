import { prisma } from "@/lib/db";
import { ProductStatus } from "@/lib/enums";
import { getFinalPrice } from "@/lib/format";

export type RelevantProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPercent: number;
  finalPrice: number;
  stock: number;
  category: string | null;
  tags: string | null;
};

type SearchableProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPercent: number;
  stock: number;
  featured: boolean;
  tags: string | null;
  updatedAt: Date;
  category: { name: string } | null;
};

type CatalogAttribute = {
  value: string;
  label: string;
  aliases: string[];
};

type ScoredProduct = {
  product: SearchableProduct;
  score: number;
  hasQueryMatch: boolean;
  matchesRequestedProduct: boolean;
  matchesRequestedColor: boolean;
};

export type ProductSearchAnalysis = {
  query: string;
  tokens: string[];
  requestedColors: string[];
  unavailableColors: string[];
  requestedProductLabels: string[];
  requestedProductLabel: string | null;
  exactMatches: RelevantProduct[];
  alternatives: RelevantProduct[];
  fallbackProducts: RelevantProduct[];
  recommendedProducts: RelevantProduct[];
  hasUnavailableRequestedVariant: boolean;
  hasCatalogMatches: boolean;
};

const STOPWORDS = new Set([
  "hola",
  "buenas",
  "quiero",
  "necesito",
  "tienes",
  "tiene",
  "tengan",
  "busco",
  "buscar",
  "consulta",
  "consultar",
  "precio",
  "stock",
  "disponible",
  "disponibles",
  "para",
  "una",
  "uno",
  "con",
  "sin",
  "que",
  "hay",
  "me",
  "mi",
  "de",
  "del",
  "el",
  "la",
  "los",
  "las",
  "un",
  "en",
  "y",
  "o"
]);

const COLOR_ATTRIBUTES: CatalogAttribute[] = [
  { value: "azul_marino", label: "azul marino", aliases: ["azul marino", "marino"] },
  { value: "azul", label: "azul", aliases: ["azul", "azules"] },
  { value: "celeste", label: "celeste", aliases: ["celeste", "celestes"] },
  { value: "rosado", label: "rosado", aliases: ["rosado", "rosada", "rosa", "rosas", "pink", "fucsia"] },
  { value: "rojo", label: "rojo", aliases: ["rojo", "roja", "rojos", "rojas"] },
  { value: "negro", label: "negro", aliases: ["negro", "negra", "negros", "negras"] },
  { value: "blanco", label: "blanco", aliases: ["blanco", "blanca", "blancos", "blancas"] },
  { value: "verde", label: "verde", aliases: ["verde", "verdes"] },
  { value: "amarillo", label: "amarillo", aliases: ["amarillo", "amarilla", "amarillos", "amarillas"] },
  { value: "morado", label: "morado", aliases: ["morado", "morada", "lila", "violeta"] },
  { value: "beige", label: "beige", aliases: ["beige", "crema", "marfil"] },
  { value: "cafe", label: "cafe", aliases: ["cafe", "cafes", "marron", "marrones", "chocolate"] },
  { value: "gris", label: "gris", aliases: ["gris", "grises", "plateado", "plateada"] },
  { value: "naranja", label: "naranja", aliases: ["naranja", "naranjo", "naranjas"] },
  { value: "dorado", label: "dorado", aliases: ["dorado", "dorada", "oro"] }
];

const PRODUCT_ATTRIBUTES: CatalogAttribute[] = [
  { value: "polera", label: "polera", aliases: ["polera", "poleras", "camiseta", "camisetas", "remera", "remeras", "playera", "playeras", "top", "tops"] },
  { value: "pantalon", label: "pantalon", aliases: ["pantalon", "pantalones", "jean", "jeans", "cargo", "jogger", "short", "shorts"] },
  { value: "vestido", label: "vestido", aliases: ["vestido", "vestidos", "falda", "faldas"] },
  { value: "chaqueta", label: "chaqueta", aliases: ["chaqueta", "chaquetas", "parka", "abrigo", "poleron", "polerones", "sweater"] },
  { value: "cartera", label: "cartera", aliases: ["cartera", "carteras", "bolso", "bolsos", "mochila", "mochilas", "bag"] },
  { value: "zapato", label: "calzado", aliases: ["zapato", "zapatos", "zapatilla", "zapatillas", "calzado", "botin", "botines"] },
  { value: "perfume", label: "perfume", aliases: ["perfume", "perfumes", "fragancia", "fragancias", "colonia"] },
  { value: "joya", label: "joya", aliases: ["joya", "joyas", "anillo", "anillos", "collar", "collares", "aro", "aros", "pulsera", "pulseras"] },
  { value: "camara", label: "camara", aliases: ["camara", "camaras", "cctv", "seguridad", "kit", "dvr", "sensor", "alarma"] },
  { value: "servicio", label: "servicio", aliases: ["servicio", "servicios", "instalacion", "instalar", "mantencion", "reparacion", "soporte"] }
];

function normalizeText(text: string | null | undefined) {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s-]/g, " ");
}

function tokenize(text: string) {
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsAlias(haystack: string, alias: string) {
  const normalizedAlias = normalizeText(alias).trim();
  if (!normalizedAlias) return false;
  return new RegExp(`(^|\\s)${escapeRegExp(normalizedAlias)}($|\\s)`).test(haystack);
}

function findAttributes(text: string, attributes: CatalogAttribute[]) {
  const normalized = normalizeText(text);
  return attributes.filter((attribute) => attribute.aliases.some((alias) => containsAlias(normalized, alias)));
}

function productHaystack(product: SearchableProduct) {
  return normalizeText(`${product.name} ${product.description ?? ""} ${product.tags ?? ""} ${product.category?.name ?? ""}`);
}

function toRelevantProduct(product: SearchableProduct): RelevantProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    discountPercent: product.discountPercent,
    finalPrice: getFinalPrice(product.price, product.discountPercent),
    stock: product.stock,
    category: product.category?.name ?? null,
    tags: product.tags
  };
}

function uniqueProducts(products: RelevantProduct[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function scoreProduct(product: SearchableProduct, tokens: string[], requestedProducts: CatalogAttribute[], requestedColors: CatalogAttribute[]): ScoredProduct {
  const haystack = productHaystack(product);
  const name = normalizeText(product.name);
  const productColors = findAttributes(haystack, COLOR_ATTRIBUTES);
  const matchesRequestedProduct =
    requestedProducts.length === 0 ||
    requestedProducts.some((attribute) => attribute.aliases.some((alias) => containsAlias(haystack, alias)));
  const matchesRequestedColor =
    requestedColors.length === 0 || requestedColors.some((attribute) => productColors.some((color) => color.value === attribute.value));

  let score = 0;
  let hasTokenMatch = false;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      score += 3;
      hasTokenMatch = true;
    }
    if (name.includes(token)) {
      score += 4;
      hasTokenMatch = true;
    }
  }
  if (matchesRequestedProduct && requestedProducts.length > 0) score += 12;
  if (matchesRequestedColor && requestedColors.length > 0) score += 10;
  if (requestedColors.length > 0 && !matchesRequestedColor) score -= 4;
  const hasQueryMatch =
    hasTokenMatch ||
    (requestedProducts.length > 0 && matchesRequestedProduct) ||
    (requestedColors.length > 0 && matchesRequestedColor);
  if (product.featured && hasQueryMatch) score += 1;

  return { product, score, hasQueryMatch, matchesRequestedProduct, matchesRequestedColor };
}

export async function analyzeProductQuery(businessId: string, query: string, limit = 8): Promise<ProductSearchAnalysis> {
  const tokens = tokenize(query);
  const requestedColors = findAttributes(query, COLOR_ATTRIBUTES);
  const requestedProducts = findAttributes(query, PRODUCT_ATTRIBUTES);

  const products = await prisma.product.findMany({
    where: {
      businessId,
      status: ProductStatus.ACTIVE
    },
    include: { category: true },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }]
  });

  const scored = products.map((product) => scoreProduct(product, tokens, requestedProducts, requestedColors));
  const sortedByScore = scored
    .filter((item) => item.hasQueryMatch)
    .sort((a, b) => b.score - a.score || b.product.updatedAt.getTime() - a.product.updatedAt.getTime());
  const exactMatches = uniqueProducts(
    sortedByScore
      .filter((item) => item.matchesRequestedProduct && item.matchesRequestedColor && item.hasQueryMatch)
      .slice(0, limit)
      .map((item) => toRelevantProduct(item.product))
  );
  const alternatives = uniqueProducts(
    sortedByScore
      .filter((item) => {
        if (requestedProducts.length > 0) return item.matchesRequestedProduct;
        return item.matchesRequestedColor || item.hasQueryMatch;
      })
      .slice(0, limit)
      .map((item) => toRelevantProduct(item.product))
      .filter((product) => !exactMatches.some((match) => match.id === product.id))
  );
  const fallbackProducts = products.slice(0, Math.min(limit, 5)).map((product) => toRelevantProduct(product));
  const unavailableColors = requestedColors
    .filter((color) => {
      return !scored.some((item) => {
        const colorMatchesProduct = findAttributes(productHaystack(item.product), COLOR_ATTRIBUTES).some((productColor) => productColor.value === color.value);
        return item.matchesRequestedProduct && colorMatchesProduct;
      });
    })
    .map((color) => color.label);
  const recommendedProducts = uniqueProducts([...(exactMatches.length > 0 ? exactMatches : []), ...alternatives, ...fallbackProducts]).slice(0, limit);
  const requestedProductLabels = requestedProducts.map((attribute) => attribute.label);

  return {
    query,
    tokens,
    requestedColors: requestedColors.map((color) => color.label),
    unavailableColors,
    requestedProductLabels,
    requestedProductLabel: requestedProductLabels.length > 0 ? requestedProductLabels.join(" o ") : null,
    exactMatches,
    alternatives,
    fallbackProducts,
    recommendedProducts,
    hasUnavailableRequestedVariant: requestedColors.length > 0 && unavailableColors.length > 0,
    hasCatalogMatches: exactMatches.length > 0 || alternatives.length > 0
  };
}

export async function searchRelevantProducts(businessId: string, query: string, limit = 8): Promise<RelevantProduct[]> {
  const analysis = await analyzeProductQuery(businessId, query, limit);
  return analysis.recommendedProducts;
}
