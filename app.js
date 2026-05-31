/* ============================================
   PayPal Support - App JavaScript
   Handles: Nav, Search, Tabs, FAQ, Chat, Storage
   ============================================ */

// ---- STORAGE KEY ----
const STORAGE_KEY = 'pp_support_sessions';

// ---- UTILS ----
function getTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTimestamp() {
  return Date.now();
}

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function getSessions() {
  try {
    const res = await fetch('/api/db?action=getAll');
    const data = await res.json();
    return data || {};
  } catch { return {}; }
}

async function saveSession(id, session) {
  try {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', payload: { id, session } })
    });
  } catch (e) { console.error('DB save failed', e); }
}

// ---- HEADER SCROLL ----
const header = document.getElementById('pp-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// ---- MOBILE MENU ----
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
if (mobileMenuBtn && mobileNav) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      mobileNav.classList.remove('open');
    }
  });
}

// ---- FAQ ACCORDION ----
document.querySelectorAll('.pp-faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    // Close all
    document.querySelectorAll('.pp-faq-question').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });
    // Toggle clicked
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling.classList.add('open');
    }
  });
});

// ---- HERO TABS (Personal / Business) ----
const heroTabs = document.querySelectorAll('.pp-tab');
heroTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    heroTabs.forEach(t => {
      t.classList.remove('pp-tab-active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('pp-tab-active');
    tab.setAttribute('aria-selected', 'true');

    // Swap suggested articles based on tab
    const type = tab.dataset.tab;
    updateSuggestedArticles(type);
  });
});

function updateSuggestedArticles(type) {
  const articleData = {
    personal: [
      'Where is my refund?',
      'How do I change my password?',
      'How do I dispute a charge?',
      'Why is my account limited?',
      'How do I add or remove a bank account?',
      'How long does it take to transfer money to my bank?',
    ],
    business: [
      'How do I issue a refund to a customer?',
      'How do I set up PayPal checkout on my website?',
      'Why is my business account limited?',
      'How do I read my PayPal transaction report?',
      'How do I dispute a chargeback?',
      'How do I enable PayPal invoicing?',
    ]
  };
  const rows = document.querySelectorAll('.pp-article-row .pp-article-label');
  const articles = articleData[type] || articleData.personal;
  rows.forEach((row, i) => {
    if (articles[i]) row.textContent = articles[i];
  });
}

// ---- TIMESTAMP INIT ----
document.querySelectorAll('[data-timestamp="now"]').forEach(el => {
  el.textContent = getTime();
});

// ---- SEARCH SUGGESTIONS ----
(function initSearch() {
  const searchInput       = document.getElementById('searchInput');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const searchForm        = document.getElementById('searchForm');
  const searchBox         = document.getElementById('searchBox');

  if (!searchInput || !searchSuggestions) return;

  const allSuggestions = [
    'How do I reset my password?',
    'Why is my account limited?',
    'How do I dispute a charge?',
    'When will my refund arrive?',
    'How do I add a bank account?',
    'How long does a transfer take?',
    'How do I cancel a payment?',
    'How do I report unauthorized activity?',
    'How do I close my PayPal account?',
    'How do I link a debit card?',
    'How do I change my email address?',
    'How do I send money internationally?',
  ];

  function buildSuggestionEl(text, i) {
    const a = document.createElement('a');
    a.href = 'contact.html';
    a.className = 'pp-suggestion-item';
    a.id = 'suggestion-' + i;
    a.innerHTML = `
      <svg viewBox="0 0 20 20" fill="none">
        <circle cx="9" cy="9" r="5.5" stroke="#9ca3af" stroke-width="1.5"/>
        <path d="M16 16l-3-3" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      ${text}
    `;
    return a;
  }

  function renderSuggestions(list, labelText) {
    searchSuggestions.innerHTML = '';
    if (!list.length) { searchSuggestions.hidden = true; return; }

    const label = document.createElement('div');
    label.className = 'pp-suggestion-group-label';
    label.textContent = labelText;
    searchSuggestions.appendChild(label);

    list.forEach((text, i) => searchSuggestions.appendChild(buildSuggestionEl(text, i)));
    searchSuggestions.hidden = false;
  }

  function hideSuggestions() {
    searchSuggestions.hidden = true;
  }

  searchInput.addEventListener('focus', () => {
    const q = searchInput.value.trim();
    if (!q) renderSuggestions(allSuggestions.slice(0, 5), 'Suggested');
    else {
      const filtered = allSuggestions.filter(s => s.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
      renderSuggestions(filtered, 'Results');
    }
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim();
    if (!q) { renderSuggestions(allSuggestions.slice(0, 5), 'Suggested'); return; }
    const filtered = allSuggestions.filter(s => s.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
    renderSuggestions(filtered.length ? filtered : ['No results found for "' + q + '"'], filtered.length ? 'Results' : '');
  });

  document.addEventListener('click', (e) => {
    if (searchBox && !searchBox.contains(e.target) && !searchSuggestions.contains(e.target)) {
      hideSuggestions();
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideSuggestions();
  });

  searchForm && searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideSuggestions();
    if (searchInput.value.trim()) window.location.href = 'contact.html';
  });
})();

// ============================================
//  CHAT FUNCTIONALITY (contact.html)
// ============================================
const startChatBtn = document.getElementById('startChatBtn');
const prechatForm  = document.getElementById('prechatForm');
const chatInputWrap = document.getElementById('chatInputWrap');
const chatMessages  = document.getElementById('chatMessages');
const chatInput     = document.getElementById('chatInput');
const sendMsgBtn    = document.getElementById('sendMsgBtn');
const agentTyping   = document.getElementById('agentTyping');

let currentSessionId = null;
let lastMessageCount = 0;
let pollInterval = null;

if (startChatBtn) {
  startChatBtn.addEventListener('click', async () => {
    const name     = document.getElementById('userFullName').value.trim();
    const email    = document.getElementById('userEmail').value.trim();
    const category = document.getElementById('issueCategory').value;
    const message  = document.getElementById('prechatMessage').value.trim();

    if (!name) { shakeField('userFullName'); return; }
    if (!email || !email.includes('@') || !email.includes('.')) { shakeField('userEmail'); return; }
    if (!category) { shakeField('issueCategory'); return; }
    if (!message) { shakeField('prechatMessage'); return; }

    // Create session
    currentSessionId = generateId();
    const session = {
      id: currentSessionId,
      name,
      email,
      category,
      status: 'open',
      unread: true,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
      messages: [
        {
          id: generateId(),
          from: 'agent',
          text: "Hi there! 👋 Welcome to PayPal Support. What can I help you with today?",
          time: getTime(),
          timestamp: getTimestamp() - 2000
        },
        {
          id: generateId(),
          from: 'user',
          text: message,
          time: getTime(),
          timestamp: getTimestamp()
        }
      ]
    };

    // Save to DB
    await saveSession(currentSessionId, session);

    // Save ID to local storage so this device remembers ITS specific session
    localStorage.setItem('pp_current_session_id', currentSessionId);

    // Hide form, show chat
    prechatForm.style.display = 'none';
    chatInputWrap.style.display = 'block';

    // Render first user message
    appendMessage('user', message);

    // Show "agent typing" then auto reply (only once)
    showAgentTyping();
    setTimeout(() => {
      hideAgentTyping();
      const autoReply = getAutoReply(category);
      deliverAgentMessage(autoReply);
    }, 2200);

    scrollToBottom();

    // Notify Admin via Email (Vercel Serverless Function)
    fetch('/api/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, category, message })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) console.error("API Error:", data.error);
    })
    .catch(err => console.error("Failed to notify admin via email:", err));

    // Poll for new agent messages from admin
    startPolling();
  });

  // RESTORE CHAT ON REFRESH
  // Hide form immediately if we have a session ID, to prevent flashing
  if (localStorage.getItem('pp_current_session_id')) {
    if (prechatForm) prechatForm.style.display = 'none';
  }

  async function restoreChatIfActive() {
    // Only restore if this specific device has an active session ID stored
    const savedSessionId = localStorage.getItem('pp_current_session_id');
    if (!savedSessionId) return;

    const sessions = await getSessions();
    const activeSession = sessions[savedSessionId];
    
    // If session was deleted from DB entirely, reset to fresh form
    if (!activeSession) {
      localStorage.removeItem('pp_current_session_id');
      if (prechatForm) prechatForm.style.display = 'block';
      if (chatInputWrap) chatInputWrap.style.display = 'none';
      return;
    }

    currentSessionId = activeSession.id;

    // Hide form, show chat area
    prechatForm.style.display = 'none';
    // Hide welcome message since we have real messages
    const welcomeMsg = document.getElementById('welcomeMsg');
    if (welcomeMsg) welcomeMsg.style.display = 'none';

    // Render all messages
    activeSession.messages.forEach(m => {
      const msg = document.createElement('div');
      msg.className = `pp-msg pp-msg-${m.from}`;
      msg.id = 'msg-' + m.id;

      const avatarHtml = m.from === 'agent'
        ? `<div class="pp-msg-avatar"><img src="https://www.paypalobjects.com/marketing/web/icons/monogram/pp32.png" alt="Agent"/></div>`
        : `<div class="pp-msg-avatar" style="background:#003087;color:white;font-weight:700;font-size:12px;">U</div>`;

      msg.innerHTML = `
        ${avatarHtml}
        <div class="pp-msg-bubble">
          <p>${escapeHtml(m.text)}</p>
          <span class="pp-msg-time">${m.time}</span>
        </div>
      `;
      chatMessages.appendChild(msg);
    });

    scrollToBottom();
    lastMessageCount = activeSession.messages.length;

    if (activeSession.status === 'open') {
      // Active session — show input, start polling
      chatInputWrap.style.display = 'block';
      startPolling();
    } else {
      // Resolved session — show read-only with resolved banner + Start New Chat
      chatInputWrap.style.display = 'none';
      const resolvedBanner = document.getElementById('resolvedBanner');
      if (resolvedBanner) resolvedBanner.style.display = 'block';

      const startNewChatBtn = document.getElementById('startNewChatBtn');
      if (startNewChatBtn) {
        startNewChatBtn.addEventListener('click', () => {
          localStorage.removeItem('pp_current_session_id');
          window.location.reload();
        });
      }
    }
  }

  // Run on load
  restoreChatIfActive();
}

// ---- SEND MESSAGE ----
async function sendUserMessage() {
  if (!chatInput || !currentSessionId) return;
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  chatInput.style.height = 'auto';

  // Append to UI
  appendMessage('user', text);

  // Save to session DB
  const sessions = await getSessions();
  const session = sessions[currentSessionId];
  if (session) {
    session.messages.push({
      id: generateId(),
      from: 'user',
      text,
      time: getTime(),
      timestamp: getTimestamp()
    });
    session.unread = true;
    session.updatedAt = getTimestamp();
    await saveSession(currentSessionId, session);

    // Notify Admin via Email for subsequent messages
    fetch('/api/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: session.name, 
        email: session.email, 
        category: session.category, 
        message: text 
      })
    }).catch(err => console.error("Failed to notify admin via email:", err));
  }

  scrollToBottom();
}

if (sendMsgBtn) {
  sendMsgBtn.addEventListener('click', sendUserMessage);
}

if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });
  // Auto-resize
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });
}

// ---- APPEND MESSAGE (user-facing) ----
function appendMessage(from, text) {
  if (!chatMessages) return;
  const msg = document.createElement('div');
  msg.className = `pp-msg pp-msg-${from}`;

  const avatarHtml = from === 'agent'
    ? `<div class="pp-msg-avatar"><img src="https://www.paypalobjects.com/marketing/web/icons/monogram/pp32.png" alt="Agent"/></div>`
    : `<div class="pp-msg-avatar" style="background:#003087;color:white;font-weight:700;font-size:12px;">U</div>`;

  msg.innerHTML = `
    ${avatarHtml}
    <div class="pp-msg-bubble">
      <p>${escapeHtml(text)}</p>
      <span class="pp-msg-time">${getTime()}</span>
    </div>
  `;

  // Remove welcome message avatar on agent side for clean look
  chatMessages.appendChild(msg);
  scrollToBottom();
}

// ---- DELIVER AGENT MESSAGE (from admin reply or auto-reply) ----
async function deliverAgentMessage(text) {
  if (!chatMessages) return;
  appendMessage('agent', text);

  // Save to session DB
  if (currentSessionId) {
    const sessions = await getSessions();
    const session = sessions[currentSessionId];
    if (session) {
      session.messages.push({
        id: generateId(),
        from: 'agent',
        text,
        time: getTime(),
        timestamp: getTimestamp()
      });
      session.updatedAt = getTimestamp();
      await saveSession(currentSessionId, session);
    }
  }
}

// ---- TYPING INDICATOR ----
function showAgentTyping() {
  if (agentTyping) agentTyping.style.display = 'flex';
  scrollToBottom();
}
function hideAgentTyping() {
  if (agentTyping) agentTyping.style.display = 'none';
}

// ---- SCROLL ----
function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// ---- POLLING (check for new agent messages) ----
function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    if (!currentSessionId) return;
    const sessions = await getSessions();
    const session = sessions[currentSessionId];
    if (!session) return;

    const msgs = session.messages;
    if (msgs.length > lastMessageCount) {
      // New messages — check if any are from agent after our last known index
      const newMsgs = msgs.slice(lastMessageCount);
      newMsgs.forEach(m => {
        if (m.from === 'agent') {
          // Check it's not already in the DOM
          if (!document.getElementById('msg-' + m.id)) {
            showAgentTyping();
            setTimeout(() => {
              hideAgentTyping();
              appendMessageWithId('agent', m.text, m.id);
            }, 800);
          }
        }
      });
      lastMessageCount = msgs.length;
    }

    // Check if session status changed
    if (session.status === 'resolved' && chatInput && !chatInput.disabled) {
      chatInput.disabled = true;
      chatInput.placeholder = "This conversation has been resolved.";
      if (sendMsgBtn) {
        sendMsgBtn.disabled = true;
        sendMsgBtn.style.opacity = '0.5';
        sendMsgBtn.style.cursor = 'not-allowed';
      }
      const resolveMsg = document.createElement('div');
      resolveMsg.className = 'system-notice resolve-notice';
      resolveMsg.style.textAlign = 'center';
      resolveMsg.style.fontSize = '12px';
      resolveMsg.style.color = '#6b7280';
      resolveMsg.style.margin = '16px 0';
      resolveMsg.style.fontWeight = '600';
      resolveMsg.innerHTML = '✅ This conversation was marked as resolved by PayPal Support.';
      chatMessages.appendChild(resolveMsg);
      scrollToBottom();
    } else if (session.status === 'open' && chatInput && chatInput.disabled) {
      chatInput.disabled = false;
      chatInput.placeholder = "Type your message...";
      if (sendMsgBtn) {
        sendMsgBtn.disabled = false;
        sendMsgBtn.style.opacity = '1';
        sendMsgBtn.style.cursor = 'pointer';
      }
      document.querySelectorAll('.resolve-notice').forEach(el => el.remove());
      const reopenMsg = document.createElement('div');
      reopenMsg.className = 'system-notice';
      reopenMsg.style.textAlign = 'center';
      reopenMsg.style.fontSize = '12px';
      reopenMsg.style.color = '#0070ba';
      reopenMsg.style.margin = '16px 0';
      reopenMsg.style.fontWeight = '600';
      reopenMsg.innerHTML = '↺ Conversation was reopened by PayPal Support.';
      chatMessages.appendChild(reopenMsg);
      scrollToBottom();
    }
  }, 1500);
}

function appendMessageWithId(from, text, id) {
  if (!chatMessages) return;
  if (document.getElementById('msg-' + id)) return;

  const msg = document.createElement('div');
  msg.className = `pp-msg pp-msg-${from}`;
  msg.id = 'msg-' + id;

  const avatarHtml = from === 'agent'
    ? `<div class="pp-msg-avatar"><img src="https://www.paypalobjects.com/marketing/web/icons/monogram/pp32.png" alt="Agent"/></div>`
    : `<div class="pp-msg-avatar" style="background:#003087;color:white;font-weight:700;font-size:12px;">U</div>`;

  msg.innerHTML = `
    ${avatarHtml}
    <div class="pp-msg-bubble">
      <p>${escapeHtml(text)}</p>
      <span class="pp-msg-time">${getTime()}</span>
    </div>
  `;
  chatMessages.appendChild(msg);
  scrollToBottom();
}

// ---- AUTO REPLIES ----
function getAutoReply(category) {
  const replies = {
    'Account access or security': "Thanks for reaching out about your account. I can see your message and I'm looking into this right now. Could you confirm the email address linked to your account so I can pull up your details?",
    'Sending or receiving money': "I've received your message about a payment issue. I'll review the details and get back to you shortly. Could you provide the transaction ID or the approximate date and amount?",
    'Disputes or claims': "Thank you for contacting us about a dispute. I'm reviewing your case now. Please hold on while I pull up the relevant transaction details.",
    'Refunds or cancellations': "I've got your refund request. Let me look into the status of this for you right now. This usually takes just a moment.",
    'Unauthorized activity': "I can see you've reported unauthorized activity — this is our highest priority. I'm flagging your account for review immediately. Please do not make any further transactions until I get back to you.",
    'Withdrawals or bank account': "Thanks for reaching out about your bank account. I'm looking at your account details now. Can you confirm the last 4 digits of the bank account in question?",
    'PayPal credit or debit card': "I've received your message about your PayPal card. I'm pulling up your card details now. Please give me a moment.",
    'Other': "Thanks for getting in touch! I've received your message and I'm reviewing the details. I'll respond with a solution as soon as possible."
  };
  return replies[category] || replies['Other'];
}

// ---- FORM VALIDATION SHAKE ----
function shakeField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.4s ease';
  el.style.borderColor = '#e53e3e';
  el.focus();
  setTimeout(() => {
    el.style.borderColor = '';
    el.style.animation = '';
  }, 1200);
}

// ---- ESCAPE HTML ----
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// ---- SHAKE ANIMATION ----
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
`;
document.head.appendChild(shakeStyle);
