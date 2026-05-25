"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireStoreAccess } from "@/services/authorization";
import { saasThemes } from "@/lib/themes/saas-themes";
import { catalogPalettes } from "@/lib/themes/catalog-palettes";

const saasThemeSchema = z.enum(saasThemes.map((theme) => theme.slug) as [string, ...string[]]);
const catalogPaletteSchema = z.enum(catalogPalettes.map((palette) => palette.slug) as [string, ...string[]]);

export async function updateSaaSThemeAction(formData: FormData) {
  const user = await requireUser();
  const themeSlug = String(formData.get("themeSlug") ?? "violet-premium");
  const parsed = saasThemeSchema.safeParse(themeSlug);
  if (!parsed.success) {
    redirect("/settings/appearance?error=Tema inválido");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { saasTheme: parsed.data }
  });

  redirect("/settings/appearance?success=Tema actualizado");
}

export async function updateStoreCatalogPaletteAction(formData: FormData) {
  await requireUser();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const paletteSlug = String(formData.get("paletteSlug") ?? "minimal-arena");
  const parsedPalette = catalogPaletteSchema.safeParse(paletteSlug);

  if (!storeId) {
    redirect("/settings/appearance?error=Selecciona una tienda válida");
  }
  if (!parsedPalette.success) {
    redirect("/settings/appearance?error=Paleta inválida");
  }

  await requireStoreAccess({ businessId: storeId, permission: "manage_settings" });

  await prisma.business.update({
    where: { id: storeId },
    data: { catalogPalette: parsedPalette.data }
  });

  redirect("/settings/appearance?success=Paleta del catálogo guardada");
}
