// ============ API CONFIGURATION ============
const API_URL = 'http://localhost:5000';

// ============ DOM ELEMENTS ============
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const themeIcon = document.getElementById('themeIcon');
const doneTasksBody = document.getElementById('doneTasksBody');
const totalDoneTasksBtn = document.getElementById('totalDoneTasksBtn');
const totalDoneTasksCount = document.getElementById('totalDoneTasksCount');
const todayTasksCount = document.getElementById('todayTasksCount');
const totalEarned = document.getElementById('totalEarned');
const totalSubmitted = document.getElementById('totalSubmitted');
const totalApproved = document.getElementById('totalApproved');
const totalPending = document.getElementById('totalPending');
const totalRejected = document.getElementById('totalRejected');
const totalPaid = document.getElementById('totalPaid');
const pendingAmount = document.getElementById('pendingAmount');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const dateFilter = document.getElementById('dateFilter');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const toastContainer = document.getElementById('toastContainer');

// ============ STATE VARIABLES ============
let doneTasksData = [];
let filteredTasks = [];
let currentPage = 1;
const tasksPerPage = 10;
let taskToDelete = null;
let taskChart = null;
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// ============ PLATFORM ICONS ============
const platformIcons = {
    'facebook': { icon: 'fab fa-facebook-f', class: 'icon-facebook' },
    'instagram': { icon: 'fab fa-instagram', class: 'icon-instagram' },
    'twitter': { icon: 'fab fa-twitter', class: 'icon-twitter' },
    'x (twitter)': { icon: 'fab fa-twitter', class: 'icon-twitter' },
    'tiktok': { icon: 'fab fa-tiktok', class: 'icon-tiktok' },
    'youtube': { icon: 'fab fa-youtube', class: 'icon-youtube' },
    'whatsapp': { icon: 'fab fa-whatsapp', class: 'icon-whatsapp' },
    'telegram': { icon: 'fab fa-telegram', class: 'icon-telegram' },
    'linkedin': { icon: 'fab fa-linkedin-in', class: 'icon-linkedin' },
    'spotify': { icon: 'fab fa-spotify', class: 'icon-spotify' }
};

// ============ TASK TYPE ICONS ============
const taskTypeIcons = {
    'like': 'fas fa-thumbs-up',
    'follow': 'fas fa-user-plus',
    'share': 'fas fa-share-alt',
    'comment': 'fas fa-comment',
    'subscribe': 'fas fa-bell',
    'watch': 'fas fa-eye',
    'retweet': 'fas fa-retweet',
    'join': 'fas fa-users',
    'save': 'fas fa-bookmark'
};

// ============ PLATFORM COLORS ============
const platformColors = {
    'facebook': '#1877F2',
    'instagram': '#E4405F',
    'twitter': '#000000',
    'tiktok': '#000000',
    'youtube': '#FF0000',
    'whatsapp': '#25D366',
    'telegram': '#0088CC',
    'linkedin': '#0A66C2',
    'spotify': '#1DB954'
};

// ============ CHECK AUTH ============
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        showToast('Please login first', 'error', 'Authentication Required');
        setTimeout(() => { window.location.href = 'sign-in.html'; }, 1000);
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        return true;
    } catch (e) {
        console.error('Invalid user data');
        localStorage.clear();
        showToast('Invalid user session', 'error', 'Error');
        setTimeout(() => { window.location.href = 'sign-in.html'; }, 1000);
        return false;
    }
}

// ============ HELPER FUNCTIONS ============
function getPlatformIcon(category) {
    const name = category?.name?.toLowerCase() || category?.displayName?.toLowerCase() || 'general';
    return platformIcons[name]?.icon || 'fas fa-globe';
}

function getPlatformIconClass(category) {
    const name = category?.name?.toLowerCase() || category?.displayName?.toLowerCase() || 'general';
    return platformIcons[name]?.class || 'icon-general';
}

function getTaskTypeIcon(taskType) {
    const typeName = taskType?.name?.toLowerCase() || taskType?.displayName?.toLowerCase() || '';
    return taskTypeIcons[typeName] || taskType?.icon || 'fas fa-tasks';
}

function getTaskTypeColor(category) {
    const name = category?.name?.toLowerCase() || category?.displayName?.toLowerCase() || 'general';
    return platformColors[name] || 'var(--primary)';
}

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
    
    if (taskChart) {
        updateChartColors();
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('themeIcon');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

// ============ MODAL FUNCTIONS ============
function showModal(id) {
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ============ TOAST NOTIFICATION ============
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
        <div style="flex: 1;">
            ${title ? `<strong style="display: block; margin-bottom: 5px;">${title}</strong>` : ''}
            <p style="margin: 0; font-size: 13px; color: var(--text-muted);">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 18px;">
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

// ============ CHART FUNCTIONS ============
function initChart() {
    const ctx = document.getElementById('taskChart');
    if (!ctx) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    // Calculate real data from submissions
    const last7Days = getLast7DaysLabels();
    const last7DaysDates = getLast7Days();
    
    const submittedData = last7DaysDates.map(date => {
        return doneTasksData.filter(t => t.submittedDate === date).length;
    });
    
    const approvedData = last7DaysDates.map(date => {
        return doneTasksData.filter(t => 
            t.status === 'approved' && t.submittedDate === date
        ).length;
    });
    
    const rejectedData = last7DaysDates.map(date => {
        return doneTasksData.filter(t => 
            t.status === 'rejected' && t.submittedDate === date
        ).length;
    });
    
    taskChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [
                {
                    label: 'Submitted',
                    data: submittedData,
                    borderColor: '#00aaff',
                    backgroundColor: 'rgba(0, 170, 255, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Approved',
                    data: approvedData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Rejected',
                    data: rejectedData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            family: 'Poppins',
                            size: 12
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        font: {
                            family: 'Poppins'
                        },
                        stepSize: 1
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        font: {
                            family: 'Poppins'
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

function updateChartColors() {
    if (!taskChart) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    taskChart.options.plugins.legend.labels.color = textColor;
    taskChart.options.scales.y.ticks.color = textColor;
    taskChart.options.scales.y.grid.color = gridColor;
    taskChart.options.scales.x.ticks.color = textColor;
    taskChart.options.scales.x.grid.color = gridColor;
    
    taskChart.update();
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toISOString().split('T')[0]);
    }
    return days;
}

function getLast7DaysLabels() {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();
    const rotated = [];
    
    for (let i = 0; i < 7; i++) {
        const index = (today - 6 + i + 7) % 7;
        rotated.push(labels[index]);
    }
    
    return rotated;
}

// ============ LOAD DONE TASKS ============
async function loadDoneTasks() {
    doneTasksBody.innerHTML = `
        <tr>
            <td colspan="9" style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: var(--primary);"></i>
                <p style="margin-top: 15px; color: var(--text-muted);">Loading tasks...</p>
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch(`${API_URL}/api/task-submissions/my-submissions?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'sign-in.html';
                return;
            }
            throw new Error('Failed to load tasks');
        }

        const data = await res.json();
        
        // Transform API data
        doneTasksData = data.submissions.map(submission => {
            const task = submission.task;
            const category = task.category;
            const taskType = task.taskType;
            
            return {
                id: task.taskId,
                encodedId: encodeURIComponent(task.taskId),
                submissionId: submission._id,
                category: category,
                taskType: taskType,
                title: task.useCustomDescription ? task.customDescription : task.defaultDescription,
                submittedDate: submission.createdAt.split('T')[0],
                reward: submission.earnerReward,
                status: submission.status,
                paidDate: submission.reviewedAt ? submission.reviewedAt.split('T')[0] : '',
                screenshot: submission.screenshot,
                rejectionReason: submission.rejectionReason || '',
                rewardCredited: submission.rewardCredited,
                taskUrl: task.taskUrl
            };
        });
        
        updateStats();
        filterAndRenderTasks();
        initChart();
        
    } catch (error) {
        console.error('Error loading tasks:', error);
        doneTasksBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 50px; color: var(--danger);"></i>
                    <p style="margin-top: 15px; color: var(--text-muted);">Error loading tasks: ${error.message}</p>
                    <button class="total-tasks-btn" onclick="loadDoneTasks()" style="margin-top: 15px;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </td>
            </tr>
        `;
        showToast(error.message, 'error', 'Error');
    }
}

// ============ UPDATE STATS ============
function updateStats() {
    const submitted = doneTasksData.length;
    const approved = doneTasksData.filter(t => t.status === 'approved').length;
    const pending = doneTasksData.filter(t => t.status === 'pending').length;
    const rejected = doneTasksData.filter(t => t.status === 'rejected').length;
    
    // ✅ FIX: Total Paid = Approved tasks DA aka credit reward
    const paidAmount = doneTasksData
        .filter(t => t.status === 'approved') //&& t.rewardCredited === true)
        .reduce((sum, t) => sum + t.reward, 0);
    
    // Total earnings (all approved)
    const totalEarnings = doneTasksData
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + t.reward, 0);
    
    // Pending amount
    const pendingAmountValue = doneTasksData
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.reward, 0);
    
    totalDoneTasksCount.textContent = submitted;
    totalSubmitted.textContent = submitted;
    totalApproved.textContent = approved;
    totalPending.textContent = pending;
    totalRejected.textContent = rejected;
    totalPaid.textContent = paidAmount.toLocaleString();
    pendingAmount.textContent = pendingAmountValue.toLocaleString();
    totalEarned.textContent = totalEarnings.toLocaleString();
    
    // Today's tasks
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = doneTasksData.filter(task => task.submittedDate === today);
    todayTasksCount.textContent = todayTasks.length;
}

// ============ FILTER AND RENDER ============
function filterAndRenderTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const dateRange = dateFilter.value;
    
    filteredTasks = doneTasksData.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                           task.id.toLowerCase().includes(searchTerm);
        
        const matchesStatus = status === 'all' || task.status === status;
        
        let matchesDate = true;
        const taskDate = new Date(task.submittedDate);
        const today = new Date();
        
        switch(dateRange) {
            case 'today':
                matchesDate = task.submittedDate === today.toISOString().split('T')[0];
                break;
            case 'week':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                matchesDate = taskDate >= startOfWeek;
                break;
            case 'month':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                matchesDate = taskDate >= startOfMonth;
                break;
            case 'last_month':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                matchesDate = taskDate >= lastMonth && taskDate <= endOfLastMonth;
                break;
        }
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    filteredTasks.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
    
    renderTasks();
}

// ============ RENDER TASKS ============
function renderTasks() {
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    
    if (filteredTasks.length === 0) {
        doneTasksBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 50px; color: var(--border-color);"></i>
                    <p style="margin-top: 15px; color: var(--text-muted);">No tasks found</p>
                </td>
            </tr>
        `;
    } else {
        let html = '';
        paginatedTasks.forEach((task, index) => {
            const platformIcon = getPlatformIcon(task.category);
            const platformIconClass = getPlatformIconClass(task.category);
            const taskTypeIcon = getTaskTypeIcon(task.taskType);
            const taskTypeColor = getTaskTypeColor(task.category);
            
            let statusClass = '';
            let statusIcon = '';
            let statusText = '';
            
            if (task.status === 'approved' && task.rewardCredited) {
                statusClass = 'status-paid';
                statusIcon = '<i class="fas fa-money-bill-wave"></i>';
                statusText = 'Paid';
            } else if (task.status === 'approved') {
                statusClass = 'status-approved';
                statusIcon = '<i class="fas fa-check-circle"></i>';
                statusText = 'Approved';
            } else if (task.status === 'pending') {
                statusClass = 'status-pending';
                statusIcon = '<i class="fas fa-clock"></i>';
                statusText = 'Pending';
            } else if (task.status === 'rejected') {
                statusClass = 'status-rejected';
                statusIcon = '<i class="fas fa-times-circle"></i>';
                statusText = 'Rejected';
            }
            
            const submittedDate = new Date(task.submittedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            const paidDate = task.paidDate ? 
                new Date(task.paidDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }) : '-';
            
            let actionButtons = `
                <button class="btn-view" onclick="viewTask('${task.taskUrl}')">
                    <i class="fas fa-eye"></i> View
                </button>
            `;
            
            if (task.status === 'pending') {
                actionButtons += `
                    <button class="btn-delete" onclick="showDeleteModal('${task.submissionId}', '${task.title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                `;
            } else if (task.status === 'rejected') {
                actionButtons += `
                    <button class="btn-reupload" onclick="goToRejectedPage('${task.encodedId}')">
                        <i class="fas fa-upload"></i> Reupload
                    </button>
                `;
            }
            
            html += `
                <tr>
                    <td><strong>${startIndex + index + 1}</strong></td>
                    <td>
                        <div class="category-cell">
                            <div class="category-icon ${platformIconClass}">
                                <i class="${platformIcon}"></i>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 28px; text-align: center;">
                            <i class="${taskTypeIcon}" style="color: ${taskTypeColor};"></i>
                        </div>
                    </td>
                    <td class="reward-cell"><strong>₦${task.reward}</strong></td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusIcon} ${statusText}
                        </span>
                    </td>
                    <td>
                   <div class="task-id-cell">
                            <strong style="color: var(--primary); font-size: 14px;">${task.id}</strong>
                            <button class="copy-btn" onclick="copyTaskId('${task.id}')" title="Copy Task ID">
                                <i class="fas fa-copy"></i>
                            </button>
                  </div>
                  </td>
                   <td>${submittedDate}</td>
                    <td>${paidDate}</td>
                    <td>
                        <div class="action-buttons">
                            ${actionButtons}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        doneTasksBody.innerHTML = html;
    }
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// ============ COPY TASK ID ============
function copyTaskId(id) {
    const el = document.createElement('textarea');
    el.value = id;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    showToast(`Task ID ${id} copied to clipboard`, 'success', 'Copied!');
}

// ============ PAGINATION ============
function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTasks();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============ TASK ACTIONS ============
function viewTask(taskUrl) {
    window.open(taskUrl, '_blank');
}

function goToRejectedPage(encodedId) {
    window.location.href = `rejected.html?id=${encodedId}`;
}

function showDeleteModal(submissionId, taskTitle) {
    taskToDelete = { id: submissionId, title: taskTitle };
    showModal('deleteModal');
}

async function confirmDelete() {
    if (!taskToDelete) return;
    
    try {
        const res = await fetch(`${API_URL}/api/task-submissions/${taskToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to delete task');
        
        showToast(`Task "${taskToDelete.title}" has been deleted`, 'success', 'Task Deleted');
        closeModal('deleteModal');
        
        await loadDoneTasks();
        
        taskToDelete = null;
    } catch (error) {
        console.error('Delete error:', error);
        showToast(error.message, 'error', 'Delete Failed');
    }
}

// ============ LOGOUT ============
function logout() {
    // Open modal instead of confirm
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        // Fallback if modal not found
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            window.location.href = 'sign-in.html';
        }
    }
}

// ============================================================
// LOGOUT MODAL - Simple Function to Add
// ============================================================

// Add this to end of your JS file (before closing)

function setupLogoutModal() {
    const logoutBtn = document.getElementById('logoutBtn');
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const modal = document.getElementById('logoutModal');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) modal.classList.add('active');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            localStorage.removeItem('earncial_token');
            localStorage.removeItem('earncial_user');
            window.location.href = 'sign-in.html';
        });
    }
}

// Call it in your init or DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    setupLogoutModal();
});

// Export to window
window.setupLogoutModal = setupLogoutModal;

// ============ INITIALIZATION ============
function init() {
    if (!checkAuth()) return;
    
    loadTheme();
    
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        filterAndRenderTasks();
    });
    
    statusFilter.addEventListener('change', () => {
        currentPage = 1;
        filterAndRenderTasks();
    });
    
    dateFilter.addEventListener('change', () => {
        currentPage = 1;
        filterAndRenderTasks();
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
            closeModal('deleteModal');
        }
    });
    
    loadDoneTasks();
    
    setTimeout(() => {
        showToast('Welcome to your done tasks dashboard', 'info', 'Done Tasks');
    }, 1000);
}

// Expose functions globally
window.confirmDelete = confirmDelete;
window.changePage = changePage;
window.viewTask = viewTask;
window.goToRejectedPage = goToRejectedPage;
window.showDeleteModal = showDeleteModal;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.loadDoneTasks = loadDoneTasks;

window.addEventListener('DOMContentLoaded', init);