"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBusinessContext } from "@/lib/auth";
import { imageUrlBelongsToBusiness, settingsFormSchema } from "@/lib/validation";
import { assertAdvancedBrandingAllowed, assertTemplateAllowed, effectivePlanLimits, PlanAccessError } from "@/services/plan-guard";

export async function updateSettingsAction(formData: FormData) {
  const { user, business } = await getCurrentBusinessContext();
  const parsed = settingsFormSchema.safeParse({
    name: formData.get("name"),
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

  await prisma.business.update({
    where: { id: business.id },
    data: {
      name: data.name,
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

  revalidatePath("/dashboard/settings");
  revalidatePath(`/store/${business.slug}`);
  redirect("/dashboard/settings?success=Ajustes guardados");
}
