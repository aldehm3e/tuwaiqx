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
  var state = {
    config: null,
    open: false,
    loading: false,
    conversationId: localStorage.getItem(storageKey + ":conversationId") || "",
    messages: JSON.parse(localStorage.getItem(storageKey + ":messages") || "[]")
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

  function style() {
    var cfg = state.config || {};
    var primary = cfg.primaryColor || "#0f7b55";
    var side = cfg.position === "bottom-left" ? "left" : "right";
    return (
      "<style>" +
      ":host{all:initial;--la-primary:" + primary + ";font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#17211d}" +
      ".la-wrap{position:fixed;z-index:2147483647;bottom:20px;" + side + ":20px;direction:" + (cfg.direction || "ltr") + "}" +
      ".la-button{width:58px;height:58px;border:0;border-radius:18px;background:var(--la-primary);color:white;box-shadow:0 16px 40px rgba(23,33,29,.2);cursor:pointer;font-weight:800;font-size:18px}" +
      ".la-panel{display:" + (state.open ? "flex" : "none") + ";flex-direction:column;width:min(380px,calc(100vw - 32px));height:min(620px,calc(100vh - 100px));margin-bottom:12px;border:1px solid #dbe4df;border-radius:10px;background:white;box-shadow:0 24px 70px rgba(23,33,29,.18);overflow:hidden}" +
      ".la-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #dbe4df;background:#f7faf8}" +
      ".la-title{font-weight:700;font-size:14px}.la-org{font-size:12px;color:#64736d;margin-top:2px}.la-close{border:0;background:transparent;font-size:22px;line-height:1;cursor:pointer;color:#64736d}" +
      ".la-messages{flex:1;overflow:auto;padding:14px;background:#fbfdfc}.la-msg{max-width:86%;margin:0 0 10px;padding:10px 12px;border:1px solid #dbe4df;border-radius:8px;background:white;font-size:14px;line-height:1.45;white-space:pre-wrap}.la-user{margin-left:auto;border-color:#c6ecdc}.la-assistant{margin-right:auto}" +
      ".la-sources{margin-top:8px;padding-top:8px;border-top:1px solid #edf2ef}.la-source{display:block;color:var(--la-primary);font-size:12px;text-decoration:underline;margin-top:4px}.la-feedback{display:flex;gap:6px;margin-top:8px}.la-feedback button{border:1px solid #dbe4df;background:#f7faf8;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer}" +
      ".la-quick{display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px;border-top:1px solid #dbe4df;background:white}.la-quick button{border:1px solid #dbe4df;background:#f7faf8;border-radius:7px;padding:7px 9px;font-size:12px;cursor:pointer;color:#17211d}" +
      ".la-form{display:flex;gap:8px;padding:12px;border-top:1px solid #dbe4df;background:white}.la-input{flex:1;border:1px solid #dbe4df;border-radius:8px;padding:10px;font-size:14px;outline:none}.la-input:focus{border-color:var(--la-primary);box-shadow:0 0 0 3px rgba(15,123,85,.13)}.la-send{border:0;border-radius:8px;background:var(--la-primary);color:white;font-weight:700;padding:0 14px;cursor:pointer}" +
      ".la-foot{padding:8px 12px;border-top:1px solid #dbe4df;background:#f7faf8;color:#64736d;font-size:11px}.la-foot a{color:var(--la-primary)}" +
      "@media(max-width:520px){.la-wrap{left:12px;right:12px;bottom:12px}.la-panel{width:100%;height:calc(100vh - 92px)}.la-button{float:" + side + "}}" +
      "</style>"
    );
  }

  function renderMessage(message) {
    var sources = "";
    if (message.role === "assistant" && message.sources && message.sources.length) {
      sources =
        '<div class="la-sources"><strong>Sources</strong>' +
        message.sources
          .map(function (source) {
            var label = escapeHtml(source.title || "Source");
            return source.sourceUrl
              ? '<a class="la-source" target="_blank" rel="noreferrer" href="' + escapeHtml(source.sourceUrl) + '">' + label + "</a>"
              : '<span class="la-source">' + label + "</span>";
          })
          .join("") +
        "</div>";
    }
    var feedback = "";
    if (message.role === "assistant" && message.messageId) {
      feedback =
        '<div class="la-feedback"><button data-feedback="helpful" data-message-id="' +
        escapeHtml(message.messageId) +
        '">Helpful</button><button data-feedback="not_helpful" data-message-id="' +
        escapeHtml(message.messageId) +
        '">Not helpful</button></div>';
    }
    return (
      '<div class="la-msg la-' +
      message.role +
      '">' +
      escapeHtml(message.content) +
      sources +
      feedback +
      "</div>"
    );
  }

  function render() {
    var cfg = state.config || {
      name: "TuwaiqX",
      organizationName: "Organization",
      welcomeMessage: "Hello. How can I help?",
      quickActions: [],
      sourceCodeUrl: "https://github.com/YOUR_ORG/tuwaiqx"
    };
    var messages = state.messages.length
      ? state.messages
      : [{ role: "assistant", content: cfg.welcomeMessage || "Hello. How can I help?" }];
    root.innerHTML =
      style() +
      '<div class="la-wrap"><section class="la-panel" role="dialog" aria-label="' +
      escapeHtml(cfg.name || "Chat") +
      '">' +
      '<header class="la-head"><div><div class="la-title">' +
      escapeHtml(cfg.name || "TuwaiqX") +
      '</div><div class="la-org">' +
      escapeHtml(cfg.organizationName || "") +
      '</div></div><button class="la-close" type="button" aria-label="Close">×</button></header>' +
      '<div class="la-messages">' +
      messages.map(renderMessage).join("") +
      (state.loading ? '<div class="la-msg la-assistant">...</div>' : "") +
      "</div>" +
      '<div class="la-quick">' +
      (cfg.quickActions || [])
        .map(function (action) {
          return '<button type="button" data-quick="' + escapeHtml(action) + '">' + escapeHtml(action) + "</button>";
        })
        .join("") +
      "</div>" +
      '<form class="la-form"><input class="la-input" aria-label="Message" autocomplete="off" placeholder="Type your question" /><button class="la-send" type="submit">Send</button></form>' +
      '<footer class="la-foot">Powered by TuwaiqX · <a target="_blank" rel="noreferrer" href="' +
      escapeHtml(cfg.sourceCodeUrl || "#") +
      '">Source Code</a></footer></section><button class="la-button" type="button" aria-label="Open chat">TX</button></div>';

    root.querySelector(".la-button").addEventListener("click", function () {
      state.open = true;
      render();
    });
    root.querySelector(".la-close").addEventListener("click", function () {
      state.open = false;
      render();
    });
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
        button.textContent = "Saved";
      });
    });
    var messageBox = root.querySelector(".la-messages");
    if (messageBox) messageBox.scrollTop = messageBox.scrollHeight;
  }

  function send(text) {
    text = String(text || "").trim();
    if (!text || state.loading) return;
    state.messages.push({ role: "user", content: text });
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
        message: text,
        pageUrl: window.location.href
      })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) throw new Error(data.error || "Chat failed");
          return data;
        });
      })
      .then(function (data) {
        state.conversationId = data.conversationId;
        state.messages.push({
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
          messageId: data.messageId
        });
      })
      .catch(function (error) {
        state.messages.push({
          role: "assistant",
          content: error.message || "The assistant is unavailable right now."
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
