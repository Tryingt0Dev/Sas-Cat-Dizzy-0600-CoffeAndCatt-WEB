import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { StatusAlert } from "@/components/StatusAlert";
import { createCategoryAction, deleteCategoryAction } from "./actions";

export default async function CategoriesPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { business } = await requireStoreAccess({ permission: "manage_categories" });
  const categories = await prisma.category.findMany({
    where: { businessId: business.id },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" }
  });

  return (
    <div>
      <PageHeader eyebrow="Catálogo" title="Categorías" description="Ordena productos para que tus clientes encuentren rápido lo que buscan." />
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <h2 className="text-xl font-black">Nueva categoría</h2>
          <form action={createCategoryAction} className="mt-5 space-y-3">
            <Input name="name" placeholder="Ej: Poleras, Cámaras, Servicios" required />
            <button className="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white">Crear categoría</button>
          </form>
        </Card>
        <Card>
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="font-black">{category.name}</p>
                  <p className="text-sm text-gray-500">{category._count.products} productos</p>
                </div>
                <form action={deleteCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <button className="text-sm font-bold text-red-600">Eliminar</button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
