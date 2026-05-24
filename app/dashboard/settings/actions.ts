"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { imageUrlBelongsToBusiness, settingsFormSchema } from "@/lib/validation";
import { assertAdvancedBrandingAllowed, assertTemplateAllowed, effectivePlanLimits, PlanAccessError } from "@/services/plan-guard";
import { writeAuditLog } from "@/services/audit-log";
import { requireStoreAccess } from "@/services/authorization";

export async function updateSettingsAction(formData: FormData) {
  const { user, business } = await requireStoreAccess({ permission: "manage_settings" });
  const parsed = settingsFormSchema.safeParse({
    name: formData.get("name"),
    publicSlug: formData.get("publicSlug") || business.publicSlug,
    dashboardTitle: formData.get("dashboardTitle") || undefined,
    dashboardSubtitle: formData.get("dashboardSubtitle") || undefined,
    description: formData.get("description") || undefined,
    whatsappNumber: formData.get("whatsappNumber") || undefined,
    instagramUrl: formData.get("instagramUrl") || undefined,
    businessType: formData.get("businessType") || undefined,
    address: formData.get("address") || undefined,
    catalogTemplate: formData.get("catalogTemplate"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    accentColor: formData.get("accentColor"),
    backgroundColor: formData.get("backgroundColor"),
    textColor: formData.get("textColor"),
    buttonRadius: formData.get("buttonRadius") || 18,
    logoUrl: formData.get("logoUrl") || undefined,
    bannerUrl: formData.get("bannerUrl") || undefined,
    tone: formData.get("tone"),
    instructions: formData.get("instructions") || undefined,
    fallbackMessage: formData.get("fallbackMessage"),
    allowAutoLead: formData.get("allowAutoLead") === "on",
    humanHandoffEnabled: formData.get("humanHandoffEnabled") === "on"
  });

  if (!parsed.success) redirect("/dashboard/settings?error=Revisa los datos de diseño e IA");
  const data = parsed.data;
  if (!imageUrlBelongsToBusiness(data.logoUrl, business.id) || !imageUrlBelongsToBusiness(data.bannerUrl, business.id)) {
    redirect("/dashboard/settings?error=Las imagenes de branding no pertenecen a esta tienda");
  }

  const businessWithPlan = await prisma.business.findUnique({
    where: { id: business.id },
    include: { plan: true }
  });

  try {
    const plan = effectivePlanLimits(businessWithPlan?.plan, user);
    assertTemplateAllowed(plan, data.catalogTemplate, business.catalogTemplate);
    assertAdvancedBrandingAllowed(plan, {
      catalogTemplate: data.catalogTemplate,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor,
      backgroundColor: data.backgroundColor,
      textColor: data.textColor,
      buttonRadius: data.buttonRadius,
      logoUrl: data.logoUrl,
      bannerUrl: data.bannerUrl
    }, {
      catalogTemplate: business.catalogTemplate,
      primaryColor: business.primaryColor,
      secondaryColor: business.secondaryColor,
      accentColor: business.accentColor,
      backgroundColor: business.backgroundColor,
      textColor: business.textColor,
      buttonRadius: business.buttonRadius,
      logoUrl: business.logoUrl,
      bannerUrl: business.bannerUrl
    });
  } catch (error) {
    if (error instanceof PlanAccessError) redirect(`/dashboard/settings?error=${error.message}`);
    throw error;
  }

  const publicSlugChanged = data.publicSlug !== business.publicSlug;
  if (publicSlugChanged) {
    const [existingBusiness, existingHistory] = await Promise.all([
      prisma.business.findUnique({ where: { publicSlug: data.publicSlug }, select: { id: true } }),
      prisma.businessSlugHistory.findUnique({ where: { slug: data.publicSlug }, select: { businessId: true } })
    ]);

    if (existingBusiness && existingBusiness.id !== business.id) redirect("/dashboard/settings?error=Ese slug público ya está en uso");
    if (existingHistory && existingHistory.businessId !== business.id) redirect("/dashboard/settings?error=Ese slug público ya está reservado por otra tienda");
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (publicSlugChanged) {
        await tx.businessSlugHistory.deleteMany({
          where: { businessId: business.id, slug: data.publicSlug }
        });
        await tx.businessSlugHistory.upsert({
          where: { slug: business.publicSlug },
          update: { businessId: business.id },
          create: { businessId: business.id, slug: business.publicSlug }
        });
      }

      await tx.business.update({
        where: { id: business.id },
        data: {
          name: data.name,
          publicSlug: data.publicSlug,
          dashboardTitle: data.dashboardTitle,
          dashboardSubtitle: data.dashboardSubtitle,
          description: data.description,
          whatsappNumber: data.whatsappNumber,
          instagramUrl: data.instagramUrl,
          businessType: data.businessType,
          address: data.address,
          catalogTemplate: data.catalogTemplate,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor,
          backgroundColor: data.backgroundColor,
          textColor: data.textColor,
          buttonRadius: data.buttonRadius,
          logoUrl: data.logoUrl,
          bannerUrl: data.bannerUrl
        }
      });
    });

    await prisma.aiSettings.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        tone: data.tone,
        instructions: data.instructions,
        fallbackMessage: data.fallbackMessage,
        allowAutoLead: data.allowAutoLead,
        humanHandoffEnabled: data.humanHandoffEnabled
      },
      update: {
        tone: data.tone,
        instructions: data.instructions,
        fallbackMessage: data.fallbackMessage,
        allowAutoLead: data.allowAutoLead,
        humanHandoffEnabled: data.humanHandoffEnabled
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/dashboard/settings?error=Ese slug publico ya esta en uso. Intenta con otro");
    }
    throw error;
  }

  revalidatePath("/dashboard/settings");
  revalidatePath(`/store/${business.publicSlug}`);
  revalidatePath(`/store/${data.publicSlug}`);
  await writeAuditLog({
    userId: user.id,
    businessId: business.id,
    action: publicSlugChanged ? "settings.update_with_public_slug_change" : "settings.update",
    resourceType: "Business",
    resourceId: business.id,
    metadata: {
      oldPublicSlug: publicSlugChanged ? business.publicSlug : undefined,
      newPublicSlug: data.publicSlug,
      catalogTemplate: data.catalogTemplate
    }
  });
  redirect("/dashboard/settings?success=Ajustes guardados");
}
