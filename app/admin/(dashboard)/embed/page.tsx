import { PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export const dynamic = "force-dynamic";

function defaultEmbedCode(appUrl: string, slug: string) {
  return `<script
  src="${appUrl}/widget.js"
  data-bot-id="${slug}">
</script>`;
}

function customizableEmbedCode(appUrl: string, slug: string) {
  return `<script
  src="${appUrl}/widget.js"
  data-bot-id="${slug}"
  data-launcher-icon="https://example.org/chat-icon.png"

  data-primary-color="#1B8354"
  data-text-color="#161616"
  data-muted-color="#6C737F"
  data-border-color="#D2D6DB"
  data-panel-background="#FFFFFF"
  data-messages-background="#F9FAFB"
  data-surface-color="#F3F4F6"
  data-message-background="#FFFFFF"
  data-user-message-background="#EAF6EF"

  data-quick-action-background="#FFFFFF"
  data-quick-action-color="#1B8354"

  data-send-background="#1B8354"
  data-send-color="#FFFFFF"
  data-launcher-background="#1B8354"

  data-panel-width="390px"
  data-panel-height="650px"
  data-launcher-width="72px"
  data-launcher-height="72px"
  data-panel-radius="16px"
  data-message-radius="12px"
  data-button-radius="8px"
  data-launcher-radius="16px"
  data-panel-shadow="0 12px 30px rgba(22, 22, 22, 0.16)"
  data-launcher-shadow="0 10px 24px rgba(22, 22, 22, 0.18)"

  data-font-family="IBM Plex Sans Arabic, Arial, sans-serif"
  data-direction="rtl"
  data-position="bottom-right">
</script>

<style>
  [data-tuwaiqx-widget="${slug}"]::part(wrap) {
    z-index: 9999;
  }

  [data-tuwaiqx-widget="${slug}"]::part(panel) {
    border-radius: 16px;
    border: 1px solid #D2D6DB;
    box-shadow: 0 12px 30px rgba(22, 22, 22, 0.16);
    font-family: "IBM Plex Sans Arabic", Arial, sans-serif;
  }

  [data-tuwaiqx-widget="${slug}"]::part(header) {
    background: #1B8354;
    color: #FFFFFF;
    border-bottom: 1px solid #166A45;
  }

  [data-tuwaiqx-widget="${slug}"]::part(heading) {
    min-width: 0;
  }

  [data-tuwaiqx-widget="${slug}"]::part(title) {
    font-weight: 800;
  }

  [data-tuwaiqx-widget="${slug}"]::part(organization) {
    color: rgba(255, 255, 255, 0.82);
  }

  [data-tuwaiqx-widget="${slug}"]::part(header-actions) {
    gap: 6px;
  }

  [data-tuwaiqx-widget="${slug}"]::part(tool),
  [data-tuwaiqx-widget="${slug}"]::part(language-toggle),
  [data-tuwaiqx-widget="${slug}"]::part(clear-button),
  [data-tuwaiqx-widget="${slug}"]::part(close-button) {
    border-radius: 8px;
    border-color: rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.12);
    color: #FFFFFF;
  }

  [data-tuwaiqx-widget="${slug}"]::part(messages) {
    background: #F9FAFB;
  }

  [data-tuwaiqx-widget="${slug}"]::part(message-entry) {
    max-width: 88%;
  }

  [data-tuwaiqx-widget="${slug}"]::part(message-entry-user) {
    margin-left: auto;
  }

  [data-tuwaiqx-widget="${slug}"]::part(message-entry-assistant) {
    margin-right: auto;
  }

  [data-tuwaiqx-widget="${slug}"]::part(message) {
    border-radius: 12px;
    border-color: #D2D6DB;
    line-height: 1.6;
  }

  [data-tuwaiqx-widget="${slug}"]::part(message-user) {
    background: #EAF6EF;
    border-color: #B8E1C8;
  }

  [data-tuwaiqx-widget="${slug}"]::part(message-assistant) {
    background: #FFFFFF;
  }

  [data-tuwaiqx-widget="${slug}"]::part(sources) {
    margin-top: 8px;
  }

  [data-tuwaiqx-widget="${slug}"]::part(sources-title) {
    color: #1B8354;
  }

  [data-tuwaiqx-widget="${slug}"]::part(source-link),
  [data-tuwaiqx-widget="${slug}"]::part(source) {
    color: #1B8354;
  }

  [data-tuwaiqx-widget="${slug}"]::part(feedback) {
    gap: 6px;
  }

  [data-tuwaiqx-widget="${slug}"]::part(feedback-button),
  [data-tuwaiqx-widget="${slug}"]::part(helpful-button),
  [data-tuwaiqx-widget="${slug}"]::part(not-helpful-button) {
    border-radius: 8px;
    border-color: #D2D6DB;
    background: #FFFFFF;
  }

  [data-tuwaiqx-widget="${slug}"]::part(status) {
    color: #6C737F;
  }

  [data-tuwaiqx-widget="${slug}"]::part(quick-actions) {
    background: #FFFFFF;
    border-top: 1px solid #D2D6DB;
  }

  [data-tuwaiqx-widget="${slug}"]::part(quick-action) {
    background: #FFFFFF;
    color: #1B8354;
    border: 1px solid #D2D6DB;
    border-radius: 8px;
    font-weight: 700;
  }

  [data-tuwaiqx-widget="${slug}"]::part(quick-action):hover {
    background: #F3F4F6;
    border-color: #1B8354;
  }

  [data-tuwaiqx-widget="${slug}"]::part(form) {
    background: #FFFFFF;
    border-top: 1px solid #D2D6DB;
  }

  [data-tuwaiqx-widget="${slug}"]::part(input) {
    border-radius: 8px;
    border: 1px solid #D2D6DB;
    font-family: "IBM Plex Sans Arabic", Arial, sans-serif;
  }

  [data-tuwaiqx-widget="${slug}"]::part(input):focus {
    border-color: #1B8354;
    outline: 2px solid rgba(27, 131, 84, 0.18);
  }

  [data-tuwaiqx-widget="${slug}"]::part(send-button) {
    background: #1B8354;
    color: #FFFFFF;
    border-radius: 8px;
  }

  [data-tuwaiqx-widget="${slug}"]::part(footer) {
    background: #FFFFFF;
    color: #6C737F;
    border-top: 1px solid #D2D6DB;
  }

  [data-tuwaiqx-widget="${slug}"]::part(launcher) {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    background: #1B8354;
    box-shadow: 0 10px 24px rgba(22, 22, 22, 0.18);
  }

  [data-tuwaiqx-widget="${slug}"]::part(launcher-icon) {
    width: 34px;
    height: 34px;
    object-fit: contain;
  }

  @media (max-width: 768px) {
    [data-tuwaiqx-widget="${slug}"]::part(panel) {
      width: calc(100dvw - 20px);
      height: calc(100dvh - 20px);
      max-height: calc(100dvh - 20px);
      border-radius: 16px;
    }
  }
</style>`;
}

export default async function EmbedPage() {
  const bots = await prisma.bot.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } });
  const settings = await prisma.appSettings.findFirstOrThrow();
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <PageHeader title="Widget embed" description="Copy this standalone script into a website. The widget uses Shadow DOM, localStorage conversation continuity, RTL/LTR config, feedback, and sources." />
      <Panel>
        <div className="space-y-6">
          {bots.map((bot) => (
            <div key={bot.id} className="rounded-lg border border-la-line bg-la-surface p-4">
              <h2 className="font-semibold">{bot.name}</h2>
              <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="min-w-0 space-y-4">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Option 1: default embed</div>
                    <pre className="mt-2 overflow-x-auto rounded-md bg-white p-3 text-xs text-slate-700">{defaultEmbedCode(appUrl, bot.slug)}</pre>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">Option 2: fully customizable embed</div>
                    <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-white p-3 text-xs text-slate-700">{customizableEmbedCode(appUrl, bot.slug)}</pre>
                  </div>
                </div>
                <div className="rounded-lg border border-la-line bg-white p-4">
                  <div className="text-xs font-semibold uppercase text-slate-500">Preview</div>
                  <div className="mt-4 rounded-xl border border-la-line bg-white shadow-soft">
                    <div className="border-b border-la-line bg-la-surface p-3">
                      <div className="text-sm font-semibold">{bot.name}</div>
                      <div className="text-xs text-slate-500">{settings.organizationName}</div>
                    </div>
                    <div className="min-h-36 p-3">
                      <div className="w-fit max-w-full rounded-lg border border-la-line bg-white px-3 py-2 text-sm text-slate-700">
                        {bot.welcomeMessage}
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto border-t border-la-line p-3">
                      <span className="shrink-0 rounded-md border border-la-line bg-la-surface px-3 py-2 text-xs">Quick action</span>
                      <span className="shrink-0 rounded-md border border-la-line bg-la-surface px-3 py-2 text-xs">Another action</span>
                    </div>
                    <div className="border-t border-la-line bg-la-surface p-2 text-xs text-slate-500">Powered by TuwaiqX</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">WordPress</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Paste the script into a theme footer, a custom HTML block, or a trusted header/footer injection plugin. Add your WordPress domain in Allowed Domains.</p>
            </div>
            <div>
              <h3 className="font-semibold">Static websites</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Paste the script before the closing body tag. Verify that the site can reach {appUrl} over HTTPS in production.</p>
            </div>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Allowed domains reminder: configure the exact hostnames for {settings.organizationName} in Settings before production use.
          </div>
        </div>
      </Panel>
    </div>
  );
}
