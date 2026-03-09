// ================================================
// MANAGER WITHDRAWALS
// ================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

let allWithdrawals = [];
let selectedWithdrawals = [];
let currentWithdrawal = null;
let currentSection = 'dashboard';
let pagination = { page: 1, limit: 10, total: 0, pages: 1 };
let topData = [];
let topDataFiltered = [];
let charts = {};

if (!token) console.warn('No token found');

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadDashboard();
    loadBadgeCounts();
});

// ============ SECTION NAVIGATION ============
function showSection(key) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    const el = document.getElementById(`section-${key}`);
    if (el) el.classList.add('active');

    document.querySelectorAll('.menu-item').forEach(m => {
        if (m.getAttribute('onclick')?.includes(`'${key}'`)) m.classList.add('active');
    });

    currentSection = key;

    if (key === 'dashboard')  loadDashboard();
    else if (key === 'analytics') loadAnalytics();
    else if (key === 'messages')  loadNotes();
    else if (key === 'top') { /* user clicks Load */ }
    else loadWithdrawals(1, key);
}

// ============ SIDEBAR TOGGLES ============
function togglePlatformSidebar() {
    document.getElementById('platformSidebar').classList.toggle('active');
    document.getElementById('platformOverlay').classList.toggle('active');
}
function closePlatformSidebar() {
    document.getElementById('platformSidebar').classList.remove('active');
    document.getElementById('platformOverlay').classList.remove('active');
}
function openPageSidebar() {
    document.getElementById('pageSidebar').classList.add('active');
    document.getElementById('pageOverlay').classList.add('active');
}
function closePageSidebar() {
    document.getElementById('pageSidebar').classList.remove('active');
    document.getElementById('pageOverlay').classList.remove('active');
}
function logout() { localStorage.clear(); window.location.href = 'login.html'; }

// ============ THEME ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const dark = document.body.classList.contains('dark-mode');
    document.getElementById('themeIcon').className = dark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
}
function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// ============ TOAST ============
function showToast(msg, type = 'info') {
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${msg}`;
    document.getElementById('toastContainer').appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// ============ API HELPER ============
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: body ? JSON.stringify(body) : null
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message || 'Success', 'success');
            loadWithdrawals(pagination.page, currentSection);
            loadBadgeCounts();
        } else {
            showToast(data.message || 'Error', 'error');
        }
        return data;
    } catch (err) {
        showToast(err.message, 'error');
        return null;
    }
}

// ============ LOAD DASHBOARD ============
async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/api/withdrawals/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;
        updateStatsUI(data.stats);
        loadMiniChart(data.miniChart || []);
    } catch (err) {
        console.error('Dashboard error:', err);
    }
}

function updateStatsUI(stats) {
    const s = id => document.getElementById(id);
    const fmt = n => (n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (s('s-pending'))    s('s-pending').textContent    = stats.pendingCount    || 0;
    if (s('sa-pending'))   s('sa-pending').textContent   = fmt(stats.pendingAmount);
    if (s('s-processing')) s('s-processing').textContent = stats.processingCount || 0;
    if (s('sa-processing'))s('sa-processing').textContent= fmt(stats.processingAmount);
    if (s('s-completed'))  s('s-completed').textContent  = stats.completedCount  || 0;
    if (s('sa-completed')) s('sa-completed').textContent = fmt(stats.completedAmount);
    if (s('s-failed'))     s('s-failed').textContent     = stats.failedCount     || 0;
    if (s('sa-failed'))    s('sa-failed').textContent    = fmt(stats.failedAmount);
    if (s('s-flagged'))    s('s-flagged').textContent    = stats.flaggedCount    || 0;
    if (s('s-total'))      s('s-total').textContent      = stats.totalCount      || 0;
    if (s('sa-total'))     s('sa-total').textContent     = fmt(stats.totalAmount);
    if (s('s-fees'))       s('s-fees').textContent       = fmt(stats.totalFees);
    if (s('s-refunded'))   s('s-refunded').textContent   = fmt(stats.totalRefunded);

    if (s('pendingBadge'))    s('pendingBadge').textContent    = stats.pendingCount    || 0;
    if (s('processingBadge')) s('processingBadge').textContent = stats.processingCount || 0;
    if (s('flaggedBadge'))    s('flaggedBadge').textContent    = stats.flaggedCount    || 0;
    if (s('notifCount'))      s('notifCount').textContent      = (stats.pendingCount || 0) + (stats.flaggedCount || 0);
}

async function loadBadgeCounts() {
    try {
        const res = await fetch(`${API_URL}/api/withdrawals/admin/badge-counts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;
        const s = id => document.getElementById(id);
        if (s('pendingBadge'))    s('pendingBadge').textContent    = data.pending    || 0;
        if (s('processingBadge')) s('processingBadge').textContent = data.processing || 0;
        if (s('flaggedBadge'))    s('flaggedBadge').textContent    = data.flagged    || 0;
        if (s('notifCount'))      s('notifCount').textContent      = (data.pending || 0) + (data.flagged || 0);
    } catch (err) { console.error('Badge counts error:', err); }
}

// ============ LOAD WITHDRAWALS TABLE ============
async function loadWithdrawals(page = 1, key = 'all') {
    const tbody = document.getElementById(`tbody-${key}`);
    if (!tbody) return;

    try {
        tbody.innerHTML = `<tr><td colspan="14" style="text-align:center;padding:20px;">Loading...</td></tr>`;

        const search  = document.getElementById(`search-${key}`)?.value?.trim()   || '';
        const status  = document.getElementById(`statusFilter-${key}`)?.value     || 'all';
        const period  = document.getElementById(`periodFilter-${key}`)?.value     || 'all';
        const userVal = document.getElementById(`userInput-${key}`)?.value?.trim()|| '';

        const sectionStatus = { pending:'pending', processing:'processing', completed:'completed', failed:'failed', flagged:'flagged' };
        const finalStatus = key !== 'all' ? sectionStatus[key] : (status !== 'all' ? status : '');

        const params = new URLSearchParams({
            page, limit: pagination.limit, q: search,
            ...(finalStatus && { status: finalStatus }),
            ...(period !== 'all' && { period }),
            ...(userVal && { username: userVal }),
        });

        const res = await fetch(`${API_URL}/api/withdrawals/admin/all?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();

        allWithdrawals = data.withdrawals || [];
        pagination = {
            page:  data.currentPage  || 1,
            limit: data.limit        || 10,
            total: data.count        || 0,
            pages: data.totalPages   || 1
        };

        const label = document.getElementById(`totalLabel-${key}`);
        if (label) label.textContent = `(${pagination.total} records)`;

        if (data.stats) updateStatsUI(data.stats);

        buildTableHead(key);
        renderWithdrawals(key);
        renderPagination(key);

    } catch (err) {
        console.error(err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="14" style="text-align:center;color:red;">Error loading data</td></tr>`;
    }
}

// ============ BUILD TABLE HEAD ============
function buildTableHead(key) {
    const thead = document.getElementById(`thead-${key}`);
    if (!thead) return;
    thead.innerHTML = `<tr>
        <th class="checkbox-cell"><input type="checkbox" id="selectAll-${key}" onchange="toggleSelectAll('${key}')"></th>
        <th class="sn-cell">S/N</th>
        <th>User</th>
        <th>Account Name</th>
        <th>Account No.</th>
        <th>Bank Name</th>
        <th>Amount</th>
        <th>Fee</th>
        <th>Before</th>
        <th>After</th>
        <th>Reference</th>
        <th>Status</th>
        <th>Flag</th>
        <th>Date & Time</th>
        <th>Actions</th>
    </tr>`;
}

// ============ RENDER TABLE ============
function renderWithdrawals(key) {
    const tbody = document.getElementById(`tbody-${key}`);
    tbody.innerHTML = '';

    if (allWithdrawals.length === 0) {
        tbody.innerHTML = `<tr><td colspan="15" style="text-align:center;padding:40px;">No withdrawals found</td></tr>`;
        return;
    }

    const startSn = (pagination.page - 1) * pagination.limit;

    allWithdrawals.forEach((w, index) => {
        const tr = document.createElement('tr');
        if (selectedWithdrawals.includes(w._id)) tr.classList.add('selected');

        let statusClass = 'status-pending';
        if (w.status === 'completed')       statusClass = 'status-completed';
        else if (w.status === 'processing') statusClass = 'status-processing';
        else if (w.status === 'failed')     statusClass = 'status-failed';
        else if (w.status === 'rejected')   statusClass = 'status-rejected';

        const flagHtml = w.flagged
            ? `<span style="color:var(--purple);font-size:14px;" title="${(w.flagReasons||[]).join(', ')}">⚠️</span>`
            : `<span style="color:var(--success);">✓</span>`;

        let actionBtns = `<button class="btn btn-view" onclick="viewWithdrawal('${w._id}')"><i class="fas fa-eye"></i></button>`;
        if (w.status === 'pending' || w.status === 'processing') {
            actionBtns += `<button class="btn btn-approve" onclick="confirmAction('approve','${w._id}','${esc(w.username||'')}','${(w.amount||0).toLocaleString()}')"><i class="fas fa-check"></i></button>`;
            actionBtns += `<button class="btn btn-reject"  onclick="confirmAction('reject','${w._id}','${esc(w.username||'')}','${(w.amount||0).toLocaleString()}')"><i class="fas fa-times"></i></button>`;
        }
        if (w.status === 'failed' || w.status === 'rejected') {
            actionBtns += `<button class="btn btn-refund" onclick="confirmAction('refund','${w._id}','${esc(w.username||'')}','${(w.amount||0).toLocaleString()}')"><i class="fas fa-undo"></i></button>`;
        }

        tr.innerHTML = `
            <td class="checkbox-cell"><input type="checkbox" ${selectedWithdrawals.includes(w._id) ? 'checked' : ''} onchange="toggleSelect('${w._id}','${key}')"></td>
            <td class="sn-cell">${startSn + index + 1}</td>
            <td><strong>${esc(w.username || '—')}</strong><br><small style="color:var(--text-muted)">${esc(w.user?.email || '')}</small></td>
            <td>${esc(w.accountName || '—')}</td>
            <td>${esc(w.accountNumber || '—')} <i class="fas fa-copy copy-icon" onclick="copyToClipboard('${w.accountNumber}')"></i></td>
            <td>${esc(w.bankName || '—')}</td>
            <td><span class="amount-highlight">₦${(w.amount||0).toLocaleString()}</span></td>
            <td>₦${(w.fee||0).toLocaleString()}</td>
            <td style="color:var(--text-muted)">₦${(w.balanceBefore||0).toLocaleString()}</td>
            <td style="color:var(--success);font-weight:600;">₦${(w.balanceAfter||0).toLocaleString()}</td>
            <td><small>${esc(w.reference || '—')}</small> <i class="fas fa-copy copy-icon" onclick="copyToClipboard('${w.reference}')"></i></td>
            <td><span class="status-badge ${statusClass}">${w.status}</span></td>
            <td>${flagHtml}</td>
            <td><strong>${new Date(w.createdAt).toLocaleDateString()}</strong><br><small>${new Date(w.createdAt).toLocaleTimeString()}</small></td>
            <td><div class="action-btns">${actionBtns}</div></td>
        `;
        tbody.appendChild(tr);
    });

    updateBulkBar(key);
}

// ============ LOAD USER DATA ============
async function loadUserData(key) {
    const username = document.getElementById(`userInput-${key}`)?.value?.trim();
    if (!username) return showToast('Enter a username', 'warning');
    loadWithdrawals(1, key);
}

function clearUserData(key) {
    const inp = document.getElementById(`userInput-${key}`);
    if (inp) inp.value = '';
    loadWithdrawals(1, key);
}

// ============ ACTIONS ============
function confirmAction(action, id, username, amount) {
    const colors = { approve: 'var(--success)', reject: 'var(--danger)', refund: 'var(--purple)' };
    const icons  = { approve: 'fa-check', reject: 'fa-times', refund: 'fa-undo' };
    const msgs   = {
        approve: 'Approve this withdrawal and trigger payment?',
        reject:  'Reject this withdrawal? User will be notified.',
        refund:  'Refund the full amount to user balance?'
    };

    document.getElementById('confirmTitle').innerHTML = `<i class="fas ${icons[action]}" style="color:${colors[action]}"></i> ${cap(action)} Withdrawal`;
    document.getElementById('confirmMsg').textContent  = msgs[action];
    document.getElementById('confirmDetails').innerHTML= `<p><strong>User:</strong> ${username}</p><p><strong>Amount:</strong> ₦${amount}</p>`;

    const btn = document.getElementById('confirmYes');
    btn.style.background = colors[action];
    btn.innerHTML = `<i class="fas ${icons[action]}"></i> Yes, ${cap(action)}`;
    btn.onclick = () => executeAction(action, id);

    document.getElementById('confirmModal').classList.add('active');
}

async function executeAction(action, id) {
    closeModal('confirmModal');
    await apiCall(`/api/withdrawals/admin/${id}/${action}`, 'POST');
}

async function bulkAction(key, action) {
    if (selectedWithdrawals.length === 0) return showToast('No items selected', 'warning');
    if (!confirm(`${cap(action)} ${selectedWithdrawals.length} withdrawal(s)?`)) return;
    const data = await apiCall(`/api/withdrawals/admin/bulk-${action}`, 'POST', { ids: selectedWithdrawals });
    if (data?.success) { deselectAll(key); }
}

// ============ VIEW MODAL ============
async function viewWithdrawal(id) {
    try {
        const res = await fetch(`${API_URL}/api/withdrawals/admin/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return showToast('Failed to load details', 'error');
        const w = data.withdrawal;
        currentWithdrawal = w;

        let statusClass = 'status-pending';
        if (w.status === 'completed')       statusClass = 'status-completed';
        else if (w.status === 'processing') statusClass = 'status-processing';
        else if (w.status === 'failed')     statusClass = 'status-failed';
        else if (w.status === 'rejected')   statusClass = 'status-rejected';

        document.getElementById('viewModalContent').innerHTML = `
            <div class="detail-card">
                <h4>User Information</h4>
                <p><strong>Username:</strong> ${esc(w.username || w.user?.username || '—')}</p>
                <p><strong>Email:</strong> ${esc(w.user?.email || '—')}</p>
            </div>
            <div class="detail-card">
                <h4>Bank Details</h4>
                <p><strong>Account Name:</strong> ${esc(w.accountName || '—')}</p>
                <p><strong>Account Number:</strong> ${esc(w.accountNumber || '—')} <i class="fas fa-copy copy-icon" onclick="copyToClipboard('${w.accountNumber}')"></i></p>
                <p><strong>Bank Name:</strong> ${esc(w.bankName || '—')}</p>
                <p><strong>Bank Code:</strong> ${esc(w.bankCode || '—')}</p>
            </div>
            <div class="detail-card">
                <h4>Payment Details</h4>
                <p><strong>Amount:</strong> <span style="color:var(--primary);font-size:18px;font-weight:700;">₦${(w.amount||0).toLocaleString()}</span></p>
                <p><strong>Fee Charged:</strong> ₦${(w.fee||0).toLocaleString()}</p>
                <p><strong>Total Deducted:</strong> <strong>₦${(w.totalDeducted||0).toLocaleString()}</strong></p>
                <p><strong>Reference:</strong> ${esc(w.reference || '—')} <i class="fas fa-copy copy-icon" onclick="copyToClipboard('${w.reference}')"></i></p>
                <p><strong>Payment Method:</strong> ${esc(w.paymentMethod || '—')}</p>
            </div>
            <div class="detail-card">
                <h4>Wallet Status</h4>
                <div class="wallet-comparison">
                    <div class="wallet-box before"><h5>Before</h5><div class="amount">₦${(w.balanceBefore||0).toLocaleString()}</div></div>
                    <div class="wallet-box after"><h5>After</h5><div class="amount">₦${(w.balanceAfter||0).toLocaleString()}</div></div>
                    <div class="wallet-box current"><h5>Current</h5><div class="amount">₦${(w.user?.balance||0).toLocaleString()}</div></div>
                </div>
            </div>
            <div class="detail-card">
                <h4>Transaction Status</h4>
                <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${w.status?.toUpperCase()}</span></p>
                <p><strong>Flagged:</strong> ${w.flagged ? '⚠️ Yes — ' + (w.flagReasons||[]).join(', ') : '✓ No'}</p>
                <p><strong>Date:</strong> ${new Date(w.createdAt).toLocaleString()}</p>
                ${w.failureReason ? `<p><strong>Failure Reason:</strong> <span style="color:var(--danger)">${esc(w.failureReason)}</span></p>` : ''}
            </div>`;

        let footer = `<button class="modal-btn modal-btn-cancel" onclick="closeModal('viewModal')"><i class="fas fa-times"></i> Close</button>`;
        if (w.status === 'pending' || w.status === 'processing') {
            footer += `<button class="modal-btn modal-btn-approve" onclick="closeModal('viewModal');confirmAction('approve','${w._id}','${esc(w.username||'')}','${(w.amount||0).toLocaleString()}')"><i class="fas fa-check"></i> Approve</button>`;
            footer += `<button class="modal-btn modal-btn-reject"  onclick="closeModal('viewModal');confirmAction('reject','${w._id}','${esc(w.username||'')}','${(w.amount||0).toLocaleString()}')"><i class="fas fa-times"></i> Reject</button>`;
        }
        if (w.status === 'failed' || w.status === 'rejected') {
            footer += `<button class="modal-btn modal-btn-refund" onclick="closeModal('viewModal');confirmAction('refund','${w._id}','${esc(w.username||'')}','${(w.amount||0).toLocaleString()}')"><i class="fas fa-undo"></i> Refund</button>`;
        }
        document.getElementById('viewModalFooter').innerHTML = footer;
        document.getElementById('viewModal').classList.add('active');

    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ============ SELECTION & BULK ============
function toggleSelect(id, key) {
    if (selectedWithdrawals.includes(id)) selectedWithdrawals = selectedWithdrawals.filter(i => i !== id);
    else selectedWithdrawals.push(id);
    updateBulkBar(key);
    const tr = document.querySelector(`#tbody-${key} tr`);
    if (tr) tr.classList.toggle('selected', selectedWithdrawals.includes(id));
}

function toggleSelectAll(key) {
    const cb = document.getElementById(`selectAll-${key}`);
    selectedWithdrawals = cb?.checked ? allWithdrawals.map(w => w._id) : [];
    renderWithdrawals(key);
}

function deselectAll(key) {
    selectedWithdrawals = [];
    const cb = document.getElementById(`selectAll-${key}`);
    if (cb) cb.checked = false;
    renderWithdrawals(key);
    updateBulkBar(key);
}

function updateBulkBar(key) {
    const bar = document.getElementById(`bulk-${key}`);
    const cnt = document.getElementById(`bulkCount-${key}`);
    if (!bar) return;
    if (selectedWithdrawals.length > 0) {
        bar.classList.add('active');
        if (cnt) cnt.textContent = selectedWithdrawals.length;
    } else {
        bar.classList.remove('active');
    }
}

// ============ PAGINATION ============
function renderPagination(key) {
    const el = document.getElementById(`pag-${key}`);
    if (!el) return;

    const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
    const end   = Math.min(pagination.page * pagination.limit, pagination.total);

    let pageNums = '';
    for (let i = 1; i <= pagination.pages; i++) {
        pageNums += `<button class="page-btn ${i === pagination.page ? 'active-page' : ''}" onclick="loadWithdrawals(${i},'${key}')">${i}</button>`;
    }

    el.innerHTML = `
        <div class="pagination-info">Showing ${start} to ${end} of ${pagination.total}</div>
        <div class="pagination-controls">
            <button class="page-btn" ${pagination.page <= 1 ? 'disabled' : ''} onclick="loadWithdrawals(${pagination.page - 1},'${key}')">
                <i class="fas fa-chevron-left"></i>
            </button>
            ${pageNums}
            <button class="page-btn" ${pagination.page >= pagination.pages ? 'disabled' : ''} onclick="loadWithdrawals(${pagination.page + 1},'${key}')">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>`;
}

// ============ ANALYTICS ============
async function loadAnalytics() {
    try {
        const res = await fetch(`${API_URL}/api/withdrawals/admin/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;
        const a = data.analytics;

        const s = id => document.getElementById(id);
        const fmt = n => (n||0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2});

        if (s('a-successRate')) s('a-successRate').textContent = a.successRate + '%';
        if (s('a-avgAmount'))   s('a-avgAmount').textContent   = fmt(a.avgAmount);
        if (s('a-refundRate'))  s('a-refundRate').textContent  = a.refundRate  + '%';
        if (s('a-peakHour'))    s('a-peakHour').textContent    = a.peakHour ? `${a.peakHour}:00` : '—';
        if (s('a-volume'))      s('a-volume').textContent      = fmt(a.totalVolume);
        if (s('a-fees'))        s('a-fees').textContent        = fmt(a.totalFees);

        loadMainChart('daily');
        loadPieChart(a.statusBreakdown || {});
        loadHourlyChart(a.hourlyActivity || []);
        loadTopBanks(a.topBanks || []);
    } catch (err) { console.error('Analytics error:', err); }
}

async function loadChart(period, btn) {
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    loadMainChart(period);
}

async function loadMainChart(period) {
    try {
        const res = await fetch(`${API_URL}/api/withdrawals/admin/chart?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;
        const ctx = document.getElementById('mainChart')?.getContext('2d');
        if (!ctx) return;
        if (charts.main) charts.main.destroy();
        charts.main = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    { label:'Completed', data:data.completed, backgroundColor:'rgba(16,185,129,0.8)',  borderRadius:6 },
                    { label:'Pending',   data:data.pending,   backgroundColor:'rgba(245,158,11,0.8)',  borderRadius:6 },
                    { label:'Failed',    data:data.failed,    backgroundColor:'rgba(239,68,68,0.8)',   borderRadius:6 },
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { x: { stacked: false }, y: { beginAtZero: true } }
            }
        });
    } catch (err) { console.error('Chart error:', err); }
}

function loadMiniChart(chartData) {
    const ctx = document.getElementById('dashMiniChart')?.getContext('2d');
    if (!ctx) return;
    if (charts.mini) charts.mini.destroy();
    charts.mini = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [
                { label:'Completed', data:chartData.map(d => d.completed), backgroundColor:'rgba(16,185,129,0.7)', borderRadius:6 },
                { label:'Pending',   data:chartData.map(d => d.pending),   backgroundColor:'rgba(245,158,11,0.7)', borderRadius:6 },
                { label:'Failed',    data:chartData.map(d => d.failed),    backgroundColor:'rgba(239,68,68,0.7)',  borderRadius:6 },
            ]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'top' } }, scales:{ y:{ beginAtZero:true } } }
    });
}

function loadPieChart(breakdown) {
    const ctx = document.getElementById('pieChart')?.getContext('2d');
    if (!ctx || !breakdown) return;
    if (charts.pie) charts.pie.destroy();
    charts.pie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(breakdown),
            datasets: [{ data: Object.values(breakdown), backgroundColor:['#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6'], borderWidth:2 }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
    });
}

function loadHourlyChart(hourly) {
    const ctx = document.getElementById('hourlyChart')?.getContext('2d');
    if (!ctx) return;
    const labels = Array.from({length:24}, (_,i) => `${i}:00`);
    const counts = Array(24).fill(0);
    hourly.forEach(h => { if (h._id >= 0 && h._id < 24) counts[h._id] = h.count; });
    if (charts.hourly) charts.hourly.destroy();
    charts.hourly = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets:[{ label:'Withdrawals', data:counts, backgroundColor:'rgba(0,170,255,0.7)', borderRadius:4 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
    });
}

function loadTopBanks(banks) {
    const total = banks.reduce((s,b) => s + b.totalAmount, 0);
    const tbody = document.getElementById('topBanksBody');
    if (!tbody) return;
    tbody.innerHTML = banks.length
        ? banks.map((b,i) => `<tr>
            <td>${i+1}</td>
            <td><strong>${esc(b.bankName)}</strong></td>
            <td>₦${(b.totalAmount||0).toLocaleString()}</td>
            <td>${b.count}</td>
            <td>₦${(b.avgAmount||0).toLocaleString()}</td>
            <td>${total ? ((b.totalAmount/total)*100).toFixed(1)+'%' : '0%'}</td>
          </tr>`).join('')
        : `<tr><td colspan="6" style="text-align:center;padding:30px;">No data</td></tr>`;
}

// ============ TOP WITHDRAWALS ============
async function loadTopWithdrawals() {
    const period = document.getElementById('topPeriod')?.value || '1week';
    const limit  = document.getElementById('topLimit')?.value  || 10;

    try {
        const res = await fetch(`${API_URL}/api/withdrawals/admin/top?period=${period}&limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return showToast('Failed to load', 'error');
        topData = data.top || [];
        topDataFiltered = [...topData];
        renderTopTable(topDataFiltered);
    } catch (err) { showToast(err.message, 'error'); }
}

function filterTopTable() {
    const q = document.getElementById('topSearch')?.value?.toLowerCase() || '';
    topDataFiltered = topData.filter(r =>
        (r.username||'').toLowerCase().includes(q) ||
        (r.accountName||'').toLowerCase().includes(q) ||
        (r.accountNumber||'').includes(q) ||
        (r.bankName||'').toLowerCase().includes(q)
    );
    renderTopTable(topDataFiltered);
}

function renderTopTable(rows) {
    const tbody = document.getElementById('topTableBody');
    if (!tbody) return;

    const rankBadge = i => {
        if (i===0) return `<span class="rank-1">🥇 #1</span>`;
        if (i===1) return `<span class="rank-2">🥈 #2</span>`;
        if (i===2) return `<span class="rank-3">🥉 #3</span>`;
        return `<span class="rank-n">#${i+1}</span>`;
    };

    tbody.innerHTML = rows.length
        ? rows.map((r,i) => `<tr>
            <td>${rankBadge(i)}</td>
            <td><strong>${esc(r.username||'—')}</strong></td>
            <td>${esc(r.accountName||'—')}</td>
            <td>${esc(r.accountNumber||'—')} <i class="fas fa-copy copy-icon" onclick="copyToClipboard('${r.accountNumber}')"></i></td>
            <td>${esc(r.bankName||'—')}</td>
            <td style="font-weight:700;color:var(--primary);">₦${(r.totalAmount||0).toLocaleString()}</td>
            <td>${r.count||0}</td>
            <td>₦${(r.avgAmount||0).toLocaleString()}</td>
            <td><strong>${new Date(r.lastWithdrawal).toLocaleDateString()}</strong></td>
            <td><button class="btn btn-view" onclick="filterByUser('${esc(r.username)}')"><i class="fas fa-eye"></i> View</button></td>
          </tr>`).join('')
        : `<tr><td colspan="10" style="text-align:center;padding:40px;">No data for this period</td></tr>`;
}

function filterByUser(username) {
    showSection('all');
    const inp = document.getElementById('search-all');
    if (inp) { inp.value = username; loadWithdrawals(1, 'all'); }
}

function exportTopWithdrawals() {
    if (!topDataFiltered.length) return showToast('No data to export', 'warning');
    const rows = [['Rank','Username','Account Name','Account No','Bank','Total Amount','Count','Avg Amount','Last Withdrawal']];
    topDataFiltered.forEach((r,i) => rows.push([i+1, r.username, r.accountName, r.accountNumber, r.bankName, r.totalAmount, r.count, r.avgAmount, new Date(r.lastWithdrawal).toLocaleDateString()]));
    downloadCSV(rows, `top-withdrawals-${Date.now()}.csv`);
    showToast('Exported!', 'success');
}

// ============ EXPORT CSV ============
async function exportTable(key) {
    const search = document.getElementById(`search-${key}`)?.value?.trim() || '';
    const sectionStatus = { pending:'pending', processing:'processing', completed:'completed', failed:'failed', flagged:'flagged' };
    const status = key !== 'all' ? sectionStatus[key] : '';

    try {
        const params = new URLSearchParams({ page:1, limit:10000, q:search, ...(status && {status}) });
        const res = await fetch(`${API_URL}/api/withdrawals/admin/all?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success || !data.withdrawals.length) return showToast('No data to export', 'warning');

        const rows = [['Username','Email','Account Name','Account No','Bank','Amount','Fee','Total Deducted','Balance Before','Balance After','Reference','Status','Flagged','Date']];
        data.withdrawals.forEach(w => rows.push([
            w.username, w.user?.email, w.accountName, w.accountNumber,
            w.bankName, w.amount, w.fee, w.totalDeducted,
            w.balanceBefore, w.balanceAfter, w.reference, w.status,
            w.flagged ? 'Yes' : 'No', new Date(w.createdAt).toLocaleString()
        ]));
        downloadCSV(rows, `withdrawals-${key}-${Date.now()}.csv`);
        showToast('CSV exported!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
}

function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename;
    a.click();
}

// ============ LOCAL NOTES (Admin Notepad) ============
const NOTES_KEY = 'earncial_withdraw_notes';

function loadNotes() {
    const area = document.getElementById('adminNotesArea');
    if (!area) return;
    area.value = localStorage.getItem(NOTES_KEY) || '';
}

function saveNote() {
    const area = document.getElementById('adminNotesArea');
    if (!area) return;
    localStorage.setItem(NOTES_KEY, area.value);
    showToast('Note saved!', 'success');
}

function clearNote() {
    if (!confirm('Clear all notes?')) return;
    localStorage.removeItem(NOTES_KEY);
    const area = document.getElementById('adminNotesArea');
    if (area) area.value = '';
    showToast('Notes cleared', 'info');
}

// ============ MODALS ============
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
});

// ============ UTILS ============
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function cap(s) { return String(s).charAt(0).toUpperCase() + s.slice(1); }
function copyToClipboard(txt) { navigator.clipboard.writeText(txt||''); showToast('Copied!', 'info'); }

// ============ WINDOW EXPORTS ============
window.showSection          = showSection;
window.loadWithdrawals      = loadWithdrawals;
window.loadUserData         = loadUserData;
window.clearUserData        = clearUserData;
window.toggleSelect         = toggleSelect;
window.toggleSelectAll      = toggleSelectAll;
window.deselectAll          = deselectAll;
window.bulkAction           = bulkAction;
window.viewWithdrawal       = viewWithdrawal;
window.confirmAction        = confirmAction;
window.closeModal           = closeModal;
window.exportTable          = exportTable;
window.loadTopWithdrawals   = loadTopWithdrawals;
window.filterTopTable       = filterTopTable;
window.exportTopWithdrawals = exportTopWithdrawals;
window.filterByUser         = filterByUser;
window.loadChart            = loadChart;
window.saveNote             = saveNote;
window.clearNote            = clearNote;
window.togglePlatformSidebar= togglePlatformSidebar;
window.closePlatformSidebar = closePlatformSidebar;
window.openPageSidebar      = openPageSidebar;
window.closePageSidebar     = closePageSidebar;
window.toggleTheme          = toggleTheme;
window.logout               = logout;
window.copyToClipboard      = copyToClipboard;