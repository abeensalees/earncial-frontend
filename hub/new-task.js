// ================================================
// EARNCIAL ADVERTISERS - POST TASK PAGE (COMPLETE)
// Version: 3.0 - With Sample Image Upload + Chart Ready
// Features: Image preview, Telegram upload, Charts, Stats
// ================================================

const API_URL = 'https://earncial-backend-copy.onrender.com';
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// ======== GLOBAL STATE ========
let categories = [];
let taskTypes = [];
let selectedTaskType = null;
let walletBalance = 0;
let sampleImageFile = null; // Hoton da aka zaɓa
let sampleImagePreview = null; // Preview URL

// ======== CHECK AUTH ========
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
const descriptionTextarea = document.getElementById('description');
const customDescGroup = document.getElementById('customDescGroup');
const customDescToggle = document.getElementById('customDescToggle');
const customDescription = document.getElementById('customDescription');
const taskUrlInput = document.getElementById('taskUrl');
const participantsInput = document.getElementById('participants');
const totalBudget = document.getElementById('totalBudget');

// ✅ SAMPLE IMAGE ELEMENTS (Sabubbi!)
const sampleImageInput = document.getElementById('sampleImage');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const imageFileName = document.getElementById('imageFileName');
const imageFileSize = document.getElementById('imageFileSize');

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

// Duba ko akwai saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        </div>
        <div class="toast-content"><p>${message}</p></div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
}

// ======== WALLET BALANCE ========
function loadWalletBalance() {
    if (currentUser && currentUser.balance !== undefined) {
        walletBalance = currentUser.balance;
        walletAmountSpan.textContent = '₦' + walletBalance.toLocaleString();
    }
}

// ======== LOAD CATEGORIES (Platforms) ========
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
    descriptionTextarea.value = selectedTaskType.description || '';

    updateBudget();
}

function resetTaskDetails() {
    rewardInput.value = '';
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

    // Check if can submit
    const canSubmit = total > 0 && 
                     total <= walletBalance && 
                     selectedTaskType && 
                     taskUrlInput.value.trim();
    
    submitBtn.disabled = !canSubmit;

    // Warning idan balance ba ya isa
    if (total > walletBalance && total > 0) {
        showToast('Insufficient balance! Need ₦' + (total - walletBalance).toLocaleString() + ' more', 'warning');
    }
}

// ======== 📸 SAMPLE IMAGE UPLOAD (SABUWA!) ========

/**
 * Handle image selection
 * Yi check file type da size, sannan nuna preview
 */
function handleImageSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        clearImagePreview();
        return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'error');
        clearImagePreview();
        return;
    }

    // Check file size since in frotend (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showToast('Image too large! Maximum 10MB allowed', 'error');
        clearImagePreview();
        return;
    }

    // Save file
    sampleImageFile = file;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = function(e) {
        sampleImagePreview = e.target.result;
        showImagePreview(file);
    };
    reader.readAsDataURL(file);

    console.log('✅ Image selected:', file.name, '-', (file.size / 1024).toFixed(2) + 'KB');
}

/**
 * Show image preview
 */
function showImagePreview(file) {
    imagePreview.src = sampleImagePreview;
    imageFileName.textContent = file.name;
    imageFileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
    imagePreviewContainer.style.display = 'block';
}

/**
 * Remove/clear image preview
 */
function clearImagePreview() {
    sampleImageFile = null;
    sampleImagePreview = null;
    imagePreview.src = '';
    imageFileName.textContent = '';
    imageFileSize.textContent = '';
    imagePreviewContainer.style.display = 'none';
    if (sampleImageInput) {
        sampleImageInput.value = '';
    }
}

// Add event listeners don image
if (sampleImageInput) {
    sampleImageInput.addEventListener('change', handleImageSelect);
}

if (removeImageBtn) {
    removeImageBtn.addEventListener('click', clearImagePreview);
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

// ======== CREATE TASK ROW (Helper) ========
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
    
    // New tasks go to TOP
    tasksTableBody.prepend(row);
    
    updateSerialNumbers();
}

// ======== UPDATE SERIAL NUMBERS ========
function updateSerialNumbers() {
    const rows = tasksTableBody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        const snCell = row.querySelector('td:first-child strong');
        if (snCell) {
            snCell.textContent = index + 1;
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

// ======== 📤 POST TASK (WITH IMAGE UPLOAD) ========
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

    // Description: custom only (no default)
    const customDescEl = document.getElementById('customDescription');
    const finalCustomDescription = customDescEl ? customDescEl.value.trim() : '';
    const finalDefaultDescription = selectedTaskType.description || 'Task description';

    // ✅ CREATE FORM DATA (don image upload)
    const formData = new FormData();
    formData.append('category', platformSelect.value);
    formData.append('taskType', taskTypeSelect.value);
    formData.append('taskUrl', taskUrlInput.value.trim());
    formData.append('participants', participants);
    formData.append('defaultDescription', finalDefaultDescription);
    formData.append('customDescription', finalCustomDescription);
    formData.append('useCustomDescription', finalCustomDescription ? 'true' : 'false');

    // ✅ ADD SAMPLE IMAGE (idan akwai)
    if (sampleImageFile) {
        formData.append('sampleImage', sampleImageFile);
        console.log('📤 Uploading task with sample image:', sampleImageFile.name);
    } else {
        console.log('📤 Uploading task without image');
    }

    try {
        const res = await fetch(API_URL + '/api/tasks', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
                // ⚠️ DON'T set Content-Type - browser will set it with boundary for FormData
            },
            body: formData
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

        // Update wallet
        walletBalance -= total;
        walletAmountSpan.textContent = '₦' + walletBalance.toLocaleString();

        if (currentUser) {
            currentUser.balance = walletBalance;
            localStorage.setItem('earncial_user', JSON.stringify(currentUser));
        }

        // Add new task to table
        addTaskToTable(data.task || data);

        // Reset form
        taskForm.reset();
        taskTypeSelect.disabled = true;
        const cdEl = document.getElementById('customDescription');
        if (cdEl) cdEl.value = '';
        resetTaskDetails();
        clearImagePreview(); // ✅ Clear image preview

    } catch (err) {
        showToast('Error: ' + err.message, 'error');
        console.error('❌ Task submission error:', err);
    } finally {
        submitBtn.classList.remove('loading');
        updateBudget();
    }
});

// ======== LOAD EXISTING TASKS ========
async function loadExistingTasks() {
    try {
        console.log('📥 Loading existing tasks...');
        
        const res = await fetch(API_URL + '/api/tasks/my-tasks', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Failed to load tasks');

        const data = await res.json();
        const tasks = data.tasks || data || [];
        
        console.log('✅ Loaded tasks:', tasks.length);
        
        if (tasks.length > 0) {
            const empty = tasksTableBody.querySelector('.empty-table');
            if (empty) empty.parentElement.remove();

            // Sort: NEWEST FIRST
            tasks.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });

            tasksTableBody.innerHTML = '';

            tasks.forEach(task => {
                const row = createTaskRow(task);
                tasksTableBody.appendChild(row);
            });
            
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
    document.getElementById('logoutModal')?.classList.add('active');
}

// ======== 📊 CHART INTEGRATION (Ready for future) ========
/**
 * Load task statistics for charts
 * Za a ƙirƙira dedicated analytics page
 */
async function loadTaskStats() {
    try {
        const res = await fetch(API_URL + '/api/tasks/stats/summary', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Failed to load stats');

        const stats = await res.json();
        
        console.log('📊 Task Stats:', stats);
        
        // Za a yi amfani da wannan data don charts
        // Example: Chart.js, Recharts, ApexCharts
        return stats;
        
    } catch (err) {
        console.error('❌ Error loading stats:', err);
        return null;
    }
}

// ======== REFRESH TASKS ========
async function refreshTasks() {
    const btn = document.querySelector('.refresh-btn');
    
    // Spin animation
    if (btn) {
        btn.style.pointerEvents = 'none';
        btn.querySelector('i').style.animation = 'spin 0.6s linear infinite';
    }
    
    await loadExistingTasks();
    
    // Stop spin
    if (btn) {
        btn.style.pointerEvents = 'auto';
        btn.querySelector('i').style.animation = '';
    }
}
// ======== INITIALIZATION ========
async function init() {
    if (!checkAuth()) return;

    console.log('🚀 Initializing Post Task Page...');

    loadWalletBalance();
    await loadCategories();
    await loadExistingTasks();
    
    // Load stats (for future chart integration)
    // await loadTaskStats();

    // Event listeners
    platformSelect.addEventListener('change', function() {
        loadTaskTypes(this.value);
    });
    
    taskTypeSelect.addEventListener('change', updateTaskDetails);
    participantsInput.addEventListener('input', updateBudget);
    taskUrlInput.addEventListener('input', updateBudget);
    // customDescToggle removed - no longer used

    showToast('Create engaging tasks to reach thousands of active users, ' + (currentUser.username || 'Advertiser') + '!', 'success');
}

// Toggle notes accordion
function toggleNotes() {
    const header  = document.getElementById('notesHeader');
    const content = document.getElementById('notesContent');
    if (!header || !content) return;
    const isOpen = content.classList.contains('open');
    content.classList.toggle('open', !isOpen);
    header.classList.toggle('open', !isOpen);
}
// ======== START APP ========
window.addEventListener('DOMContentLoaded', init);

console.log('✅ Post Task JS Loaded - Version 3.0');
console.log('📸 Features: Image upload, Preview, Telegram storage');
console.log('📊 Chart integration ready');
