import { ProviderForm } from "@/src/components/admin/Forms";
import { Badge, PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function ModelsPage() {
  const providers = await prisma.modelProvider.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="Model providers" description="Configure Ollama/local models by default, or optional OpenAI-compatible endpoints through a clean adapter interface." />
      <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr className="border-b border-la-line">
                  <th className="py-3 pr-3">Name</th>
                  <th className="py-3 pr-3">Type</th>
                  <th className="py-3 pr-3">Models</th>
                  <th className="py-3 pr-3">Defaults</th>
                  <th className="py-3 pr-3">Health</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id} className="border-b border-la-line last:border-0">
                    <td className="py-3 pr-3 font-medium">{provider.name}</td>
                    <td className="py-3 pr-3">{provider.type}</td>
                    <td className="py-3 pr-3 text-slate-600">{provider.chatModel || "chat"} / {provider.embeddingModel || "embedding"}</td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-2">
                        {provider.isDefaultChat ? <Badge tone="good">chat</Badge> : null}
                        {provider.isDefaultEmbedding ? <Badge tone="good">embed</Badge> : null}
                      </div>
                    </td>
                    <td className="py-3 pr-3"><Badge tone={provider.lastHealthStatus === "ok" ? "good" : "neutral"}>{provider.lastHealthStatus || "not tested"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Add provider</h2>
          <ProviderForm />
        </Panel>
      </div>
    </div>
  );
}

