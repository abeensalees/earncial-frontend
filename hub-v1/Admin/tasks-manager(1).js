
// ================================================
// EARNCIAL - ADMIN TASKS MANAGER (COMPLETE!)
// ✅ Image loading FIXED
// ✅ Pagination ADDED
// ✅ Date + Time format
// ✅ Increase/Decrease submissions
// ================================================

const API_URL = 'http://localhost:5000';
let authToken = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

// ============ GLOBAL STATE ============
let allTasks = [];
let filteredTasks = [];
let currentTask = null;
let selectedTasks = new Set();
let currentDescTab = 'default';
let taskChart = null;
let revenueChart = null;
let autoRefreshInterval = null;
let confirmCallback = null;

// ============ PAGINATION STATE ============
let currentPage = 1;
let pageSize = 50;
let totalPages = 1;

// ============ ANALYTICS DATA ============
let analyticsData = {
    totalRevenue: 0,
    todayRevenue: 0,
    totalPayout: 0,
    todayPayout: 0,
    platformProfit: 0,
    todayProfit: 0,
    totalPendingPayout: 0,
    totalExpectedProfit: 0
};

// ============ CHECK AUTH ============
if (!authToken) {
    alert('Please login first');
    window.location.href = 'sign-in.html';
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Admin Tasks Manager...');
    
    loadTheme();
    setupEventListeners();
    loadTasks();
    startAutoRefresh();
    
    showToast('info', 'Welcome Admin', 'Loading tasks...');
});

// ============ 🔄 AUTO REFRESH ============
function startAutoRefresh() {
    autoRefreshInterval = setInterval(function() {
        console.log('🔄 Auto-refreshing tasks...');
        loadTasks();
    }, 60000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// ============ LOAD ALL TASKS ============
function loadTasks() {
    console.log('📥 Loading all tasks...');
    
    fetch(API_URL + '/api/admin/tasks/all?limit=1000', {
        headers: { 'Authorization': 'Bearer ' + authToken }
    })
    .then(function(res) {
        if (!res.ok) throw new Error('Failed to load tasks');
        return res.json();
    })
    .then(function(data) {
        allTasks = data.tasks || data || [];
        filteredTasks = allTasks.slice();
        
        console.log('✅ Loaded tasks:', allTasks.length);
        
        calculateAnalytics();
        renderRevenueCards();
        updateStats();
        renderTasks();
        updateCharts();
    })
    .catch(function(err) {
        console.error('❌ Load tasks error:', err);
        showToast('error', 'Error', err.message || 'Failed to load tasks');
    });
}

// ============ 📊 CALCULATE ANALYTICS ============
function calculateAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    analyticsData = {
        totalRevenue: 0,
        todayRevenue: 0,
        totalPayout: 0,
        todayPayout: 0,
        platformProfit: 0,
        todayProfit: 0,
        totalPendingPayout: 0,
        totalExpectedProfit: 0
    };
    
    allTasks.forEach(function(task) {
        const taskDate = new Date(task.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        const isToday = taskDate.getTime() === today.getTime();
        
        if (['active', 'completed', 'paused'].includes(task.status)) {
            const revenue = task.totalBudget || 0;
            analyticsData.totalRevenue += revenue;
            
            if (isToday) {
                analyticsData.todayRevenue += revenue;
            }
            
            const advertiserReward = task.reward || 0;
            const earnerReward = task.earnerReward || 0;
            const completedCount = task.completedCount || 0;
            const totalParticipants = task.participants || 0;
            
            const profitPerTask = advertiserReward - earnerReward;
            const actualPayout = completedCount * earnerReward;
            analyticsData.totalPayout += actualPayout;
            
            if (isToday) {
                analyticsData.todayPayout += actualPayout;
            }
            
            const actualProfit = completedCount * profitPerTask;
            analyticsData.platformProfit += actualProfit;
            
            if (isToday) {
                analyticsData.todayProfit += actualProfit;
            }
            
            const remainingSlots = totalParticipants - completedCount;
            const pendingPayout = remainingSlots * earnerReward;
            analyticsData.totalPendingPayout += pendingPayout;
            
            const expectedProfit = totalParticipants * profitPerTask;
            analyticsData.totalExpectedProfit += expectedProfit;
        }
    });
}

// ============ 💳 RENDER REVENUE CARDS ============
function renderRevenueCards() {
    const cardsHTML = `
        <div class="revenue-card">
            <div class="card-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="card-content">
                <h4>Total Revenue</h4>
                <h2>₦${analyticsData.totalRevenue.toLocaleString()}</h2>
                <span class="card-trend positive">
                    <i class="fas fa-arrow-up"></i> From advertisers
                </span>
            </div>
        </div>
        
        <div class="revenue-card">
            <div class="card-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <i class="fas fa-calendar-day"></i>
            </div>
            <div class="card-content">
                <h4>Today's Revenue</h4>
                <h2>₦${analyticsData.todayRevenue.toLocaleString()}</h2>
                <span class="card-trend">
                    <i class="fas fa-clock"></i> Last 24 hours
                </span>
            </div>
        </div>
        
        <div class="revenue-card">
            <div class="card-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <i class="fas fa-hand-holding-usd"></i>
            </div>
            <div class="card-content">
                <h4>Total Payout</h4>
                <h2>₦${analyticsData.totalPayout.toLocaleString()}</h2>
                <span class="card-trend negative">
                    <i class="fas fa-arrow-down"></i> Paid to earners
                </span>
            </div>
        </div>
        
        <div class="revenue-card">
            <div class="card-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                <i class="fas fa-coins"></i>
            </div>
            <div class="card-content">
                <h4>Today's Payout</h4>
                <h2>₦${analyticsData.todayPayout.toLocaleString()}</h2>
                <span class="card-trend">
                    <i class="fas fa-users"></i> Daily rewards
                </span>
            </div>
        </div>
        
        <div class="revenue-card">
            <div class="card-icon" style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);">
                <i class="fas fa-chart-line"></i>
            </div>
            <div class="card-content">
                <h4>Platform Profit</h4>
                <h2>₦${analyticsData.platformProfit.toLocaleString()}</h2>
                <span class="card-trend positive">
                    <i class="fas fa-trophy"></i> Actual earnings
                </span>
            </div>
        </div>
        
        <div class="revenue-card">
            <div class="card-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                <i class="fas fa-sun"></i>
            </div>
            <div class="card-content">
                <h4>Today's Profit</h4>
                <h2>₦${analyticsData.todayProfit.toLocaleString()}</h2>
                <span class="card-trend ${analyticsData.todayProfit > 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-${analyticsData.todayProfit > 0 ? 'arrow-up' : 'minus'}"></i> Daily profit
                </span>
            </div>
        </div>
    `;
    
    const container = document.getElementById('revenueCardsContainer');
    if (container) {
        container.innerHTML = cardsHTML;
    }
}

// ============ 📈 UPDATE CHARTS ============
function updateCharts() {
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    updateTaskChart(textColor, gridColor);
    updateRevenueChart(textColor, gridColor);
}

function updateTaskChart(textColor, gridColor) {
    const ctx = document.getElementById('taskChart');
    if (!ctx) return;
    
    const statusCounts = {
        review: allTasks.filter(function(t) { return t.status === 'review'; }).length,
        active: allTasks.filter(function(t) { return t.status === 'active'; }).length,
        completed: allTasks.filter(function(t) { return t.status === 'completed'; }).length,
        paused: allTasks.filter(function(t) { return t.status === 'paused'; }).length,
        rejected: allTasks.filter(function(t) { return t.status === 'rejected'; }).length,
        cancelled: allTasks.filter(function(t) { return t.status === 'cancelled'; }).length
    };
    
    if (taskChart) {
        taskChart.destroy();
    }
    
    taskChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Review', 'Active', 'Completed', 'Paused', 'Rejected', 'Cancelled'],
            datasets: [{
                data: [
                    statusCounts.review,
                    statusCounts.active,
                    statusCounts.completed,
                    statusCounts.paused,
                    statusCounts.rejected,
                    statusCounts.cancelled
                ],
                backgroundColor: [
                    '#06b6d4',
                    '#10b981',
                    '#8b5cf6',
                    '#f59e0b',
                    '#ef4444',
                    '#64748b'
                ],
                borderWidth: 2,
                borderColor: document.body.classList.contains('dark-mode') ? '#1e293b' : '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: { size: 12, family: 'Poppins' }
                    }
                },
                title: {
                    display: true,
                    text: 'Task Status Distribution',
                    color: textColor,
                    font: { size: 16, weight: 'bold', family: 'Poppins' }
                }
            }
        }
    });
}

function updateRevenueChart(textColor, gridColor) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const last7Days = [];
    const revenueData = [];
    const payoutData = [];
    const profitData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        last7Days.push(dayName);
        
        let dayRevenue = 0;
        let dayPayout = 0;
        let dayProfit = 0;
        
        allTasks.forEach(function(task) {
            const taskDate = new Date(task.createdAt);
            taskDate.setHours(0, 0, 0, 0);
            
            if (taskDate.getTime() === date.getTime()) {
                if (['active', 'completed', 'paused'].includes(task.status)) {
                    dayRevenue += task.totalBudget || 0;
                    
                    const advertiserReward = task.reward || 0;
                    const earnerReward = task.earnerReward || 0;
                    const completedCount = task.completedCount || 0;
                    
                    const payout = completedCount * earnerReward;
                    const profit = completedCount * (advertiserReward - earnerReward);
                    
                    dayPayout += payout;
                    dayProfit += profit;
                }
            }
        });
        
        revenueData.push(dayRevenue);
        payoutData.push(dayPayout);
        profitData.push(dayProfit);
    }
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [
                {
                    label: 'Revenue (₦)',
                    data: revenueData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Payout (₦)',
                    data: payoutData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'Profit (₦)',
                    data: profitData,
                    borderColor: '#00aaff',
                    backgroundColor: 'rgba(0, 170, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: { size: 12, family: 'Poppins' },
                        usePointStyle: true
                    }
                },
                title: {
                    display: true,
                    text: 'Revenue & Profit Trends (Last 7 Days)',
                    color: textColor,
                    font: { size: 16, weight: 'bold', family: 'Poppins' }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, family: 'Poppins' },
                    bodyFont: { size: 13, family: 'Poppins' },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₦' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        font: { family: 'Poppins' },
                        callback: function(value) {
                            return '₦' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor,
                        font: { family: 'Poppins' }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

// ============ UPDATE STATS ============
function updateStats() {
    const review = allTasks.filter(function(t) { return t.status === 'review'; }).length;
    const active = allTasks.filter(function(t) { return t.status === 'active'; }).length;
    const completed = allTasks.filter(function(t) { return t.status === 'completed'; }).length;
    const paused = allTasks.filter(function(t) { return t.status === 'paused'; }).length;
    const rejected = allTasks.filter(function(t) { return t.status === 'rejected'; }).length;

    document.getElementById('reviewCount').textContent = review;
    document.getElementById('activeCount').textContent = active;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('pausedCount').textContent = paused;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('totalCount').textContent = allTasks.length;
}

// ============ 📋 COPY TASK ID ============
function copyTaskId(taskId) {
    const tempInput = document.createElement('input');
    tempInput.value = taskId;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    showToast('success', 'Copied!', 'Task ID ' + taskId + ' copied to clipboard');
}

// ============ 📅 FORMAT DATE & TIME ============
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    return dateStr + '<br><small style="color: var(--text-muted);">' + timeStr + '</small>';
}

// ============ 📄 PAGINATION FUNCTIONS ============
function updatePagination() {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, filteredTasks.length);
    const total = filteredTasks.length;
    
    totalPages = Math.ceil(total / pageSize);
    
    document.getElementById('showingStart').textContent = total > 0 ? start : 0;
    document.getElementById('showingEnd').textContent = end;
    document.getElementById('totalTasks').textContent = total;
    
    document.getElementById('firstPageBtn').disabled = currentPage === 1;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('lastPageBtn').disabled = currentPage === totalPages || totalPages === 0;
    
    renderPageNumbers();
}

function renderPageNumbers() {
    const container = document.getElementById('pageNumbers');
    container.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-num-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = function() { goToPage(i); };
        container.appendChild(btn);
    }
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTasks();
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTasks();
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderTasks();
    }
}

function goToLastPage() {
    currentPage = totalPages;
    renderTasks();
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    currentPage = 1;
    renderTasks();
}

// ============ 📄 RENDER TASKS TABLE (COMPLETE & FIXED!) ============
function renderTasks() {
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:40px;color:var(--text-muted);">No tasks found</td></tr>';
        updateBulkActionsBar();
        updatePagination();
        return;
    }
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginatedTasks = filteredTasks.slice(start, end);
    
    paginatedTasks.forEach(function(task, index) {
        const globalIndex = start + index + 1;
        const row = document.createElement('tr');
        if (selectedTasks.has(task._id)) {
            row.classList.add('selected');
        }
        
        const platformIcon = task.category ? (task.category.icon || 'fas fa-globe') : 'fas fa-globe';
        const platformName = task.category ? (task.category.displayName || 'Unknown') : 'Unknown';
        const taskTypeName = task.taskType ? (task.taskType.displayName || 'Unknown') : 'Unknown';
        const advertiserName = task.advertiser ? (task.advertiser.username || task.advertiser.email || 'Unknown') : 'Unknown';
        const advertiserWallet = task.advertiser ? (task.advertiser.balance || 0) : 0;
        const earnerReward = task.earnerReward || 0;
        
        // ✅ IMPROVED IMAGE HANDLING
        let imageHtml = '<span class="no-image">No image</span>';
        
        if (task.sampleImageTelegramFileId) {
            const imageUrl1 = API_URL + '/api/admin/tasks/' + encodeURIComponent(task.taskId) + '/sample-image';
            const imageUrl2 = API_URL + '/api/admin/tasks/' + encodeURIComponent(task._id) + '/sample-image';
            const imageUrl3 = task.sampleImageUrl || '';
            
            const primaryUrl = imageUrl1;
            
            imageHtml = '<img src="' + primaryUrl + '?t=' + new Date().getTime() + '" ' +
                'class="task-thumbnail" ' +
                'onclick="openImageModal(\'' + primaryUrl + '\', \'' + task.taskId + '\')" ' +
                'alt="Task Image" ' +
                'title="Click to view" ' +
                'onerror="handleImageError(this, \'' + imageUrl2 + '\', \'' + imageUrl3 + '\')">';
        } else if (task.sampleImageUrl) {
            imageHtml = '<img src="' + task.sampleImageUrl + '" ' +
                'class="task-thumbnail" ' +
                'onclick="openImageModal(\'' + task.sampleImageUrl + '\', \'' + task.taskId + '\')" ' +
                'alt="Task Image" ' +
                'title="Click to view" ' +
                'onerror="this.style.display=\'none\'; this.parentNode.innerHTML=\'<span class=\\\'no-image\\\'>Failed to load</span>\'">';
        }
        
        // ✅ INCREASE/DECREASE BUTTONS
        const adjustButtons = (task.status === 'active' || task.status === 'completed') 
            ? '<div class="adjust-btns">' +
                '<button class="btn-increase" onclick="increaseSubmissions(\'' + task._id + '\')" title="Increase submissions"><i class="fas fa-plus"></i></button>' +
                '<button class="btn-decrease" onclick="decreaseSubmissions(\'' + task._id + '\')" title="Decrease submissions"><i class="fas fa-minus"></i></button>' +
              '</div>'
            : '';
        
        const reviewButtons = task.status === 'review' 
            ? '<button class="btn btn-approve" onclick="quickApprove(\'' + task._id + '\')" title="Approve"><i class="fas fa-check"></i> Approve</button>' +
              '<button class="btn btn-reject" onclick="quickReject(\'' + task._id + '\')" title="Reject"><i class="fas fa-times"></i> Reject</button>'
            : '';
        
        // ===== PROGRESS LOGIC =====
const completed = task.completedCount || 0;
const total = task.participants || 1;

let percent = Math.round((completed / total) * 100);
if (percent > 100) percent = 100;

const progressHTML = `
  <div style="width:100%; background:#e5e7eb; height:10px; border-radius:6px; overflow:hidden;">
    <div style="
      width:${percent}%;
      height:100%;
      background:linear-gradient(90deg, #00aaff, #10b981);
      transition: width 0.4s ease;
    "></div>
  </div>
  <small style="font-weight:600;">${completed}/${total} (${percent}%)</small>
`;

        row.innerHTML = '<td class="checkbox-cell"><input type="checkbox" ' + (selectedTasks.has(task._id) ? 'checked' : '') + ' onchange="toggleTaskSelection(\'' + task._id + '\')"></td>' +
            '<td class="sn-cell">' + globalIndex + '</td>' +
            '<td>' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<strong>' + task.taskId + '</strong>' +
                    '<button class="btn-copy-id" onclick="copyTaskId(\'' + task.taskId + '\')" title="Copy ID">' +
                        '<i class="fas fa-copy"></i>' +
                    '</button>' +
                '</div>' +
            '</td>' +
            '<td>' + advertiserName + '</td>' +
            '<td><i class="' + platformIcon + '"></i> ' + platformName + '</td>' +
            '<td>' + taskTypeName + '</td>' +
            '<td>' + imageHtml + '</td>' +
            '<td>' +
              progressHTML +
               adjustButtons +
            '</td>' +
            '<td><strong>₦' + task.totalBudget.toLocaleString() + '</strong></td>' +
            '<td><strong style="color:var(--success)">₦' + earnerReward.toLocaleString() + '</strong></td>' +
            '<td>₦' + advertiserWallet.toLocaleString() + '</td>' +
            '<td><span class="status-badge status-' + task.status + '">' + task.status.toUpperCase() + '</span></td>' +
            '<td>' + formatDateTime(task.createdAt) + '</td>' +
            '<td>' +
                '<div class="action-btns-horizontal">' +
                    '<button class="btn btn-edit" onclick="editTask(\'' + task._id + '\')" title="Edit"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn btn-link" onclick="openTaskLink(\'' + task.taskUrl + '\')" title="View Task"><i class="fas fa-external-link-alt"></i></button>' +
                    reviewButtons +
                    '<button class="btn btn-delete" onclick="deleteTask(\'' + task._id + '\')" title="Delete"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</td>';
        
        tbody.appendChild(row);
    });
    
    updateBulkActionsBar();
    updatePagination();
}

// ============ IMAGE ERROR HANDLING ============
function handleImageError(img, fallbackUrl1, fallbackUrl2) {
    console.log('❌ Image failed, trying fallback...');
    
    if (fallbackUrl1 && img.src.indexOf(fallbackUrl1) === -1) {
        img.src = fallbackUrl1 + '?t=' + new Date().getTime();
        img.onerror = function() {
            if (fallbackUrl2 && img.src.indexOf(fallbackUrl2) === -1) {
                img.src = fallbackUrl2;
                img.onerror = function() {
                    img.style.display = 'none';
                    img.parentNode.innerHTML = '<span class="no-image">Failed to load</span>';
                };
            } else {
                img.style.display = 'none';
                img.parentNode.innerHTML = '<span class="no-image">Failed to load</span>';
            }
        };
    } else {
        img.style.display = 'none';
        img.parentNode.innerHTML = '<span class="no-image">Failed to load</span>';
    }
}


// ============ IMPROVED IMAGE MODAL ============
function openImageModal(imageUrl, taskId) {
    console.log('🖼️ Opening modal for:', taskId);
    
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    const caption = document.getElementById('imageCaption');
    
    if (!modal || !img || !caption) {
        console.error('❌ Modal elements not found');
        return;
    }
    
    // Check if imageUrl is base64
    if (imageUrl && imageUrl.startsWith('data:image')) {
        console.log('✅ Using cached base64 image');
        img.src = imageUrl;
        img.style.display = 'block';
        caption.textContent = 'Task: ' + taskId;
        modal.style.display = 'flex';
        return;
    }
    
    // If not base64, load from cache or fetch
    if (imageCache[taskId]) {
        console.log('✅ Using cached image from storage');
        img.src = imageCache[taskId];
        img.style.display = 'block';
        caption.textContent = 'Task: ' + taskId;
        modal.style.display = 'flex';
        return;
    }
    
    // Fetch image with authentication
    modal.style.display = 'flex';
    img.style.display = 'none';
    caption.textContent = 'Loading image... Task: ' + taskId;
    
    fetch(imageUrl, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        })
        .then(function(res) {
            if (!res.ok) {
                throw new Error('Failed to load: ' + res.status);
            }
            return res.blob();
        })
        .then(function(blob) {
            const reader = new FileReader();
            reader.onloadend = function() {
                const base64data = reader.result;
                imageCache[taskId] = base64data;
                img.src = base64data;
                img.style.display = 'block';
                caption.textContent = 'Task: ' + taskId;
                caption.style.color = '';
            };
            reader.readAsDataURL(blob);
        })
        .catch(function(err) {
            console.error('❌ Modal image load failed:', err);
            img.style.display = 'none';
            caption.textContent = 'Failed to load image - Task: ' + taskId;
            caption.style.color = '#ef4444';
            
            setTimeout(function() {
                closeImageModal();
            }, 2000);
        });
}

// ============ 🔼 INCREASE SUBMISSIONS ============
function increaseSubmissions(taskId) {
    const task = allTasks.find(function(t) { return t._id === taskId; });
    if (!task) return;

    showConfirm(
        'Increase Submissions',
        'Increase completed submissions for task ' + task.taskId + ' by 1?',
        function() {
            const encodedTaskId = encodeURIComponent(task.taskId);
            
            fetch(API_URL + '/api/admin/tasks/' + encodedTaskId + '/increase-submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                }
            })
            .then(function(res) {
                if (!res.ok) {
                    return res.json().then(function(err) { 
                        throw new Error(err.message || 'Failed to increase submissions'); 
                    });
                }
                return res.json();
            })
            .then(function(data) {
                showToast('success', 'Increased', 'Submissions increased for ' + task.taskId);
                loadTasks();
            })
            .catch(function(err) {
                showToast('error', 'Failed', err.message);
            });
        }
    );
}

// ============ 🔽 DECREASE SUBMISSIONS ============
function decreaseSubmissions(taskId) {
    const task = allTasks.find(function(t) { return t._id === taskId; });
    if (!task) return;

    if (task.completedCount <= 0) {
        showToast('error', 'Cannot Decrease', 'Completed count is already 0');
        return;
    }

    showConfirm(
        'Decrease Submissions',
        'Decrease completed submissions for task ' + task.taskId + ' by 1?',
        function() {
            const encodedTaskId = encodeURIComponent(task.taskId);
            
            fetch(API_URL + '/api/admin/tasks/' + encodedTaskId + '/decrease-submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                }
            })
            .then(function(res) {
                if (!res.ok) {
                    return res.json().then(function(err) { 
                        throw new Error(err.message || 'Failed to decrease submissions'); 
                    });
                }
                return res.json();
            })
            .then(function(data) {
                showToast('success', 'Decreased', 'Submissions decreased for ' + task.taskId);
                loadTasks();
            })
            .catch(function(err) {
                showToast('error', 'Failed', err.message);
            });
        }
    );
}

// ============ TOGGLE SELECT ALL ============
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll').checked;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const paginatedTasks = filteredTasks.slice(start, end);
    
    if (selectAll) {
        paginatedTasks.forEach(function(task) {
            selectedTasks.add(task._id);
        });
    } else {
        paginatedTasks.forEach(function(task) {
            selectedTasks.delete(task._id);
        });
    }
    renderTasks();
}

// ============ TOGGLE TASK SELECTION ============
function toggleTaskSelection(taskId) {
    if (selectedTasks.has(taskId)) {
        selectedTasks.delete(taskId);
    } else {
        selectedTasks.add(taskId);
    }
    renderTasks();
}

// ============ UPDATE BULK ACTIONS BAR ============
function updateBulkActionsBar() {
    const bar = document.getElementById('bulkActionsBar');
    const count = document.getElementById('selectedCount');
    
    if (selectedTasks.size > 0) {
        bar.classList.add('active');
        count.textContent = selectedTasks.size;
    } else {
        bar.classList.remove('active');
    }
    
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const paginatedTasks = filteredTasks.slice(start, end);
        
        const allSelected = paginatedTasks.length > 0 && paginatedTasks.every(function(task) {
            return selectedTasks.has(task._id);
        });
        
        selectAll.checked = allSelected;
    }
}

// ============ EDIT TASK ============
function editTask(taskId) {
    currentTask = allTasks.find(function(t) { return t._id === taskId; });
    if (!currentTask) {
        showToast('error', 'Error', 'Task not found');
        return;
    }

    document.getElementById('modalTaskId').value = currentTask.taskId;
    document.getElementById('modalAdvertiser').value = currentTask.advertiser ? (currentTask.advertiser.username || '') : '';
    document.getElementById('modalWallet').value = currentTask.advertiser ? (currentTask.advertiser.balance || 0) : 0;
    document.getElementById('modalPlatform').value = currentTask.category ? (currentTask.category.displayName || '') : '';
    document.getElementById('modalTaskType').value = currentTask.taskType ? (currentTask.taskType.displayName || '') : '';
    document.getElementById('modalUrl').value = currentTask.taskUrl;
    document.getElementById('modalDefaultDesc').value = currentTask.defaultDescription || '';
    document.getElementById('modalCustomDesc').value = currentTask.customDescription || '';
    document.getElementById('modalParticipants').value = currentTask.participants;
    document.getElementById('modalReward').value = currentTask.reward;
    document.getElementById('modalBudget').value = currentTask.totalBudget;
    document.getElementById('modalEarnerReward').value = currentTask.earnerReward || 0;
    document.getElementById('modalStatus').value = currentTask.status;

    document.getElementById('taskModal').classList.add('active');
}

// ============ CALCULATE BUDGET ============
function calculateBudget() {
    const participants = parseInt(document.getElementById('modalParticipants').value) || 0;
    const reward = parseFloat(document.getElementById('modalReward').value) || 0;
    const budget = participants * reward;
    document.getElementById('modalBudget').value = budget.toFixed(2);
}

// ============ SAVE TASK ============
function saveTask() {
    if (!currentTask) return;

    const updates = {
        taskUrl: document.getElementById('modalUrl').value,
        defaultDescription: document.getElementById('modalDefaultDesc').value,
        customDescription: document.getElementById('modalCustomDesc').value,
        participants: parseInt(document.getElementById('modalParticipants').value),
        reward: parseFloat(document.getElementById('modalReward').value),
        earnerReward: parseFloat(document.getElementById('modalEarnerReward').value),
        status: document.getElementById('modalStatus').value
    };

    const encodedTaskId = encodeURIComponent(currentTask.taskId);
    
    fetch(API_URL + '/api/admin/tasks/' + encodedTaskId, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify(updates)
    })
    .then(function(res) {
        if (!res.ok) {
            return res.json().then(function(err) { 
                throw new Error(err.message || 'Failed to update task'); 
            });
        }
        return res.json();
    })
    .then(function(data) {
        showToast('success', 'Task Updated', 'Task ' + currentTask.taskId + ' updated successfully');
        closeModal();
        loadTasks();
    })
    .catch(function(err) {
        showToast('error', 'Update Failed', err.message);
    });
}

// ============ APPROVE TASK ============
function approveTask() {
    if (!currentTask) return;

    showConfirm(
        'Approve Task',
        'Approve task ' + currentTask.taskId + '? This will activate the task and notify users.',
        function() {
            const encodedTaskId = encodeURIComponent(currentTask.taskId);
            
            fetch(API_URL + '/api/admin/tasks/' + encodedTaskId + '/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                }
            })
            .then(function(res) {
                if (!res.ok) {
                    return res.json().then(function(err) { 
                        throw new Error(err.message || 'Failed to approve task'); 
                    });
                }
                return res.json();
            })
            .then(function(data) {
                const earnerReward = data.breakdown ? data.breakdown.earnerReward : 'N/A';
                showToast('success', 'Task Approved', 'Task ' + currentTask.taskId + ' approved! Earner reward: ₦' + earnerReward);
                closeModal();
                loadTasks();
            })
            .catch(function(err) {
                showToast('error', 'Approval Failed', err.message);
            });
        }
    );
}

// ============ QUICK APPROVE ============
function quickApprove(taskId) {
    const task = allTasks.find(function(t) { return t._id === taskId; });
    if (!task) {
        showToast('error', 'Error', 'Task not found');
        return;
    }

    showConfirm(
        'Approve Task',
        'Approve task ' + task.taskId + '?',
        function() {
            const encodedTaskId = encodeURIComponent(task.taskId);
            
            fetch(API_URL + '/api/admin/tasks/' + encodedTaskId + '/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                }
            })
            .then(function(res) {
                if (!res.ok) {
                    return res.json().then(function(err) { 
                        throw new Error(err.message || 'Failed to approve task'); 
                    });
                }
                return res.json();
            })
            .then(function(data) {
                showToast('success', 'Task Approved', 'Task ' + task.taskId + ' approved!');
                loadTasks();
            })
            .catch(function(err) {
                showToast('error', 'Approval Failed', err.message);
            });
        }
    );
}

// ============ ❌ REJECT MODAL FUNCTIONS ============
function openRejectModal() {
    if (!currentTask) return;
    
    const budget = currentTask.totalBudget || 0;
    const defaultRefund = Math.floor(budget * 0.95);
    
    document.getElementById('rejectTaskId').value = currentTask.taskId;
    document.getElementById('rejectBudget').value = budget;
    document.getElementById('rejectDefaultRefund').value = defaultRefund;
    document.getElementById('rejectRefundAmount').value = defaultRefund;
    document.getElementById('rejectReason').value = 'Low quality screenshots';
    document.getElementById('customReasonGroup').style.display = 'none';
    document.getElementById('customRejectReason').value = '';
    
    document.getElementById('taskModal').classList.remove('active');
    document.getElementById('rejectModal').classList.add('active');
}

function closeRejectModal() {
    document.getElementById('rejectModal').classList.remove('active');
}

function handleReasonChange() {
    const reason = document.getElementById('rejectReason').value;
    const customGroup = document.getElementById('customReasonGroup');
    
    if (reason === 'custom') {
        customGroup.style.display = 'block';
    } else {
        customGroup.style.display = 'none';
    }
}

function confirmReject() {
    if (!currentTask) return;
    
    let reason = document.getElementById('rejectReason').value;
    
    if (reason === 'custom') {
        reason = document.getElementById('customRejectReason').value.trim();
        if (!reason) {
            showToast('error', 'Validation Error', 'Please enter a custom rejection reason');
            return;
        }
    }
    
    const refundAmount = parseFloat(document.getElementById('rejectRefundAmount').value) || 0;
    const budget = parseFloat(document.getElementById('rejectBudget').value) || 0;
    
    if (refundAmount > budget) {
        showToast('error', 'Invalid Refund', 'Refund amount cannot exceed task budget');
        return;
    }
    
    const encodedTaskId = encodeURIComponent(currentTask.taskId);
    
    fetch(API_URL + '/api/admin/tasks/' + encodedTaskId + '/reject', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({ 
            reason: reason,
            refundAmount: refundAmount
        })
    })
    .then(function(res) {
        if (!res.ok) {
            return res.json().then(function(err) { 
                throw new Error(err.message || 'Failed to reject task'); 
            });
        }
        return res.json();
    })
    .then(function(data) {
        showToast('success', 'Task Rejected', 'Task ' + currentTask.taskId + ' rejected. Refund: ₦' + refundAmount.toLocaleString());
        closeRejectModal();
        loadTasks();
    })
    .catch(function(err) {
        showToast('error', 'Rejection Failed', err.message);
    });
}

// ============ QUICK REJECT ============
function quickReject(taskId) {
    const task = allTasks.find(function(t) { return t._id === taskId; });
    if (!task) return;

    currentTask = task;
    openRejectModal();
}

// ============ DELETE TASK ============
function deleteTask(taskId) {
    const task = allTasks.find(function(t) { return t._id === taskId; });
    if (!task) return;

    showConfirm(
        'Delete Task',
        'Delete task ' + task.taskId + '? This cannot be undone!',
        function() {
            const encodedTaskId = encodeURIComponent(task.taskId);
            
            fetch(API_URL + '/api/admin/tasks/' + encodedTaskId, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + authToken }
            })
            .then(function(res) {
                if (!res.ok) {
                    return res.json().then(function(err) { 
                        throw new Error(err.message || 'Failed to delete task'); 
                    });
                }
                return res.json();
            })
            .then(function(data) {
                showToast('success', 'Task Deleted', 'Task ' + task.taskId + ' deleted');
                loadTasks();
            })
            .catch(function(err) {
                showToast('error', 'Deletion Failed', err.message);
            });
        }
    );
}

// ============ BULK APPROVE ============
function bulkApprove() {
    if (selectedTasks.size === 0) return;
    
    showConfirm(
        'Bulk Approve',
        'Approve ' + selectedTasks.size + ' selected task(s)?',
        function() {
            const taskIdsToApprove = Array.from(selectedTasks).map(function(id) {
                const task = allTasks.find(function(t) { return t._id === id; });
                return task ? task.taskId : null;
            }).filter(function(id) { return id !== null; });

            fetch(API_URL + '/api/admin/tasks/bulk/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ taskIds: taskIdsToApprove })
            })
            .then(function(res) {
                if (!res.ok) {
                    return res.json().then(function(err) { 
                        throw new Error(err.message || 'Bulk approve failed'); 
                    });
                }
                return res.json();
            })
            .then(function(data) {
                showToast('success', 'Bulk Approved', data.results.successful + ' tasks approved, ' + data.results.failed + ' failed');
                selectedTasks.clear();
                loadTasks();
            })
            .catch(function(err) {
                showToast('error', 'Bulk Approve Failed', err.message);
            });
        }
    );
}

// ============ BULK REJECT ============
function bulkReject() {
    if (selectedTasks.size === 0) return;
    
    showConfirm(
        'Bulk Reject',
        'Reject ' + selectedTasks.size + ' selected task(s)? Default refund (95%) will be applied.',
        function() {
            const taskIdsToReject = Array.from(selectedTasks).map(function(id) {
                const task = allTasks.find(function(t) { return t._id === id; });
                return task ? task.taskId : null;
            }).filter(function(id) { return id !== null; });

            fetch(API_URL + '/api/admin/tasks/bulk/reject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ taskIds: taskIdsToReject, reason: 'Bulk rejected by admin' })
            })
            .then(function(res) {
                if (!res.ok) {
                    return res.json().then(function(err) { 
                        throw new Error(err.message || 'Bulk reject failed'); 
                    });
                }
                return res.json();
            })
            .then(function(data) {
                showToast('info', 'Bulk Rejected', data.results.successful + ' tasks rejected, ' + data.results.failed + ' failed');
                selectedTasks.clear();
                loadTasks();
            })
            .catch(function(err) {
                showToast('error', 'Bulk Reject Failed', err.message);
            });
        }
    );
}

// ============ BULK DELETE ============
function bulkDelete() {
    if (selectedTasks.size === 0) return;
    
    showConfirm(
        'Bulk Delete',
        'Delete ' + selectedTasks.size + ' selected task(s)? This cannot be undone!',
        function() {
            const taskIdsToDelete = Array.from(selectedTasks).map(function(id) {
                const task = allTasks.find(function(t) { return t._id === id; });
                return task ? task.taskId : null;
            }).filter(function(id) { return id !== null; });

            fetch(API_URL + '/api/admin/tasks/bulk/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + authToken
                },
                body: JSON.stringify({ taskIds: taskIdsToDelete })
            })
            .then(function(res) {
                if (!res.ok) {
                    return res.json().then(function(err) { 
                        throw new Error(err.message || 'Bulk delete failed'); 
                    });
                }
                return res.json();
            })
            .then(function(data) {
                showToast('success', 'Bulk Deleted', data.results.successful + ' tasks deleted, ' + data.results.failed + ' failed');
                selectedTasks.clear();
                loadTasks();
            })
            .catch(function(err) {
                showToast('error', 'Bulk Delete Failed', err.message);
            });
        }
    );
}

// ============ ✅ CONFIRM MODAL ============
function showConfirm(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = onConfirm;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    confirmCallback = null;
}

function handleConfirmYes() {
    if (confirmCallback) {
        confirmCallback();
    }
    closeConfirmModal();
}

// ============ FILTERS ============
function filterByStatus(status) {
    document.getElementById('filterStatus').value = status;
    applyFilters();
}

function applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const platform = document.getElementById('filterPlatform').value;
    const search = document.getElementById('searchInput').value.toLowerCase();

    filteredTasks = allTasks.slice();

    if (status !== 'all') {
        filteredTasks = filteredTasks.filter(function(t) { return t.status === status; });
    }

    if (platform !== 'all') {
        filteredTasks = filteredTasks.filter(function(t) {
            return t.category && t.category.name && t.category.name.toLowerCase() === platform;
        });
    }

    if (search) {
        filteredTasks = filteredTasks.filter(function(t) {
            return t.taskId.toLowerCase().includes(search) ||
                (t.advertiser && t.advertiser.username && t.advertiser.username.toLowerCase().includes(search)) ||
                (t.category && t.category.displayName && t.category.displayName.toLowerCase().includes(search)) ||
                (t.taskType && t.taskType.displayName && t.taskType.displayName.toLowerCase().includes(search));
        });
    }

    currentPage = 1;
    renderTasks();
}

// ============ EXPORT DATA ============
function exportData() {
    let csv = 'S/N,Task ID,Advertiser,Platform,Task Type,Participants,Completed,Budget,Earner Reward,Wallet,Status,Date & Time,URL\n';
    
    allTasks.forEach(function(task, index) {
        const advertiserUsername = task.advertiser ? (task.advertiser.username || 'Unknown') : 'Unknown';
        const categoryName = task.category ? (task.category.displayName || 'Unknown') : 'Unknown';
        const taskTypeName = task.taskType ? (task.taskType.displayName || 'Unknown') : 'Unknown';
        const advertiserBalance = task.advertiser ? (task.advertiser.balance || 0) : 0;
        const earnerReward = task.earnerReward || 0;
        const dateTime = new Date(task.createdAt).toLocaleString();
        
        csv += (index + 1) + ',"' + task.taskId + '","' + advertiserUsername + '","' + categoryName + '","' + taskTypeName + '",' + task.participants + ',' + (task.completedCount || 0) + ',' + task.totalBudget + ',' + earnerReward + ',' + advertiserBalance + ',"' + task.status + '","' + dateTime + '","' + task.taskUrl + '"\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'earncial_tasks_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('success', 'Export Complete', 'Tasks data exported successfully');
}

// ============ MODAL FUNCTIONS ============
function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
    currentTask = null;
    currentDescTab = 'default';
}

function viewTaskLink() {
    const url = document.getElementById('modalUrl').value;
    if (url) {
        window.open(url, '_blank');
    } else {
        showToast('error', 'No URL', 'Task URL is empty');
    }
}

function openTaskLink(url) {
    window.open(url, '_blank');
}

function switchDescTab(tab) {
    currentDescTab = tab;
    const tabs = document.querySelectorAll('.desc-tab');
    tabs.forEach(function(t) {
        t.classList.remove('active');
    });
    
    if (tab === 'default') {
        tabs[0].classList.add('active');
        document.getElementById('customDescGroup').style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        document.getElementById('customDescGroup').style.display = 'block';
    }
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
    
    updateCharts();
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
    
    toast.innerHTML = '<i class="fas fa-' + icon + '"></i><div><strong>' + title + '</strong><p style="margin:0;font-size:13px;color:var(--text-muted);">' + message + '</p></div>';
    
    container.appendChild(toast);

    setTimeout(function() {
        toast.remove();
    }, 4000);
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    const modalParticipants = document.getElementById('modalParticipants');
    if (modalParticipants) {
        modalParticipants.addEventListener('input', calculateBudget);
    }
    
    const modalReward = document.getElementById('modalReward');
    if (modalReward) {
        modalReward.addEventListener('input', calculateBudget);
    }
    
    const taskModal = document.getElementById('taskModal');
    if (taskModal) {
        taskModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    const imageModal = document.getElementById('imageModal');
    if (imageModal) {
        imageModal.addEventListener('click', function(e) {
            if (e.target === this) closeImageModal();
        });
    }
    
    const rejectModal = document.getElementById('rejectModal');
    if (rejectModal) {
        rejectModal.addEventListener('click', function(e) {
            if (e.target === this) closeRejectModal();
        });
    }
    
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
            if (e.target === this) closeConfirmModal();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
            closeModal();
            closeRejectModal();
            closeConfirmModal();
        }
    });
}

// ============ LOGOUT ============
function logout() {
    showConfirm(
        'Logout',
        'Are you sure you want to logout?',
        function() {
            stopAutoRefresh();
            localStorage.clear();
            window.location.href = 'sign-in.html';
        }
    );
}


// ============ 🐛 DEBUG IMAGE LOADING ============
function debugImageLoading() {
    console.log('🐛 Debugging image loading...');
    
    // Check first task with image
    const taskWithImage = allTasks.find(function(t) {
        return t.sampleImageTelegramFileId;
    });
    
    if (taskWithImage) {
        console.log('📸 Task with image found:', taskWithImage.taskId);
        console.log('📸 Telegram File ID:', taskWithImage.sampleImageTelegramFileId);
        console.log('📸 Sample Image URL:', taskWithImage.sampleImageUrl);
        console.log('📸 Full task object:', taskWithImage);
        
        // Try all possible URLs
        const url1 = API_URL + '/api/admin/tasks/' + encodeURIComponent(taskWithImage.taskId) + '/sample-image';
        const url2 = API_URL + '/api/admin/tasks/' + taskWithImage._id + '/sample-image';
        const url3 = API_URL + '/uploads/' + taskWithImage.sampleImageTelegramFileId;
        
        console.log('📸 URL 1 (taskId):', url1);
        console.log('📸 URL 2 (_id):', url2);
        console.log('📸 URL 3 (direct):', url3);
        
        // Test each URL
        console.log('🧪 Testing URL 1...');
        fetch(url1)
            .then(function(res) {
                console.log('URL 1 Status:', res.status, res.ok ? '✅' : '❌');
            })
            .catch(function(err) {
                console.log('URL 1 Error:', err.message);
            });
        
        console.log('🧪 Testing URL 2...');
        fetch(url2)
            .then(function(res) {
                console.log('URL 2 Status:', res.status, res.ok ? '✅' : '❌');
            })
            .catch(function(err) {
                console.log('URL 2 Error:', err.message);
            });
        
        console.log('🧪 Testing URL 3...');
        fetch(url3)
            .then(function(res) {
                console.log('URL 3 Status:', res.status, res.ok ? '✅' : '❌');
            })
            .catch(function(err) {
                console.log('URL 3 Error:', err.message);
            });
    } else {
        console.log('⚠️ No tasks with images found');
        console.log('All tasks:', allTasks);
    }
}

// Auto-run debug when tasks load
var originalLoadTasks = loadTasks;
loadTasks = function() {
    originalLoadTasks();
    setTimeout(debugImageLoading, 2000);
};



// ============ 🔐 FIX: LOAD IMAGES WITH AUTHENTICATION ============
// ============ 🖼️ IMAGE CACHE SYSTEM ============
var imageCache = {};

function loadAuthenticatedImage(imgElement, taskId, taskMongoId) {
    // Check cache first
    if (imageCache[taskId]) {
        console.log('✅ Using cached image for:', taskId);
        imgElement.src = imageCache[taskId];
        imgElement.style.display = 'block';
        imgElement.onclick = function() {
            openImageModal(imageCache[taskId], taskId);
        };
        return;
    }
    
    const imageUrl = API_URL + '/api/admin/tasks/' + encodeURIComponent(taskId) + '/sample-image';
    
    console.log('📥 Downloading image for:', taskId);
    
    fetch(imageUrl, {
            headers: { 'Authorization': 'Bearer ' + authToken }
        })
        .then(function(res) {
            if (!res.ok) {
                throw new Error('Failed: ' + res.status);
            }
            return res.blob();
        })
        .then(function(blob) {
            // Convert to base64 for permanent caching
            const reader = new FileReader();
            reader.onloadend = function() {
                const base64data = reader.result;
                
                // Cache the image
                imageCache[taskId] = base64data;
                console.log('✅ Cached image for:', taskId);
                
                // Display image
                imgElement.src = base64data;
                imgElement.style.display = 'block';
                imgElement.onclick = function() {
                    openImageModal(base64data, taskId);
                };
            };
            reader.readAsDataURL(blob);
        })
        .catch(function(err) {
            console.error('❌ Image load failed for ' + taskId + ':', err);
            imgElement.style.display = 'none';
            imgElement.parentElement.innerHTML = '<span class="no-image">Failed to load</span>';
        });
}

// Update handleImageError to use new cache system
handleImageError = function(img, fallbackUrl1, fallbackUrl2) {
    console.log('🔄 Trying authenticated load...');
    
    // Extract taskId from parent row
    const row = img.closest('tr');
    const taskIdElement = row.querySelector('strong');
    const taskId = taskIdElement ? taskIdElement.textContent : '';
    
    if (taskId) {
        loadAuthenticatedImage(img, taskId, '');
    } else {
        img.style.display = 'none';
        img.parentElement.innerHTML = '<span class="no-image">Failed to load</span>';
    }
};

// Clear cache on logout
var originalLogout = logout;
logout = function() {
    imageCache = {};
    originalLogout();
};

// ============ CLOSE IMAGE MODAL ============
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const img = document.getElementById('modalImage');
    if (img) {
        img.src = '';
    }
}

console.log('✅ Admin Task Manager Loaded - COMPLETE!');
console.log('🖼️ Image loading: FIXED');
console.log('📄 Pagination: ADDED');
console.log('📅 Date & Time: ADDED');
console.log('🔼🔽 Increase/Decrease: ADDED');