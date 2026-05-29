import Link from "next/link";
import { Card } from "@/components/Card";
import { CopyButton } from "@/components/CopyButton";
import { FormField, FormGrid } from "@/components/FormField";
import { ImageDropzone } from "@/components/ImageDropzone";
import { InfoBox } from "@/components/InfoBox";
import { Input, Select, Textarea } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { PendingSubmitButton } from "@/components/PendingSubmitButton";
import { SectionCard } from "@/components/SectionCard";
import { StatusAlert } from "@/components/StatusAlert";
import { StatusBadge } from "@/components/StatusBadge";
import { getCatalogThemeStyle } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getStoreTypeOptions } from "@/lib/store-types";
import { getBusinessPlan } from "@/services/plan-guard";
import { requireStoreAccess } from "@/services/authorization";
import { updateSettingsAction } from "./actions";
import { SettingsUnsavedGuard } from "./SettingsUnsavedGuard";

const sectionLinks = [
  ["General", "#general"],
  ["Datos públicos", "#datos-publicos"],
  ["Contacto y redes", "#contacto"],
  ["Catálogo", "#catalogo"],
  ["Operación", "#operacion"],
  ["Seguridad", "#seguridad"],
  ["Avanzado", "#avanzado"]
] as const;

const currencyOptions = ["CLP", "USD", "EUR", "MXN", "COP", "PEN", "ARS", "BRL"] as const;

type SettingsSearchParams = {
  success?: string;
  error?: string;
  saved?: string;
};

function textOrPending(value: string | null | undefined, fallback = "No configurado") {
  return value?.trim() || fallback;
}

function instagramLabel(value: string | null | undefined) {
  if (!value) return "No configurado";
  try {
    const url = new URL(value);
    const user = url.pathname.split("/").filter(Boolean)[0];
    return user ? `@${user}` : value;
  } catch {
    return value;
  }
}

function hiddenBoolean(name: string, value: boolean) {
  return value ? <input type="hidden" name={name} value="on" /> : null;
}

function LockedFeature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black">{title}</p>
        <StatusBadge variant="warning" className="px-2 py-0.5 text-[0.68rem]">Premium/Business</StatusBadge>
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--app-text-muted)]">{description}</p>
      <Link href="/settings/billing" className="mt-3 inline-flex rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-black">
        Ver planes
      </Link>
    </div>
  );
}

function ToggleField({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3 text-sm">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-1" />
      <span>
        <span className="block font-black text-[var(--app-text)]">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--app-text-muted)]">{hint}</span>
      </span>
    </label>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<SettingsSearchParams | undefined> }) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { user, business, storeRole } = await requireStoreAccess({ permission: "manage_settings" });
  const [settings, businessWithPlan] = await Promise.all([
    prisma.aiSettings.findUnique({ where: { businessId: business.id } }),
    prisma.business.findUnique({
      where: { id: business.id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        plan: true,
        subscription: { include: { plan: true } },
        _count: { select: { products: true, categories: true, memberships: true } }
      }
    })
  ]);

  const effectivePlan = getBusinessPlan(businessWithPlan, user);
  const canUseAdvancedBranding = Boolean(effectivePlan.advancedBranding);
  const canUseAdvancedSettings = Boolean(effectivePlan.advancedSettings);
  const canUseAi = effectivePlan.aiEnabled !== false;
  const canUseAnalytics = Boolean(effectivePlan.analyticsEnabled);
  const canUseCustomDomain = Boolean(effectivePlan.customDomain);
  const canUseQuotes = Boolean(effectivePlan.quotesAndOrders);
  const catalogPath = `/store/${business.publicSlug}`;
  const catalogUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${catalogPath}`;
  const themeStyle = getCatalogThemeStyle(business);
  const memberCount = (businessWithPlan?._count.memberships ?? 0) + 1;
  const productCount = businessWithPlan?._count.products ?? 0;
  const categoryCount = businessWithPlan?._count.categories ?? 0;
  const owner = businessWithPlan?.owner ?? business.owner;
  const aiTone = settings?.tone ?? "profesional y cercano";
  const aiFallback = settings?.fallbackMessage ?? "No tengo esa información exacta. Te puedo derivar con una persona.";
  const aiInstructions = settings?.instructions ?? "";
  const allowAutoLead = settings?.allowAutoLead ?? true;
  const humanHandoffEnabled = settings?.humanHandoffEnabled ?? true;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Sistema"
        title="Configuración de la tienda"
        description="Administra la información pública, contacto, operación y preferencias internas."
        className="mb-2"
        actions={
          <>
            <StatusBadge variant="info" className="px-3 py-1">Plan {effectivePlan.name}</StatusBadge>
            <button
              type="submit"
              form="store-settings-form"
              className="rounded-xl bg-[var(--app-primary)] px-4 py-2 text-xs font-black text-[var(--app-button-text)] shadow-sm transition hover:bg-[var(--app-primary-hover)]"
            >
              Guardar cambios
            </button>
          </>
        }
      />
      <StatusAlert
        success={resolvedSearchParams?.saved === "1" ? "Ajustes guardados correctamente." : resolvedSearchParams?.success}
        error={resolvedSearchParams?.error}
      />

      <nav aria-label="Secciones de configuración" className="sticky top-0 z-20 -mx-1 overflow-x-auto bg-[var(--app-bg)]/90 px-1 py-2 backdrop-blur">
        <div className="flex min-w-max gap-2">
          {sectionLinks.map(([label, href]) => (
            <a key={href} href={href} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-black text-[var(--app-text)] transition hover:bg-[var(--app-surface-muted)]">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <form id="store-settings-form" action={updateSettingsAction} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SettingsUnsavedGuard formId="store-settings-form" />
        <div className="space-y-4">
          <section id="general" className="scroll-mt-20">
            <SectionCard
              title="General"
              description="Define cómo tu equipo identifica la tienda dentro del panel y cómo la reconocerán tus clientes."
              help="El nombre interno solo organiza el dashboard; el nombre público aparece en el catálogo."
            >
              <FormGrid>
                <FormField label="Nombre interno del panel" hint="Solo para administración. Ej: Panel ventas Boutique.">
                  <Input name="dashboardTitle" defaultValue={business.dashboardTitle ?? ""} placeholder={`Panel de ${business.name}`} maxLength={120} />
                </FormField>
                <FormField label="Subtítulo interno" hint="Ayuda a tu equipo a entender el propósito de esta tienda.">
                  <Input name="dashboardSubtitle" defaultValue={business.dashboardSubtitle ?? ""} placeholder="Ventas, inventario y clientes en un solo lugar" maxLength={220} />
                </FormField>
                <FormField label="Nombre público de la tienda" hint="Visible para clientes en el catálogo público.">
                  <Input name="name" defaultValue={business.name} placeholder="Nombre de la tienda" required maxLength={120} />
                </FormField>
                <FormField label="Rubro de negocio" hint="La IA y la experiencia pública usan este dato como contexto.">
                  <Select name="businessType" defaultValue={business.businessType ?? ""}>
                    <option value="">Selecciona un rubro</option>
                    {getStoreTypeOptions().map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </FormField>
              </FormGrid>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px]">
                <div className="space-y-3">
                  {canUseAdvancedBranding ? (
                    <ImageDropzone name="logoUrl" businessId={business.id} label="Logo o avatar de la tienda" initialUrl={business.logoUrl} />
                  ) : (
                    <>
                      <input type="hidden" name="logoUrl" value={business.logoUrl ?? ""} />
                      <LockedFeature title="Logo personalizado" description="El logo de tienda forma parte del branding avanzado del catálogo." />
                    </>
                  )}
                  {canUseAdvancedBranding ? (
                    <ImageDropzone name="bannerUrl" businessId={business.id} label="Banner del catálogo" initialUrl={business.bannerUrl} />
                  ) : null}
                </div>
                <InfoBox title="Estado de tienda">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge variant={business.isActive ? "success" : "danger"}>{business.isActive ? "Activa" : "Pausada"}</StatusBadge>
                    <span className="text-xs">Los permisos avanzados y suspensiones se gestionan fuera de esta pantalla.</span>
                  </div>
                </InfoBox>
              </div>
            </SectionCard>
          </section>

          <section id="datos-publicos" className="scroll-mt-20">
            <SectionCard
              title="Datos públicos"
              description="Información visible en el catálogo. Usa textos cortos, compartibles y fáciles de reconocer."
              help="El slug solo acepta letras, números y guiones. Si cambias la URL, la anterior queda reservada para proteger tu marca."
            >
              <FormGrid>
                <FormField label="Slug / URL pública" hint="Usa una URL corta, sin espacios ni caracteres especiales.">
                  <Input
                    name="publicSlug"
                    defaultValue={business.publicSlug}
                    placeholder="mi-tienda"
                    minLength={2}
                    maxLength={80}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    required
                  />
                </FormField>
                <FormField label="Vista previa de URL" hint="Se actualizará después de guardar los cambios.">
                  <div className="flex min-h-[46px] items-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 text-sm font-black">
                    {catalogPath}
                  </div>
                </FormField>
              </FormGrid>
              <div className="mt-4">
                <FormField label="Descripción pública" hint="Texto breve que ayuda a los clientes a entender qué vendes.">
                  <Textarea name="description" defaultValue={business.description ?? ""} placeholder="Ej: Productos seleccionados para regalar, renovar tu casa o comprar rápido por WhatsApp." rows={3} maxLength={600} />
                </FormField>
              </div>
              <InfoBox title="Enlace directo del catálogo" className="mt-4">
                <p className="break-all text-xs sm:text-sm">{catalogUrl}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={catalogUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-black">
                    Ver catálogo
                  </a>
                  <CopyButton text={catalogUrl} label="Copiar enlace" className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-black" />
                </div>
              </InfoBox>
            </SectionCard>
          </section>

          <section id="contacto" className="scroll-mt-20">
            <SectionCard
              title="Contacto y redes"
              description="Centraliza los canales donde tus clientes pueden pedir información o comprar."
              help="WhatsApp funciona mejor con código de país. Instagram puede guardarse como usuario o URL."
            >
              <FormGrid>
                <FormField label="WhatsApp" hint="Formato recomendado: +56 9 1234 5678.">
                  <Input name="whatsappNumber" defaultValue={business.whatsappNumber ?? ""} placeholder="+56 9 1234 5678" maxLength={40} />
                </FormField>
                <FormField label="Instagram" hint="Acepta @tu_tienda o https://instagram.com/tu_tienda.">
                  <Input name="instagramUrl" defaultValue={business.instagramUrl ?? ""} placeholder="@tu_tienda" maxLength={160} />
                </FormField>
                <FormField label="Dirección o ubicación" hint="Útil si atiendes en local, comuna o zona de despacho.">
                  <Input name="address" defaultValue={business.address ?? ""} placeholder="Santiago Centro, Región Metropolitana" maxLength={180} />
                </FormField>
                <div className="grid gap-2">
                  <InfoBox title="Email público y teléfono">
                    Estos campos todavía no existen en el modelo de tienda. Se mantienen fuera del formulario para no guardar datos incompletos.
                  </InfoBox>
                </div>
              </FormGrid>
            </SectionCard>
          </section>

          <section id="catalogo" className="scroll-mt-20">
            <SectionCard
              title="Catálogo"
              description="Configura cómo se presenta la tienda pública y qué bloques se muestran primero."
              help="Las plantillas bloqueadas no se envían al servidor; el plan actual define cuáles puedes guardar."
            >
              <input type="hidden" name="catalogTemplate" value={business.catalogTemplate} />

              <div className="grid gap-3 sm:grid-cols-2">
                <ToggleField name="showFeaturedCategories" label="Mostrar categorías destacadas" hint="Ayuda a navegar el catálogo cuando hay varias líneas de productos." defaultChecked={business.showFeaturedCategories ?? true} />
                <ToggleField name="showFeaturedProducts" label="Mostrar productos destacados" hint="Muestra productos principales al inicio de la tienda pública." defaultChecked={business.showFeaturedProducts ?? true} />
              </div>

              <div className="mt-4">
                <FormField label="Mensaje principal del catálogo" hint="Texto corto para recibir a tus clientes antes de mostrar productos.">
                  <Textarea name="welcomeMessage" defaultValue={business.welcomeMessage ?? ""} placeholder="Bienvenido a nuestra tienda. Escríbenos si necesitas ayuda para elegir." rows={3} maxLength={280} />
                </FormField>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <InfoBox title="Stock y agotados">
                  No existe todavía una preferencia global para mostrar stock o productos agotados. El catálogo mantiene la lógica actual.
                </InfoBox>
                <InfoBox title="Cotizaciones">
                  {canUseQuotes ? "Tu plan permite cotizaciones y pedidos cuando el módulo esté activo en los flujos comerciales." : "Disponible en Premium/Business cuando necesites cotizaciones y pedidos."}
                </InfoBox>
              </div>
            </SectionCard>
          </section>

          <section id="operacion" className="scroll-mt-20">
            <SectionCard
              title="Operación"
              description="Preferencias prácticas para atención, moneda y mensajes operativos."
              help="Solo se muestran campos existentes en el modelo actual. Los demás quedan marcados para implementación futura."
            >
              <FormGrid>
                <FormField label="Moneda del catálogo" hint="Se usa para mostrar precios y ordenar reportes comerciales.">
                  <Select name="currency" defaultValue={business.currency ?? "CLP"}>
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </Select>
                </FormField>
                <InfoBox title="Horarios y entrega">
                  Horarios de atención, métodos de entrega/retiro y mensajes de pedido aún no existen como campos de tienda.
                </InfoBox>
              </FormGrid>
            </SectionCard>
          </section>

          <section id="seguridad" className="scroll-mt-20">
            <SectionCard
              title="Seguridad"
              description="Resumen de acceso de tienda. El admin global no se mezcla con permisos normales de esta tienda."
              help="Los permisos avanzados se gestionan desde miembros o desde administración global de plataforma."
            >
              <div className="grid gap-3 md:grid-cols-3">
                <InfoBox title="Dueño de tienda">
                  <p className="font-black text-[var(--app-text)]">{owner.name}</p>
                  <p className="break-all text-xs">{owner.email}</p>
                </InfoBox>
                <InfoBox title="Tu rol actual">
                  <StatusBadge variant="dark">{storeRole}</StatusBadge>
                </InfoBox>
                <InfoBox title="Miembros">
                  <p className="text-2xl font-black text-[var(--app-text)]">{memberCount}</p>
                  <p className="text-xs">Incluye dueño y usuarios asociados.</p>
                </InfoBox>
              </div>
            </SectionCard>
          </section>

          <section id="avanzado" className="scroll-mt-20">
            <SectionCard
              title="Avanzado"
              description="SEO, branding, dominio, analytics e IA. Cada bloque respeta los límites del plan activo."
              help="Los campos bloqueados conservan sus valores actuales y no se envían como cambios nuevos."
            >
              <div className="grid gap-4">
                {canUseAdvancedSettings ? (
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                    <h3 className="text-sm font-black">SEO avanzado</h3>
                    <FormGrid className="mt-3">
                      <FormField label="Título SEO" hint="Título para buscadores y enlaces compartidos.">
                        <Input name="seoTitle" defaultValue={business.seoTitle ?? ""} placeholder="Título SEO" maxLength={120} />
                      </FormField>
                      <FormField label="Palabras clave" hint="Separadas por comas. Úsalas como guía interna.">
                        <Input name="seoKeywords" defaultValue={business.seoKeywords ?? ""} placeholder="moda, regalos, ofertas" maxLength={240} />
                      </FormField>
                    </FormGrid>
                    <div className="mt-3">
                      <FormField label="Descripción SEO" hint="Resumen corto para mejorar cómo se entiende tu catálogo.">
                        <Textarea name="seoDescription" defaultValue={business.seoDescription ?? ""} placeholder="Descripción para buscadores" rows={3} maxLength={180} />
                      </FormField>
                    </div>
                  </div>
                ) : (
                  <>
                    <input type="hidden" name="seoTitle" value={business.seoTitle ?? ""} />
                    <input type="hidden" name="seoDescription" value={business.seoDescription ?? ""} />
                    <input type="hidden" name="seoKeywords" value={business.seoKeywords ?? ""} />
                    <LockedFeature title="SEO avanzado" description="Disponible en planes superiores. Conservamos tu configuración actual sin modificarla." />
                  </>
                )}

                <input type="hidden" name="primaryColor" value={business.primaryColor ?? "#111827"} />
                <input type="hidden" name="secondaryColor" value={business.secondaryColor ?? "#F9FAFB"} />
                <input type="hidden" name="accentColor" value={business.accentColor ?? "#E11D48"} />
                <input type="hidden" name="backgroundColor" value={business.backgroundColor ?? "#F8FAFC"} />
                <input type="hidden" name="textColor" value={business.textColor ?? "#111827"} />
                <input type="hidden" name="buttonRadius" value={business.buttonRadius ?? 18} />
                <input type="hidden" name="bannerUrl" value={business.bannerUrl ?? ""} />

                {canUseAi ? (
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-3">
                    <h3 className="text-sm font-black">IA del catálogo</h3>
                    <FormGrid className="mt-3">
                      <FormField label="Tono de IA" hint="Define cómo conversa la IA con tus clientes.">
                        <Input name="tone" defaultValue={aiTone} placeholder="profesional y cercano" required maxLength={160} />
                      </FormField>
                      <FormField label="Mensaje si no sabe responder" hint="Respuesta segura cuando falta información.">
                        <Textarea name="fallbackMessage" defaultValue={aiFallback} rows={3} required maxLength={500} />
                      </FormField>
                    </FormGrid>
                    {canUseAdvancedSettings ? (
                      <div className="mt-3 grid gap-3">
                        <FormField label="Instrucciones IA" hint="Qué vender, qué preguntar y qué evitar.">
                          <Textarea name="instructions" defaultValue={aiInstructions} rows={4} placeholder="Ej: Recomienda productos según presupuesto y deriva a WhatsApp cuando el cliente quiera comprar." />
                        </FormField>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <ToggleField name="allowAutoLead" label="Crear leads automáticamente" hint="Registra oportunidades cuando la conversación muestra intención de compra." defaultChecked={allowAutoLead} />
                          <ToggleField name="humanHandoffEnabled" label="Derivar a humano" hint="Activa un mensaje de derivación cuando la IA no tenga suficiente contexto." defaultChecked={humanHandoffEnabled} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <input type="hidden" name="instructions" value={aiInstructions} />
                        {hiddenBoolean("allowAutoLead", allowAutoLead)}
                        {hiddenBoolean("humanHandoffEnabled", humanHandoffEnabled)}
                        <LockedFeature title="Automatización IA" description="Instrucciones avanzadas, leads automáticos y derivación inteligente están disponibles en Premium/Business." />
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <input type="hidden" name="tone" value={aiTone} />
                    <input type="hidden" name="fallbackMessage" value={aiFallback} />
                    <input type="hidden" name="instructions" value={aiInstructions} />
                    {hiddenBoolean("allowAutoLead", allowAutoLead)}
                    {hiddenBoolean("humanHandoffEnabled", humanHandoffEnabled)}
                    <LockedFeature title="IA del catálogo" description="La IA para ventas y automatización está disponible en planes superiores." />
                  </>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  {canUseAnalytics ? (
                    <InfoBox title="Analytics">Tu plan permite analítica avanzada cuando conectes los reportes del catálogo.</InfoBox>
                  ) : (
                    <LockedFeature title="Analytics" description="Métricas avanzadas y reportes de comportamiento están disponibles en Premium/Business." />
                  )}
                  {canUseCustomDomain ? (
                    <InfoBox title="Dominio personalizado">Tu plan permite conectar dominio propio desde el módulo de dominios.</InfoBox>
                  ) : (
                    <LockedFeature title="Dominio personalizado" description="Conecta tu propio dominio cuando actualices a un plan compatible." />
                  )}
                </div>
              </div>
            </SectionCard>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-16 xl:self-start">
          <Card className="p-3">
            <h2 className="text-base font-black">Vista previa</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--catalog-border)]" style={themeStyle}>
              <div className="bg-[var(--catalog-primary)] p-4 text-[var(--catalog-button-text)]">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] opacity-75">Catálogo público</p>
                <h3 className="mt-2 text-xl font-black">{business.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs opacity-80">{textOrPending(business.description, "Agrega una descripción para explicar qué vendes.")}</p>
              </div>
              <div className="grid gap-2 bg-[var(--catalog-bg)] p-3 text-xs text-[var(--catalog-text)]">
                <div className="rounded-xl bg-[var(--catalog-surface)] p-3 shadow-sm">
                  <p className="font-black">Producto destacado</p>
                  <p className="mt-1 text-[var(--catalog-text-muted)]">{productCount} productos · {categoryCount} categorías</p>
                  <span className="mt-3 inline-flex rounded-[var(--catalog-radius)] bg-[var(--catalog-primary)] px-3 py-2 font-black text-[var(--catalog-button-text)]">Consultar</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <h2 className="text-base font-black">Resumen</h2>
            <dl className="mt-3 grid gap-2 text-xs">
              <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
                <dt className="font-black text-[var(--app-text)]">Nombre público</dt>
                <dd className="mt-1 text-[var(--app-text-muted)]">{business.name}</dd>
              </div>
              <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
                <dt className="font-black text-[var(--app-text)]">URL pública</dt>
                <dd className="mt-1 break-all text-[var(--app-text-muted)]">{catalogPath}</dd>
              </div>
              <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
                <dt className="font-black text-[var(--app-text)]">WhatsApp</dt>
                <dd className="mt-1 text-[var(--app-text-muted)]">{textOrPending(business.whatsappNumber)}</dd>
              </div>
              <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
                <dt className="font-black text-[var(--app-text)]">Instagram</dt>
                <dd className="mt-1 text-[var(--app-text-muted)]">{instagramLabel(business.instagramUrl)}</dd>
              </div>
              <div className="rounded-xl bg-[var(--app-surface-muted)] p-3">
                <dt className="font-black text-[var(--app-text)]">Estado de catálogo</dt>
                <dd className="mt-1"><StatusBadge variant={business.isActive ? "success" : "danger"}>{business.isActive ? "Activo" : "Pausado"}</StatusBadge></dd>
              </div>
            </dl>
          </Card>

          <Card className="p-3">
            <h2 className="text-base font-black">Guardado seguro</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">
              Validamos permisos de tienda en servidor. Si intentas salir con cambios sin guardar, el navegador mostrará una confirmación.
            </p>
            <PendingSubmitButton className="mt-3 w-full rounded-xl bg-[var(--app-primary)] px-4 py-3 text-sm font-black text-[var(--app-button-text)] disabled:cursor-not-allowed disabled:opacity-60">
              Guardar cambios
            </PendingSubmitButton>
          </Card>
        </aside>

        <div className="sticky bottom-3 z-30 col-span-full mx-auto mt-4 w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-lg xl:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[var(--app-text-muted)]">Revisa los cambios antes de guardar</p>
            <PendingSubmitButton className="rounded-xl bg-[var(--app-primary)] px-5 py-2.5 text-sm font-black text-[var(--app-button-text)] disabled:cursor-not-allowed disabled:opacity-60">
              Guardar cambios
            </PendingSubmitButton>
          </div>
        </div>
      </form>
    </div>
  );
}
