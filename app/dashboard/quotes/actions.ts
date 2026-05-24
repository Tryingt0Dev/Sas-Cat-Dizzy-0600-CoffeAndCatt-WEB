"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getFinalPrice } from "@/lib/format";
import { CustomerStatus, enumValues, QuoteStatus, type QuoteStatus as QuoteStatusValue } from "@/lib/enums";
import {
  assertQuoteProductsBelongToTenant,
  assertTenantConversation,
  assertTenantCustomer,
  assertTenantQuote,
  TenantAccessError
} from "@/services/tenant-guard";
import { assertQuotesAndOrdersAllowed, PlanAccessError } from "@/services/plan-guard";
import { requireStoreAccess } from "@/services/authorization";
import { writeAuditLog } from "@/services/audit-log";

function parseDiscount(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseQuoteItems(formData: FormData) {
  const productIds = formData.getAll("productId").map((value) => String(value).trim());
  const quantities = formData.getAll("quantity").map((value) => Number.parseInt(String(value || "0"), 10));
  return productIds
    .map((productId, index) => ({ productId, quantity: Number.isFinite(quantities[index]) ? quantities[index] : 0 }))
    .filter((item) => item.productId && item.quantity > 0);
}

export async function createQuoteAction(formData: FormData) {
  const { user, business } = await requireStoreAccess({ permission: "manage_quotes_orders" });
  const customerId = String(formData.get("customerId") || "").trim() || null;
  const conversationId = String(formData.get("conversationId") || "").trim() || null;
  const rawItems = parseQuoteItems(formData);
  if (rawItems.length === 0) redirect("/dashboard/quotes?error=Agrega al menos un producto");

  try {
    await assertQuotesAndOrdersAllowed(business.id);
    if (customerId) await assertTenantCustomer(business.id, customerId);
    if (conversationId) await assertTenantConversation(business.id, conversationId);

    const products = await assertQuoteProductsBelongToTenant(
      business.id,
      rawItems.map((item) => item.productId)
    );
    const productMap = new Map(products.map((product) => [product.id, product]));
    const items = rawItems.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new TenantAccessError("Producto no encontrado para esta tienda");
      const unitPrice = getFinalPrice(product.price, product.discountPercent);
      return {
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity
      };
    });
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const discount = Math.min(parseDiscount(formData.get("discount")), subtotal);
    const total = subtotal - discount;

    const validUntilRaw = String(formData.get("validUntil") || "").trim();
    const validUntilDate = validUntilRaw ? new Date(validUntilRaw) : null;
    const validUntil = validUntilDate && !Number.isNaN(validUntilDate.getTime()) ? validUntilDate : null;

    const quote = await prisma.quote.create({
      data: {
        businessId: business.id,
        customerId,
        conversationId,
        status: QuoteStatus.DRAFT,
        subtotal,
        discount,
        total,
        validUntil,
        notes: String(formData.get("notes") || "").trim() || null,
        items: { create: items }
      }
    });

    if (customerId) {
      await prisma.customer.updateMany({
        where: { id: customerId, businessId: business.id },
        data: { status: CustomerStatus.QUOTE_SENT }
      });
    }
    await writeAuditLog({
      userId: user.id,
      businessId: business.id,
      action: "quote.create",
      resourceType: "Quote",
      resourceId: quote.id,
      metadata: { total, itemCount: items.length }
    });
  } catch (error) {
    if (error instanceof PlanAccessError) redirect(`/dashboard/quotes?error=${error.message}`);
    if (error instanceof TenantAccessError) redirect(`/dashboard/quotes?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/quotes");
  redirect("/dashboard/quotes?success=Cotización creada");
}

export async function updateQuoteStatusAction(formData: FormData) {
  const { user, business } = await requireStoreAccess({ permission: "manage_quotes_orders" });
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!enumValues(QuoteStatus).includes(status as QuoteStatusValue)) redirect("/dashboard/quotes?error=Estado inválido");
  try {
    await assertQuotesAndOrdersAllowed(business.id);
    const quote = await assertTenantQuote(business.id, id);
    await prisma.quote.updateMany({ where: { id, businessId: business.id }, data: { status } });
    await writeAuditLog({
      userId: user.id,
      businessId: business.id,
      action: "quote.status.update",
      resourceType: "Quote",
      resourceId: quote.id,
      metadata: { from: quote.status, to: status }
    });
  } catch (error) {
    if (error instanceof PlanAccessError) redirect(`/dashboard/quotes?error=${error.message}`);
    if (error instanceof TenantAccessError) redirect(`/dashboard/quotes?error=${error.message}`);
    throw error;
  }
  revalidatePath("/dashboard/quotes");
  redirect("/dashboard/quotes?success=Estado actualizado");
}

export async function createOrderFromQuoteAction(formData: FormData) {
  const { user, business } = await requireStoreAccess({ permission: "manage_quotes_orders" });
  const quoteId = String(formData.get("quoteId") || "");
  let createdOrderId: string | null = null;

  try {
    await assertQuotesAndOrdersAllowed(business.id);
    await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.findFirst({
        where: { id: quoteId, businessId: business.id },
        include: { items: true, order: true }
      });
      if (!quote) throw new TenantAccessError("Cotizacion no encontrada para esta tienda");
      if (quote.status !== QuoteStatus.ACCEPTED) throw new TenantAccessError("Solo puedes crear pedidos desde cotizaciones aceptadas");
      if (quote.order) throw new TenantAccessError("Esta cotizacion ya tiene un pedido");

      for (const item of quote.items) {
        if (!item.productId) continue;
        const product = await tx.product.findFirst({
          where: { id: item.productId, businessId: business.id },
          select: { id: true, stock: true }
        });
        if (!product || product.stock < item.quantity) {
          throw new TenantAccessError(`Stock insuficiente para ${item.name}`);
        }
        await tx.product.updateMany({
          where: { id: product.id, businessId: business.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      const order = await tx.order.create({
        data: {
          businessId: business.id,
          customerId: quote.customerId,
          quoteId: quote.id,
          subtotal: quote.subtotal,
          discount: quote.discount,
          total: quote.total,
          notes: quote.notes,
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal
            }))
          }
        }
      });
      createdOrderId = order.id;
    });
    await writeAuditLog({
      userId: user.id,
      businessId: business.id,
      action: "order.create_from_quote",
      resourceType: "Order",
      resourceId: createdOrderId,
      metadata: { quoteId }
    });
  } catch (error) {
    if (error instanceof PlanAccessError) redirect(`/dashboard/quotes?error=${error.message}`);
    if (error instanceof TenantAccessError) redirect(`/dashboard/quotes?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/orders");
  redirect("/dashboard/orders?success=Pedido creado y stock descontado");
}
