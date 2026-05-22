"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/auth";

export async function toggleBusinessActiveAction(formData: FormData) {
  await requirePlatformAdmin();
  const id = String(formData.get("id") || "");
  const isActive = String(formData.get("isActive")) === "true";
  if (!id) redirect("/admin?error=Tienda inválida");

  await prisma.business.update({
    where: { id },
    data: { isActive }
  });

  revalidatePath("/admin");
  redirect("/admin?success=Tienda actualizada");
}
