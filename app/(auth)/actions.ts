"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { BootstrapSecretError, createSession, destroySession, hashPassword, resolvePublicRegistrationRole, verifyPassword } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { getFreePlan } from "@/lib/plans";
import { StoreRole } from "@/lib/enums";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { loginSchema, normalizePublicSlug, registerSchema, reservedPublicSlugs } from "@/lib/validation";

async function enforceAuthLimit(scope: "login" | "register", limit: number) {
  const ip = await getClientIp();
  try {
    await assertRateLimit(rateLimitKey({ endpoint: `auth:${scope}`, ip }), limit, 15 * 60 * 1000);
  } catch (error) {
    if (error instanceof RateLimitError) {
      redirect(`/${scope === "login" ? "login" : "register"}?error=Demasiados intentos. Intenta nuevamente en ${error.retryAfterSeconds}s`);
    }
    throw error;
  }
}

export async function loginAction(formData: FormData) {
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
  await enforceAuthLimit("register", 5);
  let userRole: string;
  try {
    userRole = resolvePublicRegistrationRole({
      adminBootstrapSecret: String(formData.get("adminBootstrapSecret") || "")
    });
  } catch (error) {
    if (error instanceof BootstrapSecretError) redirect(`/register?error=${error.message}`);
    throw error;
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    businessName: formData.get("businessName"),
    businessType: formData.get("businessType") || "Tienda"
  });

  if (!parsed.success) {
    redirect("/register?error=Completa todos los campos. La contraseña debe tener mínimo 8 caracteres");
  }

  const { name, email, password, businessName, businessType } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) redirect("/register?error=Ese email ya está registrado");

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
                status: "TRIALING"
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
      redirect("/register?error=Ese email o slug ya está registrado. Intenta con otro nombre de tienda");
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

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
