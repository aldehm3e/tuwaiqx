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
        <Field label="Provider name">
          <input className={inputClass} name="providerName" defaultValue="Ollama Local" />
        </Field>
        <Field label="Provider type" hint="Use OpenAI-compatible for external APIs or local runtimes such as LM Studio, llama.cpp, LocalAI, vLLM, or SGLang.">
          <select className={inputClass} name="providerType" defaultValue="OLLAMA">
            <option value="OLLAMA">Ollama API</option>
            <option value="OPENAI_COMPATIBLE">OpenAI-compatible API/runtime</option>
            <option value="MOCK">Mock</option>
          </select>
        </Field>
        <Field label="Provider base URL" hint="Examples: LM Studio http://127.0.0.1:1234/v1, llama.cpp http://127.0.0.1:8080/v1, Docker-to-Windows http://host.docker.internal:1234/v1.">
          <input className={inputClass} name="providerBaseUrl" defaultValue="http://ollama:11434" />
        </Field>
        <Field label="API key" hint="Leave empty for local runtimes unless the runtime requires a key.">
          <input className={inputClass} name="providerApiKey" type="password" autoComplete="off" />
        </Field>
        <Field label="Chat model" hint="Use the exact chat model name returned by the runtime's /v1/models endpoint.">
          <input className={inputClass} name="providerChatModel" defaultValue="llama3.1" />
        </Field>
        <Field label="Embedding model" hint="Use the exact embedding model name returned by the runtime's /v1/models endpoint. Re-index knowledge after changing it.">
          <input className={inputClass} name="providerEmbeddingModel" defaultValue="nomic-embed-text" />
        </Field>
      </div>
    </SmartForm>
  );
}
