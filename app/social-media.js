// ================================================
// EARNCIAL SOCIAL HANDLES (User Side - Final Fixed)
// File: social-medias.js
// ================================================

const API_URL = 'http://localhost:5000'; 
const overlay = document.getElementById('sidebarOverlay');
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// ============ VIDEO LINKS DATABASE (General Tutorials) ============
const VIDEOS = {
    GENERAL:    "https://www.youtube.com/watch?v=gama_gari", 
    TIKTOK:     "https://www.youtube.com/watch?v=9EDBqKLpm2Y",
    FACEBOOK:   "https://www.youtube.com/watch?v=facebook_video_id",
    INSTAGRAM:  "https://www.youtube.com/watch?v=instagram_video_id",
    TWITTER:    "https://www.youtube.com/watch?v=twitter_video_id",
    YOUTUBE:    "https://www.youtube.com/watch?v=youtube_video_id",
    WHATSAPP:   "https://www.youtube.com/watch?v=whatsapp_video_id",
    TELEGRAM:   "https://www.youtube.com/watch?v=telegram_video_id",
    LINKEDIN:   "https://www.youtube.com/watch?v=linkedin_video_id",
};

// ============ PLATFORM CONFIGURATIONS ============
const platformConfigs = {
    'Facebook': { label: 'Profile Link', hint: 'Enter your Facebook profile link', type: 'url', video: VIDEOS.FACEBOOK },
    'Instagram': { label: 'Username', hint: 'Enter your Instagram username (without @)', type: 'text', video: VIDEOS.INSTAGRAM },
    'X (Twitter)': { label: 'Username', hint: 'Enter your X/Twitter username (without @)', type: 'text', video: VIDEOS.TWITTER },
    'TikTok': { label: 'Username', hint: 'Enter your TikTok username (without @)', type: 'text', video: VIDEOS.TIKTOK },
    'YouTube': { label: 'Channel Handle', hint: 'Enter your YouTube channel handle (e.g. mychannel)', type: 'text', video: VIDEOS.YOUTUBE },
    'YouTube Music': { label: 'Handle', hint: 'Enter your YouTube Music handle', type: 'text', video: VIDEOS.YOUTUBE },
    'WhatsApp': { label: 'Phone Number', hint: 'Enter your WhatsApp number (e.g., 2348123456789)', type: 'tel', video: VIDEOS.WHATSAPP },
    'Telegram': { label: 'Username', hint: 'Enter your Telegram username (without @)', type: 'text', video: VIDEOS.TELEGRAM },
    'LinkedIn': { label: 'Profile Link', hint: 'Enter your LinkedIn profile link', type: 'url', video: VIDEOS.LINKEDIN },
    'Spotify': { label: 'Profile Link', hint: 'Enter your Spotify profile link', type: 'url', video: VIDEOS.GENERAL },
    'Applemusic': { label: 'Profile Link', hint: 'Enter your Apple Music profile link', type: 'url', video: VIDEOS.GENERAL },
    'Audiomack': { label: 'Username', hint: 'Enter your Audiomack username', type: 'text', video: VIDEOS.GENERAL },
    'Boomplay': { label: 'Profile Link', hint: 'Enter your Boomplay profile link', type: 'url', video: VIDEOS.GENERAL },
    'Playstore': { label: 'Email', hint: 'Enter your Google Play email', type: 'email', video: VIDEOS.GENERAL },
    'Appstore': { label: 'Email', hint: 'Enter your Apple ID email', type: 'email', video: VIDEOS.GENERAL },
    'Pinterest': { label: 'Username', hint: 'Enter your Pinterest username', type: 'text', video: VIDEOS.GENERAL },
    'Threads': { label: 'Username', hint: 'Enter your Threads username (without @)', type: 'text', video: VIDEOS.GENERAL },
    'Website': { label: 'Website/Email', hint: 'Enter your website URL or email', type: 'text', video: VIDEOS.GENERAL }
};

const platformIcons = {
    'Facebook': { icon: 'fab fa-facebook-f', class: 'icon-facebook' },
    'Instagram': { icon: 'fab fa-instagram', class: 'icon-instagram' },
    'X (Twitter)': { icon: 'fab fa-x-twitter', class: 'icon-twitter' },
    'TikTok': { icon: 'fab fa-tiktok', class: 'icon-tiktok' },
    'YouTube': { icon: 'fab fa-youtube', class: 'icon-youtube' },
    'WhatsApp': { icon: 'fab fa-whatsapp', class: 'icon-whatsapp' },
    'Telegram': { icon: 'fab fa-telegram-plane', class: 'icon-telegram' },
    'LinkedIn': { icon: 'fab fa-linkedin-in', class: 'icon-linkedin' },
    'Spotify': { icon: 'fab fa-spotify', class: 'icon-spotify' },
    'Applemusic': { icon: 'fas fa-music', class: 'icon-applemusic' },
    'Audiomack': { icon: 'fas fa-headphones', class: 'icon-audiomack' },
    'Boomplay': { icon: 'fas fa-play-circle', class: 'icon-boomplay' },
    'Playstore': { icon: 'fab fa-google-play', class: 'icon-playstore' },
    'Appstore': { icon: 'fab fa-apple', class: 'icon-appstore' },
    'Pinterest': { icon: 'fab fa-pinterest', class: 'icon-pinterest' },
    'Threads': { icon: 'fas fa-comment', class: 'icon-threads' },
    'Website': { icon: 'fas fa-globe', class: 'icon-website' }
};

// ============ DOM ELEMENTS ============
const handleForm = document.getElementById('handleForm');
const platformSelect = document.getElementById('platformSelect');
const handleInput = document.getElementById('handleInput');
const handleLabel = document.getElementById('handleLabel');
const handleHint = document.getElementById('handleHint');
const submitBtn = document.getElementById('submitBtn');
const handleId = document.getElementById('handleId');
const handlesBody = document.getElementById('handlesBody');
const modalTitleText = document.getElementById('modalTitleText');
const rejectionReason = document.getElementById('rejectionReason');
const videoContainer = document.getElementById('videoContainer');
const deleteHandleInfo = document.getElementById('deleteHandleInfo');
const usernameDisplay = document.getElementById('username');
const copyTextBtn = document.getElementById('copyText');

// Stats
const totalCount = document.getElementById('totalCount');
const approvedCount = document.getElementById('approvedCount');
const pendingCount = document.getElementById('pendingCount');
const rejectedCount = document.getElementById('rejectedCount');

// State
let handlesData = [];
let handleToDelete = null;
let isEditMode = false;

//HELPER FUNCTION EMBED VIDEO
function getEmbedUrl(url) {
    if (!url) return null;
    
    // Wannan regex din zai kamo ID koda link din na shorts ne ko na asali
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return null;
}

// ============ AUTH CHECK ============
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');
    if (!token || !userData) {
        window.location.href = 'sign-in.html';
        return false;
    }
    try {
        currentUser = JSON.parse(userData);
        if (usernameDisplay) usernameDisplay.textContent = currentUser.username;
        return true;
    } catch (e) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
        return false;
    }
}

// ============ CHANGE INPUT BASED ON PLATFORM ============
if (platformSelect) {
    platformSelect.addEventListener('change', function() {
        const platform = this.value;
        const config = platformConfigs[platform];

        if (config) {
            handleHint.textContent = config.hint;
            handleInput.type = config.type;
            handleInput.placeholder = `Enter your ${config.label.toLowerCase()}`;
            handleLabel.innerHTML = `<i class="fas fa-at"></i> ${config.label}`;
        } else {
            handleHint.textContent = 'Enter your handle/username';
            handleInput.type = 'text';
            handleInput.placeholder = 'Enter your handle';
            handleLabel.innerHTML = '<i class="fas fa-at"></i> Username/Handle';
        }
    });
}

// ============ OPEN TUTORIAL (SMART VIDEO) ============
function openTutorial() {
    const selectedPlatform = platformSelect ? platformSelect.value : null;
    let videoLink = VIDEOS.GENERAL;
    let titleText = "How to Link Account";

    if (selectedPlatform && platformConfigs[selectedPlatform] && platformConfigs[selectedPlatform].video) {
        videoLink = platformConfigs[selectedPlatform].video;
        titleText = `How to Link ${selectedPlatform}`;
    }

    const embedUrl = getEmbedUrl(videoLink);
    const frame = document.getElementById('tutorialFrame');
    const modalTitle = document.querySelector('#tutorialModal .modal-title');
    
    if (frame && embedUrl) {
        frame.src = embedUrl;
        if(modalTitle) modalTitle.innerHTML = `<i class="fab fa-youtube"></i> ${titleText}`;
        showModal('tutorialModal');
    } else {
        alert('Video not available yet.');
    }
}
window.openTutorial = openTutorial;

// ============ HANDLE FORM SUBMISSION ============
if (handleForm) {
    handleForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!currentUser) return alert('Please login');

        const platform = platformSelect.value;
        const handle = handleInput.value.trim();
        
        if (!platform || !handle) return alert('Please fill all fields');
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        try {
            const handleData = { platform, handle };
            let url = `${API_URL}/api/social-handles`;
            let method = 'POST';
            
            if (isEditMode && handleId.value) {
                url = `${API_URL}/api/social-handles/${handleId.value}`;
                method = 'PUT';
            }
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(handleData)
            });
            
            const result = await response.json();
            
            if (!response.ok) throw new Error(result.message || 'Failed to save');
            
            closeModal('handleModal');
            showModal('successAddModal');
            setTimeout(loadHandles, 1500);
            
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = isEditMode ? 
                '<i class="fas fa-save"></i> Update Handle' : 
                '<i class="fas fa-paper-plane"></i> Submit Handle';
        }
    });
}

// ============ RENDER HANDLES TABLE ============
function renderHandlesTable() {
    if (handlesData.length === 0) {
        handlesBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-link"></i>
                    <p>No social media handles added yet</p>
                    <button class="add-btn" onclick="openAddModal()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Add Your First Handle
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    handlesData.forEach((handle, index) => {
        const platformIcon = platformIcons[handle.platform] || { icon: 'fas fa-link', class: 'icon-default' };
        
        // --- DATE FORMAT FIX (Time Included) ---
        const formattedDate = new Date(handle.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        
        let statusClass = '', statusIcon = '', statusText = '';
        let clickAction = ''; // Action idan an taba status

        switch(handle.status.toLowerCase()) {
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
                // MUHIMMI: Amfani da ID maimakon strings don kaucewa errors
                clickAction = `onclick="openRejectionModal('${handle._id}')" style="cursor: pointer;" title="View Reason"`; 
                break;
        }
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="platform-cell">
                        <div class="platform-icon ${platformIcon.class}">
                            <i class="${platformIcon.icon}"></i>
                        </div>
                        <span>${handle.platform}</span>
                    </div>
                </td>
                <td><strong>${handle.handle}</strong></td>
                <td>
                    <span class="status-badge ${statusClass}" ${clickAction}>
                        ${statusIcon} ${statusText}
                    </span>
                </td>
                <td style="font-size:13px;">${formattedDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick='editHandle(${JSON.stringify(handle)})'><i class="fas fa-edit"></i> Edit</button>
                        <button class="btn-delete" onclick='showDeleteConfirm(${JSON.stringify(handle)})'><i class="fas fa-trash"></i> Delete</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    handlesBody.innerHTML = html;
}



// ============ OPEN REJECTION MODAL (FIXED & DEBUGGING) ============
function openRejectionModal(handleId) {
    // 1. Nemo handle daga cikin data da muke da ita
    const handle = handlesData.find(h => h._id === handleId);
    
    // 🔴 DEBUGGING: Bude Console (F12) ka duba wannan layin idan ka taba Reject
    console.log("🔎 HANDLE DATA FROM DB:", handle);

    if (!handle) return;

    // 2. Dauko bayanai (Muna duba duka sunayen da ka iya yiwuwa)
    const reason = handle.rejectionReason || 'No specific reason provided.';
    
    // ANAN NE MATSALAR TAKE: Muna duba ko wanne irin suna
    const rawLink = handle.videoLink || handle.videoUrl || handle.link || '';
    
    console.log("🎥 RAW VIDEO LINK:", rawLink); // Duba ko link din ya fito nan

    // 3. Set Content
    const reasonEl = document.getElementById('rejectionReason');
    const iframe = document.getElementById('rejectionVideoFrame');
    const vidContainer = document.getElementById('videoContainer');

    if (reasonEl) reasonEl.textContent = reason;

    // 4. Handle Video Embed
    if (rawLink && vidContainer) {
        // Convert to Embed URL
        const embedUrl = getEmbedUrl(rawLink);
        
        console.log("🔗 CONVERTED EMBED URL:", embedUrl); // Duba ko ya canzu zuwa embed

        if (embedUrl) {
            vidContainer.style.display = 'block';
            if (iframe) iframe.src = embedUrl;
        } else {
            console.warn("⚠️ Invalid YouTube Link format");
            vidContainer.style.display = 'none';
        }
    } else if (vidContainer) {
        // Idan babu link gaba daya
        vidContainer.style.display = 'none';
        if (iframe) iframe.src = '';
    }

    // 5. Show Modal
    showModal('rejectionModal');
}

window.openRejectionModal = openRejectionModal; // Make Global

// ============ LOAD DATA ============
async function loadHandles() {
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_URL}/api/social-handles/my-handles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        handlesData = data.handles || [];
        
        updateStats(
            handlesData.length,
            handlesData.filter(h => h.status === 'approved').length,
            handlesData.filter(h => h.status === 'pending').length,
            handlesData.filter(h => h.status === 'rejected').length
        );
        renderHandlesTable();
        
    } catch (error) {
        handlesBody.innerHTML = `<tr><td colspan="6" class="empty-state">Error loading data</td></tr>`;
    }
}

// ============ STANDARD UI FUNCTIONS ============
function updateStats(total, approved, pending, rejected) {
    if(totalCount) totalCount.textContent = total;
    if(approvedCount) approvedCount.textContent = approved;
    if(pendingCount) pendingCount.textContent = pending;
    if(rejectedCount) rejectedCount.textContent = rejected;
}

function openAddModal() {
    isEditMode = false;
    modalTitleText.textContent = 'Add Social Media Handle';
    handleId.value = '';
    handleForm.reset();
    handleHint.textContent = 'Select a platform first';
    handleLabel.innerHTML = '<i class="fas fa-at"></i> Username/Handle';
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Handle';
    stopVideo('tutorialFrame'); 
    showModal('handleModal');
}

function editHandle(handle) {
    isEditMode = true;
    modalTitleText.textContent = 'Edit Social Media Handle';
    handleId.value = handle._id;
    platformSelect.value = handle.platform;
    platformSelect.dispatchEvent(new Event('change'));
    handleInput.value = handle.handle;
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Handle';
    showModal('handleModal');
}

function showDeleteConfirm(handle) {
    handleToDelete = handle;
    if(deleteHandleInfo) deleteHandleInfo.textContent = `${handle.platform}: ${handle.handle}`;
    showModal('confirmDeleteModal');
}

async function confirmDelete() {
    if (!handleToDelete) return;
    try {
        await fetch(`${API_URL}/api/social-handles/${handleToDelete._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        closeModal('confirmDeleteModal');
        showModal('successDeleteModal');
        setTimeout(loadHandles, 1500);
    } catch (error) { alert('Error deleting handle'); }
}

function stopVideo(frameId) {
    const iframe = document.getElementById(frameId);
    if (iframe) {
        const src = iframe.src;
        iframe.src = ''; 
        iframe.src = src; 
    }
}

window.showModal = (id) => { 
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
};
window.closeModal = (id) => { 
    document.getElementById(id).style.display = 'none'; 
    document.body.style.overflow = 'auto';
    if (id === 'rejectionModal') stopVideo('rejectionVideoFrame');
    if (id === 'tutorialModal') stopVideo('tutorialFrame');
};

if (copyTextBtn) {
    copyTextBtn.addEventListener('click', () => {
        const text = `Earncial verification: ${currentUser?.username}`;
        navigator.clipboard.writeText(text);
        alert('Bio text copied! Please go and paste it on your bio.');
    });
}

// Sidebar & Theme
function openSidebar() { sidebar.classList.add('active'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeSidebar() { sidebar.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow = 'auto'; }
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    loadTheme();
}
window.toggleTheme = toggleTheme;

function loadTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    if(isDark) document.body.classList.add('dark-mode');
    if(themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Init
async function init() {
    if (checkAuth()) {
        loadTheme();
        loadHandles();
    }
}
window.addEventListener('DOMContentLoaded', init);
// ============================================================
// NEW FEATURES ADDED
// ============================================================

// ============================================================
// LOGOUT MODAL
// ============================================================
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

// ============================================================
// RENDER BAR CHART - Social Handles Status
// ============================================================
let handlesChart = null;

function renderHandlesChart() {
    console.log('renderHandlesChart called');
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }
    
    const ctx = document.getElementById('handlesChart');
    if (!ctx) {
        console.error('Canvas #handlesChart not found');
        return;
    }
    
    try {
        // ✅ COUNT FROM DOM - handles already displayed in table!
        const pendingRows = document.querySelectorAll('tbody tr .status-badge.pending, tbody tr .status-badge.status-pending');
        const approvedRows = document.querySelectorAll('tbody tr .status-badge.approved, tbody tr .status-badge.status-approved');
        const rejectedRows = document.querySelectorAll('tbody tr .status-badge.rejected, tbody tr .status-badge.status-rejected');
        
        const pending = pendingRows.length;
        const approved = approvedRows.length;
        const rejected = rejectedRows.length;
        
        console.log('Handles stats (from DOM):', { pending, approved, rejected });
        
        const chartData = {
            labels: ['Pending', 'Approved', 'Rejected'],
            datasets: [{
                label: 'Social Handles',
                data: [pending, approved, rejected],
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgb(245, 158, 11)',
                    'rgb(16, 185, 129)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 60
            }]
        };
        
        // Destroy existing chart
        if (handlesChart) {
            handlesChart.destroy();
        }
        
        // Create bar chart
        handlesChart = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y || 0;
                                const total = pending + approved + rejected;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: { size: 12 }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 13, weight: 'bold' }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
        
        console.log('Bar chart created successfully');
        
    } catch (error) {
        console.error('Error creating handles chart:', error);
    }
}

// ============================================================
// HOOK INTO EXISTING INIT - No wrapper needed!
// ============================================================
window.addEventListener('DOMContentLoaded', function() {
    // Let original init run first
    setTimeout(() => {
        console.log('Setting up new features...');
        
        // Setup logout modal
        setupLogoutModal();
        
        // Render chart using ALREADY LOADED data
        if (typeof Chart !== 'undefined') {
            renderHandlesChart();
        } else {
            console.error('Chart.js not loaded');
        }
    }, 1500); // Give loadHandles() time to complete
});

// Export to window
window.renderHandlesChart = renderHandlesChart;
window.setupLogoutModal = setupLogoutModal;
