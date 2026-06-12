import { Field, PageHeader, Panel, inputClass } from "@/src/components/admin/Ui";
import { SmartForm } from "@/src/components/admin/SmartForm";
import { prisma } from "@/src/lib/db/prisma";

export default async function FormsPage() {
  const [forms, bots] = await Promise.all([
    prisma.form.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { fields: true, submissions: true } } } }),
    prisma.bot.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Forms" description="Create no-code public forms for volunteer applications, contact requests, registrations, appointments, and complaints." />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            {forms.map((form) => (
              <div key={form.id} className="rounded-lg border border-la-line p-4">
                <h2 className="font-semibold">{form.name}</h2>
                <p className="mt-1 text-sm text-slate-500">/{form.slug}</p>
                <p className="mt-3 text-sm text-slate-600">{form.description || "No description"}</p>
                <div className="mt-4 text-xs text-slate-500">{form._count.fields} fields · {form._count.submissions} submissions</div>
              </div>
            ))}
            {forms.length === 0 ? <p className="text-sm text-slate-500">No forms yet.</p> : null}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Create form</h2>
          <SmartForm action="/api/admin/forms" submitLabel="Create form" className="space-y-4">
            <Field label="Slug"><input className={inputClass} name="slug" required placeholder="volunteer-application" /></Field>
            <Field label="Name"><input className={inputClass} name="name" required /></Field>
            <Field label="Description"><textarea className={inputClass} name="description" rows={3} /></Field>
            <Field label="Bot"><select className={inputClass} name="botId"><option value="">None</option>{bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}</select></Field>
            <Field label="Submit label"><input className={inputClass} name="submitLabel" defaultValue="Submit" /></Field>
            <Field label="Webhook URL"><input className={inputClass} name="webhookUrl" /></Field>
          </SmartForm>
        </Panel>
      </div>
    </div>
  );
}

