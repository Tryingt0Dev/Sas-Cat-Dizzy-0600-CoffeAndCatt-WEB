import { prisma } from "@/lib/db";
import { getFinalPrice } from "@/lib/format";
import { ProductStatus } from "@/lib/enums";

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

const STOPWORDS = new Set([
  "hola", "buenas", "quiero", "necesito", "tienes", "tiene", "para", "una", "uno", "con", "sin", "que", "hay", "me", "mi", "de", "el", "la", "los", "las", "un", "en", "y", "o"
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
}

export async function searchRelevantProducts(businessId: string, query: string, limit = 8): Promise<RelevantProduct[]> {
  const tokens = tokenize(query);

  const products = await prisma.product.findMany({
    where: {
      businessId,
      status: ProductStatus.ACTIVE
    },
    include: { category: true },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }]
  });

  const scored = products.map((product) => {
    const haystack = `${product.name} ${product.description ?? ""} ${product.tags ?? ""} ${product.category?.name ?? ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 3;
      if (product.name.toLowerCase().includes(token)) score += 4;
    }
    if (product.featured) score += 1;

    return { product, score };
  });

  const relevant = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.product);

  const fallback = products.slice(0, Math.min(limit, 5));
  const selected = relevant.length > 0 ? relevant : fallback;

  return selected.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    discountPercent: p.discountPercent,
    finalPrice: getFinalPrice(p.price, p.discountPercent),
    stock: p.stock,
    category: p.category?.name ?? null,
    tags: p.tags
  }));
}
