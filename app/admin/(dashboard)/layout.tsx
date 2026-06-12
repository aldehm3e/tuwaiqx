import { redirect } from "next/navigation";
import { AdminChrome } from "@/src/components/admin/AdminChrome";
import { requireAdminPage } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.appSettings.findFirst();
  if (!settings?.setupCompletedAt) {
    redirect("/admin/setup");
  }

  const user = await requireAdminPage();
  return <AdminChrome user={user}>{children}</AdminChrome>;
}
