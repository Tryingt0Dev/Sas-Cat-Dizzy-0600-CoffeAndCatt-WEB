import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export class TenantAccessError extends Error {
  constructor(message = "No autorizado para este recurso") {
    super(message);
  }
}

export async function assertBusinessOwner(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: userId }
  });
  if (!business) throw new TenantAccessError("No autorizado para esta tienda");
  return business;
}

export async function getBusinessBySlugForPublic(slug: string) {
  return prisma.business.findFirst({
    where: { slug, isActive: true },
    include: { aiSettings: true }
  });
}

export async function resolveTenantCategoryId(businessId: string, categoryId?: string | null) {
  if (!categoryId) return null;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, businessId },
    select: { id: true }
  });
  if (!category) throw new TenantAccessError("La categoria no pertenece a esta tienda");
  return category.id;
}

export async function assertTenantProduct(businessId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!product) throw new TenantAccessError("Producto no encontrado para esta tienda");
  return product;
}

export async function assertTenantCustomer(businessId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, businessId } });
  if (!customer) throw new TenantAccessError("Cliente no encontrado para esta tienda");
  return customer;
}

export async function assertTenantConversation(businessId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, businessId } });
  if (!conversation) throw new TenantAccessError("Conversacion no encontrada para esta tienda");
  return conversation;
}

export async function assertTenantQuote(
  businessId: string,
  quoteId: string,
  include?: Prisma.QuoteInclude
) {
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, businessId }, include });
  if (!quote) throw new TenantAccessError("Cotizacion no encontrada para esta tienda");
  return quote;
}

export async function assertTenantOrder(
  businessId: string,
  orderId: string,
  include?: Prisma.OrderInclude
) {
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId }, include });
  if (!order) throw new TenantAccessError("Pedido no encontrado para esta tienda");
  return order;
}

export async function assertQuoteProductsBelongToTenant(businessId: string, productIds: string[]) {
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: uniqueIds }, businessId },
    include: { category: true }
  });

  if (products.length !== uniqueIds.length) {
    throw new TenantAccessError("Uno o mas productos no pertenecen a esta tienda");
  }

  return products;
}
