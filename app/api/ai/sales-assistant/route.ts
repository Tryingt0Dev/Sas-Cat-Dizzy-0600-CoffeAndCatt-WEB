import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deepseek, hasDeepSeekKey } from "@/lib/ai";
import { ConversationStatus, CustomerStatus, ProductStatus } from "@/lib/enums";
import { aiRequestSchema, aiResponseSchema, type AiResponsePayload } from "@/lib/validation";
import { assertRateLimit, getClientIp, rateLimitKey, RateLimitError } from "@/lib/rate-limit";
import { requestHasAllowedOrigin } from "@/lib/request-security";
import { formatCLP, getFinalPrice } from "@/lib/format";
import { parseJsonSafely } from "@/lib/safe-json";
import { PlanAccessError, canUseAI, effectivePlanLimits } from "@/services/plan-guard";
import { analyzeProductQuery, type ProductSearchAnalysis, type RelevantProduct } from "@/services/product-search";

type ActiveConversation = {
  id: string;
  businessId: string;
  customerId: string | null;
  status: string;
};

function formatStockForCustomer(stock: number) {
  if (stock <= 0) return "por ahora aparece sin stock";
  if (stock <= 3) return `queda poco stock (${stock} disponible${stock === 1 ? "" : "s"})`;
  return `hay stock disponible (${stock})`;
}

function productLine(product: RelevantProduct) {
  const sku = product.sku ? ` SKU ${product.sku}.` : " SKU N/D.";
  const description = product.description ? ` ${product.description.slice(0, 120)}` : "";
  const compareAtPrice =
    product.compareAtPrice && product.compareAtPrice > product.finalPrice ? ` Antes ${formatCLP(product.compareAtPrice)}.` : "";
  const discount = product.discountPercent > 0 ? ` Descuento ${product.discountPercent}%.` : "";
  return `${product.name}.${sku} Precio ${formatCLP(product.finalPrice)}.${compareAtPrice}${discount} ${formatStockForCustomer(product.stock)}.${description}`;
}

function focusedProductReply(product: RelevantProduct, customerPhone?: string | null) {
  const availability =
    product.stock > 0
      ? `Sí, ${product.name} aparece disponible con ${product.stock} unidad${product.stock === 1 ? "" : "es"}.`
      : `${product.name} aparece sin stock por ahora.`;
  const sku = product.sku || "N/D";
  const compareAtPrice =
    product.compareAtPrice && product.compareAtPrice > product.finalPrice ? ` Antes estaba a ${formatCLP(product.compareAtPrice)}.` : "";
  const discount = product.discountPercent > 0 ? ` Tiene ${product.discountPercent}% de descuento aplicado.` : "";
  const description = product.description ? ` Detalle: ${product.description.slice(0, 220)}` : " No tengo una descripción adicional cargada para este producto.";
  const recommendation =
    product.stock > 0
      ? " Mi recomendación es reservarlo o confirmar por WhatsApp si necesitas instalación, despacho o una característica específica."
      : " Puedo ayudarte a revisar alternativas similares disponibles en el catálogo.";
  const whatsapp = customerPhone
    ? ` Con el WhatsApp ${customerPhone} puedo dejar esta consulta lista para seguimiento.`
    : " Si quieres, también puedo ayudarte a preparar el mensaje para WhatsApp.";

  return `${availability} SKU ${sku}. Precio actual ${formatCLP(product.finalPrice)}.${compareAtPrice}${discount}${description}${recommendation}${whatsapp}`;
}

function joinList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

function unavailableVariantLabel(analysis: ProductSearchAnalysis) {
  const colors = joinList(analysis.unavailableColors);
  if (!colors) return "esa variedad";
  if (analysis.requestedProductLabel) return `${analysis.requestedProductLabel} en color ${colors}`;
  return `productos en color ${colors}`;
}

function demoReply(products: RelevantProduct[], fallbackMessage: string, analysis?: ProductSearchAnalysis) {
  if (analysis?.hasUnavailableRequestedVariant) {
    const requestedVariant = unavailableVariantLabel(analysis);
    const suggestions = products.slice(0, 3);

    if (suggestions.length === 0) {
      return `Por ahora no veo ${requestedVariant} en el catalogo. Si quieres, te ayudo a buscar otra alternativa disponible o puedo derivarte a WhatsApp para confirmar opciones especiales.`;
    }

    const suggestionLines = suggestions.map((product) => `- ${productLine(product)}`).join("\n");
    return `Por ahora no veo ${requestedVariant} en el catalogo. Lo mas cercano que tengo disponible es:\n${suggestionLines}\n\n¿Te sirve alguna de estas opciones o prefieres que busquemos otro color o estilo?`;
  }

  if (analysis && !analysis.hasCatalogMatches && analysis.tokens.length > 0) {
    const suggestions = products.slice(0, 3);
    const requested = analysis.requestedProductLabel ?? "esa busqueda";

    if (suggestions.length === 0) {
      return `Por ahora no encuentro ${requested} en el catalogo. Cuéntame un poco más qué buscas y revisamos una alternativa disponible.`;
    }

    const suggestionLines = suggestions.map((product) => `- ${productLine(product)}`).join("\n");
    return `Por ahora no encuentro ${requested} exacto en el catalogo. Estas opciones sí están disponibles:\n${suggestionLines}\n\n¿Te sirve alguna o buscamos otra alternativa?`;
  }

  const productsForReply = analysis?.exactMatches.length ? analysis.exactMatches : products;

  if (productsForReply.length === 0) {
    return `${fallbackMessage} Si me cuentas que tipo de producto buscas, presupuesto o estilo, te ayudo a revisar las opciones disponibles del catalogo.`;
  }

  const selectedProducts = productsForReply.slice(0, 3);
  if (selectedProducts.length === 1) {
    const product = selectedProducts[0];
    return `¡Sí! En el catalogo tengo ${productLine(product)} ¿Quieres que te ayude a confirmar si te sirve o prefieres que te sugiera otra alternativa similar?`;
  }

  const productSuggestions = selectedProducts.map((product) => `- ${productLine(product)}`).join("\n");
  return `¡Claro! Te puedo ayudar con eso. Estas son las mejores opciones que veo ahora en el catalogo:\n${productSuggestions}\n\n¿Cuál te gusta más o qué estilo/precio tienes en mente?`;
}

function formatAvailabilityContext(analysis: ProductSearchAnalysis) {
  const exactNames = analysis.exactMatches.map((product) => product.name).join(", ") || "Sin coincidencia exacta";
  const alternatives = analysis.alternatives.map((product) => product.name).join(", ") || "Sin alternativas directas";
  return `
Analisis de disponibilidad del catalogo:
- Producto solicitado: ${analysis.requestedProductLabel ?? "No especificado"}
- Colores solicitados: ${analysis.requestedColors.join(", ") || "No especificados"}
- Colores/variantes no disponibles: ${analysis.unavailableColors.join(", ") || "Ninguno detectado"}
- Coincidencias exactas: ${exactNames}
- Alternativas permitidas: ${alternatives}

Reglas de verdad del catalogo:
- Si hay colores o variedades no disponibles, dilo claramente primero.
- No presentes una alternativa como si fuera la variante exacta solicitada.
- Si no existe una polera azul, di que no se encuentra esa polera en azul y luego recomienda opciones reales.
`;
}

function mentionsInternalDetails(reply: string) {
  const forbiddenPatterns = [
    /\bapi\b/i,
    /api\s*key/i,
    /modo\s*demo/i,
    /deepseek/i,
    /openai/i,
    /backend/i,
    /base\s+de\s+datos/i,
    /\bjson\b/i,
    /prompt/i,
    /modelo\s+de\s+ia/i,
    /configuraci[oó]n\s+interna/i
  ];

  return forbiddenPatterns.some((pattern) => pattern.test(reply));
}

function buildCustomerNotes(existingNotes: string | null, intent: string) {
  const aiLine = `Ultima intencion IA: ${intent}`;
  if (!existingNotes) return aiLine;

  const preservedNotes = existingNotes
    .split("\n")
    .filter((line) => !line.startsWith("Ultima intencion IA:"))
    .join("\n")
    .trim();

  return preservedNotes ? `${preservedNotes}\n${aiLine}` : aiLine;
}

function toRelevantProduct(product: {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  stock: number;
  tags: string | null;
  category: { name: string } | null;
}): RelevantProduct {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    discountPercent: product.discountPercent,
    finalPrice: getFinalPrice(product.price, product.discountPercent),
    stock: product.stock,
    category: product.category?.name ?? null,
    tags: product.tags
  };
}

export async function POST(req: Request) {
  try {
    // SECURITY: Verify origin for mutating AI endpoint
    if (!requestHasAllowedOrigin(req)) {
      return NextResponse.json({ ok: false, error: "Origen no permitido" }, { status: 403 });
    }

    const body = await req.json();
    const parsedRequest = aiRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return NextResponse.json({ ok: false, error: "Solicitud invalida" }, { status: 400 });
    }

    const { businessSlug, customerMessage, customerPhone, conversationId, visitorId, productId, productContext } = parsedRequest.data;
    const business = await prisma.business.findFirst({
      where: { publicSlug: businessSlug, isActive: true },
      include: { aiSettings: true, plan: true, owner: true }
    });

    if (!business) {
      return NextResponse.json({ ok: false, error: "Tienda no encontrada" }, { status: 404 });
    }

    try {
      await canUseAI(business.id);
    } catch (error) {
      if (error instanceof PlanAccessError) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 402 });
      }
      throw error;
    }

    const ip = await getClientIp(req);
    try {
      await assertRateLimit(rateLimitKey({ endpoint: "ai:sales-assistant", businessId: business.id, ip }), 30, 10 * 60 * 1000);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ ok: false, error: error.message, retryAfterSeconds: error.retryAfterSeconds }, { status: 429 });
      }
      throw error;
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

    const searchAnalysis = await analyzeProductQuery(business.id, customerMessage, focusedProduct ? 7 : 8);
    const searchedProducts = searchAnalysis.exactMatches.length > 0 ? searchAnalysis.exactMatches : searchAnalysis.recommendedProducts;
    const relevantProducts = focusedProduct
      ? [focusedProduct, ...searchedProducts.filter((product) => product.id !== focusedProduct?.id)]
      : searchedProducts;

    let conversation: ActiveConversation | null = null;
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

    let customer =
      settings?.allowAutoLead === false
        ? null
        : conversation?.customerId
          ? await prisma.customer.findFirst({ where: { id: conversation.customerId, businessId: business.id } })
          : customerPhone
            ? await prisma.customer.findFirst({ where: { businessId: business.id, phone: customerPhone } })
            : null;

    if (!conversation) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthlyLimit = effectivePlanLimits(business.plan, business.owner).maxAiConversationsMonthly ?? 100;
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
    }

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

    if (customer && !conversation.customerId) {
      await prisma.conversation.updateMany({
        where: { id: conversation.id, businessId: business.id },
        data: { customerId: customer.id }
      });
      conversation = { ...conversation, customerId: customer.id };
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "CUSTOMER",
        content: customerMessage,
        metadata: JSON.stringify({
          customerPhone: customerPhone || null,
          visitorId: visitorId || null,
          productId: productId || null,
          productContext: productContext
            ? {
                id: productContext.id,
                name: productContext.name,
                sku: productContext.sku,
                price: productContext.price,
                finalPrice: productContext.finalPrice,
                stock: productContext.stock
              }
            : null
        })
      }
    });

    const recentMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id, conversation: { businessId: business.id } },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    const chronologicalMessages = recentMessages.reverse();

    const catalogContext = relevantProducts
      .map(
        (p, index) =>
          `${index + 1}. ID: ${p.id} | ${p.name} | SKU: ${p.sku ?? "N/D"} | Categoria: ${p.category ?? "Sin categoria"} | Precio lista: ${formatCLP(p.price)} | Precio final: ${formatCLP(p.finalPrice)} | Precio anterior: ${p.compareAtPrice ? formatCLP(p.compareAtPrice) : "N/D"} | Descuento: ${p.discountPercent}% | Stock: ${p.stock} | Descripcion: ${p.description ?? "Sin descripcion"} | Tags: ${p.tags ?? ""}`
      )
      .join("\n");

    let aiResult: AiResponsePayload = {
      reply: focusedProduct
        ? focusedProductReply(focusedProduct, customerPhone)
        : demoReply(relevantProducts, settings?.fallbackMessage ?? "No tengo esa informacion exacta.", searchAnalysis),
      intent: focusedProduct ? "product_interest" : "unknown",
      lead_score: focusedProduct ? 60 : 0,
      customer_status: focusedProduct ? CustomerStatus.INTERESTED : CustomerStatus.NEW,
      recommended_product_ids: focusedProduct ? [focusedProduct.id] : [],
      next_action: settings?.humanHandoffEnabled === false ? "ask_more" : "human_handoff"
    };

    if (hasDeepSeekKey()) {
      const systemPrompt = `
Eres un vendedor profesional y amigable de la tienda "${business.name}". Tu objetivo es ayudar a los clientes a encontrar exactamente lo que necesitan.

INSTRUCCIONES CLAVE:
1. Sé conversacional, cálido y entusiasta - como un vendedor real hablando con un cliente
2. Usa solo información del catálogo disponible en este mensaje
3. NUNCA inventes productos, precios, stock, descuentos, garantías o tiempos de entrega
4. Si un cliente pregunta algo que no sabes, pregunta más para entender su necesidad
5. Sugiere productos de forma natural, no como una lista fría
6. Haz preguntas de seguimiento para entender mejor qué busca el cliente
7. Si algo no está en el catálogo, sé honesto: "No tengo ese modelo en este momento"
8. Nunca menciones API, API key, modo demo, backend, base de datos, sistema, prompt, JSON, modelo de IA ni configuración interna.
9. No digas que eres una IA. Habla como asesor/vendedor de la tienda.
10. Si no puedes confirmar algo, ofrece derivar a WhatsApp o a una persona del equipo.
11. Si el análisis indica que no existe una variante, talla, color o producto solicitado, dilo primero y luego ofrece alternativas reales del catálogo.
12. No conviertas alternativas en coincidencias exactas. Ejemplo: si piden polera azul y solo hay rosada, di que azul no está disponible y ofrece la rosada como alternativa.

ATRIBUTOS DE VENTA:
- Sé empático y comprensivo
- Escucha activamente lo que el cliente busca
- Recomienda productos basado en necesidad real, no en cantidad
- Sé breve pero informativo en cada respuesta

Tu nombre es: Asesor de ventas de ${business.name}
Tono: ${settings?.tone ?? "amigable, profesional y servicial"}

${settings?.instructions ? `Instrucciones especiales del negocio:\n${settings?.instructions}` : ""}

Devuelve SOLO JSON válido, SIN explicaciones:
{
  "reply": "Tu respuesta amigable como vendedor real",
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

${formatAvailabilityContext(searchAnalysis)}
`;

      try {
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
        const parsedAi = aiResponseSchema.safeParse(parseJsonSafely(raw));
        if (parsedAi.success) {
          aiResult = parsedAi.data;
        } else {
          aiResult.reply = focusedProduct
            ? focusedProductReply(focusedProduct, customerPhone)
            : demoReply(relevantProducts, settings?.fallbackMessage ?? "No tengo esa informacion exacta.", searchAnalysis);
          aiResult.intent = focusedProduct ? "product_interest" : "general_question";
        }
      } catch {
        aiResult.reply = focusedProduct
          ? focusedProductReply(focusedProduct, customerPhone)
          : demoReply(relevantProducts, settings?.fallbackMessage ?? "No tengo esa informacion exacta.", searchAnalysis);
        aiResult.intent = focusedProduct ? "product_interest" : "general_question";
        aiResult.lead_score = focusedProduct ? 60 : 35;
        aiResult.customer_status = focusedProduct ? CustomerStatus.INTERESTED : CustomerStatus.NEW;
        aiResult.next_action = settings?.humanHandoffEnabled === false ? "ask_more" : "human_handoff";
      }
    }

    const allowedProductIds = new Set(relevantProducts.map((product) => product.id));
    aiResult.recommended_product_ids = aiResult.recommended_product_ids.filter((id) => allowedProductIds.has(id));
    if (aiResult.next_action === "human_handoff" && settings?.humanHandoffEnabled === false) {
      aiResult.next_action = "ask_more";
    }
    if (searchAnalysis.hasUnavailableRequestedVariant) {
      aiResult.reply = demoReply(relevantProducts, settings?.fallbackMessage ?? "No tengo esa informacion exacta.", searchAnalysis);
      aiResult.intent = "product_interest";
      aiResult.lead_score = Math.max(aiResult.lead_score, 45);
      aiResult.customer_status = CustomerStatus.INTERESTED;
      aiResult.recommended_product_ids = relevantProducts.slice(0, 3).map((product) => product.id);
      aiResult.next_action = settings?.humanHandoffEnabled === false ? "ask_more" : "human_handoff";
    }
    if (mentionsInternalDetails(aiResult.reply)) {
      aiResult.reply = focusedProduct
        ? focusedProductReply(focusedProduct, customerPhone)
        : demoReply(relevantProducts, settings?.fallbackMessage ?? "No tengo esa informacion exacta.", searchAnalysis);
      aiResult.intent = focusedProduct ? "product_interest" : "general_question";
    }

    if (customer) {
      await prisma.customer.updateMany({
        where: { id: customer.id, businessId: business.id },
        data: {
          status: aiResult.customer_status,
          leadScore: aiResult.lead_score,
          notes: buildCustomerNotes(customer.notes, aiResult.intent)
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

    await prisma.conversation.updateMany({
      where: { id: conversation.id, businessId: business.id },
      data: {
        status: aiResult.next_action === "human_handoff" ? ConversationStatus.WAITING_HUMAN : ConversationStatus.OPEN,
        lastMessageAt: new Date()
      }
    });

    const consultedProductIds = aiResult.recommended_product_ids.length > 0
      ? aiResult.recommended_product_ids
      : focusedProduct
        ? [focusedProduct.id]
        : searchAnalysis.exactMatches.map((product) => product.id);

    if (consultedProductIds.length > 0) {
      await prisma.product.updateMany({
        where: { businessId: business.id, id: { in: consultedProductIds } },
        data: { aiConsultCount: { increment: 1 } }
      });
    }

    return NextResponse.json({
      ok: true,
      answer: aiResult.reply,
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
