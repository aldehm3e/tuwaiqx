"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";
import { buttonClass, inputClass, secondaryButtonClass } from "@/src/components/admin/Ui";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; sourceUrl?: string | null; score: number }>;
};

type BotTesterBot = {
  id: string;
  slug: string;
  name: string;
  welcomeMessage: string;
  language: string;
  direction: "ltr" | "rtl";
  quickActions: string[];
};

function isArabicBot(bot?: Pick<BotTesterBot, "language" | "direction">) {
  return bot?.direction === "rtl" || bot?.language.toLowerCase().startsWith("ar");
}

function chatLanguage(bot?: Pick<BotTesterBot, "language" | "direction">) {
  return isArabicBot(bot) ? "ar" : "en";
}

function initialMessages(bot?: BotTesterBot): Message[] {
  return bot?.welcomeMessage ? [{ role: "assistant", content: bot.welcomeMessage }] : [];
}

export function BotTester({ bots }: { bots: BotTesterBot[] }) {
  const [botId, setBotId] = useState(bots[0]?.slug || "");
  const selectedBot = useMemo(() => bots.find((bot) => bot.slug === botId) || bots[0], [botId, bots]);
  const arabic = isArabicBot(selectedBot);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>(() => initialMessages(selectedBot));
  const [loading, setLoading] = useState(false);
  const labels = {
    empty: arabic
      ? "\u0627\u0628\u062f\u0623 \u0628\u0633\u0624\u0627\u0644 \u0623\u0648 \u0627\u062e\u062a\u0631 \u0623\u062d\u062f \u0627\u0644\u0623\u0632\u0631\u0627\u0631 \u0627\u0644\u0633\u0631\u064a\u0639\u0629."
      : "Ask a question or choose a quick action.",
    loading: arabic ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0641\u0643\u064a\u0631..." : "Thinking...",
    placeholder: arabic ? "\u0627\u0643\u062a\u0628 \u0633\u0624\u0627\u0644\u0643..." : "Ask the bot...",
    reset: arabic ? "\u0625\u0639\u0627\u062f\u0629" : "Reset",
    send: arabic ? "\u0625\u0631\u0633\u0627\u0644" : "Send",
    sources: arabic ? "\u0627\u0644\u0645\u0635\u0627\u062f\u0631" : "Sources"
  };

  function resetConversation(bot = selectedBot) {
    setMessages(initialMessages(bot));
    setConversationId(undefined);
    setMessage("");
  }

  async function sendMessage(text = message) {
    if (!text.trim() || !botId) {
      return;
    }

    setLoading(true);
    setMessages((current) => [...current, { role: "user", content: text }]);
    setMessage("");
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        botId,
        conversationId,
        language: chatLanguage(selectedBot),
        message: text,
        pageUrl: window.location.href
      })
    });
    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      setConversationId(data.conversationId);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer, sources: data.sources || [] }
      ]);
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "assistant", content: data.error || "The chat request failed." }
    ]);
  }

  return (
    <div>
      <div className="flex gap-2">
        <select
          className={inputClass}
          value={botId}
          onChange={(event) => {
            const nextBotId = event.target.value;
            const nextBot = bots.find((bot) => bot.slug === nextBotId);
            setBotId(nextBotId);
            resetConversation(nextBot);
          }}
        >
          {bots.map((bot) => (
            <option key={bot.id} value={bot.slug}>
              {bot.name}
            </option>
          ))}
        </select>
        <button className={secondaryButtonClass} type="button" onClick={() => resetConversation()}>
          {labels.reset}
        </button>
      </div>
      <div
        dir={selectedBot?.direction || "ltr"}
        lang={selectedBot?.language || "en"}
        className="mt-4 h-[30rem] overflow-y-auto rounded-lg border border-la-line bg-la-surface p-4"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">{labels.empty}</p>
        ) : (
          <div className="space-y-3">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`rounded-lg border p-3 text-sm leading-6 ${
                  item.role === "user"
                    ? selectedBot?.direction === "rtl"
                      ? "mr-8 border-emerald-100 bg-white"
                      : "ml-8 border-emerald-100 bg-white"
                    : selectedBot?.direction === "rtl"
                      ? "ml-8 border-la-line bg-white"
                      : "mr-8 border-la-line bg-white"
                }`}
              >
                <div className="whitespace-pre-wrap">{item.content}</div>
                {item.sources?.length ? (
                  <div className="mt-3 border-t border-la-line pt-2">
                    <div className="text-xs font-semibold uppercase text-slate-500">{labels.sources}</div>
                    <ul className="mt-1 space-y-1">
                      {item.sources.map((source, sourceIndex) => (
                        <li key={`${source.title}-${sourceIndex}`} className="text-xs text-slate-600">
                          {source.sourceUrl ? (
                            <a className="text-la-green underline" href={source.sourceUrl} target="_blank">
                              {source.title}
                            </a>
                          ) : (
                            source.title
                          )}{" "}
                          <span className="text-slate-400">score {source.score.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? <div className="text-sm text-slate-500">{labels.loading}</div> : null}
          </div>
        )}
      </div>
      {selectedBot?.quickActions.length ? (
        <div
          dir={selectedBot.direction}
          className="mt-3 max-w-full pb-2"
          style={{
            display: "flex",
            flexWrap: "nowrap",
            gap: "0.5rem",
            overflowX: "auto",
            overflowY: "hidden",
            scrollbarWidth: "thin"
          }}
        >
          {selectedBot.quickActions.map((action, index) => (
            <button
              key={`${action}-${index}`}
              className={secondaryButtonClass}
              style={{
                flex: "0 0 auto",
                maxWidth: "16rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
              type="button"
              disabled={loading}
              onClick={() => void sendMessage(action)}
            >
              {action}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex gap-2">
        <input
          className={inputClass}
          dir={selectedBot?.direction || "ltr"}
          lang={selectedBot?.language || "en"}
          value={message}
          placeholder={labels.placeholder}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void sendMessage();
            }
          }}
        />
        <button
          className={buttonClass}
          type="button"
          disabled={loading || !message.trim()}
          onClick={() => void sendMessage()}
          title={labels.send}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">{labels.send}</span>
        </button>
      </div>
    </div>
  );
}
