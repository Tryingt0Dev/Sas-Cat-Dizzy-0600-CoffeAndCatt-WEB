"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "catg_email_verified_at";
const CHANNEL_NAME = "catg_email_verification";

export function EmailVerifiedSignal() {
  const router = useRouter();

  useEffect(() => {
    // Emitir senal cross-tab para que verify-email-prompt detecte la verificacion
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // localStorage no disponible
    }

    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: "email_verified" });
      channel.close();
    } catch {
      // BroadcastChannel no soportado
    }

    // Redirigir al siguiente paso
    router.replace("/onboarding/theme");
  }, [router]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-gray-900 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mx-auto">
        <span className="text-2xl">&#10003;</span>
      </div>
      <h1 className="text-2xl font-bold text-emerald-700">Correo verificado</h1>
      <p className="mt-2 text-sm text-gray-600">Tu correo ha sido verificado correctamente. Redirigiendo...</p>
    </div>
  );
}
