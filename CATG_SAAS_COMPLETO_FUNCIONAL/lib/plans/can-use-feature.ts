import { entitlementAllowsFeature } from "@/lib/plans/entitlements";
import { type FeatureKey } from "@/lib/plans/feature-keys";
import { getPlanEntitlements } from "@/lib/plans/get-plan-entitlements";
import { limitToNumber, type PlanLimitKey } from "@/lib/plans/plan-types";

export function canUseFeature(plan: string | null | undefined, featureKey: FeatureKey) {
  return entitlementAllowsFeature(getPlanEntitlements(plan), featureKey);
}

export function getLimit(plan: string | null | undefined, limitKey: PlanLimitKey) {
  return getPlanEntitlements(plan)[limitKey];
}

export function isWithinPlanLimit(plan: string | null | undefined, limitKey: PlanLimitKey, currentValue: number) {
  return currentValue < limitToNumber(getLimit(plan, limitKey));
}
