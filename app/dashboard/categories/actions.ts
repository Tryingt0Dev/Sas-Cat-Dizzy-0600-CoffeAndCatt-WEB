"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { requiredString } from "@/lib/validation";

export async function createCategoryAction(formData: FormData) {
  const business = await getCurrentBusiness();
  const parsedName = requiredString.max(80).safeParse(formData.get("name"));
  if (!parsedName.success) redirect("/dashboard/categories?error=Nombre obligatorio");
  const name = parsedName.data;

  let slug = slugify(name);
  let counter = 2;
  while (await prisma.category.findUnique({ where: { businessId_slug: { businessId: business.id, slug } } })) {
    slug = `${slugify(name)}-${counter++}`;
  }

  await prisma.category.create({ data: { businessId: business.id, name, slug } });
  revalidatePath("/dashboard/categories");
  revalidatePath(`/store/${business.slug}`);
  redirect("/dashboard/categories?success=Categoría creada");
}

export async function deleteCategoryAction(formData: FormData) {
  const business = await getCurrentBusiness();
  const id = String(formData.get("id") || "");
  await prisma.category.deleteMany({ where: { id, businessId: business.id } });
  revalidatePath("/dashboard/categories");
  revalidatePath(`/store/${business.slug}`);
}
