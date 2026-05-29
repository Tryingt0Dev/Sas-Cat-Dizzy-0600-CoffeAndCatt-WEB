import { FEATURE_LABELS, type FeatureKey } from "@/lib/plans/feature-keys";
import { canUseFeature } from "@/lib/plans/can-use-feature";

export class PlanFeatureAccessError extends Error {
  constructor(
    public readonly featureKey: FeatureKey,
    message = `${FEATURE_LABELS[featureKey]} no esta disponible en tu plan actual.`
  ) {
    super(message);
  }
}

export function assertFeatureAccess(plan: string | null | undefined, featureKey: FeatureKey) {
  if (!canUseFeature(plan, featureKey)) {
    throw new PlanFeatureAccessError(featureKey);
  }
}
