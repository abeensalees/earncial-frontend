
// ================================================
// TUTORIALS MANAGEMENT - COMPLETE JAVASCRIPT
// ================================================

const API_URL = 'http://localhost:5000'; // ✅ CANJA zuwa ainihin backend URL ɗinka
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// All tutorials data
let allTutorials = [];
let editingVideoId = null;

// Platform icons mapping
const PLATFORM_ICONS = {
    'Facebook': 'facebook-f',
    'Instagram': 'instagram',
    'X (Twitter)': 'x-twitter',
    'TikTok': 'tiktok',
    'YouTube': 'youtube',
    'WhatsApp': 'whatsapp',
    'Telegram': 'telegram',
    'LinkedIn': 'linkedin'
};

// ================= CHECK AUTH =================
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        showToast('error', 'Authentication Required', 'Please login first');
        setTimeout(() => {
            window.location.href = '../sign-in.html';
        }, 1500);
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        console.log('✅ Auth check passed:', currentUser.username);
        return true;
    } catch (e) {
        console.error('❌ Invalid user data:', e);
        localStorage.clear();
        window.location.href = '../sign-in.html';
        return false;
    }
}

// ================= LOAD ALL TUTORIALS =================
async function loadTutorials() {
    try {
        showLoadingState();

        const res = await fetch(`${API_URL}/api/tutorials`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                showToast('error', 'Session Expired', 'Please login again');
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = '../sign-in.html';
                }, 2000);
                return;
            }
            throw new Error('Failed to load tutorials');
        }

        const data = await res.json();

        if (data.success) {
            allTutorials = data.tutorials || [];
            renderTutorials();
            updateStats();
            console.log('✅ Loaded', allTutorials.length, 'tutorials');
        }
    } catch (err) {
        console.error('❌ Load tutorials error:', err);
        showToast('error', 'Error', 'Failed to load tutorials');
        allTutorials = [];
        renderTutorials();
    }
}

// ================= RENDER TUTORIALS TABLE =================
function renderTutorials() {
    const tbody = document.getElementById('tutorialsTableBody');
    const filterPlatform = document.getElementById('filterPlatform').value;

    if (!tbody) return;

    // Filter by platform/category
    let filtered = allTutorials;
    if (filterPlatform !== 'all') {
        filtered = allTutorials.filter(t => t.platform === filterPlatform);
    }

    // Empty state
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted);">
                    <i class="fas fa-video" style="font-size:48px; margin-bottom:15px; opacity:0.3;"></i>
                    <p style="font-size:16px;">No videos found${filterPlatform !== 'all' ? ' for this category' : ''}</p>
                </td>
            </tr>
        `;
        return;
    }

    // Render rows
    tbody.innerHTML = filtered.map((tutorial, index) => {
        const platformClass = tutorial.platform.toLowerCase().split(' ')[0].replace('(', '').replace(')', '');
        const icon = PLATFORM_ICONS[tutorial.platform] || 'link';

        return `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td>
                    <div class="platform-badge">
                        <div class="platform-icon icon-${platformClass}">
                            <i class="fab fa-${icon}"></i>
                        </div>
                        ${tutorial.platform}
                    </div>
                </td>
                <td><strong>${tutorial.title}</strong></td>
                <td>
                    <span class="url-text" title="${tutorial.videoUrl}">${tutorial.videoUrl}</span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action btn-preview" onclick="previewVideo('${tutorial.videoUrl}')" title="Play Video">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn-action btn-copy" onclick="copyLink('${tutorial.videoUrl}')" title="Copy Link">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="editVideo('${tutorial._id}')" title="Edit">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteVideo('${tutorial._id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ================= UPDATE STATISTICS =================
function updateStats() {
    document.getElementById('totalVideos').textContent = allTutorials.length;

    // Count unique categories
    const categories = new Set(allTutorials.map(t => t.platform));
    document.getElementById('totalCategories').textContent = categories.size;

    // Last added
    if (allTutorials.length > 0) {
        const lastVideo = allTutorials[allTutorials.length - 1];
        document.getElementById('lastAdded').textContent = lastVideo.title.substring(0, 25) + '...';
    } else {
        document.getElementById('lastAdded').textContent = '-';
    }
}

// ================= PREVIEW VIDEO =================
function previewVideo(url) {
    let embedUrl = url;

    // Convert YouTube watch URLs to embed URLs
    const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(youtubeRegex);

    if (match && match[2].length === 11) {
        embedUrl = `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }

    document.getElementById('previewIframe').src = embedUrl;
    openModal('previewModal');
}

function closePreview() {
    document.getElementById('previewIframe').src = ''; // Stop video
    closeModal('previewModal');
}

// ================= COPY LINK =================
function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('success', 'Copied!', 'Video link copied to clipboard');
    }).catch(err => {
        console.error('❌ Copy error:', err);
        showToast('error', 'Error', 'Failed to copy link');
    });
}

// ================= OPEN ADD MODAL =================
function openEditModal() {
    editingVideoId = null;
    document.getElementById('modalTitle').textContent = 'Add New Video';
    document.getElementById('videoId').value = '';
    document.getElementById('videoPlatform').value = 'Facebook';
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoUrl').value = '';
    openModal('editModal');
}

// ================= EDIT VIDEO =================
function editVideo(id) {
    const video = allTutorials.find(t => t._id === id);

    if (!video) {
        showToast('error', 'Error', 'Video not found');
        return;
    }

    editingVideoId = id;
    document.getElementById('modalTitle').textContent = 'Edit Video';
    document.getElementById('videoId').value = video._id;
    document.getElementById('videoPlatform').value = video.platform;
    document.getElementById('videoTitle').value = video.title;
    document.getElementById('videoUrl').value = video.videoUrl;
    openModal('editModal');
}

// ================= SAVE VIDEO =================
async function saveVideo() {
    const platform = document.getElementById('videoPlatform').value;
    const title = document.getElementById('videoTitle').value.trim();
    const videoUrl = document.getElementById('videoUrl').value.trim();

    // Validation
    if (!title) {
        showToast('error', 'Validation Error', 'Please enter video title');
        return;
    }

    if (!videoUrl) {
        showToast('error', 'Validation Error', 'Please enter video URL');
        return;
    }

    // Basic URL validation
    try {
        new URL(videoUrl);
    } catch (e) {
        showToast('error', 'Invalid URL', 'Please enter a valid video URL');
        return;
    }

    try {
        const method = editingVideoId ? 'PUT' : 'POST';
        const endpoint = editingVideoId 
            ? `${API_URL}/api/tutorials/${editingVideoId}` 
            : `${API_URL}/api/tutorials`;

        const res = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ platform, title, videoUrl })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to save video');
        }

        showToast('success', editingVideoId ? 'Updated' : 'Added', data.message);
        closeModal('editModal');
        await loadTutorials();

    } catch (err) {
        console.error('❌ Save video error:', err);
        showToast('error', 'Error', err.message || 'Failed to save video');
    }
}

// ================= DELETE VIDEO =================
async function deleteVideo(id) {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/tutorials/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to delete video');
        }

        showToast('success', 'Deleted', 'Video removed successfully');
        await loadTutorials();

    } catch (err) {
        console.error('❌ Delete video error:', err);
        showToast('error', 'Error', err.message || 'Failed to delete video');
    }
}

// ================= MODAL FUNCTIONS =================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        if (e.target.id === 'previewModal') {
            closePreview();
        } else {
            closeModal(e.target.id);
        }
    }
});

// ================= SIDEBAR FUNCTIONS =================
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ================= THEME TOGGLE =================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.theme-toggle i');
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('.theme-toggle i');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// ================= TOAST NOTIFICATION =================
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'check-circle' : 'times-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div>
            <strong>${title}</strong>
            <p style="margin:0; font-size:13px; color:var(--text-muted);">${message}</p>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ================= LOADING STATE =================
function showLoadingState() {
    const tbody = document.getElementById('tutorialsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size:32px; color:var(--primary);"></i>
                    <p style="margin-top:15px; color:var(--text-muted);">Loading videos...</p>
                </td>
            </tr>
        `;
    }
}

// ================= INITIALIZATION =================
async function init() {
    console.log('🚀 Initializing Tutorials Management...');

    if (!checkAuth()) return;

    loadTheme();

    try {
        await loadTutorials();

        console.log('✅ Tutorials Management Loaded Successfully');
        showToast('success', 'Welcome', `Dashboard loaded successfully, ${currentUser.username}!`);

    } catch (err) {
        console.error('❌ Initialization error:', err);
        showToast('error', 'Error', 'Failed to load dashboard');
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}