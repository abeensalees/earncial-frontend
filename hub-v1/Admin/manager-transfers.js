
// ================================================
// ADMIN TRANSFER MANAGEMENT - COMPLETE JAVASCRIPT
// ================================================

const API_URL = 'http://localhost:5000'; // CANJA wannan!
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// Pagination & Filters
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let totalItems = 0;
let allTransfers = [];
let filteredTransfers = [];

// Current editing transfer
let editingTransfer = null;

// Global settings
let globalSettings = {
    minTransferAmount: 100,
    transferFeePercentage: 2,
    maintenanceMode: false
};

// ================= CHECK AUTH =================
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        showToast('Please login first', 'error');
        setTimeout(() => {
            window.location.href = '../sign-in.html';
        }, 1500);
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        return true;
    } catch (e) {
        console.error('Invalid user data:', e);
        localStorage.clear();
        window.location.href = '../sign-in.html';
        return false;
    }
}

// ================= LOAD ALL TRANSFERS =================
async function loadAllTransfers() {
    try {
        showLoading();

        const res = await fetch(`${API_URL}/api/transfer/all-transfers?limit=1000`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                showToast('Session expired. Please login again', 'error');
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = '../sign-in.html';
                }, 2000);
                return;
            }
            throw new Error('Failed to load transfers');
        }

        const data = await res.json();
        
        if (data.success) {
            allTransfers = data.transfers || [];
            filteredTransfers = [...allTransfers];
            
            // Update statistics
            updateStats(data.statistics || {});
            
            // Apply current filters
            applyFilters();
            
            console.log('✅ Loaded', allTransfers.length, 'transfers');
        }
    } catch (err) {
        console.error('❌ Load transfers error:', err);
        showToast('Failed to load transfers', 'error');
        allTransfers = [];
        filteredTransfers = [];
        renderTable();
    } finally {
        hideLoading();
    }
}

// ================= UPDATE STATISTICS =================
function updateStats(stats) {
    document.getElementById('statVolume').textContent = 
        '₦' + (stats.totalAmount || 0).toLocaleString('en-NG', {minimumFractionDigits: 2});
    
    document.getElementById('statFees').textContent = 
        '₦' + (stats.totalFees || 0).toLocaleString('en-NG', {minimumFractionDigits: 2});
    
    // Count by status
    const successCount = filteredTransfers.filter(t => t.status === 'completed').length;
    const failedCount = filteredTransfers.filter(t => t.status === 'failed').length;
    const pendingCount = filteredTransfers.filter(t => t.status === 'pending').length;
    
    document.getElementById('statSuccess').textContent = successCount;
    document.getElementById('statFailed').textContent = failedCount;
    document.getElementById('statPending').textContent = pendingCount;
}

// ================= APPLY FILTERS =================
function applyFilters() {
    const timeFilter = document.getElementById('filterTime').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
    
    // Start with all transfers
    filteredTransfers = [...allTransfers];
    
    // Filter by time period
    if (timeFilter !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch(timeFilter) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3months':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6months':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        
        filteredTransfers = filteredTransfers.filter(t => {
            const transferDate = new Date(t.createdAt);
            return transferDate >= startDate;
        });
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
        const statusMap = {
            'success': 'completed',
            'pending': 'pending',
            'failed': 'failed'
        };
        filteredTransfers = filteredTransfers.filter(t => t.status === statusMap[statusFilter]);
    }
    
    // Filter by search query (username, email, or ID)
    if (searchQuery) {
        filteredTransfers = filteredTransfers.filter(t => {
            const username = (t.userId?.username || '').toLowerCase();
            const email = (t.userId?.email || '').toLowerCase();
            const id = (t._id || '').toLowerCase();
            
            return username.includes(searchQuery) || 
                   email.includes(searchQuery) || 
                   id.includes(searchQuery);
        });
    }
    
    // Recalculate stats for filtered data
    const filteredStats = {
        totalAmount: filteredTransfers.reduce((sum, t) => sum + (t.amount || 0), 0),
        totalFees: filteredTransfers.reduce((sum, t) => sum + (t.fee || 0), 0)
    };
    updateStats(filteredStats);
    
    // Reset to page 1 and render
    currentPage = 1;
    renderTable();
    
    showToast(`Showing ${filteredTransfers.length} transfers`, 'info');
}

// ================= RENDER TABLE =================
function renderTable() {
    const tbody = document.getElementById('transferTableBody');
    
    if (!tbody) return;
    
    // Calculate pagination
    totalItems = filteredTransfers.length;
    totalPages = Math.ceil(totalItems / pageSize);
    
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageTransfers = filteredTransfers.slice(startIndex, endIndex);
    
    // Update pagination info
    document.getElementById('showingStart').textContent = totalItems > 0 ? startIndex + 1 : 0;
    document.getElementById('showingEnd').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalItems;
    
    // Render rows
    if (pageTransfers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:40px; color:var(--text-muted);">
                    <i class="fas fa-inbox" style="font-size:48px; margin-bottom:15px; opacity:0.3;"></i>
                    <p style="font-size:16px;">No transfers found</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pageTransfers.map((transfer, index) => {
            const serialNumber = startIndex + index + 1;
            const date = new Date(transfer.createdAt).toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const username = transfer.userId?.username || 'N/A';
            const email = transfer.userId?.email || 'N/A';
            
            const statusClass = transfer.status === 'completed' ? 'success' : 
                               transfer.status === 'failed' ? 'failed' : 'pending';
            const statusText = transfer.status === 'completed' ? 'Success' : 
                              transfer.status === 'failed' ? 'Failed' : 'Pending';
            
            return `
                <tr>
                    <td><strong>${serialNumber}</strong></td>
                    <td>
                        <strong>${username}</strong><br>
                        <small style="color:var(--text-muted);">${email}</small>
                    </td>
                    <td>
                        <i class="fas fa-coins wallet-icon icon-earn"></i>
                        <strong>Earnings</strong>
                    </td>
                    <td>
                        <i class="fas fa-wallet wallet-icon icon-main"></i>
                        <strong>Main Balance</strong>
                    </td>
                    <td><strong style="color:var(--primary);">₦${transfer.amount.toLocaleString('en-NG', {minimumFractionDigits: 2})}</strong></td>
                    <td><strong style="color:var(--danger);">₦${transfer.fee.toLocaleString('en-NG', {minimumFractionDigits: 2})}</strong></td>
                    <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-view" onclick='viewTransfer(${JSON.stringify(transfer).replace(/'/g, "&#39;")})'>
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    renderPagination();
}

// ================= PAGINATION =================
function renderPagination() {
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!pageNumbers || !prevBtn || !nextBtn) return;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    // Show max 5 page numbers
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    let html = '';
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    pageNumbers.innerHTML = html;
}

function previousPage() {
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

function goToPage(page) {
    currentPage = page;
    renderTable();
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    renderTable();
}

// ================= VIEW TRANSFER (OPEN EDIT MODAL) =================
function viewTransfer(transfer) {
    editingTransfer = transfer;
    
    // Populate modal
    const username = transfer.userId?.username || 'Unknown User';
    const email = transfer.userId?.email || 'N/A';
    
    document.getElementById('mUser').textContent = `${username} (${email})`;
    document.getElementById('mRef').textContent = transfer._id || 'N/A';
    document.getElementById('mAmount').textContent = '₦' + transfer.amount.toLocaleString('en-NG', {minimumFractionDigits: 2});
    document.getElementById('mFee').textContent = '₦' + transfer.fee.toLocaleString('en-NG', {minimumFractionDigits: 2});
    
    // Set status
    document.getElementById('mStatusSelect').value = 
        transfer.status === 'completed' ? 'success' : transfer.status;
    
    // Set wallet balances (if available from user data)
    document.getElementById('mEarningsBal').value = transfer.userId?.earningsBalance || 0;
    document.getElementById('mMainBal').value = transfer.userId?.balance || 0;
    
    openModal('editModal');
}

// ================= SAVE ADMIN CHANGES =================
async function saveAdminChanges() {
    if (!editingTransfer) return;
    
    const newStatus = document.getElementById('mStatusSelect').value;
    const earningsBal = parseFloat(document.getElementById('mEarningsBal').value) || 0;
    const mainBal = parseFloat(document.getElementById('mMainBal').value) || 0;
    
    try {
        showToast('Saving changes...', 'info');
        
        // Update transfer status
        const res = await fetch(`${API_URL}/api/transfer/admin/update-transfer`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                transferId: editingTransfer._id,
                status: newStatus === 'success' ? 'completed' : newStatus,
                userId: editingTransfer.userId._id,
                earningsBalance: earningsBal,
                balance: mainBal
            })
        });
        
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to update');
        }
        
        showToast('Changes saved successfully!', 'success');
        closeModal('editModal');
        
        // Reload data
        await loadAllTransfers();
        
    } catch (err) {
        console.error('❌ Save changes error:', err);
        showToast(err.message || 'Failed to save changes', 'error');
    }
}

// ================= LOAD GLOBAL SETTINGS =================
async function loadGlobalSettings() {
    try {
        const res = await fetch(`${API_URL}/api/transfer/settings`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error('Failed to load settings');
        
        const data = await res.json();
        
        if (data.success && data.settings) {
            globalSettings = data.settings;
            console.log('✅ Global settings loaded:', globalSettings);
        }
    } catch (err) {
        console.error('❌ Load settings error:', err);
    }
}

// ================= OPEN SETTINGS MODAL =================
function openSettingsModal() {
    document.getElementById('globalFee').value = globalSettings.transferFeePercentage || 2;
    document.getElementById('globalMin').value = globalSettings.minTransferAmount || 100;
    openModal('settingsModal');
}

// ================= SAVE GLOBAL SETTINGS =================
async function saveGlobalSettings() {
    const newFee = parseFloat(document.getElementById('globalFee').value);
    const newMin = parseFloat(document.getElementById('globalMin').value);
    
    if (isNaN(newFee) || newFee < 0 || newFee > 100) {
        showToast('Invalid fee percentage (0-100)', 'error');
        return;
    }
    
    if (isNaN(newMin) || newMin < 1) {
        showToast('Invalid minimum amount', 'error');
        return;
    }
    
    try {
        showToast('Saving settings...', 'info');
        
        const res = await fetch(`${API_URL}/api/transfer/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                transferFeePercentage: newFee,
                minTransferAmount: newMin
            })
        });
        
        const data = await res.json();
        
        if (!res.ok || !data.success) {
            throw new Error(data.message || 'Failed to update settings');
        }
        
        globalSettings = data.settings;
        showToast('Settings updated successfully!', 'success');
        closeModal('settingsModal');
        
    } catch (err) {
        console.error('❌ Save settings error:', err);
        showToast(err.message || 'Failed to save settings', 'error');
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

// ================= SIDEBAR =================
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
        document.querySelector('.theme-toggle i').className = 'fas fa-sun';
    }
}

// ================= TOAST NOTIFICATION =================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ================= LOADING INDICATOR =================
function showLoading() {
    const tbody = document.getElementById('transferTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size:32px; color:var(--primary);"></i>
                    <p style="margin-top:15px; color:var(--text-muted);">Loading transfers...</p>
                </td>
            </tr>
        `;
    }
}

function hideLoading() {
    // Loading is replaced by renderTable()
}

// ================= INITIALIZATION =================
async function init() {
    console.log('🚀 Initializing Admin Transfer Management...');
    
    if (!checkAuth()) return;
    
    loadTheme();
    
    try {
        await loadGlobalSettings();
        await loadAllTransfers();
        
        console.log('✅ Admin Transfer Management Loaded');
        showToast('Dashboard loaded successfully', 'success');
        
    } catch (err) {
        console.error('❌ Initialization error:', err);
        showToast('Failed to load dashboard', 'error');
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}