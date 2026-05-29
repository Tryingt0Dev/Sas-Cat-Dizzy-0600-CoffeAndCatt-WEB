"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { BootstrapSecretError, createSession, destroySession, hashPassword, resolvePublicRegistrationRole, verifyPassword, SELECTED_BUSINESS_COOKIE } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { getFreePlan } from "@/lib/plans";
import { StoreRole } from "@/lib/enums";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { loginSchema, normalizePublicSlug, registerSchema, reservedPublicSlugs } from "@/lib/validation";
import { createEmailVerificationToken, sendVerificationEmail } from "@/lib/auth/email-verification";
import { auditSuccess, auditFailure } from "@/lib/audit-log";
import { passwordPolicyDescription } from "@/lib/password-policy";
import { isTurnstileEnabled, verifyTurnstileToken } from "@/lib/turnstile";
import { requestHasAllowedOrigin } from "@/lib/request-security";
import { deriveAppUrlFromHeaders } from "@/lib/url-utils";

function authRedirect(path: "login" | "register", message: string): never {
  redirect(`/${path}?error=${encodeURIComponent(message)}`);
}

function registerUniqueError(error: Prisma.PrismaClientKnownRequestError) {
  const target = Array.isArray(error.meta?.target) ? error.meta?.target.join(",") : String(error.meta?.target ?? "");
  if (target.includes("email")) {
    return "Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.";
  }
  if (target.includes("slug") || target.includes("publicSlug")) {
    return "Ese nombre de tienda ya está ocupado. Prueba con una variación.";
  }
  return "Ese correo o nombre de tienda ya está registrado. Intenta con otros datos.";
}

async function enforceAuthLimit(scope: "login" | "register", limit: number) {
  const ip = await getClientIp();
  try {
    await assertRateLimit(rateLimitKey({ endpoint: `auth:${scope}`, ip }), limit, 15 * 60 * 1000);
  } catch (error) {
    if (error instanceof RateLimitError) {
      authRedirect(scope === "login" ? "login" : "register", `Demasiados intentos. Intenta nuevamente en ${error.retryAfterSeconds}s`);
    }
    throw error;
  }
}

export async function loginAction(formData: FormData) {
  const request = new Request("https://local.invalid", { headers: Object.fromEntries(await headers()) });
  if (!requestHasAllowedOrigin(request)) {
    redirect("/login?error=Origen no autorizado. Usa la URL configurada o ajusta TRUSTED_ORIGINS.");
  }

  await enforceAuthLimit("login", 8);
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) redirect("/login?error=Credenciales incorrectas");

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/login?error=Credenciales incorrectas");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) redirect("/login?error=Credenciales incorrectas");

  await createSession(user.id);
  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const request = new Request("https://local.invalid", { headers: Object.fromEntries(await headers()) });
  if (!requestHasAllowedOrigin(request)) {
    authRedirect("register", "Origen de formulario no autorizado. Revisa TRUSTED_ORIGINS, AUTH_URL y la URL de Cloudflared.");
  }

  await enforceAuthLimit("register", 5);

  const turnstileToken = String(formData.get("turnstile_token") || "").trim();
  const turnstileRequired = isTurnstileEnabled();

  if (turnstileRequired) {
    const hasKeys = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);

    if (!hasKeys && process.env.NODE_ENV !== "production") {
      // Desarrollo con TURNSTILE_ENABLED=true pero sin claves: se omite verificacion con advertencia
      console.warn("Turnstile: TURNSTILE_ENABLED=true sin claves configuradas. Omite verificacion en desarrollo.");
    } else if (!hasKeys) {
      // Produccion con TURNSTILE_ENABLED=true sin claves: error de configuracion
      console.error("Turnstile: TURNSTILE_ENABLED=true en produccion sin TURNSTILE_SECRET_KEY o NEXT_PUBLIC_TURNSTILE_SITE_KEY.");
      authRedirect("register", "Error de configuracion de seguridad. Contacta al administrador.");
    } else if (!turnstileToken) {
      authRedirect("register", "Completa el captcha antes de enviar el formulario.");
    } else {
      const ip = await getClientIp();
      const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);

      if (!turnstileResult.success && !turnstileResult.bypassed) {
        if (turnstileResult.error === "Turnstile not configured") {
          authRedirect("register", "Turnstile no esta configurado correctamente. Verifica TURNSTILE_SECRET_KEY y NEXT_PUBLIC_TURNSTILE_SITE_KEY.");
        }
        const invalidOrigins = Array.isArray(turnstileResult.errorCodes) && turnstileResult.errorCodes.includes("invalid-origins");
        if (invalidOrigins) {
          authRedirect("register", "Captcha bloqueado por origen no permitido. Agrega el dominio a la configuracion de Turnstile en Cloudflare.");
        }
        authRedirect("register", "Verificacion de seguridad fallida. Intenta de nuevo.");
      }
    }
  }

  let userRole: string;
  try {
    userRole = resolvePublicRegistrationRole({
      adminBootstrapSecret: String(formData.get("adminBootstrapSecret") || "")
    });
  } catch (error) {
    if (error instanceof BootstrapSecretError) authRedirect("register", error.message);
    throw error;
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    businessName: formData.get("businessName"),
    businessType: formData.get("businessType") || "Tienda"
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? `Completa todos los campos. ${passwordPolicyDescription}`;
    authRedirect("register", message);
  }

  const { name, email, password, businessName, businessType } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    await auditFailure({ action: "signup_duplicate_email", resourceType: "User", metadata: { email } });
    authRedirect("register", "Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.");
  }

  let baseSlug = normalizePublicSlug(slugify(businessName) || "tienda") || "tienda";
  if (reservedPublicSlugs.has(baseSlug)) baseSlug = `${baseSlug}-tienda`;
  let slug = baseSlug;
  let counter = 2;
  while (
    (await prisma.business.findUnique({ where: { slug } })) ||
    (await prisma.business.findUnique({ where: { publicSlug: slug } })) ||
    (await prisma.businessSlugHistory.findUnique({ where: { slug } }))
  ) {
    slug = `${baseSlug}-${counter++}`;
  }

  // SECURITY: Public registration normally creates USER role. PLATFORM_ADMIN must be assigned only via:
  // 1. Direct database seed (see prisma/seed.ts)
  // 2. ADMIN_BOOTSTRAP_SECRET known only by a private operator/script
  // Email in PLATFORM_OWNER_EMAILS never grants platform admin on public signup.
  const defaultPlan = await getFreePlan();
  let user;
  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        role: userRole,
        passwordHash: await hashPassword(password),
        businesses: {
          create: {
            planId: defaultPlan.id,
            planType: defaultPlan.type,
            name: businessName,
            slug,
            publicSlug: slug,
            businessType,
            description: `Catálogo oficial de ${businessName}`,
            subscription: {
              create: {
                planId: defaultPlan.id,
                status: "active"
              }
            },
            aiSettings: {
              create: {
                tone: "profesional, claro y vendedor",
                instructions: "Responde usando solo productos reales del catálogo. Pregunta datos faltantes y deriva a humano si no sabes."
              }
            }
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      authRedirect("register", registerUniqueError(error));
    }
    throw error;
  }

  const business = await prisma.business.findFirst({ where: { ownerId: user.id, slug }, select: { id: true } });
  if (business) {
    await prisma.membership.upsert({
      where: { userId_businessId: { userId: user.id, businessId: business.id } },
      update: { role: StoreRole.STORE_OWNER },
      create: { userId: user.id, businessId: business.id, role: StoreRole.STORE_OWNER }
    });
  }

  const ip = await getClientIp();

  // Crear sesion antes de enviar el email: la cuenta ya existe
  await createSession(user.id);
  const ck = await cookies();
  ck.set(SELECTED_BUSINESS_COOKIE, business?.id ?? "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production" || (await headers()).get("x-forwarded-proto") === "https",
    sameSite: "lax"
  });

  const appUrl = deriveAppUrlFromHeaders(await headers());
  const verification = await createEmailVerificationToken(user.id, ip);
  const emailResult = await sendVerificationEmail({ email: user.email, name: user.name, token: verification.token, appUrl });
  if (!emailResult.ok) {
    await auditFailure({
      action: "email_verification_send_failed",
      resourceType: "User",
      resourceId: user.id,
      metadata: { email: user.email, ip }
    });
    redirect("/verify-email-prompt?emailError=1");
  }
  await auditSuccess({ action: "signup_created", resourceType: "User", resourceId: user.id, metadata: { email: user.email, ip } });
  await auditSuccess({
    action: "email_verification_sent",
    resourceType: "User",
    resourceId: user.id,
    metadata: { email: user.email, ip }
  });

  redirect("/verify-email-prompt?sent=1");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
