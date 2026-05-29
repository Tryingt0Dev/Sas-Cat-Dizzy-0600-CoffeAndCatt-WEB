export async function verifyTurnstileToken(token: string, ip?: string) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In development, allow bypass if keys not configured
  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️  Turnstile not configured in development mode. Verification bypassed.");
      return { success: true, bypassed: true };
    }
    // In production, reject
    return { success: false, error: "Turnstile not configured" };
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ip
      })
    });

    const data = await response.json();

    if (data.success) {
      return { success: true };
    }

    const errorCodes = data["error-codes"] || [];
    console.warn("Turnstile verification failed", { errorCodes });
    return { success: false, error: "Turnstile verification failed" };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Turnstile verification error" };
  }
}
