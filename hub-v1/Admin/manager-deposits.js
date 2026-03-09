// ================================================
// MANAGER DEPOSITS - API URL VERSION
// ================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

let allDeposits = [];
let selectedDeposits = [];
let currentDeposit = null;
let editingWallet = null;
let pagination = { page: 1, limit: 10, total: 0, pages: 1 };

if (!token) console.warn('No token');

document.addEventListener('DOMContentLoaded', () => {
    loadDeposits(1);
    loadTheme();
});

// ============ LOAD DATA (UPDATED) ============
async function loadDeposits(page = 1) {
    const tbody = document.getElementById('depositsTableBody');
    try {
        tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 20px;">Loading...</td></tr>`;

        const status = document.getElementById('filterStatus').value;
        const type = document.getElementById('filterType').value;
        const search = document.getElementById('searchInput').value;
        
        const params = new URLSearchParams({
            page: page, limit: 10, search: search,
            ...(status !== 'all' && { status }),
            ...(type !== 'all' && { type })
        });

        const res = await fetch(`${API_URL}/api/deposits/admin/all?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch data');

        const data = await res.json();
        
        allDeposits = data.deposits || [];
        pagination = {
            page: data.currentPage || 1,
            limit: 10,
            total: data.count || 0,
            pages: data.totalPages || 1
        };

        renderDeposits();
        renderPagination();
        
        if (data.stats) {
            updateStatsUI(data.stats);
        }

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; color: red;">Error loading data</td></tr>`;
    }
}


// ============ DISPLAY BACKEND STATS ============
function updateStatsUI(stats) {
    // Helper function don saka kalar kudi da comma
    const fmt = n => '₦' + (n || 0).toLocaleString();
    const num = n => (n || 0).toLocaleString();

    // 1. MANUAL STACK (Wanda ya ki nunawa)
    // Muna nuna yawan mutane (Count) da kuma adadin kudin (Amount)
    if(document.getElementById('manualCount')) 
        document.getElementById('manualCount').textContent = stats.manualCount || 0;
    
    if(document.getElementById('manualAmount')) 
        document.getElementById('manualAmount').textContent = fmt(stats.manualRevenue);

    // 2. TOTAL FEES STACK (Wanda ashe bashi da Field a Schema)
    // Tunda yanzu ka kara chargeFee a Schema, wannan zai fara aiki
    if(document.getElementById('totalFees')) 
        document.getElementById('totalFees').textContent = fmt(stats.totalFees);

    // 3. PENDING STACK
    if(document.getElementById('pendingCount')) 
        document.getElementById('pendingCount').textContent = stats.pendingCount || 0;
    
    if(document.getElementById('pendingAmount'))
        document.getElementById('pendingAmount').textContent = num(stats.pendingRevenue);

    // 4. VERIFIED STACK
    if(document.getElementById('verifiedCount')) 
        document.getElementById('verifiedCount').textContent = stats.verifiedCount || 0;
    
    if(document.getElementById('verifiedAmount')) 
        document.getElementById('verifiedAmount').textContent = fmt(stats.totalRevenue);

    // 5. FAILED STACK
    if(document.getElementById('failedCount')) 
        document.getElementById('failedCount').textContent = stats.failedCount || 0;
    
    if(document.getElementById('failedAmount')) 
        document.getElementById('failedAmount').textContent = num(stats.failedRevenue);

    // 6. BIG CARDS (REVENUE & PAID)
    if(document.getElementById('totalCount')) 
        document.getElementById('totalCount').textContent = stats.totalCount || 0;
    
    if(document.getElementById('totalRevenue')) 
        document.getElementById('totalRevenue').textContent = fmt(stats.totalRevenue);
    
    if(document.getElementById('totalPaid')) 
        document.getElementById('totalPaid').textContent = fmt(stats.totalRevenue);

    // 7. TOTAL DEPOSITS (Verified + Pending)
    if(document.getElementById('totalAmount'))
        document.getElementById('totalAmount').textContent = fmt((stats.totalRevenue || 0) + (stats.pendingRevenue || 0));
}

// ============ RENDER TABLE ============
function renderDeposits() {
    const tbody = document.getElementById('depositsTableBody');
    tbody.innerHTML = '';

    if (allDeposits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 40px;">No deposits found</td></tr>`;
        return;
    }

    const startSn = (pagination.page - 1) * pagination.limit;

    allDeposits.forEach((deposit, index) => {
        const tr = document.createElement('tr');
        const id = deposit.id;
        const txId = deposit.reference || 'N/A';
        
        if (selectedDeposits.includes(id)) tr.classList.add('selected');

        let statusClass = 'status-pending', statusText = 'Pending';
        if (deposit.status === 'success' || deposit.status === 'verified') { statusClass = 'status-verified'; statusText = 'Verified'; }
        else if (deposit.status === 'failed') { statusClass = 'status-failed'; statusText = 'Failed'; }

        const wBefore = deposit.walletBefore ?? 0;
        const wAfter = deposit.walletAfter ?? 0;
        const wCurrent = deposit.walletCurrent ?? 0;

        const isPaystack = deposit.type === 'paystack';
        const iconClass = isPaystack ? 'icon-paystack' : 'icon-manual';
        const iconFa = isPaystack ? 'fa-bolt' : 'fa-hand-holding-usd';

        tr.innerHTML = `
            <td class="checkbox-cell"><input type="checkbox" ${selectedDeposits.includes(id) ? 'checked' : ''} onchange="toggleSelect('${id}')"></td>
            <td class="sn-cell">${startSn + index + 1}</td>
            <td><strong>${deposit.username}</strong><br><small style="color:var(--text-muted)">${deposit.email}</small></td>
            <td><div style="display:flex;align-items:center;"><span class="payment-icon ${iconClass}"><i class="fas ${iconFa}"></i></span>${deposit.paymentMethod}</div></td>
            <td><span class="amount-highlight">₦${(deposit.amount||0).toLocaleString()}</span></td>
            <td>₦${(deposit.chargeFee||0).toLocaleString()}</td>
            <td class="wallet-info">₦${wBefore.toLocaleString()}</td>
            <td class="wallet-info" style="color:var(--success);font-weight:600;">₦${wAfter.toLocaleString()}</td>
            <td class="wallet-info" style="color:var(--primary);font-weight:600;">₦${wCurrent.toLocaleString()}</td>
            <td><small>${txId}</small> <i class="fas fa-copy copy-icon" onclick="copyToClipboard('${txId}')"></i></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td><strong>${new Date(deposit.createdAt).toLocaleDateString()}</strong><br><small>${new Date(deposit.createdAt).toLocaleTimeString()}</small></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-view" onclick="viewDeposit('${id}')"><i class="fas fa-eye"></i></button>
                    ${deposit.status === 'pending' ? `<button class="btn btn-verify" onclick="verifyDeposit('${txId}')"><i class="fas fa-check"></i></button>` : ''}
                    <button class="btn btn-delete" onclick="showDeleteModal('${id}')"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updateBulkBar();
}

// ============ 1. WANNAN SHINE ZAI SAKA FILTERS DIN AIKI ============
function applyFilters() {
    console.log("🔍 Ana tacce bayana (Filtering)...");
    loadDeposits(1); // Duk sanda aka canza filter, a dawo page na farko
}

// ============ 2. WANNAN SHINE NA SEARCH (BINCIKE) ============
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyFilters(); // Zai jira ka gama rubutu kafin ya yi search
    }, 500); 
});

// ============ 3. DOLE KA SAKA WANNAN A KASAN FILE DIN KA ============
window.applyFilters = applyFilters;

// ============ ACTIONS ============
async function verifyDeposit(txId) {
    if(!confirm('Verify?')) return;
    await apiCall(`/api/deposits/admin/${txId}/verify`, 'POST');
}

async function confirmDelete() {
    if(!currentDeposit) return;
    await apiCall(`/api/deposits/admin/${currentDeposit.id}`, 'DELETE');
    closeModal('deleteModal');
}

async function saveWalletEdit() {
    if(!editingWallet || !currentDeposit) return;
    const amount = parseFloat(document.getElementById('walletEditInput').value);
    if(isNaN(amount)) return alert('Invalid amount');
    await apiCall(`/api/deposits/admin/${currentDeposit.id}/wallet-edit`, 'PUT', { type: editingWallet, amount });
    editingWallet = null;
}

async function bulkAction(action) {
    if(selectedDeposits.length === 0) return;
    if(!confirm(`${action} selected?`)) return;
    await apiCall(`/api/deposits/admin/bulk`, 'POST', { action, ids: selectedDeposits });
    deselectAll();
}

async function apiCall(endpoint, method, body = null) {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: body ? JSON.stringify(body) : null
        });
        const data = await res.json();
        if(data.success) {
            showToast(data.message || 'Success', 'success');
            loadDeposits(pagination.page);
        } else {
            showToast(data.message, 'error');
        }
    } catch(err) {
        showToast(err.message, 'error');
    }
}

// ============ UTILS ============
function viewDeposit(id) {
    currentDeposit = allDeposits.find(d => d.id === id);
    if (!currentDeposit) return;
    
    document.getElementById('modalUsername').innerText = currentDeposit.username;
    document.getElementById('modalEmail').innerText = currentDeposit.email;
    document.getElementById('modalPaymentMethod').innerText = currentDeposit.paymentMethod;
    document.getElementById('modalReference').innerText = currentDeposit.reference;
    document.getElementById('modalAmount').innerText = `₦${currentDeposit.amount.toLocaleString()}`;
    document.getElementById('modalCharge').innerText = `₦${currentDeposit.chargeFee.toLocaleString()}`;
    document.getElementById('modalWalletBefore').innerText = `₦${(currentDeposit.walletBefore||0).toLocaleString()}`;
    document.getElementById('modalWalletAfter').innerText = `₦${(currentDeposit.walletAfter||0).toLocaleString()}`;
    document.getElementById('modalWalletCurrent').innerText = `₦${(currentDeposit.walletCurrent||0).toLocaleString()}`;
    
    let statusClass = currentDeposit.status === 'success' || currentDeposit.status === 'verified' ? 'status-verified' : currentDeposit.status === 'failed' ? 'status-failed' : 'status-pending';
    document.getElementById('modalStatus').innerHTML = `<span class="status-badge ${statusClass}">${currentDeposit.status.toUpperCase()}</span>`;
    document.getElementById('modalDate').innerText = new Date(currentDeposit.createdAt).toLocaleString();

    const btnBox = document.getElementById('modalActionButtons');
    const txId = currentDeposit.reference;
    if(currentDeposit.status === 'pending') {
        btnBox.innerHTML = `<button class="modal-btn modal-btn-verify" onclick="verifyDeposit('${txId}')">Verify</button><button class="modal-btn modal-btn-delete" onclick="showDeleteModal('${id}')">Delete</button>`;
    } else {
        btnBox.innerHTML = `<button class="modal-btn modal-btn-delete" onclick="showDeleteModal('${id}')">Delete</button><button class="modal-btn modal-btn-cancel" onclick="closeModal('depositModal')">Close</button>`;
    }
    document.getElementById('depositModal').classList.add('active');
}

function showDeleteModal(id) {
    currentDeposit = allDeposits.find(d => d.id === id);
    document.getElementById('deleteUsername').innerText = currentDeposit.username;
    document.getElementById('deleteAmount').innerText = `₦${currentDeposit.amount.toLocaleString()}`;
    document.getElementById('deleteReference').innerText = currentDeposit.reference;
    closeModal('depositModal');
    document.getElementById('deleteModal').classList.add('active');
}

function editWallet(type) {
    editingWallet = type;
    const key = 'wallet' + type.charAt(0).toUpperCase() + type.slice(1);
    const val = currentDeposit[key] || 0;
    document.getElementById(`modalWallet${type.charAt(0).toUpperCase()+type.slice(1)}`).innerHTML = `<input id="walletEditInput" class="wallet-edit-input" onblur="saveWalletEdit()" value="${val}">`;
    document.getElementById('walletEditInput').focus();
}

function showToast(msg, type) {
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = `<i class="fas fa-info-circle"></i> ${msg}`;
    document.getElementById('toastContainer').appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ============ PROFESSIONAL PAGINATION (FIXED) ============
function renderPagination() {
    const pageNumbersContainer = document.getElementById('pageNumbers');
    
    // Lissafin inda aka tsaya
    document.getElementById('showingStart').innerText = allDeposits.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
    document.getElementById('showingEnd').innerText = Math.min(pagination.page * pagination.limit, pagination.total);
    document.getElementById('totalItems').innerText = pagination.total;

    // Generate lambobin page daya bayan daya
    let html = '';
    for (let i = 1; i <= pagination.pages; i++) {
        const activeClass = i === pagination.page ? 'active' : '';
        html += `<button class="page-btn ${activeClass}" onclick="loadDeposits(${i})">${i}</button>`;
    }
    
    pageNumbersContainer.innerHTML = html;

    // Control Next/Prev button states
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if(prevBtn) prevBtn.disabled = pagination.page === 1;
    if(nextBtn) nextBtn.disabled = pagination.page === pagination.pages;
}

function previousPage() { if (pagination.page > 1) loadDeposits(pagination.page - 1); }
function nextPage() { if (pagination.page < pagination.pages) loadDeposits(pagination.page + 1); }

// Standard Utils
function toggleSelect(id) { if(selectedDeposits.includes(id)) selectedDeposits = selectedDeposits.filter(i=>i!==id); else selectedDeposits.push(id); renderDeposits(); }
function toggleSelectAll() { if(document.getElementById('selectAll').checked) selectedDeposits = allDeposits.map(d=>d.id); else selectedDeposits = []; renderDeposits(); }
function deselectAll() { selectedDeposits = []; document.getElementById('selectAll').checked = false; renderDeposits(); }
function updateBulkBar() { 
    const bar = document.getElementById('bulkActionsBar'); 
    if(selectedDeposits.length > 0) { bar.classList.add('active'); document.getElementById('selectedCount').innerText = selectedDeposits.length; } else bar.classList.remove('active'); 
}
function copyToClipboard(txt) { navigator.clipboard.writeText(txt); showToast('Copied', 'info'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); editingWallet = null; }
function openSidebar() { document.getElementById('sidebar').classList.add('active'); document.getElementById('sidebarOverlay').classList.add('active'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('active'); document.getElementById('sidebarOverlay').classList.remove('active'); }
function toggleTheme() { document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light'); }
function loadTheme() { if(localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode'); }

// EXPORTS
window.loadDeposits = loadDeposits;
window.filterByStatus = s => { document.getElementById('filterStatus').value = s; loadDeposits(1); };
window.filterByType = t => { document.getElementById('filterType').value = t; loadDeposits(1); };
window.loadUserDeposits = () => loadDeposits(1);
window.exportData = () => showToast('Coming soon', 'info');
window.toggleSelect = toggleSelect;
window.toggleSelectAll = toggleSelectAll;
window.deselectAll = deselectAll;
window.bulkVerify = () => bulkAction('verify');
window.bulkDelete = () => bulkAction('delete');
window.viewDeposit = viewDeposit;
window.verifyDeposit = verifyDeposit;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;
window.closeModal = closeModal;
window.editWallet = editWallet;
window.saveWalletEdit = saveWalletEdit;
window.copyToClipboard = copyToClipboard;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.previousPage = previousPage;
window.nextPage = nextPage;