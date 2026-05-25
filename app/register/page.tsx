import Link from "next/link";
import { registerAction } from "@/app/(auth)/actions";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { RegisterCredentialsFields } from "@/components/RegisterCredentialsFields";
import { getStoreTypeOptions } from "@/lib/store-types";

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-2xl">
        <h1 className="text-3xl font-black">Crear tienda</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">Crea una cuenta segura y una tienda aislada para publicar tu catálogo, atender consultas y trabajar sin mezclar datos con otros negocios.</p>
        {resolvedSearchParams?.error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{resolvedSearchParams.error}</div>}
        <form action={registerAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-gray-900">
            Tu nombre
            <span className="mt-1 block text-xs text-gray-500">Nombre de la persona que administrará la tienda.</span>
            <Input name="name" placeholder="Tu nombre" autoComplete="name" required />
          </label>
          <RegisterCredentialsFields />
          <label className="block text-sm font-semibold text-gray-900">
            Nombre de la tienda
            <span className="mt-1 block text-xs text-gray-500">Nombre público que verán tus clientes.</span>
            <Input name="businessName" placeholder="Nombre de la tienda" required />
          </label>
          <label className="md:col-span-2 block text-sm font-semibold text-gray-900">
            Tipo de tienda
            <span className="mt-1 block text-xs text-gray-500">Selecciona el giro que mejor describe tu negocio.</span>
            <select name="businessType" className="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-black focus:outline-none">
              <option value="">Elige un tipo de tienda</option>
              {getStoreTypeOptions().map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button className="md:col-span-2 rounded-2xl bg-black px-4 py-3 font-bold text-white">Crear tienda y entrar</button>
        </form>
        <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
          El correo debe ser único. Dejaremos preparada la verificación por email para activarla cuando exista proveedor de correo configurado.
        </div>
        <p className="mt-6 text-sm text-gray-500">
          ¿Ya tienes cuenta? <Link className="font-bold text-black" href="/login">Entrar</Link>
        </p>
      </Card>
    </main>
  );
}
