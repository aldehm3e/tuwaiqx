"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAction({
  action,
  label = "Delete",
  confirmMessage,
  redirectTo
}: {
  action: string;
  label?: string;
  confirmMessage: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="inline-flex items-center gap-2">
      <button
        className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        type="button"
        onClick={async () => {
          if (!window.confirm(confirmMessage)) {
            return;
          }

          setLoading(true);
          setError("");
          const response = await fetch(action, { method: "DELETE" });
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          setLoading(false);

          if (!response.ok) {
            setError(data.error || "Delete failed.");
            return;
          }

          router.refresh();
          if (redirectTo) {
            router.push(redirectTo);
          }
        }}
      >
        {loading ? "Deleting..." : label}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
