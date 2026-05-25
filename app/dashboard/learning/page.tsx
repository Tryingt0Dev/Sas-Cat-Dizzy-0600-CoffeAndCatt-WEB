import { LearningLink } from "@/components/LearningLink";
import { InfoCard } from "@/components/InfoCard";
import { PageHeader } from "@/components/PageHeader";
import { SectionGuide } from "@/components/SectionGuide";
import { StepGuide } from "@/components/StepGuide";

export default function DashboardLearningPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Guía"
        title="Centro de aprendizaje para tu tienda"
        description="Todo lo que necesitas para usar el SaaS paso a paso, desde configurar tu tienda hasta vender con IA y evitar errores comunes."
        actions={
          <LearningLink href="#primeros-pasos">Ir a primeros pasos</LearningLink>
        }
      />

      <SectionGuide
        eyebrow="Aprende rápido"
        title="Usa el sistema con confianza"
        description="Lee cada sección según tu necesidad: configuración, productos, descuentos, imágenes, IA y métricas."
        help="Los temas están organizados en pasos claros. Si ya tienes dudas específicas, usa los enlaces rápidos de esta página."
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <LearningLink href="#primeros-pasos">Primeros pasos</LearningLink>
        <LearningLink href="#configurar-tienda">Configurar tienda</LearningLink>
        <LearningLink href="#productos">Agregar productos</LearningLink>
        <LearningLink href="#clientes">Clientes</LearningLink>
        <LearningLink href="#ventas">Ventas y pedidos</LearningLink>
        <LearningLink href="#ia">Usar IA</LearningLink>
        <LearningLink href="#faq">Preguntas frecuentes</LearningLink>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section id="primeros-pasos" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Primeros pasos</p>
            <h2 className="mt-3 text-2xl font-black text-gray-950">Pon tu tienda en marcha</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">Empieza por las acciones de alto impacto: WhatsApp, logo, productos y categorías. Cada paso te ayuda a recibir consultas más rápido.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard
                title="Configura tu WhatsApp"
                description="Es el canal principal para cerrar ventas. Sin número activo, los clientes no pueden contactarte desde el catálogo público."
              />
              <InfoCard
                title="Publica tu primer producto"
                description="Un catálogo con producto activo permite que los clientes vean tu oferta y comiencen a consultar o comprar."
              />
            </div>
          </section>

          <section id="configurar-tienda" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Configuración</p>
            <h2 className="mt-3 text-2xl font-black text-gray-950">Tu tienda y diseño</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">Aquí defines el nombre visible dentro del panel, la URL pública, el estilo del catálogo y las opciones de branding que tus clientes verán en el catálogo público.</p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="font-black text-gray-950">Nombre del panel interno</p>
                <p className="mt-1 text-sm text-gray-600">Este nombre ayuda a tu equipo a reconocer el panel en el dashboard, sin afectar la URL pública.</p>
              </div>
              <div>
                <p className="font-black text-gray-950">URL pública</p>
                <p className="mt-1 text-sm text-gray-600">El slug visible en /store/define cómo tus clientes acceden al catálogo público.</p>
              </div>
              <div>
                <p className="font-black text-gray-950">Temas y colores</p>
                <p className="mt-1 text-sm text-gray-600">Escoge un estilo coherente con tu marca. Si no tienes preferencia, elige un color principal que sea fácil de leer y un fondo claro.</p>
              </div>
            </div>
          </section>

          <section id="productos" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Productos</p>
            <h2 className="mt-3 text-2xl font-black text-gray-950">Agregar, editar y publicar</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">Cada producto debe tener nombre, precio y stock. Si quieres vender rápido, usa una descripción clara, una buena imagen y un precio visible.</p>
            <div className="mt-6 space-y-4">
              <InfoCard
                title="Precio y descuento"
                description="Establece el precio base y un precio anterior opcional para mostrar descuento. No uses descuentos por encima del 100%."
              />
              <InfoCard
                title="Stock y cantidad mínima"
                description="Mantén el stock real actualizado. Si el stock alcanza el mínimo, el dashboard te avisará con una alerta."
              />
              <InfoCard
                title="Estado del producto"
                description="Activo: visible en el catálogo. Borrador: guardado pero no visible. Archivado: histórico que no aparece para clientes."
              />
            </div>
          </section>

          <section id="clientes" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Clientes</p>
            <h2 className="mt-3 text-2xl font-black text-gray-950">Administra tu CRM</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">Registra clientes, actualiza su estado y usa notas internas para coordinar mejor a tu equipo de ventas.</p>
            <div className="mt-6 space-y-4">
              <InfoCard
                title="Información de contacto"
                description="Mantén el teléfono y email actualizados. Así puedes contactar al cliente rápidamente desde el panel." 
              />
              <InfoCard
                title="Estado y prioridad"
                description="Marca si el cliente está en seguimiento, interesado o cerrado. Usa el score para priorizar quien responde primero."
              />
            </div>
          </section>

          <section id="ventas" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Ventas</p>
            <h2 className="mt-3 text-2xl font-black text-gray-950">Convierte cotizaciones en pedidos</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">Solo crea pedidos cuando una cotización fue aceptada. Actualiza el estado del pedido para entregar mejor seguimiento.</p>
            <div className="mt-6 space-y-4">
              <InfoCard
                title="Cotizaciones aceptadas"
                description="Busca cotizaciones aceptadas y transfórmalas en pedidos para descontar stock automáticamente."
              />
              <InfoCard
                title="Estados del pedido"
                description="Usa estados como Preparación, Envío o Entregado para que el equipo y el cliente sepan qué sigue." 
              />
            </div>
          </section>

          <section id="imagenes" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Imágenes</p>
            <h2 className="mt-3 text-2xl font-black text-gray-950">Usa imágenes que vendan</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">Súbelas en JPG, PNG o WEBP. La imagen principal debe ser clara y mostrar el producto con fondo limpio.</p>
            <p className="mt-3 text-sm text-gray-500">Si la imagen no sube, revisa el tamaño y el formato. También puedes pegar una URL válida directamente.</p>
          </section>

          <section id="ia" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">IA</p>
            <h2 className="mt-3 text-2xl font-black text-gray-950">Asistente y ventas automáticas</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600">Esta sección controla cómo responde la IA en tu catálogo. Ajusta el tono, las instrucciones y el mensaje de fallback para que coincidan con tu estilo de ventas.</p>
            <div className="mt-6 space-y-4">
              <InfoCard
                title="Tono de la IA"
                description="Escribe cómo quieres que la IA hable: cercano, formal, juvenil, profesional o enfocado en ofertas." 
              />
              <InfoCard
                title="Datos de contacto"
                description="Activa WhatsApp para convertir consultas en ventas más rápido. Si no configuras un número, los clientes no podrán iniciar un chat."
              />
            </div>
          </section>

          <section id="faq" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">FAQ</p>
            <h2 className="mt-3 text-2xl font-black text-gray-950">Preguntas frecuentes y errores comunes</h2>
            <div className="mt-6 space-y-4">
              <div>
                <p className="font-black text-gray-950">¿Por qué no veo mis productos?</p>
                <p className="mt-1 text-sm text-gray-600">Si el producto está en estado Borrador o Archivado, no se muestra en el catálogo público.</p>
              </div>
              <div>
                <p className="font-black text-gray-950">¿Qué pasa si mi URL pública cambia?</p>
                <p className="mt-1 text-sm text-gray-600">Actualiza el slug en Ajustes. La nueva ruta será /store/tu-nuevo-slug y se aplicará a la experiencia pública.</p>
              </div>
              <div>
                <p className="font-black text-gray-950">¿Cómo evitar notas negativas?</p>
                <p className="mt-1 text-sm text-gray-600">Mantén los precios claros, la descripción honesta y responde rápido a consultas por WhatsApp o chat.</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Buena práctica</p>
            <h3 className="mt-3 text-xl font-black text-gray-950">Checklist rápido</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>1. Configura WhatsApp y datos de contacto.</li>
              <li>2. Sube un logo y banner para generar confianza.</li>
              <li>3. Publica al menos un producto activo.</li>
              <li>4. Revisa el catálogo público como cliente.</li>
              <li>5. Ajusta la IA para responder con tu tono.</li>
            </ul>
          </section>

          <StepGuide
            title="Cómo empezar"
            description="Sigue estos pasos para tener tu tienda lista de forma rápida y sin dudas."
            steps={[
              { title: "Configurar tienda", description: "Completa datos públicos y personaliza tu diseño." },
              { title: "Agregar productos", description: "Crea productos con nombres claros, precios y stock actual." },
              { title: "Probar IA", description: "Envía una consulta desde el catálogo para revisar respuestas." },
              { title: "Monitorear métricas", description: "Usa el dashboard para ver alertas de stock y clientes nuevos." }
            ]}
          />

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">¿Necesitas más ayuda?</p>
            <p className="mt-3 text-sm leading-6 text-gray-600">Consulta el dashboard principal para ver métricas y enlaces rápidos a cada sección del panel.</p>
            <div className="mt-5 space-y-3">
              <LearningLink href="/dashboard">Volver al panel</LearningLink>
              <LearningLink href="#productos">Guía de productos</LearningLink>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
