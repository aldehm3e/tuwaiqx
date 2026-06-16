"use client";

import { useState } from "react";
import clsx from "clsx";

export function CopyButton({
  text,
  label = "Copy",
  className
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md border border-la-line bg-white px-2 py-1 text-xs font-semibold text-ink transition hover:bg-la-surface focus-ring",
        className
      )}
      type="button"
      onClick={() => void copy()}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
