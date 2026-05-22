import Link from "next/link";
import { registerAction } from "@/app/(auth)/actions";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-xl">
        <h1 className="text-3xl font-black">Crear tienda</h1>
        <p className="mt-2 text-sm text-gray-500">Crea un negocio aislado con su propio catálogo e IA.</p>
        {resolvedSearchParams?.error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{resolvedSearchParams.error}</div>}
        <form action={registerAction} className="mt-6 grid gap-4 md:grid-cols-2">
          <Input name="name" placeholder="Tu nombre" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Contraseña mínimo 8 caracteres" required />
          <Input name="businessName" placeholder="Nombre de la tienda" required />
          <Input name="businessType" placeholder="Tipo: ropa, seguridad, comida..." className="md:col-span-2" />
          <button className="md:col-span-2 rounded-2xl bg-black px-4 py-3 font-bold text-white">Crear tienda y entrar</button>
        </form>
        <p className="mt-6 text-sm text-gray-500">
          ¿Ya tienes cuenta? <Link className="font-bold text-black" href="/login">Entrar</Link>
        </p>
      </Card>
    </main>
  );
}
