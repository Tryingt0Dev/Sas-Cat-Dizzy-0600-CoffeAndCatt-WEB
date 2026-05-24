"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/services/audit-log";

export async function toggleBusinessActiveAction(formData: FormData) {
  const user = await requirePlatformAdmin();
  const id = String(formData.get("id") || "");
  const isActive = String(formData.get("isActive")) === "true";
  if (!id) redirect("/admin?error=Tienda inválida");

  await prisma.business.update({
    where: { id },
    data: { isActive }
  });
  await writeAuditLog({
    userId: user.id,
    businessId: id,
    action: isActive ? "business.reactivate" : "business.suspend",
    resourceType: "Business",
    resourceId: id,
    metadata: { isActive }
  });

  revalidatePath("/admin");
  redirect("/admin?success=Tienda actualizada");
}
