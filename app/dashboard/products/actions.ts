"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { getFinalPrice, slugify } from "@/lib/format";
import { ProductStatus } from "@/lib/enums";
import { productFormSchema } from "@/lib/validation";
import { assertTenantProduct, resolveTenantCategoryId, TenantAccessError } from "@/services/tenant-guard";

function nullableInt(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function productPayloadFromForm(formData: FormData) {
  return productFormSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    description: formData.get("description") || undefined,
    price: formData.get("price") || 0,
    compareAtPrice: nullableInt(formData.get("compareAtPrice")),
    costPrice: nullableInt(formData.get("costPrice")),
    discountPercent: formData.get("discountPercent") || 0,
    stock: formData.get("stock") || 0,
    minStock: formData.get("minStock") || 0,
    imageUrl: formData.get("imageUrl") || undefined,
    tags: formData.get("tags") || undefined,
    status: formData.get("status") || ProductStatus.ACTIVE,
    featured: formData.get("featured") === "on"
  });
}

async function uniqueProductSlug(businessId: string, name: string, currentProductId?: string) {
  const base = slugify(name) || "producto";
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { businessId_slug: { businessId, slug } },
      select: { id: true }
    });
    if (!existing || existing.id === currentProductId) return slug;
    slug = `${base}-${counter++}`;
  }
}

async function assertProductLimit(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { plan: true }
  });
  const maxProducts = business?.plan?.maxProducts ?? 25;
  const totalProducts = await prisma.product.count({ where: { businessId } });
  if (totalProducts >= maxProducts) {
    redirect("/dashboard/products?error=Límite de productos alcanzado para tu plan");
  }
}

export async function createProductAction(formData: FormData) {
  const business = await getCurrentBusiness();
  await assertProductLimit(business.id);

  const parsed = productPayloadFromForm(formData);
  if (!parsed.success) redirect("/dashboard/products?error=Revisa los datos del producto");

  try {
    const categoryId = await resolveTenantCategoryId(business.id, parsed.data.categoryId);
    const slug = await uniqueProductSlug(business.id, parsed.data.name);

    await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId,
        name: parsed.data.name,
        slug,
        sku: parsed.data.sku,
        description: parsed.data.description,
        price: parsed.data.price,
        compareAtPrice: parsed.data.compareAtPrice,
        costPrice: parsed.data.costPrice,
        discountPercent: parsed.data.discountPercent,
        stock: parsed.data.stock,
        minStock: parsed.data.minStock,
        imageUrl: parsed.data.imageUrl,
        tags: parsed.data.tags,
        status: parsed.data.status,
        featured: parsed.data.featured
      }
    });
  } catch (error) {
    if (error instanceof TenantAccessError) redirect(`/dashboard/products?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.slug}`);
  redirect("/dashboard/products?success=Producto creado");
}

export async function updateProductAction(formData: FormData) {
  const business = await getCurrentBusiness();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/dashboard/products?error=Producto no encontrado");

  const parsed = productPayloadFromForm(formData);
  if (!parsed.success) redirect("/dashboard/products?error=Revisa los datos del producto");

  try {
    const product = await assertTenantProduct(business.id, id);
    const categoryId = await resolveTenantCategoryId(business.id, parsed.data.categoryId);
    const slug = parsed.data.name !== product.name ? await uniqueProductSlug(business.id, parsed.data.name, id) : product.slug;

    await prisma.product.update({
      where: { id },
      data: {
        categoryId,
        name: parsed.data.name,
        slug,
        sku: parsed.data.sku,
        description: parsed.data.description,
        price: parsed.data.price,
        compareAtPrice: parsed.data.compareAtPrice,
        costPrice: parsed.data.costPrice,
        discountPercent: parsed.data.discountPercent,
        stock: parsed.data.stock,
        minStock: parsed.data.minStock,
        imageUrl: parsed.data.imageUrl,
        tags: parsed.data.tags,
        status: parsed.data.status,
        featured: parsed.data.featured
      }
    });
  } catch (error) {
    if (error instanceof TenantAccessError) redirect(`/dashboard/products?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.slug}`);
  redirect("/dashboard/products?success=Producto actualizado");
}

export async function duplicateProductAction(formData: FormData) {
  const business = await getCurrentBusiness();
  await assertProductLimit(business.id);
  const id = String(formData.get("id") || "");

  try {
    const product = await assertTenantProduct(business.id, id);
    const copyName = `${product.name} copia`;
    const slug = await uniqueProductSlug(business.id, copyName);

    await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: product.categoryId,
        name: copyName,
        slug,
        sku: product.sku ? `${product.sku}-COPY` : null,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        costPrice: product.costPrice,
        discountPercent: product.discountPercent,
        stock: product.stock,
        minStock: product.minStock,
        imageUrl: product.imageUrl,
        tags: product.tags,
        status: ProductStatus.DRAFT,
        featured: false
      }
    });
  } catch (error) {
    if (error instanceof TenantAccessError) redirect(`/dashboard/products?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.slug}`);
  redirect("/dashboard/products?success=Producto duplicado como borrador");
}

export async function deleteProductAction(formData: FormData) {
  const business = await getCurrentBusiness();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/dashboard/products?error=Producto inválido");
  await assertTenantProduct(business.id, id);
  await prisma.product.delete({ where: { id } });
  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.slug}`);
  redirect("/dashboard/products?success=Producto eliminado");
}

export async function quickDiscountAction(formData: FormData) {
  const business = await getCurrentBusiness();
  const id = String(formData.get("id") || "");
  const product = await assertTenantProduct(business.id, id);
  const finalPrice = getFinalPrice(product.price, product.discountPercent);
  await prisma.product.update({
    where: { id: product.id },
    data: { compareAtPrice: product.price, price: finalPrice, discountPercent: 0 }
  });
  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.slug}`);
}
