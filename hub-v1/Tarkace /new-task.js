// ================================================
// EARNCIAL - POST TASK JS
// post-tasks.js
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('earncial_token');
let currentUser = null;
let categories = [];   // platforms
let taskTypes  = [];   // all task types
let selectedPlatformId = null;
let selectedTaskTypeObj = null;

// ── AUTH ──
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const u = localStorage.getItem('earncial_user');
    if (!token || !u) { window.location.href = 'sign-in.html'; return false; }
    try { currentUser = JSON.parse(u); return true; }
    catch(e) { localStorage.clear(); window.location.href = 'sign-in.html'; return false; }
}

// ── THEME ──
function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const ic = document.getElementById('themeIcon');
        if (ic) ic.className = 'fas fa-sun';
    }
}
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const dark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    const ic = document.getElementById('themeIcon');
    if (ic) ic.className = dark ? 'fas fa-sun' : 'fas fa-moon';
}

// ── SIDEBAR ──
function openSidebar()  { document.getElementById('sidebar')?.classList.add('active'); document.getElementById('sidebarOverlay')?.classList.add('active'); }
function closeSidebar() { document.getElementById('sidebar')?.classList.remove('active'); document.getElementById('sidebarOverlay')?.classList.remove('active'); }

// ── MODAL ──
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
function showLogoutModal() { document.getElementById('logoutModal')?.classList.add('active'); }
function confirmLogout() { localStorage.clear(); window.location.href = 'sign-in.html'; }

// ── TOAST ──
function showToast(message, type = 'info', title = '') {
    const icons = { success:'fas fa-check-circle', error:'fas fa-times-circle', warning:'fas fa-exclamation-triangle', info:'fas fa-info-circle' };
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${icons[type]||icons.info}"></i>
        <div><strong>${title||type.charAt(0).toUpperCase()+type.slice(1)}</strong><br><span>${message}</span></div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
}

// ── GUIDES TOGGLE ──
function toggleGuide(header) {
    header.classList.toggle('open');
    const items = document.getElementById('guideItems');
    items.classList.toggle('open');
}

// ── LOAD PLATFORMS ──
async function loadPlatforms() {
    try {
        const res = await fetch(`${API_URL}/api/tasks/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        categories = data.categories || data || [];
        renderPlatformGrid();
    } catch(e) {
        console.error('loadPlatforms:', e);
        showToast('Failed to load platforms', 'error');
    }
}

// ── RENDER PLATFORM GRID ──
const PLATFORM_MAP = {
    instagram: { cls:'plat-ig', icon:'fab fa-instagram' },
    facebook:  { cls:'plat-fb', icon:'fab fa-facebook-f' },
    twitter:   { cls:'plat-tw', icon:'fab fa-twitter' },
    x:         { cls:'plat-tw', icon:'fab fa-twitter' },
    youtube:   { cls:'plat-yt', icon:'fab fa-youtube' },
    tiktok:    { cls:'plat-tt', icon:'fab fa-tiktok' },
    telegram:  { cls:'plat-tg', icon:'fab fa-telegram' },
    whatsapp:  { cls:'plat-wa', icon:'fab fa-whatsapp' },
    linkedin:  { cls:'plat-li', icon:'fab fa-linkedin-in' },
    snapchat:  { cls:'plat-sc', icon:'fab fa-snapchat-ghost' },
    reddit:    { cls:'plat-rd', icon:'fab fa-reddit-alien' },
    discord:   { cls:'plat-dc', icon:'fab fa-discord' }
};

function getPlatformMeta(name) {
    const key = (name||'').toLowerCase().replace(/[^a-z]/g,'');
    for (const k of Object.keys(PLATFORM_MAP)) {
        if (key.includes(k)) return PLATFORM_MAP[k];
    }
    return { cls:'', icon:'fas fa-globe' };
}

function renderPlatformGrid() {
    const grid = document.getElementById('platformGrid');
    if (!grid) return;
    if (!categories.length) {
        grid.innerHTML = `<p style="color:var(--text-muted);font-size:13px;grid-column:1/-1;">No platforms available</p>`;
        return;
    }
    grid.innerHTML = categories.map(cat => {
        const meta = getPlatformMeta(cat.name || cat.displayName);
        const name = cat.displayName || cat.name || '';
        return `<div class="platform-option ${meta.cls}" data-id="${cat._id}" onclick="selectPlatform('${cat._id}', this)">
            <i class="${meta.icon}"></i>
            <span>${name}</span>
        </div>`;
    }).join('');
}

function selectPlatform(id, el) {
    // Deselect all
    document.querySelectorAll('.platform-option').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
    selectedPlatformId = id;
    document.getElementById('platform').value = id;

    // Load task types for this platform
    loadTaskTypes(id);
}

// ── LOAD TASK TYPES ──
async function loadTaskTypes(categoryId) {
    const sel = document.getElementById('taskType');
    sel.disabled = true;
    sel.innerHTML = `<option>Loading...</option>`;

    try {
        const res = await fetch(`${API_URL}/api/tasks/task-types?category=${categoryId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        taskTypes = data.taskTypes || data || [];

        sel.innerHTML = `<option value="">— Select task type —</option>`;
        taskTypes.forEach(tt => {
            const opt = document.createElement('option');
            opt.value = tt._id;
            opt.textContent = tt.displayName || tt.name;
            sel.appendChild(opt);
        });
        sel.disabled = false;
    } catch(e) {
        sel.innerHTML = `<option value="">Failed to load</option>`;
        showToast('Failed to load task types', 'error');
    }
}

// ── UPDATE TASK DETAILS (reward) ──
function updateTaskDetails() {
    const sel = document.getElementById('taskType');
    const ttId = sel.value;
    if (!ttId) {
        document.getElementById('rewardSection').style.display = 'none';
        selectedTaskTypeObj = null;
        updateBudget();
        return;
    }
    selectedTaskTypeObj = taskTypes.find(t => t._id === ttId);
    if (selectedTaskTypeObj) {
        const reward = selectedTaskTypeObj.reward || selectedTaskTypeObj.earnerReward || 0;
        document.getElementById('rewardDisplay').textContent = reward.toLocaleString();
        document.getElementById('reward').value = reward;
        document.getElementById('rewardSection').style.display = 'block';
        updateBudget();
    }
}

// ── UPDATE BUDGET CALCULATOR ──
function updateBudget() {
    const participants = parseInt(document.getElementById('participants')?.value) || 0;
    const reward       = parseFloat(document.getElementById('reward')?.value) || 0;
    const total        = participants * reward;

    const el = (id, val) => { const e = document.getElementById(id); if(e) e.textContent = val; };
    el('calcParticipants', participants > 0 ? participants.toLocaleString() : '—');
    el('calcReward', reward.toLocaleString());
    el('calcTotal', total.toLocaleString('en-NG', { minimumFractionDigits: 2 }));

    // Balance check
    const balEl = document.getElementById('balanceCheck');
    const balText = document.getElementById('balanceCheckText');
    if (total > 0 && balEl) {
        const balance = currentUser?.balance || 0;
        balEl.style.display = 'flex';
        if (balance >= total) {
            balEl.className = 'balance-check balance-ok';
            balEl.querySelector('i').className = 'fas fa-check-circle';
            if (balText) balText.textContent = `Your balance ₦${balance.toLocaleString()} is sufficient`;
        } else {
            balEl.className = 'balance-check balance-low';
            balEl.querySelector('i').className = 'fas fa-exclamation-circle';
            if (balText) balText.textContent = `Insufficient — need ₦${(total - balance).toLocaleString()} more`;
        }
    } else if (balEl) {
        balEl.style.display = 'none';
    }
}

// ── IMAGE HANDLING ──
function handleImageSelect(input) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showToast('Image too large. Max 5MB', 'warning');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('imgPreview').src   = e.target.result;
        document.getElementById('imgName').textContent  = file.name;
        document.getElementById('imgSize').textContent  = (file.size / 1024).toFixed(1) + ' KB';
        document.getElementById('imgPreviewBox').style.display = 'block';
        document.getElementById('uploadArea').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    document.getElementById('sampleImage').value = '';
    document.getElementById('imgPreviewBox').style.display = 'none';
    document.getElementById('uploadArea').style.display   = 'block';
    document.getElementById('imgPreview').src = '';
}

// ── SUBMIT TASK ──
async function submitTask(e) {
    e.preventDefault();

    const platform    = document.getElementById('platform').value;
    const taskType    = document.getElementById('taskType').value;
    const taskUrl     = document.getElementById('taskUrl').value.trim();
    const participants = parseInt(document.getElementById('participants').value);
    const customDesc  = document.getElementById('customDescription').value.trim();
    const imageFile   = document.getElementById('sampleImage').files[0];
    const reward      = parseFloat(document.getElementById('reward').value) || 0;

    // Validate
    if (!platform)      return showToast('Please select a platform', 'warning');
    if (!taskType)      return showToast('Please select a task type', 'warning');
    if (!taskUrl)       return showToast('Please enter the task URL', 'warning');
    if (!participants || participants < 10) return showToast('Minimum 10 participants', 'warning');
    if (reward <= 0)    return showToast('Reward not loaded. Select task type again', 'warning');

    // Balance check
    const total = participants * reward;
    if ((currentUser?.balance || 0) < total) {
        return showToast(`Insufficient balance. Need ₦${total.toLocaleString()}`, 'error', 'Insufficient Balance');
    }

    // Set loading
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.classList.add('loading');

    try {
        const formData = new FormData();
        formData.append('category',     platform);
        formData.append('taskType',     taskType);
        formData.append('taskUrl',      taskUrl);
        formData.append('participants', participants);
        formData.append('reward',       reward);
        if (customDesc) formData.append('customDescription', customDesc);
        if (imageFile)  formData.append('sampleImage', imageFile);

        const res = await fetch(`${API_URL}/api/tasks`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to post task');
        }

        // Success
        const taskIdEl = document.getElementById('modalTaskId');
        if (taskIdEl) taskIdEl.textContent = `Task ID: ${data.task?.taskId || 'SUBMITTED'}`;

        document.getElementById('successModal').classList.add('active');
        loadRecentTasks();

        // Refresh user balance
        refreshUserBalance();

    } catch(err) {
        showToast(err.message || 'Failed to post task', 'error', 'Error');
    } finally {
        btn.disabled = false;
        btn.classList.remove('loading');
    }
}

// ── REFRESH USER BALANCE ──
async function refreshUserBalance() {
    try {
        const res = await fetch(`${API_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.user) {
            currentUser = { ...currentUser, ...data.user };
            localStorage.setItem('earncial_user', JSON.stringify(currentUser));
            updateBudget(); // Refresh balance check
        }
    } catch(e) {}
}

// ── RESET FORM ──
function resetForm() {
    document.getElementById('taskForm').reset();
    document.getElementById('platform').value = '';
    document.getElementById('reward').value = '';
    document.getElementById('rewardSection').style.display = 'none';
    document.getElementById('rewardDisplay').textContent = '0';
    document.getElementById('calcParticipants').textContent = '—';
    document.getElementById('calcReward').textContent = '0';
    document.getElementById('calcTotal').textContent = '0';
    document.getElementById('balanceCheck').style.display = 'none';
    document.querySelectorAll('.platform-option').forEach(p => p.classList.remove('selected'));

    const sel = document.getElementById('taskType');
    sel.innerHTML = `<option value="">— Select platform first —</option>`;
    sel.disabled = true;

    removeImage();
    selectedPlatformId = null;
    selectedTaskTypeObj = null;

    closeModal('successModal');
}

// ── LOAD RECENT TASKS ──
async function loadRecentTasks() {
    const body = document.getElementById('recentTasksBody');
    if (!body) return;

    try {
        const res = await fetch(`${API_URL}/api/tasks?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const tasks = data.tasks || data || [];

        if (!tasks.length) {
            body.innerHTML = `<div class="empty-recent"><i class="fas fa-tasks"></i>No tasks yet</div>`;
            return;
        }

        const statusDotMap = {
            active:'dot-active', review:'dot-review', completed:'dot-completed',
            rejected:'dot-rejected', paused:'dot-paused', cancelled:'dot-rejected'
        };
        const labelMap = {
            active:'Active', review:'Review', completed:'Done',
            rejected:'Rejected', paused:'Paused', cancelled:'Cancelled'
        };

        body.innerHTML = `<table class="recent-table">
            <thead><tr>
                <th>Platform</th>
                <th>Type</th>
                <th>Budget</th>
                <th>Status</th>
            </tr></thead>
            <tbody>
            ${tasks.map(t => `<tr>
                <td>${t.category?.displayName || '—'}</td>
                <td>${t.taskType?.displayName || '—'}</td>
                <td>₦${(t.totalBudget||0).toLocaleString()}</td>
                <td><span class="status-dot ${statusDotMap[t.status]||'dot-review'}">${labelMap[t.status]||t.status}</span></td>
            </tr>`).join('')}
            </tbody>
        </table>`;

    } catch(e) {
        body.innerHTML = `<div class="empty-recent"><i class="fas fa-exclamation-circle"></i>Failed to load</div>`;
    }
}

// ── DRAG & DROP ──
function setupDragDrop() {
    const area = document.getElementById('uploadArea');
    if (!area) return;
    area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const input = document.getElementById('sampleImage');
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            handleImageSelect(input);
        }
    });
}

// ── INIT ──
async function init() {
    if (!checkAuth()) return;
    loadTheme();
    setupDragDrop();
    window.addEventListener('resize', () => { if(window.innerWidth > 768) closeSidebar(); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') { closeModal('successModal'); closeModal('logoutModal'); }});

    // Participants input listener
    document.getElementById('participants')?.addEventListener('input', updateBudget);

    // Load data
    await Promise.all([
        loadPlatforms(),
        loadRecentTasks()
    ]);
}

window.addEventListener('DOMContentLoaded', init);
