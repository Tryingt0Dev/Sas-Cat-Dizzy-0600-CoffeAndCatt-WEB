import Link from "next/link";
import { registerAction } from "@/app/(auth)/actions";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { RegisterFormClient } from "./RegisterFormClient";

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileEnabled =
    process.env.TURNSTILE_ENABLED === "true" ||
    (process.env.TURNSTILE_ENABLED !== "false" && process.env.TURNSTILE_DISABLED !== "1" && process.env.NODE_ENV === "production");
  const showTurnstile = turnstileEnabled && Boolean(turnstileSiteKey);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-gray-900">
        <h1 className="text-3xl font-black">Crear tienda</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">Crea una cuenta segura y una tienda aislada para publicar tu catálogo, atender consultas y trabajar sin mezclar datos con otros negocios.</p>
        {resolvedSearchParams?.error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{resolvedSearchParams.error}</div>}

        <form action={registerAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <RegisterFormClient />

          <input type="hidden" name="turnstile_token" id="turnstile_token" value="" />
          {showTurnstile ? (
            <div className="md:col-span-2">
              <TurnstileWidget
                siteKey={turnstileSiteKey!}
                inputId="turnstile_token"
              />
            </div>
          ) : turnstileEnabled ? (
            <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              Turnstile está habilitado pero NEXT_PUBLIC_TURNSTILE_SITE_KEY no está configurado. El captcha no se renderizará.
            </div>
          ) : null}
          <button type="submit" className="md:col-span-2 rounded-2xl bg-black px-4 py-3 font-bold text-white hover:bg-gray-800 transition-colors">
            Crear tienda y entrar
          </button>
        </form>

        <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
          El correo debe ser único. Dejaremos preparada la verificación por email para activarla cuando exista proveedor de correo configurado.
        </div>
        <p className="mt-6 text-sm text-gray-500">
          ¿Ya tienes cuenta? <Link className="font-bold text-black" href="/login">Entrar</Link>
        </p>
      </div>
    </main>
  );
}
