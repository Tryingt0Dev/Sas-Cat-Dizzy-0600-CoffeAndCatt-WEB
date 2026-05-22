"use client";

import { useState } from "react";

export function AskAiButton({
  productId,
  question,
  className
}: {
  productId: string;
  question: string;
  className: string;
}) {
  const [clicked, setClicked] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setClicked(true);
        window.dispatchEvent(
          new CustomEvent("storechat:ask", {
            detail: {
              message: question,
              productId,
              autoSend: true
            }
          })
        );
        document.getElementById("store-ai-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => setClicked(false), 1400);
      }}
    >
      {clicked ? "Consultando IA..." : "Consultar IA"}
    </button>
  );
}
