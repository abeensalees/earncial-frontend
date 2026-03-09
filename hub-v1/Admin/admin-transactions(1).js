// ================================================
// EARNCIAL - ADMIN TRANSACTIONS MANAGER
// WITH FULL FILTERING & SEARCH
// ================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

// Pagination
let currentPage = 1;
let totalPages = 1;
let limit = 50;

// ============ CHECK AUTH ============
if (!token) {
    alert('Please login first');
    window.location.href = 'sign-in.html';
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

function navigate(page) {
    window.location.href = page;
}

// ============ THEME TOGGLE ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.theme-toggle i');
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
        document.querySelector('.theme-toggle i').className = 'fas fa-sun';
    }
}

// ============ TOAST NOTIFICATION ============
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div>
            <strong>${title}</strong>
            <p style="margin:0;font-size:13px;color:var(--text-muted);">${message}</p>
        </div>
    `;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// ============ FORMAT CURRENCY ============
function formatCurrency(amount) {
    return '₦' + parseFloat(amount || 0).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ============ FORMAT DATE ============
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// ============ COPY TO CLIPBOARD ============
function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('success', 'Copied!', `${label} copied to clipboard`);
    }).catch(err => {
        showToast('error', 'Copy Failed', 'Could not copy to clipboard');
    });
}

// ============ GET TYPE BADGE CLASS ============
function getTypeBadgeClass(type) {
    const typeMap = {
        'deposit': 'type-deposit',
        'activation_payment': 'type-activation',
        'user_referral_reward': 'type-referral',
        'advertiser_referral_reward': 'type-referral',
        'withdrawal': 'type-withdrawal',
        'task_earning': 'type-deposit',
        'task_payment': 'type-withdrawal'
    };
    return typeMap[type] || 'type-deposit';
}

// ============ GET TYPE DISPLAY NAME ============
function getTypeDisplayName(type) {
    const typeMap = {
        'deposit': 'Deposit',
        'activation_payment': 'Activation',
        'user_referral_reward': 'User Referral',
        'advertiser_referral_reward': 'Advertiser Referral',
        'withdrawal': 'Withdrawal',
        'task_earning': 'Task Earning',
        'task_payment': 'Task Payment',
        'transfer_in': 'Transfer In',
        'transfer_out': 'Transfer Out',
        'admin_credit': 'Admin Credit',
        'admin_debit': 'Admin Debit'
    };
    return typeMap[type] || type;
}

// ============ LOAD TRANSACTIONS ============
async function loadTransactions() {
    try {
        console.log('📥 Loading transactions...');

        // Get filters
        const type = document.getElementById('filterType').value;
        const status = document.getElementById('filterStatus').value;
        const period = document.getElementById('filterPeriod').value;
        const search = document.getElementById('searchUser').value.trim();

        // Build query
        let query = `page=${currentPage}&limit=${limit}`;
        if (type !== 'all') query += `&type=${type}`;
        if (status !== 'all') query += `&status=${status}`;
        if (period !== 'all') query += `&period=${period}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(`${API_URL}/api/admin/transactions?${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to load transactions');
        }

        const data = await res.json();
        console.log('✅ Transactions loaded:', data);

        // Update stats
        updateStats(data.stats);

        // Display transactions
        displayTransactions(data.transactions);

        // Update pagination
        totalPages = data.totalPages || 1;
        updatePagination(data.count);

        showToast('success', 'Loaded', `${data.count} transactions loaded`);

    } catch (err) {
        console.error('❌ Load transactions error:', err);
        showToast('error', 'Error', err.message);

        document.getElementById('transactionsTableBody').innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; color: var(--danger);"></i>
                    <p style="margin-top: 15px; color: var(--text-muted);">${err.message}</p>
                    <button class="filter-btn" onclick="loadTransactions()" style="margin-top: 15px;">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }
}

// ============ UPDATE STATS ============
function updateStats(stats) {
    document.getElementById('totalCount').textContent = stats.totalCount.toLocaleString();
    
    document.getElementById('depositCount').textContent = stats.depositCount.toLocaleString();
    document.getElementById('depositAmount').textContent = formatCurrency(stats.depositAmount).replace('₦', '');
    
    document.getElementById('activationCount').textContent = stats.activationCount.toLocaleString();
    document.getElementById('activationAmount').textContent = formatCurrency(stats.activationAmount).replace('₦', '');
    
    document.getElementById('userReferralCount').textContent = stats.userReferralCount.toLocaleString();
    document.getElementById('userReferralAmount').textContent = formatCurrency(stats.userReferralAmount).replace('₦', '');
    
    document.getElementById('advertiserReferralCount').textContent = stats.advertiserReferralCount.toLocaleString();
    document.getElementById('advertiserReferralAmount').textContent = formatCurrency(stats.advertiserReferralAmount).replace('₦', '');
}

// ============ DISPLAY TRANSACTIONS ============
function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No transactions found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = transactions.map((txn, index) => {
        const startIndex = (currentPage - 1) * limit;
        const sn = startIndex + index + 1;

        return `
            <tr>
                <td class="sn-cell">${sn}</td>
                <td>
                    <strong>${escapeHtml(txn.transactionId)}</strong>
                    <i class="fas fa-copy copy-icon" onclick="copyToClipboard('${txn.transactionId}', 'Transaction ID')" title="Copy ID"></i>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-weight: 600;">${escapeHtml(txn.username)}</span>
                        <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(txn.email)}</span>
                    </div>
                </td>
                <td>
                    <span class="type-badge ${getTypeBadgeClass(txn.type)}">
                        ${getTypeDisplayName(txn.type)}
                    </span>
                </td>
                <td class="amount-highlight">${formatCurrency(txn.amount)}</td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(txn.description)}">
                    ${escapeHtml(txn.description)}
                </td>
                <td>
                    ${txn.reference ? `
                        <span style="font-size: 12px;">${escapeHtml(txn.reference)}</span>
                        <i class="fas fa-copy copy-icon" onclick="copyToClipboard('${txn.reference}', 'Reference')" title="Copy Reference"></i>
                    ` : '<span style="color: var(--text-muted);">-</span>'}
                </td>
                <td>
                    ${txn.relatedUsername ? `
                        <span style="font-weight: 600; color: var(--purple);">
                            <i class="fas fa-user"></i> ${escapeHtml(txn.relatedUsername)}
                        </span>
                    ` : '<span style="color: var(--text-muted);">-</span>'}
                </td>
                <td>
                    <span class="type-badge ${txn.status === 'completed' ? 'type-deposit' : txn.status === 'pending' ? 'type-activation' : 'type-withdrawal'}">
                        ${txn.status}
                    </span>
                </td>
                <td style="font-size: 12px; color: var(--text-muted);">
                    ${formatDate(txn.createdAt)}
                </td>
            </tr>
        `;
    }).join('');
}

// ============ ESCAPE HTML ============
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// ============ UPDATE PAGINATION ============
function updatePagination(totalCount) {
    const startIndex = (currentPage - 1) * limit + 1;
    const endIndex = Math.min(currentPage * limit, totalCount);

    document.getElementById('showingStart').textContent = totalCount > 0 ? startIndex : 0;
    document.getElementById('showingEnd').textContent = endIndex;
    document.getElementById('totalItems').textContent = totalCount;
    document.getElementById('pageNumbers').textContent = `Page ${currentPage} of ${totalPages}`;

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;
}

// ============ PAGINATION FUNCTIONS ============
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadTransactions();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadTransactions();
    }
}

// ============ APPLY FILTERS ============
function applyFilters() {
    currentPage = 1; // Reset to first page
    loadTransactions();
}

// ============ FILTER BY TYPE (FROM STAT CARDS) ============
function filterByType(type) {
    document.getElementById('filterType').value = type;
    applyFilters();
}

// ============ EXPORT TRANSACTIONS ============
async function exportTransactions() {
    try {
        showToast('info', 'Exporting...', 'Preparing transaction data');

        // Get current filters
        const type = document.getElementById('filterType').value;
        const status = document.getElementById('filterStatus').value;
        const period = document.getElementById('filterPeriod').value;
        const search = document.getElementById('searchUser').value.trim();

        // Build query (get all, not just current page)
        let query = `limit=10000`; // Get all records
        if (type !== 'all') query += `&type=${type}`;
        if (status !== 'all') query += `&status=${status}`;
        if (period !== 'all') query += `&period=${period}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(`${API_URL}/api/admin/transactions?${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch transactions');

        const data = await res.json();

        // Convert to CSV
        const csv = convertToCSV(data.transactions);

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        showToast('success', 'Exported', `${data.transactions.length} transactions exported`);

    } catch (err) {
        console.error('❌ Export error:', err);
        showToast('error', 'Export Failed', err.message);
    }
}

// ============ CONVERT TO CSV ============
function convertToCSV(transactions) {
    const headers = [
        'Transaction ID',
        'Username',
        'Email',
        'Type',
        'Amount',
        'Description',
        'Reference',
        'Related User',
        'Balance Before',
        'Balance After',
        'Status',
        'Date'
    ];

    const rows = transactions.map(txn => [
        txn.transactionId,
        txn.username,
        txn.email,
        getTypeDisplayName(txn.type),
        txn.amount,
        txn.description,
        txn.reference || '',
        txn.relatedUsername || '',
        txn.balanceBefore,
        txn.balanceAfter,
        txn.status,
        formatDate(txn.createdAt)
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

// ============ INITIALIZATION ============
async function init() {
    console.log('🚀 Initializing Transactions Manager...');
    loadTheme();
    await loadTransactions();
}

window.addEventListener('DOMContentLoaded', init);

console.log('✅ Admin Transactions Manager Loaded');
console.log('📊 Features: Full Filtering, Search, Export, Pagination');
