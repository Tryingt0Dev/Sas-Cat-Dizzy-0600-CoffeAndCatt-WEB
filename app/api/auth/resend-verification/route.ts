import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createEmailVerificationToken, sendVerificationEmail } from "@/lib/auth/email-verification";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { deriveAppUrlFromHeaders } from "@/lib/url-utils";
import { getEmailDeliveryMode } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ error: "El email ya está verificado" }, { status: 400 });
    }

    const ip = await getClientIp(req);

    // Rate limit: 1 per 60 seconds, 5 per hour, 10 per day
    try {
      await assertRateLimit(rateLimitKey({ endpoint: "auth:resend_verification", userId: user.id, ip }), 1, 60 * 1000);
      await assertRateLimit(rateLimitKey({ endpoint: "auth:resend_verification_hourly", userId: user.id }), 5, 60 * 60 * 1000);
      await assertRateLimit(rateLimitKey({ endpoint: "auth:resend_verification_daily", userId: user.id }), 10, 24 * 60 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: `Demasiados intentos. Intenta en ${error.retryAfterSeconds}s` },
          { status: 429 }
        );
      }
      throw error;
    }

    const verification = await createEmailVerificationToken(user.id);
    const appUrl = deriveAppUrlFromHeaders(req.headers);
    const emailResult = await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verification.token,
      appUrl
    });
    if (!emailResult.ok) {
      const deliveryMode = getEmailDeliveryMode();
      const hint = deliveryMode === "disabled"
        ? "El envio de emails esta deshabilitado (EMAIL_DELIVERY_MODE=disabled)."
        : "Error al conectar con el proveedor de email.";
      return NextResponse.json({ error: hint }, { status: 502 });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: emailResult.ok ? "email_verification_resent" : "email_verification_resend_skipped_or_failed",
        resourceType: "User",
        resourceId: user.id,
        ip,
        metadata: JSON.stringify({ email: user.email, providerOk: emailResult.ok })
      }
    });

    return NextResponse.json({ ok: true, dev: emailResult.dev ?? false, message: emailResult.dev ? "En desarrollo, el link de verificacion aparece en la terminal. Revisa la consola del servidor." : "Email enviado correctamente. Revisa tu bandeja de entrada." });
  } catch (error) {
    console.error("Error resending verification email:", error);
    return NextResponse.json({ error: "Error al reenviar el email" }, { status: 500 });
  }
}
