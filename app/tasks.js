
// ================================================
// EARNCIAL EARNERS - TASKS PAGE
// FIXED VERSION WITH URL ENCODING
// ================================================

const API_URL = 'https://earncial-backend-copy.onrender.com';
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// ============ CHECK AUTH ============
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        const msg = 'Please login first';
        console.warn(msg);
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
             toastContainer.innerHTML = `<div class="toast error"><strong>Error</strong><p>${msg}</p></div>`;
        }
        setTimeout(() => { window.location.href = 'sign-in.html'; }, 1000);
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        return true;
    } catch (e) {
        console.error('Invalid user data');
        localStorage.clear();
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            toastContainer.innerHTML = `<div class="toast error"><strong>Error</strong><p>Invalid user session</p></div>`;
        }
        setTimeout(() => { window.location.href = 'sign-in.html'; }, 1000);
        return false;
    }
}

// ============ DOM ELEMENTS ============
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const themeIcon = document.getElementById('themeIcon');
const tasksBody = document.getElementById('tasksBody');
const totalTasksCount = document.getElementById('totalTasksCount');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const toastContainer = document.getElementById('toastContainer');
const deleteOrHideModalId = 'deleteTaskModal'; 

// ============ STATE VARIABLES ============
let allTasks = [];
let filteredTasks = [];
let currentPage = 1;
const tasksPerPage = 15;
let categories = [];
let taskToDelete = null;

// ============ PLATFORM ICONS MAPPING ============
const defaultPlatformIcons = {
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

// ============ TASK TYPE ICONS MAPPING ============
const platformTaskTypeIcons = {
    "facebook": {
        "like": "fas fa-thumbs-up",
        "follow": "fas fa-user-plus",
        "share": "fas fa-share-alt",
        "comment": "fas fa-comment"
    },
    "instagram": {
        "like": "fas fa-heart",
        "follow": "fas fa-user-plus",
        "share": "fas fa-share-alt",
        "comment": "fas fa-comment",
        "save": "fas fa-bookmark"
    },
    "tiktok": {
        "like": "fas fa-heart",
        "follow": "fas fa-user-plus",
        "share": "fas fa-share-alt",
        "comment": "fas fa-comment"
    },
    "youtube": {
        "like": "fas fa-thumbs-up",
        "subscribe": "fas fa-bell",
        "share": "fas fa-share-alt",
        "comment": "fas fa-comment",
        "watch": "fas fa-eye"
    },
    "twitter": {
        "like": "fas fa-heart",
        "follow": "fas fa-user-plus",
        "retweet": "fas fa-retweet",
        "comment": "fas fa-comment"
    },
    "whatsapp": {
        "join": "fas fa-users",
        "share": "fas fa-share-alt"
    },
    "telegram": {
        "join": "fas fa-users",
        "share": "fas fa-share-alt"
    },
    "linkedin": {
        "like": "fas fa-thumbs-up",
        "follow": "fas fa-user-plus",
        "share": "fas fa-share-alt",
        "comment": "fas fa-comment"
    }
};

// ============ PLATFORM COLORS ============
const platformColors = {
    "facebook": "#1877F2",
    "instagram": "#E4405F",
    "twitter": "#000000",
    "tiktok": "#000000",
    "youtube": "#FF0000",
    "whatsapp": "#25D366",
    "telegram": "#0088CC",
    "linkedin": "#0A66C2",
    "spotify": "#1DB954"
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

// ============ MODAL FUNCTIONS ============
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// ============ GET ICON FUNCTIONS ============
function getPlatformIcon(category) {
    if (category && category.icon) {
        return category.icon;
    }
    if (category && category.name) {
        return defaultPlatformIcons[category.name.toLowerCase()] || 'fas fa-globe';
    }
    return 'fas fa-globe';
}

function getPlatformIconClass(category) {
    if (!category) return 'icon-general';
    const name = category.name ? category.name.toLowerCase() : '';
    return `icon-${name}`;
}

function getTaskTypeIcon(taskType, category) {
    const platformName = category?.name?.toLowerCase() || 'general';
    const taskTypeName = taskType?.name?.toLowerCase() || '';
    
    if (platformTaskTypeIcons[platformName] && platformTaskTypeIcons[platformName][taskTypeName]) {
        return platformTaskTypeIcons[platformName][taskTypeName];
    }
    
    if (taskType && taskType.icon) {
        return taskType.icon;
    }
    
    return 'fas fa-tasks';
}

function getTaskTypeColor(category) {
    const platformName = category?.name?.toLowerCase() || 'general';
    return platformColors[platformName] || 'var(--primary)';
}

// ============ LOAD CATEGORIES FOR FILTER ============
async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/api/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load categories');

        const data = await res.json();
        categories = data.categories || data || [];
        
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat._id;
            opt.textContent = cat.displayName;
            categoryFilter.appendChild(opt);
        });
    } catch (err) {
        console.error('Load categories error:', err);
    }
}

// ============ LOAD ACTIVE TASKS ============
async function loadTasks() {
    try {
        tasksBody.innerHTML = `
            <tr>
                <td colspan="8" class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading available tasks...</p>
                </td>
            </tr>
        `;

        const res = await fetch(`${API_URL}/api/tasks/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load tasks');

        allTasks = await res.json();
        totalTasksCount.textContent = allTasks.length;
        
        console.log('✅ Loaded tasks:', allTasks.length);
        allTasks.forEach(task => {
            console.log('   Task ID:', task.taskId, 'Reward:', task.reward);
        });
        
        filterAndRenderTasks();
        
        if (allTasks.length === 0) {
            showToast('No active tasks available at the moment', 'info', 'No Tasks');
        }
    } catch (err) {
        console.error('Load tasks error:', err);
        showToast(err.message || 'Error loading tasks', 'error', 'Error');
        
        tasksBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load tasks. Please try again.</p>
                    <button class="total-tasks-btn" onclick="loadTasks()" style="margin-top: 15px;">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }
}

// ============ FILTER AND RENDER TASKS ============
function filterAndRenderTasks() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const categoryId = categoryFilter.value;
    const sortBy = sortFilter.value;
    
    filteredTasks = allTasks.filter(task => {
        const matchesSearch = !searchTerm || 
            (task.taskId && task.taskId.toLowerCase().includes(searchTerm)) ||
            (task.taskType && task.taskType.displayName && task.taskType.displayName.toLowerCase().includes(searchTerm)) ||
            (task.category && task.category.displayName && task.category.displayName.toLowerCase().includes(searchTerm));
        
        const matchesCategory = categoryId === 'all' || 
            (task.category && (task.category._id === categoryId || task.category === categoryId));
        
        return matchesSearch && matchesCategory;
    });
    
    filteredTasks.sort((a, b) => {
        switch(sortBy) {
            case 'newest':
                return (b.taskNumber || 0) - (a.taskNumber || 0);
            case 'oldest':
                return (a.taskNumber || 0) - (b.taskNumber || 0);
            case 'reward_high':
                return b.reward - a.reward;
            case 'reward_low':
                return a.reward - b.reward;
            default:
                return 0;
        }
    });
    
    if (currentPage > Math.ceil(filteredTasks.length / tasksPerPage)) {
        currentPage = 1;
    }
    
    renderTasks();
}

// ============ RENDER TASKS ============
function renderTasks() {
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    
    if (filteredTasks.length === 0) {
        tasksBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No tasks found matching your criteria.</p>
                    <button class="total-tasks-btn" onclick="resetFilters()" style="margin-top: 15px;">
                        <i class="fas fa-redo"></i> Reset Filters
                    </button>
                </td>
            </tr>
        `;
    } else {
        let html = '';
        paginatedTasks.forEach((task, index) => {
            const platformIcon = getPlatformIcon(task.category);
            const platformIconClass = getPlatformIconClass(task.category);
            const taskTypeIcon = getTaskTypeIcon(task.taskType, task.category);
            const taskTypeColor = getTaskTypeColor(task.category);
            const platformName = task.category ? task.category.displayName : 'Unknown';
            const progress = task.participants > 0 ? 
                Math.round((task.completedCount / task.participants) * 100) : 0;
            
            html += `
                <tr>
                    <td><strong>${startIndex + index + 1}</strong></td>
                    <td>
                        <div class="category-cell">
                            <div class="category-icon ${platformIconClass}">
                                <i class="${platformIcon}"></i>
                            </div>
                            <span>${platformName}</span>
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 28px; text-align: center;">
                            <i class="${taskTypeIcon}" style="color: ${taskTypeColor};"></i>
                        </div>
                    </td>
                    <td>
                        <button class="btn-view" onclick="viewTask('${task.taskId}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                    <td><strong style="color: var(--primary); font-size: 15px;">₦${task.earnerReward}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 12px; color: var(--text-muted);">
                                ${task.completedCount}/${task.participants}
                            </span>
                            <div style="flex: 1; background:var(--border-color); height:8px; border-radius:4px; min-width: 80px;">
                                <div style="width:${progress}%; background:var(--primary); height:100%; border-radius:4px;"></div>
                            </div>
                            <span style="font-size: 12px; font-weight: 600; color: var(--primary);">
                                ${progress}%
                            </span>
                        </div>
                    </td>
                    <td>
                        <div class="task-id-cell">
                            <strong style="color: var(--primary); font-size: 14px;">${task.taskId}</strong>
                            <button class="copy-btn" onclick="copyTaskId('${task.taskId}')" title="Copy Task ID">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </td>
                    <td>
                        <button class="btn-delete" onclick="deleteTask('${task.taskId}', '${platformName}')">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tasksBody.innerHTML = html;
    }
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

// ============ COPY TASK ID ============
function copyTaskId(taskId) {
    const el = document.createElement('textarea');
    el.value = taskId;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    showToast(`Task ID ${taskId} copied to clipboard`, 'success', 'Copied!');
}

// ============ DELETE/HIDE TASK ============
function deleteTask(taskId, platformName) {
    taskToDelete = taskId;
    const infoElement = document.getElementById('deleteTaskInfo');
    if (infoElement) {
         infoElement.innerHTML = `<strong>Task ID: ${taskId} (${platformName})</strong>. <br>Are you sure you want to hide this task? You will not see it again.`;
    }
    openModal(deleteOrHideModalId);
}

// ============ CONFIRM HIDE TASK ============
async function confirmDeleteTask() {
    if (!taskToDelete) return;
    
    const taskIdToHide = taskToDelete;

    try {
        // ✅ ENCODE task ID for API call
        const encodedTaskId = encodeURIComponent(taskIdToHide);
        
        console.log('🙈 Hiding task:');
        console.log('   Original ID:', taskIdToHide);
        console.log('   Encoded ID:', encodedTaskId);
        
        const res = await fetch(`${API_URL}/api/tasks/hide/${encodedTaskId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to hide task.');
        }

        // Successfully hidden - remove from frontend
        allTasks = allTasks.filter(t => t.taskId !== taskIdToHide);
        totalTasksCount.textContent = allTasks.length;
        filterAndRenderTasks(); 
        
        showToast('Task hidden successfully. You will no longer see this task.', 'success', 'Hidden!');
        
    } catch (err) {
        console.error('Hide task error:', err);
        showToast(err.message || 'Error hiding task', 'error', 'Error');
    } finally {
        closeModal(deleteOrHideModalId);
        taskToDelete = null;
    }
}

// ============ PAGINATION ============
function changePage(direction) {
    const newPage = currentPage + direction;
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTasks();
      //  window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ============ RESET FILTERS ============
function resetFilters() {
    searchInput.value = '';
    categoryFilter.value = 'all';
    sortFilter.value = 'newest';
    currentPage = 1;
    filterAndRenderTasks();
    showToast('Filters reset successfully', 'success');
}

// ============ VIEW TASK - FIXED WITH URL ENCODING ============
function viewTask(taskId) {
    if (!taskId) {
        showToast('Invalid task ID', 'error', 'Error');
        return;
    }
    
    // ✅ ENCODE task ID properly (#00001 becomes %2300001)
    const encodedTaskId = encodeURIComponent(taskId);
    
    console.log('📤 Redirecting to task details:');
    console.log('   Original ID:', taskId);
    console.log('   Encoded ID:', encodedTaskId);
    console.log('   URL:', `task-details.html?id=${encodedTaskId}`);
    
    window.location.href = `task-details.html?id=${encodedTaskId}`;
}

// ============ LOGOUT ============
function logout() {
    showToast('Logging out...', 'info', 'Goodbye!');
    setTimeout(() => {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }, 500);
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            filterAndRenderTasks();
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentPage = 1;
            filterAndRenderTasks();
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            filterAndRenderTasks();
        });
    }
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
            closeModal(deleteOrHideModalId);
        }
    });
    
    // Expose functions globally
    window.confirmDeleteTask = confirmDeleteTask; 
    window.deleteTask = deleteTask;
    window.changePage = changePage;
    window.resetFilters = resetFilters;
    window.loadTasks = loadTasks;
    window.viewTask = viewTask;
    window.copyTaskId = copyTaskId;
    window.toggleTheme = toggleTheme;
    window.logout = logout;
    window.openSidebar = openSidebar;
    window.closeSidebar = closeSidebar;
    
    // ✅ Setup logout modal
    setupLogoutModal();
    
    // ✅ Render chart after Chart.js loads
    if (typeof Chart !== 'undefined') {
        setTimeout(() => renderChart(), 500);
    }
}

// ============ INITIALIZATION ============
async function init() {
    if (!checkAuth()) return;
    
    loadTheme();
    setupEventListeners();
    
    await loadCategories();
    await loadTasks();
    
    setTimeout(() => {
        showToast(
            `Welcome back, ${currentUser.username || 'Earner'}! Start completing tasks to earn money.`,
            'info',
            'Welcome 👋'
        );
    }, 500);
}

window.addEventListener('DOMContentLoaded', init);
console.log('✅ Tasks Page JS Loaded - URL Encoding Fixed for Task IDs');
// ============================================================
// NEW FEATURES ADDED
// ============================================================

// Speech Synthesis
function speakAnnouncement() {
    const textEl = document.getElementById('announcementText');
    if (!textEl) return;
    
    const text = textEl.textContent;
    
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        
        const btn = document.getElementById('speakBtn');
        if (btn) {
            btn.classList.remove('fa-volume-up');
            btn.classList.add('fa-volume-mute');
            utterance.onend = () => {
                btn.classList.remove('fa-volume-mute');
                btn.classList.add('fa-volume-up');
            };
        }
        
        window.speechSynthesis.speak(utterance);
    }
}

// Enable Notifications
async function enableNotifications() {
    if (window.initNotifications && typeof window.initNotifications === 'function') {
        try {
            await window.initNotifications();
            showToast('Notifications enabled!', 'success', 'Success');
        } catch (error) {
            showToast('Could not enable notifications', 'error', 'Error');
        }
        return;
    }
    
    if (!('Notification' in window)) {
        showToast('Notifications not supported', 'error', 'Not Supported');
        return;
    }
    
    if (Notification.permission === 'granted') {
        showToast('Notifications already enabled!', 'success', 'Already Enabled');
        return;
    }
    
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
        showToast('You will receive task notifications!', 'success', 'Enabled');
        new Notification('Earncial', {
            body: 'You will now receive alerts for new tasks!',
            icon: 'logo.png'
        });
    }
}




// Setup Logout Modal
function setupLogoutModal() {
    console.log('Setting up logout modal...');
    
    const logoutBtn = document.getElementById('logoutBtn');
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const modal = document.getElementById('logoutModal');
    
    console.log('Logout elements:', {
        logoutBtn: !!logoutBtn,
        cancelBtn: !!cancelBtn,
        confirmBtn: !!confirmBtn,
        modal: !!modal
    });
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logout button clicked');
            if (modal) {
                modal.classList.add('active');
                console.log('Modal should be visible now');
            }
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel clicked');
            if (modal) modal.classList.remove('active');
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            console.log('Confirm logout clicked');
            showToast('Logging out...', 'info', 'Goodbye!');
            setTimeout(() => {
                localStorage.removeItem('earncial_token');
                localStorage.removeItem('earncial_user');
                window.location.href = 'sign-in.html';
            }, 1000);
        });
    }
}

// Export new functions
window.speakAnnouncement = speakAnnouncement;
window.enableNotifications = enableNotifications;
window.renderChart = renderChart;
window.setupLogoutModal = setupLogoutModal;

// ============================================================
// RENDER CHART: Available Tasks vs User Submissions Today
// ============================================================
let tasksChart = null;

async function renderChart() {
    console.log('renderChart called');
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded yet');
        setTimeout(renderChart, 1000); // Retry after 1 second
        return;
    }
    
    const ctx = document.getElementById('tasksChart');
    if (!ctx) {
        console.error('Canvas element not found');
        return;
    }
    
    try {
        const token = localStorage.getItem('earncial_token');
        
        console.log('Fetching tasks and submissions for chart...');
        
        // Fetch available tasks (use same endpoint as loadTasks)
        const tasksRes = await fetch(`${API_URL}/api/tasks/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasksData = await tasksRes.json();
        
        console.log('Tasks response:', tasksData);
        
        // Handle different response structures
        let availableTasks = 0;
        if (tasksData.success && tasksData.tasks) {
            availableTasks = tasksData.tasks.length;
        } else if (Array.isArray(tasksData)) {
            availableTasks = tasksData.length;
        }
        
        // Fetch user submissions today (CORRECT endpoint)
        const submissionsRes = await fetch(`${API_URL}/api/task-submissions/my-submissions?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const submissionsData = await submissionsRes.json();
        
        console.log('Submissions response:', submissionsData);
        
        // Handle different response structures and filter for TODAY
        let allSubmissions = [];
        if (submissionsData.success && submissionsData.submissions) {
            allSubmissions = submissionsData.submissions;
        } else if (Array.isArray(submissionsData)) {
            allSubmissions = submissionsData;
        }
        
        // Filter submissions for today only
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const submittedToday = allSubmissions.filter(sub => {
            const subDate = new Date(sub.submittedAt || sub.createdAt);
            subDate.setHours(0, 0, 0, 0);
            return subDate.getTime() === today.getTime();
        }).length;
        
        console.log('Total submissions:', allSubmissions.length);
        console.log('Submitted today:', submittedToday);
        
        console.log('Chart data:', { availableTasks, submittedToday });
        
        // Calculate remaining
        const remaining = Math.max(0, availableTasks - submittedToday);
        
        const data = {
            labels: ['Submitted Today', 'Available'],
            datasets: [{
                data: [submittedToday, remaining],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.9)',  // Green - submitted
                    'rgba(245, 158, 11, 0.9)'   // Orange - remaining
                ],
                borderWidth: 3,
                borderColor: '#ffffff'
            }]
        };
        
        // Destroy existing chart
        if (tasksChart) {
            tasksChart.destroy();
        }
        
        // Create new chart
        tasksChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            padding: 12, 
                            font: { size: 13 }, 
                            boxWidth: 15,
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    return {
                                        text: `${label}: ${value}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = availableTasks;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Chart created successfully');
        
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}
