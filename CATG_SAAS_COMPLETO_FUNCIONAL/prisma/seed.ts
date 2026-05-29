import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { CatalogTemplate, PlanType, StoreRole, UserRole, type UserRole as UserRoleValue } from "../lib/enums";
import { planDefinitions } from "../lib/plans";
import { isStrongPassword, passwordPolicyDescription } from "../lib/password-policy";

const prisma = new PrismaClient();

function seedPassword() {
  const configured = process.env.DEMO_SEED_PASSWORD?.trim();
  const password = configured || `Local-${crypto.randomBytes(12).toString("base64url")}!7Aa`;
  if (!isStrongPassword(password, "demo@example.com")) {
    throw new Error(`DEMO_SEED_PASSWORD no cumple la politica. ${passwordPolicyDescription}`);
  }
  return { password, generated: !configured };
}

async function upsertOwner(email: string, name: string, passwordHash: string, role: UserRoleValue = UserRole.USER) {
  return prisma.user.upsert({
    where: { email },
    update: { role, passwordHash, emailVerifiedAt: new Date() },
    create: { email, name, passwordHash, role, emailVerifiedAt: new Date(), saasTheme: "violet-premium", themeOnboardingCompleted: false }
  });
}

async function main() {
  const demoPassword = seedPassword();
  const passwordHash = await bcrypt.hash(demoPassword.password, 10);
  const plans = await Promise.all(
    Object.values(planDefinitions).map((plan) =>
      prisma.plan.upsert({
        where: { type: plan.type },
        update: plan,
        create: plan
      })
    )
  );
  const normalPlan = plans.find((plan) => plan.type === PlanType.NORMAL);
  const premiumPlan = plans.find((plan) => plan.type === PlanType.PREMIUM);
  if (!normalPlan || !premiumPlan) throw new Error("No se pudieron crear los planes demo");

  await upsertOwner("admin@demo.cl", "Admin Plataforma", passwordHash, UserRole.SUPER_ADMIN);
  const storeOwner = await upsertOwner("storelamon@demo.cl", "Dueña STORELAMON", passwordHash);
  const secOwner = await upsertOwner("seguridad@demo.cl", "Dueño CATG Seguridad", passwordHash);

  const store = await prisma.business.upsert({
    where: { slug: "storelamon" },
    update: {
      planId: premiumPlan.id,
      planType: PlanType.PREMIUM,
      publicSlug: "storelamon",
      catalogPalette: "minimal-arena",
      catalogTemplate: CatalogTemplate.BOUTIQUE_PREMIUM,
      primaryColor: "#111827",
      secondaryColor: "#FDF2F8",
      accentColor: "#DB2777",
      backgroundColor: "#FFF7ED",
      textColor: "#111827",
      buttonRadius: 18
    },
    create: {
      ownerId: storeOwner.id,
      planId: premiumPlan.id,
      planType: PlanType.PREMIUM,
      name: "STORELAMON",
      catalogPalette: "minimal-arena",
      slug: "storelamon",
      publicSlug: "storelamon",
      description: "Tienda demo de ropa femenina, outfits urbanos y accesorios color rosa.",
      whatsappNumber: "+56912345678",
      instagramUrl: "https://instagram.com/storelamon",
      businessType: "Ropa y accesorios",
      currency: "CLP",
      catalogTemplate: CatalogTemplate.BOUTIQUE_PREMIUM,
      primaryColor: "#111827",
      secondaryColor: "#FDF2F8",
      accentColor: "#DB2777",
      backgroundColor: "#FFF7ED",
      textColor: "#111827",
      buttonRadius: 18,
      subscription: {
        create: {
          planId: premiumPlan.id,
          status: "active"
        }
      },
      aiSettings: {
        create: {
          tone: "vendedora cercana, moderna y clara",
          instructions: "Recomienda outfits completos, pregunta talla/color si falta información y no inventes stock ni precios."
        }
      }
    }
  });

  const sec = await prisma.business.upsert({
    where: { slug: "catg-seguridad" },
    update: {
      planId: premiumPlan.id,
      planType: PlanType.PREMIUM,
      publicSlug: "catg-seguridad",
      catalogPalette: "minimal-arena",
      catalogTemplate: CatalogTemplate.TECH_PRO,
      primaryColor: "#0F172A",
      secondaryColor: "#E0F2FE",
      accentColor: "#0284C7",
      backgroundColor: "#F8FAFC",
      textColor: "#0F172A",
      buttonRadius: 10
    },
    create: {
      ownerId: secOwner.id,
      planId: premiumPlan.id,
      planType: PlanType.PREMIUM,
      name: "CATG Seguridad",
      catalogPalette: "minimal-arena",
      slug: "catg-seguridad",
      publicSlug: "catg-seguridad",
      description: "Tienda demo de cámaras CCTV, seguridad para casas y locales.",
      whatsappNumber: "+56987654321",
      instagramUrl: "https://instagram.com/catgseguridad",
      businessType: "Seguridad electrónica",
      currency: "CLP",
      catalogTemplate: CatalogTemplate.TECH_PRO,
      primaryColor: "#0F172A",
      secondaryColor: "#E0F2FE",
      accentColor: "#0284C7",
      backgroundColor: "#F8FAFC",
      textColor: "#0F172A",
      buttonRadius: 10,
      subscription: {
        create: {
          planId: premiumPlan.id,
          status: "active"
        }
      },
      aiSettings: {
        create: {
          tone: "asesor técnico, directo y profesional",
          instructions: "Pregunta si es casa, local o bodega. Recomienda kits según cantidad de puntos a cubrir. No inventes instalación ni garantía."
        }
      }
    }
  });

  const moda = await prisma.category.upsert({
    where: { businessId_slug: { businessId: store.id, slug: "ropa" } },
    update: {},
    create: { businessId: store.id, name: "Ropa", slug: "ropa" }
  });

  const accesorios = await prisma.category.upsert({
    where: { businessId_slug: { businessId: store.id, slug: "accesorios" } },
    update: {},
    create: { businessId: store.id, name: "Accesorios", slug: "accesorios" }
  });

  const cctv = await prisma.category.upsert({
    where: { businessId_slug: { businessId: sec.id, slug: "cctv" } },
    update: {},
    create: { businessId: sec.id, name: "Kits CCTV", slug: "cctv" }
  });

  const install = await prisma.category.upsert({
    where: { businessId_slug: { businessId: sec.id, slug: "instalacion" } },
    update: {},
    create: { businessId: sec.id, name: "Instalación", slug: "instalacion" }
  });

  const products = [
    {
      businessId: store.id,
      categoryId: moda.id,
      name: "Polera Oversize Rosada",
      slug: "polera-oversize-rosada",
      sku: "STL-POL-ROS-M",
      description: "Polera oversize color rosado pastel, tela suave, ideal para outfit urbano.",
      price: 15990,
      compareAtPrice: 19990,
      discountPercent: 20,
      stock: 18,
      minStock: 5,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1200&auto=format&fit=crop",
      tags: "polera,oversize,rosa,urbano",
      featured: true
    },
    {
      businessId: store.id,
      categoryId: moda.id,
      name: "Jeans Cargo Wide Leg",
      slug: "jeans-cargo-wide-leg",
      sku: "STL-JEA-CAR-38",
      description: "Jeans cargo wide leg, calce cómodo, bolsillos laterales y estilo streetwear.",
      price: 28990,
      compareAtPrice: 32990,
      discountPercent: 10,
      stock: 9,
      minStock: 3,
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
      tags: "jeans,cargo,streetwear,outfit",
      featured: true
    },
    {
      businessId: store.id,
      categoryId: accesorios.id,
      name: "Cartera Mini Pink",
      slug: "cartera-mini-pink",
      sku: "STL-CAR-PNK",
      description: "Cartera pequeña color pink, correa ajustable, ideal para salida casual.",
      price: 12990,
      stock: 12,
      minStock: 4,
      imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=1200&auto=format&fit=crop",
      tags: "cartera,accesorio,pink,bolso",
      featured: false
    },
    {
      businessId: sec.id,
      categoryId: cctv.id,
      name: "Kit CCTV 4 Cámaras Full HD",
      slug: "kit-cctv-4-camaras-full-hd",
      sku: "CATG-CCTV-4HD",
      description: "Kit con 4 cámaras bala Full HD, DVR, visión nocturna y acceso por app móvil.",
      price: 89990,
      compareAtPrice: 109990,
      discountPercent: 15,
      stock: 7,
      minStock: 2,
      imageUrl: "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?q=80&w=1200&auto=format&fit=crop",
      tags: "camaras,cctv,seguridad,casa,negocio",
      featured: true
    },
    {
      businessId: sec.id,
      categoryId: cctv.id,
      name: "Kit CCTV 8 Cámaras Full HD",
      slug: "kit-cctv-8-camaras-full-hd",
      sku: "CATG-CCTV-8HD",
      description: "Kit de 8 cámaras Full HD para locales, bodegas o casas grandes. Incluye DVR y app móvil.",
      price: 159990,
      compareAtPrice: 189990,
      discountPercent: 10,
      stock: 4,
      minStock: 1,
      imageUrl: "https://images.unsplash.com/photo-1580894894513-541e068a3e2b?q=80&w=1200&auto=format&fit=crop",
      tags: "camaras,cctv,local,bodega,seguridad",
      featured: true
    },
    {
      businessId: sec.id,
      categoryId: install.id,
      name: "Instalación Básica CCTV",
      slug: "instalacion-basica-cctv",
      sku: "CATG-INST-BASIC",
      description: "Servicio demo de instalación básica para kit de cámaras. Precio referencial según distancia y cableado.",
      price: 49990,
      stock: 99,
      minStock: 0,
      imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop",
      tags: "instalacion,cctv,servicio,tecnico",
      featured: false
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { businessId_slug: { businessId: p.businessId, slug: p.slug } },
      update: p,
      create: p
    });
  }

  await prisma.subscription.upsert({
    where: { businessId: store.id },
    update: { planId: premiumPlan.id, status: "active" },
    create: { businessId: store.id, planId: premiumPlan.id, status: "active" }
  });
  await prisma.subscription.upsert({
    where: { businessId: sec.id },
    update: { planId: premiumPlan.id, status: "active" },
    create: { businessId: sec.id, planId: premiumPlan.id, status: "active" }
  });

  await prisma.membership.upsert({
    where: { userId_businessId: { userId: storeOwner.id, businessId: store.id } },
    update: { role: StoreRole.STORE_OWNER },
    create: { userId: storeOwner.id, businessId: store.id, role: StoreRole.STORE_OWNER }
  });
  await prisma.membership.upsert({
    where: { userId_businessId: { userId: secOwner.id, businessId: sec.id } },
    update: { role: StoreRole.STORE_OWNER },
    create: { userId: secOwner.id, businessId: sec.id, role: StoreRole.STORE_OWNER }
  });

  console.log("Seed listo. Usuarios demo: storelamon@demo.cl, seguridad@demo.cl, admin@demo.cl");
  if (demoPassword.generated) {
    console.log(`Contraseña demo temporal para entorno local: ${demoPassword.password}`);
  } else {
    console.log("Contraseña demo tomada desde DEMO_SEED_PASSWORD.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
