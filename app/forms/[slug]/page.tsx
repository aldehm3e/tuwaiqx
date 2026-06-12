import { notFound } from "next/navigation";
import { PublicForm } from "@/src/components/public/PublicForm";
import { Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await prisma.form.findUnique({
    where: { slug },
    include: { fields: { orderBy: { order: "asc" } } }
  });

  if (!form?.isActive) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-la-surface px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Panel>
          <PublicForm
            slug={form.slug}
            name={form.name}
            description={form.description}
            submitLabel={form.submitLabel}
            fields={form.fields}
          />
        </Panel>
      </div>
    </main>
  );
}
