"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { PLAN_SLUGS, normalizePlanSlug } from "@/lib/plans";
import { requireStoreAccess } from "@/services/authorization";
import { writeAuditLog } from "@/services/audit-log";

const upgradeRequestSchema = z.object({
  businessId: z.string().trim().min(1),
  requestedPlan: z.enum(PLAN_SLUGS as unknown as [string, ...string[]])
});

export async function requestPlanUpgradeAction(formData: FormData) {
  const parsed = upgradeRequestSchema.safeParse({
    businessId: formData.get("businessId"),
    requestedPlan: formData.get("requestedPlan")
  });
  if (!parsed.success) redirect("/settings/billing?error=Solicitud de plan invalida");

  const { user, business } = await requireStoreAccess({
    businessId: parsed.data.businessId,
    permission: "manage_settings"
  });
  const currentPlan = normalizePlanSlug(business.planType);

  await writeAuditLog({
    userId: user.id,
    businessId: business.id,
    action: "billing.upgrade_requested",
    resourceType: "Billing",
    resourceId: parsed.data.requestedPlan,
    metadata: {
      currentPlan,
      requestedPlan: parsed.data.requestedPlan
    }
  });

  redirect("/settings/billing?success=Solicitud registrada. Un administrador revisara el cambio de plan.");
}
