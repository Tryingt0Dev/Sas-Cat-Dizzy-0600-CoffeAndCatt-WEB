import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-black">Entrar</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">Accede al panel de tu tienda con el correo registrado. Tus datos se mantienen separados por tienda.</p>
        {resolvedSearchParams?.error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{resolvedSearchParams.error}</div>}
        <form action={loginAction} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-gray-900">
            Correo
            <Input name="email" type="email" placeholder="tu@correo.com" autoComplete="email" required />
          </label>
          <label className="block text-sm font-semibold text-gray-900">
            Contraseña
            <Input name="password" type="password" placeholder="Contraseña" autoComplete="current-password" required />
          </label>
          <button className="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white">Entrar</button>
        </form>
        <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
          Usa las credenciales locales definidas por seed o por el script seguro de administradores. No se muestran contraseñas en esta pantalla.
        </div>
        <p className="mt-6 text-sm text-gray-500">
          ¿No tienes cuenta? <Link className="font-bold text-black" href="/register">Crear tienda</Link>
        </p>
      </Card>
    </main>
  );
}
