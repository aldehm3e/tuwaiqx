export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function splitLines(value?: string | null) {
  return (value || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

