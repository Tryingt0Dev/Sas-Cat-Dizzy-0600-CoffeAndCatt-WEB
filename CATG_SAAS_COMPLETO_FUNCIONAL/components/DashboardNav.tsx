import { requireStoreAccess } from "@/services/authorization";
import { DashboardNavClient } from "@/components/DashboardNavClient";

export async function DashboardNav() {
  const { user, business, isPlatformAdmin, plan } = await requireStoreAccess({ permission: "view_dashboard" });
  return <DashboardNavClient user={user} business={business} isPlatformAdmin={isPlatformAdmin} plan={plan} />;
}
