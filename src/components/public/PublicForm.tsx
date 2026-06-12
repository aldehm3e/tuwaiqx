"use client";

import { useState } from "react";

export function PublicForm({
  slug,
  name,
  description,
  submitLabel,
  fields
}: {
  slug: string;
  name: string;
  description?: string | null;
  submitLabel: string;
  fields: Array<{ label: string; name: string; type: string; required: boolean; optionsJson: unknown }>;
}) {
  const [status, setStatus] = useState<{ message?: string; error?: string; loading?: boolean }>({});

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setStatus({ loading: true });
        const formData = new FormData(event.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        const response = await fetch(`/api/forms/${slug}/submit`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
        if (!response.ok) {
          setStatus({ error: data.error || "Submission failed." });
          return;
        }
        event.currentTarget.reset();
        setStatus({ message: data.message || "Submitted." });
      }}
    >
      <div>
        <h1 className="text-2xl font-semibold">{name}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {fields.map((field) => (
        <label key={field.name} className="block">
          <span className="text-sm font-medium">{field.label}</span>
          {field.type === "textarea" ? (
            <textarea
              className="mt-1 w-full rounded-md border border-la-line px-3 py-2 text-sm outline-none focus:border-la-green focus:ring-2 focus:ring-emerald-100"
              name={field.name}
              required={field.required}
              rows={5}
            />
          ) : (
            <input
              className="mt-1 w-full rounded-md border border-la-line px-3 py-2 text-sm outline-none focus:border-la-green focus:ring-2 focus:ring-emerald-100"
              name={field.name}
              required={field.required}
              type={field.type === "phone" ? "tel" : field.type}
            />
          )}
        </label>
      ))}
      <button
        className="rounded-md bg-la-green px-4 py-2 text-sm font-semibold text-white hover:bg-la-green-dark"
        disabled={status.loading}
        type="submit"
      >
        {status.loading ? "Submitting..." : submitLabel}
      </button>
      {status.message ? <p className="text-sm text-la-green">{status.message}</p> : null}
      {status.error ? <p className="text-sm text-red-600">{status.error}</p> : null}
    </form>
  );
}

