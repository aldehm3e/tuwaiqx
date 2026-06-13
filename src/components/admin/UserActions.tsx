"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/src/components/admin/Ui";

export function UserActions({
  userId,
  userLabel,
  isActive,
  isSelf
}: {
  userId: string;
  userLabel: string;
  isActive: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextActive: boolean) {
    if (
      !window.confirm(
        nextActive
          ? `Enable ${userLabel}? They will be able to sign in again.`
          : `Disable ${userLabel}? They will no longer be able to sign in.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: nextActive })
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "User update failed.");
      return;
    }

    router.refresh();
  }

  async function deleteUser() {
    if (!window.confirm(`Permanently delete ${userLabel}? This removes the admin account but keeps audit history, tickets, and documents.`)) {
      return;
    }

    setLoading(true);
    setError("");
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE"
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "User deletion failed.");
      return;
    }

    router.refresh();
  }

  if (isSelf) {
    return <span className="text-xs text-slate-500">Current user</span>;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        className={
          isActive
            ? "inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            : buttonClass
        }
        disabled={loading}
        type="button"
        onClick={() => void updateStatus(!isActive)}
      >
        {loading ? "Working..." : isActive ? "Disable" : "Enable"}
      </button>
      <button
        className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        type="button"
        onClick={() => void deleteUser()}
      >
        Delete
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
