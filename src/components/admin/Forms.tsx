import { Field, inputClass } from "@/src/components/admin/Ui";
import { SmartForm } from "@/src/components/admin/SmartForm";

export function SettingsForm({
  settings,
  allowedDomains
}: {
  settings: {
    organizationName: string;
    websiteUrl: string;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    primaryColor: string;
    secondaryColor: string;
    defaultLanguage: string;
    defaultDirection: string;
    supportEmail?: string | null;
    sourceCodeUrl: string;
    privacyPolicyUrl?: string | null;
    termsUrl?: string | null;
    dataRetentionDays: number;
  };
  allowedDomains: string;
}) {
  return (
    <SmartForm action="/api/admin/settings" method="PUT" submitLabel="Save settings" className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Organization name">
          <input className={inputClass} name="organizationName" defaultValue={settings.organizationName} required />
        </Field>
        <Field label="Website URL">
          <input className={inputClass} name="websiteUrl" defaultValue={settings.websiteUrl} required type="url" />
        </Field>
        <Field label="Logo URL">
          <input className={inputClass} name="logoUrl" defaultValue={settings.logoUrl || ""} />
        </Field>
        <Field label="Favicon URL">
          <input className={inputClass} name="faviconUrl" defaultValue={settings.faviconUrl || ""} />
        </Field>
        <Field label="Primary color">
          <input className={inputClass} name="primaryColor" defaultValue={settings.primaryColor} />
        </Field>
        <Field label="Secondary color">
          <input className={inputClass} name="secondaryColor" defaultValue={settings.secondaryColor} />
        </Field>
        <Field label="Default language">
          <input className={inputClass} name="defaultLanguage" defaultValue={settings.defaultLanguage} />
        </Field>
        <Field label="Direction">
          <select className={inputClass} name="defaultDirection" defaultValue={settings.defaultDirection}>
            <option value="ltr">LTR</option>
            <option value="rtl">RTL</option>
          </select>
        </Field>
        <Field label="Support email">
          <input className={inputClass} name="supportEmail" defaultValue={settings.supportEmail || ""} />
        </Field>
        <Field label="Source code URL">
          <input className={inputClass} name="sourceCodeUrl" defaultValue={settings.sourceCodeUrl} />
        </Field>
        <Field label="Privacy policy URL">
          <input className={inputClass} name="privacyPolicyUrl" defaultValue={settings.privacyPolicyUrl || ""} />
        </Field>
        <Field label="Terms URL">
          <input className={inputClass} name="termsUrl" defaultValue={settings.termsUrl || ""} />
        </Field>
        <Field label="Data retention days">
          <input className={inputClass} name="dataRetentionDays" defaultValue={settings.dataRetentionDays} type="number" />
        </Field>
      </div>
      <Field label="Allowed domains" hint="Comma or newline separated. Empty means public widget access is allowed.">
        <textarea className={inputClass} name="allowedDomains" rows={4} defaultValue={allowedDomains} />
      </Field>
    </SmartForm>
  );
}

export function ProviderForm() {
  return (
    <SmartForm action="/api/admin/providers" submitLabel="Save provider" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name">
          <input className={inputClass} name="name" required defaultValue="Ollama Local" />
        </Field>
        <Field label="Provider type">
          <select className={inputClass} name="type" defaultValue="OLLAMA">
            <option value="OLLAMA">Ollama/local</option>
            <option value="OPENAI_COMPATIBLE">OpenAI-compatible</option>
            <option value="MOCK">Mock</option>
          </select>
        </Field>
        <Field label="Base URL">
          <input className={inputClass} name="baseUrl" defaultValue="http://ollama:11434" />
        </Field>
        <Field label="API key">
          <input className={inputClass} name="apiKey" type="password" autoComplete="off" />
        </Field>
        <Field label="Chat model">
          <input className={inputClass} name="chatModel" defaultValue="llama3.1" />
        </Field>
        <Field label="Embedding model">
          <input className={inputClass} name="embeddingModel" defaultValue="nomic-embed-text" />
        </Field>
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input name="isDefaultChat" value="true" type="checkbox" defaultChecked />
          Default chat
        </label>
        <label className="flex items-center gap-2">
          <input name="isDefaultEmbedding" value="true" type="checkbox" defaultChecked />
          Default embeddings
        </label>
      </div>
    </SmartForm>
  );
}

export function BotForm({
  providers,
  action = "/api/admin/bots",
  redirectTo = "/admin/bots"
}: {
  providers: Array<{ id: string; name: string }>;
  action?: string;
  redirectTo?: string;
}) {
  return (
    <SmartForm action={action} method={action.includes("/api/admin/bots/") ? "PUT" : "POST"} redirectTo={redirectTo} submitLabel="Save bot" className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Slug">
          <input className={inputClass} name="slug" required placeholder="main" />
        </Field>
        <Field label="Name">
          <input className={inputClass} name="name" required placeholder="Main Website Assistant" />
        </Field>
        <Field label="Description">
          <input className={inputClass} name="description" />
        </Field>
        <Field label="Avatar URL">
          <input className={inputClass} name="avatarUrl" />
        </Field>
        <Field label="Welcome message">
          <input className={inputClass} name="welcomeMessage" defaultValue="Hello. How can I help?" />
        </Field>
        <Field label="Fallback message">
          <input className={inputClass} name="fallbackMessage" defaultValue="I could not find that information in the approved knowledge base." />
        </Field>
        <Field label="Primary color">
          <input className={inputClass} name="primaryColor" defaultValue="#0f7b55" />
        </Field>
        <Field label="Language">
          <input className={inputClass} name="language" defaultValue="en" />
        </Field>
        <Field label="Direction">
          <select className={inputClass} name="direction" defaultValue="ltr">
            <option value="ltr">LTR</option>
            <option value="rtl">RTL</option>
          </select>
        </Field>
        <Field label="Widget position">
          <select className={inputClass} name="position" defaultValue="bottom-right">
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
          </select>
        </Field>
        <Field label="Chat provider">
          <select className={inputClass} name="modelProviderId" defaultValue="">
            <option value="">Installation default</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Embedding provider">
          <select className={inputClass} name="embeddingProviderId" defaultValue="">
            <option value="">Installation default</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Max answer length">
          <input className={inputClass} name="maxAnswerLength" type="number" defaultValue={800} />
        </Field>
        <Field label="Temperature">
          <input className={inputClass} name="temperature" type="number" min="0" max="2" step="0.1" defaultValue="0.2" />
        </Field>
      </div>
      <Field label="System prompt">
        <textarea className={inputClass} name="systemPrompt" rows={5} defaultValue="You are a helpful organization assistant. Answer politely and prioritize approved organization knowledge." />
      </Field>
      <Field label="Quick actions" hint="One label per line.">
        <textarea className={inputClass} name="quickActions" rows={3} defaultValue={"Volunteer information\nDonation options\nContact support"} />
      </Field>
      <div className="grid gap-3 text-sm md:grid-cols-4">
        <label className="flex items-center gap-2">
          <input name="strictMode" value="true" type="checkbox" defaultChecked />
          Strict mode
        </label>
        <label className="flex items-center gap-2">
          <input name="showSources" value="true" type="checkbox" defaultChecked />
          Show sources
        </label>
        <label className="flex items-center gap-2">
          <input name="allowGeneralAnswer" value="true" type="checkbox" />
          Allow general answers
        </label>
        <label className="flex items-center gap-2">
          <input name="isActive" value="true" type="checkbox" defaultChecked />
          Active
        </label>
      </div>
    </SmartForm>
  );
}

export function ManualKnowledgeForm({ bots }: { bots: Array<{ id: string; name: string }> }) {
  return (
    <SmartForm action="/api/admin/documents/manual" redirectTo="/admin/knowledge" submitLabel="Add knowledge" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Bot assignment">
          <select className={inputClass} name="botId" defaultValue="">
            <option value="">All bots</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select className={inputClass} name="sourceType" defaultValue="manual">
            <option value="manual">Manual text</option>
            <option value="faq">FAQ</option>
          </select>
        </Field>
        <Field label="Title">
          <input className={inputClass} name="title" required />
        </Field>
        <Field label="Question">
          <input className={inputClass} name="question" />
        </Field>
        <Field label="Source URL">
          <input className={inputClass} name="sourceUrl" />
        </Field>
        <Field label="Tags">
          <input className={inputClass} name="tags" placeholder="volunteer, admissions" />
        </Field>
      </div>
      <Field label="Content">
        <textarea className={inputClass} name="content" required rows={10} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input name="approved" value="true" type="checkbox" defaultChecked />
        Approved for bot answers
      </label>
    </SmartForm>
  );
}

export function UploadKnowledgeForm({ bots }: { bots: Array<{ id: string; name: string }> }) {
  return (
    <SmartForm action="/api/admin/documents/upload" encType="multipart" redirectTo="/admin/knowledge" submitLabel="Upload and index" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Bot assignment">
          <select className={inputClass} name="botId" defaultValue="">
            <option value="">All bots</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Language">
          <input className={inputClass} name="language" placeholder="en or ar" />
        </Field>
        <Field label="Title">
          <input className={inputClass} name="title" placeholder="Optional title" />
        </Field>
        <Field label="Tags">
          <input className={inputClass} name="tags" />
        </Field>
      </div>
      <Field label="Files">
        <input className={inputClass} multiple name="files" required type="file" accept=".pdf,.doc,.docx,.txt,.md,.html,.htm,.csv,.xlsx,.json" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input name="approved" value="true" type="checkbox" defaultChecked />
        Approved for bot answers
      </label>
    </SmartForm>
  );
}

export function CrawlerForm({ bots }: { bots: Array<{ id: string; name: string }> }) {
  return (
    <SmartForm action="/api/admin/documents/crawler" redirectTo="/admin/knowledge" submitLabel="Crawl and index" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="URL">
          <input className={inputClass} name="url" type="url" required />
        </Field>
        <Field label="Bot assignment">
          <select className={inputClass} name="botId" defaultValue="">
            <option value="">All bots</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Depth limit">
          <input className={inputClass} name="depth" type="number" min={0} max={3} defaultValue={1} />
        </Field>
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input name="sameDomain" value="true" type="checkbox" defaultChecked />
          Same domain only
        </label>
        <label className="flex items-center gap-2">
          <input name="approved" value="true" type="checkbox" defaultChecked />
          Approved
        </label>
      </div>
    </SmartForm>
  );
}
