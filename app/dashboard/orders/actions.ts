"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { enumValues, OrderStatus, type OrderStatus as OrderStatusValue } from "@/lib/enums";
import { assertQuotesAndOrdersAllowed, PlanAccessError } from "@/services/plan-guard";
import { TenantAccessError } from "@/services/tenant-guard";
import { requireStoreAccess } from "@/services/authorization";
import { writeAuditLog } from "@/services/audit-log";

export async function updateOrderStatusAction(formData: FormData) {
  const { user, business } = await requireStoreAccess({ permission: "manage_quotes_orders" });
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!enumValues(OrderStatus).includes(status as OrderStatusValue)) redirect("/dashboard/orders?error=Estado inválido");
  let previousStatus: string | null = null;

  try {
    await assertQuotesAndOrdersAllowed(business.id);
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, businessId: business.id },
        include: { items: true }
      });
      if (!order) throw new TenantAccessError("Pedido no encontrado para esta tienda");
      previousStatus = order.status;

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
          await tx.product.updateMany({
            where: { id: product.id, businessId: business.id },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      await tx.order.updateMany({
        where: { id: order.id, businessId: business.id },
        data: { status }
      });
    });
    await writeAuditLog({
      userId: user.id,
      businessId: business.id,
      action: "order.status.update",
      resourceType: "Order",
      resourceId: id,
      metadata: { from: previousStatus, to: status }
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
