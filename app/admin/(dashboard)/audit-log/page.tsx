import { PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true } });
  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Important admin actions are recorded locally for accountability and troubleshooting." />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500"><tr className="border-b border-la-line"><th className="py-3 pr-3">Time</th><th className="py-3 pr-3">User</th><th className="py-3 pr-3">Action</th><th className="py-3 pr-3">Entity</th></tr></thead>
            <tbody>{logs.map((log) => <tr key={log.id} className="border-b border-la-line last:border-0"><td className="py-3 pr-3">{log.createdAt.toLocaleString()}</td><td className="py-3 pr-3">{log.user?.email || "system"}</td><td className="py-3 pr-3">{log.action}</td><td className="py-3 pr-3">{log.entity} {log.entityId || ""}</td></tr>)}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

