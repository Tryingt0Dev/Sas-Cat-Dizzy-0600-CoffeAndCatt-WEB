import { prisma } from "@/lib/db";
import { getCurrentBusiness } from "@/lib/auth";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";

export default async function ConversationsPage() {
  const business = await getCurrentBusiness();
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
      <div className="space-y-4">
        {conversations.map((conversation) => (
          <Card key={conversation.id}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black">{conversation.customer?.name ?? conversation.customer?.phone ?? "Cliente web"}</h2>
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
        {conversations.length === 0 && <Card><p className="text-gray-500">Aún no hay conversaciones.</p></Card>}
      </div>
    </div>
  );
}
