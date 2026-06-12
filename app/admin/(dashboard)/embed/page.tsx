import { PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function EmbedPage() {
  const bots = await prisma.bot.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } });
  const settings = await prisma.appSettings.findFirstOrThrow();
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <PageHeader title="Widget embed" description="Copy this standalone script into a website. The widget uses Shadow DOM, localStorage conversation continuity, RTL/LTR config, feedback, and sources." />
      <Panel>
        <div className="space-y-6">
          {bots.map((bot) => (
            <div key={bot.id} className="rounded-lg border border-la-line bg-la-surface p-4">
              <h2 className="font-semibold">{bot.name}</h2>
              <pre className="mt-3 overflow-x-auto rounded-md bg-white p-3 text-xs text-slate-700">{`<script
  src="${appUrl}/widget.js"
  data-bot-id="${bot.slug}">
</script>`}</pre>
            </div>
          ))}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">WordPress</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Paste the script into a theme footer, a custom HTML block, or a trusted header/footer injection plugin. Add your WordPress domain in Allowed Domains.</p>
            </div>
            <div>
              <h3 className="font-semibold">Static websites</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Paste the script before the closing body tag. Verify that the site can reach {appUrl} over HTTPS in production.</p>
            </div>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Allowed domains reminder: configure the exact hostnames for {settings.organizationName} in Settings before production use.
          </div>
        </div>
      </Panel>
    </div>
  );
}

