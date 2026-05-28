"use client";

import { useState } from "react";
import { DrawerForm } from "@/components/DrawerForm";
import { FormSection } from "@/components/FormSection";
import { ImageDropzone } from "@/components/ImageDropzone";
import { Input, Select, Textarea } from "@/components/Input";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ProductAttributesFields } from "@/components/ProductAttributesFields";
import { ProductStatus } from "@/lib/enums";
import type { ProductAttributeField } from "@/lib/store-types";
import { createCategoryFromProductAction, createProductAction } from "./actions";

type ProductCategoryOption = {
  id: string;
  name: string;
};

export function ProductCreateDrawer({
  businessId,
  categories,
  dynamicFields,
  disabled = false,
  defaultCategoryId = "",
  initialOpen = false
}: {
  businessId: string;
  categories: ProductCategoryOption[];
  dynamicFields: ProductAttributeField[];
  disabled?: boolean;
  defaultCategoryId?: string;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[var(--app-primary)] px-3 py-2 text-xs font-black text-[var(--app-button-text)] shadow-sm transition duration-200 hover:bg-[var(--app-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Crear producto
      </button>

      <DrawerForm
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo producto"
        description="Completa solo los datos básicos. Las opciones avanzadas son opcionales."
        size="lg"
      >
        <div className="space-y-4">
          <FormSection
            title="Categoría rápida"
            description="Si no existe una categoría adecuada, créala aquí y quedará seleccionada al volver al formulario."
            className="p-3"
          >
            <form action={createCategoryFromProductAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input name="name" placeholder="Ej: Poleras, Repuestos, Servicios" className="py-2" />
              <PendingSubmitButton className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-black text-[var(--app-text)] transition duration-200 hover:bg-[var(--app-surface-muted)]">
                Crear categoría
              </PendingSubmitButton>
            </form>
          </FormSection>

          <form action={createProductAction} className="space-y-4">
            <FormSection title="Datos básicos" className="p-3">
              <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_130px_110px]">
                <label className="block">
                  <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Nombre</span>
                  <Input name="name" placeholder="Ej: Polera azul de algodón" required className="mt-1 py-2" />
                </label>
                <label className="block">
                  <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Precio</span>
                  <Input name="price" type="number" min={0} placeholder="0" required className="mt-1 py-2" />
                </label>
                <label className="block">
                  <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Stock</span>
                  <Input name="stock" type="number" min={0} placeholder="0" required className="mt-1 py-2" />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
                <label className="block">
                  <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Categoría</span>
                  <Select name="categoryId" defaultValue={defaultCategoryId} className="mt-1 py-2">
                    <option value="">Sin categoría</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="block">
                  <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Estado</span>
                  <Select name="status" defaultValue={ProductStatus.ACTIVE} className="mt-1 py-2">
                    <option value={ProductStatus.ACTIVE}>Visible</option>
                    <option value={ProductStatus.DRAFT}>No visible</option>
                  </Select>
                </label>
              </div>

              <label className="block">
                <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Imagen</span>
                <div className="mt-1">
                  <ImageDropzone name="imageUrl" businessId={businessId} label="Imagen del producto" />
                </div>
              </label>
            </FormSection>

            <details className="group rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-black text-[var(--app-text)]">
                <span>Opciones avanzadas</span>
                <span className="text-xs font-semibold text-[var(--app-text-muted)]">SEO, descuentos, variantes e IA</span>
              </summary>
              <div className="mt-3 space-y-4 border-t border-[var(--app-border)] pt-3">
                <label className="block">
                  <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Descripción larga</span>
                  <Textarea name="description" placeholder="Describe detalles, materiales, garantías o condiciones." rows={3} className="mt-1" />
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Precio antes</span>
                    <Input name="compareAtPrice" type="number" min={0} placeholder="Opcional" className="mt-1 py-2" />
                  </label>
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Descuento</span>
                    <Input name="discountPercent" type="number" min={0} max={100} placeholder="0" className="mt-1 py-2" />
                  </label>
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Stock mínimo</span>
                    <Input name="minStock" type="number" min={0} placeholder="0" className="mt-1 py-2" />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">SKU</span>
                    <Input name="sku" placeholder="Código interno opcional" className="mt-1 py-2" />
                  </label>
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Etiquetas</span>
                    <Input name="tags" placeholder="nuevo, oferta, temporada" className="mt-1 py-2" />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs font-black text-[var(--app-text)]">
                  <input name="featured" type="checkbox" className="h-4 w-4 rounded" />
                  Destacar producto en el catálogo y en recomendaciones IA
                </label>
                <ProductAttributesFields fields={dynamicFields} />
              </div>
            </details>

            <div className="sticky bottom-0 -mx-4 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
              <PendingSubmitButton className="w-full rounded-xl bg-[var(--app-primary)] px-4 py-2.5 text-sm font-black text-[var(--app-button-text)] disabled:opacity-60">
                Crear producto
              </PendingSubmitButton>
            </div>
          </form>
        </div>
      </DrawerForm>
    </>
  );
}
