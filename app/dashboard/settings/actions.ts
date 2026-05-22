"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { settingsFormSchema } from "@/lib/validation";

export async function updateSettingsAction(formData: FormData) {
  const business = await getCurrentBusiness();
  const parsed = settingsFormSchema.safeParse({
    name: formData.get("name"),
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

  await prisma.business.update({
    where: { id: business.id },
    data: {
      name: data.name,
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
