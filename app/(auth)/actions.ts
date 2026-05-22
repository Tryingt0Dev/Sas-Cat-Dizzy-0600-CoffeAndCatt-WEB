"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { getFreePlan } from "@/lib/plans";
import { assertRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { loginSchema, registerSchema } from "@/lib/validation";

async function enforceAuthLimit(scope: "login" | "register", limit: number) {
  const ip = await getClientIp();
  try {
    assertRateLimit(`${scope}:${ip}`, limit, 15 * 60 * 1000);
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

  const baseSlug = slugify(businessName);
  let slug = baseSlug;
  let counter = 2;
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const freePlan = await getFreePlan();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      businesses: {
        create: {
          planId: freePlan.id,
          planType: freePlan.type,
          name: businessName,
          slug,
          businessType,
          description: `Catálogo oficial de ${businessName}`,
          subscription: {
            create: {
              planId: freePlan.id
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

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
