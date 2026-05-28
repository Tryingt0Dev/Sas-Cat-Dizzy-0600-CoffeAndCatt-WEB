import { prisma } from "@/lib/db";
import { Card } from "@/components/Card";
import { HelpTooltip } from "@/components/HelpTooltip";
import { ImageDropzone } from "@/components/ImageDropzone";
import { Input, Textarea } from "@/components/Input";
import { FormField, FormGrid } from "@/components/FormField";
import { InfoBox } from "@/components/InfoBox";
import { LearningLink } from "@/components/LearningLink";
import { CopyButton } from "@/components/CopyButton";
import { PageHeader } from "@/components/PageHeader";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SectionGuide } from "@/components/SectionGuide";
import { SectionCard } from "@/components/SectionCard";
import { StatusAlert } from "@/components/StatusAlert";
import { catalogTemplateOptions, getCatalogThemeStyle } from "@/lib/catalog";
import { getStoreTypeOptions } from "@/lib/store-types";
import { allowedTemplatesForPlan, effectivePlanLimits, planDisplayName } from "@/services/plan-guard";
import { requireStoreAccess } from "@/services/authorization";
import { updateSettingsAction } from "./actions";
import { LiveThemeColorControls } from "@/components/theme/LiveThemeColorControls";

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { user, business } = await requireStoreAccess({ permission: "manage_settings" });
  const [settings, businessWithPlan] = await Promise.all([
    prisma.aiSettings.findUnique({ where: { businessId: business.id } }),
    prisma.business.findUnique({ where: { id: business.id }, include: { plan: true } })
  ]);
  const effectivePlan = effectivePlanLimits(businessWithPlan?.plan, user);
  const allowedTemplates = allowedTemplatesForPlan(effectivePlan);
  const currentPlanName = planDisplayName(businessWithPlan?.plan, user);
  const catalogUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/store/${business.publicSlug}`;
  const themeStyle = getCatalogThemeStyle(business);

  return (
    <div>
      <PageHeader
        eyebrow="Configuración"
        title="Tienda, panel, diseño e IA"
        description="Define cómo se ve tu catálogo público y cómo se organiza el panel interno para trabajar más rápido."
      />
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />
      <SectionGuide
        eyebrow="Ajustes"
        title="Organiza tu tienda y marca"
        description="Ajusta el nombre del panel, la información pública, el catálogo y la IA con ayuda contextual en cada campo." 
        help="Si no estás seguro de un campo, usa el enlace de ayuda o consulta la guía de configuración." 
        actions={<LearningLink href="/dashboard/learning#configurar-tienda">Ver guía</LearningLink>}
      />

      <form action={updateSettingsAction} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <SectionCard
            title="Nombre del panel interno"
            description="Esto no cambia el nombre público de la tienda; solo mejora la experiencia de tu equipo dentro del dashboard."
            help="Nombre visible solo dentro del dashboard para que tu equipo reconozca el panel al instante."
          >
            <FormGrid>
              <FormField label="Nombre del panel" hint="Ej: Panel ventas Boutique.">
                <Input name="dashboardTitle" defaultValue={business.dashboardTitle ?? ""} placeholder={`Panel de ${business.name}`} maxLength={120} />
              </FormField>
              <FormField label="Subtítulo interno" hint="Descripción breve para orientar a quien usa el panel.">
                <Input name="dashboardSubtitle" defaultValue={business.dashboardSubtitle ?? ""} placeholder="Ej: Ventas, inventario y clientes en un solo lugar" maxLength={220} />
              </FormField>
            </FormGrid>
          </SectionCard>

          <SectionCard
            title="Datos públicos"
            description="Configura la información que verán tus clientes en el catálogo público."
            help="Estos datos se muestran en tu catálogo público, así que mantenlos claros y actualizados."
          >
            <FormGrid>
              <FormField label="Nombre de la tienda" hint="Este nombre se mostrará en tu tienda pública.">
                <Input name="name" defaultValue={business.name} placeholder="Nombre tienda" required />
              </FormField>
              <FormField label="URL pública" hint="Usa una URL corta y fácil de compartir.">
                <Input name="publicSlug" defaultValue={business.publicSlug} placeholder="mi-tienda" required />
              </FormField>
              <FormField label="Tipo de negocio" hint="Las recomendaciones de IA se adaptarán al tipo de negocio seleccionado.">
                <select name="businessType" defaultValue={business.businessType ?? ""} className="block w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-input-bg,var(--app-surface))] px-4 py-3 text-sm text-[var(--app-text)] shadow-sm focus:border-[var(--app-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--app-ring)]">
                  <option value="">Elige un tipo de tienda</option>
                  {getStoreTypeOptions().map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="WhatsApp" hint="Este enlace se usará para recibir consultas de clientes.">
                <Input name="whatsappNumber" defaultValue={business.whatsappNumber ?? ""} placeholder="+56 9 1234 5678" />
              </FormField>
              <FormField label="Instagram" hint="Enlace opcional para mostrar tu perfil social.">
                <Input name="instagramUrl" defaultValue={business.instagramUrl ?? ""} placeholder="https://instagram.com/tu-tienda" />
              </FormField>
            </FormGrid>

            <div className="mt-4 space-y-4">
              <InfoBox>
                URL pública: <span className="font-black text-[var(--app-text)]">/store/{business.publicSlug}</span>
              </InfoBox>
              <InfoBox title="Enlace directo del catálogo">
                <p className="break-all">{catalogUrl}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={catalogUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-black text-[var(--app-text)] shadow-sm transition duration-200 hover:bg-[var(--app-surface-muted)]">
                    Revisar catálogo
                  </a>
                  <CopyButton text={catalogUrl} label="Copiar enlace" className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-sm font-black text-[var(--app-text)] shadow-sm" />
                </div>
              </InfoBox>
              <FormField label="Descripción pública" hint="Texto corto que verán los clientes en tu catálogo.">
                <Textarea name="description" defaultValue={business.description ?? ""} placeholder="Descripción pública" rows={3} />
              </FormField>
              <FormField label="Dirección o zona" hint="Usa esta información si atiendes localmente.">
                <Input name="address" defaultValue={business.address ?? ""} placeholder="Dirección o zona" />
              </FormField>
            </div>
          </SectionCard>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">Diseño del catálogo</h2>
                  <HelpTooltip description="Elige el diseño que mejor muestre tus productos. La seleccion visual queda disponible para todos los planes." />
                </div>
                <p className="mt-1 text-sm text-[var(--app-text-muted)]">Plan activo: <span className="font-black text-[var(--app-text)]">{currentPlanName}</span></p>
              </div>
              {effectivePlan.advancedBranding && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Diseño incluido</span>}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {catalogTemplateOptions.map((template) => (
                <label
                  key={template.value}
                  className={allowedTemplates.includes(template.value)
                    ? "cursor-pointer rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 hover:border-[var(--app-border)]"
                    : "rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4 opacity-60"}
                >
                  <div className="flex items-start gap-3">
                    <input
                      name="catalogTemplate"
                      type="radio"
                      value={template.value}
                      defaultChecked={business.catalogTemplate === template.value}
                      disabled={!allowedTemplates.includes(template.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-black">
                        {template.label}
                        {!allowedTemplates.includes(template.value) && <span className="ml-2 text-xs text-[var(--app-text-muted)]">Plan superior</span>}
                      </p>
                      <p className="mt-1 text-sm text-[var(--app-text-muted)]">{template.description}</p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <span className="h-10 rounded-lg bg-[var(--app-text)]" />
                        <span className="h-10 rounded-lg bg-[var(--app-surface-muted)]" />
                        <span className="h-10 rounded-lg" style={{ backgroundColor: business.accentColor }} />
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <LiveThemeColorControls
              initialPrimary={business.primaryColor ?? "#111827"}
              initialSecondary={business.secondaryColor ?? "#F9A8D4"}
              initialAccent={business.accentColor ?? "#DB2777"}
              initialBackground={business.backgroundColor ?? "#FFFFFF"}
              initialText={business.textColor ?? "#111827"}
              initialButtonRadius={business.buttonRadius ?? 18}
            />
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <ImageDropzone name="logoUrl" businessId={business.id} label="Logo de la tienda" initialUrl={business.logoUrl} />
              <ImageDropzone name="bannerUrl" businessId={business.id} label="Banner / hero del catalogo" initialUrl={business.bannerUrl} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">Página pública y SEO</h2>
              <HelpTooltip description="Ajusta el contenido de tu catálogo público con mensajes clave, SEO y bloques destacados." />
            </div>
            <div className="mt-5 grid gap-4">
              <label className="block text-sm font-semibold text-[var(--app-text)]">
                Mensaje de bienvenida
                <span className="mt-1 block text-xs text-[var(--app-text-muted)]">Texto corto que aparece en el inicio del catálogo para conectar con tus clientes.</span>
                <Textarea name="welcomeMessage" defaultValue={business.welcomeMessage ?? ""} placeholder="Bienvenido a nuestra tienda..." rows={3} />
              </label>
              <label className="block text-sm font-semibold text-[var(--app-text)]">
                Título SEO
                <span className="mt-1 block text-xs text-[var(--app-text-muted)]">Título que aparecerá en buscadores y redes sociales.</span>
                <Input name="seoTitle" defaultValue={business.seoTitle ?? ""} placeholder="Título SEO" maxLength={120} />
              </label>
              <label className="block text-sm font-semibold text-[var(--app-text)]">
                Descripción SEO
                <span className="mt-1 block text-xs text-[var(--app-text-muted)]">Breve descripción que ayuda a mejorar la visibilidad en búsquedas.</span>
                <Textarea name="seoDescription" defaultValue={business.seoDescription ?? ""} placeholder="Descripción SEO" rows={3} />
              </label>
              <label className="block text-sm font-semibold text-[var(--app-text)]">
                Palabras clave (SEO)
                <span className="mt-1 block text-xs text-[var(--app-text-muted)]">Separadas por comas, opcionales para mejorar búsquedas.</span>
                <Input name="seoKeywords" defaultValue={business.seoKeywords ?? ""} placeholder="Ej: moda, zapatos, ofertas" maxLength={240} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-semibold"><input name="showFeaturedCategories" type="checkbox" defaultChecked={business.showFeaturedCategories ?? true} /> Mostrar categorías destacadas</label>
                <label className="flex items-center gap-2 text-sm font-semibold"><input name="showFeaturedProducts" type="checkbox" defaultChecked={business.showFeaturedProducts ?? true} /> Mostrar productos destacados</label>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">Configuración de IA</h2>
              <HelpTooltip description="Ajusta cómo responde la IA a los clientes desde tu catálogo público." />
            </div>
            <div className="mt-4 space-y-4">
              <Input name="tone" defaultValue={settings?.tone ?? "profesional y cercano"} placeholder="Tono de la IA" required />
              <Textarea name="instructions" defaultValue={settings?.instructions ?? ""} placeholder="Instrucciones: cómo vender, qué preguntar, qué evitar" rows={5} />
              <Textarea name="fallbackMessage" defaultValue={settings?.fallbackMessage ?? "No tengo esa informacion exacta. Te puedo derivar con una persona."} placeholder="Mensaje si no sabe responder" rows={3} required />
              <label className="flex gap-2 text-sm font-semibold"><input name="allowAutoLead" type="checkbox" defaultChecked={settings?.allowAutoLead ?? true} /> Permitir crear leads automáticamente</label>
              <label className="flex gap-2 text-sm font-semibold"><input name="humanHandoffEnabled" type="checkbox" defaultChecked={settings?.humanHandoffEnabled ?? true} /> Derivar a humano si no sabe</label>
            </div>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <h2 className="text-xl font-black">Pasos recomendados</h2>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">Sigue estos pasos para completar tu tienda y activar la vista pública más rápido.</p>
            <ol className="mt-5 space-y-4 text-sm text-[var(--app-text)]">
              <li className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <strong className="block font-black">1. Datos básicos</strong>
                Nombre, URL pública, tipo de negocio y contacto.
              </li>
              <li className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <strong className="block font-black">2. Diseño del catálogo</strong>
                Elige plantilla, colores, logo y banner.
              </li>
              <li className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <strong className="block font-black">3. Contenido público</strong>
                Mensaje de bienvenida, SEO y productos destacados.
              </li>
              <li className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
                <strong className="block font-black">4. IA y ventas</strong>
                Ajusta el tono de la IA y el mensaje de fallback.
              </li>
            </ol>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Vista rápida</h2>
            <div className="mt-4 overflow-hidden rounded-[var(--catalog-radius)] border border-[var(--catalog-border)]" style={themeStyle}>
              <div className="bg-[var(--catalog-primary)] p-5 text-[var(--catalog-button-text)]">
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-75">Catálogo</p>
                <h3 className="mt-2 text-2xl font-black">{business.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm opacity-80">{business.description}</p>
              </div>
              <div className="bg-[var(--catalog-bg)] p-5">
                <div className="rounded-[var(--catalog-radius)] bg-[var(--catalog-surface)] p-4 shadow-sm">
                  <span className="rounded-full bg-[var(--catalog-accent)] px-3 py-1 text-xs font-black text-[var(--catalog-accent-text)]">Oferta</span>
                  <p className="mt-3 font-black text-[var(--catalog-text)]">Producto destacado</p>
                  <p className="text-sm text-[var(--catalog-text-muted)]">Preview de card y botones.</p>
                  <span className="mt-4 inline-flex rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-4 py-2 text-sm font-black text-[var(--catalog-button-text)]">Consultar</span>
                </div>
              </div>
            </div>
          </Card>
          <PendingSubmitButton className="w-full rounded-2xl bg-[var(--app-primary)] px-5 py-3 font-bold text-[var(--app-button-text)] disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[var(--app-primary-hover)]">
            Guardar ajustes
          </PendingSubmitButton>
        </aside>
      </form>
    </div>
  );
}
