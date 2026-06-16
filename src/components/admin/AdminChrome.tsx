import Image from "next/image";
import Link from "next/link";
import { AdminNav } from "@/src/components/admin/AdminNav";
import { prisma } from "@/src/lib/db/prisma";

export async function AdminChrome({
  children,
  user
}: {
  children: React.ReactNode;
  user: { email: string; name?: string | null; roles: string[] };
}) {
  const settings = await prisma.appSettings.findFirst();
  const sourceCodeUrl = settings?.sourceCodeUrl || process.env.SOURCE_CODE_URL || "https://github.com/aldehm3e/tuwaiqx";

  return (
    <div className="min-h-screen bg-la-surface text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-la-line bg-white md:flex md:flex-col">
        <div className="border-b border-la-line px-5 py-5">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-10 w-16 items-center justify-center rounded-lg border border-la-line bg-white p-1 shadow-sm">
              <Image
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
                height={34}
                priority
                src="/tuwaiqx-icon.png"
                width={82}
              />
            </span>
            <span>
              <span className="block text-base font-semibold">TuwaiqX Admin</span>
            </span>
          </Link>
        </div>
        <AdminNav />
        <div className="border-t border-la-line p-4 text-xs leading-5 text-slate-500">
          <div>{settings?.organizationName || "Organization"}</div>
          <a className="font-medium text-la-green" href={sourceCodeUrl} rel="noreferrer" target="_blank">
            Source Code
          </a>
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-la-line bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">{settings?.organizationName || "TuwaiqX"}</div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-slate-500 sm:inline">{user.name || user.email}</span>
              <form action="/api/admin/logout" method="post">
                <button className="rounded-md border border-la-line px-3 py-2 text-sm font-semibold hover:bg-la-surface">
                  Logout
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
