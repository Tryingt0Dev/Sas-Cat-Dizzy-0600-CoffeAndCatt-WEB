"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saasThemes } from "@/lib/themes/saas-themes";

const themeSlugSchema = z.enum(saasThemes.map((theme) => theme.slug) as [string, ...string[]]);

export async function selectSaaSThemeAction(formData: FormData) {
  const user = await requireUser();
  const themeSlug = String(formData.get("themeSlug") ?? "violet-premium");
  const parsed = themeSlugSchema.safeParse(themeSlug);
  if (!parsed.success) {
    redirect("/onboarding/theme?error=Opción de diseño inválida");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      saasTheme: parsed.data,
      themeOnboardingCompleted: true
    }
  });

  redirect("/dashboard");
}
