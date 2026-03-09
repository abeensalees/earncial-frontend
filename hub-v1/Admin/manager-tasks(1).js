
// ================================================
// EARNCIAL - ADMIN TASKS MANAGER (FIXED CALCULATIONS!)
// Accurate Profit = (Advertiser Reward - Earner Reward) × Completed
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

// ============ ANALYTICS DATA ============
let analyticsData = {
    totalRevenue: 0,           // Total budget from advertisers
    todayRevenue: 0,           // Today's budget
    totalPayout: 0,            // Actual payout to earners (completed tasks)
    todayPayout: 0,            // Today's payout
    platformProfit: 0,         // Total platform profit
    todayProfit: 0,            // Today's platform profit
    totalPendingPayout: 0,     // Expected payout (not yet completed)
    totalExpectedProfit: 0     // Expected total profit
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
    }, 30000);
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
    
    fetch(API_URL + '/api/admin/tasks/all', {
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

// ============ 📊 CALCULATE ANALYTICS (100% ACCURATE!) ============
function calculateAnalytics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Reset analytics
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
    
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 CALCULATING ANALYTICS');
    console.log('='.repeat(60));
    
    allTasks.forEach(function(task) {
        const taskDate = new Date(task.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        const isToday = taskDate.getTime() === today.getTime();
        
        // Only count approved/active tasks
        if (['active', 'completed', 'paused'].includes(task.status)) {
            
            // 1. REVENUE (Total budget from advertiser)
            const revenue = task.totalBudget || 0;
            analyticsData.totalRevenue += revenue;
            
            if (isToday) {
                analyticsData.todayRevenue += revenue;
            }
            
            // 2. Get task details
            const advertiserReward = task.reward || 0;           // e.g., ₦8
            const earnerReward = task.earnerReward || 0;         // e.g., ₦5
            const completedCount = task.completedCount || 0;     // e.g., 10
            const totalParticipants = task.participants || 0;    // e.g., 50
            
            // 3. PROFIT PER TASK = Advertiser Reward - Earner Reward
            const profitPerTask = advertiserReward - earnerReward; // e.g., ₦8 - ₦5 = ₦3
            
            // 4. ACTUAL PAYOUT (completed tasks only)
            const actualPayout = completedCount * earnerReward;
            analyticsData.totalPayout += actualPayout;
            
            if (isToday) {
                analyticsData.todayPayout += actualPayout;
            }
            
            // 5. ACTUAL PROFIT (from completed tasks)
            const actualProfit = completedCount * profitPerTask;
            analyticsData.platformProfit += actualProfit;
            
            if (isToday) {
                analyticsData.todayProfit += actualProfit;
            }
            
            // 6. PENDING PAYOUT (not yet completed)
            const remainingSlots = totalParticipants - completedCount;
            const pendingPayout = remainingSlots * earnerReward;
            analyticsData.totalPendingPayout += pendingPayout;
            
            // 7. EXPECTED TOTAL PROFIT (if all slots completed)
            const expectedProfit = totalParticipants * profitPerTask;
            analyticsData.totalExpectedProfit += expectedProfit;
            
            // Debug log for first few tasks
            if (allTasks.indexOf(task) < 3) {
                console.log('');
                console.log('Task:', task.taskId);
                console.log('  Advertiser Reward:', '₦' + advertiserReward);
                console.log('  Earner Reward:', '₦' + earnerReward);
                console.log('  Profit Per Task:', '₦' + profitPerTask);
                console.log('  Completed:', completedCount + '/' + totalParticipants);
                console.log('  Actual Payout:', '₦' + actualPayout);
                console.log('  Actual Profit:', '₦' + actualProfit);
                console.log('  Expected Profit:', '₦' + expectedProfit);
            }
        }
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 FINAL ANALYTICS:');
    console.log('   Total Revenue:', '₦' + analyticsData.totalRevenue.toLocaleString());
    console.log('   Total Payout:', '₦' + analyticsData.totalPayout.toLocaleString());
    console.log('   Platform Profit:', '₦' + analyticsData.platformProfit.toLocaleString());
    console.log('   Expected Profit:', '₦' + analyticsData.totalExpectedProfit.toLocaleString());
    console.log('='.repeat(60));
    console.log('');
}

// ============ 💳 RENDER REVENUE CARDS (100% ACCURATE!) ============
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

// ============ 📈 UPDATE CHARTS (100% ACCURATE!) ============
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
    
    console.log('📊 Building Revenue Chart...');
    
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
                    // Revenue
                    dayRevenue += task.totalBudget || 0;
                    
                    // Payout & Profit
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
        
        console.log(dayName + ':', {
            revenue: dayRevenue,
            payout: dayPayout,
            profit: dayProfit
        });
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
    
    console.log('✅ Revenue Chart created successfully');
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

// ============ 🖼️ IMAGE MODAL ============
function openImageModal(imageUrl, taskId) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    const caption = document.getElementById('imageCaption');
    
    img.src = imageUrl;
    caption.textContent = 'Task: ' + taskId;
    modal.style.display = 'flex';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.getElementById('modalImage').src = '';
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

// ============ RENDER TASKS TABLE ============
function renderTasks() {
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';

    if (filteredTasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:40px;color:var(--text-muted);">No tasks found</td></tr>';
        updateBulkActionsBar();
        return;
    }

    filteredTasks.forEach(function(task, index) {
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
        
        const imageHtml = task.sampleImageUrl 
            ? '<img src="' + API_URL + task.sampleImageUrl + '" class="task-thumbnail" onclick="openImageModal(\'' + API_URL + task.sampleImageUrl + '\', \'' + task.taskId + '\')" onerror="this.style.display=\'none\'" title="Click to view">'
            : '<span class="no-image">No image</span>';
        
        const reviewButtons = task.status === 'review' 
            ? '<button class="btn btn-approve" onclick="quickApprove(\'' + task._id + '\')" title="Approve"><i class="fas fa-check"></i> Approve</button><button class="btn btn-reject" onclick="quickReject(\'' + task._id + '\')" title="Reject"><i class="fas fa-times"></i> Reject</button>'
            : '';
        
        row.innerHTML = '<td class="checkbox-cell"><input type="checkbox" ' + (selectedTasks.has(task._id) ? 'checked' : '') + ' onchange="toggleTaskSelection(\'' + task._id + '\')"></td>' +
            '<td class="sn-cell">' + (index + 1) + '</td>' +
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
            '<td>' + (task.completedCount || 0) + '/' + task.participants + '</td>' +
            '<td><strong>₦' + task.totalBudget.toLocaleString() + '</strong></td>' +
            '<td><strong style="color:var(--success)">₦' + earnerReward.toLocaleString() + '</strong></td>' +
            '<td>₦' + advertiserWallet.toLocaleString() + '</td>' +
            '<td><span class="status-badge status-' + task.status + '">' + task.status.toUpperCase() + '</span></td>' +
            '<td>' + formatDate(task.createdAt) + '</td>' +
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
}

// ============ FORMAT DATE ============
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// ============ TOGGLE SELECT ALL ============
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll').checked;
    if (selectAll) {
        filteredTasks.forEach(function(task) {
            selectedTasks.add(task._id);
        });
    } else {
        selectedTasks.clear();
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
        if (selectedTasks.size === filteredTasks.length && filteredTasks.length > 0) {
            selectAll.checked = true;
        } else {
            selectAll.checked = false;
        }
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

    if (!confirm('Approve task ' + currentTask.taskId + '? This will activate the task.')) return;

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

// ============ QUICK APPROVE ============
function quickApprove(taskId) {
    const task = allTasks.find(function(t) { return t._id === taskId; });
    if (!task) {
        showToast('error', 'Error', 'Task not found');
        return;
    }

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

// ============ REJECT TASK ============
function rejectTask() {
    if (!currentTask) return;

    const reason = prompt('Enter rejection reason (optional):');
    const encodedTaskId = encodeURIComponent(currentTask.taskId);
    
    fetch(API_URL + '/api/admin/tasks/' + encodedTaskId + '/reject', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({ reason: reason || 'Task rejected' })
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
        showToast('error', 'Task Rejected', 'Task ' + currentTask.taskId + ' rejected');
        closeModal();
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

    if (!confirm('Reject task ' + task.taskId + '?')) return;

    const encodedTaskId = encodeURIComponent(task.taskId);
    
    fetch(API_URL + '/api/admin/tasks/' + encodedTaskId + '/reject', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        body: JSON.stringify({ reason: 'Task rejected' })
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
        showToast('error', 'Task Rejected', 'Task ' + task.taskId + ' rejected');
        loadTasks();
    })
    .catch(function(err) {
        showToast('error', 'Rejection Failed', err.message);
    });
}

// ============ DELETE TASK ============
function deleteTask(taskId) {
    const task = allTasks.find(function(t) { return t._id === taskId; });
    if (!task) return;

    if (!confirm('Delete task ' + task.taskId + '? This cannot be undone!')) return;

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

// ============ BULK APPROVE ============
function bulkApprove() {
    if (selectedTasks.size === 0) return;
    
    if (!confirm('Approve ' + selectedTasks.size + ' selected task(s)?')) return;

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

// ============ BULK REJECT ============
function bulkReject() {
    if (selectedTasks.size === 0) return;
    
    const reason = prompt('Enter rejection reason (optional):') || 'Bulk rejected';
    
    if (!confirm('Reject ' + selectedTasks.size + ' selected task(s)?')) return;

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
        body: JSON.stringify({ taskIds: taskIdsToReject, reason: reason })
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

// ============ BULK DELETE ============
function bulkDelete() {
    if (selectedTasks.size === 0) return;
    
    if (!confirm('Delete ' + selectedTasks.size + ' selected task(s)? This cannot be undone!')) return;

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

    renderTasks();
}

// ============ EXPORT DATA ============
function exportData() {
    let csv = 'S/N,Task ID,Advertiser,Platform,Task Type,Participants,Completed,Budget,Earner Reward,Wallet,Status,Date,URL\n';
    
    allTasks.forEach(function(task, index) {
        const advertiserUsername = task.advertiser ? (task.advertiser.username || 'Unknown') : 'Unknown';
        const categoryName = task.category ? (task.category.displayName || 'Unknown') : 'Unknown';
        const taskTypeName = task.taskType ? (task.taskType.displayName || 'Unknown') : 'Unknown';
        const advertiserBalance = task.advertiser ? (task.advertiser.balance || 0) : 0;
        const earnerReward = task.earnerReward || 0;
        
        csv += (index + 1) + ',"' + task.taskId + '","' + advertiserUsername + '","' + categoryName + '","' + taskTypeName + '",' + task.participants + ',' + (task.completedCount || 0) + ',' + task.totalBudget + ',' + earnerReward + ',' + advertiserBalance + ',"' + task.status + '","' + formatDate(task.createdAt) + '","' + task.taskUrl + '"\n';
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
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
            closeModal();
        }
    });
}

// ============ LOGOUT ============
function logout() {
    if (confirm('Logout?')) {
        stopAutoRefresh();
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }
}

console.log('✅ Complete Admin Task Manager Loaded - 100% ACCURATE CALCULATIONS!');
console.log('💰 Profit Formula: (Advertiser Reward - Earner Reward) × Completed Count');