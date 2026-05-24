"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { ProductAiContext, StoreChatAskDetail } from "@/lib/catalog";

type ChatMessage = {
  role: "customer" | "ai";
  content: string;
};

type AskAiDetail =
  | string
  | {
      message: string;
      productId?: string;
      productContext?: ProductAiContext;
      autoSend?: boolean;
    };

type NormalizedAskAiDetail = StoreChatAskDetail;

type SendTextOptions = {
  productId?: string;
  productContext?: ProductAiContext;
  productErrorMessage?: string;
};

declare global {
  interface Window {
    __catgPendingStoreChatAsk?: NormalizedAskAiDetail;
  }
}

function makeVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getAskDetail(event: Event): NormalizedAskAiDetail | null {
  const detail = "detail" in event ? (event.detail as AskAiDetail) : null;
  if (typeof detail === "string") return { message: detail, autoSend: true };
  if (detail && typeof detail.message === "string") {
    return {
      message: detail.message,
      productId: detail.productId,
      productContext: detail.productContext,
      autoSend: detail.autoSend !== false
    };
  }
  return null;
}

export function StoreChat({
  businessSlug,
  accentColor = "#111827",
  buttonRadius = 18
}: {
  businessSlug: string;
  accentColor?: string;
  buttonRadius?: number;
}) {
  const storageKeys = useMemo(
    () => ({
      conversation: `catg:${businessSlug}:conversationId`,
      visitor: `catg:${businessSlug}:visitorId`
    }),
    [businessSlug]
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "¡Hola! Soy el asesor de la tienda. Cuéntame qué producto buscas y te ayudo a revisar opciones, precios y stock."
    }
  ]);
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductAiContext | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sendTextRef = useRef<(text: string, options?: SendTextOptions) => Promise<void>>(async () => {});

  useEffect(() => {
    const storedConversation = window.localStorage.getItem(storageKeys.conversation);
    const storedVisitor = window.localStorage.getItem(storageKeys.visitor) || makeVisitorId();
    window.localStorage.setItem(storageKeys.visitor, storedVisitor);
    setConversationId(storedConversation);
    setVisitorId(storedVisitor);
  }, [storageKeys]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendText = useCallback(
    async (text: string, options: SendTextOptions = {}) => {
      const { productContext, productErrorMessage = "No pude responder ahora. Intenta nuevamente." } = options;
      const productId = options.productId ?? productContext?.id;
      const customerText = text.trim();

      if (!customerText) {
        setErrorMessage("Escribe tu mensaje para consultar a la IA.");
        window.setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      if (loading) {
        setErrorMessage("Estoy terminando la consulta anterior. Intenta nuevamente en un momento.");
        return;
      }

      setInput("");
      if (productContext) setSelectedProduct(productContext);
      setErrorMessage(null);
      setMessages((prev) => [...prev, { role: "customer", content: customerText }]);
      setLoading(true);

      try {
        const res = await fetch("/api/ai/sales-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessSlug,
            message: customerText,
            phone: phone || undefined,
            conversationId: conversationId || undefined,
            visitorId: visitorId || undefined,
            productId: productId || undefined,
            productContext: productContext || undefined
          })
        });

        const data: { ok?: boolean; answer?: string; reply?: string; error?: string; conversationId?: string } =
          await res.json().catch(() => ({
            ok: false,
            error: productErrorMessage
          }));

        if (!res.ok || data.ok === false) throw new Error(data.error || productErrorMessage);

        if (data.conversationId) {
          window.localStorage.setItem(storageKeys.conversation, data.conversationId);
          setConversationId(data.conversationId);
        }

        setMessages((prev) => [
          ...prev,
          { role: "ai", content: data.answer ?? data.reply ?? "No pude generar una respuesta." }
        ]);
      } catch (error) {
        const message = productId
          ? "No pude consultar este producto ahora. Intenta nuevamente."
          : error instanceof Error
          ? error.message
          : productErrorMessage;
        setErrorMessage(message);
        setMessages((prev) => [...prev, { role: "ai", content: message }]);
      } finally {
        setLoading(false);
      }
    },
    [businessSlug, conversationId, loading, phone, storageKeys.conversation, visitorId]
  );

  useEffect(() => {
    sendTextRef.current = sendText;
  }, [sendText]);

  useEffect(() => {
    function askChat(detail: NormalizedAskAiDetail) {
      setSelectedProduct(detail.productContext ?? null);
      setInput(detail.message);
      document.getElementById("store-ai-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => inputRef.current?.focus(), 250);
      if (detail.autoSend) {
        sendTextRef.current(detail.message, {
          productId: detail.productId,
          productContext: detail.productContext,
          productErrorMessage: "No pude consultar este producto ahora. Intenta nuevamente."
        });
      }
    }

    function handleAskAi(event: Event) {
      const detail = getAskDetail(event);
      if (!detail) return;
      window.__catgPendingStoreChatAsk = undefined;
      askChat(detail);
    }

    window.addEventListener("storechat:ask", handleAskAi);
    if (window.__catgPendingStoreChatAsk) {
      const pending = window.__catgPendingStoreChatAsk;
      window.__catgPendingStoreChatAsk = undefined;
      window.setTimeout(() => askChat(pending), 0);
    }
    return () => window.removeEventListener("storechat:ask", handleAskAi);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendText(
      input,
      selectedProduct
        ? {
            productId: selectedProduct.id,
            productContext: selectedProduct
          }
        : undefined
    );
  }

  return (
    <div id="store-ai-chat" className="rounded-[var(--catalog-radius)] border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-black">Asesor de tienda</h3>
        <p className="text-sm text-gray-500">Pregunta por productos, precios y stock.</p>
      </div>
      <div className="min-h-[16rem] max-h-[32rem] space-y-3 overflow-y-auto rounded-[var(--catalog-radius)] bg-gray-50 p-3" ref={messageListRef}>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "customer"
                ? "ml-auto w-fit max-w-[90%] rounded-[var(--catalog-radius)] p-3 text-sm text-white"
                : "w-fit max-w-[90%] rounded-[var(--catalog-radius)] bg-white p-3 text-sm text-gray-800 shadow-sm"
            }
            style={
              message.role === "customer"
                ? { backgroundColor: accentColor, borderRadius: buttonRadius }
                : { borderRadius: buttonRadius }
            }
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <div className="max-w-[85%] rounded-[var(--catalog-radius)] bg-white p-3 text-sm text-gray-500 shadow-sm">
            Consultando IA...
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3" noValidate aria-label="Formulario de chat con la tienda">
        <div>
          <label htmlFor="store-ai-message" className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-gray-400">
            Mensaje para la IA
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="store-ai-message"
              ref={inputRef}
              type="text"
              name="message"
              aria-label="Mensaje para la IA"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (selectedProduct) setSelectedProduct(null);
                if (errorMessage === "Escribe tu mensaje para consultar a la IA.") setErrorMessage(null);
              }}
              placeholder="Ej: ¿tienen stock de la polera rosada?"
              className="min-w-0 flex-1 rounded-[var(--catalog-radius)] border border-black/10 px-4 py-3 text-sm"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Enviar mensaje al asesor"
              className="w-full rounded-[var(--catalog-radius)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              style={{ backgroundColor: accentColor, borderRadius: buttonRadius }}
            >
              {loading ? "Consultando..." : "Enviar"}
            </button>
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-gray-400">WhatsApp opcional</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                inputRef.current?.focus();
              }
            }}
            placeholder="Ej: +56 9 1234 5678"
            className="w-full rounded-[var(--catalog-radius)] border border-black/10 px-4 py-2 text-sm"
          />
        </label>
      </form>
      {errorMessage && <p className="mt-3 text-sm font-semibold text-red-600">{errorMessage}</p>}
    </div>
  );
}
