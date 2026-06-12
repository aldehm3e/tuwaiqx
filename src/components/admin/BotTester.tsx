"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { buttonClass, inputClass, secondaryButtonClass } from "@/src/components/admin/Ui";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; sourceUrl?: string | null; score: number }>;
};

export function BotTester({ bots }: { bots: Array<{ id: string; slug: string; name: string }> }) {
  const [botId, setBotId] = useState(bots[0]?.slug || "");
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

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
      body: JSON.stringify({ botId, conversationId, message: text, pageUrl: window.location.href })
    });
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setConversationId(data.conversationId);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer, sources: data.sources || [] }
      ]);
    } else {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.error || "The chat request failed." }
      ]);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <select className={inputClass} value={botId} onChange={(event) => setBotId(event.target.value)}>
          {bots.map((bot) => (
            <option key={bot.id} value={bot.slug}>
              {bot.name}
            </option>
          ))}
        </select>
        <button
          className={secondaryButtonClass}
          type="button"
          onClick={() => {
            setMessages([]);
            setConversationId(undefined);
          }}
        >
          Reset
        </button>
      </div>
      <div className="mt-4 h-[30rem] overflow-y-auto rounded-lg border border-la-line bg-la-surface p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">Ask a question using approved knowledge.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`rounded-lg border p-3 text-sm leading-6 ${
                  item.role === "user"
                    ? "ml-8 border-emerald-100 bg-white"
                    : "mr-8 border-la-line bg-white"
                }`}
              >
                <div className="whitespace-pre-wrap">{item.content}</div>
                {item.sources?.length ? (
                  <div className="mt-3 border-t border-la-line pt-2">
                    <div className="text-xs font-semibold uppercase text-slate-500">Sources</div>
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
            {loading ? <div className="text-sm text-slate-500">Thinking...</div> : null}
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className={inputClass}
          value={message}
          placeholder="Ask the bot..."
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
          title="Send"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </button>
      </div>
    </div>
  );
}

