// ================================================
// EARNCIAL ADVERTISER DASHBOARD - COMPLETE
// advertiser-dashboard.js
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// ============ GLOBAL STATE ============
let activePollId = null;
let selectedOption = null;
let balanceVisible = true;
let stats = {
    totalTasks: 0,
    activeTasks: 0,
    totalDeposit: 0,
    totalImpressions: 0
};

// ============ CHECK AUTHENTICATION ============
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        alert('Please login first');
        window.location.href = 'sign-in.html';
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        
        // Update username display
        const usernameEl = document.getElementById('welcomeUsername');
        if (usernameEl) {
            usernameEl.textContent = currentUser.username || currentUser.fullName || 'Advertiser';
        }
        
        return true;
    } catch (e) {
        console.error('Invalid user data');
        localStorage.clear();
        window.location.href = 'sign-in.html';
        return false;
    }
}

// ============ SIDEBAR TOGGLE (Mobile) ============
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ============ THEME TOGGLE ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('themeIcon');
    
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// ============ BALANCE TOGGLE ============
function toggleBalance() {
    const balanceEl = document.getElementById('balanceDisplay');
    const eyeIcon = document.getElementById('eyeIcon');
    
    balanceVisible = !balanceVisible;
    
    if (balanceVisible) {
        balanceEl.classList.remove('hidden');
        eyeIcon.className = 'fas fa-eye';
    } else {
        balanceEl.classList.add('hidden');
        eyeIcon.className = 'fas fa-eye-slash';
    }
}

// ============ COUNTER ANIMATION ============
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const isCurrency = element.classList.contains('currency-counter');
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (isCurrency) {
            element.textContent = '₦' + Math.floor(current).toLocaleString();
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, duration / steps);
}

// ============ BALANCE ANIMATION ============
function animateBalance(targetBalance) {
    const balanceEl = document.getElementById('balanceDisplay');
    if (!balanceEl) return;
    
    const duration = 2500;
    const steps = 60;
    const increment = targetBalance / steps;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= targetBalance) {
            current = targetBalance;
            clearInterval(timer);
        }
        balanceEl.textContent = '₦' + current.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }, duration / steps);
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'info', title = '') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#00aaff'};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
        max-width: 350px;
    `;
    
    if (title) {
        toast.innerHTML = `<strong>${title}</strong><br>${message}`;
    } else {
        toast.textContent = message;
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 4000);
}

// ============ LOAD TASKS STATS ============
async function loadTasksStats() {
    try {
        console.log('📊 Loading tasks stats...');
        
        const res = await fetch(`${API_URL}/api/tasks/stats/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load stats');

        const data = await res.json();
        
        console.log('✅ Tasks stats loaded:', data);
        
        stats.totalTasks = data.total || 0;
        stats.activeTasks = data.active || 0;
        
        // Update counter elements
        const totalTasksCounter = document.querySelector('.counter[data-target="8"]');
        if (totalTasksCounter) {
            totalTasksCounter.setAttribute('data-target', stats.totalTasks);
            animateCounter(totalTasksCounter);
        }
        
        const activeTasksCounter = document.querySelector('.counter[data-target="45230"]');
        if (activeTasksCounter) {
            activeTasksCounter.setAttribute('data-target', stats.activeTasks);
            animateCounter(activeTasksCounter);
        }
        
    } catch (err) {
        console.error('❌ Load stats error:', err);
    }
}

// ============ LOAD DEPOSIT STATS ============
async function loadDepositStats() {
    try {
        console.log('💰 Loading deposit stats...');
        
        const res = await fetch(`${API_URL}/api/deposits/my-deposits?status=success&limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load deposits');

        const data = await res.json();
        const deposits = data.deposits || [];
        
        // Calculate total successful deposits
        const totalDeposit = deposits.reduce((sum, deposit) => {
            return sum + (deposit.amount || 0);
        }, 0);
        
        stats.totalDeposit = totalDeposit;
        
        console.log('✅ Total deposits:', totalDeposit);
        
        // Update total deposit counter
        const depositCounter = document.querySelector('.counter[data-target="1890"]');
        if (depositCounter) {
            depositCounter.classList.add('currency-counter');
            depositCounter.setAttribute('data-target', totalDeposit);
            animateCounter(depositCounter);
        }
        
    } catch (err) {
        console.error('❌ Load deposit stats error:', err);
    }
}

// ============ LOAD USER BALANCE ============
function loadUserBalance() {
    if (!currentUser) return;
    
    const balance = currentUser.balance || 0;
    
    // Set balance display
    const balanceEl = document.getElementById('balanceDisplay');
    if (balanceEl) {
        balanceEl.setAttribute('data-initial', balance);
        animateBalance(balance);
    }
}

// ============ FETCH ACTIVE POLL ============
async function fetchActivePoll() {
    try {
        console.log('📊 Fetching active poll...');
        
        const response = await fetch(`${API_URL}/api/polls/active`);
        const data = await response.json();

        if (data.success && data.poll) {
            activePollId = data.poll._id;
            displayPoll(data.poll);
            document.getElementById('pollCard').classList.add('active');
            console.log('✅ Active poll loaded:', data.poll.question);
        } else {
            console.log('ℹ️ No active poll available');
        }
    } catch (error) {
        console.error('❌ Error fetching poll:', error);
    }
}

// ============ DISPLAY POLL ============
function displayPoll(poll) {
    document.getElementById('pollQuestion').textContent = poll.question;
    
    const optionsContainer = document.getElementById('pollOptions');
    optionsContainer.innerHTML = '';

    poll.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'poll-option';
        optionDiv.onclick = () => selectPollOption(index);
        
        optionDiv.innerHTML = `
            <input type="radio" name="poll" id="option${index}" value="${option.text}">
            <label for="option${index}" style="cursor: pointer; flex: 1;">${option.text}</label>
        `;
        
        optionsContainer.appendChild(optionDiv);
    });
}

// ============ SELECT POLL OPTION ============
function selectPollOption(index) {
    document.querySelectorAll('.poll-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    const options = document.querySelectorAll('.poll-option');
    options[index].classList.add('selected');
    options[index].querySelector('input').checked = true;
    
    selectedOption = index;
    document.getElementById('pollSubmitBtn').disabled = false;
}

// ============ SUBMIT POLL VOTE ============
async function submitPollVote() {
    if (!activePollId || selectedOption === null) return;

    const submitBtn = document.getElementById('pollSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const response = await fetch(`${API_URL}/api/polls/${activePollId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ optionIndex: selectedOption })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Vote submitted successfully!', 'success');
            document.getElementById('pollCard').classList.remove('active');
        } else {
            showToast(data.message || 'Failed to submit vote', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Vote';
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        showToast('Error submitting vote. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Vote';
    }
}

// ============ FETCH ANNOUNCEMENTS ============
async function fetchAnnouncements() {
    try {
        const response = await fetch(`${API_URL}/api/content/announcements`);
        const data = await response.json();
        
        if (data.success && data.announcements && data.announcements.length > 0) {
            const announcement = data.announcements[0];
            showAnnouncementModal(announcement);
        } else {
            console.log('ℹ️ No announcements available');
            // Kar a nuna komai - babu default announcement
        }
    } catch (error) {
        console.error('❌ Error fetching announcements:', error);
        // Kar a nuna komai - idan error ya faru
    }
}

function showAnnouncementModal(announcement) {
    const modal = document.getElementById('announcementModal');
    if (!modal) return;
    
    const content = modal.querySelector('.modal-content');
    
    content.innerHTML = `
        <span class="close-modal" onclick="closeModal('announcementModal')">&times;</span>
        <div style="font-size: 50px; margin-bottom: 15px;">${announcement.icon || '📢'}</div>
        <h3 style="color: var(--text-main); margin-bottom:10px;">${announcement.title}</h3>
        <p style="color: var(--text-muted); line-height: 1.6;">${announcement.message}</p>
        <button class="btn-modal" onclick="closeModal('announcementModal')">Get Started</button>
    `;
    
    setTimeout(() => showModal('announcementModal'), 500);
}

// ============ FETCH SPONSORED ADS ============
async function fetchSponsoredAd() {
    try {
        const response = await fetch(`${API_URL}/api/content/ads`);
        const data = await response.json();
        
        if (data.success && data.ads && data.ads.length > 0) {
            const ad = data.ads[0];
            renderSponsoredCard(ad);
        } else {
            console.log('ℹ️ No sponsored ads available');
            // Hide ad card if no ads
            hideAdCard();
        }
    } catch (error) {
        console.error('❌ Error fetching sponsored ad:', error);
        // Hide ad card on error
        hideAdCard();
    }
}

function renderSponsoredCard(ad) {
    const adCard = document.querySelector('.ad-card-pro');
    if (!adCard) return;
    
    // Show the ad card
    adCard.style.display = 'flex';
    
    adCard.innerHTML = `
        <div class="ad-badge">SPONSORED</div>
        <img src="${ad.imageUrl || 'https://placehold.co/600x150/00aaff/ffffff?text=Ad+Image'}" 
             alt="${ad.title}" class="ad-image" 
             onerror="this.src='https://placehold.co/600x150/00aaff/ffffff?text=Ad+Image'">
        <div class="ad-content">
            <div class="ad-title">${ad.title}</div>
            <div class="ad-description">${ad.description}</div>
            <div class="ad-price">${ad.ctaText || 'Learn More'}</div>
            <div class="ad-btn">View Details</div>
        </div>
    `;
    
    adCard.onclick = () => showSponsoredAdModal(ad);
}

function hideAdCard() {
    const adCard = document.querySelector('.ad-card-pro');
    if (adCard) {
        adCard.style.display = 'none';
    }
}

function showSponsoredAdModal(ad) {
    document.getElementById('sponsoredImage').src = ad.imageUrl || 'https://placehold.co/600x200/00aaff/ffffff?text=Sponsored';
    document.getElementById('sponsoredTitle').textContent = ad.title;
    document.getElementById('sponsoredDescription').textContent = ad.description;
    document.getElementById('sponsoredPrice').textContent = ad.ctaText || 'Learn More';
    
    const actionBtn = document.getElementById('sponsoredActionBtn');
    actionBtn.textContent = ad.ctaText || 'Get Offer';
    actionBtn.onclick = () => {
        if (ad.targetUrl) {
            window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
        }
        closeModal('sponsoredModal');
    };
    
    showModal('sponsoredModal');
}

// ============ MODAL FUNCTIONS ============
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ============ SWITCH ACCOUNT ============
function switchAccountType() {
    if (!confirm('Switch to Earner Dashboard?')) return;
    
    showToast('Switching to Earner account...', 'info');
    
    setTimeout(() => {
        window.location.href = 'earner-dashboard.html';
    }, 1000);
}

// ============ LOGOUT ============
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('earncial_token');
        localStorage.removeItem('earncial_user');
        window.location.href = 'sign-in.html';
    }
}

// ============ WINDOW RESIZE HANDLER ============
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
});

// ============ CLOSE MODALS ON OUTSIDE CLICK ============
window.onclick = (event) => {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// ============ ATTACH SWITCH ACCOUNT BUTTON ============
document.addEventListener('DOMContentLoaded', () => {
    const switchBtn = document.getElementById('switchAccountBtn');
    if (switchBtn) {
        switchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchAccountType();
        });
    }
});

// ============ INITIALIZATION ============
async function init() {
    if (!checkAuth()) return;
    
    console.log('🚀 Initializing Advertiser Dashboard...');
    
    // Load theme
    loadTheme();
    
    // Load user balance
    loadUserBalance();
    
    // Load stats
    await loadTasksStats();
    await loadDepositStats();
    
    // Fetch content
    fetchAnnouncements();
    fetchActivePoll();
    fetchSponsoredAd();
    
    // Welcome message
    setTimeout(() => {
        showToast(`Welcome back, ${currentUser.username || 'Advertiser'}!`, 'info');
    }, 500);
    
    console.log('✅ Dashboard initialized successfully');
}

window.addEventListener('DOMContentLoaded', init);

// ============ EXPORTS ============
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.toggleBalance = toggleBalance;
window.submitPollVote = submitPollVote;
window.closeModal = closeModal;
window.logout = logout;

console.log('✅ Advertiser Dashboard JS Loaded');
console.log('📍 API URL:', API_URL);