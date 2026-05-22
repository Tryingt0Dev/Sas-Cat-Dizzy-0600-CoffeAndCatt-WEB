import Link from "next/link";
import { Card } from "@/components/Card";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4f3,transparent_30%),#f8fafc]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-pink-500">CATG</p>
          <h1 className="text-xl font-black">OmniVentas SaaS</h1>
        </div>
        <div className="flex gap-3">
          <Link className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold" href="/login">Entrar</Link>
          <Link className="rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white" href="/register">Crear tienda</Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-pink-600 shadow-sm">Catálogo + IA + CRM para tiendas</p>
          <h2 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Crea tiendas con vendedor IA separado para cada cliente.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-gray-600">
            Cada negocio tiene sus productos, descuentos, clientes, conversaciones y configuración IA aislados por tienda. La IA nunca consulta información de otra tienda.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-2xl bg-black px-6 py-3 font-bold text-white" href="/register">Crear mi primera tienda</Link>
            <Link className="rounded-2xl border border-gray-200 bg-white px-6 py-3 font-bold" href="/store/storelamon">Ver demo STORELAMON</Link>
            <Link className="rounded-2xl border border-gray-200 bg-white px-6 py-3 font-bold" href="/store/catg-seguridad">Ver demo Seguridad</Link>
          </div>
        </div>
        <Card className="space-y-4">
          {[
            ["Multi-tienda real", "Cada tienda tiene businessId, slug y datos separados."],
            ["Gestión intuitiva", "Productos, stock, categorías, descuentos, clientes y ajustes."],
            ["IA controlada", "El backend solo le pasa a DeepSeek datos de la tienda activa."],
            ["Listo para escalar", "Luego migras SQLite a Supabase/PostgreSQL y conectas WhatsApp."]
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl bg-gray-50 p-5">
              <h3 className="font-black">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </Card>
      </section>
    </main>
  );
}
