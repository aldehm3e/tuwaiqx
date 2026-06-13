import { Badge, Field, PageHeader, Panel, inputClass } from "@/src/components/admin/Ui";
import { SmartForm } from "@/src/components/admin/SmartForm";
import { UserActions } from "@/src/components/admin/UserActions";
import { requireAdminPage } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";

export default async function UsersPage() {
  const currentAdmin = await requireAdminPage("manage_users");
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "desc" },
    include: { roles: { include: { role: true } } }
  });
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="Admin users" description="Invite/create local admin accounts, assign roles, disable access, and audit actions." />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr className="border-b border-la-line">
                  <th className="py-3 pr-3">User</th>
                  <th className="py-3 pr-3">Roles</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Last login</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-la-line last:border-0">
                    <td className="py-3 pr-3">
                      <div className="font-medium">{user.name || user.email}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="py-3 pr-3 text-slate-600">{user.roles.map((role) => role.role.name).join(", ")}</td>
                    <td className="py-3 pr-3"><Badge tone={user.isActive ? "good" : "danger"}>{user.isActive ? "active" : "disabled"}</Badge></td>
                    <td className="py-3 pr-3 text-slate-500">{user.lastLoginAt?.toLocaleString() || "Never"}</td>
                    <td className="py-3 pr-3">
                      <UserActions
                        userId={user.id}
                        userLabel={user.name || user.email}
                        isActive={user.isActive}
                        isSelf={user.id === currentAdmin.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Create admin</h2>
          <SmartForm action="/api/admin/users" submitLabel="Create user" className="space-y-4">
            <Field label="Email"><input className={inputClass} name="email" type="email" required /></Field>
            <Field label="Name"><input className={inputClass} name="name" /></Field>
            <Field label="Temporary password"><input className={inputClass} name="password" type="password" minLength={10} required /></Field>
            <Field label="Role">
              <select className={inputClass} name="roleId" required>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </Field>
          </SmartForm>
        </Panel>
      </div>
    </div>
  );
}
