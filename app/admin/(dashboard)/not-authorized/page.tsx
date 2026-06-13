import Link from "next/link";
import { PageHeader, Panel, secondaryButtonClass } from "@/src/components/admin/Ui";

export default function NotAuthorizedPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Not allowed"
        description="Your role does not have permission to open this page or perform this action."
        action={
          <Link className={secondaryButtonClass} href="/admin">
            Back to dashboard
          </Link>
        }
      />
      <Panel>
        <p className="text-sm leading-6 text-slate-600">
          Ask an Owner to update your role if you need access to this area.
        </p>
      </Panel>
    </div>
  );
}
