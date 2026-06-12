"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/src/components/admin/Ui";

type SmartFormProps = {
  action: string;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  encType?: "json" | "multipart";
  redirectTo?: string;
  submitLabel?: string;
  children: React.ReactNode;
  className?: string;
};

function formDataToJson(form: HTMLFormElement) {
  const formData = new FormData(form);
  const payload: Record<string, FormDataEntryValue | boolean> = {};
  formData.forEach((value, key) => {
    payload[key] = value;
  });
  for (const element of form.querySelectorAll<HTMLInputElement>("input[type='checkbox'][name]")) {
    payload[element.name] = element.checked;
  }
  return payload;
}

export function SmartForm({
  action,
  method = "POST",
  encType = "json",
  redirectTo,
  submitLabel = "Save",
  children,
  className
}: SmartFormProps) {
  const router = useRouter();
  const [state, setState] = useState<{ loading: boolean; message?: string; error?: string }>({
    loading: false
  });

  return (
    <form
      className={className}
      onSubmit={async (event) => {
        event.preventDefault();
        setState({ loading: true });
        const form = event.currentTarget;
        const formData = new FormData(form);
        const response = await fetch(action, {
          method,
          headers: encType === "json" ? { "content-type": "application/json" } : undefined,
          body: encType === "json" ? JSON.stringify(formDataToJson(form)) : formData
        });

        const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
        if (!response.ok) {
          setState({ loading: false, error: data.error || "The request failed." });
          return;
        }

        form.reset();
        setState({ loading: false, message: data.message || "Saved." });
        router.refresh();
        if (redirectTo) {
          router.push(redirectTo);
        }
      }}
    >
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className={buttonClass} disabled={state.loading} type="submit">
          {state.loading ? "Working..." : submitLabel}
        </button>
        {state.message ? <span className="text-sm text-la-green">{state.message}</span> : null}
        {state.error ? <span className="text-sm text-red-600">{state.error}</span> : null}
      </div>
    </form>
  );
}
