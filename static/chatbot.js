/* =========================================================
   FYP Chatbot — Floating button + slide-in side panel
   DeepSeek-powered, context-aware (reads current page)
   ========================================================= */

(function () {

  // ── 1. Inject styles ──────────────────────────────────
  const css = `
    /* ── Floating button ── */
    #cb-fab {
      position: fixed;
      bottom: 28px;
      left: 28px;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7C83FD, #96BAFF);
      border: none;
      cursor: pointer;
      box-shadow: 0 6px 24px rgba(124,131,253,0.5);
      z-index: 8000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      transition: all 0.3s ease;
      animation: cb-pulse 3s ease-in-out infinite;
    }
    #cb-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 32px rgba(124,131,253,0.65);
      animation: none;
    }
    #cb-fab.open {
      background: linear-gradient(135deg, #FF8090, #FFD6E0);
      animation: none;
    }
    @keyframes cb-pulse {
      0%, 100% { box-shadow: 0 6px 24px rgba(124,131,253,0.5); }
      50%       { box-shadow: 0 6px 36px rgba(124,131,253,0.75); }
    }

    /* Tooltip on hover */
    #cb-fab::after {
      content: 'Ask about this study';
      position: absolute;
      left: 62px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(44,47,79,0.95);
      color: #C0C8FF;
      font-family: 'Lato', sans-serif;
      font-size: 0.78rem;
      white-space: nowrap;
      padding: 6px 12px;
      border-radius: 8px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    #cb-fab:not(.open):hover::after { opacity: 1; }

    /* ── Side panel ── */
    #cb-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 360px;
      max-width: calc(100vw - 16px);
      height: calc(100vh - 72px);
      max-height: calc(100vh - 72px);
      background: #2C2F4F;
      border: 1px solid rgba(124,131,253,0.3);
      border-radius: 20px 20px 0 0;
      box-shadow: 0 -8px 48px rgba(0,0,0,0.45);
      z-index: 7999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      /* Hidden by default */
      transform: translateY(110%);
      opacity: 0;
      transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease;
      pointer-events: none;
    }
    #cb-panel.open {
      transform: translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* ── Panel header ── */
    #cb-header {
      background: linear-gradient(135deg, rgba(124,131,253,0.2), rgba(150,186,255,0.1));
      border-bottom: 1px solid rgba(255,255,255,0.08);
      padding: 14px 16px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    #cb-header .cb-avatar {
      width: 34px; height: 34px;
      background: linear-gradient(135deg,#7C83FD,#96BAFF);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; flex-shrink: 0;
    }
    #cb-header .cb-title-block { flex: 1; }
    #cb-header .cb-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 0.88rem; font-weight: 800;
      color: #FFD6E0; margin: 0;
    }
    #cb-header .cb-subtitle {
      font-family: 'Lato', sans-serif;
      font-size: 0.72rem; color: #8890CC; margin: 2px 0 0;
    }
    /* Close button — same style as lightbox */
    #cb-close {
      width: 30px; height: 30px;
      background: #FFD6E0;
      border: none; border-radius: 50%;
      color: #4a4a4a; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
    }
    #cb-close:hover { background: white; transform: scale(1.1) rotate(90deg); }

    /* ── Context badge ── */
    #cb-context-badge {
      padding: 6px 14px;
      background: rgba(124,131,253,0.08);
      border-bottom: 1px solid rgba(255,255,255,0.05);
      font-family: 'Lato', sans-serif;
      font-size: 0.72rem; color: #7C83FD;
      display: flex; align-items: center; gap: 6px;
      flex-shrink: 0;
    }
    #cb-context-badge .cb-dot {
      width: 6px; height: 6px;
      background: #7DF7A0; border-radius: 50%;
    }

    /* ── Messages area ── */
    #cb-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    #cb-messages::-webkit-scrollbar { width: 4px; }
    #cb-messages::-webkit-scrollbar-track { background: transparent; }
    #cb-messages::-webkit-scrollbar-thumb { background: rgba(124,131,253,0.3); border-radius: 2px; }

    /* Message bubbles */
    .cb-msg {
      display: flex; gap: 8px; align-items: flex-end;
      animation: cb-msg-in 0.2s ease;
    }
    @keyframes cb-msg-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .cb-msg.user { flex-direction: row-reverse; }

    .cb-bubble {
      max-width: 82%;
      font-family: 'Lato', sans-serif;
      font-size: 0.84rem; line-height: 1.6;
      padding: 9px 13px;
      border-radius: 16px;
      word-break: break-word;
    }
    .cb-msg.bot  .cb-bubble {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      color: #C0C8FF;
      border-bottom-left-radius: 4px;
    }
    .cb-msg.user .cb-bubble {
      background: linear-gradient(135deg,#7C83FD,#96BAFF);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .cb-msg-icon {
      width: 24px; height: 24px;
      border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem;
    }
    .cb-msg.bot  .cb-msg-icon { background: rgba(124,131,253,0.2); }
    .cb-msg.user .cb-msg-icon { background: rgba(255,214,224,0.2); }

    /* Typing indicator */
    .cb-typing .cb-bubble {
      display: flex; gap: 5px; align-items: center;
      padding: 12px 16px;
    }
    .cb-dot-anim {
      width: 6px; height: 6px;
      background: #7C83FD; border-radius: 50%;
      animation: cb-bounce 1.2s ease-in-out infinite;
    }
    .cb-dot-anim:nth-child(2) { animation-delay: 0.2s; }
    .cb-dot-anim:nth-child(3) { animation-delay: 0.4s; }
    @keyframes cb-bounce {
      0%,80%,100% { transform: translateY(0); opacity:0.5; }
      40%          { transform: translateY(-5px); opacity:1; }
    }

    /* Suggested questions */
    #cb-suggestions {
      padding: 0 14px 8px;
      display: flex; flex-wrap: wrap; gap: 6px;
      flex-shrink: 0;
    }
    .cb-suggestion {
      background: rgba(124,131,253,0.1);
      border: 1px solid rgba(124,131,253,0.25);
      color: #96BAFF;
      font-family: 'Lato', sans-serif;
      font-size: 0.74rem;
      padding: 5px 11px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .cb-suggestion:hover {
      background: rgba(124,131,253,0.2);
      color: #C0D0FF;
    }

    /* ── Input area ── */
    #cb-input-row {
      padding: 10px 12px 14px;
      border-top: 1px solid rgba(255,255,255,0.07);
      display: flex; gap: 8px; align-items: flex-end;
      flex-shrink: 0;
    }
    #cb-input {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      padding: 9px 13px;
      color: #D0D7FF;
      font-family: 'Lato', sans-serif;
      font-size: 0.84rem;
      resize: none;
      outline: none;
      max-height: 80px;
      line-height: 1.5;
      transition: border-color 0.2s;
    }
    #cb-input::placeholder { color: #5A6090; }
    #cb-input:focus { border-color: rgba(124,131,253,0.5); }

    #cb-send {
      width: 36px; height: 36px;
      background: linear-gradient(135deg,#7C83FD,#96BAFF);
      border: none; border-radius: 50%;
      color: white; font-size: 1rem;
      cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s ease;
    }
    #cb-send:hover  { transform: scale(1.08); }
    #cb-send:active { transform: scale(0.95); }
    #cb-send:disabled { opacity: 0.4; cursor: default; transform: none; }

    /* ── Mobile adjustments ── */
    @media (max-width: 600px) {
      #cb-panel {
        width: 100vw;
        max-width: 100vw;
        left: 0;
        border-radius: 20px 20px 0 0;
        height: 70vh;
      }
      #cb-fab { bottom: 20px; left: 20px; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── 2. Build DOM ──────────────────────────────────────
  document.body.insertAdjacentHTML('beforeend', `
    <!-- Floating button -->
    <button id="cb-fab" aria-label="Open study assistant"><img src="/static/images/chatbot/Paimon.png" style="width:36px;height:36px;object-fit:cover;border-radius:50%;"></button>

    <!-- Side panel -->
    <div id="cb-panel" role="dialog" aria-label="FYP Study Assistant">

      <!-- Header -->
      <div id="cb-header">
        <div class="cb-avatar">🎮</div>
        <div class="cb-title-block">
          <div class="cb-title">FYP Study Assistant</div>
          <div class="cb-subtitle">Genshin Impact Churn Study · Kelvin Kee</div>
        </div>
        <button id="cb-close" aria-label="Close chatbot">✕</button>
      </div>

      <!-- Context badge -->
      <div id="cb-context-badge">
        <span class="cb-dot"></span>
        <span id="cb-page-label">Reading current page…</span>
      </div>

      <!-- Messages -->
      <div id="cb-messages"></div>

      <!-- Suggested questions -->
      <div id="cb-suggestions"></div>

      <!-- Input -->
      <div id="cb-input-row">
        <textarea id="cb-input" rows="1"
          placeholder="Ask about this study…"
          aria-label="Your question"></textarea>
        <button id="cb-send" aria-label="Send">➤</button>
      </div>

    </div>
  `);

  // ── 3. State ──────────────────────────────────────────
  const fab       = document.getElementById('cb-fab');
  const panel     = document.getElementById('cb-panel');
  const closeBtn  = document.getElementById('cb-close');
  const messages  = document.getElementById('cb-messages');
  const input     = document.getElementById('cb-input');
  const sendBtn   = document.getElementById('cb-send');
  const pageLabel = document.getElementById('cb-page-label');
  const suggsEl   = document.getElementById('cb-suggestions');

  let isOpen     = false;
  let isLoading  = false;
  let history    = [];   // [{role, content}, ...]
  let hasGreeted = false;

  // ── 4. Page context extraction ────────────────────────
  function getPageContext() {
    // Try to grab the main content container
    const container = document.querySelector('.page-container') ||
                      document.querySelector('main') ||
                      document.querySelector('article');
    if (container) {
      // Remove script/style tags text
      const clone = container.cloneNode(true);
      clone.querySelectorAll('script, style, nav').forEach(el => el.remove());
      return clone.innerText.replace(/\s+/g, ' ').trim().slice(0, 4000);
    }
    return document.title;
  }

  function getPageName() {
    const path = window.location.pathname;
    const map = {
      '/':                'Home',
      '/research':        'Research Background',
      '/methodology':     'Methodology',
      '/customer_profile':'Customer Profile',
      '/result':          'Results',
      '/community':       'Community Analysis',
      '/recommendations': 'Business Recommendations',
      '/limitations':     'Limitations & Future Work',
      '/about':           'About',
    };
    return map[path] || document.title;
  }

  // ── 5. Suggested questions per page ──────────────────
  const suggestionMap = {
    '/':                ['What is this study about?', 'What are the key findings?', 'Who is this FYP for?'],
    '/research':        ['What are the research questions?', 'What gap does this study fill?'],
    '/methodology':     ['What models were used?', 'How was the survey designed?', 'What is CRISP-DM?'],
    '/customer_profile':['What does the Tableau dashboard show?', 'Why is combat rated lowest?', 'What is NodKrai avg rating?'],
    '/result':          ['What is the top churn predictor?', 'How accurate is the retention model?', 'What are the churn archetypes?'],
    '/community':       ['What does the community data show?', 'Why did Wuthering Waves appear?', 'What is the patch-end pattern?'],
    '/recommendations': ['Which recommendation is most urgent?', 'Why reduce resin to 90?', 'What is the QoL recommendation?'],
    '/limitations':     ['What are the study limitations?', 'What future work is suggested?'],
    '/about':           ['What did Kelvin study?', 'What skills were used in this FYP?'],
  };

  function renderSuggestions() {
    const path = window.location.pathname;
    const suggs = suggestionMap[path] || ['What are the key findings?', 'What models were used?'];
    suggsEl.innerHTML = '';
    suggs.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'cb-suggestion';
      btn.textContent = q;
      btn.addEventListener('click', () => {
        input.value = q;
        sendMessage();
      });
      suggsEl.appendChild(btn);
    });
  }

  // ── 6. Greeting message ───────────────────────────────
  function greet() {
    if (hasGreeted) return;
    hasGreeted = true;
    const page = getPageName();
    addMessage('bot', `Hi! 👋 I'm the FYP Study Assistant for Kelvin's Genshin Impact churn research.\n\nYou're currently on the **${page}** page — I've read its content and can answer questions about it, or about the broader study findings.\n\nWhat would you like to know?`);
    renderSuggestions();
  }

  // ── 7. Open / Close ───────────────────────────────────
  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    fab.classList.add('open');
    fab.setAttribute('aria-label', 'Close study assistant');
    pageLabel.textContent = `📄 ${getPageName()}`;
    greet();
    setTimeout(() => input.focus(), 350);
    fab.style.display = 'none';
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    fab.classList.remove('open');
    fab.style.display = 'flex';
    fab.setAttribute('aria-label', 'Open study assistant');
  }

  fab.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);

  // ── 8. Render message bubble ──────────────────────────
  function addMessage(role, text, isTyping = false) {
    const div = document.createElement('div');
    div.className = `cb-msg ${role}${isTyping ? ' cb-typing' : ''}`;

    const icon = document.createElement('div');
    icon.className = 'cb-msg-icon';
    icon.textContent = role === 'bot' ? '🎮' : '👤';

    const bubble = document.createElement('div');
    bubble.className = 'cb-bubble';

    if (isTyping) {
      bubble.innerHTML = '<div class="cb-dot-anim"></div><div class="cb-dot-anim"></div><div class="cb-dot-anim"></div>';
    } else {
      // Simple markdown-ish: bold **text**, newlines
      bubble.innerHTML = text
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    }

    div.appendChild(icon);
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  // ── 9. Send message ───────────────────────────────────
  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isLoading) return;

    // Clear suggestions after first message
    suggsEl.innerHTML = '';

    // Show user message
    addMessage('user', text);
    input.value = '';
    autoResize();

    // Show typing indicator
    const typingEl = addMessage('bot', '', true);
    isLoading = true;
    sendBtn.disabled = true;

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:     text,
          pageContext: getPageContext(),
          currentPage: getPageName(),
          history:     history,
        })
      });

      const data = await resp.json();
      typingEl.remove();

      if (data.reply) {
        addMessage('bot', data.reply);
        history.push({ role: 'user',      content: text });
        history.push({ role: 'assistant', content: data.reply });
        // Keep history manageable
        if (history.length > 12) history = history.slice(-12);
      } else {
        addMessage('bot', '⚠️ Sorry, I couldn\'t get a response. Please try again.');
      }
    } catch (err) {
      typingEl.remove();
      addMessage('bot', '⚠️ Connection error. Please check your internet and try again.');
    }

    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }

  // ── 10. Input handlers ────────────────────────────────
  function autoResize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  }

  input.addEventListener('input', autoResize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

})();
