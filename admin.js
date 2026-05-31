/* ============================================
   PayPal Support — Admin JavaScript
   Full dashboard logic:
   - Read/write sessions from localStorage
   - Render conversations sidebar
   - View full chat thread
   - Send replies that user sees live
   - Notifications / toasts
   - Auto-refresh polling
   ============================================ */

const STORAGE_KEY = 'pp_support_sessions';

// ---- STATE ----
let activeSessId = null;
let activeFilter = 'all';
let searchQuery  = '';
let lastSideCounts = {};
let pendingAdminImage = null;

// ---- STORAGE ----
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

async function deleteSession(id) {
  try {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', payload: { id } })
    });
  } catch (e) { console.error('DB delete failed', e); }
}

async function clearResolvedSessions() {
  try {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clearResolved' })
    });
  } catch (e) { console.error('DB clear resolved failed', e); }
}

// ---- UTILS ----
function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
         d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
}
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// ---- IMAGE HELPERS (admin) ----
function compressImageAdmin(file, maxWidth = 900, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) { height = Math.round(height * maxWidth / width); width = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function openLightboxAdmin(src) {
  const lb = document.createElement('div');
  lb.className = 'pp-lightbox';
  lb.innerHTML = `<img src="${src}" alt="Full image"/>`;
  lb.addEventListener('click', () => lb.remove());
  document.body.appendChild(lb);
}

// ---- TOAST ----
function showToast(icon, title, body, duration = 4000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'pp-toast';
  toast.innerHTML = `
    <div class="pp-toast-icon">${icon}</div>
    <div class="pp-toast-content">
      <div class="pp-toast-title">${title}</div>
      <div class="pp-toast-body">${body}</div>
    </div>
    <button class="pp-toast-close" aria-label="Dismiss">✕</button>
  `;
  container.appendChild(toast);
  toast.querySelector('.pp-toast-close').addEventListener('click', () => toast.remove());
  if (duration > 0) setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
}

// ---- RENDER SIDEBAR ----
async function renderSidebar() {
  const sessions = await getSessions();
  const list = document.getElementById('adminConvList');
  const noConvs = document.getElementById('noConvs');

  // Count tabs
  const all = Object.values(sessions);
  const open = all.filter(s => s.status === 'open');
  const resolved = all.filter(s => s.status === 'resolved');

  document.getElementById('countAll').textContent = all.length;
  document.getElementById('countOpen').textContent = open.length;
  document.getElementById('countResolved').textContent = resolved.length;

  // Detect new messages → toast
  all.forEach(s => {
    if (s.unread && s.id !== activeSessId) {
      const prev = lastSideCounts[s.id] || 0;
      const cur = s.messages ? s.messages.length : 0;
      if (cur > prev && prev > 0) {
        const last = s.messages[s.messages.length - 1];
        if (last && last.from === 'user') {
          showToast('💬', 'New message from ' + s.name, last.text.slice(0, 60) + (last.text.length > 60 ? '…' : ''));
        }
      }
      lastSideCounts[s.id] = cur;
    }
  });

  // Filter + search
  let filtered = all;
  if (activeFilter === 'open') filtered = open;
  if (activeFilter === 'resolved') filtered = resolved;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    );
  }

  // Sort by newest
  filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  // Clear existing items (keep noConvs)
  Array.from(list.querySelectorAll('.admin-conv-item')).forEach(el => el.remove());

  noConvs.style.display = filtered.length === 0 ? 'block' : 'none';

  filtered.forEach(s => {
    const lastMsg = s.messages && s.messages.length > 0
      ? s.messages[s.messages.length - 1]
      : null;
    const preview = lastMsg ? (lastMsg.from === 'agent' ? '↩ ' : '') + lastMsg.text.slice(0, 45) + (lastMsg.text.length > 45 ? '…' : '') : 'No messages';
    const unreadDot = s.unread && s.status === 'open' ? `<span class="admin-unread-badge">!</span>` : '';

    const item = document.createElement('div');
    item.className = `admin-conv-item${activeSessId === s.id ? ' active' : ''}${s.unread && s.status === 'open' ? ' unread' : ''}`;
    item.dataset.id = s.id;
    item.innerHTML = `
      <div class="admin-conv-top">
        <span class="admin-conv-name">${escapeHtml(s.name)}</span>
        <div style="display:flex;align-items:center;gap:6px;">
          ${unreadDot}
          <span class="admin-conv-time">${relativeTime(s.updatedAt)}</span>
        </div>
      </div>
      <div class="admin-conv-preview">${escapeHtml(preview)}</div>
      <div class="admin-conv-tags">
        <span class="admin-conv-tag ${s.status === 'resolved' ? 'tag-resolved' : 'tag-open'}">${s.status}</span>
        <span class="admin-conv-tag tag-new" style="background:rgba(160,174,192,0.1);color:#718096;">${escapeHtml(s.category || 'General')}</span>
      </div>
    `;
    item.addEventListener('click', () => openConversation(s.id));
    list.insertBefore(item, noConvs);
  });
}

// ---- OPEN CONVERSATION ----
async function openConversation(id) {
  const sessions = await getSessions();
  const session = sessions[id];
  if (!session) return;

  activeSessId = id;

  // Mark as read
  session.unread = false;
  await saveSession(session.id, session);

  // Update header
  document.getElementById('adminConvTitle').textContent = session.name + ' — ' + (session.category || 'Support');
  document.getElementById('adminConvSub').textContent = session.email;
  document.getElementById('infoName').textContent = session.name;
  document.getElementById('infoEmail').textContent = session.email;
  document.getElementById('infoCategory').textContent = session.category;
  document.getElementById('infoId').textContent = id.slice(0, 12) + '…';
  document.getElementById('infoCreated').textContent = formatDate(session.createdAt);
  document.getElementById('infoMsgCount').textContent = (session.messages || []).length;

  // Status badge
  const badge = document.getElementById('adminConvStatusBadge');
  badge.textContent = session.status;
  badge.className = `admin-conv-tag ${session.status === 'resolved' ? 'tag-resolved' : 'tag-open'}`;

  // Resolve/delete buttons
  const resolveBtn = document.getElementById('resolveBtn');
  if (session.status === 'resolved') {
    resolveBtn.textContent = '↺ Reopen';
    resolveBtn.className = 'admin-btn';
  } else {
    resolveBtn.textContent = '✓ Mark Resolved';
    resolveBtn.className = 'admin-btn admin-btn-success';
  }

  // Show/hide reply box
  document.getElementById('adminReplyBox').style.display = session.status === 'resolved' ? 'none' : 'block';
  if (session.status === 'resolved') {
    document.getElementById('adminReplyBox').style.display = 'none';
  } else {
    document.getElementById('adminReplyBox').style.display = 'block';
  }

  // Render messages
  renderMessages(session.messages || []);

  // Show chat view
  document.getElementById('adminEmptyState').style.display = 'none';
  document.getElementById('adminChatView').classList.add('visible');

  // Mobile toggle: hide sidebar, show main
  document.querySelector('.admin-sidebar').classList.add('hide-on-mobile');
  document.querySelector('.admin-main').classList.add('show-on-mobile');

  // Refresh sidebar highlight
  renderSidebar();
}

// ---- BACK BUTTON (MOBILE) ----
const backBtn = document.getElementById('adminBackBtn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    document.querySelector('.admin-sidebar').classList.remove('hide-on-mobile');
    document.querySelector('.admin-main').classList.remove('show-on-mobile');
    activeSessId = null;
    renderSidebar();
  });
}

// ---- RENDER MESSAGES ----
function renderMessages(messages) {
  const container = document.getElementById('adminChatMessages');
  container.innerHTML = '';

  messages.forEach(m => {
    const isAgent = m.from === 'agent';
    const div = document.createElement('div');
    div.className = `admin-msg ${isAgent ? 'from-agent' : 'from-user'}`;
    div.id = 'amsg-' + m.id;

    const avatarChar = isAgent ? 'PP' : (activeSessId ? (getSessions()[activeSessId]?.name || 'U').charAt(0).toUpperCase() : 'U');

    const contentHtml = (m.type === 'image' && m.imageUrl)
      ? `<img class="admin-msg-image" src="${m.imageUrl}" alt="Image"/>`
      : `<div class="admin-msg-text">${escapeHtml(m.text)}</div>`;

    div.innerHTML = `
      <div class="admin-msg-avatar">${avatarChar}</div>
      <div class="admin-msg-content">
        ${contentHtml}
        <div class="admin-msg-meta">${isAgent ? 'PayPal Support' : 'User'} · ${m.time || ''}</div>
      </div>
    `;

    if (m.type === 'image' && m.imageUrl) {
      div.querySelector('.admin-msg-image').addEventListener('click', () => openLightboxAdmin(m.imageUrl));
    }

    container.appendChild(div);
  });

  container.scrollTop = container.scrollHeight;
}

// ---- SEND ADMIN REPLY ----
async function sendAdminReply() {
  const input = document.getElementById('adminReplyInput');
  const text = input.value.trim();
  const hasImage = !!pendingAdminImage;
  if ((!text && !hasImage) || !activeSessId) return;

  const sessions = await getSessions();
  const session = sessions[activeSessId];
  if (!session || session.status === 'resolved') return;

  const imageToSend = pendingAdminImage;

  // Clear image preview
  if (hasImage) {
    pendingAdminImage = null;
    const previewArea = document.getElementById('adminImgPreviewArea');
    if (previewArea) { previewArea.style.display = 'none'; previewArea.innerHTML = ''; }
    const adminImgInput = document.getElementById('adminImgInput');
    if (adminImgInput) adminImgInput.value = '';
  }

  session.messages = session.messages || [];

  if (hasImage) {
    const imgMsg = { id: generateId(), from: 'agent', type: 'image', imageUrl: imageToSend, text: '', time: getTime(), timestamp: Date.now() };
    session.messages.push(imgMsg);
    appendAdminMessage(imgMsg, session.name);
  }
  if (text) {
    const txtMsg = { id: generateId(), from: 'agent', type: 'text', text, time: getTime(), timestamp: Date.now() };
    session.messages.push(txtMsg);
    appendAdminMessage(txtMsg, session.name);
  }

  session.updatedAt = Date.now();
  await saveSession(session.id, session);

  // Clear input
  input.value = '';
  document.getElementById('charCount').textContent = '0 / 1000';
  input.style.height = 'auto';

  // Update info count
  document.getElementById('infoMsgCount').textContent = session.messages.length;

  // Refresh sidebar
  renderSidebar();

  // Notify User via Email
  const notifyText = text || '📷 [Image attached]';
  fetch('/api/notify-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: session.name, email: session.email, message: notifyText })
  })
  .then(res => res.json())
  .then(data => { if (data.error) showToast('❌', 'Email Error', data.error); })
  .catch(err => console.error('Failed to notify user via email:', err));

  showToast('✅', 'Reply sent', 'Your message has been delivered to ' + session.name + '.', 2500);
}

// ---- APPEND ADMIN MESSAGE (without full re-render) ----
function appendAdminMessage(m, userName) {
  const container = document.getElementById('adminChatMessages');
  if (!container) return;

  const isAgent = m.from === 'agent';
  const div = document.createElement('div');
  div.className = `admin-msg ${isAgent ? 'from-agent' : 'from-user'}`;
  div.id = 'amsg-' + m.id;

  const avatarChar = isAgent ? 'PP' : (userName || 'U').charAt(0).toUpperCase();

  const contentHtml = (m.type === 'image' && m.imageUrl)
    ? `<img class="admin-msg-image" src="${m.imageUrl}" alt="Image"/>`
    : `<div class="admin-msg-text">${escapeHtml(m.text)}</div>`;

  div.innerHTML = `
    <div class="admin-msg-avatar">${avatarChar}</div>
    <div class="admin-msg-content">
      ${contentHtml}
      <div class="admin-msg-meta">${isAgent ? 'PayPal Support' : 'User'} · ${m.time || getTime()}</div>
    </div>
  `;

  if (m.type === 'image' && m.imageUrl) {
    div.querySelector('.admin-msg-image').addEventListener('click', () => openLightboxAdmin(m.imageUrl));
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ---- POLL FOR NEW USER MESSAGES ----
let lastMsgCounts = {};
setInterval(async () => {
  const sessions = await getSessions();

  // Check for new messages in the active convo
  if (activeSessId && sessions[activeSessId]) {
    const sess = sessions[activeSessId];
    const prev = lastMsgCounts[activeSessId] || 0;
    const cur = (sess.messages || []).length;
    if (cur > prev) {
      const newMsgs = (sess.messages || []).slice(prev);
      newMsgs.forEach(m => {
        if (!document.getElementById('amsg-' + m.id)) {
          appendAdminMessage(m, sess.name);
          document.getElementById('infoMsgCount').textContent = cur;
        }
      });
      lastMsgCounts[activeSessId] = cur;
    }
  }

  // Refresh sidebar counts (cheap)
  renderSidebar();
}, 1500);

// ---- RESOLVE / REOPEN ----
document.getElementById('resolveBtn').addEventListener('click', async () => {
  if (!activeSessId) return;
  const sessions = await getSessions();
  const session = sessions[activeSessId];
  if (!session) return;

  if (session.status === 'resolved') {
    session.status = 'open';
    showToast('↺', 'Conversation reopened', session.name + "'s conversation is now open.");
  } else {
    session.status = 'resolved';
    session.unread = false;
    showToast('✅', 'Marked as resolved', session.name + "'s conversation has been resolved.");
  }
  session.updatedAt = Date.now();
  await saveSession(session.id, session);
  openConversation(activeSessId);
});

// ---- DELETE CONVERSATION ----
document.getElementById('deleteConvBtn').addEventListener('click', async () => {
  if (!activeSessId) return;
  const sessions = await getSessions();
  const session = sessions[activeSessId];
  if (!session) return;
  if (!confirm(`Delete conversation with ${session.name}? This cannot be undone.`)) return;
  await deleteSession(activeSessId);
  activeSessId = null;
  document.getElementById('adminEmptyState').style.display = 'flex';
  document.getElementById('adminChatView').classList.remove('visible');
  renderSidebar();
  showToast('🗑', 'Conversation deleted', 'The conversation has been permanently removed.');
});

// ---- CLEAR RESOLVED ----
document.getElementById('clearResolvedBtn').addEventListener('click', async () => {
  const sessions = await getSessions();
  const count = Object.values(sessions).filter(s => s.status === 'resolved').length;
  if (count === 0) { showToast('ℹ️', 'Nothing to clear', 'There are no resolved conversations.'); return; }
  if (!confirm(`Delete all ${count} resolved conversations?`)) return;
  await clearResolvedSessions();
  if (activeSessId && !sessions[activeSessId]) {
    activeSessId = null;
    document.getElementById('adminEmptyState').style.display = 'flex';
    document.getElementById('adminChatView').classList.remove('visible');
  }
  renderSidebar();
  showToast('🗑', 'Cleared', `${count} resolved conversations removed.`);
});

// ---- REFRESH BTN ----
document.getElementById('refreshBtn').addEventListener('click', () => {
  renderSidebar();
  if (activeSessId) openConversation(activeSessId);
  showToast('↻', 'Refreshed', 'Dashboard data has been refreshed.', 1500);
});

// ---- SIDEBAR TABS ----
document.querySelectorAll('.admin-sidebar-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-sidebar-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeFilter = tab.dataset.filter;
    renderSidebar();
  });
});

// ---- SEARCH ----
document.getElementById('convSearch').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderSidebar();
});

// ---- ADMIN REPLY INPUT ----
const adminReplyInput = document.getElementById('adminReplyInput');
const charCount = document.getElementById('charCount');

adminReplyInput.addEventListener('input', () => {
  const len = adminReplyInput.value.length;
  charCount.textContent = `${len} / 1000`;
  charCount.style.color = len > 900 ? '#f87171' : '#4a5568';
  // Auto-resize
  adminReplyInput.style.height = 'auto';
  adminReplyInput.style.height = Math.min(adminReplyInput.scrollHeight, 160) + 'px';
});

adminReplyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAdminReply();
  }
});

document.getElementById('adminSendBtn').addEventListener('click', sendAdminReply);

// ---- QUICK REPLIES ----
document.querySelectorAll('.admin-quick-reply').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.dataset.text;
    adminReplyInput.value = text;
    charCount.textContent = `${text.length} / 1000`;
    adminReplyInput.focus();
    adminReplyInput.style.height = 'auto';
    adminReplyInput.style.height = Math.min(adminReplyInput.scrollHeight, 160) + 'px';
  });
});

// ---- INITIAL RENDER ----
renderSidebar();

// Notify admin they're live
showToast('🟢', 'Admin Dashboard Active', 'You are online and will receive messages from users.', 3000);
