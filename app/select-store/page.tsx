import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { AuthenticationError, getAccessibleBusinesses } from "@/services/authorization";
import { planDisplayName } from "@/services/plan-guard";
import { selectStoreAction } from "./actions";

export default async function SelectStorePage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; next?: string } | undefined>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  let businesses: Awaited<ReturnType<typeof getAccessibleBusinesses>>;
  try {
    businesses = await getAccessibleBusinesses();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect("/login");
    throw error;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Contexto"
          title="Selecciona una tienda"
          description="El dashboard opera siempre sobre una tienda validada para evitar acciones accidentales entre negocios."
        />
        {resolvedSearchParams?.error && (
          <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{resolvedSearchParams.error}</div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {businesses.map((business) => (
            <Card key={business.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">/{business.publicSlug}</p>
                  <h2 className="mt-1 text-xl font-black">{business.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{planDisplayName(business.plan, business.owner)}</p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-700">
                  {business.isActive ? "Activa" : "Suspendida"}
                </span>
              </div>
              <form action={selectStoreAction} className="mt-5">
                <input type="hidden" name="businessId" value={business.id} />
                <input type="hidden" name="next" value={resolvedSearchParams?.next ?? "/dashboard"} />
                <button className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-black text-white">
                  Operar esta tienda
                </button>
              </form>
            </Card>
          ))}
        </div>

        {businesses.length === 0 && (
          <Card>
            <p className="text-sm text-gray-500">No tienes tiendas activas asociadas.</p>
            <Link href="/login" className="mt-4 inline-flex rounded-2xl bg-black px-4 py-2 text-sm font-black text-white">
              Volver al login
            </Link>
          </Card>
        )}
      </div>
    </main>
  );
}
