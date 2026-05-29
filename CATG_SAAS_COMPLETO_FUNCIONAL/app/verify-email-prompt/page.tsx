"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";

export default function VerifyEmailPromptPage() {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleResend() {
    setIsResending(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage("Email enviado correctamente. Revisa tu bandeja de entrada.");
      } else {
        setMessage(data.error || "Error al reenviar el email.");
      }
    } catch {
      setMessage("Error al reenviar. Intenta de nuevo.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="max-w-md">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <span className="text-2xl">✉️</span>
        </div>
        <h1 className="text-2xl font-bold">Verifica tu correo</h1>
        <p className="mt-3 text-sm text-gray-600">
          Necesitamos verificar tu correo antes de que puedas acceder a tu cuenta. Revisa tu bandeja de entrada para el enlace de verificación.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            {isResending ? "Reenviando..." : "Reenviar verificación"}
          </button>
          <Link href="/login" className="rounded-lg bg-gray-200 px-4 py-2 text-center font-bold text-gray-800">
            Cambiar correo
          </Link>
        </div>
        {message && <p className="mt-4 text-sm text-blue-600">{message}</p>}
        <p className="mt-4 text-xs text-gray-500">Si no recibes el email, revisa la carpeta de spam o intenta reenviar en 1 minuto.</p>
      </Card>
    </div>
  );
}
