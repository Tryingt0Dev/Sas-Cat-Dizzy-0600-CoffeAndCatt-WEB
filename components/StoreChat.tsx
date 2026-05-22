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
      content: "Hola. Soy el asistente de ventas. Preguntame por productos, stock o recomendaciones."
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
      if (!customerText || loading) return;

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
      if (detail.autoSend) {
        sendText(detail.message, detail.productId, "No pude consultar este producto ahora. Intenta nuevamente.").catch(() => {
          setErrorMessage("No pude consultar este producto ahora. Intenta nuevamente.");
          setLoading(false);
        });
      }
    }

    window.addEventListener("storechat:ask", handleAskAi);
    return () => window.removeEventListener("storechat:ask", handleAskAi);
  }, [sendText]);

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
        <h3 className="text-lg font-black">Vendedor IA</h3>
        <p className="text-sm text-gray-500">Responde solo con datos de esta tienda.</p>
      </div>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Tu WhatsApp opcional"
        className="mb-3 w-full rounded-[var(--catalog-radius)] border border-black/10 px-4 py-2 text-sm"
      />
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
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2" noValidate>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: busco una opcion para mi negocio"
          className="min-w-0 flex-1 rounded-[var(--catalog-radius)] border border-black/10 px-4 py-3 text-sm"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-[var(--catalog-radius)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: accentColor, borderRadius: buttonRadius }}
        >
          {loading ? "Consultando..." : "Enviar"}
        </button>
      </form>
      {errorMessage && <p className="mt-3 text-sm font-semibold text-red-600">{errorMessage}</p>}
    </div>
  );
}
