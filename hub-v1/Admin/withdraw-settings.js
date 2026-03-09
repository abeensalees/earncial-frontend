// ================================================
// EARNCIAL ADMIN - WITHDRAWAL SETTINGS
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('admin_token') || localStorage.getItem('earncial_token');

// Duplicate check — stores last sent payload
let lastSentPayload = null;

// Delete target
let pendingDeleteId = null;

// ============ AUTH CHECK ============
function checkAuth() {
    if (!token) {
        showToast('error', 'Auth Error', 'Please login as admin first');
        setTimeout(() => window.location.href = 'admin-login.html', 2000);
        return false;
    }
    return true;
}

// ============ THEME / SIDEBAR ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    document.getElementById('themeIcon').className =
        document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
}

function openSidebar() {
    document.getElementById('sidebar')?.classList.add('active');
    document.getElementById('sidebarOverlay')?.classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('active');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
}

// ============ MODAL HELPERS ============
function openModal(id) {
    document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
}

// ============ LOGOUT ============
function showLogoutModal() {
    openModal('logoutModal');
}

function confirmLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('earncial_token');
    token = null;
    showToast('success', 'Logged Out', 'Redirecting to login...');
    setTimeout(() => window.location.href = 'admin-login.html', 1500);
}

// ============ TOAST ============
function showToast(type, title, msg = '') {
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
        <i class="fas ${icons[type] || 'fa-info-circle'} toast-icon"></i>
        <div class="toast-content">
            <strong>${title}</strong>
            <p>${msg}</p>
        </div>`;
    document.getElementById('toastContainer')?.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ============================================
// WITHDRAWAL SETTINGS — LOAD & SAVE
// ============================================

async function loadSettings() {
    if (!checkAuth()) return;
    try {
        const res = await fetch(`${API_URL}/api/admin/withdrawal-settings`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);

        const data = await res.json();
        const s = data.settings || data.data || data;

        document.getElementById('minAmount').value   = s.minAmount   ?? 500;
        document.getElementById('maxAmount').value   = s.maxAmount   ?? 50000;
        document.getElementById('dailyLimit').value  = s.dailyLimit  ?? 100000;
        document.getElementById('feePercent').value  = s.feePercent  ?? 2;
        document.getElementById('pinAttempts').value = s.pinAttempts ?? 3;
        // backend stores minutes → display as hours
        document.getElementById('lockDuration').value = s.lockDuration
            ? +(s.lockDuration / 60).toFixed(2)
            : 1;

        console.log('✅ Settings loaded');
    } catch (err) {
        console.error('❌ Load settings error:', err);
        showToast('error', 'Load Failed', err.message);
    }
}

async function saveSettings() {
    if (!checkAuth()) return;

    const btn   = document.getElementById('saveSettingsBtn');
    const min   = parseFloat(document.getElementById('minAmount').value);
    const max   = parseFloat(document.getElementById('maxAmount').value);
    const daily = parseFloat(document.getElementById('dailyLimit').value);
    const fee   = parseFloat(document.getElementById('feePercent').value);
    const pin   = parseInt(document.getElementById('pinAttempts').value);
    const lockHrs = parseFloat(document.getElementById('lockDuration').value);

    if (!min || !max || min >= max) {
        showToast('error', 'Invalid Limits', 'Minimum must be less than maximum'); return;
    }
    if (fee < 0 || fee > 100) {
        showToast('error', 'Invalid Fee', 'Fee must be between 0% and 100%'); return;
    }
    if (pin < 1) {
        showToast('error', 'Invalid PIN Attempts', 'Must be at least 1'); return;
    }
    if (!lockHrs || lockHrs < 0.1) {
        showToast('error', 'Invalid Lock Duration', 'Must be at least 0.1 hours'); return;
    }

    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/api/admin/withdrawal-settings`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                minAmount:    min,
                maxAmount:    max,
                dailyLimit:   daily,
                feePercent:   fee,
                pinAttempts:  pin,
                lockDuration: Math.round(lockHrs * 60) // hours → minutes for backend
            })
        });
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(e.message || 'Failed to save settings');
        }
        showToast('success', 'Settings Saved!', 'Withdrawal rules updated successfully');
    } catch (err) {
        console.error('❌ Save settings error:', err);
        showToast('error', 'Save Failed', err.message);
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

function resetSettings() {
    document.getElementById('minAmount').value   = 500;
    document.getElementById('maxAmount').value   = 50000;
    document.getElementById('dailyLimit').value  = 100000;
    document.getElementById('feePercent').value  = 2;
    document.getElementById('pinAttempts').value = 3;
    document.getElementById('lockDuration').value= 1;
    showToast('success', 'Reset Done', 'Settings restored to defaults');
}

// ============================================
// MESSAGES — STATE
// ============================================

let currentTarget = 'general';
let currentType   = 'info';

const typeColorMap = { info:'blue', success:'green', warning:'orange', danger:'red', purple:'purple' };
const typeIconMap  = { info:'fa-info-circle', success:'fa-check-circle', warning:'fa-exclamation-triangle', danger:'fa-times-circle', purple:'fa-star' };

function switchTarget(t) {
    currentTarget = t;
    document.getElementById('tabGeneral')?.classList.toggle('active', t === 'general');
    document.getElementById('tabPersonal')?.classList.toggle('active', t === 'personal');
    document.getElementById('userSearchWrap')?.classList.toggle('visible', t === 'personal');
}

function selectType(type, btn) {
    currentType = type;
    document.querySelectorAll('.msg-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updatePreview();
}

function updatePreview() {
    const title = document.getElementById('msgTitle')?.value || 'Banner Title';
    const body  = document.getElementById('msgBody')?.value  || 'Your message will appear here as you type...';
    const color = typeColorMap[currentType] || 'blue';
    const icon  = typeIconMap[currentType]  || 'fa-info-circle';
    const prev  = document.getElementById('bannerPreview');

    if (prev) prev.className = `banner-preview ${color}`;
    const pIcon = document.getElementById('previewIcon');
    if (pIcon) pIcon.className = `fas ${icon}`;
    const pTitle = document.getElementById('previewTitle');
    if (pTitle) pTitle.textContent = title;
    const pBody = document.getElementById('previewBody');
    if (pBody) pBody.textContent = body;

    const cc = document.getElementById('charCount');
    if (cc) cc.textContent = document.getElementById('msgBody')?.value.length || 0;
}

async function searchUser(q) {
    if (!q || q.length < 2) return;
    try {
        const res = await fetch(`${API_URL}/api/admin/users/search?q=${encodeURIComponent(q)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        console.log('🔍 User search results:', data);
        // TODO: render dropdown
    } catch (err) {
        console.error('❌ User search error:', err);
    }
}

// ============ DUPLICATE CHECK ============
function isDuplicateMessage(payload) {
    if (!lastSentPayload) return false;
    return (
        lastSentPayload.title  === payload.title  &&
        lastSentPayload.text   === payload.text   &&
        lastSentPayload.type   === payload.type   &&
        lastSentPayload.target === payload.target &&
        lastSentPayload.userId === payload.userId
    );
}

// ============ SEND MESSAGE ============
async function saveMessage() {
    if (!checkAuth()) return;

    const btn    = document.getElementById('saveMsgBtn');
    const title  = document.getElementById('msgTitle')?.value.trim();
    const body   = document.getElementById('msgBody')?.value.trim();
    const userId = document.getElementById('userSearch')?.value.trim();
    const expiry = document.getElementById('msgExpiry')?.value;

    if (!title) { showToast('error', 'Missing Title', 'Please enter a banner title'); return; }
    if (!body)  { showToast('error', 'Missing Message', 'Please enter a banner message'); return; }
    if (currentTarget === 'personal' && !userId) {
        showToast('error', 'No User Selected', 'Please search and select a user'); return;
    }

    // Validate expiry — must be in future if set
    if (expiry) {
        const expiryDate = new Date(expiry);
        if (expiryDate <= new Date()) {
            showToast('error', 'Invalid Expiry', 'Expiry date must be in the future'); return;
        }
    }

    const payload = {
        messageType: 'withdraw-user-message',
        target:  currentTarget,
        username: currentTarget === 'personal' ? userId : null,
        type:    currentType,
        title,
        text:    body,
        icon:    typeIconMap[currentType],
        expiresAt: expiry ? new Date(expiry).toISOString() : null
    };

    // Duplicate check
    if (isDuplicateMessage(payload)) {
        showToast('error', 'Duplicate Message', 'This exact message was already sent. Change the content to send again.');
        return;
    }

    btn.classList.add('loading');
    btn.disabled = true;

    try {
        const endpoint = `${API_URL}/api/admin/withdrawal-settings/messages`;

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(e.message || 'Failed to send message');
        }

        lastSentPayload = { ...payload };
        const who = currentTarget === 'general' ? 'all users' : userId;
        showToast('success', 'Message Sent!', `Banner sent to ${who}`);
        resetMessage();
        loadMessageHistory(); // refresh table

    } catch (err) {
        console.error('❌ Save message error:', err);
        showToast('error', 'Send Failed', err.message);
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

function resetMessage() {
    if (document.getElementById('msgTitle'))  document.getElementById('msgTitle').value  = '';
    if (document.getElementById('msgBody'))   document.getElementById('msgBody').value   = '';
    if (document.getElementById('userSearch')) document.getElementById('userSearch').value = '';
    if (document.getElementById('msgExpiry')) document.getElementById('msgExpiry').value = '';
    if (document.getElementById('charCount')) document.getElementById('charCount').textContent = '0';
    currentType = 'info';
    document.querySelectorAll('.msg-type-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.msg-type-btn.t-info')?.classList.add('active');
    switchTarget('general');
    updatePreview();
}

// ============================================
// MESSAGE HISTORY — LOAD, RENDER, DELETE
// ============================================

async function loadMessageHistory() {
    if (!checkAuth()) return;

    const tbody = document.getElementById('messageHistoryBody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr><td colspan="6">
            <div class="table-loading">
                <div class="spinner"></div>
                <p>Loading message history...</p>
            </div>
        </td></tr>`;

    try {
        const res = await fetch(`${API_URL}/api/admin/withdrawal-settings/messages`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);

        const data = await res.json();
        const messages = data.messages || data.data || data || [];

        renderMessageHistory(messages);

    } catch (err) {
        console.error('❌ Load message history error:', err);
        tbody.innerHTML = `
            <tr><td colspan="6">
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load history: ${err.message}</p>
                </div>
            </td></tr>`;
        showToast('error', 'Load Failed', err.message);
    }
}

function renderMessageHistory(messages) {
    const tbody = document.getElementById('messageHistoryBody');
    const countEl = document.getElementById('historyCount');
    if (!tbody) return;

    if (countEl) {
        countEl.textContent = `${messages.length} message${messages.length !== 1 ? 's' : ''}`;
    }

    if (!messages || messages.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6">
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No messages sent yet</p>
                </div>
            </td></tr>`;
        return;
    }

    const now = new Date();

    tbody.innerHTML = messages.map(msg => {
        // Type badge
        const typeLabel  = msg.type || 'info';
        const typeIcon   = typeIconMap[typeLabel] || 'fa-info-circle';

        // Target badge
        const isPersonal = msg.target === 'personal';
        const targetLabel = isPersonal
            ? `<span class="target-badge personal"><i class="fas fa-user"></i> ${msg.userId || 'Personal'}</span>`
            : `<span class="target-badge general"><i class="fas fa-globe"></i> General</span>`;

        // Expiry badge
        let expiryBadge;
        if (!msg.expiresAt) {
            expiryBadge = `<span class="expiry-badge noexpiry"><i class="fas fa-infinity"></i> Never</span>`;
        } else {
            const expiryDate = new Date(msg.expiresAt);
            const isExpired  = expiryDate < now;
            const dateStr    = expiryDate.toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
            expiryBadge = isExpired
                ? `<span class="expiry-badge expired"><i class="fas fa-times-circle"></i> ${dateStr}</span>`
                : `<span class="expiry-badge active"><i class="fas fa-check-circle"></i> ${dateStr}</span>`;
        }

        // Sent date
        const sentDate = msg.createdAt
            ? new Date(msg.createdAt).toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
            : '—';

        // Truncated text for title/body
        const titleText = (msg.title || '').length > 35
            ? msg.title.substring(0, 35) + '...'
            : (msg.title || '—');
        const bodyText = (msg.text || '').length > 60
            ? msg.text.substring(0, 60) + '...'
            : (msg.text || '—');

        return `
        <tr>
            <td class="msg-text-cell">
                <div class="msg-title-cell">${titleText}</div>
                <div class="msg-body-cell">${bodyText}</div>
            </td>
            <td>
                <span class="type-badge ${typeLabel}">
                    <i class="fas ${typeIcon}"></i>
                    ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}
                </span>
            </td>
            <td>${targetLabel}</td>
            <td>${expiryBadge}</td>
            <td style="font-size:12px;color:var(--text-muted);white-space:nowrap;">${sentDate}</td>
            <td>
                <div class="tbl-actions">
                    <button class="btn-icon-sm btn-copy"
                        title="Copy message"
                        onclick="copyMessage('${escStr(msg.title)}', '${escStr(msg.text)}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-icon-sm btn-delete"
                        title="Delete message"
                        onclick="showDeleteMessageModal('${msg._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// Escape string for use in inline onclick attribute
function escStr(str) {
    return (str || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"');
}

// ============ COPY MESSAGE ============
function copyMessage(title, text) {
    const full = `${title}\n${text}`;
    navigator.clipboard.writeText(full)
        .then(() => showToast('success', 'Copied!', 'Title & message copied to clipboard'))
        .catch(() => {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = full;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            showToast('success', 'Copied!', 'Title & message copied to clipboard');
        });
}

// ============ DELETE MESSAGE ============
function showDeleteMessageModal(id) {
    pendingDeleteId = id;
    openModal('deleteMessageModal');
}

async function confirmDeleteMessage() {
    if (!pendingDeleteId) return;
    if (!checkAuth()) return;

    try {
        const res = await fetch(`${API_URL}/api/admin/withdrawal-settings/messages/${pendingDeleteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(e.message || 'Failed to delete message');
        }

        showToast('success', 'Message Deleted', 'Message removed successfully');
        closeModal('deleteMessageModal');
        pendingDeleteId = null;
        loadMessageHistory();

    } catch (err) {
        console.error('❌ Delete message error:', err);
        showToast('error', 'Delete Failed', err.message);
    }
}

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Withdrawal Settings...');
    loadTheme();

    if (checkAuth()) {
        loadSettings();
        loadMessageHistory();
    }

    updatePreview();
    console.log('✅ Withdrawal Settings ready');
});

// ============ EXPORTS ============
window.toggleTheme            = toggleTheme;
window.openSidebar            = openSidebar;
window.closeSidebar           = closeSidebar;
window.openModal              = openModal;
window.closeModal             = closeModal;
window.showLogoutModal        = showLogoutModal;
window.confirmLogout          = confirmLogout;
window.switchTarget           = switchTarget;
window.selectType             = selectType;
window.updatePreview          = updatePreview;
window.searchUser             = searchUser;
window.saveSettings           = saveSettings;
window.resetSettings          = resetSettings;
window.saveMessage            = saveMessage;
window.resetMessage           = resetMessage;
window.loadMessageHistory     = loadMessageHistory;
window.copyMessage            = copyMessage;
window.showDeleteMessageModal = showDeleteMessageModal;
window.confirmDeleteMessage   = confirmDeleteMessage;