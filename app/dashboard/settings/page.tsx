import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { Card } from "@/components/Card";
import { ImageDropzone } from "@/components/ImageDropzone";
import { Input, Textarea } from "@/components/Input";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { catalogTemplateOptions, getCatalogThemeStyle } from "@/lib/catalog";
import { updateSettingsAction } from "./actions";

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ success?: string; error?: string } | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const business = await getCurrentBusiness();
  const settings = await prisma.aiSettings.findUnique({ where: { businessId: business.id } });
  const themeStyle = getCatalogThemeStyle({
    id: business.id,
    name: business.name,
    slug: business.slug,
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
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-gray-400">Configuración</p>
        <h1 className="mt-2 text-4xl font-black">Tienda, diseño e IA</h1>
        <p className="mt-2 text-gray-500">Define la identidad visual pública y el comportamiento del vendedor IA.</p>
      </div>
      {resolvedSearchParams?.success && <div className="mb-4 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{resolvedSearchParams.success}</div>}
      {resolvedSearchParams?.error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">{resolvedSearchParams.error}</div>}

      <form action={updateSettingsAction} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black">Datos públicos</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input name="name" defaultValue={business.name} placeholder="Nombre tienda" required />
              <Input name="businessType" defaultValue={business.businessType ?? ""} placeholder="Tipo de negocio" />
              <Input name="whatsappNumber" defaultValue={business.whatsappNumber ?? ""} placeholder="WhatsApp" />
              <Input name="instagramUrl" defaultValue={business.instagramUrl ?? ""} placeholder="Instagram URL" />
            </div>
            <Textarea name="description" defaultValue={business.description ?? ""} placeholder="Descripción pública" rows={3} className="mt-4" />
            <Input name="address" defaultValue={business.address ?? ""} placeholder="Dirección o zona" className="mt-4" />
          </Card>

          <Card>
            <h2 className="text-xl font-black">Diseño del catálogo</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {catalogTemplateOptions.map((template) => (
                <label key={template.value} className="cursor-pointer rounded-2xl border border-gray-200 p-4 hover:border-gray-400">
                  <div className="flex items-start gap-3">
                    <input name="catalogTemplate" type="radio" value={template.value} defaultChecked={business.catalogTemplate === template.value} className="mt-1" />
                    <div>
                      <p className="font-black">{template.label}</p>
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
