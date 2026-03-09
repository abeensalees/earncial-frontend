// ================================================
// EARNCIAL - ADMIN NOTIFICATIONS MANAGER (FINAL)
// Username Input + Logo Preview + Complete Features
// ================================================

const API_URL = 'http://localhost:5000';
const LOGO_URL = '/logo.png'; // Change this to your actual logo path
let authToken = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

// ============ GLOBAL STATE ============
let allHistory = [];
let filteredHistory = [];

// ============ CHECK AUTH ============
if (!authToken) {
    alert('Please login first');
    window.location.href = 'sign-in.html';
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Professional Notifications Manager...');
    
    loadTheme();
    loadStats();
    loadHistory();
    setupLivePreview();
    setupLogoPreview();
    
    showToast('info', 'Welcome Admin', 'Notifications manager ready');
});

// ============ SETUP LOGO PREVIEW ============
function setupLogoPreview() {
    const iconContainer = document.getElementById('previewIconContainer');
    const img = new Image();
    
    img.onload = function() {
        // Logo loaded successfully
        iconContainer.innerHTML = '<img src="' + LOGO_URL + '" alt="Logo">';
        console.log('✅ Logo loaded for preview');
    };
    
    img.onerror = function() {
        // Logo failed to load, keep icon
        console.log('ℹ️ Logo not found, using fallback icon');
    };
    
    img.src = LOGO_URL;
}

// ============ HANDLE RECIPIENT TYPE CHANGE ============
function handleRecipientTypeChange() {
    const type = document.getElementById('recipientType').value;
    const usernameGroup = document.getElementById('usernameInputGroup');
    const sendBtn = document.getElementById('sendButtonText');
    
    if (type === 'specific') {
        usernameGroup.style.display = 'block';
        sendBtn.textContent = 'Send to User';
    } else {
        usernameGroup.style.display = 'none';
        document.getElementById('usernameInput').value = '';
        
        if (type === 'all') {
            sendBtn.textContent = 'Send to All Users';
        } else if (type === 'earners') {
            sendBtn.textContent = 'Send to Earners';
        } else if (type === 'advertisers') {
            sendBtn.textContent = 'Send to Advertisers';
        }
    }
}

// ============ LOAD STATS ============
function loadStats() {
    console.log('📊 Loading stats...');
    
    fetch(API_URL + '/api/admin/broadcast/stats', {
        headers: { 'Authorization': 'Bearer ' + authToken }
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json();
    })
    .then(function(data) {
        if (data.success) {
            document.getElementById('totalUsersWithNotif').textContent = data.stats.totalUsers || 0;
            document.getElementById('totalEarnersWithNotif').textContent = data.stats.totalEarners || 0;
            document.getElementById('totalAdvertisersWithNotif').textContent = data.stats.totalAdvertisers || 0;
            document.getElementById('totalBroadcasts').textContent = data.stats.totalBroadcasts || 0;
        }
    })
    .catch(function(err) {
        console.error('❌ Load stats error:', err);
        // Set default values
        document.getElementById('totalUsersWithNotif').textContent = '0';
        document.getElementById('totalEarnersWithNotif').textContent = '0';
        document.getElementById('totalAdvertisersWithNotif').textContent = '0';
        document.getElementById('totalBroadcasts').textContent = '0';
    });
}

// ============ SEND BROADCAST ============
function sendBroadcast() {
    const type = document.getElementById('recipientType').value;
    const title = document.getElementById('notificationTitle').value.trim();
    const body = document.getElementById('notificationBody').value.trim();
    const url = document.getElementById('notificationUrl').value.trim();
    const username = document.getElementById('usernameInput').value.trim();
    
    // Validation
    if (!title || !body) {
        showToast('error', 'Error', 'Title and message are required');
        return;
    }
    
    if (type === 'specific' && !username) {
        showToast('error', 'Error', 'Please enter username');
        return;
    }
    
    // Determine endpoint
    let endpoint = '';
    let requestBody = { title: title, body: body, url: url || '/dashboard' };
    let confirmMsg = '';
    
    if (type === 'all') {
        endpoint = '/api/admin/broadcast/all';
        confirmMsg = 'Send notification to ALL users?';
    } else if (type === 'earners') {
        endpoint = '/api/admin/broadcast/earners';
        confirmMsg = 'Send notification to ALL earners?';
    } else if (type === 'advertisers') {
        endpoint = '/api/admin/broadcast/advertisers';
        confirmMsg = 'Send notification to ALL advertisers?';
    } else if (type === 'specific') {
        endpoint = '/api/admin/broadcast/user';
        requestBody.username = username;
        confirmMsg = 'Send notification to user @' + username + '?';
    }
    
    // Confirm
    if (!confirm(confirmMsg + '\n\nTitle: ' + title + '\nMessage: ' + body)) {
        return;
    }
    
    console.log('📤 Sending broadcast:', type, requestBody);
    
    // Send request
    fetch(API_URL + endpoint, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    })
    .then(function(res) {
        if (!res.ok) {
            return res.json().then(function(err) { 
                throw new Error(err.message || 'Failed to send'); 
            });
        }
        return res.json();
    })
    .then(function(data) {
        showToast('success', 'Sent!', data.message || 'Notification sent successfully');
        
        // Clear form
        document.getElementById('notificationTitle').value = '';
        document.getElementById('notificationBody').value = '';
        document.getElementById('usernameInput').value = '';
        
        // Reload stats and history
        loadStats();
        loadHistory();
    })
    .catch(function(err) {
        showToast('error', 'Error', err.message);
    });
}

// ============ LOAD HISTORY ============
function loadHistory() {
    console.log('📜 Loading broadcast history...');
    
    fetch(API_URL + '/api/admin/broadcast/history', {
        headers: { 'Authorization': 'Bearer ' + authToken }
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Failed to load history');
        return res.json();
    })
    .then(function(data) {
        allHistory = data.history || data || [];
        filteredHistory = allHistory.slice();
        
        console.log('✅ Loaded history:', allHistory.length);
        renderHistory();
    })
    .catch(function(err) {
        console.error('❌ Load history error:', err);
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No broadcast history found</td></tr>';
    });
}

// ============ RENDER HISTORY ============
function renderHistory() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    if (filteredHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No broadcasts found</td></tr>';
        return;
    }

    filteredHistory.forEach(function(broadcast, index) {
        const row = document.createElement('tr');
        
        let typeBadge = '';
        let typeText = '';
        
        if (broadcast.type === 'all-users') {
            typeBadge = 'badge-all';
            typeText = 'ALL USERS';
        } else if (broadcast.type === 'earners') {
            typeBadge = 'badge-earners';
            typeText = 'EARNERS';
        } else if (broadcast.type === 'advertisers') {
            typeBadge = 'badge-advertisers';
            typeText = 'ADVERTISERS';
        } else {
            typeBadge = 'badge-user';
            typeText = 'SPECIFIC';
        }
        
        const recipients = broadcast.recipientCount || broadcast.recipients || 'N/A';
        const messagePreview = broadcast.body.length > 50 
            ? broadcast.body.substring(0, 50) + '...' 
            : broadcast.body;
        
        row.innerHTML = 
            '<td>' + (index + 1) + '</td>' +
            '<td><span class="badge ' + typeBadge + '">' + typeText + '</span></td>' +
            '<td><strong>' + broadcast.title + '</strong></td>' +
            '<td>' + messagePreview + '</td>' +
            '<td>' + recipients + '</td>' +
            '<td>' + formatDate(broadcast.createdAt) + '</td>' +
            '<td>' +
                '<button class="btn-delete" onclick="deleteHistory(\'' + broadcast._id + '\')">' +
                    '<i class="fas fa-trash"></i>' +
                '</button>' +
            '</td>';
        
        tbody.appendChild(row);
    });
}

// ============ APPLY HISTORY FILTERS ============
function applyHistoryFilters() {
    const type = document.getElementById('filterType').value;
    const search = document.getElementById('searchHistory').value.toLowerCase();

    filteredHistory = allHistory.slice();

    if (type !== 'all') {
        filteredHistory = filteredHistory.filter(function(b) { 
            return b.type === type; 
        });
    }

    if (search) {
        filteredHistory = filteredHistory.filter(function(b) {
            return b.title.toLowerCase().includes(search) ||
                   b.body.toLowerCase().includes(search);
        });
    }

    renderHistory();
}

// ============ DELETE HISTORY ============
function deleteHistory(historyId) {
    if (!confirm('Delete this broadcast from history?')) return;

    fetch(API_URL + '/api/admin/broadcast/history/' + historyId, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + authToken }
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Failed to delete history');
        return res.json();
    })
    .then(function(data) {
        showToast('success', 'Deleted', 'Broadcast history deleted');
        loadHistory();
        loadStats();
    })
    .catch(function(err) {
        showToast('error', 'Error', err.message);
    });
}

// ============ LIVE PREVIEW ============
function setupLivePreview() {
    const titleInput = document.getElementById('notificationTitle');
    const bodyInput = document.getElementById('notificationBody');
    
    if (titleInput) {
        titleInput.addEventListener('input', function(e) {
            const preview = document.getElementById('previewTitle');
            if (preview) {
                preview.textContent = e.target.value || 'Notification Title';
            }
        });
    }
    
    if (bodyInput) {
        bodyInput.addEventListener('input', function(e) {
            const preview = document.getElementById('previewBody');
            if (preview) {
                preview.textContent = e.target.value || 'Your message will appear here...';
            }
        });
    }
}

// ============ FORMAT DATE ============
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============ SIDEBAR FUNCTIONS ============
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============ THEME TOGGLE ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('#themeToggle i');
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('admin_theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('admin_theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('admin_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = 'fas fa-sun';
        }
    }
}

// ============ TOAST NOTIFICATION ============
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'times-circle' : 
                 'info-circle';
    
    toast.innerHTML = '<i class="fas fa-' + icon + '"></i>' +
        '<div>' +
            '<strong>' + title + '</strong>' +
            '<p style="margin:0;font-size:13px;color:var(--text-muted);">' + message + '</p>' +
        '</div>';
    
    container.appendChild(toast);

    setTimeout(function() {
        toast.style.opacity = '0';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 4000);
}

console.log('✅ Admin Notifications Manager Loaded - FINAL VERSION!');