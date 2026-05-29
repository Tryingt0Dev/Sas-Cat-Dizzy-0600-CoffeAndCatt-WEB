import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { assertTenantProduct, TenantAccessError } from "@/services/tenant-guard";

export { TenantAccessError };
export {
  assertQuoteProductsBelongToTenant,
  assertTenantConversation,
  assertTenantCustomer,
  assertTenantOrder,
  assertTenantProduct,
  assertTenantQuote,
  resolveTenantCategoryId
} from "@/services/tenant-guard";

export async function assertCanManageProduct(productId: string) {
  const access = await requireStoreAccess({ permission: "manage_products" });
  return assertTenantProduct(access.business.id, productId);
}

export async function assertCanManageUser(targetUserId: string) {
  await requireStoreAccess({ permission: "manage_settings" });
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, name: true, role: true }
  });
  if (!user) throw new TenantAccessError("Usuario no encontrado");
  return user;
}

export async function assertTenantAccess(businessId: string, request?: Request) {
  return requireStoreAccess({ businessId, permission: "view_dashboard", request });
}

export async function getSafeStoreForUser(businessId: string, request?: Request) {
  const access = await assertTenantAccess(businessId, request);
  return access.business;
}
