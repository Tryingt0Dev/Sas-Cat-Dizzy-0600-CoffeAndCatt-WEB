"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const STORAGE_KEY = "catg_email_verified_at";
const POLL_INTERVAL_MS = 3000;
const CHANNEL_NAME = "catg_email_verification";

function VerifyEmailPromptContent() {
  const searchParams = useSearchParams();
  const emailSent = searchParams?.get("sent") === "1";
  const emailError = searchParams?.get("emailError") === "1";

  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState("");
  const [infoMessage] = useState(
    emailError
      ? "Tu cuenta fue creada, pero no pudimos enviar el correo de verificacion. Intenta reenviarlo."
      : emailSent
        ? "Te enviamos un correo de verificacion. Revisa tu bandeja de entrada y haz clic en el enlace."
        : ""
  );
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const redirectToNextStep = useCallback(() => {
    router.replace("/onboarding/theme");
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      try {
        const res = await fetch("/api/auth/email-verification-status");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.verified) {
          redirectToNextStep();
        }
      } catch {
        // network error, retry on next poll
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkStatus();
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [redirectToNextStep]);

  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current.onmessage = (event) => {
        if (event.data?.type === "email_verified") {
          redirectToNextStep();
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    return () => {
      if (channelRef.current) channelRef.current.close();
    };
  }, [redirectToNextStep]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY && event.newValue) {
        redirectToNextStep();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [redirectToNextStep]);

  async function handleResend() {
    setIsResending(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(
          data.dev
            ? "En desarrollo, el link de verificacion aparece en la terminal del servidor."
            : "Email enviado correctamente. Revisa tu bandeja de entrada."
        );
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
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-gray-900">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <span className="text-2xl">&#9993;&#65039;</span>
        </div>
        <h1 className="text-2xl font-bold">Verifica tu correo</h1>
        <p className="mt-3 text-sm text-gray-600">
          Necesitamos verificar tu correo antes de que puedas acceder a tu cuenta. Revisa tu bandeja de entrada para el enlace de verificacion.
        </p>

        {infoMessage && (
          <p className={`mt-3 text-sm font-medium ${emailError ? "text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3" : "text-green-700 bg-green-50 border border-green-200 rounded-lg p-3"}`}>
            {infoMessage}
          </p>
        )}

        {checking && !infoMessage && (
          <p className="mt-3 text-sm text-blue-600 font-medium">
            Esperando verificacion... Esta pagina avanzara automaticamente cuando confirmes tu correo.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isResending ? "Reenviando..." : "Reenviar verificacion"}
          </button>
          <Link href="/login" className="rounded-lg bg-gray-200 px-4 py-2 text-center font-bold text-gray-800 hover:bg-gray-300 transition-colors">
            Cambiar correo
          </Link>
        </div>
        {message && <p className="mt-4 text-sm text-blue-600">{message}</p>}
        <p className="mt-4 text-xs text-gray-500">
          Si no recibes el email, revisa la carpeta de spam o intenta reenviar en 1 minuto.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPromptPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Cargando...</p></div>}>
      <VerifyEmailPromptContent />
    </Suspense>
  );
}
