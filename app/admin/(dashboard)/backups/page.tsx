import { PageHeader, Panel } from "@/src/components/admin/Ui";

export default function BackupsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Backups" description="Use the included scripts to back up PostgreSQL, uploaded files, and configuration for self-hosted operations." />
      <Panel>
        <div className="space-y-4 text-sm leading-6 text-slate-700">
          <p>Run backups from the server shell with the same environment used by Docker Compose.</p>
          <pre className="overflow-x-auto rounded-md bg-la-surface p-4 text-xs">{`./scripts/backup.sh ./backups/tuwaiqx-$(date +%F)
./scripts/restore.sh ./backups/tuwaiqx-2026-06-12`}</pre>
          <p>Backups include a database dump, uploaded file archive, and selected configuration exports. Store them outside the application server and protect them as sensitive data.</p>
        </div>
      </Panel>
    </div>
  );
}

