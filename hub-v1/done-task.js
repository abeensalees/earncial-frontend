// ============ DOM ELEMENTS ============
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const themeIcon = document.getElementById('themeIcon');
const doneTasksBody = document.getElementById('doneTasksBody');
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

// Category Icons Mapping
const categoryIcons = {
    'facebook': { icon: 'fab fa-facebook-f', class: 'icon-facebook', name: 'Facebook' },
    'instagram': { icon: 'fab fa-instagram', class: 'icon-instagram', name: 'Instagram' },
    'twitter': { icon: 'fab fa-twitter', class: 'icon-twitter', name: 'Twitter/X' },
    'tiktok': { icon: 'fab fa-tiktok', class: 'icon-tiktok', name: 'TikTok' },
    'youtube': { icon: 'fab fa-youtube', class: 'icon-youtube', name: 'YouTube' },
    'whatsapp': { icon: 'fab fa-whatsapp', class: 'icon-whatsapp', name: 'WhatsApp' },
    'telegram': { icon: 'fab fa-telegram', class: 'icon-telegram', name: 'Telegram' },
    'linkedin': { icon: 'fab fa-linkedin-in', class: 'icon-linkedin', name: 'LinkedIn' },
    'spotify': { icon: 'fab fa-spotify', class: 'icon-spotify', name: 'Spotify' },
    'general': { icon: 'fas fa-tasks', class: 'icon-general', name: 'General' }
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
    
    // Update chart colors if exists
    if (taskChart) {
        updateChartColors();
    }
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
        <div style="font-size: 20px; color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : 'var(--primary)'}">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div style="flex: 1;">
            ${title ? `<strong style="display: block; margin-bottom: 5px;">${title}</strong>` : ''}
            <p style="margin: 0; font-size: 13px; color: var(--text-muted);">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: var(--text-muted);">
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
    
    taskChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Submitted',
                    data: [5, 8, 6, 10, 7, 9, 12],
                    borderColor: '#00aaff',
                    backgroundColor: 'rgba(0, 170, 255, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Approved',
                    data: [3, 6, 5, 8, 6, 7, 10],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Rejected',
                    data: [1, 1, 0, 2, 1, 1, 2],
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
                        }
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

// ============ TASK FUNCTIONS ============
function loadDoneTasks() {
    doneTasksBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: var(--primary);"></i>
                <p style="margin-top: 15px; color: var(--text-muted);">Loading tasks...</p>
            </td>
        </tr>
    `;
    
    setTimeout(() => {
        // Sample Data with encoded IDs
        doneTasksData = [
            {
                id: '#00001',
                encodedId: encodeURIComponent('#00001'),
                category: 'instagram',
                title: 'Follow Earncial on Instagram',
                submittedDate: '2025-01-20',
                reward: 200,
                status: 'approved'
            },
            {
                id: '#00002',
                encodedId: encodeURIComponent('#00002'),
                category: 'facebook',
                title: 'Like & Share Facebook Post',
                submittedDate: '2025-01-19',
                reward: 150,
                status: 'approved'
            },
            {
                id: '#00003',
                encodedId: encodeURIComponent('#00003'),
                category: 'twitter',
                title: 'Retweet Latest Tweet',
                submittedDate: '2025-01-18',
                reward: 180,
                status: 'approved'
            },
            {
                id: '#00004',
                encodedId: encodeURIComponent('#00004'),
                category: 'youtube',
                title: 'Watch YouTube Video',
                submittedDate: '2025-01-17',
                reward: 250,
                status: 'pending'
            },
            {
                id: '#00005',
                encodedId: encodeURIComponent('#00005'),
                category: 'whatsapp',
                title: 'Join WhatsApp Channel',
                submittedDate: '2025-01-16',
                reward: 100,
                status: 'rejected'
            },
            {
                id: '#00006',
                encodedId: encodeURIComponent('#00006'),
                category: 'telegram',
                title: 'Join Telegram Group',
                submittedDate: '2025-01-15',
                reward: 120,
                status: 'approved'
            },
            {
                id: '#00007',
                encodedId: encodeURIComponent('#00007'),
                category: 'linkedin',
                title: 'Connect on LinkedIn',
                submittedDate: '2025-01-14',
                reward: 300,
                status: 'approved'
            },
            {
                id: '#00008',
                encodedId: encodeURIComponent('#00008'),
                category: 'tiktok',
                title: 'Follow on TikTok',
                submittedDate: '2025-01-13',
                reward: 220,
                status: 'pending'
            },
            {
                id: '#00009',
                encodedId: encodeURIComponent('#00009'),
                category: 'general',
                title: 'Complete Profile Setup',
                submittedDate: '2025-01-12',
                reward: 500,
                status: 'approved'
            },
            {
                id: '#00010',
                encodedId: encodeURIComponent('#00010'),
                category: 'instagram',
                title: 'Post Instagram Story',
                submittedDate: '2025-01-11',
                reward: 175,
                status: 'pending'
            }
        ];
        
        updateStats();
        filterAndRenderTasks();
        initChart();
    }, 1000);
}

function updateStats() {
    const submitted = doneTasksData.length;
    const approved = doneTasksData.filter(t => t.status === 'approved').length;
    const pending = doneTasksData.filter(t => t.status === 'pending').length;
    const rejected = doneTasksData.filter(t => t.status === 'rejected').length;
    
    const paidAmount = doneTasksData
        .filter(t => t.status === 'approved')
        .reduce((sum, t) => sum + t.reward, 0);
    
    const pendingAmountValue = doneTasksData
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.reward, 0);
    
    totalSubmitted.textContent = submitted;
    totalApproved.textContent = approved;
    totalPending.textContent = pending;
    totalRejected.textContent = rejected;
    totalPaid.textContent = paidAmount.toLocaleString();
    pendingAmount.textContent = pendingAmountValue.toLocaleString();
}

function filterAndRenderTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const dateRange = dateFilter.value;
    
    filteredTasks = doneTasksData.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                           task.id.toLowerCase().includes(searchTerm) ||
                           categoryIcons[task.category].name.toLowerCase().includes(searchTerm);
        
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
        }
        
        return matchesSearch && matchesStatus && matchesDate;
    });
    
    filteredTasks.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
    
    renderTasks();
}

function renderTasks() {
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    
    if (filteredTasks.length === 0) {
        doneTasksBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 50px; color: var(--border-color);"></i>
                    <p style="margin-top: 15px; color: var(--text-muted);">No tasks found</p>
                </td>
            </tr>
        `;
    } else {
        let html = '';
        paginatedTasks.forEach((task) => {
            const category = categoryIcons[task.category] || categoryIcons.general;
            
            let statusClass = '';
            let statusIcon = '';
            let statusText = '';
            
            switch(task.status) {
                case 'approved':
                    statusClass = 'status-approved';
                    statusIcon = '<i class="fas fa-check-circle"></i>';
                    statusText = 'Approved';
                    break;
                case 'pending':
                    statusClass = 'status-pending';
                    statusIcon = '<i class="fas fa-clock"></i>';
                    statusText = 'Pending';
                    break;
                case 'rejected':
                    statusClass = 'status-rejected';
                    statusIcon = '<i class="fas fa-times-circle"></i>';
                    statusText = 'Rejected';
                    break;
            }
            
            const submittedDate = new Date(task.submittedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Action buttons based on status
            let actionButtons = `
                <button class="btn-view" onclick="viewTaskDetails('${task.encodedId}', '${task.title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-eye"></i> View
                </button>
            `;
            
            if (task.status === 'pending') {
                actionButtons += `
                    <button class="btn-delete" onclick="showDeleteModal('${task.id}', '${task.title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                `;
            } else if (task.status === 'rejected') {
                actionButtons += `
                    <button class="btn-view" onclick="reuploadTask('${task.encodedId}', '${task.title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-upload"></i> Reupload
                    </button>
                `;
            }
            
            html += `
                <tr>
                    <td><strong>${task.id}</strong></td>
                    <td>
                        <div class="category-cell">
                            <div class="category-icon ${category.class}">
                                <i class="${category.icon}"></i>
                            </div>
                            <span>${category.name}</span>
                        </div>
                    </td>
                    <td><strong>${task.title}</strong></td>
                    <td>${submittedDate}</td>
                    <td style="color: var(--primary); font-weight: 600;">₦${task.reward}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusIcon} ${statusText}
                        </span>
                    </td>
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
function viewTaskDetails(encodedId, taskTitle) {
    // Redirect to task-details page with encoded ID
    window.location.href = `task-details.html?id=${encodedId}&type=done`;
}

function reuploadTask(encodedId, taskTitle) {
    // Redirect to task-details page for reupload
    window.location.href = `task-details.html?id=${encodedId}&reupload=true`;
}

function showDeleteModal(taskId, taskTitle) {
    taskToDelete = { id: taskId, title: taskTitle };
    showModal('deleteModal');
}

function confirmDelete() {
    if (!taskToDelete) return;
    
    // Remove task from data
    doneTasksData = doneTasksData.filter(t => t.id !== taskToDelete.id);
    
    showToast(`Task "${taskToDelete.title}" has been deleted`, 'success', 'Task Deleted');
    closeModal('deleteModal');
    
    updateStats();
    filterAndRenderTasks();
    
    taskToDelete = null;
}

// ============ LOGOUT FUNCTION ============
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// ============ INITIALIZATION ============
function init() {
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

// Start when page loads
window.addEventListener('DOMContentLoaded', init);