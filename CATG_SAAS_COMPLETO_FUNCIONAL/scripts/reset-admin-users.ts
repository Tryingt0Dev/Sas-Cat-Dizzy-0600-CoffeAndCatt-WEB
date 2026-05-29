import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { StoreRole, UserRole } from "../lib/enums";
import { isStrongPassword, passwordPolicyDescription } from "../lib/password-policy";

const prisma = new PrismaClient();

const ADMIN_1_EMAIL = (process.env.ADMIN_1_EMAIL || "felipebustamante003@gmail.com").trim().toLowerCase();
const ADMIN_2_EMAIL = (process.env.ADMIN_2_EMAIL || "rivas.matias79@gmail.com").trim().toLowerCase();
const ADMIN_EMAILS = [ADMIN_1_EMAIL, ADMIN_2_EMAIL];

function isSafeLocalDatabaseUrl(databaseUrl: string) {
  const normalized = databaseUrl.trim().toLowerCase();
  if (normalized.startsWith("file:")) return true;

  try {
    const parsed = new URL(databaseUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function databaseUrlFromEnvFile() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, "utf8");
    const line = content
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith("DATABASE_URL="));
    if (!line) continue;
    return line
      .slice("DATABASE_URL=".length)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  return "";
}

function resolveDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL || databaseUrlFromEnvFile();
  if (databaseUrl && !process.env.DATABASE_URL) process.env.DATABASE_URL = databaseUrl;
  return databaseUrl;
}

function assertSafeToRun() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Bloqueado: este reset no puede correr con NODE_ENV=production.");
  }
  if (process.env.ALLOW_DESTRUCTIVE_ADMIN_RESET !== "true") {
    throw new Error("Bloqueado: define ALLOW_DESTRUCTIVE_ADMIN_RESET=true solo en entorno local/desarrollo.");
  }
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl || !isSafeLocalDatabaseUrl(databaseUrl)) {
    throw new Error("Bloqueado: DATABASE_URL no parece local/desarrollo.");
  }
  if (new Set(ADMIN_EMAILS).size !== ADMIN_EMAILS.length) {
    throw new Error("ADMIN_1_EMAIL y ADMIN_2_EMAIL deben ser distintos.");
  }
}

function temporaryPassword() {
  return `Admin-${crypto.randomBytes(14).toString("base64url")}!8Aa`;
}

function passwordFromEnv(key: "ADMIN_1_PASSWORD" | "ADMIN_2_PASSWORD", email: string) {
  const configured = process.env[key]?.trim();
  const password = configured || temporaryPassword();
  if (!isStrongPassword(password, email)) {
    throw new Error(`${key} no cumple la politica. ${passwordPolicyDescription}`);
  }
  return { password, generated: !configured };
}

async function main() {
  assertSafeToRun();
  const admin1Password = passwordFromEnv("ADMIN_1_PASSWORD", ADMIN_1_EMAIL);
  const admin2Password = passwordFromEnv("ADMIN_2_PASSWORD", ADMIN_2_EMAIL);
  const [admin1Hash, admin2Hash] = await Promise.all([
    bcrypt.hash(admin1Password.password, 10),
    bcrypt.hash(admin2Password.password, 10)
  ]);

  console.warn("RESET LOCAL: se conservaran tiendas/productos y se reasignara ownership al admin principal.");
  console.warn(`Admins finales: ${ADMIN_EMAILS.join(", ")}`);

  const result = await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany();

    const admin1 = await tx.user.upsert({
      where: { email: ADMIN_1_EMAIL },
      update: {
        name: "Felipe Bustamante",
        role: UserRole.SUPER_ADMIN,
        passwordHash: admin1Hash,
        emailVerifiedAt: new Date()
      },
      create: {
        email: ADMIN_1_EMAIL,
        name: "Felipe Bustamante",
        role: UserRole.SUPER_ADMIN,
        passwordHash: admin1Hash,
        emailVerifiedAt: new Date()
      }
    });

    await tx.user.upsert({
      where: { email: ADMIN_2_EMAIL },
      update: {
        name: "Matias Rivas",
        role: UserRole.SUPER_ADMIN,
        passwordHash: admin2Hash,
        emailVerifiedAt: new Date()
      },
      create: {
        email: ADMIN_2_EMAIL,
        name: "Matias Rivas",
        role: UserRole.SUPER_ADMIN,
        passwordHash: admin2Hash,
        emailVerifiedAt: new Date()
      }
    });

    const reassigned = await tx.business.updateMany({
      where: { owner: { email: { notIn: ADMIN_EMAILS } } },
      data: { ownerId: admin1.id }
    });

    const deletedUsers = await tx.user.deleteMany({
      where: { email: { notIn: ADMIN_EMAILS } }
    });

    const businesses = await tx.business.findMany({ select: { id: true } });
    for (const business of businesses) {
      await tx.membership.upsert({
        where: { userId_businessId: { userId: admin1.id, businessId: business.id } },
        update: { role: StoreRole.STORE_OWNER },
        create: { userId: admin1.id, businessId: business.id, role: StoreRole.STORE_OWNER }
      });
    }

    return { reassignedBusinesses: reassigned.count, deletedUsers: deletedUsers.count, businesses: businesses.length };
  });

  console.log("Reset local completado.");
  console.log(`Tiendas reasignadas: ${result.reassignedBusinesses}`);
  console.log(`Usuarios eliminados: ${result.deletedUsers}`);
  console.log(`Tiendas conservadas: ${result.businesses}`);
  if (admin1Password.generated) console.log(`Contraseña temporal ${ADMIN_1_EMAIL}: ${admin1Password.password}`);
  else console.log(`${ADMIN_1_EMAIL}: contraseña tomada desde ADMIN_1_PASSWORD`);
  if (admin2Password.generated) console.log(`Contraseña temporal ${ADMIN_2_EMAIL}: ${admin2Password.password}`);
  else console.log(`${ADMIN_2_EMAIL}: contraseña tomada desde ADMIN_2_PASSWORD`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
