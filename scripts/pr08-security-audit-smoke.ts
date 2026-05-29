import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function source(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function assertIncludes(file: string, expected: string, message: string) {
  assert.ok(source(file).includes(expected), `${file}: ${message}`);
}

function assertOccurrencesAtLeast(file: string, expected: string, minimum: number, message: string) {
  const matches = source(file).match(new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? [];
  assert.ok(matches.length >= minimum, `${file}: ${message}`);
}

for (const route of [
  "app/api/admin/export-owner-csv/route.ts",
  "app/api/admin/metrics-history/route.ts",
  "app/api/admin/sync-metrics/route.ts"
]) {
  assertIncludes(route, "requirePlatformApiAccess", "debe exigir guardia platform-admin API");
  assertIncludes(route, 'permission: "billing"', "debe limitar acceso a roles con permiso de billing");
  assertIncludes(route, "rateLimit", "debe aplicar rate limit");
}

assertIncludes("app/api/stores/[id]/domains/route.ts", "getStoreAccess", "debe validar acceso a la tienda");
assertIncludes("app/api/stores/[id]/domains/route.ts", 'permission: "manage_settings"', "debe exigir permiso de ajustes");
assertIncludes("app/api/stores/[id]/domains/route.ts", "requestHasAllowedOrigin", "debe validar origen");
assertIncludes("app/api/stores/[id]/domains/route.ts", "crypto.randomBytes", "debe generar token criptografico");
assertIncludes("app/api/stores/[id]/domains/route.ts", 'requireFeature(access.business.id, "customDomain")', "debe exigir feature de dominio custom");

assertOccurrencesAtLeast("app/store/[slug]/page.tsx", "customDomainVerified: true", 2, "debe resolver custom domains solo si estan verificados");
assertIncludes("app/(auth)/actions.ts", "turnstileRequired", "registro debe fallar cerrado con Turnstile en produccion/configuracion parcial");
assertIncludes("app/(auth)/actions.ts", "providerOk: emailResult.ok", "registro debe auditar resultado real de envio de email");
assertIncludes("lib/turnstile.ts", "!secretKey || !siteKey", "Turnstile debe detectar configuracion incompleta");
assertIncludes("lib/security/tenant.ts", "memberships: { some: { businessId: access.business.id } }", "helper de usuario debe filtrar por tenant");

console.log("PR-08 security audit smoke passed");

