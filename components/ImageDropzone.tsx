"use client";

import { useRef, useState, type DragEvent } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageDropzone({
  name,
  businessId,
  label,
  initialUrl = "",
  maxSizeMb = 5
}: {
  name: string;
  businessId: string;
  label: string;
  initialUrl?: string | null;
  maxSizeMb?: number;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function uploadFile(file: File) {
    setError(null);
    setMessage(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Formato no permitido. Usa JPG, PNG o WEBP.");
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`La imagen supera el maximo de ${maxSizeMb}MB.`);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("businessId", businessId);

      const res = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData
      });
      const data: { ok?: boolean; url?: string; error?: string } = await res.json();
      if (!res.ok || !data.ok || !data.url) throw new Error(data.error || "No se pudo subir la imagen");
      setUrl(data.url);
      setMessage("Imagen subida correctamente");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={url} />
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={
          dragging
            ? "rounded-2xl border-2 border-dashed border-[var(--app-primary)] bg-[var(--app-surface-muted)] p-4"
            : "rounded-2xl border-2 border-dashed border-[var(--app-border)] bg-[var(--app-surface)] p-4"
        }
      >
        <div className="grid gap-4 sm:grid-cols-[112px_1fr] sm:items-center">
          <div className="h-28 w-full overflow-hidden rounded-2xl bg-[var(--app-surface-muted)] sm:w-28">
            {url ? (
              <img src={url} alt={label} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-bold text-[var(--app-text-muted)]">Sin imagen</div>
            )}
          </div>
          <div>
            <p className="text-sm font-black text-[var(--app-text)]">{label}</p>
            <p className="mt-1 text-xs text-[var(--app-text-muted)]">Arrastra una imagen o selecciona desde tu computador. JPG, PNG o WEBP hasta {maxSizeMb}MB.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => inputRef.current?.click()}
                className="rounded-2xl bg-[var(--app-primary)] px-4 py-2 text-sm font-bold text-[var(--app-button-text)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Subiendo imagen..." : "Seleccionar imagen"}
              </button>
              {url && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl("");
                    setMessage("Imagen eliminada del formulario");
                    setError(null);
                  }}
                  className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-2 text-sm font-bold text-[var(--app-text)]"
                >
                  Borrar imagen
                </button>
              )}
            </div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />
      </div>
      <input
        type="text"
        value={url}
        onChange={(event) => {
          const nextUrl = event.target.value;
          setUrl(nextUrl);
          setMessage(null);
          setError(nextUrl.toLowerCase().split("?")[0].endsWith(".svg") ? "SVG no esta permitido por seguridad." : null);
        }}
        placeholder="O pega una URL de imagen"
        className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm shadow-sm focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-ring)]"
      />
      {message && <p className="text-sm font-semibold text-[var(--app-success)]">{message}</p>}
      {error && <p className="text-sm font-semibold text-[var(--app-danger)]">{error}</p>}
    </div>
  );
}
