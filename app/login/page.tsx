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
        <p className="mt-2 text-sm text-gray-500">Accede al panel de tu tienda.</p>
        {resolvedSearchParams?.error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{resolvedSearchParams.error}</div>}
        <form action={loginAction} className="mt-6 space-y-4">
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Contraseña" required />
          <button className="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white">Entrar</button>
        </form>
        <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-bold text-gray-900">Demo rápida</p>
          <p>storelamon@demo.cl / Demo1234!</p>
          <p>seguridad@demo.cl / Demo1234!</p>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          ¿No tienes cuenta? <Link className="font-bold text-black" href="/register">Crear tienda</Link>
        </p>
      </Card>
    </main>
  );
}
