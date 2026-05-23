"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

type ChatMessage = {
  role: "customer" | "ai";
  content: string;
};

type AskAiDetail =
  | string
  | {
      message: string;
      productId?: string;
      autoSend?: boolean;
    };

function makeVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getAskDetail(event: Event): { message: string; productId?: string; autoSend: boolean } | null {
  if (!(event instanceof CustomEvent)) return null;
  const detail = event.detail as AskAiDetail;
  if (typeof detail === "string") return { message: detail, autoSend: true };
  if (detail && typeof detail.message === "string") {
    return { message: detail.message, productId: detail.productId, autoSend: detail.autoSend !== false };
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
      content: "¡Hola! Soy el asesor de la tienda. Cuéntame qué producto buscas y te ayudo a revisar opciones, precios y stock."
    }
  ]);
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    async (text: string, productId?: string, productErrorMessage = "No pude responder ahora. Intenta nuevamente.") => {
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
            productId: productId || undefined
          })
        });

        const data: { ok?: boolean; reply?: string; error?: string; conversationId?: string } = await res.json().catch(() => ({
          ok: false,
          error: productErrorMessage
        }));

        if (!res.ok || data.ok === false) throw new Error(data.error || productErrorMessage);

        if (data.conversationId) {
          window.localStorage.setItem(storageKeys.conversation, data.conversationId);
          setConversationId(data.conversationId);
        }

        setMessages((prev) => [...prev, { role: "ai", content: data.reply ?? "No pude generar una respuesta." }]);
      } catch (error) {
        const message = productId ? "No pude consultar este producto ahora. Intenta nuevamente." : error instanceof Error ? error.message : productErrorMessage;
        setErrorMessage(message);
        setMessages((prev) => [...prev, { role: "ai", content: message }]);
      } finally {
        setLoading(false);
      }
    },
    [businessSlug, conversationId, loading, phone, storageKeys.conversation, visitorId]
  );

  useEffect(() => {
    function handleAskAi(event: Event) {
      const detail = getAskDetail(event);
      if (!detail) return;

      setInput(detail.message);
      document.getElementById("store-ai-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => inputRef.current?.focus(), 250);
      if (loading) {
        setErrorMessage("Estoy terminando la consulta anterior. Intenta nuevamente en un momento.");
        return;
      }
      if (detail.autoSend) {
        sendText(detail.message, detail.productId, "No pude consultar este producto ahora. Intenta nuevamente.").catch(() => {
          setErrorMessage("No pude consultar este producto ahora. Intenta nuevamente.");
          setLoading(false);
        });
      }
    }

    window.addEventListener("storechat:ask", handleAskAi);
    return () => window.removeEventListener("storechat:ask", handleAskAi);
  }, [loading, sendText]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendText(input).catch(() => {
      setErrorMessage("Error al enviar mensaje. Intenta nuevamente.");
      setLoading(false);
    });
  }

  return (
    <div id="store-ai-chat" className="rounded-[var(--catalog-radius)] border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-lg font-black">Asesor de tienda</h3>
        <p className="text-sm text-gray-500">Pregunta por productos, precios y stock.</p>
      </div>
      <div className="h-80 space-y-3 overflow-y-auto rounded-[var(--catalog-radius)] bg-gray-50 p-3" ref={messageListRef}>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "customer"
                ? "ml-auto max-w-[85%] rounded-[var(--catalog-radius)] p-3 text-sm text-white"
                : "max-w-[85%] rounded-[var(--catalog-radius)] bg-white p-3 text-sm text-gray-800 shadow-sm"
            }
            style={message.role === "customer" ? { backgroundColor: accentColor, borderRadius: buttonRadius } : { borderRadius: buttonRadius }}
          >
            {message.content}
          </div>
        ))}
        {loading && <div className="max-w-[85%] rounded-[var(--catalog-radius)] bg-white p-3 text-sm text-gray-500 shadow-sm">Consultando IA...</div>}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3" noValidate>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-gray-400">Mensaje para la IA</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (errorMessage === "Escribe tu mensaje para consultar a la IA.") setErrorMessage(null);
              }}
              placeholder="Ej: ¿tienen stock de la polera rosada?"
              className="min-w-0 flex-1 rounded-[var(--catalog-radius)] border border-black/10 px-4 py-3 text-sm"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[var(--catalog-radius)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              style={{ backgroundColor: accentColor, borderRadius: buttonRadius }}
            >
              {loading ? "Consultando..." : "Enviar"}
            </button>
          </div>
        </label>
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
