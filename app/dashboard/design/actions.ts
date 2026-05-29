"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { auditSuccess } from "@/services/audit-log";
import { requireStoreAccess } from "@/services/authorization";
import { PlanAccessError, requireAdvancedCustomTheme, assertTemplateAllowed, getBusinessPlan } from "@/services/plan-guard";
import { saasThemes } from "@/lib/themes/saas-themes";
import { catalogPalettes } from "@/lib/themes/catalog-palettes";
import { catalogTemplateOptions } from "@/lib/catalog";

const BASIC_CATALOG_PALETTE = "minimal-arena";
const saasThemeSchema = z.enum(saasThemes.map((t) => t.slug) as [string, ...string[]]);
const catalogPaletteSchema = z.enum(catalogPalettes.map((p) => p.slug) as [string, ...string[]]);
const catalogTemplateSchema = z.enum(catalogTemplateOptions.map((t) => t.value) as [string, ...string[]]);

type ActionResult = { ok: boolean; message: string };

export async function saveDesignChangesAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const storeId = String(formData.get("storeId") ?? "").trim();
  if (!storeId) return { ok: false, message: "Selecciona una tienda válida" };

  const access = await requireStoreAccess({ businessId: storeId, permission: "manage_settings" });

  const saasThemeRaw = String(formData.get("saasTheme") ?? "").trim();
  const paletteRaw = String(formData.get("paletteSlug") ?? "").trim();
  const templateRaw = String(formData.get("template") ?? "").trim();

  const saasThemeParsed = saasThemeRaw ? saasThemeSchema.safeParse(saasThemeRaw) : undefined;
  const paletteParsed = paletteRaw ? catalogPaletteSchema.safeParse(paletteRaw) : undefined;
  const templateParsed = templateRaw ? catalogTemplateSchema.safeParse(templateRaw) : undefined;

  if (saasThemeRaw && !saasThemeParsed?.success) return { ok: false, message: "Tema SaaS inválido" };
  if (paletteRaw && !paletteParsed?.success) return { ok: false, message: "Paleta inválida" };
  if (templateRaw && !templateParsed?.success) return { ok: false, message: "Plantilla inválida" };

  const saasThemeChanged = saasThemeParsed?.data && saasThemeParsed.data !== (user.saasTheme ?? "violet-premium");
  const paletteChanged = paletteParsed?.data && paletteParsed.data !== (access.business.catalogPalette ?? BASIC_CATALOG_PALETTE);
  const templateChanged = templateParsed?.data && templateParsed.data !== access.business.catalogTemplate;

  // Advanced color fields
  const primaryColor = formData.get("primaryColor") ? String(formData.get("primaryColor")) : null;
  const secondaryColor = formData.get("secondaryColor") ? String(formData.get("secondaryColor")) : null;
  const accentColor = formData.get("accentColor") ? String(formData.get("accentColor")) : null;
  const backgroundColor = formData.get("backgroundColor") ? String(formData.get("backgroundColor")) : null;
  const textColor = formData.get("textColor") ? String(formData.get("textColor")) : null;
  const buttonRadiusRaw = formData.get("buttonRadius");
  const buttonRadius = buttonRadiusRaw ? Number(buttonRadiusRaw) : null;

  const hasAdvancedColors = primaryColor || secondaryColor || accentColor || backgroundColor || textColor || buttonRadius !== null;
  const advancedChanged = hasAdvancedColors && (
    primaryColor !== access.business.primaryColor ||
    secondaryColor !== access.business.secondaryColor ||
    accentColor !== access.business.accentColor ||
    backgroundColor !== access.business.backgroundColor ||
    textColor !== access.business.textColor ||
    buttonRadius !== access.business.buttonRadius
  );

  // Plan checks
  try {
    if (templateChanged || paletteChanged || advancedChanged) {
      const businessWithPlan = await prisma.business.findUnique({
        where: { id: access.business.id },
        include: { plan: true, subscription: { include: { plan: true } } }
      });
      const plan = getBusinessPlan(businessWithPlan, user);

      if (templateChanged && templateParsed?.data) {
        assertTemplateAllowed(plan, templateParsed.data, access.business.catalogTemplate);
      }
      if ((paletteChanged && paletteParsed?.data && paletteParsed.data !== BASIC_CATALOG_PALETTE) || advancedChanged) {
        await requireAdvancedCustomTheme(access.business.id, {
          userId: access.user.id,
          attemptedAction: "save_design_changes"
        });
      }
    }
  } catch (error) {
    if (error instanceof PlanAccessError) return { ok: false, message: error.message };
    throw error;
  }

  // Persist changes
  const businessUpdate: Record<string, unknown> = {};
  if (paletteChanged && paletteParsed?.data) businessUpdate.catalogPalette = paletteParsed.data;
  if (templateChanged && templateParsed?.data) businessUpdate.catalogTemplate = templateParsed.data;
  if (primaryColor) businessUpdate.primaryColor = primaryColor;
  if (secondaryColor) businessUpdate.secondaryColor = secondaryColor;
  if (accentColor) businessUpdate.accentColor = accentColor;
  if (backgroundColor) businessUpdate.backgroundColor = backgroundColor;
  if (textColor) businessUpdate.textColor = textColor;
  if (buttonRadius !== null) businessUpdate.buttonRadius = buttonRadius;

  if (Object.keys(businessUpdate).length > 0) {
    await prisma.business.update({ where: { id: storeId }, data: businessUpdate });
  }

  if (saasThemeChanged && saasThemeParsed?.data) {
    await prisma.user.update({ where: { id: user.id }, data: { saasTheme: saasThemeParsed.data } });
  }

  // Revalidate
  if (paletteChanged || templateChanged || advancedChanged) {
    revalidatePath(`/store/${access.business.publicSlug}`);
    revalidatePath("/dashboard/design");
    revalidatePath("/dashboard/settings");
  }
  if (saasThemeChanged) {
    revalidatePath("/", "layout");
  }

  await auditSuccess({
    userId: user.id,
    businessId: access.business.id,
    action: "save_design_changes_success",
    entityType: "Business",
    entityId: access.business.id,
    metadata: {
      paletteChanged: paletteChanged ? paletteParsed?.data : undefined,
      templateChanged: templateChanged ? templateParsed?.data : undefined,
      saasThemeChanged: saasThemeChanged ? saasThemeParsed?.data : undefined,
      advancedChanged
    }
  });

  return { ok: true, message: "Cambios guardados" };
}
