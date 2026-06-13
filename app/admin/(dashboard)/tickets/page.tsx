import Link from "next/link";
import { SmartForm } from "@/src/components/admin/SmartForm";
import { Badge, Field, PageHeader, Panel, inputClass } from "@/src/components/admin/Ui";
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

export default async function TicketsPage() {
  const [tickets, bots] = await Promise.all([
    prisma.ticket.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { bot: true, assignedTo: true } }),
    prisma.bot.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Tickets" />
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="min-w-0 rounded-lg border border-la-line p-4">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link className="block break-words font-semibold text-ink hover:text-la-green" href={`/admin/tickets/${ticket.id}`}>
                      {ticket.subject}
                    </Link>
                    <p className="mt-1 break-words text-sm text-slate-500">
                      {ticket.requesterEmail || ticket.requesterName || "Visitor"} - {ticket.bot?.name || "No bot"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Assigned to {ticket.assignedTo?.name || ticket.assignedTo?.email || "Unassigned"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
                    <Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-700">{ticket.message}</p>
                <Link className="mt-3 inline-flex text-sm font-medium text-la-green hover:underline" href={`/admin/tickets/${ticket.id}`}>
                  Open ticket
                </Link>
              </div>
            ))}
            {tickets.length === 0 ? <p className="text-sm text-slate-500">No tickets yet.</p> : null}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Create ticket</h2>
          <SmartForm action="/api/admin/tickets" submitLabel="Create ticket" className="space-y-4">
            <Field label="Bot">
              <select className={inputClass} name="botId">
                <option value="">None</option>
                {bots.map((bot) => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Requester email">
              <input className={inputClass} name="requesterEmail" type="email" />
            </Field>
            <Field label="Subject">
              <input className={inputClass} name="subject" required />
            </Field>
            <Field label="Message">
              <textarea className={inputClass} name="message" rows={5} required />
            </Field>
            <Field label="Priority">
              <select className={inputClass} name="priority" defaultValue="normal">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </Field>
          </SmartForm>
        </Panel>
      </div>
    </div>
  );
}
