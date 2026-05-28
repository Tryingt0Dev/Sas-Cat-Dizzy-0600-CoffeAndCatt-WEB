"use client";

import { useRef, useState } from "react";
import { ActionMenu, type ActionMenuItem } from "@/components/ActionMenu";
import { DrawerForm } from "@/components/DrawerForm";
import { FormSection } from "@/components/FormSection";
import { Input, Select, Textarea } from "@/components/Input";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { ImageDropzone } from "@/components/ImageDropzone";
import { ProductAttributesFields } from "@/components/ProductAttributesFields";
import { deleteProductAction, duplicateProductAction, toggleProductVisibilityAction, updateProductAction } from "./actions";
import { ProductStatus } from "@/lib/enums";
import { parseStringRecord } from "@/lib/safe-json";

export function ProductTableActions({
  product,
  categories,
  dynamicFields
}: {
  product: any;
  categories: any[];
  dynamicFields: any;
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const duplicateFormRef = useRef<HTMLFormElement>(null);
  const toggleFormRef = useRef<HTMLFormElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const currentProductAttributes = parseStringRecord(product.attributesJson);
  const isVisible = product.status === ProductStatus.ACTIVE;

  const actions: ActionMenuItem[] = [
    {
      id: "edit",
      label: "Editar",
      onClick: () => setShowEditModal(true)
    },
    {
      id: "duplicate",
      label: "Duplicar",
      onClick: () => duplicateFormRef.current?.requestSubmit()
    },
    {
      id: "visibility",
      label: isVisible ? "Ocultar" : "Mostrar",
      onClick: () => toggleFormRef.current?.requestSubmit()
    },
    {
      id: "delete",
      label: "Eliminar",
      variant: "danger",
      onClick: () => {
        if (confirm(`¿Eliminar ${product.name}?`)) {
          deleteFormRef.current?.requestSubmit();
        }
      }
    }
  ];

  return (
    <>
      <form ref={duplicateFormRef} action={duplicateProductAction} className="hidden">
        <input type="hidden" name="id" value={product.id} />
      </form>
      <form ref={toggleFormRef} action={toggleProductVisibilityAction} className="hidden">
        <input type="hidden" name="id" value={product.id} />
      </form>
      <form ref={deleteFormRef} action={deleteProductAction} className="hidden">
        <input type="hidden" name="id" value={product.id} />
      </form>

      <ActionMenu
        items={actions}
        triggerLabel="Acciones"
        triggerClassName="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1.5 text-xs font-black text-[var(--app-text)] transition duration-200 hover:bg-[var(--app-surface-muted)]"
      />
      
      {showEditModal && (
        <DrawerForm
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Editar ${product.name}`}
          description="Actualiza lo esencial y deja lo avanzado solo cuando aporte valor."
          size="lg"
        >
            <form action={updateProductAction} className="space-y-4">
              <input type="hidden" name="id" value={product.id} />

              <FormSection title="Datos básicos" className="p-3">
                <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_130px_110px]">
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Nombre</span>
                    <Input name="name" defaultValue={product.name} required className="mt-1 py-2" />
                  </label>
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Precio</span>
                    <Input name="price" type="number" min={0} defaultValue={product.price} className="mt-1 py-2" />
                  </label>
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Stock</span>
                    <Input name="stock" type="number" min={0} defaultValue={product.stock} className="mt-1 py-2" />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Categoría</span>
                    <Select name="categoryId" defaultValue={product.categoryId ?? ""} className="mt-1 py-2">
                      <option value="">Sin categoría</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </Select>
                  </label>
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Estado</span>
                    <Select name="status" defaultValue={product.status} className="mt-1 py-2">
                      <option value={ProductStatus.ACTIVE}>Visible</option>
                      <option value={ProductStatus.DRAFT}>No visible</option>
                      <option value={ProductStatus.ARCHIVED}>Archivado</option>
                    </Select>
                  </label>
                </div>

                <label className="block">
                  <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Imagen</span>
                  <div className="mt-1">
                    <ImageDropzone name="imageUrl" businessId={product.businessId} initialUrl={product.imageUrl} label="Imagen del producto" />
                  </div>
                </label>
              </FormSection>

              <details className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-black text-[var(--app-text)]">
                  <span>Opciones avanzadas</span>
                  <span className="text-xs font-semibold text-[var(--app-text-muted)]">Descripción, descuentos, etiquetas e IA</span>
                </summary>
                <div className="mt-3 space-y-4 border-t border-[var(--app-border)] pt-3">
                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Descripción larga</span>
                    <Textarea name="description" defaultValue={product.description ?? ""} rows={3} className="mt-1" />
                  </label>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block">
                      <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Precio antes</span>
                      <Input name="compareAtPrice" type="number" min={0} defaultValue={product.compareAtPrice ?? ""} className="mt-1 py-2" />
                    </label>
                    <label className="block">
                      <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Descuento</span>
                      <Input name="discountPercent" type="number" min={0} max={100} defaultValue={product.discountPercent} className="mt-1 py-2" />
                    </label>
                    <label className="block">
                      <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Stock mínimo</span>
                      <Input name="minStock" type="number" min={0} defaultValue={product.minStock} className="mt-1 py-2" />
                    </label>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block">
                      <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">SKU</span>
                      <Input name="sku" defaultValue={product.sku ?? ""} className="mt-1 py-2" />
                    </label>
                    <label className="block">
                      <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Costo</span>
                      <Input name="costPrice" type="number" min={0} defaultValue={product.costPrice ?? ""} className="mt-1 py-2" />
                    </label>
                    <label className="flex items-center gap-2 pt-6 text-xs font-black">
                      <input name="featured" type="checkbox" defaultChecked={product.featured} />
                      Destacado
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[0.7rem] font-black uppercase tracking-[0.08em] text-[var(--app-text-muted)]">Etiquetas</span>
                    <Input name="tags" defaultValue={product.tags ?? ""} placeholder="Separadas por comas" className="mt-1 py-2" />
                  </label>

                  <ProductAttributesFields fields={dynamicFields} currentAttributes={currentProductAttributes} />
                </div>
              </details>

              <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3">
                <PendingSubmitButton className="flex-1 rounded-xl bg-[var(--app-primary)] px-4 py-2 text-sm font-black text-[var(--app-button-text)]">
                  Guardar cambios
                </PendingSubmitButton>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl border border-[var(--app-border)] px-4 py-2 text-sm font-black"
                >
                  Cancelar
                </button>
              </div>
            </form>
        </DrawerForm>
      )}
    </>
  );
}
