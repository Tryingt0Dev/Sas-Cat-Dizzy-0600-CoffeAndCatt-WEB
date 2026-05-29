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
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--app-primary)]">Nueva categoria</p>
              <h2 className="mt-1 text-lg font-black text-[var(--app-text)]">Crea una etiqueta rapida</h2>
            </div>
            <HelpTooltip description="Crea una etiqueta para agrupar productos similares y mejorar la navegacion de tu catalogo." />
          </div>
          <p className="mt-2 text-xs text-[var(--app-text-muted)]">Usa nombres claros como Poleras, Electronica o Servicios.</p>
          <form action={createCategoryAction} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold text-[var(--app-text)]">Nombre de categoria</span>
              <span className="mt-0.5 block text-[0.65rem] text-[var(--app-text-muted)]">Ej: Poleras, Camaras, Servicios.</span>
              <Input name="name" placeholder="Nombre de la categoria" required className="mt-1" />
            </label>
            <button className="w-full rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-xs font-bold text-[var(--app-button-text)] transition duration-200 hover:bg-[var(--app-primary-hover)]">Crear categoria</button>
          </form>
        </Card>
        <Card className="p-4">
          {categories.length === 0 ? (
            <EmptyState
              title="Aun no hay categorias"
              description="Crea categorias para organizar tus productos y facilitar la busqueda en tu tienda."
              action={<LearningLink href="/dashboard/learning#productos">Aprender a crear categorias</LearningLink>}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[var(--app-text)]">{categories.length} categorias</p>
                  <p className="text-xs text-[var(--app-text-muted)]">Gestiona la organizacion del catalogo desde aqui.</p>
                </div>
                <LearningLink href="/dashboard/learning#productos" className="text-xs font-black">Ver guia</LearningLink>
              </div>
              <div className="divide-y divide-[var(--app-border)] rounded-xl border border-[var(--app-border)]">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--app-text)]">{category.name}</p>
                      <p className="text-[0.65rem] text-[var(--app-text-muted)]">{category._count.products} productos</p>
                    </div>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={category.id} />
                      <ConfirmSubmitButton message={`¿Eliminar la categoria ${category.name}?`} className="rounded-lg bg-red-50 px-3 py-1.5 text-[0.7rem] font-bold text-red-600 transition hover:bg-red-100">
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
