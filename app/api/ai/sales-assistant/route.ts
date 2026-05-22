import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deepseek, hasDeepSeekKey } from "@/lib/ai";
import { ConversationStatus, CustomerStatus, ProductStatus } from "@/lib/enums";
import { aiRequestSchema, aiResponseSchema, type AiResponsePayload } from "@/lib/validation";
import { assertRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { formatCLP, getFinalPrice } from "@/lib/format";
import { searchRelevantProducts, type RelevantProduct } from "@/services/product-search";

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function demoReply(products: Awaited<ReturnType<typeof searchRelevantProducts>>, fallbackMessage: string) {
  if (products.length === 0) {
    return `${fallbackMessage} En modo demo no encontre productos activos relacionados en este catalogo.`;
  }

  const productLines = products
    .slice(0, 3)
    .map((product) => `${product.name}: ${formatCLP(product.finalPrice)}${product.stock <= 0 ? " (sin stock disponible)" : ` (stock ${product.stock})`}`)
    .join("; ");

  return `Modo demo sin API key activa. Del catalogo real puedo sugerirte: ${productLines}. Si quieres, dime presupuesto o uso y te ayudo a elegir.`;
}

function toRelevantProduct(product: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPercent: number;
  stock: number;
  tags: string | null;
  category: { name: string } | null;
}): RelevantProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    discountPercent: product.discountPercent,
    finalPrice: getFinalPrice(product.price, product.discountPercent),
    stock: product.stock,
    category: product.category?.name ?? null,
    tags: product.tags
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedRequest = aiRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json({ ok: false, error: "Solicitud invalida" }, { status: 400 });
    }

    const { businessSlug, customerMessage, customerPhone, conversationId, visitorId, productId } = parsedRequest.data;
    const ip = await getClientIp();
    try {
      assertRateLimit(`ai:${businessSlug}:${ip}`, 30, 10 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ ok: false, error: error.message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
      }
      throw error;
    }

    const business = await prisma.business.findFirst({
      where: { slug: businessSlug, isActive: true },
      include: { aiSettings: true, plan: true }
    });

    if (!business) {
      return NextResponse.json({ ok: false, error: "Tienda no encontrada" }, { status: 404 });
    }

    const settings = business.aiSettings;
    let focusedProduct: RelevantProduct | null = null;
    if (productId) {
      const product = await prisma.product.findFirst({
        where: { id: productId, businessId: business.id, status: ProductStatus.ACTIVE },
        include: { category: true }
      });
      if (!product) {
        return NextResponse.json({ ok: false, error: "Producto no encontrado en esta tienda" }, { status: 404 });
      }
      focusedProduct = toRelevantProduct(product);
    }

    const searchedProducts = await searchRelevantProducts(business.id, customerMessage, focusedProduct ? 7 : 8);
    const relevantProducts = focusedProduct
      ? [focusedProduct, ...searchedProducts.filter((product) => product.id !== focusedProduct?.id)]
      : searchedProducts;

    let customer =
      settings?.allowAutoLead === false
        ? null
        : customerPhone
          ? await prisma.customer.findFirst({ where: { businessId: business.id, phone: customerPhone } })
          : null;

    if (!customer && settings?.allowAutoLead !== false) {
      customer = await prisma.customer.create({
        data: {
          businessId: business.id,
          phone: customerPhone || null,
          source: "webchat",
          status: CustomerStatus.NEW
        }
      });
    }

    let conversation = null;
    if (conversationId) {
      const existingConversation = await prisma.conversation.findFirst({
        where: { id: conversationId, businessId: business.id },
        select: { id: true, businessId: true, customerId: true, status: true }
      });
      if (
        existingConversation &&
        existingConversation.status !== ConversationStatus.CLOSED &&
        existingConversation.status !== ConversationStatus.ARCHIVED
      ) {
        conversation = existingConversation;
      }
    }

    if (!conversation && visitorId) {
      conversation = await prisma.conversation.findFirst({
        where: {
          businessId: business.id,
          visitorId,
          status: { in: [ConversationStatus.OPEN, ConversationStatus.WAITING_HUMAN] }
        },
        orderBy: { updatedAt: "desc" },
        select: { id: true, businessId: true, customerId: true, status: true }
      });
    }

    if (!conversation) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthlyLimit = business.plan?.maxAiConversationsMonthly ?? 100;
      const usedThisMonth = await prisma.conversation.count({
        where: { businessId: business.id, channel: "WEBCHAT", createdAt: { gte: monthStart } }
      });
      if (usedThisMonth >= monthlyLimit) {
        return NextResponse.json({ ok: false, error: "Limite mensual de conversaciones IA alcanzado para este plan" }, { status: 402 });
      }

      conversation = await prisma.conversation.create({
        data: {
          businessId: business.id,
          customerId: customer?.id ?? null,
          visitorId: visitorId || null,
          channel: "WEBCHAT",
          status: ConversationStatus.OPEN,
          lastMessageAt: new Date()
        },
        select: { id: true, businessId: true, customerId: true, status: true }
      });
    } else if (customer && !conversation.customerId) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { customerId: customer.id },
        select: { id: true, businessId: true, customerId: true, status: true }
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "CUSTOMER",
        content: customerMessage,
        metadata: JSON.stringify({ customerPhone: customerPhone || null, visitorId: visitorId || null, productId: productId || null })
      }
    });

    const recentMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    const chronologicalMessages = recentMessages.reverse();

    const catalogContext = relevantProducts
      .map(
        (p, index) =>
          `${index + 1}. ID: ${p.id} | ${p.name} | Categoria: ${p.category ?? "Sin categoria"} | Precio final: ${formatCLP(p.finalPrice)} | Descuento: ${p.discountPercent}% | Stock: ${p.stock} | Descripcion: ${p.description ?? "Sin descripcion"} | Tags: ${p.tags ?? ""}`
      )
      .join("\n");

    let aiResult: AiResponsePayload = {
      reply: demoReply(relevantProducts, settings?.fallbackMessage ?? "No tengo esa informacion exacta."),
      intent: "unknown",
      lead_score: 0,
      customer_status: CustomerStatus.NEW,
      recommended_product_ids: focusedProduct ? [focusedProduct.id] : [],
      next_action: settings?.humanHandoffEnabled === false ? "ask_more" : "human_handoff"
    };

    if (hasDeepSeekKey()) {
      const systemPrompt = `
Eres el vendedor IA de la tienda "${business.name}".

Reglas obligatorias:
- Usa solo informacion de esta tienda.
- Usa solo el catalogo entregado por el backend, ya filtrado por businessId.
- Nunca inventes productos, precios, stock, descuentos, garantias, despacho ni tiempos de entrega.
- Si falta informacion, pregunta.
- Si no sabes, usa el fallback.
- allowAutoLead: ${settings?.allowAutoLead !== false ? "true" : "false"}.
- humanHandoffEnabled: ${settings?.humanHandoffEnabled !== false ? "true" : "false"}.
- Producto consultado explicitamente: ${focusedProduct ? `${focusedProduct.name} (${focusedProduct.id})` : "ninguno"}.

Tono:
${settings?.tone ?? "profesional y claro"}

Instrucciones especiales:
${settings?.instructions ?? "Sin instrucciones especiales"}

Fallback:
${settings?.fallbackMessage ?? "No tengo esa informacion exacta. Te puedo derivar con una persona."}

Devuelve SOLO JSON valido:
{
  "reply": "respuesta final para el cliente",
  "intent": "general_question | product_interest | purchase_interest | support | unknown",
  "lead_score": 0,
  "customer_status": "NEW | INTERESTED | QUOTE_SENT | PAYMENT_PENDING | WON | LOST | FOLLOW_UP",
  "recommended_product_ids": [],
  "next_action": "answer | ask_more | suggest_quote | human_handoff"
}
`;

      const history = chronologicalMessages
        .map((message) => `${message.senderType === "AI" ? "Asistente" : "Cliente"}: ${message.content}`)
        .join("\n");

      const userPrompt = `
Historial reciente:
${history}

Productos disponibles de ESTA tienda:
${catalogContext || "No hay productos activos relacionados encontrados."}
`;

      const completion = await deepseek.chat.completions.create({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.25
      });

      const raw = completion.choices[0]?.message?.content || "";
      const parsedAi = aiResponseSchema.safeParse(safeJsonParse(raw));
      if (parsedAi.success) {
        aiResult = parsedAi.data;
      } else {
        aiResult.reply = settings?.fallbackMessage ?? aiResult.reply;
      }
    }

    const allowedProductIds = new Set(relevantProducts.map((product) => product.id));
    aiResult.recommended_product_ids = aiResult.recommended_product_ids.filter((id) => allowedProductIds.has(id));
    if (aiResult.next_action === "human_handoff" && settings?.humanHandoffEnabled === false) {
      aiResult.next_action = "ask_more";
    }

    if (customer) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          status: aiResult.customer_status,
          leadScore: aiResult.lead_score,
          notes: `Ultima intencion IA: ${aiResult.intent}`
        }
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "AI",
        content: aiResult.reply,
        metadata: JSON.stringify({
          intent: aiResult.intent,
          lead_score: aiResult.lead_score,
          recommended_product_ids: aiResult.recommended_product_ids,
          next_action: aiResult.next_action,
          products_consulted_count: relevantProducts.length
        })
      }
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: aiResult.next_action === "human_handoff" ? ConversationStatus.WAITING_HUMAN : ConversationStatus.OPEN,
        lastMessageAt: new Date()
      }
    });

    if (relevantProducts.length > 0) {
      await prisma.product.updateMany({
        where: { businessId: business.id, id: { in: relevantProducts.map((product) => product.id) } },
        data: { aiConsultCount: { increment: 1 } }
      });
    }

    return NextResponse.json({
      ok: true,
      reply: aiResult.reply,
      conversationId: conversation.id,
      intent: aiResult.intent,
      lead_score: aiResult.lead_score,
      next_action: aiResult.next_action,
      products_consulted_count: relevantProducts.length
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("AI sales-assistant error", error);
    }
    return NextResponse.json({ ok: false, error: "No pude responder ahora. Intenta nuevamente en unos segundos." }, { status: 500 });
  }
}
