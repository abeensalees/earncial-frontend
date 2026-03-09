// ================================================================
// EARNCIAL - MY TICKETS (TABLE VERSION)
// With full-page WhatsApp chat modal
// ================================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

// Global state
let allTickets = [];
let filteredTickets = [];
let currentTicket = null;
let currentPage = 1;
let limit = 10;
let totalPages = 1;

// ================================================================
//  INITIALIZATION
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    if (!token) {
        showToast('Please login to view tickets', 'error');
        setTimeout(function() {
            window.location.href = 'sign-in.html';
        }, 2000);
        return;
    }

    loadTheme();
    loadTickets();
});

// ================================================================
//  LOAD TICKETS FROM API
// ================================================================
function loadTickets() {
    fetch(API_URL + '/api/support/my-tickets', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Failed to load tickets');
        return res.json();
    })
    .then(function(data) {
        if (data.success) {
            allTickets = data.tickets || [];
            filteredTickets = allTickets;
            updateStats();
            renderTable();
        }
    })
    .catch(function(err) {
        console.error('Load tickets error:', err);
        showToast('Failed to load tickets', 'error');
        
        document.getElementById('ticketsTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger);">Failed to load tickets</td></tr>';
    });
}

// ================================================================
//  UPDATE STATS CARDS
// ================================================================
function updateStats() {
    var total = allTickets.length;
    var open = allTickets.filter(function(t) { return t.status === 'open'; }).length;
    var replied = allTickets.filter(function(t) { return t.status === 'replied'; }).length;
    var closed = allTickets.filter(function(t) { return t.status === 'closed'; }).length;
    
    var ratedTickets = allTickets.filter(function(t) { return t.rating; });
    var avgRating = 0;
    if (ratedTickets.length > 0) {
        var sum = ratedTickets.reduce(function(acc, t) { return acc + t.rating; }, 0);
        avgRating = (sum / ratedTickets.length).toFixed(1);
    }

    document.getElementById('totalTickets').textContent = total;
    document.getElementById('openTickets').textContent = open;
    document.getElementById('repliedTickets').textContent = replied;
    document.getElementById('closedTickets').textContent = closed;
    document.getElementById('avgRating').textContent = avgRating || '—';
}

// ================================================================
//  RENDER TABLE
// ================================================================
function renderTable() {
    var tbody = document.getElementById('ticketsTableBody');
    
    if (filteredTickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">'
            + '<i class="fas fa-inbox" style="font-size:48px;margin-bottom:12px;display:block;opacity:0.3;"></i>'
            + 'No tickets found'
            + '</td></tr>';
        
        updatePagination(0);
        return;
    }

    // Pagination
    var start = (currentPage - 1) * limit;
    var end = start + limit;
    var paginatedTickets = filteredTickets.slice(start, end);
    totalPages = Math.ceil(filteredTickets.length / limit);

    tbody.innerHTML = paginatedTickets.map(function(ticket, index) {
        var sn = start + index + 1;
        var statusClass = ticket.status;
        var statusLabel = ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1);
        var datetime = formatDateTime(ticket.createdAt);

        return '<tr>'
            + '<td>' + sn + '</td>'
            + '<td><span class="ticket-id" onclick="copyText(\'' + ticket.ticketId + '\')">' + ticket.ticketId + '</span></td>'
            + '<td><div class="ticket-subject">' + escapeHtml(ticket.subject) + '</div></td>'
            + '<td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td>'
            + '<td>' + datetime + '</td>'
            + '<td><button class="btn-view" onclick="viewTicket(\'' + ticket.ticketId + '\')"><i class="fas fa-eye"></i> View</button></td>'
            + '</tr>';
    }).join('');

    updatePagination(filteredTickets.length);
}

// ================================================================
//  PAGINATION
// ================================================================
function updatePagination(total) {
    var start = total === 0 ? 0 : ((currentPage - 1) * limit) + 1;
    var end = Math.min(currentPage * limit, total);

    document.getElementById('showingFrom').textContent = start;
    document.getElementById('showingTo').textContent = end;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('currentPageBtn').textContent = currentPage;

    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}

// ================================================================
//  SEARCH & FILTER
// ================================================================
function searchTickets() {
    var query = document.getElementById('searchInput').value.toLowerCase();
    var clearBtn = document.getElementById('clearSearch');
    
    if (query) {
        clearBtn.classList.add('active');
    } else {
        clearBtn.classList.remove('active');
    }

    filterTickets();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearch').classList.remove('active');
    filterTickets();
}

function filterTickets() {
    var query = document.getElementById('searchInput').value.toLowerCase();
    var status = document.getElementById('statusFilter').value;

    filteredTickets = allTickets.filter(function(ticket) {
        var matchesSearch = !query || 
            ticket.ticketId.toLowerCase().includes(query) ||
            ticket.subject.toLowerCase().includes(query);
        
        var matchesStatus = status === 'all' || ticket.status === status;

        return matchesSearch && matchesStatus;
    });

    currentPage = 1;
    renderTable();
}

// ================================================================
//  VIEW TICKET (OPEN CHAT MODAL)
// ================================================================
function viewTicket(ticketId) {
    var ticket = allTickets.find(function(t) { return t.ticketId === ticketId; });
    if (!ticket) return;

    currentTicket = ticket;

    // Update modal header
    document.getElementById('chatModalTicketID').textContent = ticket.ticketId;
    document.getElementById('chatModalSubject').textContent = ticket.subject;

    // Load chat messages
    loadChatMessages(ticket);

    // Show/hide input based on status
    var chatInput = document.getElementById('chatModalInput');
    if (ticket.status === 'closed') {
        chatInput.style.display = 'none';
    } else {
        chatInput.style.display = 'block';
    }

    // Show modal
    document.getElementById('chatModal').classList.add('active');
}

function loadChatMessages(ticket) {
    var chatBody = document.getElementById('chatModalBody');
    
    // For now, showing initial message
    // Backend should return full conversation
    chatBody.innerHTML = '<div class="message user">'
        + '<div class="message-avatar">U</div>'
        + '<div class="message-content">'
        + '<div class="message-header">'
        + '<span class="message-sender">You</span>'
        + '<span class="message-time">' + formatDateTime(ticket.createdAt) + '</span>'
        + '</div>'
        + '<div class="message-body">' + escapeHtml(ticket.preview || ticket.subject) + '</div>'
        + '</div>'
        + '</div>';

    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
}

function closeChatModal() {
    document.getElementById('chatModal').classList.remove('active');
    currentTicket = null;
}

function sendChatReply() {
    if (!currentTicket) return;

    var message = document.getElementById('chatReplyMessage').value.trim();
    if (!message) {
        showToast('Please type a message', 'error');
        return;
    }

    showToast('Reply feature coming soon', 'info');
    document.getElementById('chatReplyMessage').value = '';
}

// ================================================================
//  COPY TICKET ID
// ================================================================
function copyTicketID() {
    if (!currentTicket) return;
    copyText(currentTicket.ticketId);
}

function copyText(text) {
    var tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    showToast('Copied: ' + text, 'success');
}

// ================================================================
//  NEW TICKET MODAL
// ================================================================
function openNewTicketModal() {
    document.getElementById('newTicketModal').classList.add('active');
}

function closeNewTicketModal() {
    document.getElementById('newTicketModal').classList.remove('active');
    resetModalForm();
}

function onModalFileChange(input) {
    var fileName = document.getElementById('modalFileName');
    if (input.files && input.files[0]) {
        fileName.textContent = input.files[0].name;
        fileName.classList.add('active');
    }
}

function submitNewTicket() {
    var subject = document.getElementById('modalSubject').value.trim();
    var category = document.getElementById('modalCategory').value;
    var message = document.getElementById('modalMessage').value.trim();
    var fileInput = document.getElementById('modalScreenshot');

    if (!subject) {
        showToast('Please enter a subject', 'error');
        return;
    }
    if (!message) {
        showToast('Please describe your issue', 'error');
        return;
    }

    var btn = document.getElementById('modalSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    var ticketData = {
        subject: subject,
        message: message,
        screenshot: null
    };

    if (fileInput.files && fileInput.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            ticketData.screenshot = e.target.result;
            sendTicketToAPI(ticketData, btn);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        sendTicketToAPI(ticketData, btn);
    }
}

function sendTicketToAPI(ticketData, btn) {
    fetch(API_URL + '/api/support/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(ticketData)
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Failed to create ticket');
        return res.json();
    })
    .then(function(data) {
        if (data.success) {
            showToast('Ticket created successfully!', 'success');
            closeNewTicketModal();
            loadTickets();
        } else {
            throw new Error(data.message || 'Failed to create ticket');
        }
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Ticket';
    })
    .catch(function(err) {
        console.error('Create ticket error:', err);
        showToast(err.message || 'Failed to create ticket', 'error');
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Ticket';
    });
}

function resetModalForm() {
    document.getElementById('modalSubject').value = '';
    document.getElementById('modalCategory').value = '';
    document.getElementById('modalMessage').value = '';
    document.getElementById('modalScreenshot').value = '';
    document.getElementById('modalFileName').classList.remove('active');
}

// ================================================================
//  HELPERS
// ================================================================
function formatDateTime(dateString) {
    if (!dateString) return 'Unknown';
    
    var date = new Date(dateString);
    return date.toLocaleDateString('en-NG', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
}

function showToast(msg, type) {
    type = type || 'info';
    var icons = { 
        success: 'fa-check-circle', 
        error: 'fa-exclamation-circle', 
        info: 'fa-info-circle' 
    };
    
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i>'
        + '<p>' + escapeHtml(msg) + '</p>';
    
    container.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
}

// ================================================================
//  THEME & SIDEBAR
// ================================================================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    var dark = document.body.classList.contains('dark-mode');
    var icon = document.getElementById('themeIcon');
    if (icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        var icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
}

function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function showLogoutModal() {
    document.getElementById('logoutModal').classList.add('active');
}

function closeLogoutModal() {
    document.getElementById('logoutModal').classList.remove('active');
}

function confirmLogout() {
    localStorage.clear();
    window.location.href = 'sign-in.html';
}

// Close modals on outside click
document.addEventListener('click', function(e) {
    if (e.target.id === 'newTicketModal' || e.target.id === 'logoutModal') {
        e.target.classList.remove('active');
    }
});

// ESC to close modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeNewTicketModal();
        closeLogoutModal();
        closeChatModal();
    }
});
