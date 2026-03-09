
// ================================================
// EARNCIAL - ADMIN SUBMISSIONS MANAGEMENT (COMPLETE FINAL VERSION)
// File: public/js/admin-submissions.js
// ✅ Custom Modals (No alert/confirm/prompt)
// ✅ Rejection Reasons Dropdown
// ✅ Referred By Column
// ✅ Copy Handle Icon
// ================================================

// Configuration
const API_URL = 'http://localhost:5000';
let authToken = localStorage.getItem('earncial_token');

// Global State
let allSubmissions = [];
let currentSubmission = null;
let selectedSubmissions = new Set();
let currentPage = 1;
let itemsPerPage = 10;
let filteredSubmissions = [];
let submissionsChart = null;
let currentUser = null;

// Modal State
let modalResolve = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    console.log('🚀 Initializing Admin Submissions Panel...');

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('.theme-toggle i');
        if (icon) icon.className = 'fas fa-sun';
    }

    // Check authentication and admin role
    const isAdmin = await checkAuth();
    if (!isAdmin) return;

    // Load data from API
    await fetchSubmissions();

    // Set default filter to pending
    const filterStatusEl = document.getElementById('filterStatus');
    if (filterStatusEl) {
        filterStatusEl.value = 'pending';
    }

    // Filter submissions to pending before displaying
    filteredSubmissions = allSubmissions.filter(sub => sub.status === 'pending');

    loadSubmissions();
    initializeChart();

    // Setup task ID search
    const searchTaskId = document.getElementById('searchTaskId');
    if (searchTaskId) {
        searchTaskId.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 500);
        });
    }
}

// ==================== AUTHENTICATION ====================
async function checkAuth() {
    try {
        authToken = localStorage.getItem('earncial_token');

        if (!authToken) {
            console.error('❌ No auth token found');
            await openActionModal({
                title: 'Authentication Required',
                message: 'Please login first',
                needInput: false
            });
            window.location.href = '../sign-in.html';
            return false;
        }

        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('❌ Auth failed:', response.status);
            localStorage.removeItem('earncial_token');
            await openActionModal({
                title: 'Session Expired',
                message: 'Your session has expired. Please login again.',
                needInput: false
            });
            window.location.href = '../sign-in.html';
            return false;
        }

        const data = await response.json();

        if (!data.success) {
            console.error('❌ Auth failed:', data.message);
            localStorage.removeItem('earncial_token');
            window.location.href = '../sign-in.html';
            return false;
        }

        currentUser = data.user;

        console.log('✅ User authenticated:', currentUser.username);
        console.log('👤 User role:', currentUser.role);

        if (currentUser.role !== 'admin') {
            console.error('❌ Access denied: User is not admin');
            await openActionModal({
                title: 'Access Denied',
                message: 'Admin privileges required',
                needInput: false
            });
            window.location.href = '../dashboard.html';
            return false;
        }

        console.log('✅ Admin access granted');
        return true;

    } catch (error) {
        console.error('❌ Auth check error:', error);
        await openActionModal({
            title: 'Authentication Error',
            message: 'Please login again.',
            needInput: false
        });
        window.location.href = '../sign-in.html';
        return false;
    }
}

// ==================== API HELPER FUNCTION ====================
async function apiRequest(endpoint, options = {}) {
    authToken = localStorage.getItem('earncial_token');

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, finalOptions);

        if (response.status === 401 || response.status === 403) {
            console.error('❌ Authentication failed');
            localStorage.removeItem('earncial_token');
            await openActionModal({
                title: 'Session Expired',
                message: 'Please login again.',
                needInput: false
            });
            window.location.href = '../sign-in.html';
            throw new Error('Authentication failed');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('❌ API Request Error:', error);
        throw error;
    }
}

// ==================== FETCH SUBMISSIONS ====================
async function fetchSubmissions() {
    try {
        showLoading(true);

        console.log('📥 Fetching submissions from /api/admin/submissions/all');

        const data = await apiRequest('/api/admin/submissions/all?limit=1000');

        if (data.success && data.submissions) {
            allSubmissions = data.submissions.map(sub => {
                const task = sub.task || {};
                const user = sub.user || {};
                const handle = sub.socialHandle || {};
                const advertiser = task.advertiser || {};

                return {
                    id: sub._id,
                    taskId: task.taskId || task.customId || 'N/A',

                    // USER INFO
                    earnerUsername: user.username || 'Unknown',
                    advertiserUsername: advertiser.username || 'Unknown',
                    referredBy: user.referredBy || null, // ✅ NEW

                    // TASK INFO
                    taskName: task.title || 'Unknown Task',
                    taskType: task.taskType?.displayName || task.taskType?.name || 'Unknown',
                    platform: task.category?.displayName || task.category?.name || 'Unknown',

                    // SOCIAL HANDLE INFO
                    accountUsed: handle.handle || handle.username || 'Unknown',
                    profileLink: handle.profileLink || '#',

                    // TASK DETAILS
                    taskLink: task.link || '#',
                    taskBudget: task.budget || 0,

                    // SCREENSHOT
                    screenshot: sub.screenshot || null,

                    // FINANCIAL INFO
                    reward: sub.earnerReward || 0,
                    amountSpent: (task.completedCount || 0) * (sub.earnerReward || 0),

                    // PROGRESS INFO
                    participations: task.completedCount || 0,
                    targetParticipations: task.participants || 0,

                    // STATUS & DATES
                    status: sub.status || 'pending',
                    submittedDate: sub.createdAt,
                    notes: sub.notes || '',

                    // WALLET INFO
                    mainBalance: user.balance || 0,
                    earningsBalance: user.earningsBalance || 0,

                    // REVIEW INFO
                    reviewedAt: sub.reviewedAt,
                    rejectionReason: sub.rejectionReason || '',
                    adminNotes: sub.adminNotes || ''
                };
            });

            console.log('✅ Loaded', allSubmissions.length, 'submissions');

            if (allSubmissions.length > 0) {
                console.log('📊 Sample submission:', {
                    taskName: allSubmissions[0].taskName,
                    taskBudget: allSubmissions[0].taskBudget,
                    taskLink: allSubmissions[0].taskLink,
                    profileLink: allSubmissions[0].profileLink,
                    screenshot: allSubmissions[0].screenshot,
                    referredBy: allSubmissions[0].referredBy
                });
            }

            updateStats();
        } else {
            allSubmissions = [];
            console.log('⚠️ No submissions data received');
        }

        showLoading(false);
    } catch (error) {
        console.error('❌ Error fetching submissions:', error);
        showToast('error', 'Error', 'Failed to load submissions: ' + error.message);
        showLoading(false);
        allSubmissions = [];
    }
}

// ==================== UPDATE STATS ====================
function updateStats() {
    const statsData = filteredSubmissions.length > 0 ? filteredSubmissions : allSubmissions;

    const pending = statsData.filter(s => s.status === 'pending').length;
    const approved = statsData.filter(s => s.status === 'approved').length;
    const rejected = statsData.filter(s => s.status === 'rejected').length;

    const totalRevenue = statsData.reduce((sum, s) => sum + (s.reward || 0), 0);
    const totalPaid = statsData
        .filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + (s.reward || 0), 0);

    const today = new Date().toDateString();

    const totalPaidToday = statsData
        .filter(s => {
            if (s.status !== 'approved' || !s.reviewedAt) return false;
            const reviewDate = new Date(s.reviewedAt).toDateString();
            return reviewDate === today;
        })
        .reduce((sum, s) => sum + (s.reward || 0), 0);

    const approvedTodayCount = statsData
        .filter(s => {
            if (s.status !== 'approved' || !s.reviewedAt) return false;
            const reviewDate = new Date(s.reviewedAt).toDateString();
            return reviewDate === today;
        }).length;

    const pendingAmount = statsData
        .filter(s => s.status === 'pending')
        .reduce((sum, s) => sum + (s.reward || 0), 0);

    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
    document.getElementById('rejectedCount').textContent = rejected;
    document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString();
    document.getElementById('totalPaid').textContent = totalPaid.toLocaleString();
    document.getElementById('totalPaidToday').textContent = totalPaidToday.toLocaleString();

    const approvedTodayEl = document.getElementById('approvedTodayCount');
    if (approvedTodayEl) approvedTodayEl.textContent = approvedTodayCount;

    document.getElementById('pendingAmount').textContent = pendingAmount.toLocaleString();
    document.getElementById('totalSubmittedTasks').textContent = statsData.length;
}

// ==================== TIME PERIOD FILTER ====================
function filterByTimePeriod(submissions, period) {
    if (period === 'all') return submissions;

    const now = new Date();
    const filtered = submissions.filter(sub => {
        const subDate = new Date(sub.submittedDate);
        const diffTime = Math.abs(now - subDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (period) {
            case 'today': return diffDays === 0;
            case 'yesterday': return diffDays === 1;
            case '3days': return diffDays <= 3;
            case '7days': return diffDays <= 7;
            case '2weeks': return diffDays <= 14;
            case '3weeks': return diffDays <= 21;
            case '1month': return diffDays <= 30;
            case '3months': return diffDays <= 90;
            case '6months': return diffDays <= 180;
            case '1year': return diffDays <= 365;
            default: return true;
        }
    });

    return filtered;
}

// ==================== LOAD SUBMISSIONS TABLE ====================
function loadSubmissions() {
    const tbody = document.getElementById('submissionsTableBody');
    if (!tbody) {
        console.error("❌ Error: Element 'submissionsTableBody' not found!");
        return;
    }

    tbody.innerHTML = '';

    if (filteredSubmissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-folder-open" style="font-size:32px;margin-bottom:10px;opacity:0.5;"></i><p>No submissions found</p></td></tr>';
        updatePagination();
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageSubmissions = filteredSubmissions.slice(start, end);

    pageSubmissions.forEach((submission, index) => {
        const globalIndex = start + index + 1;
        const progress = submission.targetParticipations > 0
            ? Math.min((submission.participations / submission.targetParticipations) * 100, 100)
            : 0;

        const row = document.createElement('tr');
        if (selectedSubmissions.has(submission.id)) {
            row.classList.add('selected');
        }

        const screenshotUrl = submission.screenshot
            ? `${API_URL}${submission.screenshot}`
            : 'https://via.placeholder.com/400x600/ccc/666?text=No+Screenshot';

        const formattedDate = formatDate(submission.submittedDate);

        row.innerHTML = `
            <td class="checkbox-cell">
                <input type="checkbox" ${selectedSubmissions.has(submission.id) ? 'checked' : ''} onchange="toggleSubmissionSelection('${submission.id}')">
            </td>
            
            <td class="sn-cell">
                ${globalIndex}
            </td>
            
            <td>
                <strong>${escapeHtml(submission.earnerUsername)}</strong>
            </td>
            
            <td>
                <span style="color: var(--text-muted); font-size: 13px;">
                    ${submission.referredBy || '<i>Direct</i>'}
                </span>
            </td>
            
            <td>
                <div class="task-id-container">
                    <span class="badge-task-id">${submission.taskId}</span>
                    <br>
                    <i class="fas fa-copy" style="margin-top:5px; cursor:pointer; color:var(--primary);" title="Copy ID" onclick="copyTaskId('${submission.taskId}')"></i>
                </div>
            </td>
            
            <td>
                ${escapeHtml(submission.taskType)}
            </td>
            
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>${escapeHtml(submission.accountUsed)}</span>
                    <i class="fas fa-copy" 
                       style="cursor: pointer; color: var(--primary); font-size: 12px;" 
                       title="Copy Handle" 
                       onclick="copyToClipboard('${escapeHtml(submission.accountUsed)}', 'Handle')"></i>
                </div>
            </td>
            
            <td>
                <img src="${screenshotUrl}" class="screenshot-thumb" onclick="viewFullscreen('${screenshotUrl}')" alt="Screenshot" onerror="this.src='https://via.placeholder.com/50x50/ccc/666?text=No+Image'">
            </td>
            
            <td>
                <strong>₦${(submission.taskBudget || 0).toLocaleString()}</strong>
            </td>
            
            <td>
                <strong>₦${(submission.amountSpent || 0).toLocaleString()}</strong>
            </td>
            
            <td>
                <div>${submission.participations || 0}/${submission.targetParticipations || 0}</div>
                <div class="progress-bar-container" style="margin-top:5px;">
                    <div class="progress-bar" style="width:${progress}%"></div>
                </div>
                <small style="color:var(--text-muted);">${progress.toFixed(0)}%</small>
            </td>
            
            <td>
                <strong>₦${(submission.reward || 0).toLocaleString()}</strong>
            </td>
            
            <td>
                <span class="status-badge status-${submission.status}">${submission.status.toUpperCase()}</span>
            </td>
            
            <td>
                ${formattedDate}
            </td>
            
            <td>
                <div class="action-btns">
                    <button class="btn btn-view" onclick="viewSubmission('${submission.id}')" title="Review">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-view" onclick="window.open('${escapeHtml(submission.profileLink)}', '_blank')" title="View Profile">
                        <i class="fas fa-user"></i>
                    </button>
                    <button class="btn btn-view" onclick="window.open('${escapeHtml(submission.taskLink)}', '_blank')" title="View Task">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                    <button class="btn btn-reject" onclick="deleteScreenshot('${submission.id}')" title="Delete Screenshot Only">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    ${submission.status === 'pending' ? `
                        <button class="btn btn-approve" onclick="quickApprove('${submission.id}')" title="Quick Approve">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-reject" onclick="quickReject('${submission.id}')" title="Quick Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePagination();
    updateBulkActionsBar();
}

// ==================== COPY TO CLIPBOARD ====================
function copyToClipboard(text, label = 'Text') {
    if (!text || text === 'Unknown' || text === 'N/A') {
        showToast('info', 'Nothing to Copy', 'No valid data to copy');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('success', 'Copied!', `${label} copied to clipboard`);
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('error', 'Copy Failed', 'Failed to copy to clipboard');
    });
}

// ==================== COPY TASK ID ====================
function copyTaskId(id) {
    copyToClipboard(id, 'Task ID');
}

// ==================== PAGINATION ====================
function updatePagination() {
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, filteredSubmissions.length);

    document.getElementById('showingStart').textContent = filteredSubmissions.length > 0 ? start : 0;
    document.getElementById('showingEnd').textContent = end;
    document.getElementById('totalItems').textContent = filteredSubmissions.length;

    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;

    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = () => goToPage(i);
        pageNumbers.appendChild(btn);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadSubmissions();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        loadSubmissions();
    }
}

function goToPage(page) {
    currentPage = page;
    loadSubmissions();
}

function changePageSize() {
    itemsPerPage = parseInt(document.getElementById('pageSize').value);
    currentPage = 1;
    loadSubmissions();
}

// ==================== SELECTION ====================
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll').checked;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageSubmissions = filteredSubmissions.slice(start, end);

    if (selectAll) {
        pageSubmissions.forEach(sub => selectedSubmissions.add(sub.id));
    } else {
        pageSubmissions.forEach(sub => selectedSubmissions.delete(sub.id));
    }
    loadSubmissions();
}

function toggleSubmissionSelection(submissionId) {
    if (selectedSubmissions.has(submissionId)) {
        selectedSubmissions.delete(submissionId);
    } else {
        selectedSubmissions.add(submissionId);
    }
    loadSubmissions();
}

function updateBulkActionsBar() {
    const bar = document.getElementById('bulkActionsBar');
    const count = document.getElementById('selectedCount');

    if (selectedSubmissions.size > 0) {
        bar.classList.add('active');
        count.textContent = selectedSubmissions.size;
    } else {
        bar.classList.remove('active');
    }
}

// ==================== VIEW SUBMISSION MODAL ====================
function viewSubmission(submissionId) {
    currentSubmission = allSubmissions.find(s => s.id === submissionId);
    if (!currentSubmission) return;

    document.getElementById('modalEarnerUsername').textContent = currentSubmission.earnerUsername;
    document.getElementById('modalAdvertiserUsername').textContent = currentSubmission.advertiserUsername;
    document.getElementById('modalTaskType').textContent = currentSubmission.taskType;
    document.getElementById('modalPlatform').textContent = currentSubmission.platform;
    document.getElementById('modalHandleUsed').textContent = currentSubmission.accountUsed;

    const taskLink = currentSubmission.taskLink || '#';
    document.getElementById('modalTaskLink').innerHTML = `<a href="${taskLink}" target="_blank" style="color:var(--primary);">${escapeHtml(taskLink)}</a>`;

    document.getElementById('modalTaskBudget').textContent = '₦' + (currentSubmission.taskBudget || 0).toLocaleString();

    document.getElementById('modalAmountSpent').textContent = '₦' + (currentSubmission.amountSpent || 0).toLocaleString();
    document.getElementById('modalOriginalReward').textContent = '₦' + (currentSubmission.reward || 0).toLocaleString();
    document.getElementById('modalDate').textContent = formatDate(currentSubmission.submittedDate);

    const screenshotUrl = currentSubmission.screenshot
        ? `${API_URL}${currentSubmission.screenshot}`
        : 'https://via.placeholder.com/400x600/ccc/666?text=No+Screenshot';

    document.getElementById('modalScreenshot').src = screenshotUrl;
    document.getElementById('modalScreenshot').onerror = function () {
        this.src = 'https://via.placeholder.com/400x600/ccc/666?text=No+Image';
    };

    document.getElementById('modalStatus').innerHTML = `<span class="status-badge status-${currentSubmission.status}">${currentSubmission.status.toUpperCase()}</span>`;

    document.getElementById('modalMainBalance').textContent = (currentSubmission.mainBalance || 0).toLocaleString();
    document.getElementById('modalEarningsBalance').textContent = (currentSubmission.earningsBalance || 0).toLocaleString();

    if (currentSubmission.notes && currentSubmission.notes.trim() !== '') {
        document.getElementById('notesSection').style.display = 'block';
        document.getElementById('modalNotes').textContent = currentSubmission.notes;
    } else {
        document.getElementById('notesSection').style.display = 'none';
    }

    document.getElementById('reviewModal').classList.add('active');
}

// ==================== APPROVE SUBMISSION ====================
async function approveSubmission() {
    if (!currentSubmission) return;

    const confirmed = await openActionModal({
        title: 'Approve Submission',
        message: `Approve this submission and pay ₦${currentSubmission.reward} to ${currentSubmission.earnerUsername}?`,
        needInput: false
    });

    if (!confirmed) return;

    try {
        showLoading(true);

        const data = await apiRequest(`/api/admin/submissions/${currentSubmission.id}/approve`, {
            method: 'POST',
            body: JSON.stringify({
                notes: 'Approved from admin panel'
            })
        });

        if (data.success) {
            closeModal();
            await fetchSubmissions();
            applyFilters();
            showToast('success', 'Approved', data.message || `Payment of ₦${currentSubmission.reward} processed to earnings balance`);
        }

        showLoading(false);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', error.message || 'Failed to approve submission');
        showLoading(false);
    }
}

// ==================== REJECT SUBMISSION ====================
async function rejectSubmission() {
    if (!currentSubmission) return;

    const reason = await openActionModal({
        title: 'Reject Submission',
        message: `Enter rejection reason for ${currentSubmission.earnerUsername}:`,
        needInput: true,
        needReasonDropdown: true,
        placeholder: 'Select or enter rejection reason'
    });

    if (!reason) return;

    try {
        showLoading(true);

        const data = await apiRequest(`/api/admin/submissions/${currentSubmission.id}/reject`, {
            method: 'POST',
            body: JSON.stringify({
                reason,
                notes: 'Rejected from admin panel'
            })
        });

        if (data.success) {
            closeModal();
            await fetchSubmissions();
            applyFilters();
            showToast('error', 'Rejected', data.message || 'Submission rejected');
        }

        showLoading(false);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', error.message || 'Failed to reject submission');
        showLoading(false);
    }
}

// ==================== QUICK ACTIONS ====================
async function quickApprove(submissionId) {
    const sub = allSubmissions.find(s => s.id === submissionId);
    if (!sub) return;

    const confirmed = await openActionModal({
        title: 'Quick Approve',
        message: `Approve and pay ₦${sub.reward} to ${sub.earnerUsername}?`,
        needInput: false
    });

    if (!confirmed) return;

    try {
        showLoading(true);

        const data = await apiRequest(`/api/admin/submissions/${submissionId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ notes: 'Quick approve' })
        });

        if (data.success) {
            await fetchSubmissions();
            applyFilters();
            showToast('success', 'Approved', `Payment of ₦${sub.reward} processed to earnings balance`);
        }

        showLoading(false);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', error.message || 'Failed to approve submission');
        showLoading(false);
    }
}

async function quickReject(submissionId) {
    const sub = allSubmissions.find(s => s.id === submissionId);
    if (!sub) return;

    const reason = await openActionModal({
        title: 'Quick Reject',
        message: `Enter rejection reason for ${sub.earnerUsername}:`,
        needInput: true,
        needReasonDropdown: true,
        placeholder: 'Select or enter rejection reason'
    });

    if (!reason) return;

    try {
        showLoading(true);

        const data = await apiRequest(`/api/admin/submissions/${submissionId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason, notes: 'Quick reject' })
        });

        if (data.success) {
            await fetchSubmissions();
            applyFilters();
            showToast('error', 'Rejected', 'Submission rejected');
        }

        showLoading(false);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', error.message || 'Failed to reject submission');
        showLoading(false);
    }
}

// ==================== BULK ACTIONS ====================
async function bulkApprove() {
    if (selectedSubmissions.size === 0) return;

    const confirmed = await openActionModal({
        title: 'Bulk Approve',
        message: `Approve and pay for ${selectedSubmissions.size} selected submission(s)?`,
        needInput: false
    });

    if (!confirmed) return;

    try {
        showLoading(true);

        const submissionIds = Array.from(selectedSubmissions);

        const data = await apiRequest('/api/admin/submissions/bulk/approve', {
            method: 'POST',
            body: JSON.stringify({ submissionIds })
        });

        if (data.success) {
            selectedSubmissions.clear();
            await fetchSubmissions();
            applyFilters();
            showToast('success', 'Bulk Approved', data.message || 'Submissions approved and payments processed to earnings balance');
        }

        showLoading(false);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', error.message || 'Failed to approve submissions');
        showLoading(false);
    }
}

async function bulkReject() {
    if (selectedSubmissions.size === 0) return;

    const reason = await openActionModal({
        title: 'Bulk Reject',
        message: `Enter rejection reason for ${selectedSubmissions.size} selected submission(s):`,
        needInput: true,
        needReasonDropdown: true,
        placeholder: 'Select or enter rejection reason'
    });

    if (!reason) return;

    try {
        showLoading(true);

        const submissionIds = Array.from(selectedSubmissions);

        const data = await apiRequest('/api/admin/submissions/bulk/rejected', {
            method: 'POST',
            body: JSON.stringify({ submissionIds, reason })
        });

        if (data.success) {
            selectedSubmissions.clear();
            await fetchSubmissions();
            applyFilters();
            showToast('error', 'Bulk Rejected', data.message || 'Submissions rejected');
        }

        showLoading(false);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error', error.message || 'Failed to reject submissions');
        showLoading(false);
    }
}

// ==================== DELETE SCREENSHOT ====================
async function deleteScreenshot(submissionId) {
    const sub = allSubmissions.find(s => s.id === submissionId);
    const username = sub ? sub.earnerUsername : 'this user';

    const confirmed = await openActionModal({
        title: 'Delete Screenshot',
        message: `Are you sure you want to delete the screenshot for ${username}? This will remove it from Telegram and our database.`,
        needInput: false
    });

    if (!confirmed) return;

    try {
        showLoading(true);

        const data = await apiRequest(`/api/admin/submissions/${submissionId}/screenshot`, {
            method: 'DELETE'
        });

        if (data.success) {
            showToast('success', 'Deleted', data.message || 'Screenshot removed successfully');

            await fetchSubmissions();
            applyFilters();

            if (currentSubmission && currentSubmission.id === submissionId) {
                viewSubmission(submissionId);
            }
        }

        showLoading(false);
    } catch (error) {
        console.error('❌ Delete Error:', error);
        showToast('error', 'Error', error.message || 'Failed to delete screenshot');
        showLoading(false);
    }
}

// ==================== FILTERS ====================
function filterByStatus(status) {
    document.getElementById('filterStatus').value = status;
    applyFilters();
}

function applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const taskType = document.getElementById('filterTask').value;
    const timePeriod = document.getElementById('filterTimePeriod').value;
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const searchTaskId = document.getElementById('searchTaskId') ? document.getElementById('searchTaskId').value.toLowerCase().trim() : '';

    let timeFiltered = filterByTimePeriod(allSubmissions, timePeriod);

    filteredSubmissions = timeFiltered.filter(sub => {
        const matchStatus = status === 'all' || sub.status === status;
        const matchTask = taskType === 'all' || sub.taskType === taskType;
        const matchTaskId = !searchTaskId || (sub.taskId && sub.taskId.toLowerCase().includes(searchTaskId));
        const matchSearch = !search ||
            (sub.earnerUsername && sub.earnerUsername.toLowerCase().includes(search)) ||
            (sub.advertiserUsername && sub.advertiserUsername.toLowerCase().includes(search)) ||
            (sub.taskName && sub.taskName.toLowerCase().includes(search));

        return matchStatus && matchTask && matchTaskId && matchSearch;
    });

    currentPage = 1;
    loadSubmissions();
    updateStats();

    if (submissionsChart) {
        const chartData = prepareChartData();
        submissionsChart.data.labels = chartData.labels;
        submissionsChart.data.datasets[0].data = chartData.approved;
        submissionsChart.data.datasets[1].data = chartData.pending;
        submissionsChart.data.datasets[2].data = chartData.rejected;
        submissionsChart.update();
    }
}

// ==================== CHART ====================
function initializeChart() {
    const ctx = document.getElementById('submissionsChart');
    if (!ctx) return;

    const context = ctx.getContext('2d');
    const chartData = prepareChartData();

    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    submissionsChart = new Chart(context, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Approved',
                    data: chartData.approved,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Pending',
                    data: chartData.pending,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Rejected',
                    data: chartData.rejected,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: { family: 'Poppins' }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: gridColor,
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        font: { family: 'Poppins' }
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

function prepareChartData() {
    const last30Days = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        last30Days.push(date.toISOString().split('T')[0]);
    }

    const approved = [];
    const pending = [];
    const rejected = [];

    last30Days.forEach(date => {
        const daySubmissions = allSubmissions.filter(s => {
            const subDate = new Date(s.submittedDate).toISOString().split('T')[0];
            return subDate === date;
        });
        approved.push(daySubmissions.filter(s => s.status === 'approved').length);
        pending.push(daySubmissions.filter(s => s.status === 'pending').length);
        rejected.push(daySubmissions.filter(s => s.status === 'rejected').length);
    });

    const labels = last30Days.map(date => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });

    return { labels, approved, pending, rejected };
}

function updateChartTheme() {
    if (!submissionsChart) return;

    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    submissionsChart.options.plugins.legend.labels.color = textColor;
    submissionsChart.options.plugins.tooltip.backgroundColor = isDark ? '#1e293b' : '#ffffff';
    submissionsChart.options.plugins.tooltip.titleColor = textColor;
    submissionsChart.options.plugins.tooltip.bodyColor = textColor;
    submissionsChart.options.plugins.tooltip.borderColor = gridColor;
    submissionsChart.options.scales.y.ticks.color = textColor;
    submissionsChart.options.scales.y.grid.color = gridColor;
    submissionsChart.options.scales.x.ticks.color = textColor;
    submissionsChart.options.scales.x.grid.color = gridColor;

    submissionsChart.update();
}

// ==================== EXPORT DATA ====================
function exportData() {
    let csv = 'S/N,submissionId,taskId,earnerUsername,referredBy,advertiserUsername,taskTitle,taskType,category,accountUsed,taskUrl,profileLink,totalBudget,earnerReward,participations,status,createdAt,reviewedAt,notes,rejectionReason,adminNotes\n';

    const dataToExport = allSubmissions;

    if (dataToExport.length === 0) {
        showToast('info', 'Export', 'No data available to export with current filters');
        return;
    }

    dataToExport.forEach((sub, index) => {
        const createdAt = sub.submittedDate ? new Date(sub.submittedDate).toLocaleString() : 'N/A';
        const reviewedAt = sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleString() : 'N/A';
        const progress = `${sub.participations}/${sub.targetParticipations}`;

        const clean = (val) => {
            if (!val) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
        };

        const row = [
            index + 1,
            clean(sub.id),
            clean(sub.taskId),
            clean(sub.earnerUsername),
            clean(sub.referredBy || 'Direct'),
            clean(sub.advertiserUsername),
            clean(sub.taskName),
            clean(sub.taskType),
            clean(sub.platform),
            clean(sub.accountUsed),
            clean(sub.taskLink),
            clean(sub.profileLink),
            sub.taskBudget || 0,
            sub.reward || 0,
            clean(progress),
            clean(sub.status),
            clean(createdAt),
            clean(reviewedAt),
            clean(sub.notes),
            clean(sub.rejectionReason),
            clean(sub.adminNotes)
        ];

        csv += row.join(',') + '\n';
    });

    try {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = `earncial_submissions_export_${new Date().toISOString().split('T')[0]}.csv`;

        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);

        showToast('success', 'Export Complete', `${dataToExport.length} records exported successfully`);
    } catch (err) {
        console.error('Export Error:', err);
        showToast('error', 'Export Failed', 'An error occurred while generating the CSV');
    }
}

// ==================== MODAL FUNCTIONS ====================
function closeModal() {
    document.getElementById('reviewModal').classList.remove('active');
    currentSubmission = null;
}

function viewFullscreen(imageSrc) {
    document.getElementById('fullscreenImage').src = imageSrc;
    document.getElementById('fullscreenOverlay').classList.add('active');
}

function closeFullscreen() {
    document.getElementById('fullscreenOverlay').classList.remove('active');
}

// ==================== CUSTOM ACTION MODAL ====================
function openActionModal({ title, message, needInput = false, needReasonDropdown = false, placeholder = '' }) {
    return new Promise((resolve) => {
        modalResolve = resolve;

        document.getElementById('actionModalTitle').textContent = title;
        document.getElementById('actionModalMessage').textContent = message;

        const input = document.getElementById('actionModalInput');
        const reasonSelect = document.getElementById('actionModalReasonSelect');
        const customReason = document.getElementById('actionModalCustomReason');

        input.style.display = 'none';
        reasonSelect.style.display = 'none';
        customReason.style.display = 'none';

        if (needReasonDropdown) {
            reasonSelect.style.display = 'block';
            reasonSelect.value = '';

            reasonSelect.onchange = function () {
                if (this.value === 'custom') {
                    customReason.style.display = 'block';
                    customReason.value = '';
                    customReason.focus();
                } else {
                    customReason.style.display = 'none';
                }
            };
        } else if (needInput) {
            input.style.display = 'block';
            input.value = '';
            input.placeholder = placeholder;
            setTimeout(() => input.focus(), 100);
        }

        document.getElementById('actionModal').classList.add('active');

        document.getElementById('actionModalConfirmBtn').onclick = () => {
            let value = true;

            if (needReasonDropdown) {
                const selectedReason = reasonSelect.value;

                if (!selectedReason) {
                    showToast('error', 'Error', 'Please select a rejection reason');
                    return;
                }

                if (selectedReason === 'custom') {
                    const custom = customReason.value.trim();
                    if (!custom) {
                        showToast('error', 'Error', 'Please enter a custom rejection reason');
                        return;
                    }
                    value = custom;
                } else {
                    value = selectedReason;
                }
            } else if (needInput) {
                value = input.value.trim();
                if (!value) {
                    showToast('error', 'Error', 'Please enter a value');
                    return;
                }
            }

            closeActionModal();
            resolve(value);
        };

        const handleEnter = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                document.getElementById('actionModalConfirmBtn').click();
            }
        };

        input.addEventListener('keydown', handleEnter);
        customReason.addEventListener('keydown', handleEnter);
    });
}

function closeActionModal() {
    document.getElementById('actionModal').classList.remove('active');
    if (modalResolve) {
        modalResolve(false);
        modalResolve = null;
    }
}

// ==================== SIDEBAR FUNCTIONS ====================
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ==================== THEME TOGGLE ====================
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

    if (submissionsChart) {
        updateChartTheme();
    }
}

// ==================== UTILITY FUNCTIONS ====================
function showLoading(show) {
    const tbody = document.getElementById('submissionsTableBody');
    if (!tbody) return;

    if (show) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:30px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:var(--primary);"></i><p style="margin-top:10px;color:var(--text-muted);">Loading...</p></td></tr>';
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ==================== TOAST NOTIFICATION ====================
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? 'check-circle' :
        type === 'error' ? 'times-circle' :
            type === 'info' ? 'info-circle' : 'exclamation-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div>
            <strong>${title}</strong>
            <p style="margin:0;font-size:13px;color:var(--text-muted);">${message}</p>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => toast.remove(), 300);
    }, 6000);
}

// ==================== REFRESH DATA ====================
async function refreshData() {
    selectedSubmissions.clear();
    await fetchSubmissions();
    filteredSubmissions = [...allSubmissions];
    currentPage = 1;
    loadSubmissions();

    if (submissionsChart) {
        const chartData = prepareChartData();
        submissionsChart.data.labels = chartData.labels;
        submissionsChart.data.datasets[0].data = chartData.approved;
        submissionsChart.data.datasets[1].data = chartData.pending;
        submissionsChart.data.datasets[2].data = chartData.rejected;
        submissionsChart.update();
    }

    showToast('success', 'Refreshed', 'Data updated successfully');
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshData();
    }

    if (e.key === 'Escape') {
        closeModal();
        closeFullscreen();
        closeActionModal();
    }

    if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            previousPage();
        }
    }

    if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
            nextPage();
        }
    }
});

// ==================== SEARCH INPUT DEBOUNCE ====================
let searchTimeout;
const searchInput = document.getElementById('searchInput');

if (searchInput) {
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 500);
    });
}

// ==================== CLICK OUTSIDE TO CLOSE ====================
document.addEventListener('click', function (e) {
    const fullscreenOverlay = document.getElementById('fullscreenOverlay');
    if (fullscreenOverlay && e.target === fullscreenOverlay) {
        closeFullscreen();
    }

    const reviewModal = document.getElementById('reviewModal');
    if (reviewModal && e.target === reviewModal) {
        closeModal();
    }

    const actionModal = document.getElementById('actionModal');
    if (actionModal && e.target === actionModal) {
        closeActionModal();
    }
});

// ==================== PREVENT ACCIDENTAL PAGE CLOSE ====================
window.addEventListener('beforeunload', function (e) {
    if (selectedSubmissions.size > 0) {
        e.preventDefault();
        e.returnValue = '';
        return 'You have selected submissions. Are you sure you want to leave?';
    }
});

// ==================== CONSOLE MESSAGES ====================
console.log('%c🎉 Earncial Admin Panel Loaded!', 'color: #00aaff; font-size: 16px; font-weight: bold;');
console.log('%c⚡ Version: 2.0.0 - Complete', 'color: #10b981; font-size: 12px;');
console.log('%c🔒 Admin Mode Active', 'color: #ef4444; font-size: 12px;');
console.log('%c💰 Payments to Earnings Balance', 'color: #f59e0b; font-size: 12px;');
console.log('%c✅ Custom Modals Active', 'color: #8b5cf6; font-size: 12px;');

// ==================== ERROR HANDLERS ====================
window.addEventListener('error', function (e) {
    console.error('Global Error:', e.error);
    showToast('error', 'Error', 'An unexpected error occurred. Check console.');
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled Promise Rejection:', e.reason);
    showToast('error', 'Error', 'An unexpected error occurred. Check console.');
});

// ==================== PERFORMANCE MONITORING ====================
window.addEventListener('load', function () {
    const loadTime = performance.now();
    console.log(`%c⚡ Page loaded in ${loadTime.toFixed(2)}ms`, 'color: #10b981; font-size: 12px;');
});

// ==================== END OF FILE ====================
console.log('%c✅ All functions loaded successfully!', 'color: #10b981; font-size: 14px; font-weight: bold;');