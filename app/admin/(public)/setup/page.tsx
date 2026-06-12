import { redirect } from "next/navigation";
import { SetupForm } from "@/src/components/admin/SetupForm";
import { Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function SetupPage() {
  const settings = await prisma.appSettings.findFirst();
  if (settings?.setupCompletedAt) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-la-surface px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-la-green text-base font-bold text-white">
            TX
          </div>
          <h1 className="text-3xl font-semibold text-ink">Set up TuwaiqX</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Create the first owner account, configure your organization profile, add allowed domains,
            and point the default provider at Ollama or another local OpenAI-compatible endpoint.
          </p>
        </div>
        <Panel>
          <SetupForm />
        </Panel>
      </div>
    </main>
  );
}
