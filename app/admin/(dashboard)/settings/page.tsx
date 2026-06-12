import { SettingsForm } from "@/src/components/admin/Forms";
import { PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function SettingsPage() {
  const settings = await prisma.appSettings.findFirstOrThrow();
  const allowedDomains = await prisma.allowedDomain.findMany({ orderBy: { domain: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="Organization settings" description="Global branding, website, privacy, source code link, direction, and widget domain controls." />
      <Panel>
        <SettingsForm settings={settings} allowedDomains={allowedDomains.map((domain) => domain.domain).join("\n")} />
      </Panel>
    </div>
  );
}

