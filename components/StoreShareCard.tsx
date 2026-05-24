"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function StoreShareCard({
  businessName,
  storePath
}: {
  businessName: string;
  storePath: string;
}) {
  const [shareUrl, setShareUrl] = useState(storePath);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const absoluteUrl = new URL(storePath, window.location.origin).toString();
    setShareUrl(absoluteUrl);
    QRCode.toDataURL(absoluteUrl, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    })
      .then(setQrDataUrl)
      .catch(() => setStatus("No se pudo generar el QR"));
  }, [storePath]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Link copiado");
      window.setTimeout(() => setStatus(null), 1800);
    } catch {
      setStatus("No se pudo copiar el link");
    }
  }

  async function shareStore() {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: businessName,
        text: `Hola, revisa nuestro catálogo aquí: ${shareUrl}`,
        url: shareUrl
      });
      setStatus("Catalogo compartido");
    } catch {
      setStatus(null);
    }
  }

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(`Hola, revisa nuestro catálogo aquí: ${shareUrl}`)}`;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Comparte tu tienda</p>
          <h2 className="mt-2 text-xl font-black">Link y QR del catalogo</h2>
          <p className="mt-1 text-sm text-gray-500">Ideal para Instagram, WhatsApp, vitrinas, tarjetas y campañas.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 grid-cols-1 md:grid-cols-[minmax(0,220px)_1fr] md:items-center">
        <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-3">
          {qrDataUrl ? <img src={qrDataUrl} alt={`QR del catalogo de ${businessName}`} className="h-full w-full" /> : <span className="text-sm font-bold text-gray-400">Generando QR...</span>}
        </div>

        <div className="min-w-0">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-gray-400" htmlFor="store-share-url">
            URL publica
          </label>
          <input
            id="store-share-url"
            value={shareUrl}
            readOnly
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copyLink} className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white">
              Copiar link
            </button>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700">
              Abrir catálogo
            </a>
            <button type="button" onClick={shareStore} className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700">
              Compartir
            </button>
            <a href={whatsappShareHref} target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700">
              WhatsApp
            </a>
            {qrDataUrl && (
              <a href={qrDataUrl} download={`qr-${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`} className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700">
                Descargar QR
              </a>
            )}
          </div>
          {status && <p className="mt-3 text-sm font-bold text-emerald-700">{status}</p>}
        </div>
      </div>
    </section>
  );
}
