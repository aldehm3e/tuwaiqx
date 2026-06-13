/*
 * TuwaiqX embeddable widget
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var botId = script.getAttribute("data-bot-id") || "main";
  var baseUrl = new URL(script.src).origin;
  var storageKey = "tuwaiqx:" + baseUrl + ":" + botId;

  function loadMessages() {
    try {
      var messages = JSON.parse(localStorage.getItem(storageKey + ":messages") || "[]");
      if (!Array.isArray(messages)) return [];
      return messages.map(function (message) {
        if (!message.createdAt) message.createdAt = new Date().toISOString();
        return message;
      });
    } catch (error) {
      return [];
    }
  }

  var state = {
    config: null,
    open: false,
    loading: false,
    languageOverride: localStorage.getItem(storageKey + ":language") || "",
    welcomeCreatedAt: new Date().toISOString(),
    conversationId: localStorage.getItem(storageKey + ":conversationId") || "",
    messages: loadMessages()
  };

  var host = document.createElement("div");
  host.setAttribute("data-tuwaiqx-widget", botId);
  document.body.appendChild(host);
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  function saveState() {
    localStorage.setItem(storageKey + ":messages", JSON.stringify(state.messages.slice(-40)));
    if (state.conversationId) {
      localStorage.setItem(storageKey + ":conversationId", state.conversationId);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var text = {
    en: {
      chat: "Chat",
      chatFailed: "Chat failed",
      clear: "Clear",
      close: "Close",
      defaultWelcome: "Hello. How can I help?",
      helpful: "Helpful",
      inputLabel: "Message",
      inputPlaceholder: "Type your question",
      notHelpful: "Not helpful",
      openChat: "Open chat",
      organization: "Organization",
      saved: "Saved",
      send: "Send",
      source: "Source",
      sources: "Sources",
      switchLanguage: "Switch language",
      thinking: "Thinking...",
      unavailable: "The assistant is unavailable right now."
    },
    ar: {
      chat: "المحادثة",
      chatFailed: "تعذر إرسال الرسالة.",
      clear: "مسح",
      close: "إغلاق",
      defaultWelcome: "مرحبا. كيف يمكنني مساعدتك؟",
      helpful: "مفيد",
      inputLabel: "الرسالة",
      inputPlaceholder: "اكتب سؤالك",
      notHelpful: "غير مفيد",
      openChat: "افتح المحادثة",
      organization: "المنظمة",
      saved: "تم الحفظ",
      send: "إرسال",
      source: "مصدر",
      sources: "المصادر",
      switchLanguage: "تغيير اللغة",
      thinking: "يفكر...",
      unavailable: "المساعد غير متاح الآن."
    }
  };

  function languageKey() {
    if (state.languageOverride === "ar" || state.languageOverride === "en") {
      return state.languageOverride;
    }
    var cfg = state.config || {};
    var language = String(cfg.language || "").toLowerCase();
    var direction = String(cfg.direction || "").toLowerCase();
    if (language.indexOf("ar") === 0) return "ar";
    if (language.indexOf("en") === 0) return "en";
    return direction === "rtl" ? "ar" : "en";
  }

  function isArabic() {
    return languageKey() === "ar";
  }

  function textDirection() {
    return isArabic() ? "rtl" : "ltr";
  }

  function layoutDirection() {
    return state.languageOverride ? textDirection() : (state.config && state.config.direction) || "ltr";
  }

  function label(key) {
    var group = text[languageKey()] || text.en;
    return group[key] || text.en[key] || key;
  }

  function nextLanguage() {
    return languageKey() === "ar" ? "en" : "ar";
  }

  function languageToggleLabel() {
    return languageKey() === "ar" ? "EN" : "AR";
  }

  function formatDateTime(value) {
    var date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) date = new Date();
    var locale = isArabic() ? "ar" : (state.config && state.config.language) || navigator.language || "en";
    try {
      return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).format(date);
    } catch (error) {
      var year = date.getFullYear();
      var month = String(date.getMonth() + 1).padStart(2, "0");
      var day = String(date.getDate()).padStart(2, "0");
      var hours = String(date.getHours()).padStart(2, "0");
      var minutes = String(date.getMinutes()).padStart(2, "0");
      return year + "-" + month + "-" + day + " " + hours + ":" + minutes;
    }
  }

  function style() {
    var cfg = state.config || {};
    var primary = cfg.primaryColor || "#0f7b55";
    var side = cfg.position === "bottom-left" ? "left" : "right";
    var direction = layoutDirection();
    return (
      "<style>" +
      ":host{all:initial;--la-primary:" + primary + ";font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#17211d}" +
      ".la-wrap{position:fixed;z-index:2147483647;bottom:20px;" + side + ":20px;direction:" + direction + "}" +
      ".la-button{display:flex;align-items:center;justify-content:center;width:76px;height:54px;border:1px solid rgba(15,123,85,.22);border-radius:18px;background:#fff;box-shadow:0 16px 40px rgba(23,33,29,.2);cursor:pointer;padding:7px 8px}" +
      ".la-button img{display:block;width:100%;height:100%;object-fit:contain}" +
      ".la-panel{display:" + (state.open ? "flex" : "none") + ";flex-direction:column;width:min(380px,calc(100vw - 32px));height:min(620px,calc(100vh - 100px));margin-bottom:12px;border:1px solid #dbe4df;border-radius:10px;background:white;box-shadow:0 24px 70px rgba(23,33,29,.18);overflow:hidden}" +
      ".la-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #dbe4df;background:#f7faf8}" +
      ".la-title{font-weight:700;font-size:14px}.la-org{font-size:12px;color:#64736d;margin-top:2px}.la-close{border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:#64736d}" +
      ".la-actions{display:flex;align-items:center;gap:5px;flex-shrink:0}.la-tool{border:1px solid #dbe4df;background:white;border-radius:6px;color:#17211d;cursor:pointer;font-size:11px;font-weight:700;line-height:1;padding:6px 7px}.la-tool[data-language-toggle]{min-width:32px}" +
      ".la-messages{flex:1;overflow:auto;padding:14px;background:#fbfdfc}.la-entry{display:flex;flex-direction:column;width:fit-content;max-width:86%;margin:0 0 10px}.la-entry-user{margin-left:auto}.la-entry-assistant{margin-right:auto}.la-msg{padding:10px 12px;border:1px solid #dbe4df;border-radius:8px;background:white;font-size:14px;line-height:1.45;white-space:pre-wrap}.la-user{border-color:#c6ecdc}.la-meta{margin-top:4px;padding:0 7px;color:#7a8781;font-size:11px;line-height:1;text-align:end}.la-status{width:fit-content;max-width:86%;margin:0 0 10px;padding:0 7px;color:#64736d;font-size:12px;line-height:1.35}.la-status-assistant{margin-right:auto}" +
      ".la-sources{margin-top:8px;padding-top:8px;border-top:1px solid #edf2ef}.la-source{display:block;color:var(--la-primary);font-size:12px;text-decoration:underline;margin-top:4px}.la-feedback{display:flex;gap:6px;margin-top:8px}.la-feedback button{border:1px solid #dbe4df;background:#f7faf8;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer}" +
      ".la-quick{display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;border-top:1px solid #dbe4df;background:white}.la-quick button{border:1px solid #dbe4df;background:#f7faf8;border-radius:7px;padding:7px 9px;font-size:12px;cursor:pointer;color:#17211d}" +
      ".la-form{display:flex;gap:8px;padding:12px;border-top:1px solid #dbe4df;background:white}.la-input{flex:1;border:1px solid #dbe4df;border-radius:8px;padding:10px;font-size:14px;outline:none}.la-input:focus{border-color:var(--la-primary);box-shadow:0 0 0 3px rgba(15,123,85,.13)}.la-send{border:0;border-radius:8px;background:var(--la-primary);color:white;font-weight:700;padding:0 14px;cursor:pointer}" +
      ".la-foot{padding:8px 12px;border-top:1px solid #dbe4df;background:#f7faf8;color:#64736d;font-size:11px}.la-foot a{color:var(--la-primary)}" +
      "@media(max-width:520px){.la-wrap{left:12px;right:12px;bottom:12px}.la-panel{width:100%;height:calc(100vh - 92px)}.la-button{float:" + side + "}}" +
      "</style>"
    );
  }

  function renderMessage(message) {
    var cfg = state.config || {};
    var direction = escapeHtml(textDirection());
    var time = '<div class="la-meta" dir="' + direction + '">' + escapeHtml(formatDateTime(message.createdAt)) + "</div>";
    var sources = "";
    if (cfg.showSources !== false && message.role === "assistant" && message.sources && message.sources.length) {
      sources =
        '<div class="la-sources"><strong>' + escapeHtml(label("sources")) + "</strong>" +
        message.sources
          .map(function (source) {
            var sourceLabel = escapeHtml(source.title || label("source"));
            return source.sourceUrl
              ? '<a class="la-source" target="_blank" rel="noreferrer" href="' + escapeHtml(source.sourceUrl) + '">' + sourceLabel + "</a>"
              : '<span class="la-source">' + sourceLabel + "</span>";
          })
          .join("") +
        "</div>";
    }
    var feedback = "";
    if (message.role === "assistant" && message.messageId) {
      feedback =
        '<div class="la-feedback"><button data-feedback="helpful" data-message-id="' +
        escapeHtml(message.messageId) +
        '">' +
        escapeHtml(label("helpful")) +
        '</button><button data-feedback="not_helpful" data-message-id="' +
        escapeHtml(message.messageId) +
        '">' +
        escapeHtml(label("notHelpful")) +
        "</button></div>";
    }
    return (
      '<div class="la-entry la-entry-' +
      message.role +
      '"><div class="la-msg la-' +
      message.role +
      '" dir="' +
      direction +
      '">' +
      escapeHtml(message.content) +
      sources +
      feedback +
      "</div>" +
      time +
      "</div>"
    );
  }

  function renderLoadingStatus() {
    return (
      '<div class="la-status la-status-assistant" aria-live="polite" dir="' +
      escapeHtml(textDirection()) +
      '">' +
      escapeHtml(label("thinking")) +
      "</div>"
    );
  }

  function clearConversation() {
    state.conversationId = "";
    state.messages = [];
    state.loading = false;
    state.welcomeCreatedAt = new Date().toISOString();
    localStorage.removeItem(storageKey + ":conversationId");
    localStorage.removeItem(storageKey + ":messages");
    render();
  }

  function setLanguage(language) {
    state.languageOverride = language;
    localStorage.setItem(storageKey + ":language", language);
    render();
  }

  function render() {
    var cfg = state.config || {
      name: "TuwaiqX",
      organizationName: label("organization"),
      welcomeMessage: label("defaultWelcome"),
      quickActions: [],
      sourceCodeUrl: "https://github.com/aldehm3e/tuwaiqx"
    };
    var messages = state.messages.length
      ? state.messages
      : [{ role: "assistant", content: cfg.welcomeMessage || label("defaultWelcome"), createdAt: state.welcomeCreatedAt }];
    root.innerHTML =
      style() +
      '<div class="la-wrap"><section class="la-panel" role="dialog" aria-label="' +
      escapeHtml(cfg.name || label("chat")) +
      '">' +
      '<header class="la-head"><div><div class="la-title">' +
      escapeHtml(cfg.name || "TuwaiqX") +
      '</div><div class="la-org">' +
      escapeHtml(cfg.organizationName || "") +
      '</div></div><div class="la-actions"><button class="la-tool" type="button" data-language-toggle aria-label="' +
      escapeHtml(label("switchLanguage")) +
      '" title="' +
      escapeHtml(label("switchLanguage")) +
      '">' +
      escapeHtml(languageToggleLabel()) +
      '</button><button class="la-tool" type="button" data-clear>' +
      escapeHtml(label("clear")) +
      '</button><button class="la-close" type="button" aria-label="' +
      escapeHtml(label("close")) +
      '">&times;</button></div></header>' +
      '<div class="la-messages">' +
      messages.map(renderMessage).join("") +
      (state.loading ? renderLoadingStatus() : "") +
      "</div>" +
      '<div class="la-quick">' +
      (cfg.quickActions || [])
        .map(function (action) {
          return '<button type="button" data-quick="' + escapeHtml(action) + '">' + escapeHtml(action) + "</button>";
        })
        .join("") +
      "</div>" +
      '<form class="la-form"><input class="la-input" aria-label="' +
      escapeHtml(label("inputLabel")) +
      '" dir="' +
      escapeHtml(textDirection()) +
      '" autocomplete="off" placeholder="' +
      escapeHtml(label("inputPlaceholder")) +
      '" /><button class="la-send" type="submit">' +
      escapeHtml(label("send")) +
      '</button></form>' +
      '<footer class="la-foot">Powered by TuwaiqX</footer></section><button class="la-button" type="button" aria-label="' +
      escapeHtml(label("openChat")) +
      '"><img src="' + escapeHtml(baseUrl + "/tuwaiqx-icon.png") + '" alt="" /></button></div>';

    root.querySelector(".la-button").addEventListener("click", function () {
      state.open = true;
      render();
    });
    root.querySelector(".la-close").addEventListener("click", function () {
      state.open = false;
      render();
    });
    root.querySelector("[data-language-toggle]").addEventListener("click", function () {
      setLanguage(nextLanguage());
    });
    root.querySelector("[data-clear]").addEventListener("click", clearConversation);
    root.querySelector(".la-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var input = root.querySelector(".la-input");
      send(input.value);
      input.value = "";
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-quick]"), function (button) {
      button.addEventListener("click", function () {
        send(button.getAttribute("data-quick"));
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-feedback]"), function (button) {
      button.addEventListener("click", function () {
        fetch(baseUrl + "/api/chat/feedback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messageId: button.getAttribute("data-message-id"),
            feedback: button.getAttribute("data-feedback")
          })
        }).catch(function () {});
        button.textContent = label("saved");
      });
    });
    var messageBox = root.querySelector(".la-messages");
    if (messageBox) messageBox.scrollTop = messageBox.scrollHeight;
  }

  function send(text) {
    text = String(text || "").trim();
    if (!text || state.loading) return;
    state.messages.push({ role: "user", content: text, createdAt: new Date().toISOString() });
    state.loading = true;
    saveState();
    render();
    fetch(baseUrl + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        botId: botId,
        conversationId: state.conversationId || undefined,
        visitorId: localStorage.getItem(storageKey + ":visitorId") || undefined,
        language: languageKey(),
        message: text,
        pageUrl: window.location.href
      })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(isArabic() ? label("chatFailed") : data.error || label("chatFailed"));
          return data;
        });
      })
      .then(function (data) {
        state.conversationId = data.conversationId;
        state.messages.push({
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
          messageId: data.messageId,
          createdAt: new Date().toISOString()
        });
      })
      .catch(function (error) {
        state.messages.push({
          role: "assistant",
          content: error.message || label("unavailable"),
          createdAt: new Date().toISOString()
        });
      })
      .finally(function () {
        state.loading = false;
        saveState();
        render();
      });
  }

  fetch(baseUrl + "/api/widget/config?botId=" + encodeURIComponent(botId))
    .then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) throw new Error(data.error || "Widget config failed");
        return data;
      });
    })
    .then(function (config) {
      state.config = config;
      render();
    })
    .catch(function () {
      state.config = null;
      render();
    });
})();
