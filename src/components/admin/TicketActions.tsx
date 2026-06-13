"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass, inputClass, secondaryButtonClass } from "@/src/components/admin/Ui";

const statuses = ["open", "pending", "resolved", "closed"] as const;
const priorities = ["low", "normal", "high", "urgent"] as const;

export function TicketActions({
  ticketId,
  status,
  priority,
  assignedToId,
  admins
}: {
  ticketId: string;
  status: string;
  priority: string;
  assignedToId?: string | null;
  admins: Array<{ id: string; label: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [assignment, setAssignment] = useState(assignedToId || "");
  const [selectedPriority, setSelectedPriority] = useState(priority);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updateTicket(payload: { status?: string; priority?: string; assignedToId?: string }, loadingKey: string) {
    setLoading(loadingKey);
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    setLoading(null);

    if (!response.ok) {
      setError(data.error || "Ticket update failed.");
      return;
    }

    setMessage(data.message || "Ticket updated.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 text-sm font-semibold text-ink">Status</div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((item) => (
            <button
              key={item}
              className={item === status ? buttonClass : secondaryButtonClass}
              disabled={loading !== null || item === status}
              type="button"
              onClick={() => void updateTicket({ status: item }, `status:${item}`)}
            >
              {loading === `status:${item}` ? "Updating..." : item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_12rem_auto]">
        <label className="block">
          <span className="text-sm font-medium text-ink">Assigned to</span>
          <select className={inputClass} value={assignment} onChange={(event) => setAssignment(event.target.value)}>
            <option value="">Unassigned</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Priority</span>
          <select className={inputClass} value={selectedPriority} onChange={(event) => setSelectedPriority(event.target.value)}>
            {priorities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            className={buttonClass}
            disabled={loading !== null}
            type="button"
            onClick={() => void updateTicket({ assignedToId: assignment, priority: selectedPriority }, "assignment")}
          >
            {loading === "assignment" ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {message ? <p className="text-sm text-la-green">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
