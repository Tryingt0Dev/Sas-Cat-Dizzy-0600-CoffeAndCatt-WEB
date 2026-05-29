const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const EMAIL_FROM = process.env.EMAIL_FROM || `no-reply@${APP_URL.replace(/^https?:\/\//, "")}`;

export async function sendVerificationEmail({ to, verificationUrl, name }: { to: string; verificationUrl: string; name?: string }) {
  const subject = "Confirma tu correo - Omniventas";
  const greeting = name ? `Hola ${name},` : `Hola ${to ? to.split("@")[0] : ""},`;
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;line-height:1.4;color:#111">
      <p>${greeting}</p>
      <p>Haz clic en el siguiente enlace para verificar tu correo electrónico:</p>
      <p><a href="${verificationUrl}">Verificar correo</a></p>
      <p>Si no solicitaste este correo, ignora este mensaje.</p>
    </div>
  `;

  const text = `Confirma tu correo: ${verificationUrl}`;

  if (RESEND_API_KEY) {
    // Use Resend by default if key provided
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to,
          subject,
          html,
          text
        })
      });
      return { ok: true };
    } catch (err) {
      console.error("Failed to send verification email via Resend:", err);
      return { ok: false };
    }
  }

  // If no provider configured, do not break in development. Log link only in non-production.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Verification email for ${to}: ${verificationUrl}`);
    return { ok: true, dev: true };
  }

  // In production, avoid silently failing.
  console.error("Email provider not configured (RESEND_API_KEY missing)");
  return { ok: false };
}

export default sendVerificationEmail;
