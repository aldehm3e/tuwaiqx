"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProviderActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"test" | "delete" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function retest() {
    setLoading("test");
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/providers/${id}`, { method: "PATCH" });
    const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    setLoading(null);

    if (!response.ok) {
      setError(data.error || "Health check failed.");
      return;
    }

    setMessage(data.message || "Health checked.");
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Delete ${name}? Bots using this provider will fall back to the installation default.`)) {
      return;
    }

    setLoading("delete");
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/providers/${id}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(null);

    if (!response.ok) {
      setError(data.error || "Delete failed.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="rounded-md border border-la-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-la-surface disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading !== null}
        type="button"
        onClick={() => void retest()}
      >
        {loading === "test" ? "Testing..." : "Retest"}
      </button>
      <button
        className="rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading !== null}
        type="button"
        onClick={() => void remove()}
      >
        {loading === "delete" ? "Deleting..." : "Delete"}
      </button>
      {message ? <span className="text-xs text-la-green">{message}</span> : null}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
