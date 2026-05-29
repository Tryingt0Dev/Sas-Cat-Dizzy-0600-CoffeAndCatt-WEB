import assert from "assert";
import {
  PRIMARY_PLATFORM_OWNER_EMAIL,
  canManagePlatformAccess,
  getPlatformAdminAccessForEmail,
  isPrimaryPlatformOwnerEmail,
  normalizePlatformAdminEmail
} from "../lib/platform-admin";

async function main() {
  assert.strictEqual(normalizePlatformAdminEmail(" FelipeBustamante003@GMAIL.COM "), PRIMARY_PLATFORM_OWNER_EMAIL);
  assert.strictEqual(isPrimaryPlatformOwnerEmail(PRIMARY_PLATFORM_OWNER_EMAIL), true);
  assert.strictEqual(isPrimaryPlatformOwnerEmail("cliente@example.com"), false);

  const ownerAccess = await getPlatformAdminAccessForEmail(PRIMARY_PLATFORM_OWNER_EMAIL);
  assert(ownerAccess, "Primary owner must always resolve platform admin access");
  assert.strictEqual(ownerAccess.role, "OWNER");
  assert.strictEqual(ownerAccess.enabled, true);
  assert.strictEqual(canManagePlatformAccess(ownerAccess), true);

  const normalAccess = await getPlatformAdminAccessForEmail("cliente-normal@example.com");
  assert.strictEqual(normalAccess, null, "Normal users must not resolve platform admin access");

  console.log("Platform admin access smoke checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
