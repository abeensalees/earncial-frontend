// ================================================
// EARNCIAL ADVERTISER - MANAGE TASKS
// FULL WORKING VERSION WITH REAL API
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// ============ CHECK AUTH ============
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');
    if (!token || !userData) { window.location.href = 'sign-in.html'; return false; }
    try { currentUser = JSON.parse(userData); return true; }
    catch (e) { localStorage.clear(); window.location.href = 'sign-in.html'; return false; }
}

// ============ DOM ELEMENTS ============
const sidebar         = document.getElementById('sidebar');
const overlay         = document.getElementById('sidebarOverlay');
const themeIcon       = document.getElementById('themeIcon');
const toastContainer  = document.getElementById('toastContainer');
const tasksTableBody  = document.getElementById('tasksTableBody');
const emptyState      = document.getElementById('emptyState');
const searchInput     = document.getElementById('searchInput');
const filterBtns      = document.querySelectorAll('.filter-btn');
const taskDetailsModal    = document.getElementById('taskDetailsModal');
const confirmModal        = document.getElementById('confirmModal');
const refundModal         = document.getElementById('refundModal');
const increaseModal       = document.getElementById('increaseModal');
const rejectedReasonModal = document.getElementById('rejectedReasonModal');

const totalTasksEl     = document.getElementById('totalTasks');
const activeTasksEl    = document.getElementById('activeTasks');
const pausedTasksEl    = document.getElementById('pausedTasks');
const completedTasksEl = document.getElementById('completedTasks');
const cancelledTasksEl = document.getElementById('cancelledTasks');

// ============ STATE ============
let tasks         = [];
let filteredTasks = [];
let currentFilter = 'all';
let currentAction = null;
let selectedTaskId = null;
let selectedTask   = null;
let refundAmount   = 0;

// ============ ICON MAPS ============
const platformIcons = {
    facebook:'fab fa-facebook-f', instagram:'fab fa-instagram', twitter:'fab fa-twitter',
    tiktok:'fab fa-tiktok', youtube:'fab fa-youtube', whatsapp:'fab fa-whatsapp',
    telegram:'fab fa-telegram', linkedin:'fab fa-linkedin-in', snapchat:'fab fa-snapchat-ghost',
    pinterest:'fab fa-pinterest', reddit:'fab fa-reddit-alien', discord:'fab fa-discord'
};
const taskTypeIcons = {
    follow:'fas fa-user-plus', like:'fas fa-thumbs-up', share:'fas fa-share-alt',
    comment:'fas fa-comment', join:'fas fa-users', subscribe:'fas fa-bell',
    watch:'fas fa-eye', view:'fas fa-eye', download:'fas fa-download',
    visit:'fas fa-external-link-alt', signup:'fas fa-user-plus', rate:'fas fa-star',
    retweet:'fas fa-retweet', save:'fas fa-bookmark', click:'fas fa-mouse-pointer'
};

// ============ SIDEBAR ============
function openSidebar()  { sidebar.classList.add('active'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeSidebar() { sidebar.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow = 'auto'; }

// ============ THEME ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeIcon.classList.toggle('fa-moon', !isDark);
    themeIcon.classList.toggle('fa-sun', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeIcon) { themeIcon.classList.remove('fa-moon'); themeIcon.classList.add('fa-sun'); }
    }
}

// ============ TOAST ============
function showToast(message, type = 'info', title = '') {
    const icons = { success:'fas fa-check-circle', error:'fas fa-exclamation-circle', warning:'fas fa-exclamation-triangle', info:'fas fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="${icons[type] || icons.info}"></i></div>
        <div class="toast-content">${title ? `<strong>${title}</strong>` : ''}<p>${message}</p></div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 5000);
}

// ============ HELPERS ============
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showToast('Task ID copied!', 'success', 'Copied!'))
        .catch(() => showToast('Failed to copy', 'error', 'Error'));
}

function formatDate(dateString) {
    const date = new Date(dateString), now = new Date(), diff = now - date;
    const mins = Math.floor(diff/60000), hrs = Math.floor(mins/60), days = Math.floor(hrs/24);
    if (days === 0) {
        if (hrs === 0) return mins === 0 ? 'Just now' : `${mins}m ago`;
        return `${hrs}h ago`;
    }
    if (days === 1) return 'Yesterday';
    if (days < 7)  return `${days} days ago`;
    return date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

function getPlatformIcon(cat) {
    if (cat?.icon) return cat.icon;
    if (cat?.name) return platformIcons[cat.name.toLowerCase()] || 'fas fa-globe';
    return 'fas fa-globe';
}
function getTaskTypeIcon(tt) {
    if (tt?.icon) return tt.icon;
    if (tt?.name) return taskTypeIcons[tt.name.toLowerCase()] || 'fas fa-tasks';
    return 'fas fa-tasks';
}

// ============ LOAD STATS ============
async function loadStats() {
    try {
        const res  = await fetch(`${API_URL}/api/tasks/stats/summary`, { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const stats = await res.json();
        totalTasksEl.textContent     = stats.total     || 0;
        activeTasksEl.textContent    = stats.active    || 0;
        pausedTasksEl.textContent    = stats.paused    || 0;
        completedTasksEl.textContent = stats.completed || 0;
        cancelledTasksEl.textContent = stats.rejected  || 0;
        const reviewEl = document.getElementById('reviewTasks');
        if (reviewEl) reviewEl.textContent = stats.review || 0;
    } catch {}
}

// ============ LOAD TASKS ============
async function loadTasks() {
    try {
        const res  = await fetch(`${API_URL}/api/tasks/my-tasks`, { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to load tasks');
        const data = await res.json();
        tasks = data.tasks || data || [];
        await loadStats();
        filterTasks('all');
    } catch (err) {
        const loading = document.getElementById('tableLoading');
        if (loading) loading.style.display = 'none';
        emptyState.style.display = 'block';
        showToast(err.message || 'Error loading tasks', 'error', 'Error');
    }
}

// ============ REFRESH TASKS ============
async function refreshTasks() {
    const btn = document.querySelector('.refresh-btn');
    if (btn) { btn.style.pointerEvents = 'none'; btn.querySelector('i').style.animation = 'spin 0.6s linear infinite'; }
    await loadTasks();
    if (btn) { btn.style.pointerEvents = 'auto'; btn.querySelector('i').style.animation = ''; }
}

// ============ FILTER ============
function filterTasks(filter) {
    currentFilter = filter;
    filterBtns.forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.filter-${filter}`);
    if (activeBtn) activeBtn.classList.add('active');
    const map = { all:null, active:'active', paused:'paused', pending:'review', completed:'completed', cancelled:'cancelled', rejected:'rejected' };
    filteredTasks = filter === 'all' ? [...tasks] : tasks.filter(t => t.status === map[filter]);
    renderTasks();
}

// ============ SEARCH ============
function searchTasks() {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) { filterTasks(currentFilter); return; }
    filteredTasks = tasks.filter(t =>
        t.taskId.toLowerCase().includes(q) ||
        t.category?.displayName?.toLowerCase().includes(q) ||
        t.taskType?.displayName?.toLowerCase().includes(q)
    );
    renderTasks();
}

// ============ RENDER TASKS ============
function renderTasks() {
    const loading = document.getElementById('tableLoading');
    if (loading) loading.style.display = 'none';
    if (filteredTasks.length === 0) { tasksTableBody.innerHTML = ''; emptyState.style.display = 'block'; return; }
    emptyState.style.display = 'none';

    let html = '';
    filteredTasks.forEach((task, i) => {
        const progress      = task.participants > 0 ? (task.completedCount / task.participants) * 100 : 0;
        const platformIcon  = getPlatformIcon(task.category);
        const taskTypeIcon  = getTaskTypeIcon(task.taskType);
        const platformName  = task.category?.displayName || 'Unknown';
        const taskTypeName  = task.taskType?.displayName  || 'Unknown';

        // ✅ Image URL with token for auth
        const imgUrl = `${API_URL}/api/tasks/${task._id}/sample-image?token=${token}`;

        // Status badge
        const statusMap = {
            active:    `<span class="status-badge status-active"><i class="fas fa-play-circle"></i> Active</span>`,
            paused:    `<span class="status-badge status-paused"><i class="fas fa-pause-circle"></i> Paused</span>`,
            review:    `<span class="status-badge status-pending"><i class="fas fa-clock"></i> Review</span>`,
            completed: `<span class="status-badge status-completed"><i class="fas fa-check-circle"></i> Completed</span>`,
            cancelled: `<span class="status-badge status-cancelled"><i class="fas fa-times-circle"></i> Cancelled</span>`,
            rejected:  `<span class="status-badge status-rejected clickable-status" onclick="showRejectedReason('${task.taskId}')" style="cursor:pointer;" title="Click to see reason"><i class="fas fa-ban"></i> Rejected <i class="fas fa-info-circle" style="margin-left:3px;font-size:10px;opacity:.8;"></i></span>`
        };
        const statusBadge = statusMap[task.status] || statusMap.review;

        // Progress bar class
        const progClass = task.status === 'paused' ? 'progress-paused' : task.status === 'review' ? 'progress-pending' : 'progress-active';

        // Action buttons
        const viewBtn     = `<button class="action-btn btn-view"     onclick="viewTask('${task.taskId}')"               title="View Details"><i class="fas fa-eye"></i></button>`;
        const increaseBtn = `<button class="action-btn btn-increase" onclick="showIncreaseModal('${task.taskId}')"      title="Increase Participants"><i class="fas fa-user-plus"></i></button>`;
        const pauseBtn    = `<button class="action-btn btn-pause"    onclick="showPauseConfirm('${task.taskId}')"       title="Pause Task"><i class="fas fa-pause"></i></button>`;
        const playBtn     = `<button class="action-btn btn-play"     onclick="showContinueConfirm('${task.taskId}')"    title="Continue Task"><i class="fas fa-play"></i></button>`;
        const cancelBtn   = `<button class="action-btn btn-cancel"   onclick="showRefundCalculator('${task.taskId}')"   title="Cancel Task"><i class="fas fa-times"></i></button>`;
        const reasonBtn   = `<button class="action-btn" onclick="showRejectedReason('${task.taskId}')" title="View Rejection Reason" style="background:rgba(239,68,68,.1);color:#ef4444;"><i class="fas fa-exclamation-circle"></i></button>`;

        const actionMap = {
            active:    viewBtn + increaseBtn + pauseBtn + cancelBtn,
            paused:    viewBtn + increaseBtn + playBtn  + cancelBtn,
            review:    viewBtn + increaseBtn + cancelBtn,
            completed: viewBtn + increaseBtn,
            cancelled: viewBtn,
            rejected:  viewBtn + reasonBtn
        };
        const actionButtons = actionMap[task.status] || viewBtn;

        html += `
            <tr>
                <td><strong>${i + 1}</strong></td>
                <td>
                    <div class="task-id-container">
                        <strong>${task.taskId}</strong>
                        <button class="copy-btn" onclick="copyToClipboard('${task.taskId}')" title="Copy"><i class="fas fa-copy"></i></button>
                    </div>
                </td>
                <td>
                    ${task.sampleImageTelegramFileId
                        ? `<img class="task-thumb" src="${imgUrl}" alt="Sample"
                               onclick="showImagePreview('${imgUrl}')" title="Click to preview"
                               onerror="this.outerHTML='<div class=\\'no-image-icon\\'><i class=\\'fas fa-image\\'></i></div>'">`
                        : `<div class="no-image-icon" title="No sample image"><i class="fas fa-image"></i></div>`
                    }
                </td>
                <td><div class="task-platform"><div class="platform-icon"><i class="${platformIcon}"></i></div><span>${platformName}</span></div></td>
                <td><div class="task-platform"><div class="task-type-icon"><i class="${taskTypeIcon}"></i></div><span>${taskTypeName}</span></div></td>
                <td>${task.completedCount}/${task.participants}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar"><div class="progress-fill ${progClass}" style="width:${progress}%"></div></div>
                        <div class="progress-text">${Math.round(progress)}%</div>
                    </div>
                </td>
                <td>₦${task.totalBudget.toLocaleString()}</td>
                <td>${statusBadge}</td>
                <td>${formatDate(task.createdAt)}</td>
                <td><div class="action-buttons">${actionButtons}</div></td>
            </tr>
        `;
    });
    tasksTableBody.innerHTML = html;
}

// ============ VIEW TASK ============
async function viewTask(taskId) {
    try {
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(taskId)}/details`, {
            headers:{ Authorization:`Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load task details');
        const task = await res.json();
        selectedTask   = task;
        selectedTaskId = taskId;

        const spent     = task.completedCount * task.reward;
        const remaining = task.totalBudget - spent;
        const progress  = task.participants > 0 ? (task.completedCount / task.participants) * 100 : 0;
        const pIcon     = getPlatformIcon(task.category);
        const tIcon     = getTaskTypeIcon(task.taskType);

        document.getElementById('taskDetailsContent').innerHTML = `
            <div class="task-details-grid">
                <div class="detail-card"><h4><i class="fas fa-id-card"></i> Task ID</h4>
                    <p>${task.taskId} <button class="copy-btn" onclick="copyToClipboard('${task.taskId}')" style="margin-left:10px;"><i class="fas fa-copy"></i></button></p></div>
                <div class="detail-card"><h4><i class="${pIcon}"></i> Platform</h4><p>${task.category?.displayName || 'Unknown'}</p></div>
                <div class="detail-card"><h4><i class="${tIcon}"></i> Task Type</h4><p>${task.taskType?.displayName || 'Unknown'}</p></div>
                <div class="detail-card"><h4><i class="fas fa-users"></i> Participants</h4><p>${task.completedCount}/${task.participants}</p></div>
                <div class="detail-card"><h4><i class="fas fa-chart-line"></i> Progress</h4><p>${Math.round(progress)}%</p></div>
                <div class="detail-card"><h4><i class="fas fa-coins"></i> Reward per Task</h4><p>₦${task.reward}</p></div>
                <div class="detail-card"><h4><i class="fas fa-money-bill-wave"></i> Total Budget</h4><p>₦${task.totalBudget.toLocaleString()}</p></div>
                <div class="detail-card"><h4><i class="fas fa-wallet"></i> Spent Budget</h4><p>₦${spent.toLocaleString()}</p></div>
                <div class="detail-card"><h4><i class="fas fa-wallet"></i> Remaining Budget</h4><p>₦${remaining.toLocaleString()}</p></div>
                <div class="detail-card"><h4><i class="fas fa-calendar"></i> Date Posted</h4><p>${formatDate(task.createdAt)}</p></div>
                <div class="detail-card"><h4><i class="fas fa-info-circle"></i> Status</h4><p>${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</p></div>
            </div>
            <div class="detail-card" style="margin-top:20px;"><h4><i class="fas fa-link"></i> Task URL</h4><p style="word-break:break-all;">${task.taskUrl}</p></div>
            ${task.useCustomDescription && task.customDescription
                ? `<div class="detail-card" style="margin-top:20px;"><h4><i class="fas fa-align-left"></i> Custom Description</h4><p>${task.customDescription}</p></div>`
                : task.defaultDescription
                ? `<div class="detail-card" style="margin-top:20px;"><h4><i class="fas fa-align-left"></i> Description</h4><p>${task.defaultDescription}</p></div>`
                : ''}
        `;

        const actionsMap = {
            active: `
                <button class="modal-btn modal-btn-warning" onclick="showIncreaseModal('${task.taskId}')"><i class="fas fa-user-plus"></i> Increase Participants</button>
                <button class="modal-btn modal-btn-warning" onclick="closeTaskModal();showPauseConfirm('${task.taskId}')"><i class="fas fa-pause"></i> Pause Task</button>
                <button class="modal-btn modal-btn-danger"  onclick="closeTaskModal();showRefundCalculator('${task.taskId}')"><i class="fas fa-times"></i> Cancel Task</button>
                <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()"><i class="fas fa-times"></i> Close</button>`,
            paused: `
                <button class="modal-btn modal-btn-warning" onclick="showIncreaseModal('${task.taskId}')"><i class="fas fa-user-plus"></i> Increase Participants</button>
                <button class="modal-btn modal-btn-success" onclick="closeTaskModal();showContinueConfirm('${task.taskId}')"><i class="fas fa-play"></i> Continue Task</button>
                <button class="modal-btn modal-btn-danger"  onclick="closeTaskModal();showRefundCalculator('${task.taskId}')"><i class="fas fa-times"></i> Cancel Task</button>
                <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()"><i class="fas fa-times"></i> Close</button>`,
            review: `
                <button class="modal-btn modal-btn-warning" onclick="showIncreaseModal('${task.taskId}')"><i class="fas fa-user-plus"></i> Increase Participants</button>
                <button class="modal-btn modal-btn-danger"  onclick="closeTaskModal();showRefundCalculator('${task.taskId}')"><i class="fas fa-times"></i> Cancel Task</button>
                <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()"><i class="fas fa-times"></i> Close</button>`,
            completed: `
                <button class="modal-btn modal-btn-warning" onclick="showIncreaseModal('${task.taskId}')"><i class="fas fa-user-plus"></i> Increase Participants</button>
                <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()"><i class="fas fa-times"></i> Close</button>`,
            rejected: `
                <button class="modal-btn modal-btn-danger" onclick="closeTaskModal();showRejectedReason('${task.taskId}')"><i class="fas fa-exclamation-circle"></i> View Rejection Reason</button>
                <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()"><i class="fas fa-times"></i> Close</button>`,
        };
        document.getElementById('taskModalActions').innerHTML = actionsMap[task.status] || `<button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()"><i class="fas fa-times"></i> Close</button>`;
        taskDetailsModal.classList.add('active');
    } catch (err) {
        showToast(err.message || 'Error loading task details', 'error', 'Error');
    }
}

function closeTaskModal() {
    taskDetailsModal.classList.remove('active');
    selectedTask = null; selectedTaskId = null;
}

// ============ IMAGE PREVIEW ============
function showImagePreview(imgUrl) {
    const modal = document.getElementById('imagePreviewModal');
    const img   = document.getElementById('previewImageEl');
    if (!modal || !img) return;
    img.src = imgUrl;
    modal.classList.add('active');
}

function closeImagePreviewModal() {
    const modal = document.getElementById('imagePreviewModal');
    const img   = document.getElementById('previewImageEl');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { if (img) img.src = ''; }, 300);
}

// ============ PAUSE TASK ============
function showPauseConfirm(taskId) {
    selectedTaskId = taskId; currentAction = 'pause';
    document.getElementById('confirmIcon').className = 'confirm-icon confirm-warning';
    document.getElementById('confirmIcon').innerHTML = '<i class="fas fa-pause"></i>';
    document.getElementById('confirmTitle').textContent = 'Pause Task';
    document.getElementById('confirmMessage').textContent = 'Are you sure you want to pause this task? Task will be temporarily unavailable to earners.';
    document.getElementById('confirmActionBtn').className = 'btn-confirm btn-confirm-primary';
    document.getElementById('confirmActionBtn').textContent = 'Pause Task';
    confirmModal.classList.add('active');
}

async function pauseTask() {
    try {
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(selectedTaskId)}/pause`, {
            method:'PATCH', headers:{ Authorization:`Bearer ${token}` }
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to pause task'); }
        const data = await res.json();
        showToast(data.message || 'Task paused', 'warning', 'Task Paused');
        await loadTasks();
        closeConfirmModal();
    } catch (err) { showToast(err.message, 'error', 'Error'); }
}

// ============ CONTINUE TASK ============
function showContinueConfirm(taskId) {
    selectedTaskId = taskId; currentAction = 'continue';
    document.getElementById('confirmIcon').className = 'confirm-icon confirm-success';
    document.getElementById('confirmIcon').innerHTML = '<i class="fas fa-play"></i>';
    document.getElementById('confirmTitle').textContent = 'Continue Task';
    document.getElementById('confirmMessage').textContent = 'Are you sure you want to continue this task?';
    document.getElementById('confirmActionBtn').className = 'btn-confirm btn-confirm-primary';
    document.getElementById('confirmActionBtn').textContent = 'Continue Task';
    confirmModal.classList.add('active');
}

async function continueTask() {
    try {
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(selectedTaskId)}/continue`, {
            method:'PATCH', headers:{ Authorization:`Bearer ${token}` }
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to continue task'); }
        const data = await res.json();
        showToast(data.message || 'Task resumed', 'success', 'Task Continued');
        await loadTasks();
        closeConfirmModal();
    } catch (err) { showToast(err.message, 'error', 'Error'); }
}

// ============ REFUND CALCULATOR ============
function showRefundCalculator(taskId) {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) { showToast('Task not found', 'error'); return; }
    selectedTaskId = taskId; selectedTask = task;

    let html = '', calc = 0;

    if (task.status === 'review') {
        calc = task.totalBudget * 0.95; refundAmount = calc;
        html = `
            <div class="refund-row"><span class="refund-label">Status:</span><span class="refund-value">Review/Pending</span></div>
            <div class="refund-row"><span class="refund-label">Total Budget:</span><span class="refund-value">₦${task.totalBudget.toLocaleString()}</span></div>
            <div class="refund-row"><span class="refund-label">Refund %:</span><span class="refund-value">95%</span></div>
            <div class="refund-total"><span class="refund-label">Refund Amount:</span><span class="refund-value">₦${calc.toLocaleString()}</span></div>
            <div class="refund-note"><i class="fas fa-info-circle"></i> 95% refund — 5% platform fee. <strong>Task will be permanently deleted.</strong></div>`;
    } else if (task.status === 'active' || task.status === 'paused') {
        const spent = task.completedCount * task.reward;
        const rem   = task.totalBudget - spent;
        calc = rem * 0.95; refundAmount = calc;
        html = `
            <div class="refund-row"><span class="refund-label">Status:</span><span class="refund-value">${task.status.charAt(0).toUpperCase()+task.status.slice(1)}</span></div>
            <div class="refund-row"><span class="refund-label">Total Budget:</span><span class="refund-value">₦${task.totalBudget.toLocaleString()}</span></div>
            <div class="refund-row"><span class="refund-label">Completed:</span><span class="refund-value">${task.completedCount}</span></div>
            <div class="refund-row"><span class="refund-label">Amount Spent:</span><span class="refund-value">₦${spent.toLocaleString()}</span></div>
            <div class="refund-row"><span class="refund-label">Remaining:</span><span class="refund-value">₦${rem.toLocaleString()}</span></div>
            <div class="refund-row"><span class="refund-label">Refund %:</span><span class="refund-value">95% of remaining</span></div>
            <div class="refund-total"><span class="refund-label">Refund Amount:</span><span class="refund-value">₦${calc.toLocaleString()}</span></div>
            <div class="refund-note"><i class="fas fa-info-circle"></i> 95% of remaining refunded. Spent amount is non-refundable. <strong>Task will be permanently deleted.</strong></div>`;
    } else {
        showToast('This task cannot be cancelled', 'warning'); return;
    }
    document.getElementById('refundDetails').innerHTML = html;
    refundModal.classList.add('active');
}

async function confirmCancellation() {
    if (!selectedTaskId) return;
    try {
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(selectedTaskId)}/cancel`, {
            method:'DELETE', headers:{ Authorization:`Bearer ${token}` }
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed to delete task'); }
        const data = await res.json();
        if (currentUser) { currentUser.balance += data.refundAmount; localStorage.setItem('earncial_user', JSON.stringify(currentUser)); }
        showToast(`Task deleted. ₦${data.refundAmount.toLocaleString()} refunded.`, 'success', 'Task Deleted');
        await loadTasks();
        closeRefundModal(); closeTaskModal();
        refundAmount = 0; selectedTaskId = null; selectedTask = null;
    } catch (err) { showToast(err.message, 'error', 'Error'); }
}

function closeRefundModal() { refundModal.classList.remove('active'); refundAmount = 0; }

// ============ INCREASE PARTICIPANTS ============
function showIncreaseModal(taskId) {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) { showToast('Task not found', 'error'); return; }
    selectedTaskId = taskId; selectedTask = task;
    document.getElementById('increaseAmount').value = 10;
    calculateIncreaseCost();
    increaseModal.classList.add('active');
}

function calculateIncreaseCost() {
    if (!selectedTask) return;
    const amt  = parseInt(document.getElementById('increaseAmount').value) || 1;
    const cost = amt * selectedTask.reward;
    document.getElementById('costCalculation').innerHTML = `
        <p><strong>Current Participants:</strong> ${selectedTask.participants}</p>
        <p><strong>Additional:</strong> ${amt}</p>
        <p><strong>New Total:</strong> ${selectedTask.participants + amt}</p>
        <p><strong>Cost per Participant:</strong> ₦${selectedTask.reward}</p>
        <p class="cost-total">Total to Deduct: ₦${cost.toLocaleString()}</p>
    `;
}

async function confirmIncreaseParticipants() {
    if (!selectedTaskId || !selectedTask) return;
    const amt = parseInt(document.getElementById('increaseAmount').value) || 1;
    if (amt < 1) { showToast('Enter a valid number', 'error'); return; }
    try {
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(selectedTaskId)}/increase-participants`, {
            method:'POST',
            headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
            body: JSON.stringify({ additionalParticipants: amt })
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Failed'); }
        const data = await res.json();
        if (currentUser) { currentUser.balance = data.remainingBalance; localStorage.setItem('earncial_user', JSON.stringify(currentUser)); }
        showToast(`Increased by ${amt}. ₦${data.additionalCost.toLocaleString()} deducted.`, 'success', 'Done');
        await loadTasks();
        closeIncreaseModal(); closeTaskModal();
        selectedTaskId = null; selectedTask = null;
    } catch (err) { showToast(err.message, 'error', 'Error'); }
}

function closeIncreaseModal() { increaseModal.classList.remove('active'); selectedTaskId = null; selectedTask = null; }

// ============ CONFIRM MODAL ============
async function performAction() {
    if (!selectedTaskId || !currentAction) return;
    if (currentAction === 'pause')    await pauseTask();
    if (currentAction === 'continue') await continueTask();
}
function closeConfirmModal() { confirmModal.classList.remove('active'); selectedTaskId = null; currentAction = null; }

// ============ REJECTED REASON ============
function showRejectedReason(taskId) {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) { showToast('Task not found', 'error'); return; }
    document.getElementById('rejectedTaskId').textContent     = task.taskId;
    document.getElementById('rejectedReasonText').textContent = task.rejectionReason || 'No rejection reason provided.';
    rejectedReasonModal.classList.add('active');
}
function closeRejectedReasonModal() { if (rejectedReasonModal) rejectedReasonModal.classList.remove('active'); }
function copyRejectionReason() {
    const reason = document.getElementById('rejectedReasonText').textContent;
    navigator.clipboard.writeText(reason)
        .then(() => showToast('Copied!', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
}

// ============ LOGOUT ============
function logout() { document.getElementById('logoutModal')?.classList.add('active'); }
function confirmLogout() { localStorage.clear(); window.location.href = 'sign-in.html'; }
function closeLogoutModal() { document.getElementById('logoutModal')?.classList.remove('active'); }

// ============ INFO MODAL ============
function showInfoModal(message, title = 'Notice', type = 'info') {
    const modal  = document.getElementById('infoModal');
    const config = { info:{color:'var(--primary)',icon:'fas fa-info-circle'}, success:{color:'var(--success)',icon:'fas fa-check-circle'}, warning:{color:'var(--warning)',icon:'fas fa-exclamation-triangle'}, danger:{color:'var(--danger)',icon:'fas fa-times-circle'} };
    const c = config[type] || config.info;
    const titleEl = document.getElementById('infoModalTitle');
    const textEl  = document.getElementById('infoModalText');
    const iconEl  = document.getElementById('infoModalIcon');
    if (!modal) return;
    if (titleEl) { titleEl.textContent = title; titleEl.style.color = c.color; }
    if (textEl)  textEl.textContent = message;
    if (iconEl)  { iconEl.style.color = c.color; iconEl.querySelector('i').className = c.icon; }
    const okBtn = modal.querySelector('.btn-danger-action');
    if (okBtn) okBtn.style.background = c.color;
    modal.classList.add('active');
}

// ============ CHARTS ============
let tasksChartInst = null, spendingChartInst = null;

function initCharts() { initTasksChart(); initSpendingChart(); setTimeout(() => fetchTasksChartData('weekly'), 600); setTimeout(() => fetchSpendingChartData('weekly'), 800); }

function initTasksChart() {
    const ctx = document.getElementById('tasksOverviewChart');
    if (!ctx) return;
    if (tasksChartInst) { tasksChartInst.destroy(); tasksChartInst = null; }
    tasksChartInst = new Chart(ctx, {
        type:'bar',
        data:{ labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets:[
            { label:'Pending',   data:[0,0,0,0,0,0,0], backgroundColor:'rgba(245,158,11,0.8)',  borderRadius:4 },
            { label:'Approved',  data:[0,0,0,0,0,0,0], backgroundColor:'rgba(0,170,255,0.8)',   borderRadius:4 },
            { label:'Completed', data:[0,0,0,0,0,0,0], backgroundColor:'rgba(16,185,129,0.8)',  borderRadius:4 },
            { label:'Rejected',  data:[0,0,0,0,0,0,0], backgroundColor:'rgba(239,68,68,0.8)',   borderRadius:4 }
        ]},
        options:{ responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ font:{family:'Poppins',size:11}, color:'#64748b', boxWidth:12 } } },
            scales:{ x:{ ticks:{font:{family:'Poppins',size:11},color:'#64748b'}, grid:{display:false} }, y:{ beginAtZero:true, ticks:{font:{family:'Poppins',size:11},color:'#64748b',stepSize:1}, grid:{color:'rgba(0,0,0,0.05)'} } }
        }
    });
}

function initSpendingChart() {
    const ctx = document.getElementById('spendingOverviewChart');
    if (!ctx) return;
    if (spendingChartInst) { spendingChartInst.destroy(); spendingChartInst = null; }
    spendingChartInst = new Chart(ctx, {
        type:'line',
        data:{ labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets:[
            { label:'Spending (₦)', data:[0,0,0,0,0,0,0], borderColor:'rgb(239,68,68)', backgroundColor:'rgba(239,68,68,0.1)', borderWidth:2, tension:0.4, fill:true, pointRadius:3 },
            { label:'Deposits (₦)', data:[0,0,0,0,0,0,0], borderColor:'rgb(16,185,129)', backgroundColor:'rgba(16,185,129,0.1)', borderWidth:2, tension:0.4, fill:true, pointRadius:3 }
        ]},
        options:{ responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ font:{family:'Poppins',size:11}, color:'#64748b', boxWidth:12 } } },
            scales:{ x:{ ticks:{font:{family:'Poppins',size:11},color:'#64748b'}, grid:{display:false} }, y:{ beginAtZero:true, ticks:{font:{family:'Poppins',size:11},color:'#64748b',callback:v=>'₦'+v.toLocaleString()}, grid:{color:'rgba(0,0,0,0.05)'} } }
        }
    });
}

async function fetchTasksChartData(period) {
    try {
        const res = await fetch(`${API_URL}/api/advertiser/tasks-chart?period=${period}`, { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok || !tasksChartInst) return;
        const d = await res.json();
        if (!d.success) return;
        tasksChartInst.data.labels = d.labels;
        tasksChartInst.data.datasets[0].data = d.pending   || [];
        tasksChartInst.data.datasets[1].data = d.approved  || [];
        tasksChartInst.data.datasets[2].data = d.completed || [];
        tasksChartInst.data.datasets[3].data = d.rejected  || [];
        tasksChartInst.update();
    } catch {}
}

async function fetchSpendingChartData(period) {
    try {
        const res = await fetch(`${API_URL}/api/advertiser/spending-chart?period=${period}`, { headers:{ Authorization:`Bearer ${token}` } });
        if (!res.ok || !spendingChartInst) return;
        const d = await res.json();
        if (!d.success) return;
        spendingChartInst.data.labels = d.labels;
        spendingChartInst.data.datasets[0].data = d.spending || [];
        spendingChartInst.data.datasets[1].data = d.deposits || [];
        spendingChartInst.update();
    } catch {}
}

function updateTasksChart(period)    { fetchTasksChartData(period); }
function updateSpendingChart(period) { fetchSpendingChartData(period); }

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeSidebar(); });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar(); closeTaskModal(); closeConfirmModal();
            closeRefundModal(); closeIncreaseModal(); closeRejectedReasonModal();
            closeImagePreviewModal(); // ✅ Fixed
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target === taskDetailsModal)    closeTaskModal();
        if (e.target === confirmModal)        closeConfirmModal();
        if (e.target === refundModal)         closeRefundModal();
        if (e.target === increaseModal)       closeIncreaseModal();
        if (e.target === rejectedReasonModal) closeRejectedReasonModal();
        if (e.target === document.getElementById('imagePreviewModal')) closeImagePreviewModal(); // ✅ Fixed
    });

    if (searchInput) searchInput.addEventListener('input', searchTasks);
    const incInput = document.getElementById('increaseAmount');
    if (incInput) incInput.addEventListener('input', calculateIncreaseCost);
}

// ============ INIT ============
async function init() {
    if (!checkAuth()) return;
    loadTheme();
    setupEventListeners();
    initCharts();
    await loadTasks();
    setTimeout(() => showToast(`Welcome back, ${currentUser.username || 'Advertiser'}!`, 'info', 'Welcome'), 500);
}

window.addEventListener('DOMContentLoaded', init);
console.log('✅ Manage Tasks JS Loaded - Fixed Version');