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

    if (!token || !userData) {
        window.location.href = 'sign-in.html';
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        return true;
    } catch (e) {
        console.error('Invalid user data');
        localStorage.clear();
        window.location.href = 'sign-in.html';
        return false;
    }
}

// ============ DOM ELEMENTS ============
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const themeIcon = document.getElementById('themeIcon');
const toastContainer = document.getElementById('toastContainer');
const tasksTableBody = document.getElementById('tasksTableBody');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const taskDetailsModal = document.getElementById('taskDetailsModal');
const confirmModal = document.getElementById('confirmModal');
const refundModal = document.getElementById('refundModal');
const increaseModal = document.getElementById('increaseModal');
const rejectedReasonModal = document.getElementById('rejectedReasonModal');

// Stats elements
const totalTasksEl = document.getElementById('totalTasks');
const activeTasksEl = document.getElementById('activeTasks');
const pausedTasksEl = document.getElementById('pausedTasks');
const completedTasksEl = document.getElementById('completedTasks');
const cancelledTasksEl = document.getElementById('cancelledTasks');

// ============ STATE VARIABLES ============
let tasks = [];
let filteredTasks = [];
let currentFilter = 'all';
let currentAction = null;
let selectedTaskId = null;
let selectedTask = null;
let refundAmount = 0;

// Platform icons mapping
const platformIcons = {
    "facebook": "fab fa-facebook-f",
    "instagram": "fab fa-instagram",
    "twitter": "fab fa-twitter",
    "tiktok": "fab fa-tiktok",
    "youtube": "fab fa-youtube",
    "whatsapp": "fab fa-whatsapp",
    "telegram": "fab fa-telegram",
    "linkedin": "fab fa-linkedin-in",
    "snapchat": "fab fa-snapchat-ghost",
    "pinterest": "fab fa-pinterest",
    "reddit": "fab fa-reddit-alien",
    "discord": "fab fa-discord"
};

// Task type icons mapping
const taskTypeIcons = {
    "follow": "fas fa-user-plus",
    "like": "fas fa-thumbs-up",
    "share": "fas fa-share-alt",
    "comment": "fas fa-comment",
    "join": "fas fa-users",
    "subscribe": "fas fa-bell",
    "watch": "fas fa-eye",
    "view": "fas fa-eye",
    "download": "fas fa-download",
    "visit": "fas fa-external-link-alt",
    "signup": "fas fa-user-plus",
    "rate": "fas fa-star",
    "retweet": "fas fa-retweet",
    "save": "fas fa-bookmark",
    "click": "fas fa-mouse-pointer"
};

// ============ SIDEBAR FUNCTIONS ============
function openSidebar() {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ============ DARK MODE FUNCTIONS ============
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    
    if (isDark) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load Theme Preference
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('themeIcon');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    } else if (icon) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// ============ TOAST NOTIFICATION FUNCTIONS ============
function showToast(message, type = 'info', title = '') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
            ${title ? `<strong>${title}</strong>` : ''}
            <p>${message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// ============ COPY TO CLIPBOARD ============
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Task ID copied to clipboard', 'success', 'Copied!');
        })
        .catch(err => {
            showToast('Failed to copy Task ID', 'error', 'Error');
        });
}

// ============ FORMAT DATE ============
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days === 0) {
        if (hours === 0) {
            if (minutes === 0) {
                return 'Just now';
            }
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

// ============ GET ICON ============
function getPlatformIcon(category) {
    if (category && category.icon) {
        return category.icon;
    }
    if (category && category.name) {
        return platformIcons[category.name.toLowerCase()] || 'fas fa-globe';
    }
    return 'fas fa-globe';
}

function getTaskTypeIcon(taskType) {
    if (taskType && taskType.icon) {
        return taskType.icon;
    }
    if (taskType && taskType.name) {
        const name = taskType.name.toLowerCase();
        return taskTypeIcons[name] || 'fas fa-tasks';
    }
    return 'fas fa-tasks';
}

// ============ LOAD STATS ============
// ============ LOAD STATS - FIXED ============
async function loadStats() {
    try {
        console.log('📊 Loading stats...');
        
        const res = await fetch(`${API_URL}/api/tasks/stats/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load stats');

        const stats = await res.json();
        
        console.log('✅ Stats loaded:', stats);
        
        totalTasksEl.textContent = stats.total || 0;
        activeTasksEl.textContent = stats.active || 0;
        pausedTasksEl.textContent = stats.paused || 0;
        completedTasksEl.textContent = stats.completed || 0;
        cancelledTasksEl.textContent = stats.rejected || 0;
        const reviewEl = document.getElementById('reviewTasks');
        if (reviewEl) reviewEl.textContent = stats.review || 0;
    } catch (err) {
        console.error('❌ Load stats error:', err);
        // Don't show error toast for stats, just log it
    }
}

// ============ LOAD TASKS ============
// ============ LOAD TASKS - FIXED ============
async function loadTasks() {
    try {
        console.log('📥 Loading tasks...');
        
        const res = await fetch(`${API_URL}/api/tasks/my-tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load tasks');

        // ✅ FIX: Backend returns { tasks: [...], pagination: {...} }
        const data = await res.json();
        tasks = data.tasks || data || [];
        
        console.log('✅ Loaded tasks:', tasks.length);
        
        await loadStats();
        filterTasks('all');
    } catch (err) {
        console.error('❌ Load tasks error:', err);
        const loading = document.getElementById('tableLoading');
        if (loading) loading.style.display = 'none';
        emptyState.style.display = 'block';
        showToast(err.message || 'Error loading tasks', 'error', 'Error');
    }
}

// ============ FILTER TASKS ============
function filterTasks(filter) {
    currentFilter = filter;
    
    // Update active filter button
    filterBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.filter-${filter}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Filter tasks
    switch(filter) {
        case 'all':
            filteredTasks = [...tasks];
            break;
        case 'active':
            filteredTasks = tasks.filter(t => t.status === 'active');
            break;
        case 'paused':
            filteredTasks = tasks.filter(t => t.status === 'paused');
            break;
        case 'pending':
            filteredTasks = tasks.filter(t => t.status === 'review');
            break;
        case 'completed':
            filteredTasks = tasks.filter(t => t.status === 'completed');
            break;
        case 'cancelled':
            filteredTasks = tasks.filter(t => t.status === 'cancelled');
            break;
        case 'rejected':
            filteredTasks = tasks.filter(t => t.status === 'rejected');
            break;
        default:
            filteredTasks = [...tasks];
    }
    
    renderTasks();
}

// ============ SEARCH TASKS ============
function searchTasks() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filterTasks(currentFilter);
        return;
    }
    
    filteredTasks = tasks.filter(task => 
        task.taskId.toLowerCase().includes(searchTerm) ||
        (task.category && task.category.displayName && task.category.displayName.toLowerCase().includes(searchTerm)) ||
        (task.taskType && task.taskType.displayName && task.taskType.displayName.toLowerCase().includes(searchTerm))
    );
    
    renderTasks();
}

// ============ RENDER TASKS ============
function renderTasks() {
    const loading = document.getElementById('tableLoading');
    if (loading) loading.style.display = 'none';

    if (filteredTasks.length === 0) {
        tasksTableBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    let html = '';
    filteredTasks.forEach((task, index) => {
        // Calculate progress percentage
        const progress = task.participants > 0 ? (task.completedCount / task.participants) * 100 : 0;
        
        // Get icons
        const platformIcon = getPlatformIcon(task.category);
        const taskTypeIcon = getTaskTypeIcon(task.taskType);
        
        // Platform name
        const platformName = task.category ? task.category.displayName : 'Unknown';
        const taskTypeName = task.taskType ? task.taskType.displayName : 'Unknown';
        
        // Status badge
        let statusBadge = '';
        switch(task.status) {
            case 'active':
                statusBadge = '<span class="status-badge status-active"><i class="fas fa-play-circle"></i> Active</span>';
                break;
            case 'paused':
                statusBadge = '<span class="status-badge status-paused"><i class="fas fa-pause-circle"></i> Paused</span>';
                break;
            case 'review':
                statusBadge = '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Review</span>';
                break;
            case 'completed':
                statusBadge = '<span class="status-badge status-completed"><i class="fas fa-check-circle"></i> Completed</span>';
                break;
            case 'cancelled':
                statusBadge = '<span class="status-badge status-cancelled"><i class="fas fa-times-circle"></i> Cancelled</span>';
                break;
            case 'rejected':
                statusBadge = `<span class="status-badge status-rejected clickable-status" onclick="showRejectedReason('${task.taskId}')" title="Click to see rejection reason" style="cursor:pointer;">
                    <i class="fas fa-ban"></i> Rejected <i class="fas fa-info-circle" style="margin-left:3px;font-size:10px;opacity:.8;"></i>
                </span>`;
                break;
            default:
                statusBadge = '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Pending</span>';
        }
        
        // Progress bar class
        let progressClass = 'progress-active';
        if (task.status === 'paused') progressClass = 'progress-paused';
        if (task.status === 'review') progressClass = 'progress-pending';
        
        // Action buttons based on status
        let actionButtons = '';
        switch(task.status) {
            case 'active':
                actionButtons = `
                    <button class="action-btn btn-view" onclick="viewTask('${task.taskId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-increase" onclick="showIncreaseModal('${task.taskId}')" title="Increase Participants">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="action-btn btn-pause" onclick="showPauseConfirm('${task.taskId}')" title="Pause Task">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="action-btn btn-cancel" onclick="showRefundCalculator('${task.taskId}')" title="Cancel Task">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                break;
            case 'paused':
                actionButtons = `
                    <button class="action-btn btn-view" onclick="viewTask('${task.taskId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-increase" onclick="showIncreaseModal('${task.taskId}')" title="Increase Participants">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="action-btn btn-play" onclick="showContinueConfirm('${task.taskId}')" title="Continue Task">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="action-btn btn-cancel" onclick="showRefundCalculator('${task.taskId}')" title="Cancel Task">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                break;
            case 'review':
                actionButtons = `
                    <button class="action-btn btn-view" onclick="viewTask('${task.taskId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-increase" onclick="showIncreaseModal('${task.taskId}')" title="Increase Participants">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="action-btn btn-cancel" onclick="showRefundCalculator('${task.taskId}')" title="Cancel Task">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                break;
            case 'completed':
                actionButtons = `
                    <button class="action-btn btn-view" onclick="viewTask('${task.taskId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-increase" onclick="showIncreaseModal('${task.taskId}')" title="Increase Participants">
                        <i class="fas fa-user-plus"></i>
                    </button>
                `;
                break;
            case 'cancelled':
                actionButtons = `
                    <button class="action-btn btn-view" onclick="viewTask('${task.taskId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                `;
                break;
            case 'rejected':
                actionButtons = `
                    <button class="action-btn btn-view" onclick="viewTask('${task.taskId}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn" onclick="showRejectedReason('${task.taskId}')" title="View Rejection Reason" style="background:rgba(239,68,68,.1);color:#ef4444;">
                        <i class="fas fa-exclamation-circle"></i>
                    </button>
                `;
                break;
        }
        
        html += `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td>
                    <div class="task-id-container">
                        <strong>${task.taskId}</strong>
                        <button class="copy-btn" onclick="copyToClipboard('${task.taskId}')" title="Copy Task ID">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </td>
                <td>
                    ${task.sampleImageTelegramFileId
                        ? `<img class="task-thumb" src="${API_URL}/api/tasks/${task._id}/sample-image" alt="Sample" onclick="showImagePreview('${API_URL}/api/tasks/${task._id}/sample-image')" title="Click to preview">`
                        : `<div class="no-image-icon" title="No sample image"><i class="fas fa-image"></i></div>`
                    }
                </td>
                <td>
                    <div class="task-platform">
                        <div class="platform-icon">
                            <i class="${platformIcon}"></i>
                        </div>
                        <span>${platformName}</span>
                    </div>
                </td>
                <td>
                    <div class="task-platform">
                        <div class="task-type-icon">
                            <i class="${taskTypeIcon}"></i>
                        </div>
                        <span>${taskTypeName}</span>
                    </div>
                </td>
                <td>${task.completedCount}/${task.participants}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill ${progressClass}" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">${Math.round(progress)}%</div>
                    </div>
                </td>
                <td>₦${task.totalBudget.toLocaleString()}</td>
                <td>${statusBadge}</td>
                <td>${formatDate(task.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tasksTableBody.innerHTML = html;
}

// ============ VIEW TASK DETAILS ============
async function viewTask(taskId) {
    try {
        // FIX: Added encodeURIComponent to handle '#' in IDs
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(taskId)}/details`,{
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load task details');

        const task = await res.json();
        selectedTask = task;
        selectedTaskId = taskId;
        
        // Calculate amounts
        const spentBudget = task.completedCount * task.reward;
        const remainingBudget = task.totalBudget - spentBudget;
        const progress = task.participants > 0 ? (task.completedCount / task.participants) * 100 : 0;
        
        // Get icons
        const platformIcon = getPlatformIcon(task.category);
        const taskTypeIcon = getTaskTypeIcon(task.taskType);
        
        // Populate task details
        document.getElementById('taskDetailsContent').innerHTML = `
            <div class="task-details-grid">
                <div class="detail-card">
                    <h4><i class="fas fa-id-card"></i> Task ID</h4>
                    <p>${task.taskId} <button class="copy-btn" onclick="copyToClipboard('${task.taskId}')" title="Copy Task ID" style="margin-left: 10px;"><i class="fas fa-copy"></i></button></p>
                </div>
                <div class="detail-card">
                    <h4><i class="${platformIcon}"></i> Platform</h4>
                    <p>${task.category ? task.category.displayName : 'Unknown'}</p>
                </div>
                <div class="detail-card">
                    <h4><i class="${taskTypeIcon}"></i> Task Type</h4>
                    <p>${task.taskType ? task.taskType.displayName : 'Unknown'}</p>
                </div>
                <div class="detail-card">
                    <h4><i class="fas fa-users"></i> Participants</h4>
                    <p>${task.completedCount}/${task.participants}</p>
                </div>
                <div class="detail-card">
                    <h4><i class="fas fa-chart-line"></i> Progress</h4>
                    <p>${Math.round(progress)}%</p>
                </div>
                <div class="detail-card">
                    <h4><i class="fas fa-coins"></i> Reward per Task</h4>
                    <p>₦${task.reward}</p>
                </div>
                <div class="detail-card">
                    <h4><i class="fas fa-money-bill-wave"></i> Total Budget</h4>
                    <p>₦${task.totalBudget.toLocaleString()}</p>
                </div>
                <div class="detail-card">
                    <h4><i class="fas fa-wallet"></i> Spent Budget</h4>
                    <p>₦${spentBudget.toLocaleString()}</p>
                </div>
                <div class="detail-card">
                    <h4><i class="fas fa-wallet"></i> Remaining Budget</h4>
                    <p>₦${remainingBudget.toLocaleString()}</p>
                </div>

                <div class="detail-card">
                    <h4><i class="fas fa-calendar"></i> Date Posted</h4>
                    <p>${formatDate(task.createdAt)}</p>
                </div>
                <div class="detail-card">
                    <h4><i class="fas fa-info-circle"></i> Status</h4>
                    <p>${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</p>
                </div>
            </div>
            
            <div class="detail-card" style="margin-top: 20px;">
                <h4><i class="fas fa-link"></i> Task URL</h4>
                <p style="word-break: break-all;">${task.taskUrl}</p>
            </div>
            
            ${task.useCustomDescription && task.customDescription ? `
            <div class="detail-card" style="margin-top: 20px;">
                <h4><i class="fas fa-align-left"></i> Custom Description</h4>
                <p>${task.customDescription}</p>
            </div>
            ` : task.defaultDescription ? `
            <div class="detail-card" style="margin-top: 20px;">
                <h4><i class="fas fa-align-left"></i> Description</h4>
                <p>${task.defaultDescription}</p>
            </div>
            ` : ''}
        `;
        
        // Set modal actions based on status
        let modalActions = '';
        switch(task.status) {
            case 'active':
                modalActions = `
                    <button class="modal-btn modal-btn-warning" onclick="showIncreaseModal('${task.taskId}')">
                        <i class="fas fa-user-plus"></i> Increase Participants
                    </button>
                    <button class="modal-btn modal-btn-warning" onclick="closeTaskModal(); showPauseConfirm('${task.taskId}')">
                        <i class="fas fa-pause"></i> Pause Task
                    </button>
                    <button class="modal-btn modal-btn-danger" onclick="closeTaskModal(); showRefundCalculator('${task.taskId}')">
                        <i class="fas fa-times"></i> Cancel Task
                    </button>
                    <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                `;
                break;
            case 'paused':
                modalActions = `
                    <button class="modal-btn modal-btn-warning" onclick="showIncreaseModal('${task.taskId}')">
                        <i class="fas fa-user-plus"></i> Increase Participants
                    </button>
                    <button class="modal-btn modal-btn-success" onclick="closeTaskModal(); showContinueConfirm('${task.taskId}')">
                        <i class="fas fa-play"></i> Continue Task
                    </button>
                    <button class="modal-btn modal-btn-danger" onclick="closeTaskModal(); showRefundCalculator('${task.taskId}')">
                        <i class="fas fa-times"></i> Cancel Task
                    </button>
                    <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                `;
                break;
            case 'review':
                modalActions = `
                    <button class="modal-btn modal-btn-warning" onclick="showIncreaseModal('${task.taskId}')">
                        <i class="fas fa-user-plus"></i> Increase Participants
                    </button>
                    <button class="modal-btn modal-btn-danger" onclick="closeTaskModal(); showRefundCalculator('${task.taskId}')">
                        <i class="fas fa-times"></i> Cancel Task
                    </button>
                    <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                `;
                break;
            case 'completed':
                modalActions = `
                    <button class="modal-btn modal-btn-warning" onclick="showIncreaseModal('${task.taskId}')">
                        <i class="fas fa-user-plus"></i> Increase Participants
                    </button>
                    <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                `;
                break;
            case 'rejected':
                modalActions = `
                    <button class="modal-btn modal-btn-danger" onclick="closeTaskModal(); showRejectedReason('${task.taskId}')">
                        <i class="fas fa-exclamation-circle"></i> View Rejection Reason
                    </button>
                    <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                `;
                break;
            default:
                modalActions = `
                    <button class="modal-btn modal-btn-secondary" onclick="closeTaskModal()">
                        <i class="fas fa-times"></i> Close
                    </button>
                `;
        }
        
        document.getElementById('taskModalActions').innerHTML = modalActions;
        
        // Show modal
        taskDetailsModal.classList.add('active');
    } catch (err) {
        console.error('View task error:', err);
        showToast(err.message || 'Error loading task details', 'error', 'Error');
    }
}

function closeTaskModal() {
    taskDetailsModal.classList.remove('active');
    selectedTask = null;
    selectedTaskId = null;
}

// ============ PAUSE TASK ============
function showPauseConfirm(taskId) {
    selectedTaskId = taskId;
    currentAction = 'pause';
    
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
        // FIX: Added encodeURIComponent to handle '#' in IDs
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(selectedTaskId)}/pause`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to pause task');
        }

        const data = await res.json();
        
        showToast(data.message || 'Task paused successfully', 'warning', 'Task Paused');
        
        // Reload tasks
        await loadTasks();
        
        closeConfirmModal();
    } catch (err) {
        console.error('Pause task error:', err);
        showToast(err.message || 'Error pausing task', 'error', 'Error');
    }
}

// ============ CONTINUE TASK ============
function showContinueConfirm(taskId) {
    selectedTaskId = taskId;
    currentAction = 'continue';
    
    document.getElementById('confirmIcon').className = 'confirm-icon confirm-success';
    document.getElementById('confirmIcon').innerHTML = '<i class="fas fa-play"></i>';
    document.getElementById('confirmTitle').textContent = 'Continue Task';
    document.getElementById('confirmMessage').textContent = 'Are you sure you want to continue this task? Task will be available to earners again.';
    document.getElementById('confirmActionBtn').className = 'btn-confirm btn-confirm-primary';
    document.getElementById('confirmActionBtn').textContent = 'Continue Task';
    
    confirmModal.classList.add('active');
}

async function continueTask() {
    try {
        // FIX: Added encodeURIComponent to handle '#' in IDs
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(selectedTaskId)}/continue`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to continue task');
        }

        const data = await res.json();
        
        showToast(data.message || 'Task resumed successfully', 'success', 'Task Continued');
        
        // Reload tasks
        await loadTasks();
        
        closeConfirmModal();
    } catch (err) {
        console.error('Continue task error:', err);
        showToast(err.message || 'Error resuming task', 'error', 'Error');
    }
}

// ============ REFUND CALCULATOR ============
function showRefundCalculator(taskId) {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) {
        showToast('Task not found', 'error', 'Error');
        return;
    }
    
    selectedTaskId = taskId;
    selectedTask = task;
    
    let refundDetails = '';
    let calculatedRefund = 0;
    
    if (task.status === 'review') {
        // Pending/Review task: 95% refund of total budget
        calculatedRefund = task.totalBudget * 0.95;
        refundAmount = calculatedRefund;
        
        refundDetails = `
            <div class="refund-row">
                <span class="refund-label">Task Status:</span>
                <span class="refund-value">Review/Pending</span>
            </div>
            <div class="refund-row">
                <span class="refund-label">Total Budget:</span>
                <span class="refund-value">₦${task.totalBudget.toLocaleString()}</span>
            </div>
            <div class="refund-row">
                <span class="refund-label">Refund Percentage:</span>
                <span class="refund-value">95%</span>
            </div>
            <div class="refund-total">
                <span class="refund-label">Amount to Refund:</span>
                <span class="refund-value">₦${calculatedRefund.toLocaleString()}</span>
            </div>
            <div class="refund-note">
                <i class="fas fa-info-circle"></i> Since no participants have joined yet, 95% of the total budget will be refunded to your wallet. 5% is kept as platform fee. <strong>This task will be permanently deleted.</strong>
            </div>
        `;
    } else if (task.status === 'active' || task.status === 'paused') {
        // Active/Paused task: Calculate spent amount, refund 95% of remaining
        const spentAmount = task.completedCount * task.reward;
        const remainingBudget = task.totalBudget - spentAmount;
        calculatedRefund = remainingBudget * 0.95;
        refundAmount = calculatedRefund;
        
        refundDetails = `
            <div class="refund-row">
                <span class="refund-label">Task Status:</span>
                <span class="refund-value">${task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
            </div>
            <div class="refund-row">
                <span class="refund-label">Total Budget:</span>
                <span class="refund-value">₦${task.totalBudget.toLocaleString()}</span>
            </div>
            <div class="refund-row">
                <span class="refund-label">Participants Completed:</span>
                <span class="refund-value">${task.completedCount}</span>
            </div>
            <div class="refund-row">
                <span class="refund-label">Amount Spent:</span>
                <span class="refund-value">₦${spentAmount.toLocaleString()}</span>
            </div>
            <div class="refund-row">
                <span class="refund-label">Remaining Budget:</span>
                <span class="refund-value">₦${remainingBudget.toLocaleString()}</span>
            </div>
            <div class="refund-row">
                <span class="refund-label">Refund Percentage:</span>
                <span class="refund-value">95% of remaining</span>
            </div>
            <div class="refund-total">
                <span class="refund-label">Amount to Refund:</span>
                <span class="refund-value">₦${calculatedRefund.toLocaleString()}</span>
            </div>
            <div class="refund-note">
                <i class="fas fa-info-circle"></i> 95% of the remaining budget will be refunded to your wallet. 5% is kept as platform fee. Amount spent on completed participants is not refundable. <strong>This task will be permanently deleted.</strong>
            </div>
        `;
    } else {
        // Task already cancelled or completed
        showToast('This task cannot be deleted', 'warning', 'Invalid Action');
        return;
    }
    
    document.getElementById('refundDetails').innerHTML = refundDetails;
    refundModal.classList.add('active');
}

async function confirmCancellation() {
    if (!selectedTaskId) return;
    
    try {
        // FIX: Added encodeURIComponent to handle '#' in IDs
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(selectedTaskId)}/cancel`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to delete task');
        }

        const data = await res.json();
        
        // Update user balance in localStorage
        if (currentUser) {
            currentUser.balance += data.refundAmount;
            localStorage.setItem('earncial_user', JSON.stringify(currentUser));
        }
        
        showToast(
            `Task deleted successfully. ₦${data.refundAmount.toLocaleString()} refunded to your wallet.`,
            'success',
            'Task Deleted'
        );
        
        // Reload tasks
        await loadTasks();
        
        // Close modals
        closeRefundModal();
        closeTaskModal();
        
        refundAmount = 0;
        selectedTaskId = null;
        selectedTask = null;
    } catch (err) {
        console.error('Delete task error:', err);
        showToast(err.message || 'Error deleting task', 'error', 'Error');
    }
}

function closeRefundModal() {
    refundModal.classList.remove('active');
    refundAmount = 0;
}

// ============ INCREASE PARTICIPANTS ============
function showIncreaseModal(taskId) {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) {
        showToast('Task not found', 'error', 'Error');
        return;
    }
    
    selectedTaskId = taskId;
    selectedTask = task;
    
    // Set default increase amount
    document.getElementById('increaseAmount').value = 10;
    document.getElementById('increaseAmount').min = 1;
    document.getElementById('increaseAmount').max = 10000;
    
    // Show modal
    calculateIncreaseCost();
    increaseModal.classList.add('active');
}

function calculateIncreaseCost() {
    if (!selectedTask) return;
    
    const increaseAmount = parseInt(document.getElementById('increaseAmount').value) || 1;
    
    // Validate input
    if (increaseAmount < 1) {
        document.getElementById('increaseAmount').value = 1;
        return;
    }
    
    // Calculate cost
    const additionalCost = increaseAmount * selectedTask.reward;
    
    // Update cost calculation display
    document.getElementById('costCalculation').innerHTML = `
        <p><strong>Current Participants:</strong> ${selectedTask.participants}</p>
        <p><strong>Additional Participants:</strong> ${increaseAmount}</p>
        <p><strong>New Total Participants:</strong> ${selectedTask.participants + increaseAmount}</p>
        <p><strong>Cost per Participant:</strong> ₦${selectedTask.reward}</p>
        <p><strong>Additional Cost:</strong> ₦${additionalCost.toLocaleString()}</p>
        <p class="cost-total">Total to Deduct from Wallet: ₦${additionalCost.toLocaleString()}</p>
    `;
}

async function confirmIncreaseParticipants() {
    if (!selectedTaskId || !selectedTask) return;
    
    const increaseAmount = parseInt(document.getElementById('increaseAmount').value) || 1;
    
    if (increaseAmount < 1) {
        showToast('Please enter a valid number', 'error', 'Invalid Input');
        return;
    }
    
    try {
        // FIX: Added encodeURIComponent to handle '#' in IDs
        const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(selectedTaskId)}/increase-participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ additionalParticipants: increaseAmount })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to increase participants');
        }

        const data = await res.json();
        
        // Update user balance in localStorage
        if (currentUser) {
            currentUser.balance = data.remainingBalance;
            localStorage.setItem('earncial_user', JSON.stringify(currentUser));
        }
        
        showToast(
            `Increased participants by ${increaseAmount}. ₦${data.additionalCost.toLocaleString()} deducted from wallet.`,
            'success',
            'Participants Increased'
        );
        
        // Reload tasks
        await loadTasks();
        
        // Close modals
        closeIncreaseModal();
        closeTaskModal();
        
        selectedTaskId = null;
        selectedTask = null;
    } catch (err) {
        console.error('Increase participants error:', err);
        showToast(err.message || 'Error increasing participants', 'error', 'Error');
    }
}

function closeIncreaseModal() {
    increaseModal.classList.remove('active');
    selectedTaskId = null;
    selectedTask = null;
}

// ============ CONFIRMATION MODAL ============
async function performAction() {
    if (!selectedTaskId || !currentAction) return;
    
    switch(currentAction) {
        case 'pause':
            await pauseTask();
            break;
        case 'continue':
            await continueTask();
            break;
    }
}

function closeConfirmModal() {
    confirmModal.classList.remove('active');
    selectedTaskId = null;
    currentAction = null;
}

// ============ LOGOUT ============
function logout() {
    showLogoutModal();
}

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.classList.add('active');
}

function confirmLogout() {
    localStorage.clear();
    window.location.href = 'sign-in.html';
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.classList.remove('active');
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    // Close sidebar on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
            closeTaskModal();
            closeConfirmModal();
            closeRefundModal();
            closeIncreaseModal();
            closeRejectedReasonModal();
        }
    });
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target === taskDetailsModal) closeTaskModal();
        if (e.target === confirmModal) closeConfirmModal();
        if (e.target === refundModal) closeRefundModal();
        if (e.target === increaseModal) closeIncreaseModal();
        if (e.target === rejectedReasonModal) closeRejectedReasonModal();
    });
    
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', searchTasks);
    }
    
    // Increase amount input
    const increaseAmountInput = document.getElementById('increaseAmount');
    if (increaseAmountInput) {
        increaseAmountInput.addEventListener('input', calculateIncreaseCost);
    }
}

// ============ REJECTED REASON MODAL ============
function showRejectedReason(taskId) {
    const task = tasks.find(t => t.taskId === taskId);
    if (!task) {
        showToast('Task not found', 'error', 'Error');
        return;
    }

    const reason = task.rejectionReason || 'No rejection reason provided.';

    document.getElementById('rejectedTaskId').textContent     = task.taskId;
    document.getElementById('rejectedReasonText').textContent = reason;

    rejectedReasonModal.classList.add('active');
}

function closeRejectedReasonModal() {
    if (rejectedReasonModal) rejectedReasonModal.classList.remove('active');
}

function copyRejectionReason() {
    const reason = document.getElementById('rejectedReasonText').textContent;
    navigator.clipboard.writeText(reason)
        .then(() => showToast('Rejection reason copied!', 'success', 'Copied!'))
        .catch(() => showToast('Failed to copy', 'error', 'Error'));
}

// ============ INITIALIZATION ============
async function init() {
    if (!checkAuth()) return;
    
    loadTheme();
    setupEventListeners();
    
    // Init charts first (empty state)
    initCharts();
    
    // Load tasks
    await loadTasks();
    
    // Show welcome message
    setTimeout(() => {
        showToast(
            `Welcome back, ${currentUser.username || 'Advertiser'}!`,
            'info',
            'Welcome'
        );
    }, 500);
}

// ============ INFO MODAL (replaces alert) ============
function showInfoModal(message, title = 'Notice', type = 'info') {
    const modal = document.getElementById('infoModal');
    const titleEl = document.getElementById('infoModalTitle');
    const textEl  = document.getElementById('infoModalText');
    const iconEl  = document.getElementById('infoModalIcon');
    if (!modal) return;

    const config = {
        info:    { color: 'var(--primary)',  icon: 'fas fa-info-circle' },
        success: { color: 'var(--success)',  icon: 'fas fa-check-circle' },
        warning: { color: 'var(--warning)',  icon: 'fas fa-exclamation-triangle' },
        danger:  { color: 'var(--danger)',   icon: 'fas fa-times-circle' }
    };
    const c = config[type] || config.info;

    if (titleEl) { titleEl.textContent = title; titleEl.style.color = c.color; }
    if (textEl)  textEl.textContent = message;
    if (iconEl)  { iconEl.style.color = c.color; iconEl.querySelector('i').className = c.icon; }

    // Update OK button color
    const okBtn = modal.querySelector('.btn-danger-action');
    if (okBtn) okBtn.style.background = c.color;

    modal.classList.add('active');
}

// ============ IMAGE PREVIEW ============
function showImagePreview(imgUrl) {
    const modal = document.getElementById('imagePreviewModal');
    const img   = document.getElementById('previewImageEl');
    if (!modal || !img) return;
    img.src = imgUrl;
    modal.classList.add('active');
}

// ============ CHARTS ============
let tasksChartInst   = null;
let spendingChartInst = null;

function initCharts() {
    initTasksChart();
    initSpendingChart();
    // Fetch real data after 600ms
    setTimeout(() => fetchTasksChartData('weekly'), 600);
    setTimeout(() => fetchSpendingChartData('weekly'), 800);
}

function initTasksChart() {
    const ctx = document.getElementById('tasksOverviewChart');
    if (!ctx) return;
    if (tasksChartInst) { tasksChartInst.destroy(); tasksChartInst = null; }

    tasksChartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            datasets: [
                { label: 'Pending',   data: [0,0,0,0,0,0,0], backgroundColor: 'rgba(245,158,11,0.8)',  borderRadius: 4 },
                { label: 'Approved',  data: [0,0,0,0,0,0,0], backgroundColor: 'rgba(0,170,255,0.8)',   borderRadius: 4 },
                { label: 'Completed', data: [0,0,0,0,0,0,0], backgroundColor: 'rgba(16,185,129,0.8)',  borderRadius: 4 },
                { label: 'Rejected',  data: [0,0,0,0,0,0,0], backgroundColor: 'rgba(239,68,68,0.8)',   borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { font: { family: 'Poppins', size: 11 }, color: '#64748b', boxWidth: 12 } } },
            scales: {
                x: { ticks: { font: { family: 'Poppins', size: 11 }, color: '#64748b' }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { font: { family: 'Poppins', size: 11 }, color: '#64748b', stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } }
            }
        }
    });
}

function initSpendingChart() {
    const ctx = document.getElementById('spendingOverviewChart');
    if (!ctx) return;
    if (spendingChartInst) { spendingChartInst.destroy(); spendingChartInst = null; }

    spendingChartInst = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            datasets: [
                { label: 'Spending (₦)', data: [0,0,0,0,0,0,0], borderColor: 'rgb(239,68,68)', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3 },
                { label: 'Deposits (₦)', data: [0,0,0,0,0,0,0], borderColor: 'rgb(16,185,129)', backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { font: { family: 'Poppins', size: 11 }, color: '#64748b', boxWidth: 12 } } },
            scales: {
                x: { ticks: { font: { family: 'Poppins', size: 11 }, color: '#64748b' }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { font: { family: 'Poppins', size: 11 }, color: '#64748b', callback: v => '₦' + v.toLocaleString() }, grid: { color: 'rgba(0,0,0,0.05)' } }
            }
        }
    });
}

async function fetchTasksChartData(period) {
    try {
        const res = await fetch(`${API_URL}/api/advertiser/tasks-chart?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !tasksChartInst) return;
        tasksChartInst.data.labels = data.labels;
        tasksChartInst.data.datasets[0].data = data.pending   || [];
        tasksChartInst.data.datasets[1].data = data.approved  || [];
        tasksChartInst.data.datasets[2].data = data.completed || [];
        tasksChartInst.data.datasets[3].data = data.rejected  || [];
        tasksChartInst.update();
    } catch(e) { /* silently fail */ }
}

async function fetchSpendingChartData(period) {
    try {
        const res = await fetch(`${API_URL}/api/advertiser/spending-chart?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !spendingChartInst) return;
        spendingChartInst.data.labels = data.labels;
        spendingChartInst.data.datasets[0].data = data.spending || [];
        spendingChartInst.data.datasets[1].data = data.deposits || [];
        spendingChartInst.update();
    } catch(e) { /* silently fail */ }
}

function updateTasksChart(period) { fetchTasksChartData(period); }
function updateSpendingChart(period) { fetchSpendingChartData(period); }

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', init);



console.log('✅ Manage Tasks JS Loaded');