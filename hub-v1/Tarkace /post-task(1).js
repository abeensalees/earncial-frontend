
// ================================================
// EARNCIAL ADVERTISERS - POST TASK PAGE (COMPLETE)
// NEW TASKS AT TOP, OLD TASKS AT BOTTOM
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// ======== CHECK AUTH =======
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        alert('Please login first');
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

// ======== DOM ELEMENTS ========
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const themeIcon = document.getElementById('themeIcon');
const toastContainer = document.getElementById('toastContainer');
const successModal = document.getElementById('successModal');
const modalTaskId = document.getElementById('taskIdNumber');
const submitBtn = document.getElementById('submitBtn');
const taskForm = document.getElementById('taskForm');
const tasksTableBody = document.getElementById('tasksTableBody');
const walletAmountSpan = document.getElementById('walletAmount');

const platformSelect = document.getElementById('platform');
const taskTypeSelect = document.getElementById('taskType');
const rewardInput = document.getElementById('reward');
const durationInput = document.getElementById('duration');
const descriptionTextarea = document.getElementById('description');
const customDescGroup = document.getElementById('customDescGroup');
const customDescToggle = document.getElementById('customDescToggle');
const customDescription = document.getElementById('customDescription');
const taskUrlInput = document.getElementById('taskUrl');
const participantsInput = document.getElementById('participants');
const totalBudget = document.getElementById('totalBudget');

let categories = [];
let taskTypes = [];
let selectedTaskType = null;
let walletBalance = 0;

// ======== UI FUNCTIONS ========
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

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeIcon.classList.toggle('fa-moon', !isDark);
    themeIcon.classList.toggle('fa-sun', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<div class="toast-icon"><i class="fas ' +
        (type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle') +
        '"></i></div>' +
        '<div class="toast-content"><p>' + message + '</p></div>' +
        '<button class="toast-close" onclick="this.parentElement.remove()">×</button>';
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
}

// ======== LOAD WALLET ========
function loadWalletBalance() {
    if (currentUser && currentUser.balance !== undefined) {
        walletBalance = currentUser.balance;
        walletAmountSpan.textContent = '₦' + walletBalance.toLocaleString();
    }
}

// ======== LOAD CATEGORIES ========
async function loadCategories() {
    try {
        const res = await fetch(API_URL + '/api/admin/categories', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Failed to load platforms');

        const data = await res.json();
        categories = data.categories || data || [];

        platformSelect.innerHTML = '<option value="">-- Select Platform --</option>';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat._id;
            opt.textContent = cat.displayName;
            opt.dataset.icon = cat.icon || 'fas fa-globe';
            platformSelect.appendChild(opt);
        });
    } catch (err) {
        showToast('Error loading platforms: ' + err.message, 'error');
    }
}

// ======== LOAD TASK TYPES ========
async function loadTaskTypes(categoryId) {
    if (!categoryId) {
        taskTypeSelect.innerHTML = '<option value="">-- Select Platform First --</option>';
        taskTypeSelect.disabled = true;
        resetTaskDetails();
        return;
    }

    try {
        const res = await fetch(API_URL + '/api/admin/task-types/' + categoryId, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Failed to load task types');

        taskTypes = await res.json();

        taskTypeSelect.innerHTML = '<option value="">-- Select Task Type --</option>';
        taskTypes.forEach(type => {
            const opt = document.createElement('option');
            opt.value = type._id;
            opt.textContent = type.displayName;
            opt.dataset.reward = type.reward;
            opt.dataset.duration = type.duration;
            opt.dataset.description = type.description;
            taskTypeSelect.appendChild(opt);
        });
        taskTypeSelect.disabled = false;
    } catch (err) {
        showToast('Error loading task types: ' + err.message, 'error');
        taskTypeSelect.disabled = true;
    }
}

// ======== UPDATE TASK DETAILS ========
function updateTaskDetails() {
    const selectedOpt = taskTypeSelect.selectedOptions[0];
    if (!selectedOpt || !selectedOpt.value) {
        resetTaskDetails();
        return;
    }

    selectedTaskType = taskTypes.find(t => t._id === selectedOpt.value);
    if (!selectedTaskType) return;

    rewardInput.value = selectedTaskType.reward;
    durationInput.value = selectedTaskType.duration;
    descriptionTextarea.value = selectedTaskType.description || '';

    updateBudget();
}

function resetTaskDetails() {
    rewardInput.value = '';
    durationInput.value = '';
    descriptionTextarea.value = '';
    selectedTaskType = null;
    totalBudget.textContent = '0';
}

// ======== CUSTOM DESCRIPTION TOGGLE ========
function toggleCustomDescription() {
    if (customDescToggle.checked) {
        customDescGroup.style.display = 'block';
        descriptionTextarea.disabled = true;
        descriptionTextarea.classList.add('read-only');
    } else {
        customDescGroup.style.display = 'none';
        descriptionTextarea.disabled = false;
        descriptionTextarea.classList.remove('read-only');
        customDescription.value = '';
        if (selectedTaskType) {
            descriptionTextarea.value = selectedTaskType.description || '';
        }
    }
}

// ======== BUDGET CALCULATION ========
function updateBudget() {
    const participants = parseInt(participantsInput.value) || 0;
    const reward = selectedTaskType ? selectedTaskType.reward : 0;
    const total = participants * reward;

    document.getElementById('calcParticipants').textContent = participants;
    document.getElementById('calcReward').textContent = reward;
    totalBudget.textContent = total.toLocaleString();

    const canSubmit = total > 0 && 
                     total <= walletBalance && 
                     selectedTaskType && 
                     taskUrlInput.value.trim();
    
    submitBtn.disabled = !canSubmit;

    if (total > walletBalance && total > 0) {
        showToast('Insufficient balance! Need ₦' + (total - walletBalance).toLocaleString() + ' more', 'warning');
    }
}

// ======== COPY TASK ID ========
function copyTaskId(taskId, iconElement) {
    const tempInput = document.createElement('input');
    tempInput.value = taskId;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    const originalClass = iconElement.className;
    iconElement.className = 'fas fa-check';
    iconElement.style.color = 'var(--success)';
    showToast('Task ID copied: ' + taskId, 'success');
    
    setTimeout(() => {
        iconElement.className = originalClass;
        iconElement.style.color = '';
    }, 2000);
}

// ======== HELPER: CREATE TASK ROW ========
function createTaskRow(task) {
    const platformIcon = task.category?.icon || 'fas fa-globe';
    const platformName = task.category?.displayName || 'Platform';
    const taskTypeIcon = task.taskType?.icon || 'fas fa-tasks';
    const taskTypeName = task.taskType?.displayName || 'Task';

    const row = document.createElement('tr');
    row.dataset.createdAt = task.createdAt || new Date().toISOString();
    row.innerHTML = `
        <td><strong>1</strong></td>
        <td>
            <div style="display:flex; align-items:center; gap:10px;">
                <strong>${task.taskId}</strong>
                <i class="fas fa-copy" 
                   style="cursor:pointer; color:var(--primary); font-size:14px;" 
                   onclick="copyTaskId('${task.taskId}', this)"
                   title="Copy Task ID"></i>
            </div>
        </td>
        <td>
            <div class="platform-cell">
                <i class="${platformIcon}"></i>
                <span>${platformName}</span>
            </div>
        </td>
        <td>
            <div class="task-type-cell">
                <i class="${taskTypeIcon}"></i>
                <span>${taskTypeName}</span>
            </div>
        </td>
        <td>${task.participants || 0}</td>
        <td>₦${(task.totalBudget || 0).toLocaleString()}</td>
        <td><span class="status-badge status-${task.status || 'review'}">${capitalizeFirst(task.status || 'review')}</span></td>
        <td>${formatDateTime(task.createdAt)}</td>
    `;
    
    return row;
}

// ======== ADD NEW TASK TO TABLE (TOP) ========
function addTaskToTable(task) {
    const empty = tasksTableBody.querySelector('.empty-table');
    if (empty) empty.parentElement.remove();

    const row = createTaskRow(task);
    
    // ✅ NEW TASKS GO TO TOP
    tasksTableBody.prepend(row);
    
    updateSerialNumbers();
}

// ======== UPDATE SERIAL NUMBERS ========
function updateSerialNumbers() {
    const rows = tasksTableBody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        const snCell = row.querySelector('td:first-child strong');
        if (snCell) {
            snCell.textContent = index + 1; // Top = 1, Bottom = last number
        }
    });
}

// ======== HELPER FUNCTIONS ========
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDateTime(dateString) {
    const date = new Date(dateString || Date.now());
    
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${day} ${month} ${year}, ${hours}:${minutesStr}${ampm}`;
}

// ======== POST TASK ========
taskForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!selectedTaskType) {
        showToast('Please select a task type', 'error');
        return;
    }

    if (!platformSelect.value) {
        showToast('Please select a platform', 'error');
        return;
    }

    if (!taskUrlInput.value.trim()) {
        showToast('Please enter task URL', 'error');
        return;
    }

    const participants = parseInt(participantsInput.value);
    if (!participants || participants < 1) {
        showToast('Please enter valid number of participants', 'error');
        return;
    }

    const total = participants * selectedTaskType.reward;
    if (total > walletBalance) {
        showToast('Insufficient wallet balance', 'error');
        return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    let finalDefaultDescription = '';
    let finalCustomDescription = '';
    let useCustom = customDescToggle.checked;

    if (useCustom) {
        finalCustomDescription = customDescription.value.trim();
        if (!finalCustomDescription) {
            showToast('Please enter custom description', 'error');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            return;
        }
        finalDefaultDescription = selectedTaskType.description || 'Task description';
    } else {
        finalDefaultDescription = selectedTaskType.description || descriptionTextarea.value.trim() || 'No description';
        if (!finalDefaultDescription || finalDefaultDescription === '') {
            showToast('Task must have a description', 'error');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            return;
        }
    }

    const payload = {
        category: platformSelect.value,
        taskType: taskTypeSelect.value,
        taskUrl: taskUrlInput.value.trim(),
        participants: participants,
        defaultDescription: finalDefaultDescription,
        customDescription: finalCustomDescription,
        useCustomDescription: useCustom
    };

    console.log('📤 Sending payload:', payload);

    try {
        const res = await fetch(API_URL + '/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (!res.ok) {
            console.error('❌ Server response:', data);
            throw new Error(data.message || 'Failed to post task');
        }

        console.log('✅ Task created:', data);

        modalTaskId.textContent = data.taskId;
        successModal.classList.add('active');
        showToast('Task posted successfully! Awaiting admin review', 'success');

        walletBalance -= total;
        walletAmountSpan.textContent = '₦' + walletBalance.toLocaleString();

        if (currentUser) {
            currentUser.balance = walletBalance;
            localStorage.setItem('earncial_user', JSON.stringify(currentUser));
        }

        // Add new task to TOP of table
        addTaskToTable(data.task || data);

        taskForm.reset();
        taskTypeSelect.disabled = true;
        customDescGroup.style.display = 'none';
        customDescToggle.checked = false;
        descriptionTextarea.disabled = false;
        descriptionTextarea.classList.remove('read-only');
        resetTaskDetails();

    } catch (err) {
        showToast('Error: ' + err.message, 'error');
        console.error('❌ Task submission error:', err);
    } finally {
        submitBtn.classList.remove('loading');
        updateBudget();
    }
});

// ======== LOAD EXISTING TASKS - NEW AT TOP ========
async function loadExistingTasks() {
    try {
        console.log('📥 Loading existing tasks...');
        
        const res = await fetch(API_URL + '/api/tasks/my-tasks', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Failed to load tasks');

        const data = await res.json();
        
        // ✅ Backend returns { tasks: [...], pagination: {...} }
        const tasks = data.tasks || data || [];
        
        console.log('✅ Loaded tasks:', tasks.length);
        
        if (tasks.length > 0) {
            const empty = tasksTableBody.querySelector('.empty-table');
            if (empty) empty.parentElement.remove();

            // ✅ Sort by date: NEWEST FIRST
            tasks.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA; // Newest first (bigger - smaller)
            });

            // Clear table
            tasksTableBody.innerHTML = '';

            // Add all tasks (newest to oldest)
            tasks.forEach(task => {
                const row = createTaskRow(task);
                tasksTableBody.appendChild(row); // Append in order
            });
            
            // Update S/N (1 = newest at top)
            updateSerialNumbers();
            
            showToast(`Loaded ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`, 'success');
        } else {
            console.log('ℹ️ No tasks found');
            if (!tasksTableBody.querySelector('.empty-table')) {
                tasksTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="empty-table">
                            <i class="fas fa-inbox" style="font-size: 48px; color: var(--text-muted); margin-bottom: 15px;"></i>
                            <p>No tasks posted yet. Create your first task above!</p>
                        </td>
                    </tr>
                `;
            }
        }
    } catch (err) {
        console.error('❌ Error loading tasks:', err);
        showToast('Error loading task history: ' + err.message, 'error');
    }
}

// ======== MODAL FUNCTIONS ========
function closeModal() {
    successModal.classList.remove('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }
}

// ======== INIT ========
async function init() {
    if (!checkAuth()) return;

    loadWalletBalance();
    await loadCategories();
    await loadExistingTasks();

    platformSelect.addEventListener('change', function() {
        loadTaskTypes(this.value);
    });
    
    taskTypeSelect.addEventListener('change', updateTaskDetails);
    participantsInput.addEventListener('input', updateBudget);
    taskUrlInput.addEventListener('input', updateBudget);
    customDescToggle.addEventListener('change', toggleCustomDescription);

    showToast('Create engaging tasks to reach thousands of active users, ' + (currentUser.username || 'Advertiser') + '!', 'success');
}

window.addEventListener('DOMContentLoaded', init);
console.log('✅ Post Task JS Loaded - NEW tasks at TOP, OLD tasks at BOTTOM');