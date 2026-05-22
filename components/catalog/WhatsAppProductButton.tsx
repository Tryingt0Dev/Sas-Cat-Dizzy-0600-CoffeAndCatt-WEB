"use client";

import { useState } from "react";

function cleanWhatsappNumber(value: string | null) {
  return value?.replace(/[^\d]/g, "") ?? "";
}

export function WhatsAppProductButton({
  whatsappNumber,
  businessName,
  productName,
  formattedPrice,
  storePath,
  className,
  disabledClassName
}: {
  whatsappNumber: string | null;
  businessName: string;
  productName: string;
  formattedPrice: string;
  storePath: string;
  className: string;
  disabledClassName: string;
}) {
  const [opening, setOpening] = useState(false);
  const cleanNumber = cleanWhatsappNumber(whatsappNumber);

  if (!cleanNumber) {
    return <span className={disabledClassName}>WhatsApp no configurado</span>;
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        setOpening(true);
        const productUrl = new URL(storePath, window.location.origin).toString();
        const message = `Hola, vi en ${businessName} el producto ${productName} por ${formattedPrice}. ¿Está disponible? ${productUrl}`;
        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
        window.setTimeout(() => setOpening(false), 1200);
      }}
    >
      {opening ? "Abriendo WhatsApp..." : "Hablar al WhatsApp"}
    </button>
  );
}
