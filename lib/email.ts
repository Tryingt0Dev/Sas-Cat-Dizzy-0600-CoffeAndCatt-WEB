import { getEmailDeliveryMode, envString } from "@/lib/env";

export async function sendVerificationEmail({ to, verificationUrl, name }: { to: string; verificationUrl: string; name?: string }) {
  const subject = "Confirma tu correo - Omniventas";
  const greeting = name ? `Hola ${name},` : `Hola ${to ? to.split("@")[0] : ""},`;
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;line-height:1.4;color:#111">
      <p>${greeting}</p>
      <p>Haz clic en el siguiente enlace para verificar tu correo electronico:</p>
      <p><a href="${verificationUrl}">Verificar correo</a></p>
      <p>Si no solicitaste este correo, ignora este mensaje.</p>
    </div>
  `;

  const text = `Confirma tu correo: ${verificationUrl}`;

  const mode = getEmailDeliveryMode();

  if (mode === "disabled") {
    console.warn("[email] EMAIL_DELIVERY_MODE=disabled. No se envio el correo.");
    return { ok: false };
  }

  if (mode === "console") {
    console.log(`[DEV] Verification email for ${to}: ${verificationUrl}`);
    return { ok: true, dev: true };
  }

  // mode === "resend"
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const EMAIL_FROM = envString("EMAIL_FROM") || undefined;

  if (!EMAIL_FROM || !RESEND_API_KEY) {
    console.error("[email] EMAIL_DELIVERY_MODE=resend pero falta RESEND_API_KEY o EMAIL_FROM.");
    return { ok: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
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
    if (!response.ok) {
      console.error("Failed to send verification email via Resend:", {
        status: response.status,
        statusText: response.statusText
      });
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Failed to send verification email via Resend:", err);
    return { ok: false };
  }
}

export default sendVerificationEmail;
