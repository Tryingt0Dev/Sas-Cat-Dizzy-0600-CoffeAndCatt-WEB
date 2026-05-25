import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { EmptyState } from "@/components/EmptyState";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Input } from "@/components/Input";
import { LearningLink } from "@/components/LearningLink";
import { PageHeader } from "@/components/PageHeader";
import { SectionGuide } from "@/components/SectionGuide";
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
      <SectionGuide
        eyebrow="Organiza"
        title="Categorías claras para un catálogo fácil de navegar"
        description="Agrupa productos principales y usa nombres que tus clientes entiendan al instante."
        help="Una buena organización acelera las búsquedas y mejora la experiencia del cliente al navegar tu catálogo." 
        actions={<LearningLink href="/dashboard/learning#productos">Ver guía de categorías</LearningLink>}
      />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">Nueva categoría</h2>
            <HelpTooltip description="Crea una etiqueta para agrupar productos similares y facilitar la búsqueda en el catálogo." />
          </div>
          <p className="mt-1 text-sm text-gray-500">Usa nombres simples como Poleras, Electrónica o Servicios.</p>
          <form action={createCategoryAction} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-gray-900">
              Nombre de categoría
              <span className="mt-1 block text-xs text-gray-500">Ej: Poleras, Cámaras, Servicios.</span>
              <Input name="name" placeholder="Nombre de la categoría" required />
            </label>
            <button className="w-full rounded-2xl bg-black px-4 py-3 font-bold text-white">Crear categoría</button>
          </form>
        </Card>
        <Card>
          {categories.length === 0 ? (
            <EmptyState
              title="Aún no hay categorías"
              description="Crea categorías para organizar tus productos y mejorar la búsqueda de los clientes en el catálogo." 
              action={<LearningLink href="/dashboard/learning#productos">Aprender a crear categorías</LearningLink>}
            />
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                  <div>
                    <p className="font-black">{category.name}</p>
                    <p className="text-sm text-gray-500">{category._count.products} productos</p>
                  </div>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={category.id} />
                    <ConfirmSubmitButton message={`¿Eliminar la categoría ${category.name}?`} className="text-sm font-bold text-red-600">
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
