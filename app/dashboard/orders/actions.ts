"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { enumValues, OrderStatus, type OrderStatus as OrderStatusValue } from "@/lib/enums";
import { assertTenantOrder } from "@/services/tenant-guard";

export async function updateOrderStatusAction(formData: FormData) {
  const business = await getCurrentBusiness();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!enumValues(OrderStatus).includes(status as OrderStatusValue)) redirect("/dashboard/orders?error=Estado inválido");

  await assertTenantOrder(business.id, id);
  await prisma.order.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/dashboard/orders");
  redirect("/dashboard/orders?success=Pedido actualizado");
}
