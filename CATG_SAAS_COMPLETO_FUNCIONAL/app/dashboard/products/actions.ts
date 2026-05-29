"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getFinalPrice, slugify } from "@/lib/format";
import { ProductStatus } from "@/lib/enums";
import { imageUrlBelongsToBusiness, productFormSchema, requiredString } from "@/lib/validation";
import { assertWithinPlanLimit, PlanAccessError, requireMaxProducts } from "@/services/plan-guard";
import { assertTenantProduct, resolveTenantCategoryId, TenantAccessError } from "@/services/tenant-guard";
import { requireStoreAccess } from "@/services/authorization";
import { writeAuditLog } from "@/services/audit-log";

function nullableInt(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAttributeKey(value: string) {
  const trimmed = value.trim();
  if (/^[a-zA-Z0-9_.-]+$/.test(trimmed)) return trimmed.slice(0, 60);
  return slugify(trimmed).replace(/-/g, "_").slice(0, 60);
}

function parseProductAttributes(formData: FormData) {
  const attributes: Record<string, string> = {};

  for (const entry of Array.from(formData.entries())) {
    const rawName = String(entry[0]);
    const rawValue = entry[1];
    if (!rawName.startsWith("productAttributes[") || !rawName.endsWith("]")) continue;
    const key = rawName.slice("productAttributes[".length, -1).trim();
    if (!key) continue;
    const value = String(rawValue).trim();
    if (value === "" || value === "null") {
      delete attributes[key];
      continue;
    }
    attributes[key] = value;
  }

  const customKeys = formData.getAll("customAttributeKey").map((value) => normalizeAttributeKey(String(value)));
  const customValues = formData.getAll("customAttributeValue").map((value) => String(value).trim());
  customKeys.forEach((key, index) => {
    const value = customValues[index] ?? "";
    if (!key || !value) return;
    attributes[key] = value;
  });

  return Object.keys(attributes).length ? attributes : null;
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
    featured: formData.get("featured") === "on",
    productAttributes: parseProductAttributes(formData)
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
  try {
    await requireMaxProducts(businessId);
  } catch (error) {
    if (error instanceof PlanAccessError) {
      redirect(`/dashboard/products?error=${error.message}`);
    }
    throw error;
  }
}

async function uniqueCategorySlug(businessId: string, name: string) {
  const base = slugify(name) || "categoria";
  let slug = base;
  let counter = 2;

  while (await prisma.category.findUnique({ where: { businessId_slug: { businessId, slug } } })) {
    slug = `${base}-${counter++}`;
  }

  return slug;
}

export async function createCategoryFromProductAction(formData: FormData) {
  const { business } = await requireStoreAccess({ permission: "manage_categories" });
  const parsedName = requiredString.max(80).safeParse(formData.get("name"));
  if (!parsedName.success) redirect("/dashboard/products?create=1&error=Escribe un nombre para la categoría");

  try {
    await assertWithinPlanLimit(business.id, "categories");
  } catch (error) {
    if (error instanceof PlanAccessError) redirect(`/dashboard/products?create=1&error=${error.message}`);
    throw error;
  }

  const category = await prisma.category.create({
    data: {
      businessId: business.id,
      name: parsedName.data,
      slug: await uniqueCategorySlug(business.id, parsedName.data)
    }
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/categories");
  revalidatePath(`/store/${business.publicSlug}`);
  redirect(`/dashboard/products?create=1&newCategoryId=${category.id}&success=Categoría creada. Ya está seleccionada en el formulario.`);
}

export async function createProductAction(formData: FormData) {
  const { business } = await requireStoreAccess({ permission: "manage_products" });
  await assertProductLimit(business.id);

  const parsed = productPayloadFromForm(formData);
  if (!parsed.success) redirect("/dashboard/products?error=Revisa los datos del producto");
  if (!imageUrlBelongsToBusiness(parsed.data.imageUrl, business.id)) {
    redirect("/dashboard/products?error=La imagen no pertenece a esta tienda");
  }

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
        attributesJson: parsed.data.productAttributes ? JSON.stringify(parsed.data.productAttributes) : null,
        status: parsed.data.status,
        featured: parsed.data.featured
      }
    });
  } catch (error) {
    if (error instanceof TenantAccessError) redirect(`/dashboard/products?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.publicSlug}`);
  redirect("/dashboard/products?success=Producto creado correctamente.");
}

export async function updateProductAction(formData: FormData) {
  const { business } = await requireStoreAccess({ permission: "manage_products" });
  const id = String(formData.get("id") || "");
  if (!id) redirect("/dashboard/products?error=Producto no encontrado");

  const parsed = productPayloadFromForm(formData);
  if (!parsed.success) redirect("/dashboard/products?error=Revisa los datos del producto");
  if (!imageUrlBelongsToBusiness(parsed.data.imageUrl, business.id)) {
    redirect("/dashboard/products?error=La imagen no pertenece a esta tienda");
  }

  try {
    const product = await assertTenantProduct(business.id, id);
    const categoryId = await resolveTenantCategoryId(business.id, parsed.data.categoryId);
    const slug = parsed.data.name !== product.name ? await uniqueProductSlug(business.id, parsed.data.name, id) : product.slug;

    await prisma.product.updateMany({
      where: { id, businessId: business.id },
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
        attributesJson: parsed.data.productAttributes ? JSON.stringify(parsed.data.productAttributes) : null,
        status: parsed.data.status,
        featured: parsed.data.featured
      }
    });
  } catch (error) {
    if (error instanceof TenantAccessError) redirect(`/dashboard/products?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.publicSlug}`);
  redirect("/dashboard/products?success=Producto actualizado");
}

export async function toggleProductVisibilityAction(formData: FormData) {
  const { business } = await requireStoreAccess({ permission: "manage_products" });
  const id = String(formData.get("id") || "");
  if (!id) redirect("/dashboard/products?error=Producto no encontrado");

  try {
    const product = await assertTenantProduct(business.id, id);
    const nextStatus = product.status === ProductStatus.ACTIVE ? ProductStatus.DRAFT : ProductStatus.ACTIVE;
    await prisma.product.updateMany({
      where: { id, businessId: business.id },
      data: { status: nextStatus }
    });
  } catch (error) {
    if (error instanceof TenantAccessError) redirect(`/dashboard/products?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.publicSlug}`);
  redirect("/dashboard/products?success=Visibilidad actualizada");
}

export async function duplicateProductAction(formData: FormData) {
  const { business } = await requireStoreAccess({ permission: "manage_products" });
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
        attributesJson: product.attributesJson,
        status: ProductStatus.DRAFT,
        featured: false
      }
    });
  } catch (error) {
    if (error instanceof TenantAccessError) redirect(`/dashboard/products?error=${error.message}`);
    throw error;
  }

  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.publicSlug}`);
  redirect("/dashboard/products?success=Producto duplicado como borrador");
}

export async function deleteProductAction(formData: FormData) {
  const { user, business } = await requireStoreAccess({ permission: "manage_products" });
  const id = String(formData.get("id") || "");
  if (!id) redirect("/dashboard/products?error=Producto inválido");
  const product = await assertTenantProduct(business.id, id);
  await prisma.product.deleteMany({ where: { id, businessId: business.id } });
  await writeAuditLog({
    userId: user.id,
    businessId: business.id,
    action: "product.delete",
    resourceType: "Product",
    resourceId: product.id,
    metadata: { name: product.name, slug: product.slug }
  });
  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.publicSlug}`);
  redirect("/dashboard/products?success=Producto eliminado");
}

export async function quickDiscountAction(formData: FormData) {
  const { business } = await requireStoreAccess({ permission: "manage_products" });
  const id = String(formData.get("id") || "");
  const product = await assertTenantProduct(business.id, id);
  const finalPrice = getFinalPrice(product.price, product.discountPercent);
  await prisma.product.updateMany({
    where: { id: product.id, businessId: business.id },
    data: { compareAtPrice: product.price, price: finalPrice, discountPercent: 0 }
  });
  revalidatePath("/dashboard/products");
  revalidatePath(`/store/${business.publicSlug}`);
}
