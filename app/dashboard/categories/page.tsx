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
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--app-primary)]">Nueva categoría</p>
              <h2 className="mt-2 text-xl font-black text-[var(--app-text)]">Crea una etiqueta rápida</h2>
            </div>
            <HelpTooltip description="Crea una etiqueta para agrupar productos similares y mejorar la navegación de tu catálogo." />
          </div>
          <p className="mt-3 text-sm text-[var(--app-text-muted)]">Usa nombres claros como Poleras, Electrónica o Servicios.</p>
          <form action={createCategoryAction} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-[var(--app-text)]">
              Nombre de categoría
              <span className="mt-1 block text-xs text-[var(--app-text-muted)]">Ej: Poleras, Cámaras, Servicios.</span>
              <Input name="name" placeholder="Nombre de la categoría" required />
            </label>
            <button className="w-full rounded-2xl bg-[var(--app-primary)] px-4 py-3 text-sm font-bold text-[var(--app-button-text)] transition duration-200 hover:bg-[var(--app-primary-hover)]">Crear categoría</button>
          </form>
        </Card>
        <Card>
          {categories.length === 0 ? (
            <EmptyState
              title="Aún no hay categorías"
              description="Crea categorías para organizar tus productos y facilitar la búsqueda en tu tienda."
              action={<LearningLink href="/dashboard/learning#productos">Aprender a crear categorías</LearningLink>}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--app-text)]">{categories.length} categorías</p>
                  <p className="text-xs text-[var(--app-text-muted)]">Gestiona la organización del catálogo desde aquí.</p>
                </div>
                <LearningLink href="/dashboard/learning#productos" className="text-xs font-black">
                  Ver guía
                </LearningLink>
              </div>
              <div className="grid gap-3">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-3xl bg-[var(--app-surface-muted)] p-4">
                    <div>
                      <p className="font-black text-[var(--app-text)]">{category.name}</p>
                      <p className="mt-1 text-xs text-[var(--app-text-muted)]">{category._count.products} productos</p>
                    </div>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <ConfirmSubmitButton message={`¿Eliminar la categoría ${category.name}?`} className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white">
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
