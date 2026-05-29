/**
 * Determina si Turnstile debe estar activo considerando ambas variables:
 * - TURNSTILE_ENABLED (prioridad): "true" = activo, "false" = inactivo
 * - TURNSTILE_DISABLED (legado): "1" = inactivo
 *
 * En desarrollo: inactivo por defecto (seguro para pruebas locales).
 * En produccion: activo por defecto (exige seguridad).
 */
export function isTurnstileEnabled() {
  const enabledEnv = process.env.TURNSTILE_ENABLED;
  if (enabledEnv === "true") return true;
  if (enabledEnv === "false") return false;
  if (process.env.TURNSTILE_DISABLED === "1") return false;
  return process.env.NODE_ENV === "production";
}

export async function verifyTurnstileToken(token: string, ip?: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const enabled = isTurnstileEnabled();

  if (!enabled) {
    console.warn("Turnstile: desactivado por configuracion (TURNSTILE_ENABLED=false o TURNSTILE_DISABLED=1 o desarrollo).");
    return { success: true, bypassed: true };
  }

  const keysMissing = !secretKey || !siteKey;

  if (keysMissing) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Turnstile: habilitado pero sin claves configuradas en desarrollo. Verificacion omitida.");
      return { success: true, bypassed: true };
    }
    console.error("Turnstile: TURNSTILE_ENABLED=true en produccion pero faltan TURNSTILE_SECRET_KEY o NEXT_PUBLIC_TURNSTILE_SITE_KEY.");
    return { success: false, error: "Turnstile not configured", errorCodes: ["missing-keys"] };
  }

  if (!token) {
    return { success: false, error: "Turnstile token missing" };
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        ...(ip ? { remoteip: ip } : {})
      }).toString()
    });

    const data = await response.json();

    if (data.success) {
      return { success: true };
    }

    const errorCodes: string[] = data["error-codes"] || [];
    console.warn("Turnstile verification failed", { errorCodes });
    return { success: false, error: "Turnstile verification failed", errorCodes };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Turnstile verification error" };
  }
}
