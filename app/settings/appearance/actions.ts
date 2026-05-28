"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { auditSuccess } from "@/services/audit-log";
import { requireStoreAccess } from "@/services/authorization";
import { PlanAccessError, requireAdvancedCustomTheme } from "@/services/plan-guard";
import { saasThemes } from "@/lib/themes/saas-themes";
import { catalogPalettes } from "@/lib/themes/catalog-palettes";

const BASIC_CATALOG_PALETTE = "minimal-arena";
const saasThemeSchema = z.enum(saasThemes.map((theme) => theme.slug) as [string, ...string[]]);
const catalogPaletteSchema = z.enum(catalogPalettes.map((palette) => palette.slug) as [string, ...string[]]);

export async function updateSaaSThemeAction(formData: FormData) {
  const user = await requireUser();
  const themeSlug = String(formData.get("themeSlug") ?? "violet-premium");
  const parsed = saasThemeSchema.safeParse(themeSlug);
  if (!parsed.success) {
    redirect("/dashboard/design?error=Tema inválido");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { saasTheme: parsed.data }
  });
  await auditSuccess({
    userId: user.id,
    action: "update_appearance_success",
    entityType: "User",
    entityId: user.id,
    metadata: { scope: "saas_theme", theme: parsed.data }
  });

  redirect("/dashboard/design?success=Tema actualizado");
}

export async function updateStoreCatalogPaletteAction(formData: FormData) {
  await requireUser();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const paletteSlug = String(formData.get("paletteSlug") ?? "minimal-arena");
  const parsedPalette = catalogPaletteSchema.safeParse(paletteSlug);

  if (!storeId) {
    redirect("/dashboard/design?error=Selecciona una tienda válida");
  }
  if (!parsedPalette.success) {
    redirect("/dashboard/design?error=Paleta inválida");
  }

  const access = await requireStoreAccess({ businessId: storeId, permission: "manage_settings" });
  if (parsedPalette.data !== BASIC_CATALOG_PALETTE) {
    try {
      await requireAdvancedCustomTheme(access.business.id, {
        userId: access.user.id,
        attemptedAction: "update_catalog_palette"
      });
    } catch (error) {
      if (error instanceof PlanAccessError) {
        redirect(`/dashboard/design?error=${error.message}`);
      }
      throw error;
    }
  }

  await prisma.business.update({
    where: { id: storeId },
    data: { catalogPalette: parsedPalette.data }
  });
  await auditSuccess({
    userId: access.user.id,
    businessId: access.business.id,
    action: "update_appearance_success",
    entityType: "Business",
    entityId: access.business.id,
    metadata: { scope: "catalog_palette", palette: parsedPalette.data }
  });

  redirect("/dashboard/design?success=Paleta del catálogo guardada");
}
