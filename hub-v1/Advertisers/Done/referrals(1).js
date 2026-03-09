// ============================================================
// REFERRALS - COMPLETE WITH FILTERS, TICKER & ANIMATIONS
// ============================================================

const API_URL = 'http://localhost:5000';

let allReferrals = []; // Store all referrals for filtering

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const themeIcon = document.getElementById('themeIcon');

function checkAuth() {
    const token = localStorage.getItem('earncial_token');
    const user = localStorage.getItem('earncial_user');
    
    if (!token || !user) {
        window.location.href = 'sign-in.html';
        return false;
    }
    
    try {
        return JSON.parse(user);
    } catch (e) {
        window.location.href = 'sign-in.html';
        return false;
    }
}

function loadReferralLink() {
    const user = checkAuth();
    if (!user) return;
    
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/sign-up.html?ref=${user.username}`;
    
    const input = document.getElementById('referralLink');
    if (input) input.value = link;
}

function copyReferralLink() {
    const input = document.getElementById('referralLink');
    const btn = document.getElementById('copyBtn');
    
    if (!input) return;
    
    input.select();
    input.setSelectionRange(0, 99999);
    document.execCommand('copy');
    
    const icon = btn ? btn.querySelector('i') : null;
    if (icon) icon.className = 'fas fa-check';
    if (btn) {
        btn.style.background = '#10b981';
        btn.style.color = 'white';
    }
    
    setTimeout(() => {
        if (icon) icon.className = 'fas fa-copy';
        if (btn) {
            btn.style.background = 'white';
            btn.style.color = '#00aaff';
        }
    }, 2000);
}

window.copyReferralLink = copyReferralLink;

async function shareReferralLink() {
    const input = document.getElementById('referralLink');
    if (!input) return;
    
    const link = input.value;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Join Earncial',
                text: 'Join and earn!',
                url: link
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                copyReferralLink();
            }
        }
    } else {
        copyReferralLink();
    }
}

window.shareReferralLink = shareReferralLink;

function animateNumber(element, targetValue, duration = 1000) {
    if (!element) return;
    
    const startValue = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = targetValue.toLocaleString();
        }
    }
    
    requestAnimationFrame(update);
}

async function loadReferrals() {
    try {
        const token = localStorage.getItem('earncial_token');
        
        if (!token) {
            showEmpty();
            return;
        }
        
        const res = await fetch(`${API_URL}/api/referrals/my-referrals`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await res.json();
        
        if (res.ok && data && data.success && Array.isArray(data.referrals)) {
            if (data.referrals.length > 0) {
                allReferrals = data.referrals;
                applyFilters();
                calculateAndDisplayStats(data.referrals);
                await loadStatsFromAPI();
            } else {
                showEmpty();
                updateStatsUI(0, 0, 0, 0);
            }
        } else {
            showEmpty();
            updateStatsUI(0, 0, 0, 0);
        }
        
    } catch (error) {
        showEmpty();
        updateStatsUI(0, 0, 0, 0);
    }
}

window.loadReferrals = loadReferrals;

function applyFilters() {
    const accountTypeFilter = document.getElementById('filterAccountType')?.value || 'all';
    const statusFilter = document.getElementById('filterStatus')?.value || 'all';
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    let filtered = allReferrals;
    
    if (accountTypeFilter !== 'all') {
        filtered = filtered.filter(ref => 
            ref.accountType.toLowerCase() === accountTypeFilter
        );
    }
    
    if (statusFilter !== 'all') {
        if (statusFilter === 'activated') {
            filtered = filtered.filter(ref => ref.isActivated === true);
        } else if (statusFilter === 'pending') {
            filtered = filtered.filter(ref => ref.isActivated !== true);
        }
    }
    
    if (searchQuery) {
        filtered = filtered.filter(ref => 
            ref.username.toLowerCase().includes(searchQuery)
        );
    }
    
    if (filtered.length > 0) {
        renderReferrals(filtered);
    } else {
        const tbody = document.getElementById('referralsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:40px;">
                        <i class="fas fa-filter" style="font-size:48px;opacity:0.3;"></i>
                        <p style="margin-top:15px;">No referrals match your filters</p>
                    </td>
                </tr>
            `;
        }
    }
}

function setupFilters() {
    const accountTypeFilter = document.getElementById('filterAccountType');
    const statusFilter = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchInput');
    
    if (accountTypeFilter) {
        accountTypeFilter.addEventListener('change', applyFilters);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
}

function calculateAndDisplayStats(referrals) {
    const total = referrals.length;
    const earners = referrals.filter(r => r.accountType === 'Earner').length;
    const advertisers = referrals.filter(r => r.accountType === 'Advertiser').length;
    const earnings = referrals.reduce((sum, r) => sum + (r.profit || r.reward || 0), 0);
    
    updateStatsUI(total, earners, advertisers, earnings);
}

async function loadStatsFromAPI() {
    try {
        const token = localStorage.getItem('earncial_token');
        
        const res = await fetch(`${API_URL}/api/referrals/stats`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await res.json();
        
        if (res.ok && data && data.success && data.stats) {
            const earningsEl = document.getElementById('referralEarnings');
            const tickerEarnings = document.getElementById('tickerEarnings');
            
            if (earningsEl) animateNumber(earningsEl, data.stats.earnings);
            if (tickerEarnings) animateNumber(tickerEarnings, data.stats.earnings);
        }
    } catch (error) {
        // Silent fail
    }
}

function updateStatsUI(total, earners, advertisers, earnings) {
    const totalEl = document.getElementById('totalReferrals');
    const earnersEl = document.getElementById('earnerCount');
    const advertisersEl = document.getElementById('advertiserCount');
    const earningsEl = document.getElementById('referralEarnings');
    
    if (totalEl) animateNumber(totalEl, total);
    if (earnersEl) animateNumber(earnersEl, earners);
    if (advertisersEl) animateNumber(advertisersEl, advertisers);
    if (earningsEl) animateNumber(earningsEl, earnings);
    
    const tickerTotal = document.getElementById('tickerTotal');
    const tickerEarnings = document.getElementById('tickerEarnings');
    
    if (tickerTotal) animateNumber(tickerTotal, total);
    if (tickerEarnings) animateNumber(tickerEarnings, earnings);
}

function renderReferrals(referrals) {
    const tbody = document.getElementById('referralsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = referrals.map((ref, i) => {
        const username = ref.username || 'User' + (i + 1);
        const accountType = ref.accountType || 'Earner';
        const profit = ref.profit || ref.reward || 0;
        const joinedDate = new Date(ref.joinedAt || ref.createdAt).toLocaleDateString();
        const activated = ref.isActivated || false;
        //d1fae5 065f46
        const statusBadge = activated 
            ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:#00aaff;color:#ffff;border-radius:20px;font-size:12px;font-weight:600;">
                <i class="fas fa-check-circle" style="color:#ffff;"></i> Activated
               </span>`
            : `<span style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:#fee2e2;color:#991b1b;border-radius:20px;font-size:12px;font-weight:600;">
                <i class="fas fa-times-circle"></i> Not Activated
               </span>`;
        
        return `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${username}</strong></td>
                <td>${accountType}</td>
                <td>${statusBadge}</td>
                <td><strong style="color:#10b981;">₦${profit.toLocaleString()}</strong></td>
               <td>${joinedDate}</td>
            </tr>
        `;
    }).join('');
}

function showEmpty() {
    const tbody = document.getElementById('referralsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:40px;">
                    <i class="fas fa-users" style="font-size:48px;opacity:0.3;"></i>
                    <p style="margin-top:15px;">No referrals yet</p>
                </td>
            </tr>
        `;
    }
}

function openSidebar() {
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    if (themeIcon) {
        themeIcon.className = document.body.classList.contains('dark-mode') ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;

function setupLogoutModal() {
    const logoutBtn = document.getElementById('logoutBtn');
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const modal = document.getElementById('logoutModal');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) modal.classList.add('active');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'sign-in.html';
        });
    }
}

async function init() {
    if (!checkAuth()) return;
    
    loadTheme();
    loadReferralLink();
    setupLogoutModal();
    setupFilters();
    await loadReferrals();
}

window.addEventListener('DOMContentLoaded', init);
