"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";
import { requiredString } from "@/lib/validation";
import { requireStoreAccess } from "@/services/authorization";
import { writeAuditLog } from "@/services/audit-log";

export async function createCategoryAction(formData: FormData) {
  const { business, plan } = await requireStoreAccess({ permission: "manage_categories" });
  const parsedName = requiredString.max(80).safeParse(formData.get("name"));
  if (!parsedName.success) redirect("/dashboard/categories?error=Nombre obligatorio");
  const name = parsedName.data;
  const categoryCount = await prisma.category.count({ where: { businessId: business.id } });
  if (categoryCount >= (plan.maxCategories ?? 5)) redirect("/dashboard/categories?error=Límite de categorías alcanzado para tu plan");

  const baseSlug = slugify(name) || "categoria";
  let slug = baseSlug;
  let counter = 2;
  while (await prisma.category.findUnique({ where: { businessId_slug: { businessId: business.id, slug } } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  await prisma.category.create({ data: { businessId: business.id, name, slug } });
  revalidatePath("/dashboard/categories");
  revalidatePath(`/store/${business.publicSlug}`);
  redirect("/dashboard/categories?success=Categoría creada");
}

export async function deleteCategoryAction(formData: FormData) {
  const { user, business } = await requireStoreAccess({ permission: "manage_categories" });
  const id = String(formData.get("id") || "");
  const category = await prisma.category.findFirst({ where: { id, businessId: business.id }, select: { id: true, name: true, slug: true } });
  await prisma.category.deleteMany({ where: { id, businessId: business.id } });
  if (category) {
    await writeAuditLog({
      userId: user.id,
      businessId: business.id,
      action: "category.delete",
      resourceType: "Category",
      resourceId: category.id,
      metadata: { name: category.name, slug: category.slug }
    });
  }
  revalidatePath("/dashboard/categories");
  revalidatePath(`/store/${business.publicSlug}`);
}
