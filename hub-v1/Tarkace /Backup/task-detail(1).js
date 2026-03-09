
// ================================================
// EARNCIAL EARNERS - TASK DETAILS PAGE
// FINAL FIXED VERSION
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('earncial_token');
let currentUser = null;
let currentTask = null;
let taskStarted = false;
let selectedFile = null;
let userHandles = [];

// ============ CHECK AUTH ============
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

// ============ CHECK ACTIVATION STATUS ============
const ACTIVATION_ENABLED = false;

function checkActivation() {
    if (!ACTIVATION_ENABLED) return true;
    
    const isActivated = currentUser.isActivated || false;
    
    if (!isActivated) {
        alert('Please activate your account to complete tasks');
        window.location.href = 'activate.html';
        return false;
    }
    
    return true;
}

// ============ DOM ELEMENTS ============
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const themeIcon = document.getElementById('themeIcon');
const toastContainer = document.getElementById('toastContainer');
const startTaskBtn = document.getElementById('startTaskBtn');
const fileUploadArea = document.getElementById('fileUploadArea');
const fileUploadContainer = document.getElementById('fileUploadContainer');
const screenshotFile = document.getElementById('screenshotFile');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const handleDropdown = document.getElementById('handleDropdown');
const taskCategoryIcon = document.getElementById('taskCategoryIcon');
const taskCategoryName = document.getElementById('taskCategoryName');
const taskTypeName = document.getElementById('taskTypeName');
const taskIdDisplay = document.getElementById('taskIdDisplay');
const taskReward = document.getElementById('taskReward');
const participantsFilled = document.getElementById('participantsFilled');
const participantsTotal = document.getElementById('participantsTotal');
const slotsRemaining = document.getElementById('slotsRemaining');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const taskDescription = document.getElementById('taskDescription');
const instructionsList = document.getElementById('instructionsList');
const importantNoteText = document.getElementById('importantNoteText');
const modalTaskName = document.getElementById('modalTaskName');
const modalPlatformIcon = document.getElementById('modalPlatformIcon');
const submitTaskButton = document.getElementById('submitTaskButton');

// ============ PLATFORM ICONS & COLORS ============
const platformIcons = {
    'facebook': { icon: 'fab fa-facebook-f', class: 'icon-facebook', color: '#1877F2' },
    'instagram': { icon: 'fab fa-instagram', class: 'icon-instagram', color: '#E4405F' },
    'twitter': { icon: 'fab fa-twitter', class: 'icon-twitter', color: '#000000' },
    'x (twitter)': { icon: 'fab fa-x-twitter', class: 'icon-twitter', color: '#000000' },
    'tiktok': { icon: 'fab fa-tiktok', class: 'icon-tiktok', color: '#000000' },
    'youtube': { icon: 'fab fa-youtube', class: 'icon-youtube', color: '#FF0000' },
    'whatsapp': { icon: 'fab fa-whatsapp', class: 'icon-whatsapp', color: '#25D366' },
    'telegram': { icon: 'fab fa-telegram', class: 'icon-telegram', color: '#0088CC' },
    'linkedin': { icon: 'fab fa-linkedin-in', class: 'icon-linkedin', color: '#0A66C2' },
    'spotify': { icon: 'fab fa-spotify', class: 'icon-spotify', color: '#1DB954' }
};

// ============ TASK TYPE INSTRUCTIONS ============
const taskInstructions = {
    'facebook-like': {
        steps: [
            'Click the "Start Task" button below to begin.',
            'You will be redirected to the Facebook post.',
            'Like the post using your connected Facebook account.',
            'Return to this page and select your Facebook account.',
            'Take a screenshot showing the liked post.',
            'Upload the screenshot and click "Submit Task".'
        ],
        note: 'Make sure your Facebook account is active and has a profile picture. You must keep the like for at least 7 days.',
        screenshotRequired: false
    },
    'facebook-follow': {
        steps: [
            'Click "Start Task" to open the Facebook page.',
            'Follow/Like the Facebook page.',
            'Return here and select your Facebook account.',
            'Screenshot showing you followed the page.',
            'Upload screenshot and submit.'
        ],
        note: 'Your Facebook profile must be public temporarily for verification. Keep following for 7 days minimum.',
        screenshotRequired: true
    },
    'facebook-share': {
        steps: [
            'Click "Start Task" to open the post.',
            'Share the post to your timeline (Public).',
            'Select your Facebook account here.',
            'Take screenshot of the shared post on your timeline.',
            'Upload and submit.'
        ],
        note: 'The shared post must remain on your timeline for 7 days. Set share visibility to Public.',
        screenshotRequired: true
    },
    'facebook-comment': {
        steps: [
            'Open the Facebook post via "Start Task".',
            'Write a meaningful comment (minimum 5 words).',
            'Select your Facebook account.',
            'Screenshot showing your comment.',
            'Submit with screenshot.'
        ],
        note: 'Comments must be relevant and in English. Spam comments will be rejected. Do not delete comment for 7 days.',
        screenshotRequired: true
    },
    'instagram-like': {
        steps: [
            'Click "Start Task" to open Instagram post.',
            'Like the post with your Instagram account.',
            'Return and select your Instagram handle.',
            'Screenshot the liked post.',
            'Upload and submit.'
        ],
        note: 'Your Instagram must be public temporarily. Keep the like for 7 days minimum.',
        screenshotRequired: true
    },
    'instagram-follow': {
        steps: [
            'Open Instagram profile via "Start Task".',
            'Follow the Instagram account.',
            'Select your Instagram handle here.',
            'Screenshot showing you follow the account.',
            'Submit with screenshot.'
        ],
        note: 'Account must be public for verification. You must remain a follower for at least 7 days.',
        screenshotRequired: true
    },
    'instagram-comment': {
        steps: [
            'Open the Instagram post.',
            'Comment something relevant (minimum 5 words).',
            'Select your Instagram account.',
            'Screenshot your comment.',
            'Upload and submit.'
        ],
        note: 'Use emojis and be creative! Comments must be genuine. Keep comment for 7 days.',
        screenshotRequired: true
    },
    'instagram-save': {
        steps: [
            'Open Instagram post via button.',
            'Save/Bookmark the post.',
            'Select your Instagram handle.',
            'Screenshot showing saved post in your collections.',
            'Submit.'
        ],
        note: 'Post must remain saved for 7 days.',
        screenshotRequired: true
    },
    'tiktok-like': {
        steps: [
            'Open TikTok video via "Start Task".',
            'Like the video.',
            'Select your TikTok account.',
            'Screenshot the liked video.',
            'Upload screenshot and submit.'
        ],
        note: 'TikTok profile must be public. Keep like for 7 days minimum.',
        screenshotRequired: true
    },
    'tiktok-follow': {
        steps: [
            'Open TikTok profile.',
            'Follow the account.',
            'Select your TikTok handle here.',
            'Screenshot showing you follow.',
            'Submit with proof.'
        ],
        note: 'Profile must be public temporarily. Stay followed for 7 days.',
        screenshotRequired: true
    },
    'tiktok-comment': {
        steps: [
            'Open TikTok video.',
            'Leave a creative comment.',
            'Select your TikTok account.',
            'Screenshot your comment.',
            'Upload and submit.'
        ],
        note: 'Be creative and use emojis! Do not delete for 7 days.',
        screenshotRequired: true
    },
    'tiktok-share': {
        steps: [
            'Open TikTok video.',
            'Share to your profile or via link.',
            'Select your account.',
            'Screenshot proof of share.',
            'Submit.'
        ],
        note: 'Shared content must remain visible for 7 days.',
        screenshotRequired: true
    },
    'youtube-like': {
        steps: [
            'Open YouTube video.',
            'Like the video (thumbs up).',
            'Select your YouTube account.',
            'Screenshot showing liked video.',
            'Submit proof.'
        ],
        note: 'Your YouTube channel must exist. Keep like for 7 days.',
        screenshotRequired: true
    },
    'youtube-subscribe': {
        steps: [
            'Open YouTube channel.',
            'Subscribe and enable notifications (bell icon).',
            'Select your YouTube account.',
            'Screenshot showing subscribed + bell icon.',
            'Upload and submit.'
        ],
        note: 'Remain subscribed with notifications ON for 7 days minimum.',
        screenshotRequired: true
    },
    'youtube-comment': {
        steps: [
            'Open YouTube video.',
            'Write a thoughtful comment (minimum 15 words).',
            'Select your YouTube account.',
            'Screenshot your comment.',
            'Submit with proof.'
        ],
        note: 'Comments must add value. Do not delete for 7 days.',
        screenshotRequired: true
    },
    'youtube-watch': {
        steps: [
            'Open YouTube video.',
            'Watch the FULL video (do not skip).',
            'Like the video after watching.',
            'Select your account.',
            'Screenshot showing watched + liked.',
            'Submit.'
        ],
        note: 'Video must be watched completely. Keep like for 7 days.',
        screenshotRequired: true
    },
    'twitter-like': {
        steps: [
            'Open Twitter/X post.',
            'Like the post (heart icon).',
            'Select your Twitter account.',
            'Screenshot the liked post.',
            'Upload and submit.'
        ],
        note: 'Your Twitter profile must be active. Keep like for 7 days.',
        screenshotRequired: true
    },
    'twitter-follow': {
        steps: [
            'Open Twitter/X profile.',
            'Follow the account.',
            'Select your Twitter handle.',
            'Screenshot showing you follow.',
            'Submit proof.'
        ],
        note: 'Remain a follower for 7 days.',
        screenshotRequired: true
    },
    'twitter-retweet': {
        steps: [
            'Open Twitter/X post.',
            'Retweet (or Quote Tweet).',
            'Select your account.',
            'Screenshot your retweet.',
            'Submit.'
        ],
        note: 'Retweet must remain on your profile for 7 days.',
        screenshotRequired: true
    },
    'twitter-comment': {
        steps: [
            'Open Twitter/X post.',
            'Reply with a meaningful comment.',
            'Select your Twitter account.',
            'Screenshot your reply.',
            'Upload and submit.'
        ],
        note: 'Replies must be genuine. Keep reply for 7 days.',
        screenshotRequired: true
    },
    'whatsapp-join': {
        steps: [
            'Click "Start Task" to open WhatsApp group link.',
            'Join the WhatsApp group.',
            'Select your WhatsApp number.',
            'Screenshot showing you joined the group.',
            'Upload and submit.'
        ],
        note: 'Remain in the group for 7 days.',
        screenshotRequired: true
    },
    'telegram-join': {
        steps: [
            'Open Telegram group/channel link.',
            'Join the group or channel.',
            'Select your Telegram username.',
            'Screenshot showing you joined.',
            'Submit proof.'
        ],
        note: 'Stay in the group/channel for 7 days minimum.',
        screenshotRequired: true
    },
    'linkedin-follow': {
        steps: [
            'Open LinkedIn profile or page.',
            'Follow/Connect with the account.',
            'Select your LinkedIn account.',
            'Screenshot showing connection.',
            'Submit.'
        ],
        note: 'Remain connected for 7 days.',
        screenshotRequired: true
    },
    'linkedin-like': {
        steps: [
            'Open LinkedIn post.',
            'Like or React to the post.',
            'Select your account.',
            'Screenshot the reacted post.',
            'Upload and submit.'
        ],
        note: 'Reaction must stay for 7 days.',
        screenshotRequired: true
    },
    'spotify-follow': {
        steps: [
            'Open Spotify artist/playlist.',
            'Follow the artist or save playlist.',
            'Select your Spotify account.',
            'Screenshot showing followed/saved.',
            'Submit proof.'
        ],
        note: 'Must remain followed for 7 days.',
        screenshotRequired: true
    },
    'default': {
        steps: [
            'Click "Start Task" to begin.',
            'Complete the task as described.',
            'Return to this page.',
            'Select your connected social media account.',
            'Upload proof (if required).',
            'Click "Submit Task" to complete.'
        ],
        note: 'Follow all task requirements carefully. Tasks are verified manually and may take up to 24-48 hours.',
        screenshotRequired: false
    }
};

// ============ GET TASK ID FROM URL ============
function getTaskIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedId = urlParams.get('id');
    
    if (!encodedId) return null;
    
    const decodedId = decodeURIComponent(encodedId);
    
    console.log('📥 Encoded ID from URL:', encodedId);
    console.log('📤 Decoded Task ID:', decodedId);
    
    return decodedId;
}

// ============ FETCH TASK DETAILS ============
async function fetchTaskDetails(taskId) {
    try {
        const encodedTaskId = encodeURIComponent(taskId);
        
        console.log('🔍 Fetching task with ID:', taskId);
        console.log('🔗 Encoded for API:', encodedTaskId);
        
        const response = await fetch(`${API_URL}/api/tasks/${encodedTaskId}/details`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load task details');
        }
        
        currentTask = await response.json();
        console.log('✅ Task loaded:', currentTask);
        
        await loadUserHandles();
        renderTaskDetails();
        
    } catch (error) {
        console.error('❌ Fetch task error:', error);
        showToast('Failed to load task details', 'error', 'Error');
        setTimeout(() => window.location.href = 'tasks.html', 2000);
    }
}

// ============ LOAD USER'S APPROVED HANDLES ============
async function loadUserHandles() {
    try {
        const response = await fetch(`${API_URL}/api/social-handles/my-handles`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load handles');
        }
        
        const result = await response.json();
        
        // ✅ FIXED: Access handles array correctly
        const allHandles = result.handles || [];
        
        const taskPlatform = currentTask.category?.displayName || currentTask.category?.name;
        
        // ✅ FIXED: Filter approved handles
        userHandles = allHandles.filter(h => 
            h.status === 'approved' && 
            h.platform.toLowerCase() === taskPlatform.toLowerCase()
        );
        
        console.log('✅ All handles:', allHandles);
        console.log('✅ Approved handles for', taskPlatform, ':', userHandles);
        
    } catch (error) {
        console.error('❌ Load handles error:', error);
        userHandles = [];
    }
}

// ============ RENDER TASK DETAILS ============
function renderTaskDetails() {
    if (!currentTask) return;
    
    const category = currentTask.category;
    const taskType = currentTask.taskType;
    const categoryName = category?.name?.toLowerCase() || 'general';
    const taskTypeName = taskType?.name?.toLowerCase() || 'task';
    
    // Update platform icon
    const platformIcon = platformIcons[categoryName] || { icon: 'fas fa-tasks', class: 'icon-general', color: '#00aaff' };
    taskCategoryIcon.className = `task-category-icon ${platformIcon.class}`;
    taskCategoryIcon.innerHTML = `<i class="${platformIcon.icon}"></i>`;
    
    // Update modal platform icon
    if (modalPlatformIcon) {
        modalPlatformIcon.className = platformIcon.icon;
        modalPlatformIcon.style.color = platformIcon.color;
    }
    
    // Update category name and task type
    taskCategoryName.textContent = category?.displayName || 'Unknown Platform';
    taskTypeName.textContent = taskType?.displayName || 'Task';
    
    // Update modal task name
    if (modalTaskName) {
        modalTaskName.textContent = `${category?.displayName || 'Unknown'} - ${taskType?.displayName || 'Task'}`;
    }
    
    // Update task ID
    taskIdDisplay.textContent = currentTask.taskId;
    
    // ✅ FIXED: Use earnerReward instead of reward
    taskReward.textContent = `₦${currentTask.earnerReward}`;
    
    // Update participants progress
    const completed = currentTask.completedCount || 0;
    const total = currentTask.participants || 0;
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    if (participantsFilled) participantsFilled.textContent = completed;
    if (participantsTotal) participantsTotal.textContent = total;
    if (slotsRemaining) slotsRemaining.textContent = `${remaining} slots remaining`;
    if (progressText) progressText.textContent = `${completed} completed`;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    
    // Update description
    let description = '';
    if (currentTask.useCustomDescription && currentTask.customDescription) {
        description = currentTask.customDescription;
    } else {
        description = currentTask.defaultDescription || taskType?.description || 'No description available.';
    }
    if (taskDescription) taskDescription.textContent = description;
    
    // Get instructions
    const instructionKey = `${categoryName}-${taskTypeName}`;
    const instructions = taskInstructions[instructionKey] || taskInstructions['default'];
    
    // Render instructions
    if (instructionsList) {
        instructionsList.innerHTML = instructions.steps.map(step => 
            `<li>${step}</li>`
        ).join('');
    }
    
    // Render important note
    if (importantNoteText) {
        importantNoteText.textContent = instructions.note;
    }
    
    // ✅ FIXED: Show/Hide screenshot upload based on requirement
    if (fileUploadContainer) {
        fileUploadContainer.style.display = instructions.screenshotRequired ? 'block' : 'none';
    }
    
    populateHandlesDropdown();
}

// ============ POPULATE HANDLES DROPDOWN ============
function populateHandlesDropdown() {
    if (!handleDropdown) return;
    
    handleDropdown.innerHTML = '<option value="">-- Select your account --</option>';
    
    if (userHandles.length === 0) {
        handleDropdown.innerHTML += '<option value="no_handle">❌ No approved accounts found</option>';
        handleDropdown.disabled = true;
        
        startTaskBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Social Handle';
        startTaskBtn.onclick = () => {
            window.location.href = 'social-media.html';
        };
        startTaskBtn.classList.remove('btn-primary');
        startTaskBtn.classList.add('btn-secondary');
        
        showToast(`Please add and get approval for your ${currentTask.category?.displayName} account first`, 'warning', 'No Approved Handles');
        
    } else {
        userHandles.forEach(handle => {
            const option = document.createElement('option');
            option.value = handle._id;
            option.textContent = `${handle.handle}`;
            handleDropdown.appendChild(option);
        });
        
        handleDropdown.disabled = false;
    }
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

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

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

window.toggleTheme = toggleTheme;

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

window.showToast = showToast;

// ============ MODAL FUNCTIONS ============
function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    if (id === 'submitTaskModal') {
        resetSubmitForm();
    }
}

window.showModal = showModal;
window.closeModal = closeModal;

// ============ FILE UPLOAD FUNCTIONS ============
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // ✅ FIXED: Validate that it's actually an image
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file (JPG, PNG, GIF)', 'error', 'Invalid File Type');
        screenshotFile.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error', 'File Too Large');
        screenshotFile.value = '';
        return;
    }
    
    selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.src = e.target.result;
        imagePreviewContainer.style.display = 'block';
        if (fileUploadArea) fileUploadArea.style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    showToast('Screenshot uploaded successfully', 'success', 'File Uploaded');
}

window.handleFileSelect = handleFileSelect;

function removeImage() {
    selectedFile = null;
    imagePreview.src = '';
    imagePreviewContainer.style.display = 'none';
    if (fileUploadArea) fileUploadArea.style.display = 'block';
    screenshotFile.value = '';
}

window.removeImage = removeImage;

// Drag and drop
if (fileUploadArea) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, () => {
            fileUploadArea.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, () => {
            fileUploadArea.classList.remove('dragover');
        }, false);
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            screenshotFile.files = files;
            handleFileSelect({ target: { files: files } });
        }
    }, false);
}

// ============ TASK FUNCTIONS ============
function startTask() {
    if (!checkActivation()) return;
    
    if (userHandles.length === 0) {
        showToast('Please add an approved social media handle first', 'warning');
        return;
    }
    
    if (!taskStarted) {
        startTaskBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Task in Progress...';
        startTaskBtn.disabled = true;
        startTaskBtn.classList.remove('btn-primary');
        startTaskBtn.classList.add('btn-secondary');
        
        showToast('Task timer started! Complete the task and return here to submit.', 'info', 'Task Started');
        
        if (currentTask.taskUrl) {
            window.open(currentTask.taskUrl, '_blank');
        }
        
        setTimeout(() => {
            taskStarted = true;
            startTaskBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Task';
            startTaskBtn.disabled = false;
            startTaskBtn.classList.remove('btn-secondary');
            startTaskBtn.classList.add('btn-success');
            startTaskBtn.onclick = () => showModal('submitTaskModal');
            
            showToast('Task ready for submission!', 'success', 'Ready to Submit');
        }, 3000);
    }
}

window.startTask = startTask;

// ============ SUBMIT TASK ============
async function submitTask() {
    const selectedHandle = handleDropdown.value;
    
    if (!selectedHandle || selectedHandle === '' || selectedHandle === 'no_handle') {
        showToast('Please select your social media account', 'error', 'Account Required');
        return;
    }
    
    const categoryName = currentTask.category?.name?.toLowerCase() || 'general';
    const taskTypeName = currentTask.taskType?.name?.toLowerCase() || 'task';
    const instructionKey = `${categoryName}-${taskTypeName}`;
    const instructions = taskInstructions[instructionKey] || taskInstructions['default'];
    
    // ✅ FIXED: Only require screenshot if screenshotRequired is true
    if (instructions.screenshotRequired && !selectedFile) {
        showToast('Please upload a screenshot as proof', 'error', 'Screenshot Required');
        return;
    }
    
    // ✅ FIXED: Validate that uploaded file is actually an image
    if (selectedFile && !selectedFile.type.startsWith('image/')) {
        showToast('Please upload a valid image file', 'error', 'Invalid File');
        return;
    }
    
    const taskNotes = document.getElementById('taskNotes')?.value || '';
    
    const formData = new FormData();
    formData.append('taskId', currentTask._id);
    formData.append('handleId', selectedHandle);
    formData.append('notes', taskNotes);
    
    if (selectedFile) {
        formData.append('screenshot', selectedFile);
    }
    
    const submitBtn = submitTaskButton;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const response = await fetch(`${API_URL}/api/task-submissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit task');
        }
        
        const result = await response.json();
        
        closeModal('submitTaskModal');
        
        showToast('Task submitted successfully! Redirecting...', 'success', 'Success');
        
        setTimeout(() => {
            window.location.href = 'tasks.html';
        }, 1500);
        
    } catch (error) {
        showToast(error.message || 'Failed to submit task', 'error', 'Submission Failed');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Task for Review';
    }
}

window.submitTask = submitTask;

function resetSubmitForm() {
    if (handleDropdown) handleDropdown.selectedIndex = 0;
    removeImage();
    const notesField = document.getElementById('taskNotes');
    if (notesField) notesField.value = '';
}

function shareTask() {
    const shareUrl = window.location.href;
    const shareText = `Complete this task on Earncial and earn ₦${currentTask.earnerReward}!`;
    
    if (navigator.share) {
        navigator.share({
            title: `Earncial Task: ${currentTask.taskType?.displayName}`,
            text: shareText,
            url: shareUrl,
        })
        .then(() => showToast('Task shared successfully!', 'success'))
        .catch((error) => showToast('Sharing failed', 'error'));
    } else {
        navigator.clipboard.writeText(shareUrl)
            .then(() => showToast('Task link copied to clipboard!', 'success', 'Link Copied'))
            .catch(() => showToast('Failed to copy link', 'error'));
    }
}

window.shareTask = shareTask;

// ============ COPY TASK ID ============
function copyTaskId() {
    const text = document.getElementById("taskIdDisplay")?.innerText;

    if (!text) {
        showToast('Task ID not found', 'error', 'Error');
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Task ID copied successfully', 'success', 'Copied');
        })
        .catch(() => {
            showToast('Failed to copy Task ID', 'error', 'Error');
        });
}

window.copyTaskId = copyTaskId;

// ============ LOGOUT ============
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }
}

window.logout = logout;

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
            const modal = document.getElementById('submitTaskModal');
            if (modal && modal.style.display === 'flex') {
                closeModal('submitTaskModal');
            }
        }
    });
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
}

// ============ INITIALIZATION ============
async function init() {
    if (!checkAuth()) return;
    
    loadTheme();
    setupEventListeners();
    
    const taskId = getTaskIdFromURL();
    
    if (!taskId) {
        showToast('Invalid task ID', 'error', 'Error');
        setTimeout(() => window.location.href = 'tasks.html', 2000);
        return;
    }
    
    await fetchTaskDetails(taskId);
}

window.addEventListener('DOMContentLoaded', init);
console.log('✅ Task Details JS Loaded - All Issues Fixed!');