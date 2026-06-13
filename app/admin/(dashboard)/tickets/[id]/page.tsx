import Link from "next/link";
import { TicketActions } from "@/src/components/admin/TicketActions";
import { Badge, PageHeader, Panel, secondaryButtonClass } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

function statusTone(status: string) {
  if (status === "resolved" || status === "closed") return "good";
  if (status === "pending") return "warn";
  return "neutral";
}

function priorityTone(priority: string) {
  if (priority === "urgent" || priority === "high") return "danger";
  if (priority === "normal") return "neutral";
  return "good";
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ticket, admins] = await Promise.all([
    prisma.ticket.findUniqueOrThrow({
      where: { id },
      include: {
        assignedTo: true,
        bot: true,
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              take: 10
            }
          }
        },
        notes: {
          orderBy: { createdAt: "desc" },
          include: { author: true }
        }
      }
    }),
    prisma.adminUser.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ticket.subject}
        description={`${ticket.requesterEmail || ticket.requesterName || "Visitor"} - ${ticket.bot?.name || "No bot"}`}
        action={
          <Link className={secondaryButtonClass} href="/admin/tickets">
            Back to tickets
          </Link>
        }
      />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="space-y-6">
          <Panel>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
              <Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
              <span className="text-sm text-slate-500">{ticket.createdAt.toLocaleString()}</span>
            </div>
            <h2 className="mb-3 text-lg font-semibold">Request</h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{ticket.message}</p>
          </Panel>

          {ticket.conversation ? (
            <Panel>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Conversation</h2>
                <Link className="text-sm font-medium text-la-green hover:underline" href={`/admin/conversations/${ticket.conversation.id}`}>
                  Open conversation
                </Link>
              </div>
              <div className="space-y-3">
                {ticket.conversation.messages.map((message) => (
                  <div key={message.id} className="rounded-md border border-la-line bg-la-surface p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Badge tone={message.role === "assistant" ? "good" : "neutral"}>{message.role}</Badge>
                      <span className="text-xs text-slate-500">{message.createdAt.toLocaleString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{message.content}</p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          {ticket.notes.length ? (
            <Panel>
              <h2 className="mb-4 text-lg font-semibold">Notes</h2>
              <div className="space-y-3">
                {ticket.notes.map((note) => (
                  <div key={note.id} className="rounded-md border border-la-line bg-la-surface p-3">
                    <div className="mb-2 text-xs text-slate-500">
                      {note.author?.name || note.author?.email || "Admin"} - {note.createdAt.toLocaleString()}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{note.note}</p>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>

        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Manage ticket</h2>
          <div className="mb-5 space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-slate-500">Assigned</div>
              <div className="font-semibold">{ticket.assignedTo?.name || ticket.assignedTo?.email || "Unassigned"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Requester</div>
              <div className="break-words font-semibold">{ticket.requesterEmail || ticket.requesterName || ticket.requesterPhone || "Visitor"}</div>
            </div>
          </div>
          <TicketActions
            ticketId={ticket.id}
            status={ticket.status}
            priority={ticket.priority}
            assignedToId={ticket.assignedToId}
            admins={admins.map((admin) => ({
              id: admin.id,
              label: admin.name ? `${admin.name} (${admin.email})` : admin.email
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}
