"use client";

import { useState } from "react";
import { buildProductAiQuestion, type ProductAiContext, type StoreChatAskDetail } from "@/lib/catalog";

type AskAiStatus = "idle" | "sending" | "missing-chat";

declare global {
  interface Window {
    __catgPendingStoreChatAsk?: StoreChatAskDetail;
  }
}

function dispatchAskEvent(detail: StoreChatAskDetail) {
  window.__catgPendingStoreChatAsk = detail;

  if (typeof window.CustomEvent === "function") {
    window.dispatchEvent(new window.CustomEvent("storechat:ask", { detail }));
    return;
  }

  const event = document.createEvent("CustomEvent");
  event.initCustomEvent("storechat:ask", false, false, detail);
  window.dispatchEvent(event);
}

export function AskAiButton({
  productId,
  productContext,
  question,
  className
}: {
  productId: string;
  productContext: ProductAiContext;
  question?: string;
  className: string;
}) {
  const [status, setStatus] = useState<AskAiStatus>("idle");
  const message = question ?? buildProductAiQuestion(productContext);

  function resetSoon() {
    window.setTimeout(() => setStatus("idle"), 1600);
  }

  return (
    <button
      type="button"
      className={className}
      disabled={status === "sending"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const chat = document.getElementById("store-ai-chat");
        if (!chat) {
          setStatus("missing-chat");
          resetSoon();
          return;
        }

        setStatus("sending");
        dispatchAskEvent({
          message,
          productId,
          productContext,
          autoSend: true
        });
        chat.scrollIntoView({ behavior: "smooth", block: "start" });
        resetSoon();
      }}
    >
      {status === "missing-chat" ? "Chat no disponible" : status === "sending" ? "Consultando IA..." : "Consultar IA"}
    </button>
  );
}
