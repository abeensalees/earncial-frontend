
// ================================================
// EARNCIAL - ADMIN USERS MANAGER - COMPLETE FIXED
// ✅ All Issues Resolved + New Advanced Features
// ================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

// Pagination
let currentPage = 1;
let totalPages = 1;
let limit = 50;

// Current user being viewed/edited
let currentUserId = null;

// Charts
let userGrowthChart = null;
let tasksChart = null;
let genderChart = null;

// ============ CHECK AUTH ============
if (!token) {
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

// ============ TOAST NOTIFICATION (NO ALERTS!) ============
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
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============ CUSTOM CONFIRM MODAL (NO BROWSER ALERTS) ============
function showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'custom-confirm-modal';
    modal.innerHTML = `
        <div class="confirm-modal-content">
            <div class="confirm-modal-header">
                <h3>${title}</h3>
            </div>
            <div class="confirm-modal-body">
                <p>${message}</p>
            </div>
            <div class="confirm-modal-footer">
                <button class="btn-secondary" onclick="this.closest('.custom-confirm-modal').remove()">
                    Cancel
                </button>
                <button class="btn-primary" id="confirmBtn">
                    Confirm
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#confirmBtn').addEventListener('click', () => {
        modal.remove();
        onConfirm();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ============ CUSTOM PROMPT MODAL (NO BROWSER PROMPTS) ============
function showPromptModal(title, message, defaultValue, onSubmit) {
    const modal = document.createElement('div');
    modal.className = 'custom-confirm-modal';
    modal.innerHTML = `
        <div class="confirm-modal-content">
            <div class="confirm-modal-header">
                <h3>${title}</h3>
            </div>
            <div class="confirm-modal-body">
                <p>${message}</p>
                <input type="text" id="promptInput" class="form-input" value="${defaultValue || ''}" placeholder="Enter value..." style="width: 100%; margin-top: 15px;">
            </div>
            <div class="confirm-modal-footer">
                <button class="btn-secondary" onclick="this.closest('.custom-confirm-modal').remove()">
                    Cancel
                </button>
                <button class="btn-primary" id="submitBtn">
                    Submit
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = modal.querySelector('#promptInput');
    input.focus();
    
    modal.querySelector('#submitBtn').addEventListener('click', () => {
        const value = input.value.trim();
        if (value) {
            modal.remove();
            onSubmit(value);
        } else {
            showToast('error', 'Error', 'Please enter a value');
        }
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('#submitBtn').click();
        }
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ============ FORMAT CURRENCY ============
function formatCurrency(amount) {
    return parseFloat(amount || 0).toLocaleString('en-NG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// ============ FORMAT DATE ============
function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
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

// ============ LOAD ADVANCED STATS & CHARTS ============
async function loadStats() {
    try {
        const period = document.getElementById('chartPeriod').value;

        console.log('📊 Loading stats with period:', period);

        const res = await fetch(`${API_URL}/api/admin/users/stats?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to load stats');
        }

        const data = await res.json();
        console.log('✅ Stats loaded:', data);

        updateStatsCards(data.stats);
        updateCharts(data.charts);

    } catch (err) {
        console.error('❌ Load stats error:', err);
        showToast('error', 'Error', err.message);
    }
}


// ============ UPDATE STATS CARDS (WITH SAFE NULL CHECKS) ============
function updateStatsCards(stats) {
    // ✅ Helper function to safely update elements
    const safeUpdate = (id, value) => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.textContent = typeof value === 'number' ? value.toLocaleString() : (value || '0');
        } else {
            console.warn(`⚠️ Element not found: ${id}`);
        }
    };

    const safeFormatCurrency = (id, value) => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.textContent = formatCurrency(value || 0);
        } else {
            console.warn(`⚠️ Element not found: ${id}`);
        }
    };

    // Basic Stats
    safeUpdate('totalUsers', stats.totalUsers);
    safeUpdate('maleCount', stats.maleCount);
    safeUpdate('femaleCount', stats.femaleCount);
    safeUpdate('activatedUsers', stats.activatedUsers);
    safeUpdate('nonActivatedUsers', stats.nonActivatedUsers);
    safeUpdate('bannedUsers', stats.bannedUsers);
    
    // ✅ NEW: Today's Stats
    safeUpdate('registeredToday', stats.registeredToday);
    safeUpdate('earnersRegisteredToday', stats.earnersRegisteredToday);
    safeUpdate('advertisersRegisteredToday', stats.advertisersRegisteredToday);
    
    // Account Types
    safeUpdate('earnersCount', stats.earnersCount);
    safeUpdate('advertisersCount', stats.advertisersCount);
    
    // ✅ NEW: Activated/Non-Activated Breakdown
    safeUpdate('activatedEarners', stats.activatedEarners);
    safeUpdate('nonActivatedEarners', stats.nonActivatedEarners);
    safeUpdate('activatedAdvertisers', stats.activatedAdvertisers);
    safeUpdate('nonActivatedAdvertisers', stats.nonActivatedAdvertisers);
    
    // Balance Stats
    safeFormatCurrency('totalBalance', stats.totalBalance);
    safeFormatCurrency('earnersBalance', stats.earnersBalance);
    safeFormatCurrency('advertisersBalance', stats.advertisersBalance);
    safeFormatCurrency('totalEarningsBalance', stats.totalEarningsBalance);
    
    // Revenue Stats
    safeFormatCurrency('totalEarned', stats.totalEarned);
    safeFormatCurrency('totalDeposits', stats.totalDeposits);
    safeFormatCurrency('platformProfit', stats.platformProfit);
    safeFormatCurrency('referralRewardsPaid', stats.referralRewardsPaid);
    
    // Task Stats
    safeUpdate('totalTasks', stats.totalTasks);
    safeUpdate('activeTasks', stats.activeTasks);
    safeUpdate('pendingSubmissions', stats.pendingSubmissions);
    
    // Referral Stats
    safeUpdate('totalReferrals', stats.totalReferrals);
    
    console.log('✅ Stats cards updated successfully');
}
/*/ ============ UPDATE STATS CARDS (WITH NEW STATS) ============
function updateStatsCards(stats) {
    document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
    document.getElementById('maleCount').textContent = stats.maleCount.toLocaleString();
    document.getElementById('femaleCount').textContent = stats.femaleCount.toLocaleString();
    document.getElementById('activatedUsers').textContent = stats.activatedUsers.toLocaleString();
    document.getElementById('nonActivatedUsers').textContent = stats.nonActivatedUsers.toLocaleString();
    document.getElementById('bannedUsers').textContent = stats.bannedUsers.toLocaleString();
    
    // ✅ NEW: Today's Stats
    document.getElementById('registeredToday').textContent = stats.registeredToday.toLocaleString();
    document.getElementById('earnersRegisteredToday').textContent = stats.earnersRegisteredToday.toLocaleString();
    document.getElementById('advertisersRegisteredToday').textContent = stats.advertisersRegisteredToday.toLocaleString();
    
    // Account Types
    document.getElementById('earnersCount').textContent = stats.earnersCount.toLocaleString();
    document.getElementById('advertisersCount').textContent = stats.advertisersCount.toLocaleString();
    
    // ✅ NEW: Activated/Non-Activated Breakdown
    document.getElementById('activatedEarners').textContent = stats.activatedEarners.toLocaleString();
    document.getElementById('nonActivatedEarners').textContent = stats.nonActivatedEarners.toLocaleString();
    document.getElementById('activatedAdvertisers').textContent = stats.activatedAdvertisers.toLocaleString();
    document.getElementById('nonActivatedAdvertisers').textContent = stats.nonActivatedAdvertisers.toLocaleString();
    
    // Balance Stats
    document.getElementById('totalBalance').textContent = formatCurrency(stats.totalBalance);
    document.getElementById('earnersBalance').textContent = formatCurrency(stats.earnersBalance);
    document.getElementById('advertisersBalance').textContent = formatCurrency(stats.advertisersBalance);
    document.getElementById('totalEarningsBalance').textContent = formatCurrency(stats.totalEarningsBalance);
    
    // Revenue Stats
    document.getElementById('totalEarned').textContent = formatCurrency(stats.totalEarned);
    document.getElementById('totalDeposits').textContent = formatCurrency(stats.totalDeposits);
    document.getElementById('platformProfit').textContent = formatCurrency(stats.platformProfit);
    document.getElementById('referralRewardsPaid').textContent = formatCurrency(stats.referralRewardsPaid);
    
    // Task Stats
    document.getElementById('totalTasks').textContent = stats.totalTasks.toLocaleString();
    document.getElementById('activeTasks').textContent = stats.activeTasks.toLocaleString();
    document.getElementById('pendingSubmissions').textContent = stats.pendingSubmissions.toLocaleString();
    
    // Referral Stats
    document.getElementById('totalReferrals').textContent = stats.totalReferrals.toLocaleString();
}*/

// ============ UPDATE CHARTS ============
function updateCharts(charts) {
    if (userGrowthChart) userGrowthChart.destroy();
    if (tasksChart) tasksChart.destroy();
    if (genderChart) genderChart.destroy();

    // User Growth Chart
    const ctx1 = document.getElementById('userGrowthChart').getContext('2d');
    userGrowthChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: charts.labels,
            datasets: [
                {
                    label: 'Total Users',
                    data: charts.userGrowth,
                    borderColor: '#00aaff',
                    backgroundColor: 'rgba(0, 170, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Earners',
                    data: charts.earnersGrowth,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Advertisers',
                    data: charts.advertisersGrowth,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });

    // Tasks Chart
    const ctx2 = document.getElementById('tasksChart').getContext('2d');
    tasksChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: charts.labels,
            datasets: [
                {
                    label: 'Tasks Created',
                    data: charts.tasksCreated,
                    backgroundColor: '#f59e0b'
                },
                {
                    label: 'Submissions',
                    data: charts.submissions,
                    backgroundColor: '#8b5cf6'
                },
                {
                    label: 'Activations',
                    data: charts.activations,
                    backgroundColor: '#10b981'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'top' } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });

    // Gender Chart
    const ctx3 = document.getElementById('genderChart').getContext('2d');
    genderChart = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: ['Male', 'Female', 'Not Specified'],
            datasets: [{
                data: [
                    charts.genderDistribution.male,
                    charts.genderDistribution.female,
                    charts.genderDistribution.notSpecified
                ],
                backgroundColor: ['#3b82f6', '#ec4899', '#64748b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, position: 'bottom' } }
        }
    });
}

// ============ LOAD USERS ============
async function loadUsers() {
    try {
        console.log('📥 Loading users...');

        const accountType = document.getElementById('filterAccountType').value;
        const status = document.getElementById('filterStatus').value;
        const gender = document.getElementById('filterGender').value;
        const activity = document.getElementById('filterActivity').value;
        const period = document.getElementById('filterPeriod').value;
        const search = document.getElementById('searchUser').value.trim();

        let query = `page=${currentPage}&limit=${limit}`;
        if (accountType !== 'all') query += `&accountType=${accountType}`;
        if (status !== 'all') query += `&status=${status}`;
        if (gender !== 'all') query += `&gender=${gender}`;
        if (activity !== 'all') query += `&activity=${activity}`;
        if (period !== 'all') query += `&period=${period}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(`${API_URL}/api/admin/users?${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to load users');
        }

        const data = await res.json();
        console.log('✅ Users loaded:', data);

        displayUsers(data.users);
        totalPages = data.totalPages || 1;
        updatePagination(data.count);

    } catch (err) {
        console.error('❌ Load users error:', err);
        showToast('error', 'Error', err.message);

        document.getElementById('usersTableBody').innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; color: var(--danger);"></i>
                    <p style="margin-top: 15px; color: var(--text-muted);">${escapeHtml(err.message)}</p>
                    <button class="filter-btn" onclick="loadUsers()" style="margin-top: 15px;">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </td>
            </tr>
        `;
    }
}


// ============ DISPLAY USERS ============
function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No users found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map((user, index) => {
        const startIndex = (currentPage - 1) * limit;
        const sn = startIndex + index + 1;

        let statusBadge = '';
        if (user.isBanned) {
            statusBadge = '<span class="status-badge badge-banned">Banned</span>';
        } else if (user.isActivated) {
            statusBadge = '<span class="status-badge badge-activated">Activated</span>';
        } else {
            statusBadge = '<span class="status-badge badge-not-activated">Not Activated</span>';
        }

        const typeBadge = user.accountType === 'Earner' 
            ? '<span class="status-badge badge-earner">Earner</span>'
            : '<span class="status-badge badge-advertiser">Advertiser</span>';

        let genderBadge = '';
        if (user.gender === 'Male') {
            genderBadge = '<span class="status-badge badge-male"><i class="fas fa-mars"></i> Male</span>';
        } else if (user.gender === 'Female') {
            genderBadge = '<span class="status-badge badge-female"><i class="fas fa-venus"></i> Female</span>';
        } else {
            genderBadge = '<span class="status-badge badge-unspecified">Not Specified</span>';
        }

        const pinStatus = user.hasPin 
            ? '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Set</span>'
            : '<span style="color: var(--danger);"><i class="fas fa-times-circle"></i> Not Set</span>';

        const location = user.location?.city && user.location?.country
            ? `${user.location.city}, ${user.location.country}`
            : 'Unknown';

        const referralRewards = user.referralBonusEarned > 0 
            ? `₦${formatCurrency(user.referralBonusEarned)}`
            : '₦0';

        let actions = `
            <button class="action-btn btn-view" onclick="viewUser('${user.id}')" title="View Details">
                <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn btn-edit" onclick="editUser('${user.id}')" title="Edit User">
                <i class="fas fa-edit"></i>
            </button>
        `;

        if (user.isBanned) {
            actions += `
                <button class="action-btn btn-unban" onclick="unbanUser('${user.id}')" title="Unban User">
                    <i class="fas fa-unlock"></i>
                </button>
            `;
        } else {
            actions += `
                <button class="action-btn btn-ban" onclick="banUser('${user.id}')" title="Ban User">
                    <i class="fas fa-ban"></i>
                </button>
            `;
        }

        actions += `
            <button class="action-btn btn-delete" onclick="deleteUser('${user.id}')" title="Delete User">
                <i class="fas fa-trash"></i>
            </button>
        `;

        return `
            <tr>
                <td class="sn-cell">${sn}</td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-weight: 600;">${escapeHtml(user.username)}</span>
                        <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(user.fullName)}</span>
                    </div>
                </td>
                <td style="font-size: 13px;">${escapeHtml(user.email)}</td>
                <td>${typeBadge}</td>
                <td>${genderBadge}</td>
                <td style="font-weight: 700; color: var(--primary);">₦${formatCurrency(user.balance)}</td>
                <td style="font-weight: 600; color: var(--purple);">${referralRewards}</td>
                <td>${statusBadge}</td>
                <td>${pinStatus}</td>
                <td style="font-size: 12px; color: var(--text-muted);">${formatDate(user.lastLoginDate)}</td>
                <td style="font-size: 12px;">${escapeHtml(location)}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
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
        loadUsers();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadUsers();
    }
}

// ============ APPLY FILTERS ============
function applyFilters() {
    currentPage = 1;
    loadUsers();
}

// ============ VIEW USER DETAILS ============
async function viewUser(userId) {
    try {
        console.log('👤 Viewing user:', userId);

        const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to load user details');
        }

        const data = await res.json();
        const user = data.user;

        console.log('✅ User details loaded:', user);

        currentUserId = userId;

        populateInfoTab(user);
        populateFinancialTab(user);
        populateActivityTab(user);
        populateReferralsTab(user);
        populateBanksTab(user);
        populateLocationTab(user);

        document.getElementById('userModal').classList.add('active');

    } catch (err) {
        console.error('❌ View user error:', err);
        showToast('error', 'Error', err.message);
    }
}

// ============ POPULATE INFO TAB ============
function populateInfoTab(user) {
    const tab = document.getElementById('infoTab');
    
    tab.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Username</div>
                <div class="info-value">${escapeHtml(user.username)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Full Name</div>
                <div class="info-value">${escapeHtml(user.fullName)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${escapeHtml(user.email)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Phone</div>
                <div class="info-value">${escapeHtml(user.phone)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Account Type</div>
                <div class="info-value">${escapeHtml(user.accountType)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Gender</div>
                <div class="info-value">${escapeHtml(user.gender)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Country</div>
                <div class="info-value">${escapeHtml(user.country || 'Nigeria')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Withdrawal PIN</div>
                <div class="info-value" style="color: var(--primary); font-size: 20px; font-weight: 700;">
                    ${user.withdrawalPin || 'Not Set'}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Registration Date</div>
                <div class="info-value">${formatDate(user.createdAt)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Activation Date</div>
                <div class="info-value">${formatDate(user.activationDate)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Last Login</div>
                <div class="info-value">${formatDate(user.lastLoginDate)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Login Count</div>
                <div class="info-value">${user.loginCount || 0}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Account Status</div>
                <div class="info-value">
                    ${user.isBanned ? '<span style="color: var(--danger);">Banned</span>' : 
                      user.isActivated ? '<span style="color: var(--success);">Activated</span>' : 
                      '<span style="color: var(--warning);">Not Activated</span>'}
                </div>
            </div>
        </div>

        ${user.isBanned ? `
            <div style="margin-top: 20px; padding: 15px; background: rgba(239, 68, 68, 0.1); border-radius: 10px; border-left: 4px solid var(--danger);">
                <strong style="color: var(--danger);">Ban Reason:</strong>
                <p style="margin: 5px 0 0 0;">${escapeHtml(user.banReason || 'No reason provided')}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: var(--text-muted);">
                    Banned on: ${formatDate(user.bannedAt)}
                </p>
            </div>
        ` : ''}

        <div class="form-actions">
            ${!user.isActivated ? `
                <button class="btn-primary" onclick="manualActivate('${user._id}')">
                    <i class="fas fa-check-circle"></i> Activate User
                </button>
            ` : ''}
            <button class="btn-primary" onclick="adjustWallet('${user._id}', 'credit')">
                <i class="fas fa-plus-circle"></i> Credit Wallet
            </button>
            <button class="btn-secondary" onclick="adjustWallet('${user._id}', 'debit')">
                <i class="fas fa-minus-circle"></i> Debit Wallet
            </button>
        </div>
    `;
}

// ============ POPULATE FINANCIAL TAB ============
function populateFinancialTab(user) {
    const tab = document.getElementById('financialTab');
    
    tab.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Current Balance</div>
                <div class="info-value" style="color: var(--primary); font-size: 24px;">₦${formatCurrency(user.balance)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Earnings Balance</div>
                <div class="info-value" style="color: var(--success); font-size: 24px;">₦${formatCurrency(user.earningsBalance || 0)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Deposits</div>
                <div class="info-value">
                    ${user.stats.totalDeposits} deposits<br>
                    <span style="font-size: 18px; color: var(--primary);">₦${formatCurrency(user.stats.totalDepositAmount)}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Activations</div>
                <div class="info-value">
                    ${user.stats.totalActivations} activations<br>
                    <span style="font-size: 18px; color: var(--success);">₦${formatCurrency(user.stats.totalActivationAmount || 0)}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Earnings</div>
                <div class="info-value" style="color: var(--success);">₦${formatCurrency(user.stats.totalEarnings)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Withdrawals</div>
                <div class="info-value" style="color: var(--danger);">₦${formatCurrency(user.stats.totalWithdrawals)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Referral Rewards Earned</div>
                <div class="info-value" style="color: var(--purple); font-size: 20px;">₦${formatCurrency(user.stats.referralRewardsEarned || 0)}</div>
            </div>
        </div>

        <h4 style="margin: 30px 0 15px; color: var(--text-main);">Recent Transactions (Last 20)</h4>
        ${user.recentTransactions && user.recentTransactions.length > 0 ? `
            <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 10px;">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${user.recentTransactions.map(txn => `
                            <tr>
                                <td style="font-size: 12px; font-family: monospace;">${escapeHtml(txn.transactionId)}</td>
                                <td>${escapeHtml(txn.type)}</td>
                                <td style="font-weight: 700; color: var(--primary);">₦${formatCurrency(txn.amount)}</td>
                                <td>
                                    <span class="status-badge ${txn.status === 'completed' ? 'badge-activated' : 'badge-not-activated'}">
                                        ${txn.status}
                                    </span>
                                </td>
                                <td style="font-size: 12px;">${formatDate(txn.createdAt)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p style="color: var(--text-muted);">No recent transactions</p>'}
    `;
}

// ============ POPULATE ACTIVITY TAB ============
function populateActivityTab(user) {
    const tab = document.getElementById('activityTab');
    
    tab.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Tasks Submitted</div>
                <div class="info-value">${user.stats.totalTasksSubmitted || 0}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Approved Tasks</div>
                <div class="info-value" style="color: var(--success);">${user.stats.approvedTasks || 0}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Rejected Tasks</div>
                <div class="info-value" style="color: var(--danger);">${user.stats.rejectedTasks || 0}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Pending Tasks</div>
                <div class="info-value" style="color: var(--warning);">${user.stats.pendingTasks || 0}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Tasks Created</div>
                <div class="info-value">${user.stats.totalTasksCreated || 0}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Completed Tasks</div>
                <div class="info-value">${user.completedTasks || 0}</div>
            </div>
        </div>

        <h4 style="margin: 30px 0 15px; color: var(--text-main);">Login History (Last 20)</h4>
        ${user.loginHistory && user.loginHistory.length > 0 ? `
            <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 10px;">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>IP Address</th>
                            <th>Location</th>
                            <th>Device</th>
                            <th>Browser</th>
                            <th>Status</th>
                            <th>Date & Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${user.loginHistory.map(login => `
                            <tr>
                                <td style="font-family: monospace;">${escapeHtml(login.ip)}</td>
                                <td>${escapeHtml(login.location?.city || 'Unknown')}, ${escapeHtml(login.location?.country || 'Unknown')}</td>
                                <td>${escapeHtml(login.deviceInfo?.device || 'Unknown')}</td>
                                <td>${escapeHtml(login.deviceInfo?.browser || 'Unknown')} (${escapeHtml(login.deviceInfo?.os || 'Unknown')})</td>
                                <td>
                                    ${login.success ? 
                                        '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Success</span>' : 
                                        '<span style="color: var(--danger);"><i class="fas fa-times-circle"></i> Failed</span>'}
                                </td>
                                <td style="font-size: 12px;">${formatDate(login.loginAt)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p style="color: var(--text-muted);">No login history available</p>'}
    `;
}


// ============ POPULATE REFERRALS TAB ============
function populateReferralsTab(user) {
    const tab = document.getElementById('referralsTab');
    
    tab.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Referred By</div>
                <div class="info-value">${user.referredBy ? escapeHtml(user.referredBy) : 'None'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Referrals</div>
                <div class="info-value" style="color: var(--primary); font-size: 24px;">${user.stats.referralsCount || 0}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Referral Rewards Earned</div>
                <div class="info-value" style="color: var(--success); font-size: 20px;">₦${formatCurrency(user.stats.referralRewardsEarned || 0)}</div>
            </div>
        </div>

        <h4 style="margin: 30px 0 15px; color: var(--text-main);">Users Referred (${user.stats.referralsCount || 0})</h4>
        ${user.referredUsers && user.referredUsers.length > 0 ? `
            <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 10px;">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Account Type</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Activated</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${user.referredUsers.map(ref => `
                            <tr>
                                <td style="font-weight: 600;">${escapeHtml(ref.username)}</td>
                                <td>${escapeHtml(ref.email)}</td>
                                <td>
                                    <span class="status-badge ${ref.accountType === 'Earner' ? 'badge-earner' : 'badge-advertiser'}">
                                        ${ref.accountType}
                                    </span>
                                </td>
                                <td>
                                    ${ref.isActivated ? 
                                        '<span class="status-badge badge-activated">Activated</span>' : 
                                        '<span class="status-badge badge-not-activated">Not Activated</span>'}
                                </td>
                                <td style="font-size: 12px;">${formatDate(ref.joinedAt)}</td>
                                <td style="font-size: 12px;">${formatDate(ref.activationDate)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p style="color: var(--text-muted);">No referrals yet</p>'}
    `;
}

// ============ POPULATE BANKS TAB ============
function populateBanksTab(user) {
    const tab = document.getElementById('banksTab');
    
    tab.innerHTML = `
        <h4 style="margin: 0 0 15px; color: var(--text-main);">Bank Accounts (${user.bankAccounts?.length || 0})</h4>
        ${user.bankAccounts && user.bankAccounts.length > 0 ? `
            <div style="overflow-x: auto; border: 1px solid var(--border-color); border-radius: 10px;">
                <table style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Bank Name</th>
                            <th>Account Number</th>
                            <th>Account Name</th>
                            <th>Primary</th>
                            <th>Added</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${user.bankAccounts.map(bank => `
                            <tr>
                                <td style="font-weight: 600;">${escapeHtml(bank.bankName)}</td>
                                <td style="font-family: monospace;">${escapeHtml(bank.accountNumber)}</td>
                                <td>${escapeHtml(bank.accountName)}</td>
                                <td>
                                    ${bank.isPrimary ? 
                                        '<span style="color: var(--success);"><i class="fas fa-check-circle"></i> Primary</span>' : 
                                        '<span style="color: var(--text-muted);">-</span>'}
                                </td>
                                <td style="font-size: 12px;">${formatDate(bank.createdAt)}</td>
                                <td>
                                    <button class="action-btn btn-delete" onclick="deleteBank('${user._id}', '${bank.id}')" title="Delete Bank">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p style="color: var(--text-muted);">No bank accounts added</p>'}
    `;
}

// ============ POPULATE LOCATION TAB ============
function populateLocationTab(user) {
    const tab = document.getElementById('locationTab');
    
    tab.innerHTML = `
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Current IP Address</div>
                <div class="info-value" style="font-family: monospace;">${escapeHtml(user.lastLoginIP || 'Unknown')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Country</div>
                <div class="info-value">${escapeHtml(user.location?.country || 'Unknown')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Region</div>
                <div class="info-value">${escapeHtml(user.location?.regionName || 'Unknown')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">City</div>
                <div class="info-value">${escapeHtml(user.location?.city || 'Unknown')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">ISP Provider</div>
                <div class="info-value">${escapeHtml(user.location?.isp || 'Unknown')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Timezone</div>
                <div class="info-value">${escapeHtml(user.location?.timezone || 'Unknown')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Device Type</div>
                <div class="info-value">${escapeHtml(user.deviceInfo?.device || 'Unknown')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Browser</div>
                <div class="info-value">${escapeHtml(user.deviceInfo?.browser || 'Unknown')}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Operating System</div>
                <div class="info-value">${escapeHtml(user.deviceInfo?.os || 'Unknown')}</div>
            </div>
        </div>

        ${user.location?.lat && user.location?.lon ? `
            <div style="margin-top: 20px; padding: 15px; background: var(--bg-body); border-radius: 10px; border: 1px solid var(--border-color);">
                <strong>Coordinates:</strong> ${user.location.lat}, ${user.location.lon}
            </div>
        ` : ''}
    `;
}

// ============ MODAL FUNCTIONS ============
function closeModal() {
    document.getElementById('userModal').classList.remove('active');
    currentUserId = null;
}

function switchTab(tabName) {
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    event.target.classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// ============ EDIT USER (WITH USERNAME EDITING) ============
async function editUser(userId) {
    try {
        console.log('✏️ Loading user for edit:', userId);

        const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to load user');
        }

        const data = await res.json();
        const user = data.user;

        currentUserId = userId;

        // ✅ Populate form (INCLUDING USERNAME)
        document.getElementById('editUsername').value = user.username || '';
        document.getElementById('editFullName').value = user.fullName || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editPhone').value = user.phone || '';
        document.getElementById('editAccountType').value = user.accountType || 'Earner';
        document.getElementById('editGender').value = user.gender || 'Not Specified';
        document.getElementById('editCountry').value = user.country || 'Nigeria';
        document.getElementById('editPassword').value = '';
        document.getElementById('editPin').value = user.withdrawalPin || '';

        document.getElementById('editModal').classList.add('active');

    } catch (err) {
        console.error('❌ Edit user error:', err);
        showToast('error', 'Error', err.message);
    }
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentUserId = null;
}

// ============ SAVE USER EDITS ============
document.getElementById('editUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUserId) {
        showToast('error', 'Error', 'No user selected');
        return;
    }

    try {
        const username = document.getElementById('editUsername').value.trim();
        const fullName = document.getElementById('editFullName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const accountType = document.getElementById('editAccountType').value;
        const gender = document.getElementById('editGender').value;
        const country = document.getElementById('editCountry').value.trim();
        const password = document.getElementById('editPassword').value.trim();
        const withdrawalPin = document.getElementById('editPin').value.trim();

        const body = {
            username, // ✅ NOW INCLUDED
            fullName,
            email,
            phone,
            accountType,
            gender,
            country
        };

        if (password) {
            body.password = password;
        }

        if (withdrawalPin) {
            if (!/^\d{4}$/.test(withdrawalPin)) {
                showToast('error', 'Invalid PIN', 'PIN must be exactly 4 digits');
                return;
            }
            body.withdrawalPin = withdrawalPin;
        }

        const res = await fetch(`${API_URL}/api/admin/users/${currentUserId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to update user');
        }

        showToast('success', 'Updated', 'User updated successfully');
        closeEditModal();
        loadUsers();

    } catch (err) {
        console.error('❌ Update user error:', err);
        showToast('error', 'Error', err.message);
    }
});

// ============ BAN USER (NO BROWSER PROMPT) ============
function banUser(userId) {
    showPromptModal(
        'Ban User',
        'Enter ban reason:',
        'Violation of terms and conditions',
        async (reason) => {
            try {
                const res = await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ reason })
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to ban user');
                }

                showToast('success', 'Banned', 'User banned successfully');
                loadUsers();

            } catch (err) {
                console.error('❌ Ban user error:', err);
                showToast('error', 'Error', err.message);
            }
        }
    );
}

// ============ UNBAN USER (NO BROWSER CONFIRM) ============
function unbanUser(userId) {
    showConfirmModal(
        'Unban User',
        'Are you sure you want to unban this user?',
        async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/users/${userId}/unban`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to unban user');
                }

                showToast('success', 'Unbanned', 'User unbanned successfully');
                loadUsers();

            } catch (err) {
                console.error('❌ Unban user error:', err);
                showToast('error', 'Error', err.message);
            }
        }
    );
}

// ============ DELETE USER (NO BROWSER CONFIRM) ============
function deleteUser(userId) {
    showConfirmModal(
        'Delete User',
        'Choose delete type:<br><br><strong>Soft Delete</strong> - Deactivate user<br><strong>Permanent Delete</strong> - Cannot be undone!<br><br>Click Confirm for Soft Delete.',
        () => {
            performDelete(userId, false);
        }
    );
}

async function performDelete(userId, permanent) {
    try {
        const url = permanent ? 
            `${API_URL}/api/admin/users/${userId}?permanent=true` : 
            `${API_URL}/api/admin/users/${userId}`;

        const res = await fetch(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to delete user');
        }

        const message = permanent ? 'User permanently deleted' : 'User deactivated successfully';
        showToast('success', 'Deleted', message);
        loadUsers();

    } catch (err) {
        console.error('❌ Delete user error:', err);
        showToast('error', 'Error', err.message);
    }
}

// ============ ADJUST WALLET (NO BROWSER PROMPT) ============
function adjustWallet(userId, action) {
    showPromptModal(
        `${action === 'credit' ? 'Credit' : 'Debit'} Wallet`,
        'Enter amount:',
        '',
        (amount) => {
            if (isNaN(amount) || parseFloat(amount) <= 0) {
                showToast('error', 'Invalid Amount', 'Please enter a valid amount');
                return;
            }

            showPromptModal(
                'Description',
                'Enter description (optional):',
                `Admin ${action}`,
                async (description) => {
                    try {
                        const res = await fetch(`${API_URL}/api/admin/users/${userId}/adjust-wallet`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                action,
                                amount: parseFloat(amount),
                                description
                            })
                        });

                        if (!res.ok) {
                            const error = await res.json();
                            throw new Error(error.message || 'Failed to adjust wallet');
                        }

                        showToast('success', 'Success', `Wallet ${action}ed successfully`);
                        
                        if (currentUserId === userId) {
                            viewUser(userId);
                        }
                        
                        loadUsers();

                    } catch (err) {
                        console.error('❌ Adjust wallet error:', err);
                        showToast('error', 'Error', err.message);
                    }
                }
            );
        }
    );
}

// ============ MANUAL ACTIVATION (NO BROWSER CONFIRM) ============
function manualActivate(userId) {
    showConfirmModal(
        'Manual Activation',
        'Manually activate this user without payment?',
        async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/users/${userId}/activate`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to activate user');
                }

                showToast('success', 'Activated', 'User manually activated');
                
                if (currentUserId === userId) {
                    viewUser(userId);
                }
                
                loadUsers();

            } catch (err) {
                console.error('❌ Activate user error:', err);
                showToast('error', 'Error', err.message);
            }
        }
    );
}

// ============ DELETE BANK ACCOUNT (FIXED) ============
function deleteBank(userId, bankId) {
    showConfirmModal(
        'Delete Bank Account',
        'Are you sure you want to delete this bank account?',
        async () => {
            try {
                const res = await fetch(`${API_URL}/api/admin/users/${userId}/banks/${bankId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to delete bank');
                }

                showToast('success', 'Deleted', 'Bank account deleted');
                viewUser(userId);

            } catch (err) {
                console.error('❌ Delete bank error:', err);
                showToast('error', 'Error', err.message);
            }
        }
    );
}

// ============ EXPORT USERS ============
async function exportUsers() {
    try {
        showToast('info', 'Exporting...', 'Preparing user data');

        const accountType = document.getElementById('filterAccountType').value;
        const status = document.getElementById('filterStatus').value;
        const gender = document.getElementById('filterGender').value;
        const activity = document.getElementById('filterActivity').value;
        const period = document.getElementById('filterPeriod').value;
        const search = document.getElementById('searchUser').value.trim();

        let query = `limit=10000`;
        if (accountType !== 'all') query += `&accountType=${accountType}`;
        if (status !== 'all') query += `&status=${status}`;
        if (gender !== 'all') query += `&gender=${gender}`;
        if (activity !== 'all') query += `&activity=${activity}`;
        if (period !== 'all') query += `&period=${period}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(`${API_URL}/api/admin/users?${query}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch users');

        const data = await res.json();
        const csv = convertToCSV(data.users);

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        showToast('success', 'Exported', `${data.users.length} users exported`);

    } catch (err) {
        console.error('❌ Export error:', err);
        showToast('error', 'Export Failed', err.message);
    }
}

// ============ CONVERT TO CSV ============
function convertToCSV(users) {
    const headers = [
        'Username', 'Full Name', 'Email', 'Phone', 'Account Type', 'Gender',
        'Balance', 'Earnings Balance', 'Referral Rewards', 'Is Activated',
        'Is Verified', 'Is Banned', 'Has PIN', 'Referred By', 'Referral Count',
        'Completed Tasks', 'Last Login IP', 'Location', 'Login Count',
        'Created At', 'Activation Date'
    ];

    const rows = users.map(user => [
        user.username, user.fullName, user.email, user.phone, user.accountType,
        user.gender, user.balance, user.earningsBalance, user.referralBonusEarned || 0,
        user.isActivated ? 'Yes' : 'No', user.isVerified ? 'Yes' : 'No',
        user.isBanned ? 'Yes' : 'No', user.hasPin ? 'Yes' : 'No',
        user.referredBy || '', user.referralCount, user.completedTasks,
        user.lastLoginIP || '',
        user.location?.city ? `${user.location.city}, ${user.location.country}` : '',
        user.loginCount, formatDate(user.createdAt), formatDate(user.activationDate)
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

// ============ FILTER FUNCTIONS ============
function filterByStatus(status) {
    document.getElementById('filterStatus').value = status;
    applyFilters();
}

function filterByGender(gender) {
    document.getElementById('filterGender').value = gender;
    applyFilters();
}

function filterByAccountType(type) {
    document.getElementById('filterAccountType').value = type;
    applyFilters();
}


// ============ SAFE INITIALIZATION ============
async function init() {
    console.log('🚀 Initializing Users Manager...');
    
    try {
        loadTheme();
        
        // ✅ Load stats first
        await loadStats();
        
        // ✅ Then load users
        await loadUsers();
        
        console.log('✅ Initialization complete');
    } catch (err) {
        console.error('❌ Initialization error:', err);
        showToast('error', 'Initialization Failed', err.message);
    }
}

// ✅ Wait for DOM to load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ Admin Users Manager Script Loaded - COMPLETE FIXED VERSION');
console.log('🎯 Features: Username Editing, No Alerts, Bank Deletion Fix, New Stats');

/*/ ============ INITIALIZATION ============
async function init() {
    console.log('🚀 Initializing Users Manager...');
    loadTheme();
    await loadStats();
    await loadUsers();
}

window.addEventListener('DOMContentLoaded', init);

console.log('✅ Admin Users Manager Loaded - COMPLETE FIXED VERSION');
console.log('🎯 Features: Username Editing, No Alerts, Bank Deletion Fix, New Stats');
*/