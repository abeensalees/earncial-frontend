// ================================================
// SOCIAL HANDLES MANAGER (Full Logic - Fixed & Final)
// File: social-media-manager.js
// ================================================

// 1. CONFIGURATION
const API_URL = 'http://localhost:5000'; // Canza idan live server ne
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// 2. STATE MANAGEMENT
let allHandles = [];       // Duka handles daga database
let filteredHandles = [];  // Handles bayan an yi filtering
let currentHandle = null;  // Handle din da ake dubawa a Modal
let selectedHandles = new Set(); // Checkboxes da aka zaba
let availableTutorials = []; // Tutorials daga Database
let currentPage = 1;
let itemsPerPage = 10;

// ==========================================
// 1. INITIALIZATION & AUTH
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    console.log('🚀 Initializing Admin Panel...');
    
    // Check Auth
    if (!checkAuth()) return;

    // Load Theme
    loadTheme();

    // Load Data (Handles + Tutorials)
    await Promise.all([
        loadHandles(),
        fetchTutorials() 
    ]);
}

function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token) {
        window.location.href = '../sign-in.html'; 
        return false;
    }
    
    try {
        currentUser = JSON.parse(userData);
        return true;
    } catch (e) {
        return true; 
    }
}

// ==========================================
// 2. DATA LOADING (FETCH)
// ==========================================

async function loadHandles() {
    showLoadingState();

    try {
        const res = await fetch(`${API_URL}/api/social-handles/admin/all`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();

        if (data.success) {
            allHandles = data.handles || [];
            filteredHandles = [...allHandles]; 
            
            updateStats();
            renderHandles(); 
            showToast('success', 'Data Loaded', 'Handles updated successfully');
        } else {
            throw new Error(data.message);
        }

    } catch (err) {
        console.error('Load Error:', err);
        showToast('error', 'Error', 'Failed to load handles');
        document.getElementById('handlesTableBody').innerHTML = `
            <tr><td colspan="8" style="text-align:center; color:red; padding:20px;">Failed to load data. Check console.</td></tr>
        `;
    }
}

// --- FETCH TUTORIALS DAGA DB ---
async function fetchTutorials() {
    try {
        const res = await fetch(`${API_URL}/api/tutorials`, { 
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            availableTutorials = data.tutorials || []; 
            console.log("Tutorials Loaded:", availableTutorials.length);
        }
    } catch (err) {
        console.error('Failed to load tutorials:', err);
    }
}

// ==========================================
// 3. TABLE RENDERING (THE CORE)
// ==========================================

function renderHandles() {
    const tbody = document.getElementById('handlesTableBody');
    if (!tbody) return console.error("❌ Error: Element 'handlesTableBody' not found!");

    // 1. Pagination Logic
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageHandles = filteredHandles.slice(start, end);

    // 2. Empty State
    if (pageHandles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:var(--text-muted);">
                    <i class="fas fa-folder-open" style="font-size:32px; margin-bottom:10px; opacity:0.5;"></i>
                    <p>No handles found</p>
                </td>
            </tr>
        `;
        updatePaginationInfo();
        return;
    }

    // 3. Build Rows
    tbody.innerHTML = pageHandles.map((handle, index) => {
        const globalIndex = start + index + 1;
        const username = handle.user ? handle.user.username : 'Deleted User';
        const platformIcon = getPlatformIcon(handle.platform);
        const isSelected = selectedHandles.has(handle._id) ? 'checked' : '';
        const rowClass = selectedHandles.has(handle._id) ? 'selected' : '';

        // --- GYARAN DATE FORMAT (Date + Time) ---
        const formattedDate = new Date(handle.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });

        // Generate Buttons based on Status
        let actionButtons = '';
        
        actionButtons += `
            <button class="btn btn-view" onclick="openReviewModal('${handle._id}')" title="Review">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-link" onclick="window.open('${handle.profileLink}', '_blank')" title="Open Link">
                <i class="fas fa-external-link-alt"></i>
            </button>
        `;

        if (handle.status === 'pending') {
            actionButtons += `
                <button class="btn btn-approve" onclick="quickApprove('${handle._id}')" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-reject" onclick="openReviewModal('${handle._id}')" title="Reject">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else if (handle.status === 'approved') {
            actionButtons += `
                <button class="btn btn-deactivate" onclick="confirmAction('deactivate', '${handle._id}')" title="Deactivate">
                    <i class="fas fa-ban"></i>
                </button>
            `;
        } else if (handle.status === 'deactivated' || handle.status === 'rejected') {
            actionButtons += `
                <button class="btn btn-approve" onclick="quickApprove('${handle._id}')" title="Re-Activate">
                    <i class="fas fa-redo"></i>
                </button>
            `;
        }

        actionButtons += `
            <button class="btn btn-delete" onclick="confirmAction('delete', '${handle._id}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        `;

        return `
            <tr class="${rowClass}">
                <td class="checkbox-cell">
                    <input type="checkbox" onchange="toggleSelection('${handle._id}')" ${isSelected}>
                </td>
                <td class="sn-cell">${globalIndex}</td>
                <td>
                    <strong onclick="showUserHandles('${username}')" style="cursor: pointer; color: var(--primary); text-decoration: underline;" title="View all handles by this user">
                        ${username}
                    </strong>
                </td>
                <td>
                    <div class="platform-cell">
                        <div class="platform-icon ${platformIcon.class}">
                            <i class="${platformIcon.icon}"></i>
                        </div>
                        ${handle.platform}
                    </div>
                </td>
                <td>
                    <div class="handle-cell">
                        <span>${handle.handle}</span>
                        <i class="fas fa-copy copy-icon" onclick="copyText('${handle.handle}')"></i>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${handle.status.toLowerCase()}">${handle.status}</span>
                </td>
                <td style="font-size:12px; font-weight:500; white-space:nowrap;">
                    ${formattedDate}
                </td>
                <td>
                    <div class="action-btns">
                        ${actionButtons}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updatePaginationInfo();
    updateBulkBar();
}

// ==========================================
// 4. MODAL LOGIC (VIEW / REVIEW)
// ==========================================

function openReviewModal(id) {
    currentHandle = allHandles.find(h => h._id === id);
    if (!currentHandle) return;

    // 1. Populate Data
    document.getElementById('modalEarnerUsername').innerText = currentHandle.user ? currentHandle.user.username : 'Unknown';
    document.getElementById('modalUserHandlesCount').innerText = countUserHandles(currentHandle.user?._id) + ' Total Handles';
    document.getElementById('modalPlatform').innerText = currentHandle.platform;
    document.getElementById('modalHandle').innerText = currentHandle.handle;
    
    const linkEl = document.getElementById('modalProfileLink');
    linkEl.innerText = currentHandle.profileLink;
    linkEl.href = currentHandle.profileLink;

    document.getElementById('modalStatus').innerHTML = `<span class="status-badge status-${currentHandle.status}">${currentHandle.status}</span>`;
    
    // --- GYARAN DATE A MODAL ---
    document.getElementById('modalDate').innerText = new Date(currentHandle.createdAt).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true
    });

    // 2. Reset Forms
    document.getElementById('rejectionReasonGroup').style.display = 'none';
    document.getElementById('videoLinkGroup').style.display = 'none';
    document.getElementById('rejectionReason').value = currentHandle.rejectionReason || '';
    document.getElementById('videoLink').value = currentHandle.videoLink || '';

    // 3. Populate Video Tutorials (CORRECT LOGIC)
    loadVideoTutorials(currentHandle.platform);

    // 4. Generate Buttons based on Status
    const btnContainer = document.getElementById('modalActionButtons');
    let buttons = '';

    if (currentHandle.status === 'pending') {
        buttons = `
            <button class="modal-btn modal-btn-approve" onclick="approveCurrentHandle()">
                <i class="fas fa-check"></i> Approve
            </button>
            <button class="modal-btn modal-btn-reject" onclick="showRejectForm()">
                <i class="fas fa-times"></i> Reject
            </button>
        `;
    } else if (currentHandle.status === 'approved') {
        buttons = `
            <button class="modal-btn modal-btn-deactivate" onclick="deactivateCurrentHandle()">
                <i class="fas fa-ban"></i> Deactivate
            </button>
        `;
    } else {
        buttons = `
            <button class="modal-btn modal-btn-approve" onclick="approveCurrentHandle()">
                <i class="fas fa-redo"></i> Re-Activate
            </button>
        `;
    }
    
    buttons += `<button class="modal-btn modal-btn-cancel" onclick="closeModal('handleModal')">Close</button>`;
    btnContainer.innerHTML = buttons;

    // 5. Show Modal
    document.getElementById('handleModal').classList.add('active');
}

function showRejectForm() {
    document.getElementById('rejectionReasonGroup').style.display = 'block';
    document.getElementById('videoLinkGroup').style.display = 'block';
    
    const btnContainer = document.getElementById('modalActionButtons');
    btnContainer.innerHTML = `
        <button class="modal-btn modal-btn-reject" onclick="rejectCurrentHandle()">
            <i class="fas fa-paper-plane"></i> Submit Rejection
        </button>
        <button class="modal-btn modal-btn-cancel" onclick="closeModal('handleModal')">Cancel</button>
    `;
}

// ==========================================
// 5. ACTION FUNCTIONS
// ==========================================

async function quickApprove(id) {
    await performAction(`${API_URL}/api/social-handles/admin/approve/${id}`, 'PUT', 'Handle Approved');
}
async function approveCurrentHandle() {
    if(!currentHandle) return;
    await quickApprove(currentHandle._id);
    closeModal('handleModal');
}

async function performDeactivate(id) {
    await performAction(`${API_URL}/api/social-handles/admin/deactivate/${id}`, 'PUT', 'Handle Deactivated');
    closeModal('confirmModal');
}
async function deactivateCurrentHandle() {
    if(!currentHandle) return;
    if(confirm('Are you sure you want to deactivate this handle?')) {
        await performAction(`${API_URL}/api/social-handles/admin/deactivate/${currentHandle._id}`, 'PUT', 'Handle Deactivated');
        closeModal('handleModal');
    }
}

async function rejectCurrentHandle() {
    const reason = document.getElementById('rejectionReason').value;
    const videoLink = document.getElementById('videoLink').value;

    if (!reason) return showToast('error', 'Required', 'Please enter a rejection reason');

    try {
        const res = await fetch(`${API_URL}/api/social-handles/admin/reject/${currentHandle._id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reason, videoLink })
        });
        const data = await res.json();
        if (data.success) {
            showToast('success', 'Rejected', 'Handle rejected successfully');
            closeModal('handleModal');
            loadHandles();
        } else {
            showToast('error', 'Error', data.message);
        }
    } catch (e) {
        showToast('error', 'Error', 'Failed to reject handle');
    }
}

async function performDelete(id) {
    await performAction(`${API_URL}/api/social-handles/admin/${id}`, 'DELETE', 'Handle Deleted');
    closeModal('confirmModal');
}

async function performAction(url, method, successMsg) {
    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            showToast('success', 'Success', successMsg);
            loadHandles(); 
        } else {
            showToast('error', 'Error', data.message);
        }
    } catch (e) {
        showToast('error', 'Error', 'Action failed');
    }
}

// ==========================================
// 6. CONFIRMATION MODAL & FILTERS
// ==========================================

let pendingAction = null;

function confirmAction(type, id) {
    pendingAction = { type, id };
    const msgEl = document.getElementById('confirmMessage');
    const btnEl = document.getElementById('confirmYesBtn');

    if (type === 'delete') {
        msgEl.innerText = 'Are you sure you want to PERMANENTLY delete this handle?';
        btnEl.innerText = 'Yes, Delete';
        btnEl.style.background = 'var(--danger)';
    } else if (type === 'deactivate') {
        msgEl.innerText = 'Are you sure you want to deactivate this handle?';
        btnEl.innerText = 'Yes, Deactivate';
        btnEl.style.background = 'var(--dark-grey)';
    }

    btnEl.onclick = () => {
        if (pendingAction.type === 'delete') performDelete(pendingAction.id);
        if (pendingAction.type === 'deactivate') performDeactivate(pendingAction.id);
    };

    document.getElementById('confirmModal').classList.add('active');
}

function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const platformFilter = document.getElementById('filterPlatform').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredHandles = allHandles.filter(h => {
        const matchesStatus = statusFilter === 'all' || h.status === statusFilter;
        const matchesPlatform = platformFilter === 'all' || h.platform === platformFilter;
        
        let matchesSearch = true;
        if (searchTerm) {
            const username = h.user?.username?.toLowerCase() || '';
            const userId = h.user?._id?.toLowerCase() || '';
            matchesSearch = username.includes(searchTerm) || userId.includes(searchTerm);
        }

        return matchesStatus && matchesPlatform && matchesSearch;
    });

    currentPage = 1;
    renderHandles();
}

function loadUserHandlesBySearch() { applyFilters(); }
function filterByStatus(status) {
    document.getElementById('filterStatus').value = status;
    applyFilters();
}

// ==========================================
// 7. PAGINATION & BULK & UTILS
// ==========================================

function updatePaginationInfo() {
    const start = filteredHandles.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, filteredHandles.length);

    document.getElementById('showingStart').innerText = start;
    document.getElementById('showingEnd').innerText = end;
    document.getElementById('totalItems').innerText = filteredHandles.length;

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = end >= filteredHandles.length;
}

function nextPage() {
    if ((currentPage * itemsPerPage) < filteredHandles.length) {
        currentPage++;
        renderHandles();
    }
}
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderHandles();
    }
}
function changePageSize() {
    itemsPerPage = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    renderHandles();
}

function toggleSelection(id) {
    if (selectedHandles.has(id)) selectedHandles.delete(id);
    else selectedHandles.add(id);
    renderHandles();
}

function toggleSelectAll() {
    const isChecked = document.getElementById('selectAll').checked;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageHandles = filteredHandles.slice(start, end);

    pageHandles.forEach(h => {
        if (isChecked) selectedHandles.add(h._id);
        else selectedHandles.delete(h._id);
    });
    renderHandles();
}

function updateBulkBar() {
    const bar = document.getElementById('bulkActionsBar');
    const count = document.getElementById('selectedCount');
    
    if (selectedHandles.size > 0) {
        bar.classList.add('active');
        count.innerText = selectedHandles.size;
    } else {
        bar.classList.remove('active');
    }
}

async function bulkApprove() {
    if (!confirm(`Approve ${selectedHandles.size} handles?`)) return;
    for (const id of selectedHandles) {
        await fetch(`${API_URL}/api/social-handles/admin/approve/${id}`, {
            method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
        });
    }
    selectedHandles.clear();
    loadHandles();
}

async function bulkReject() {
    const reason = prompt("Enter reason for bulk rejection:");
    if (!reason) return;
    for (const id of selectedHandles) {
        await fetch(`${API_URL}/api/social-handles/admin/reject/${id}`, {
            method: 'PUT', 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
    }
    selectedHandles.clear();
    loadHandles();
}

async function bulkDelete() {
    if (!confirm(`PERMANENTLY DELETE ${selectedHandles.size} handles?`)) return;
    for (const id of selectedHandles) {
        await fetch(`${API_URL}/api/social-handles/admin/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
    }
    selectedHandles.clear();
    loadHandles();
}

function updateStats() {
    document.getElementById('pendingCount').innerText = allHandles.filter(h => h.status === 'pending').length;
    document.getElementById('approvedCount').innerText = allHandles.filter(h => h.status === 'approved').length;
    document.getElementById('rejectedCount').innerText = allHandles.filter(h => h.status === 'rejected').length;
    document.getElementById('deactivatedCount').innerText = allHandles.filter(h => h.status === 'deactivated').length;
    document.getElementById('totalCount').innerText = allHandles.length;
}

function countUserHandles(userId) {
    if(!userId) return 0;
    return allHandles.filter(h => h.user && h.user._id === userId).length;
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

function copyText(text) {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied', 'Handle copied to clipboard');
}

function getPlatformIcon(platform) {
    const map = {
        'Facebook': { icon: 'fab fa-facebook-f', class: 'icon-facebook' },
        'Instagram': { icon: 'fab fa-instagram', class: 'icon-instagram' },
        'X (Twitter)': { icon: 'fab fa-x-twitter', class: 'icon-twitter' },
        'TikTok': { icon: 'fab fa-tiktok', class: 'icon-tiktok' },
        'YouTube': { icon: 'fab fa-youtube', class: 'icon-youtube' },
        'WhatsApp': { icon: 'fab fa-whatsapp', class: 'icon-whatsapp' },
        'Telegram': { icon: 'fab fa-telegram-plane', class: 'icon-telegram' },
        'LinkedIn': { icon: 'fab fa-linkedin-in', class: 'icon-linkedin' },
        'Spotify': { icon: 'fab fa-spotify', class: 'icon-spotify' }
    };
    return map[platform] || { icon: 'fas fa-link', class: 'icon-default' };
}

// --- GYARARREN LOAD VIDEO (AMFANI DA videoUrl) ---
function loadVideoTutorials(platform) {
    const container = document.getElementById('videoLinksList');
    container.innerHTML = ''; 

    if (!availableTutorials || availableTutorials.length === 0) {
        container.innerHTML = '<p style="color:#777; font-size:12px; padding:10px;">No tutorials found in database.</p>';
        return;
    }

    // FILTERING: Amfani da includes don nemo TikTok, TikTok App, etc.
    const relevantVideos = availableTutorials.filter(t => {
        const tPlatform = (t.platform || '').toLowerCase();
        const targetPlatform = (platform || '').toLowerCase();
        return tPlatform.includes(targetPlatform); 
    });

    if (relevantVideos.length === 0) {
         container.innerHTML = `<p style="color:orange; font-size:12px; padding:10px;">No video found for <b>${platform}</b>.</p>`;
         return;
    }

    // RENDERING: AMFANI DA videoUrl
    container.innerHTML = relevantVideos.map(v => {
        const finalLink = v.videoUrl; 
        
        // Idan link babu, kar a nuna
        if (!finalLink) return '';

        return `
            <div class="video-link-item" onclick="selectVideo('${finalLink}', this)" style="padding:10px; border:1px solid #eee; margin-bottom:5px; cursor:pointer; border-radius:6px; display:flex; align-items:center; gap:10px;">
                <i class="fab fa-youtube" style="color:red; font-size:18px;"></i>
                <div class="video-link-info" style="overflow:hidden; width:100%;">
                    <div class="video-link-title" style="font-weight:600; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${v.title}
                    </div>
                    <div class="video-link-url" style="font-size:11px; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        ${finalLink}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showUserHandles(username) {
    document.getElementById('searchInput').value = username;
    applyFilters();
    showToast('info', 'User Filter', `Showing handles for: ${username}`);
}

function selectVideo(url, element) {
    document.getElementById('videoLink').value = url;
    document.querySelectorAll('.video-link-item').forEach(el => {
        el.style.borderColor = '#eee';
        el.style.background = '#fff';
    });
    element.style.borderColor = 'var(--primary)';
    element.style.background = '#f0f9ff';
}

function showToast(type, title, msg) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i> <div><strong>${title}</strong><p style="margin:0">${msg}</p></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Sidebar & Theme
function openSidebar() { document.getElementById('sidebar').classList.add('active'); document.getElementById('sidebarOverlay').classList.add('active'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('active'); document.getElementById('sidebarOverlay').classList.remove('active'); }
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}
function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
}
function showLoadingState() {
    document.getElementById('handlesTableBody').innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>`;
}