import clsx from "clsx";

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 border-b border-la-line pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-semibold tracking-normal text-ink">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Panel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={clsx("min-w-0 rounded-lg border border-la-line bg-white p-5 shadow-soft", className)}>{children}</section>;
}

export function StatCard({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <div className="rounded-lg border border-la-line bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-normal text-slate-500">{label}</div>
      <div
        className={clsx("mt-2 text-2xl font-semibold", {
          "text-ink": tone === "neutral",
          "text-la-green": tone === "good",
          "text-la-amber": tone === "warn"
        })}
      >
        {value}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  return (
    <span
      className={clsx("inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium", {
        "border-slate-200 bg-slate-50 text-slate-700": tone === "neutral",
        "border-emerald-200 bg-emerald-50 text-emerald-700": tone === "good",
        "border-amber-200 bg-amber-50 text-amber-700": tone === "warn",
        "border-red-200 bg-red-50 text-red-700": tone === "danger"
      })}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-la-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-la-green focus:ring-2 focus:ring-emerald-100";

export const buttonClass =
  "inline-flex items-center justify-center rounded-md bg-la-green px-3 py-2 text-sm font-semibold text-white transition hover:bg-la-green-dark focus-ring disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-md border border-la-line bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-la-surface focus-ring";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-la-line bg-la-surface p-8 text-center">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
