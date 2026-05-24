import { prisma } from "@/lib/db";
import { Card } from "@/components/Card";
import { ImageDropzone } from "@/components/ImageDropzone";
import { Input, Textarea } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { StatusAlert } from "@/components/StatusAlert";
import { catalogTemplateOptions, getCatalogThemeStyle } from "@/lib/catalog";
import { allowedTemplatesForPlan, effectivePlanLimits, planDisplayName } from "@/services/plan-guard";
import { requireStoreAccess } from "@/services/authorization";
import { updateSettingsAction } from "./actions";

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
  const themeStyle = getCatalogThemeStyle({
    id: business.id,
    name: business.name,
    slug: business.slug,
    publicSlug: business.publicSlug,
    description: business.description,
    logoUrl: business.logoUrl,
    bannerUrl: business.bannerUrl,
    whatsappNumber: business.whatsappNumber,
    businessType: business.businessType,
    address: business.address,
    catalogTemplate: business.catalogTemplate,
    primaryColor: business.primaryColor,
    secondaryColor: business.secondaryColor,
    accentColor: business.accentColor,
    backgroundColor: business.backgroundColor,
    textColor: business.textColor,
    buttonRadius: business.buttonRadius
  });

  return (
    <div>
      <PageHeader
        eyebrow="Configuración"
        title="Tienda, panel, diseño e IA"
        description="Define cómo se ve tu catálogo público y cómo se organiza el panel interno para trabajar más rápido."
      />
      <StatusAlert success={resolvedSearchParams?.success} error={resolvedSearchParams?.error} />

      <form action={updateSettingsAction} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black">Nombre del panel interno</h2>
            <p className="mt-1 text-sm text-gray-500">Esto no cambia el nombre público de la tienda; solo mejora la experiencia de tu equipo dentro del dashboard.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input name="dashboardTitle" defaultValue={business.dashboardTitle ?? ""} placeholder={`Panel de ${business.name}`} maxLength={120} />
              <Input name="dashboardSubtitle" defaultValue={business.dashboardSubtitle ?? ""} placeholder="Ej: Ventas, inventario y clientes en un solo lugar" maxLength={220} />
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Datos públicos</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input name="name" defaultValue={business.name} placeholder="Nombre tienda" required />
              <Input name="publicSlug" defaultValue={business.publicSlug} placeholder="URL publica: mi-tienda" required />
              <Input name="businessType" defaultValue={business.businessType ?? ""} placeholder="Tipo de negocio" />
              <Input name="whatsappNumber" defaultValue={business.whatsappNumber ?? ""} placeholder="WhatsApp" />
              <Input name="instagramUrl" defaultValue={business.instagramUrl ?? ""} placeholder="Instagram URL" />
            </div>
            <p className="mt-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">
              URL pública: <span className="text-gray-950">/store/{business.publicSlug}</span>
            </p>
            <Textarea name="description" defaultValue={business.description ?? ""} placeholder="Descripción pública" rows={3} className="mt-4" />
            <Input name="address" defaultValue={business.address ?? ""} placeholder="Dirección o zona" className="mt-4" />
          </Card>

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Diseño del catálogo</h2>
                <p className="mt-1 text-sm text-gray-500">Plan activo: <span className="font-black text-gray-900">{currentPlanName}</span></p>
              </div>
              {effectivePlan.advancedBranding && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Branding avanzado</span>}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {catalogTemplateOptions.map((template) => (
                <label
                  key={template.value}
                  className={allowedTemplates.includes(template.value)
                    ? "cursor-pointer rounded-2xl border border-gray-200 p-4 hover:border-gray-400"
                    : "rounded-2xl border border-gray-100 bg-gray-50 p-4 opacity-60"}
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
                        {!allowedTemplates.includes(template.value) && <span className="ml-2 text-xs text-gray-400">Plan superior</span>}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <span className="h-10 rounded-lg bg-gray-900" />
                        <span className="h-10 rounded-lg bg-gray-100" />
                        <span className="h-10 rounded-lg" style={{ backgroundColor: business.accentColor }} />
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-5">
              <label className="text-sm font-bold text-gray-600">Principal<Input name="primaryColor" type="color" defaultValue={business.primaryColor} className="mt-2 h-12 p-1" /></label>
              <label className="text-sm font-bold text-gray-600">Secundario<Input name="secondaryColor" type="color" defaultValue={business.secondaryColor} className="mt-2 h-12 p-1" /></label>
              <label className="text-sm font-bold text-gray-600">Acento<Input name="accentColor" type="color" defaultValue={business.accentColor} className="mt-2 h-12 p-1" /></label>
              <label className="text-sm font-bold text-gray-600">Fondo<Input name="backgroundColor" type="color" defaultValue={business.backgroundColor} className="mt-2 h-12 p-1" /></label>
              <label className="text-sm font-bold text-gray-600">Texto<Input name="textColor" type="color" defaultValue={business.textColor} className="mt-2 h-12 p-1" /></label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="text-sm font-bold text-gray-600">Radio botones<Input name="buttonRadius" type="number" min={0} max={32} defaultValue={business.buttonRadius} className="mt-2" /></label>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <ImageDropzone name="logoUrl" businessId={business.id} label="Logo de la tienda" initialUrl={business.logoUrl} />
              <ImageDropzone name="bannerUrl" businessId={business.id} label="Banner / hero del catalogo" initialUrl={business.bannerUrl} />
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Configuración de IA</h2>
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
            <h2 className="text-xl font-black">Vista rápida</h2>
            <div className="mt-4 overflow-hidden rounded-[var(--catalog-radius)] border border-black/10" style={themeStyle}>
              <div className="bg-[var(--catalog-primary)] p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-75">Catálogo</p>
                <h3 className="mt-2 text-2xl font-black">{business.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm opacity-80">{business.description}</p>
              </div>
              <div className="bg-[var(--catalog-bg)] p-5">
                <div className="rounded-[var(--catalog-radius)] bg-white p-4 shadow-sm">
                  <span className="rounded-full bg-[var(--catalog-accent)] px-3 py-1 text-xs font-black text-white">Oferta</span>
                  <p className="mt-3 font-black text-[var(--catalog-text)]">Producto destacado</p>
                  <p className="text-sm text-gray-500">Preview de card y botones.</p>
                  <span className="mt-4 inline-flex rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-4 py-2 text-sm font-black text-white">Consultar</span>
                </div>
              </div>
            </div>
          </Card>
          <PendingSubmitButton className="w-full rounded-2xl bg-black px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
            Guardar ajustes
          </PendingSubmitButton>
        </aside>
      </form>
    </div>
  );
}
