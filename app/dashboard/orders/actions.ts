"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { enumValues, OrderStatus, type OrderStatus as OrderStatusValue } from "@/lib/enums";
import { assertQuotesAndOrdersAllowed, PlanAccessError } from "@/services/plan-guard";
import { TenantAccessError } from "@/services/tenant-guard";

export async function updateOrderStatusAction(formData: FormData) {
  const business = await getCurrentBusiness();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!enumValues(OrderStatus).includes(status as OrderStatusValue)) redirect("/dashboard/orders?error=Estado inválido");

  try {
    await assertQuotesAndOrdersAllowed(business.id);
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, businessId: business.id },
        include: { items: true }
      });
      if (!order) throw new TenantAccessError("Pedido no encontrado para esta tienda");

      const isCancelling = order.status !== OrderStatus.CANCELLED && status === OrderStatus.CANCELLED;
      const isReopeningCancelled = order.status === OrderStatus.CANCELLED && status !== OrderStatus.CANCELLED;

      if (isCancelling) {
        for (const item of order.items) {
          if (!item.productId) continue;
          await tx.product.updateMany({
            where: { id: item.productId, businessId: business.id },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      if (isReopeningCancelled) {
        for (const item of order.items) {
          if (!item.productId) continue;
          const product = await tx.product.findFirst({
            where: { id: item.productId, businessId: business.id },
            select: { id: true, stock: true }
          });
          if (!product || product.stock < item.quantity) {
            throw new TenantAccessError(`Stock insuficiente para reactivar ${item.name}`);
          }
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status }
      });
    });
  } catch (error) {
    if (error instanceof PlanAccessError || error instanceof TenantAccessError) {
      redirect(`/dashboard/orders?error=${error.message}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/orders");
  redirect("/dashboard/orders?success=Pedido actualizado");
}
