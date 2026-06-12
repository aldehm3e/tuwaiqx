import { Field, PageHeader, Panel, inputClass } from "@/src/components/admin/Ui";
import { SmartForm } from "@/src/components/admin/SmartForm";
import { prisma } from "@/src/lib/db/prisma";

export default async function TicketsPage() {
  const [tickets, bots] = await Promise.all([
    prisma.ticket.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { bot: true, assignedTo: true } }),
    prisma.bot.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Tickets" description="Built-in human handoff for public-interest teams, without requiring paid live chat services." />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-lg border border-la-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="font-semibold">{ticket.subject}</h2><p className="mt-1 text-sm text-slate-500">{ticket.requesterEmail || ticket.requesterName || "Visitor"} · {ticket.bot?.name || "No bot"}</p></div>
                  <span className="text-xs uppercase text-slate-500">{ticket.status}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{ticket.message}</p>
              </div>
            ))}
            {tickets.length === 0 ? <p className="text-sm text-slate-500">No tickets yet.</p> : null}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Create ticket</h2>
          <SmartForm action="/api/admin/tickets" submitLabel="Create ticket" className="space-y-4">
            <Field label="Bot"><select className={inputClass} name="botId"><option value="">None</option>{bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}</select></Field>
            <Field label="Requester email"><input className={inputClass} name="requesterEmail" type="email" /></Field>
            <Field label="Subject"><input className={inputClass} name="subject" required /></Field>
            <Field label="Message"><textarea className={inputClass} name="message" rows={5} required /></Field>
            <Field label="Priority"><select className={inputClass} name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></Field>
          </SmartForm>
        </Panel>
      </div>
    </div>
  );
}

