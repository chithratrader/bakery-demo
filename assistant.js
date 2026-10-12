(function () {
  // ---- Settings: edit these three ----
  const API_URL = "PASTE_PORTFOLIO_LAMBDA_URL_HERE";
  const CONTACT_URL = "";   // set to "contact.html" once your contact page exists
  const GREETING = "Hi! I'm an AI assistant. Ask me about experience, skills or certifications. Please don't share personal or financial details here.";
  // ------------------------------------

  if (API_URL.indexOf("PASTE") !== -1) return;   // no widget until the URL is set

  // Same checks as the Lambda, so sensitive text never even leaves the browser
  const SENSITIVE = [
    /[\w.+-]+@[\w-]+\.[\w.-]+/,
    /(?:\d[ ()+.-]?){9,}/,
    /\b(?:dob|date of birth|born on|birthday)\b/i,
    /\b\d{1,2}[\/.-]\d{1,2}[\/.-](?:19|20)?\d{2}\b/,
    /\b(password|passcode|cvv|cvc|pin number|tax file number|tfn|passport number|licen[cs]e number|bsb|account number)\b/i
  ];
  const isSensitive = (t) => SENSITIVE.some((r) => r.test(t));
  const PRIVACY = "Please don't share personal or financial details in this chat. That message was not sent anywhere.";

  const css = `
    .cw-bubble{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;border:none;background:#0e7c86;color:#fff;font-size:26px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3);z-index:99999}
    .cw-bubble:focus-visible,.cw-send:focus-visible,.cw-close:focus-visible{outline:3px solid #0c1a2b;outline-offset:2px}
    .cw-panel{position:fixed;bottom:92px;right:20px;width:350px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 120px);background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden;z-index:99999;font:15px/1.45 system-ui,"Segoe UI",Roboto,sans-serif;color:#162232}
    .cw-panel.open{display:flex}
    .cw-head{background:#0c1a2b;color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;font-weight:600}
    .cw-close{background:none;border:none;color:#fff;font-size:22px;cursor:pointer}
    .cw-msgs{flex:1;overflow-y:auto;padding:12px;background:#f1f4f6}
    .cw-msg{max-width:86%;padding:8px 12px;margin:6px 0;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}
    .cw-msg.bot{background:#fff;margin-right:auto}
    .cw-msg.user{background:#0e7c86;color:#fff;margin-left:auto}
    .cw-msg.typing{color:#777;font-style:italic}
    .cw-msg a{color:#0e7c86;font-weight:600}
    .cw-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e1e6ea;background:#fff}
    .cw-input{flex:1;padding:9px 12px;border:1px solid #c9d2d9;border-radius:20px;font:inherit}
    .cw-send{background:#0e7c86;color:#fff;border:none;border-radius:20px;padding:0 16px;cursor:pointer;font:inherit}
    .cw-send:disabled{opacity:.5;cursor:default}`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.innerHTML = `
    <div class="cw-panel" id="cw-panel" role="dialog" aria-label="Chat assistant">
      <div class="cw-head"><span>Ask the assistant</span><button class="cw-close" id="cw-close" aria-label="Close chat">&times;</button></div>
      <div class="cw-msgs" id="cw-msgs" aria-live="polite"></div>
      <div class="cw-form">
        <input class="cw-input" id="cw-input" placeholder="Type a question..." maxlength="500" autocomplete="off" aria-label="Your message">
        <button class="cw-send" id="cw-send">Send</button>
      </div>
    </div>
    <button class="cw-bubble" id="cw-bubble" aria-label="Open chat assistant">&#128172;</button>`;
  document.body.appendChild(root);

  const $ = (id) => document.getElementById(id);
  const panel = $("cw-panel"), box = $("cw-msgs"), input = $("cw-input"), sendBtn = $("cw-send");
  const messages = [];
  let busy = false;

  function addMsg(who, text, withContact) {
    const div = document.createElement("div");
    div.className = "cw-msg " + who;
    div.textContent = text;
    if (withContact && CONTACT_URL) {
      div.appendChild(document.createTextNode(" "));
      const a = document.createElement("a");
      a.href = CONTACT_URL;
      a.textContent = "Go to the Contact page";
      div.appendChild(a);
    }
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return div;
  }

  async function send() {
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = "";
    addMsg("user", isSensitive(text) ? "(message hidden for privacy)" : text);
    if (isSensitive(text)) { addMsg("bot", PRIVACY, true); return; }   // never sent

    messages.push({ role: "user", content: text });
    busy = true; sendBtn.disabled = true;
    const typing = addMsg("bot", "Typing...");
    typing.classList.add("typing");
    try {
      const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ messages: messages.slice(-8) }) });
      const data = await res.json();
      typing.remove();
      addMsg("bot", data.reply || "Sorry, something went wrong.", data.blocked);
      if (data.blocked) messages.pop(); else messages.push({ role: "assistant", content: data.reply });
    } catch (e) {
      typing.remove();
      addMsg("bot", "Sorry, something went wrong. Please try again.");
      messages.pop();
    }
    busy = false; sendBtn.disabled = false; input.focus();
  }

  $("cw-bubble").onclick = () => { panel.classList.toggle("open"); if (panel.classList.contains("open")) input.focus(); };
  $("cw-close").onclick = () => panel.classList.remove("open");
  sendBtn.onclick = send;
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  addMsg("bot", GREETING);
})();
