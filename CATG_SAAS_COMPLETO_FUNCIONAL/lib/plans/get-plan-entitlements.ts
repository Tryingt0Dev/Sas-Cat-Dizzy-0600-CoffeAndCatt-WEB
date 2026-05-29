import { PLAN_ENTITLEMENTS } from "@/lib/plans/entitlements";
import { normalizePlanSlug, type PlanEntitlements } from "@/lib/plans/plan-types";

export function getPlanEntitlements(plan: string | null | undefined): PlanEntitlements {
  return PLAN_ENTITLEMENTS[normalizePlanSlug(plan)];
}
