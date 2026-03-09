
// ================================================
// EARNCIAL - ADMIN DASHBOARD
// WITH CHARTS, STATS & RECENT ACTIVATIONS
// ================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

// Global variables for charts
let activationTrendsChart = null;
let userRegistrationsChart = null;

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
    
    // Redraw charts with new theme colors
    if (activationTrendsChart) {
        updateChartTheme(activationTrendsChart);
    }
    if (userRegistrationsChart) {
        updateChartTheme(userRegistrationsChart);
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('admin_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.theme-toggle i').className = 'fas fa-sun';
    }
}

function updateChartTheme(chart) {
    const isDark = document.body.classList.contains('dark-mode');
    chart.options.scales.x.ticks.color = isDark ? '#94a3b8' : '#64748b';
    chart.options.scales.y.ticks.color = isDark ? '#94a3b8' : '#64748b';
    chart.options.scales.x.grid.color = isDark ? '#334155' : '#e2e8f0';
    chart.options.scales.y.grid.color = isDark ? '#334155' : '#e2e8f0';
    chart.update();
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
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// ============ LOAD DASHBOARD STATS ============
async function loadDashboardStats() {
    try {
        console.log('📊 Loading dashboard stats...');
        
        const res = await fetch(`${API_URL}/api/admin/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to load dashboard stats');
        }

        const data = await res.json();
        console.log('✅ Dashboard stats loaded:', data);

        // Update stats cards
        updateStatsCards(data.stats);
        
        // Update charts
        updateCharts(data.charts);
        
        // Update notification badge
        document.getElementById('notifCount').textContent = data.stats.activations.pending || 0;
        
        return data;
        
    } catch (err) {
        console.error('❌ Load dashboard stats error:', err);
        showToast('error', 'Error', err.message || 'Failed to load dashboard stats');
        throw err;
    }
}

// ============ UPDATE STATS CARDS ============
function updateStatsCards(stats) {
    // User stats
    document.getElementById('totalUsers').textContent = stats.users.total.toLocaleString();
    document.getElementById('activatedUsers').textContent = stats.users.activated.toLocaleString();
    document.getElementById('pendingActivations').textContent = stats.users.nonActivated.toLocaleString();
    document.getElementById('earnersCount').textContent = stats.users.earners.toLocaleString();
    document.getElementById('advertisersCount').textContent = stats.users.advertisers.toLocaleString();
    document.getElementById('todayUsers').textContent = stats.users.todayRegistrations.toLocaleString();
    
    // Activation stats
    document.getElementById('totalActivationsCount').textContent = stats.activations.total.toLocaleString();
    document.getElementById('todayActivations').textContent = stats.activations.today.toLocaleString();
    document.getElementById('activationRevenue').textContent = formatCurrency(stats.activations.revenue).replace('₦', '');
    document.getElementById('platformProfit').textContent = formatCurrency(stats.activations.platformProfit).replace('₦', '');
    document.getElementById('referralRewards').textContent = formatCurrency(stats.activations.referralRewardsPaid).replace('₦', '');
    
    // Deposit stats
    document.getElementById('totalDepositsCount').textContent = stats.deposits.total.toLocaleString();
    document.getElementById('depositRevenue').textContent = formatCurrency(stats.deposits.revenue).replace('₦', '');
}

// ============ UPDATE CHARTS ============
function updateCharts(chartData) {
    // Destroy existing charts
    if (activationTrendsChart) {
        activationTrendsChart.destroy();
    }
    if (userRegistrationsChart) {
        userRegistrationsChart.destroy();
    }
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    // Activation Trends Chart
    const ctx1 = document.getElementById('activationTrendsChart').getContext('2d');
    activationTrendsChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Activations',
                data: chartData.activationTrends,
                borderColor: '#00aaff',
                backgroundColor: 'rgba(0, 170, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#00aaff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 12, weight: '600' }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 12, weight: '600' },
                        precision: 0
                    }
                }
            }
        }
    });
    
    // User Registrations Chart
    const ctx2 = document.getElementById('userRegistrationsChart').getContext('2d');
    userRegistrationsChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'New Users',
                data: chartData.userRegistrations,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#10b981',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 12, weight: '600' }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: { size: 12, weight: '600' },
                        precision: 0
                    }
                }
            }
        }
    });
}

// ============ LOAD RECENT ACTIVATIONS ============
async function loadRecentActivations() {
    try {
        console.log('📋 Loading recent activations...');
        
        const res = await fetch(`${API_URL}/api/admin/dashboard/recent-activations?limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to load recent activations');
        }

        const data = await res.json();
        console.log('✅ Recent activations loaded:', data);

        displayRecentActivations(data.activations);
        
    } catch (err) {
        console.error('❌ Load recent activations error:', err);
        showToast('error', 'Error', err.message || 'Failed to load recent activations');
    }
}

// ============ DISPLAY RECENT ACTIVATIONS ============
function displayRecentActivations(activations) {
    const tbody = document.getElementById('activationsTableBody');
    
    if (!activations || activations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No activations found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = activations.map((act, index) => `
        <tr>
            <td style="font-weight: 600;">${index + 1}</td>
            <td>
                <div class="user-cell">
                    <span class="username">${escapeHtml(act.username)}</span>
                    <span class="email">${escapeHtml(act.email)}</span>
                </div>
            </td>
            <td>
                <span style="font-weight: 600; color: ${act.accountType === 'Earner' ? 'var(--info)' : 'var(--purple)'};">
                    <i class="fas fa-${act.accountType === 'Earner' ? 'hand-holding-usd' : 'bullhorn'}"></i>
                    ${act.accountType}
                </span>
            </td>
            <td class="amount-cell">${formatCurrency(act.amount)}</td>
            <td>
                <span style="font-weight: 600; color: var(--primary);">
                    <i class="fas fa-credit-card"></i> ${escapeHtml(act.gateway)}
                </span>
            </td>
            <td>
                ${act.referralRewardPaid ? `
                    <div class="referral-info referral-yes">
                        <i class="fas fa-check-circle"></i>
                        <span>₦${act.referralRewardAmount.toLocaleString()}</span>
                    </div>
                ` : `
                    <div class="referral-info referral-no">
                        <i class="fas fa-times-circle"></i>
                        <span>None</span>
                    </div>
                `}
            </td>
            <td style="font-size: 12px; color: var(--text-muted);">
                ${formatDate(act.activatedAt)}
            </td>
            <td>
                <span class="status-badge status-success">
                    <i class="fas fa-check"></i> Success
                </span>
            </td>
        </tr>
    `).join('');
}

// ============ ESCAPE HTML ============
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ============ LOAD FULL DASHBOARD ============
async function loadDashboard() {
    try {
        // Show loading state
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
        
        // Load stats and activations in parallel
        await Promise.all([
            loadDashboardStats(),
            loadRecentActivations()
        ]);
        
        // Hide loading, show content
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        
        showToast('success', 'Dashboard Loaded', 'All data loaded successfully');
        
    } catch (err) {
        console.error('❌ Dashboard load error:', err);
        document.getElementById('loadingState').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--danger); margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-main); margin-bottom: 10px;">Failed to Load Dashboard</h3>
                <p style="color: var(--text-muted); margin-bottom: 20px;">${err.message}</p>
                <button class="refresh-btn" onclick="loadDashboard()">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
    }
}

// ============ LOGOUT ============
function logout() {
    if (confirm('Logout from admin panel?')) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }
}

// ============ INITIALIZATION ============
async function init() {
    console.log('🚀 Initializing Admin Dashboard...');
    loadTheme();
    await loadDashboard();
}

window.addEventListener('DOMContentLoaded', init);

console.log('✅ Admin Dashboard Loaded');
console.log('📊 Features: Stats, Charts, Recent Activations');