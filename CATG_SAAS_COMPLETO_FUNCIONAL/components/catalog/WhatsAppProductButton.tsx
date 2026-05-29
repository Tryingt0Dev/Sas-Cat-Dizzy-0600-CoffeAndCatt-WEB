"use client";

import { useState } from "react";

function cleanWhatsappNumber(value: string | null) {
  const digits = value?.replace(/[^\d]/g, "") ?? "";
  if (digits.length < 8) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("56")) return digits;
  if (digits.length === 10 && digits.startsWith("09")) return `56${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith("9")) return `56${digits}`;
  return digits;
}

function buildWhatsappHref(cleanNumber: string, message: string) {
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppProductButton({
  whatsappNumber,
  businessSlug,
  businessName,
  productId,
  productName,
  formattedPrice,
  storePath,
  className,
  disabledClassName
}: {
  whatsappNumber: string | null;
  businessSlug?: string;
  businessName: string;
  productId?: string;
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

  const initialMessage = `Hola, vi en ${businessName} el producto ${productName} por ${formattedPrice}. ¿Está disponible? ${storePath}`;
  const whatsappHref = buildWhatsappHref(cleanNumber, initialMessage);

  return (
    <a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(event) => {
        const productUrl = new URL(storePath, window.location.origin).toString();
        const message = `Hola, vi en ${businessName} el producto ${productName} por ${formattedPrice}. ¿Está disponible? ${productUrl}`;
        event.currentTarget.href = buildWhatsappHref(cleanNumber, message);
        setOpening(true);
        if (businessSlug && productId) {
          void fetch("/api/catalog/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessSlug,
              productId,
              event: "whatsapp_click"
            }),
            keepalive: true
          }).catch(() => undefined);
        }
        window.setTimeout(() => setOpening(false), 1200);
      }}
    >
      {opening ? "Abriendo WhatsApp..." : "Hablar al WhatsApp"}
    </a>
  );
}
