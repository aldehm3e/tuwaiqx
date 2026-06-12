import { redirect } from "next/navigation";
import { LoginForm } from "@/src/components/admin/LoginForm";
import { Panel } from "@/src/components/admin/Ui";
import { getCurrentAdmin } from "@/src/lib/auth/session";
import { prisma } from "@/src/lib/db/prisma";

export default async function LoginPage() {
  const settings = await prisma.appSettings.findFirst();
  if (!settings?.setupCompletedAt) {
    redirect("/admin/setup");
  }

  const user = await getCurrentAdmin();
  if (user) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-la-surface px-4 py-10">
      <Panel className="w-full max-w-md">
        <div className="mb-6">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-la-green font-bold text-white">
            TX
          </div>
          <h1 className="text-2xl font-semibold text-ink">Admin login</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in to manage bots, knowledge, conversations, tickets, forms, and system settings.
          </p>
        </div>
        <LoginForm />
      </Panel>
    </main>
  );
}
