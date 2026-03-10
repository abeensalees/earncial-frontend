
// ================================================
// EARNCIAL EARNERS - TASK DETAILS PAGE
// FINAL PRODUCTION VERSION - ALL FIXES APPLIED
// ================================================

const API_URL = 'https://earncial-backend-copy.onrender.com';
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

// ============ CHECK ACTIVATION STATUS (BACKEND API) ============
async function checkActivation() {
    try {
        console.log('🔄 Checking activation status...');
        
        const res = await fetch(`${API_URL}/api/activation/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error('Failed to check activation status');
        }

        const data = await res.json();
        
        console.log('Activation Data:', {
            isActivated: data.user?.isActivated,
            activationRequired: data.activation?.required
        });
        
        // Update currentUser
        currentUser = data.user;
        localStorage.setItem('earncial_user', JSON.stringify(data.user));
        
        const isActivated = data.user?.isActivated || false;
        const activationRequired = data.activation?.required || false;
        
        // If activation not required by admin
        if (!activationRequired) {
            console.log('✅ Activation not required');
            hideActivationBanner();
            return true;
        }
        
        // Check if user is activated
        if (!isActivated) {
            console.log('⚠️ User NOT activated');
            showActivationBanner();
            return false;
        }
        
        console.log('✅ User is activated');
        hideActivationBanner();
        return true;
        
    } catch (error) {
        console.error('❌ Activation check error:', error);
        
        // Fallback to localStorage
        const fallbackActivated = currentUser?.isActivated || false;
        
        if (!fallbackActivated) {
            showActivationBanner();
        }
        
        return fallbackActivated;
    }
}

// ============ SHOW ACTIVATION BANNER ============
function showActivationBanner() {
    let banner = document.getElementById('activationBanner');
    
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'activationBanner';
        banner.className = 'activation-banner';
        banner.innerHTML = `
            <div class="activation-banner-content">
                <div class="activation-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="activation-text">
                    <h4>⚠️ Account Not Activated</h4>
                    <p>Activate your account now to start earning money from tasks!</p>
                </div>
                <button onclick="goToActivation()" class="btn-activate-now">
                    <i class="fas fa-rocket"></i> Activate Now
                </button>
            </div>
        `;
        
        const container = document.querySelector('.container');
        if (container && container.firstChild) {
            container.insertBefore(banner, container.firstChild);
        }
    }
    
    banner.style.display = 'block';
    
    // ✅ FIXED: Button NOT disabled - just changes onclick
    const startBtn = document.getElementById('startTaskBtn');
    if (startBtn) {
        startBtn.innerHTML = '<i class="fas fa-lock"></i> Activate Account First';
        startBtn.classList.remove('btn-primary', 'btn-success');
        startBtn.classList.add('btn-secondary');
        startBtn.onclick = goToActivation; // ✅ Redirect to activation
        startBtn.disabled = false; // ✅ NOT disabled
    }
}

// ============ HIDE ACTIVATION BANNER ============
function hideActivationBanner() {
    const banner = document.getElementById('activationBanner');
    if (banner) {
        banner.style.display = 'none';
    }
}

// ============ REDIRECT TO ACTIVATION ============
function goToActivation() {
    window.location.href = 'activation.html';
}

window.goToActivation = goToActivation;

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
const sampleImageContainer = document.getElementById('sampleImageContainer');
const sampleImage = document.getElementById('sampleImage');

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
        screenshotRequired: true
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
    'tiktok-comment': {
        steps: [
            'Open TikTok video.',
            'Leave a creative comment.',
            'Select your TikTok account.',
            'Screenshot your comment.',
            'Upload and submit.'
        ],
        note: 'Be creative and use emojis! Do not delete for 7 days.',
        screenshotRequired: false
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
    console.log('📥 Task ID:', decodedId);
    
    return decodedId;
}

// ============ FETCH TASK DETAILS ============
async function fetchTaskDetails(taskId) {
    try {
        const encodedTaskId = encodeURIComponent(taskId);
        
        console.log('🔍 Fetching task:', taskId);
        
        const response = await fetch(`${API_URL}/api/tasks/${encodedTaskId}/details`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load task details');
        }
        
        currentTask = await response.json();
        console.log('✅ Task loaded:', currentTask.taskId);
        
        await loadUserHandles();
        await renderTaskDetails();
        
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
        const allHandles = result.handles || result || [];
        
        const taskPlatform = currentTask.category?.displayName || currentTask.category?.name;
        
        // ✅ FIXED: Filter approved handles
        userHandles = allHandles.filter(h => 
            h.status === 'approved' && 
            h.platform.toLowerCase() === taskPlatform.toLowerCase()
        );
        
        console.log('✅ Approved handles for', taskPlatform, ':', userHandles.length);
        
    } catch (error) {
        console.error('❌ Load handles error:', error);
        userHandles = [];
    }
}

// ============ RENDER TASK DETAILS ============
async function renderTaskDetails() {
    if (!currentTask) return;
    
    const category = currentTask.category;
    const taskType = currentTask.taskType;
    const categoryName = category?.name?.toLowerCase() || 'general';
    const taskTypeName = taskType?.name?.toLowerCase() || 'task';
    
    // Update platform icon
    const platformIcon = platformIcons[categoryName] || { icon: 'fas fa-tasks', class: 'icon-general', color: '#00aaff' };
    if (taskCategoryIcon) {
        taskCategoryIcon.className = `task-category-icon ${platformIcon.class}`;
        taskCategoryIcon.innerHTML = `<i class="${platformIcon.icon}"></i>`;
    }
    
    if (modalPlatformIcon) {
        modalPlatformIcon.className = platformIcon.icon;
        modalPlatformIcon.style.color = platformIcon.color;
    }
    
    // Update text
    if (taskCategoryName) taskCategoryName.textContent = category?.displayName || 'Unknown Platform';
    if (taskTypeName) taskTypeName.textContent = taskType?.displayName || 'Task';
    if (modalTaskName) modalTaskName.textContent = `${category?.displayName || 'Unknown'} - ${taskType?.displayName || 'Task'}`;
    if (taskIdDisplay) taskIdDisplay.textContent = currentTask.taskId;
    if (taskReward) taskReward.textContent = `₦${currentTask.earnerReward}`;
    
    // Update progress
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
    
    if (importantNoteText) {
        importantNoteText.textContent = instructions.note;
    }
    
    // Show/Hide screenshot upload
    if (fileUploadContainer) {
        fileUploadContainer.style.display = instructions.screenshotRequired ? 'block' : 'none';
    }
    
    // ✅ RENDER SAMPLE IMAGE
    renderSampleImage();
    
    populateHandlesDropdown();
    
    // ✅ CHECK ACTIVATION
    await checkActivation();
}

// ============ RENDER SAMPLE IMAGE - COMPLETE FIX! ============
function renderSampleImage() {
    if (!sampleImageContainer || !sampleImage) {
        console.warn('⚠️ Sample image elements not found');
        return;
    }
    
    const telegramFileId = currentTask?.sampleImageTelegramFileId;
    const sampleImageUrl = currentTask?.sampleImage;
    
    console.log('🔍 Rendering sample image...');
    console.log('📌 Telegram File ID:', telegramFileId);
    console.log('📌 Sample URL:', sampleImageUrl);
    console.log('📌 Current Task:', currentTask);
    
    if (telegramFileId) {
        // ✅ Try multiple URL formats
        const encodedTaskId = encodeURIComponent(currentTask.taskId);
        const taskMongoId = currentTask._id;
        
        const imageUrls = [
            `${API_URL}/api/tasks/${encodedTaskId}/sample-image`,
            `${API_URL}/api/admin/tasks/${encodedTaskId}/sample-image`,
            `${API_URL}/api/tasks/${taskMongoId}/sample-image`,
            `${API_URL}/api/admin/tasks/${taskMongoId}/sample-image`
        ];
        
        console.log('🧪 Trying image URLs:', imageUrls);
        
        // Show loading state
        sampleImage.style.display = 'none';
        sampleImageContainer.style.display = 'block';
        
        // Remove old loading message if exists
        const oldMsg = document.getElementById('imageLoadingMsg');
        if (oldMsg) oldMsg.remove();
        
        const loadingMsg = document.createElement('p');
        loadingMsg.textContent = '⏳ Loading sample image...';
        loadingMsg.style.textAlign = 'center';
        loadingMsg.style.color = 'var(--text-muted)';
        loadingMsg.style.padding = '20px';
        loadingMsg.id = 'imageLoadingMsg';
        sampleImageContainer.appendChild(loadingMsg);
        
        // Try each URL until one works
        tryLoadImage(imageUrls, 0);
        
    } else if (sampleImageUrl && sampleImageUrl.trim() !== '') {
        // Public URL - no authentication needed
        console.log('✅ Loading public sample image:', sampleImageUrl);
        
        sampleImage.src = sampleImageUrl;
        sampleImage.alt = 'Sample';
        sampleImage.style.display = 'block';
        sampleImageContainer.style.display = 'block';
        
        sampleImage.onerror = function() {
            console.error('❌ Public image failed to load');
            sampleImageContainer.style.display = 'none';
        };
        
        sampleImage.onload = function() {
            console.log('✅ Public image loaded');
        };
        
    } else {
        console.log('ℹ️ No sample image for this task');
        sampleImageContainer.style.display = 'none';
    }
}

// ============ TRY LOAD IMAGE FROM MULTIPLE URLS ============
function tryLoadImage(urls, index) {
    if (index >= urls.length) {
        console.error('❌ All image URLs failed');
        const msg = document.getElementById('imageLoadingMsg');
        if (msg) {
            msg.textContent = '❌ Failed to load sample image';
            msg.style.color = '#ef4444';
        }
        setTimeout(() => {
            sampleImageContainer.style.display = 'none';
        }, 2000);
        return;
    }
    
    const imageUrl = urls[index];
    console.log(`🧪 Trying URL ${index + 1}/${urls.length}:`, imageUrl);
    
    fetch(imageUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log(`📡 Response status for URL ${index + 1}:`, response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Check content type
            const contentType = response.headers.get('content-type');
            console.log('📄 Content-Type:', contentType);
            
            if (contentType && contentType.startsWith('image/')) {
                return response.blob();
            } else {
                throw new Error('Response is not an image');
            }
        })
        .then(blob => {
            console.log('✅ Image blob received:', blob.size, 'bytes');
            
            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = function() {
                const base64data = reader.result;
                
                // Remove loading message
                const msg = document.getElementById('imageLoadingMsg');
                if (msg) msg.remove();
                
                // Display image
                sampleImage.src = base64data;
                sampleImage.style.display = 'block';
                sampleImage.alt = 'Sample task screenshot';
                
                console.log('✅ Sample image loaded successfully from URL', index + 1);
            };
            reader.onerror = function(err) {
                console.error('❌ FileReader error:', err);
                tryLoadImage(urls, index + 1); // Try next URL
            };
            reader.readAsDataURL(blob);
        })
        .catch(error => {
            console.error(`❌ URL ${index + 1} failed:`, error.message);
            console.error('Full error:', error);
            
            // Try next URL
            tryLoadImage(urls, index + 1);
        });
}

window.tryLoadImage = tryLoadImage;
// ============ POPULATE HANDLES DROPDOWN ============
function populateHandlesDropdown() {
    if (!handleDropdown) return;
    
    handleDropdown.innerHTML = '<option value="">-- Select your account --</option>';
    
    if (userHandles.length === 0) {
        handleDropdown.innerHTML += '<option value="no_handle">❌ No approved accounts found</option>';
        handleDropdown.disabled = true;
        
        if (startTaskBtn && !document.getElementById('activationBanner')) {
            startTaskBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Social Handle';
            startTaskBtn.onclick = () => window.location.href = 'social-media.html';
            startTaskBtn.classList.remove('btn-primary');
            startTaskBtn.classList.add('btn-secondary');
        }
        
        showToast(`Please add and get approval for your ${currentTask.category?.displayName} account first`, 'warning', 'No Approved Handles');
        
    } else {
        userHandles.forEach(handle => {
            const option = document.createElement('option');
            option.value = handle._id;
            option.textContent = handle.handle;
            handleDropdown.appendChild(option);
        });
        
        handleDropdown.disabled = false;
    }
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'info', title = '') {
    if (!toastContainer) return;
    
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

// ============ FILE UPLOAD ============
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error', 'Invalid File Type');
        screenshotFile.value = '';
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error', 'File Too Large');
        screenshotFile.value = '';
        return;
    }
    
    selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (imagePreview) imagePreview.src = e.target.result;
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
        if (fileUploadArea) fileUploadArea.style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    showToast('Screenshot uploaded', 'success');
}

window.handleFileSelect = handleFileSelect;

function removeImage() {
    selectedFile = null;
    if (imagePreview) imagePreview.src = '';
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    if (fileUploadArea) fileUploadArea.style.display = 'block';
    if (screenshotFile) screenshotFile.value = '';
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

// ============ START TASK ============
async function startTask() {
    const isActivated = await checkActivation();
    
    if (!isActivated) {
        showToast('Please activate your account first', 'warning', 'Activation Required');
        goToActivation();
        return;
    }
    
    if (userHandles.length === 0) {
        showToast('Please add an approved social media handle first', 'warning');
        return;
    }
    
    if (!taskStarted) {
        if (startTaskBtn) {
            startTaskBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Task in Progress...';
            startTaskBtn.disabled = true;
            startTaskBtn.classList.remove('btn-primary');
            startTaskBtn.classList.add('btn-secondary');
        }
        
        showToast('Task started! Complete and return to submit.', 'info', 'Task Started');
        
        if (currentTask.taskUrl) {
            window.open(currentTask.taskUrl, '_blank');
        }
        
        setTimeout(() => {
            taskStarted = true;
            if (startTaskBtn) {
                startTaskBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Task';
                startTaskBtn.disabled = false;
                startTaskBtn.classList.remove('btn-secondary');
                startTaskBtn.classList.add('btn-success');
                startTaskBtn.onclick = () => showModal('submitTaskModal');
            }
            
            showToast('Ready to submit!', 'success');
        }, 3000);
    }
}

window.startTask = startTask;

// ============ SUBMIT TASK - WITH BACKEND VALIDATION ============
// ============ SUBMIT TASK - WITH BACKEND VALIDATION ============
async function submitTask() {
    const selectedHandle = handleDropdown?.value;
    
    if (!selectedHandle || selectedHandle === 'no_handle') {
        showToast('Please select your social media account', 'error', 'Account Required');
        return;
    }
    
    const categoryName = currentTask.category?.name?.toLowerCase() || 'general';
    const taskTypeName = currentTask.taskType?.name?.toLowerCase() || 'task';
    const instructionKey = `${categoryName}-${taskTypeName}`;
    const instructions = taskInstructions[instructionKey] || taskInstructions['default'];
    
    // ✅ GYARA: Check screenshot ONLY if required
    if (instructions.screenshotRequired) {
        if (!selectedFile) {
            showToast('Please upload a screenshot', 'error', 'Screenshot Required');
            return;
        }
        
        if (!selectedFile.type.startsWith('image/')) {
            showToast('Please upload a valid image file', 'error', 'Invalid File');
            return;
        }
    }
    
    const taskNotes = document.getElementById('taskNotes')?.value || '';
    
    const formData = new FormData();
    formData.append('taskId', currentTask._id);
    formData.append('handleId', selectedHandle);
    formData.append('notes', taskNotes);
    
    // ✅ GYARA: Add screenshot ONLY if available
    if (selectedFile) {
        formData.append('screenshot', selectedFile);
    }
    
    const submitBtn = submitTaskButton;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }
    
    try {
        const response = await fetch(`${API_URL}/api/task-submissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            let errorData;
            
            if (contentType?.includes('application/json')) {
                errorData = await response.json();
            } else {
                const text = await response.text();
                errorData = { message: text || `Error ${response.status}` };
            }
            
            // ✅ CHECK FOR ACTIVATION ERROR FROM BACKEND
            if (errorData.code === 'ACTIVATION_REQUIRED' || errorData.activationRequired) {
                closeModal('submitTaskModal');
                showToast('Your account is not activated. Redirecting...', 'error', 'Activation Required');
                setTimeout(() => {
                    window.location.href = 'activation.html';
                }, 2000);
                return;
            }
            
            throw new Error(errorData.message || 'Failed to submit');
        }
        
        const result = await response.json();
        console.log('✅ Success:', result);
        
        closeModal('submitTaskModal');
        showToast('Task submitted successfully! Redirecting...', 'success', 'Success');
        
        setTimeout(() => {
            window.location.href = 'tasks.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error:', error);
        
        let errorMessage = error.message;
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server';
        } else if (error.message.includes('already submitted')) {
            errorMessage = 'You already submitted this task';
        }
        
        showToast(errorMessage, 'error', 'Submission Failed');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Task';
        }
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
        .catch(() => {});
    } else {
        navigator.clipboard.writeText(shareUrl)
            .then(() => showToast('Task link copied!', 'success'))
            .catch(() => showToast('Failed to copy link', 'error'));
    }
}

window.shareTask = shareTask;

// ============ SIDEBAR & THEME ============
function openSidebar() {
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const icon = document.getElementById('themeIcon');
    
    if (icon) {
        icon.classList.toggle('fa-moon', !isDark);
        icon.classList.toggle('fa-sun', isDark);
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
    }
}

/*function logout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }
}


window.logout = logout;*/

function copyTaskId() {
    const text = taskIdDisplay?.innerText;
    if (!text) {
        showToast('Task ID not found', 'error');
        return;
    }
    
    navigator.clipboard.writeText(text)
        .then(() => showToast('Task ID copied!', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
}

window.copyTaskId = copyTaskId;

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

// ============ FULLSCREEN IMAGE MODAL ============
function openImageFullscreen(imageSrc) {
    const modal = document.getElementById('imageFullscreenModal');
    const img = document.getElementById('fullscreenImage');
    
    if (modal && img) {
        img.src = imageSrc;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeImageFullscreen() {
    const modal = document.getElementById('imageFullscreenModal');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImageFullscreen();
    }
});

window.openImageFullscreen = openImageFullscreen;
window.closeImageFullscreen = closeImageFullscreen;
    window.logout = logout;
    
    
    // ✅ Setup logout modal
    setupLogoutModal();
// ============ INIT ============
async function init() {
    if (!checkAuth()) return;
    
    loadTheme();
    setupEventListeners();
    
    const taskId = getTaskIdFromURL();
    
    if (!taskId) {
        showToast('Invalid task ID', 'error');
        setTimeout(() => window.location.href = 'tasks.html', 2000);
        return;
    }
    
    await fetchTaskDetails(taskId);
}

// ============ LOGOUT ============
function logout() {
    showToast('Logging out...', 'info', 'Goodbye!');
    setTimeout(() => {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }, 500);
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

window.setupLogoutModal = setupLogoutModal;

window.addEventListener('DOMContentLoaded', init);
console.log('✅ Task Details JS - Final Production Version');
