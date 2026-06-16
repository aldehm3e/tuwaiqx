"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { secondaryButtonClass } from "@/src/components/admin/Ui";

export function ReindexAction({
  action,
  label = "Re-index",
  confirmMessage
}: {
  action: string;
  label?: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const working = loading || isPending;

  return (
    <div className="inline-flex items-center gap-2">
      <button
        className={`${secondaryButtonClass} gap-2`}
        disabled={working}
        type="button"
        onClick={async () => {
          if (!window.confirm(confirmMessage)) {
            return;
          }

          setLoading(true);
          setMessage("");
          setError("");
          const response = await fetch(action, { method: "POST" });
          const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
          setLoading(false);

          if (!response.ok) {
            setError(data.error || "Re-index failed.");
            return;
          }

          setMessage(data.message || "Re-indexed.");
          startTransition(() => {
            router.refresh();
          });
        }}
      >
        <RefreshCw aria-hidden="true" className={`h-4 w-4 ${working ? "animate-spin" : ""}`} />
        {loading ? "Re-indexing..." : isPending ? "Updating..." : label}
      </button>
      {message ? <span className="text-xs text-la-green">{message}</span> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
