import { Field, inputClass } from "@/src/components/admin/Ui";
import { SmartForm } from "@/src/components/admin/SmartForm";

export function SetupForm() {
  return (
    <SmartForm action="/api/admin/setup" redirectTo="/admin" submitLabel="Finish setup" className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Admin email">
          <input className={inputClass} name="adminEmail" required type="email" />
        </Field>
        <Field label="Admin name">
          <input className={inputClass} name="adminName" />
        </Field>
        <Field label="Admin password" hint="Use at least 10 characters.">
          <input className={inputClass} minLength={10} name="adminPassword" required type="password" />
        </Field>
        <Field label="Organization name">
          <input className={inputClass} name="organizationName" required defaultValue="Peaceful Aid NGO" />
        </Field>
        <Field label="Website URL">
          <input className={inputClass} name="websiteUrl" required type="url" defaultValue="https://example.org" />
        </Field>
        <Field label="Allowed domains" hint="Comma or newline separated domains for the widget.">
          <input className={inputClass} name="allowedDomains" defaultValue="example.org" />
        </Field>
        <Field label="Default language">
          <input className={inputClass} name="defaultLanguage" defaultValue="en" />
        </Field>
        <Field label="Direction">
          <select className={inputClass} name="defaultDirection" defaultValue="ltr">
            <option value="ltr">LTR</option>
            <option value="rtl">RTL</option>
          </select>
        </Field>
        <Field label="Primary color">
          <input className={inputClass} name="primaryColor" defaultValue="#0f7b55" />
        </Field>
        <Field label="Secondary color">
          <input className={inputClass} name="secondaryColor" defaultValue="#2563eb" />
        </Field>
        <Field label="Ollama base URL">
          <input className={inputClass} name="ollamaBaseUrl" defaultValue="http://ollama:11434" />
        </Field>
        <Field label="Ollama chat model">
          <input className={inputClass} name="ollamaChatModel" defaultValue="llama3.1" />
        </Field>
        <Field label="Ollama embedding model">
          <input className={inputClass} name="ollamaEmbeddingModel" defaultValue="nomic-embed-text" />
        </Field>
      </div>
    </SmartForm>
  );
}

