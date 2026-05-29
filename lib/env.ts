/**
 * Centralized environment variable helpers with safe boolean parsing
 * and delivery mode resolution.
 */

// ── Boolean helpers ──────────────────────────────────────────

/** Treats "false", "0", "" as false. Treats "true", "1" as true. */
export function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === null) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "false" || normalized === "0" || normalized === "") return false;
  if (normalized === "true" || normalized === "1") return true;
  // Unknown value: warn and use fallback
  console.warn(`[env] ${name}="${raw}" no es un valor booleano reconocido. Usando fallback=${fallback}.`);
  return fallback;
}

// ── String helpers ───────────────────────────────────────────

export function envString(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

// ── App environment ──────────────────────────────────────────

/** "local" | "production". Defaults based on NODE_ENV. */
export function getAppEnv(): "local" | "production" {
  const raw = envString("APP_ENV").toLowerCase();
  if (raw === "local" || raw === "development") return "local";
  if (raw === "production") return "production";
  return process.env.NODE_ENV === "production" ? "production" : "local";
}

export function isLocal(): boolean {
  return getAppEnv() === "local";
}

// ── Email verification policy ─────────────────────────────────

/** Always true for this SaaS. The env var is read but "false" is treated as false. */
export function isEmailVerificationRequired(): boolean {
  return envBool("EMAIL_VERIFICATION_REQUIRED", true);
}

// ── Email delivery mode ──────────────────────────────────────

export type EmailDeliveryMode = "console" | "resend" | "disabled";

const VALID_MODES: Set<string> = new Set(["console", "resend", "disabled"]);

export function getEmailDeliveryMode(): EmailDeliveryMode {
  const raw = envString("EMAIL_DELIVERY_MODE").toLowerCase();

  if (VALID_MODES.has(raw)) return raw as EmailDeliveryMode;

  // Smart fallback
  if (raw) {
    console.warn(`[env] EMAIL_DELIVERY_MODE="${raw}" no es valido. Usando fallback por contexto.`);
  }

  if (getAppEnv() === "production") {
    // In production, require explicit resend config
    if (hasResendConfig()) return "resend";
    console.error("[env] Entorno produccion sin EMAIL_DELIVERY_MODE configurado y sin RESEND_API_KEY. Revisa la configuracion.");
    return "disabled";
  }

  // Local dev: console mode
  return "console";
}

// ── Resend helpers ────────────────────────────────────────────

export function hasResendConfig(): boolean {
  return Boolean(envString("RESEND_API_KEY")) && Boolean(envString("EMAIL_FROM"));
}
