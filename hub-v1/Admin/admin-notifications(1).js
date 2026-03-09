// ================================================
// EARNCIAL - ADMIN NOTIFICATIONS MANAGER
// ================================================

const API_URL = 'http://localhost:5000';
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
    console.log('🚀 Initializing Notifications Manager...');
    
    loadTheme();
    loadStats();
    loadHistory();
    setupLivePreview();
    
    showToast('info', 'Welcome Admin', 'Notifications manager ready');
});

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

// ============ BROADCAST TO ALL ============
function broadcastToAll() {
    const title = document.getElementById('titleAll').value.trim();
    const body = document.getElementById('bodyAll').value.trim();
    const url = document.getElementById('urlAll').value.trim();

    if (!title || !body) {
        showToast('error', 'Error', 'Title and message are required');
        return;
    }

    if (!confirm('Send notification to ALL users?\n\nTitle: ' + title + '\nMessage: ' + body)) {
        return;
    }

    fetch(API_URL + '/api/admin/broadcast/all', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title, body: body, url: url })
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
        showToast('success', 'Sent!', data.message || 'Notification sent to all users');
        document.getElementById('titleAll').value = '';
        document.getElementById('bodyAll').value = '';
        loadStats();
        loadHistory();
    })
    .catch(function(err) {
        showToast('error', 'Error', err.message);
    });
}

// ============ BROADCAST TO EARNERS ============
function broadcastToEarners() {
    const title = document.getElementById('titleEarners').value.trim();
    const body = document.getElementById('bodyEarners').value.trim();
    const url = document.getElementById('urlEarners').value.trim();

    if (!title || !body) {
        showToast('error', 'Error', 'Title and message are required');
        return;
    }

    if (!confirm('Send notification to ALL EARNERS?\n\nTitle: ' + title + '\nMessage: ' + body)) {
        return;
    }

    fetch(API_URL + '/api/admin/broadcast/earners', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title, body: body, url: url })
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
        showToast('success', 'Sent!', data.message || 'Notification sent to earners');
        document.getElementById('titleEarners').value = '';
        document.getElementById('bodyEarners').value = '';
        loadStats();
        loadHistory();
    })
    .catch(function(err) {
        showToast('error', 'Error', err.message);
    });
}

// ============ BROADCAST TO ADVERTISERS ============
function broadcastToAdvertisers() {
    const title = document.getElementById('titleAdvertisers').value.trim();
    const body = document.getElementById('bodyAdvertisers').value.trim();
    const url = document.getElementById('urlAdvertisers').value.trim();

    if (!title || !body) {
        showToast('error', 'Error', 'Title and message are required');
        return;
    }

    if (!confirm('Send notification to ALL ADVERTISERS?\n\nTitle: ' + title + '\nMessage: ' + body)) {
        return;
    }

    fetch(API_URL + '/api/admin/broadcast/advertisers', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: title, body: body, url: url })
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
        showToast('success', 'Sent!', data.message || 'Notification sent to advertisers');
        document.getElementById('titleAdvertisers').value = '';
        document.getElementById('bodyAdvertisers').value = '';
        loadStats();
        loadHistory();
    })
    .catch(function(err) {
        showToast('error', 'Error', err.message);
    });
}

// ============ SEND TO SPECIFIC USER ============
function sendToUser() {
    const userId = document.getElementById('specificUserId').value.trim();
    const title = document.getElementById('titleUser').value.trim();
    const body = document.getElementById('bodyUser').value.trim();
    const url = document.getElementById('urlUser').value.trim();

    if (!userId || !title || !body) {
        showToast('error', 'Error', 'All fields are required');
        return;
    }

    fetch(API_URL + '/api/admin/broadcast/user', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + authToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userId, title: title, body: body, url: url })
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
        showToast('success', 'Sent!', 'Notification sent to user');
        document.getElementById('specificUserId').value = '';
        document.getElementById('titleUser').value = '';
        document.getElementById('bodyUser').value = '';
        loadStats();
        loadHistory();
    })
    .catch(function(err) {
        showToast('error', 'Error', err.message);
    });
}

// ============ LIVE PREVIEW ============
function setupLivePreview() {
    const titleInput = document.getElementById('titleAll');
    const bodyInput = document.getElementById('bodyAll');
    
    if (titleInput) {
        titleInput.addEventListener('input', function(e) {
            const preview = document.getElementById('previewTitleAll');
            if (preview) {
                preview.textContent = e.target.value || 'Notification Title';
            }
        });
    }
    
    if (bodyInput) {
        bodyInput.addEventListener('input', function(e) {
            const preview = document.getElementById('previewBodyAll');
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

console.log('✅ Admin Notifications Manager Loaded!');