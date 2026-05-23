"use client";

import { useState } from "react";

type AskAiStatus = "idle" | "sending" | "missing-chat";

export function AskAiButton({
  productId,
  question,
  className
}: {
  productId: string;
  question: string;
  className: string;
}) {
  const [status, setStatus] = useState<AskAiStatus>("idle");

  function resetSoon() {
    window.setTimeout(() => setStatus("idle"), 1600);
  }

  return (
    <button
      type="button"
      className={className}
      disabled={status === "sending"}
      onClick={() => {
        const chat = document.getElementById("store-ai-chat");
        if (!chat) {
          setStatus("missing-chat");
          resetSoon();
          return;
        }

        setStatus("sending");
        window.dispatchEvent(
          new CustomEvent("storechat:ask", {
            detail: {
              message: question,
              productId,
              autoSend: true
            }
          })
        );
        chat.scrollIntoView({ behavior: "smooth", block: "start" });
        resetSoon();
      }}
    >
      {status === "missing-chat" ? "Chat no disponible" : status === "sending" ? "Consultando IA..." : "Consultar IA"}
    </button>
  );
}
