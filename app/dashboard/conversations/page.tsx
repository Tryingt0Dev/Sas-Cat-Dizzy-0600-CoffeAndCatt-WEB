import { prisma } from "@/lib/db";
import { requireStoreAccess } from "@/services/authorization";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { HelpTooltip } from "@/components/HelpTooltip";
import { LearningLink } from "@/components/LearningLink";
import { PageHeader } from "@/components/PageHeader";
import { SectionGuide } from "@/components/SectionGuide";

export default async function ConversationsPage() {
  const { business } = await requireStoreAccess({ permission: "manage_conversations" });
  const conversations = await prisma.conversation.findMany({
    where: { businessId: business.id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" }, take: 10 }
    },
    orderBy: { updatedAt: "desc" },
    take: 50
  });

  return (
    <div>
      <PageHeader eyebrow="Mensajes" title="Conversaciones" description="Revisa las últimas consultas del catálogo y el historial que deja el vendedor IA." />
      <SectionGuide
        eyebrow="Atención al cliente"
        title="Gestiona conversaciones y responde rápido"
        description="Sigue el hilo de cada consulta desde el cliente hasta la respuesta de la IA o tu equipo." 
        help="Busca mensajes abiertos para priorizar respuestas y evita que un cliente quede sin seguimiento." 
        actions={<LearningLink href="/dashboard/learning#conversaciones">Ver guía de conversaciones</LearningLink>}
      />
      <div className="space-y-4">
        {conversations.map((conversation) => (
          <Card key={conversation.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black">{conversation.customer?.name ?? conversation.customer?.phone ?? "Cliente web"}</h2>
                  <HelpTooltip description="Revisa si la conversación es abierta, cerrada o requiere seguimiento humano." />
                </div>
                <p className="text-sm text-gray-500">{conversation.channel} · {conversation.status}</p>
              </div>
              <p className="text-sm text-gray-400">{conversation.createdAt.toLocaleString("es-CL")}</p>
            </div>
            <div className="mt-4 space-y-2">
              {conversation.messages.map((message) => (
                <div key={message.id} className="rounded-2xl bg-gray-50 p-3 text-sm">
                  <span className="font-bold">{message.senderType}: </span>{message.content}
                </div>
              ))}
            </div>
          </Card>
        ))}
        {conversations.length === 0 && (
          <EmptyState
            title="Aún no hay conversaciones"
            description="Cuando tus clientes envíen consultas desde el catálogo, aparecerán aquí para que puedas responderlas." 
            action={<LearningLink href="/dashboard/learning#conversaciones">Aprender a usar mensajes</LearningLink>}
          />
        )}
      </div>
    </div>
  );
}
