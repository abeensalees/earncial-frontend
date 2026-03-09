
// ================================================
// EARNCIAL EARNER DASHBOARD - REAL DATA ONLY
// No Fake Data - Pure Backend Integration
// ================================================

// ============ CONSTANTS ============
const API_URL = 'http://localhost:5000';

// ============ GLOBAL VARIABLES ============
let isBalanceHidden = false;
let currentTheme = 'light';
let chartInstance = null;
let walletSwiper = null;
let notificationsEnabled = false;
let selectedPollOption = null;
let selectedPollText = '';
let isActivated = false;
let currentUser = null;
let token = null;

// ============ CHECK AUTHENTICATION ============
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');
    
    if (!token || !userData) {
        window.location.href = 'sign-in.html';
        return false;
    }
    
    try {
        currentUser = JSON.parse(userData);
        return true;
    } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.clear();
        window.location.href = 'sign-in.html';
        return false;
    }
}

// ============ SIDEBAR =================
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============ THEME TOGGLE =================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('themeIcon');
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        currentTheme = 'dark';
        localStorage.setItem('earncial_theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        currentTheme = 'light';
        localStorage.setItem('earncial_theme', 'light');
    }
    if (chartInstance) updateChartTheme();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('earncial_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

// ============ BALANCE TOGGLE =================
function toggleBalance() {
    const balanceDisplay = document.getElementById('balanceDisplay');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (isBalanceHidden) {
        balanceDisplay.classList.remove('hidden');
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
        // Restore real balance
        if (currentUser && currentUser.balance !== undefined) {
            balanceDisplay.textContent = '₦' + currentUser.balance.toLocaleString('en-US', {minimumFractionDigits: 2});
        }
    } else {
        balanceDisplay.classList.add('hidden');
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
        balanceDisplay.textContent = '₦•••••';
    }
    
    isBalanceHidden = !isBalanceHidden;
}

// ============ NOTIFICATION MODAL =================
function showNotificationModal() {
    const btn = document.getElementById('notifEnableBtn');
    
    if (notificationsEnabled) {
        // User wants to DISABLE
        notificationsEnabled = false;
        btn.classList.remove('enabled');
        document.getElementById('notifBtnText').textContent = 'Enable Notifications';
        document.getElementById('notifIcon').className = 'fas fa-bell-slash';
        
        showModal('notifDisabledModal');
    } else {
        // User wants to ENABLE
        showModal('notificationSettingsModal');
    }
}

function confirmNotifications() {
    notificationsEnabled = true;
    const btn = document.getElementById('notifEnableBtn');
    const btnText = document.getElementById('notifBtnText');
    const notifIcon = document.getElementById('notifIcon');
    
    btn.classList.add('enabled');
    btnText.textContent = 'Notifications On';
    notifIcon.className = 'fas fa-bell';
    
    closeModal('notificationSettingsModal');
    
    setTimeout(() => {
        showModal('notifEnabledModal');
    }, 300);
}

// ============ VOTE MODAL =================
function showVoteModal() {
    if (!selectedPollOption) {
        showToast('Please select an option first!', 'warning');
        return;
    }
    document.getElementById('selectedOption').textContent = selectedPollText;
    showModal('voteModal');
}

async function submitVote() {
    if (!selectedPollOption) return;
    
    try {
        const pollSection = document.querySelector('.poll-section');
        const pollId = pollSection.getAttribute('data-poll-id');
        
        const res = await fetch(`${API_URL}/api/polls/${pollId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                optionIndex: selectedPollOption 
            })
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to submit vote');
        }
        
        const data = await res.json();
        
        closeModal('voteModal');
        
        setTimeout(() => {
            showModal('voteSuccessModal');
            // Reload poll to show results
            setTimeout(() => {
                loadActivePoll();
            }, 2000);
        }, 300);
        
    } catch (error) {
        console.error('Vote error:', error);
        showToast(error.message, 'error');
    }
}

// ============ LOGOUT MODAL =================
function showLogoutModal() {
    showModal('logoutModal');
}

function confirmLogout() {
    localStorage.clear();
    window.location.href = 'sign-in.html';
}

// ============ CLOSE ADMIN MESSAGE =================
function closeAdminMessage() {
    document.getElementById('adminMessageBanner').classList.add('hidden');
}

// ============ COPY REFERRAL LINK =================
function copyRefLink() {
    const input = document.getElementById('refLinkInput');
    input.select();
    document.execCommand('copy');
    
    showModal('copySuccessModal');
}

// ============ WALLET SLIDER =================
function initializeWalletSlider() {
    walletSwiper = new Swiper('#walletSwiper', {
        autoplay: {
            delay: 4000,
            disableOnInteraction: false,
        },
        loop: true,
        speed: 800,
    });
}

// ============ LOAD USER DATA =================
async function loadUserData() {
    try {
        const res = await fetch(`${API_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'sign-in.html';
                return;
            }
            throw new Error('Failed to load user data');
        }
        
        const data = await res.json();
        currentUser = data.user;
        
        // Save to localStorage
        localStorage.setItem('earncial_user', JSON.stringify(currentUser));
        
        // Update UI
        updateUserUI();
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast(error.message, 'error');
    }
}

// ============ UPDATE USER UI =================
function updateUserUI() {
    if (!currentUser) return;
    
    // Username
    document.getElementById('userName').textContent = currentUser.username || currentUser.fullName || 'User';
    
    // Balance
    const balanceDisplay = document.getElementById('balanceDisplay');
    if (balanceDisplay && currentUser.balance !== undefined) {
        balanceDisplay.textContent = '₦' + currentUser.balance.toLocaleString('en-US', {minimumFractionDigits: 2});
    }
    
    // Referral link
    const refLinkInput = document.getElementById('refLinkInput');
    if (refLinkInput && currentUser.username) {
        refLinkInput.value = `https://earncial.com/sign-up?ref=${currentUser.username}`;
    }
    
    // Stats
    document.getElementById('totalEarnings').textContent = '₦' + (currentUser.totalEarnings || 0).toLocaleString();
    document.getElementById('completedTasks').textContent = currentUser.completedTasks || 0;
    document.getElementById('pendingTasks').textContent = currentUser.pendingTasks || 0;
    document.getElementById('pendingAmount').textContent = '₦' + (currentUser.pendingAmount || 0).toLocaleString();
    document.getElementById('activeReferrals').textContent = currentUser.referralCount || 0;
    document.getElementById('submittedTasks').textContent = currentUser.submittedTasks || 0;
    
    // Withdrawals
    document.getElementById('totalWithdrawn').textContent = '₦' + (currentUser.totalWithdrawn || 0).toLocaleString();
    document.getElementById('lastWithdrawal').textContent = '₦' + (currentUser.lastWithdrawal || 0).toLocaleString();
    
    if (currentUser.lastWithdrawalDate) {
        const date = new Date(currentUser.lastWithdrawalDate);
        const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        document.getElementById('lastWithdrawalDate').textContent = daysAgo === 0 ? 'Today' : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
    }
    
    // Referral progress
    updateReferralProgress();
}

// ============ CHECK ACTIVATION STATUS =================
async function checkActivationStatus() {
    try {
        const res = await fetch(`${API_URL}/api/activation/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to check activation');
        
        const data = await res.json();
        isActivated = data.user.isActivated;
        
        const banner = document.getElementById('activationBanner');
        const withdrawBtn = document.getElementById('withdrawBtn');
        
        if (!isActivated && data.activation.required) {
            // Show activation banner
            banner.classList.remove('hidden');
            
            // Update banner content from settings
            if (data.activation.banner) {
                const bannerType = data.activation.banner.type || 'warning';
                banner.className = `activation-banner ${bannerType}`;
                
                const title = banner.querySelector('h3');
                const text = banner.querySelector('p');
                const btn = banner.querySelector('.activation-btn');
                const icon = title.querySelector('i');
                
                title.childNodes[1].textContent = ' ' + (data.activation.banner.title || 'Account Not Activated');
                text.innerHTML = (data.activation.banner.message || 'Activate your account').replace(/{amount}/g, `₦${data.activation.fee}`);
                btn.innerHTML = `<i class="fas ${data.activation.banner.buttonIcon || 'fa-check-circle'}"></i> ${data.activation.banner.buttonText || 'Activate Now'}`;
                
                if (data.activation.banner.icon) {
                    icon.className = `fas ${data.activation.banner.icon}`;
                }
                
                document.getElementById('activationAmount').textContent = '₦' + data.activation.fee;
            }
            
            // Change withdraw button
            if (withdrawBtn) {
                withdrawBtn.innerHTML = '<i class="fas fa-lock"></i> Activate';
                withdrawBtn.href = 'activation.html';
            }
        } else {
            banner.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Error checking activation:', error);
    }
}

// ============ LOAD ADMIN MESSAGE =================
async function loadAdminMessage() {
    try {
        const res = await fetch(`${API_URL}/api/admin/messages/for-user`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load admin message');
        
        const data = await res.json();
        
        if (!data.success || !data.message) {
            document.getElementById('adminMessageBanner').classList.add('hidden');
            return;
        }
        
        const message = data.message;
        const banner = document.getElementById('adminMessageBanner');
        
        banner.className = `admin-message-banner ${message.type || ''}`;
        banner.classList.remove('hidden');
        
        document.getElementById('adminMessageTitle').textContent = message.title;
        document.getElementById('adminMessageText').textContent = message.text;
        
        const icon = banner.querySelector('.admin-message-icon i');
        if (message.icon) {
            icon.className = `fas ${message.icon}`;
        }
        
    } catch (error) {
        console.error('Error loading admin message:', error);
        document.getElementById('adminMessageBanner').classList.add('hidden');
    }
}

// ============ LOAD REFERRAL SETTINGS =================
async function loadReferralSettings() {
    try {
        const res = await fetch(`${API_URL}/api/admin/referrals/settings`);
        
        if (!res.ok) throw new Error('Failed to load referral settings');
        
        const data = await res.json();
        const settings = data.settings || {};
        
        // Update benefits
        if (settings.earnerBonus) {
            document.getElementById('earnerBonus').textContent = '₦' + settings.earnerBonus;
        }
        if (settings.advertiserBonus) {
            document.getElementById('advertiserBonus').textContent = settings.advertiserBonus + '%';
        }
        
        // Update achievement section
        if (settings.achievement) {
            const goal = settings.achievement.goal || 100;
            const active = settings.achievement.active !== false;
            
            document.getElementById('refGoal').textContent = goal;
            document.getElementById('achievementIcon').className = `fas ${settings.achievement.icon || 'fa-trophy'}`;
            
            if (active) {
                updateReferralProgress(settings.achievement);
            }
        }
        
    } catch (error) {
        console.error('Error loading referral settings:', error);
    }
}

// ============ UPDATE REFERRAL PROGRESS =================
function updateReferralProgress(achievementSettings) {
    if (!currentUser) return;
    
    const currentCount = currentUser.referralCount || 0;
    const goal = achievementSettings?.goal || 100;
    const remaining = Math.max(0, goal - currentCount);
    const percentage = Math.min(100, Math.round((currentCount / goal) * 100));
    
    document.getElementById('refCount').textContent = currentCount;
    document.getElementById('refGoal').textContent = goal;
    document.getElementById('refRemaining').textContent = remaining;
    document.getElementById('refProgressFill').style.width = percentage + '%';
    
    // Update goal text
    if (achievementSettings?.goalText) {
        const goalText = achievementSettings.goalText
            .replace(/{remaining}/g, remaining)
            .replace(/{goal}/g, goal)
            .replace(/{current}/g, currentCount);
        
        document.getElementById('refGoalText').innerHTML = goalText;
    }
}

// ============ LOAD ACTIVE POLL =================
async function loadActivePoll() {
    try {
        const res = await fetch(`${API_URL}/api/polls/active`);
        
        if (!res.ok) throw new Error('Failed to load poll');
        
        const data = await res.json();
        
        if (!data.success || !data.poll) {
            document.getElementById('pollSection').style.display = 'none';
            return;
        }
        
        const poll = data.poll;
        const pollSection = document.getElementById('pollSection');
        
        pollSection.classList.add('active');
        pollSection.setAttribute('data-poll-id', poll._id);
        pollSection.style.display = 'block';
        
        document.getElementById('pollQuestion').textContent = poll.question;
        
        // End time
        if (poll.endTime) {
            const endDate = new Date(poll.endTime);
            const now = new Date();
            const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            document.getElementById('pollEndTime').textContent = `Poll ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
        }
        
        // Render options
        renderPollOptions(poll);
        
        // Check if user has voted
        await checkUserVote(poll._id);
        
    } catch (error) {
        console.error('Error loading poll:', error);
        document.getElementById('pollSection').style.display = 'none';
    }
}

function renderPollOptions(poll) {
    const container = document.getElementById('pollOptions');
    container.innerHTML = '';
    
    const totalVotes = poll.voters?.length || 0;
    
    poll.options.forEach((option, index) => {
        const votes = option.votes || 0;
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        
        const optionEl = document.createElement('div');
        optionEl.className = 'poll-option';
        optionEl.setAttribute('data-option-index', index);
        
        optionEl.innerHTML = `
            <div class="option-row">
                <div class="option-radio"></div>
                <div class="option-text">${option.text}</div>
                <div class="option-percentage">${percentage}%</div>
            </div>
            <div class="option-bar">
                <div class="option-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        
        optionEl.addEventListener('click', () => {
            if (!optionEl.classList.contains('voted')) {
                document.querySelectorAll('.poll-option').forEach(opt => opt.classList.remove('selected'));
                optionEl.classList.add('selected');
                selectedPollOption = index;
                selectedPollText = option.text;
            }
        });
        
        container.appendChild(optionEl);
    });
}

async function checkUserVote(pollId) {
    try {
        const res = await fetch(`${API_URL}/api/polls/${pollId}/user-vote`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) return;
        
        const data = await res.json();
        
        if (data.hasVoted) {
            // Disable voting
            document.querySelectorAll('.poll-option').forEach(opt => {
                opt.classList.add('voted');
                opt.style.cursor = 'default';
            });
            
            const btn = document.getElementById('submitVoteBtn');
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Already Voted';
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
        }
    } catch (error) {
        console.error('Error checking vote:', error);
    }
}

// ============ LOAD SPONSORED AD =================
async function loadSponsoredAd() {
    try {
        const res = await fetch(`${API_URL}/api/content/sponsored-ads/active`);
        
        if (!res.ok) throw new Error('Failed to load sponsored ad');
        
        const data = await res.json();
        
        if (!data.success || !data.sponsoredAd) {
            document.getElementById('sponsoredSection').style.display = 'none';
            return;
        }
        
        const ad = data.sponsoredAd;
        const section = document.getElementById('sponsoredSection');
        
        section.classList.add('active');
        section.style.display = 'block';
        
        // Thumbnail
        const imageUrl = ad.imageUrl?.startsWith('http') 
            ? ad.imageUrl 
            : `${API_URL}/uploads/ads/${ad.imageUrl}`;
        
        document.getElementById('sponsoredThumb').src = imageUrl;
        document.getElementById('sponsoredThumb').onerror = function() {
            this.src = 'https://placehold.co/120x120/00aaff/ffffff?text=Ad';
        };
        
        // Content
        document.getElementById('sponsoredLabel').textContent = ad.label || 'SPONSORED';
        document.getElementById('sponsoredTitle').textContent = ad.title;
        document.getElementById('sponsoredDescription').textContent = ad.shortDescription || ad.description;
        document.getElementById('sponsoredPrice').textContent = ad.price;
        
        // Buttons
        document.getElementById('sponsoredGetBtn').onclick = () => {
            if (ad.actionUrl || ad.url) {
                window.open(ad.actionUrl || ad.url, '_blank');
                trackAdClick(ad._id);
            }
        };
        
        // Modal details
        window.currentAd = ad;
        
    } catch (error) {
        console.error('Error loading sponsored ad:', error);
        document.getElementById('sponsoredSection').style.display = 'none';
    }
}

async function trackAdClick(adId) {
    try {
        await fetch(`${API_URL}/api/content/sponsored-ads/${adId}/click`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error tracking ad click:', error);
    }
}

// ============ LOAD WALLET IMAGES =================
async function loadWalletImages() {
    try {
        const res = await fetch(`${API_URL}/api/content/wallet-images/active`);
        
        if (!res.ok) throw new Error('Failed to load wallet images');
        
        const data = await res.json();
        
        if (!data.success || !data.walletImages || data.walletImages.length === 0) {
            // Use default image
            return;
        }
        
        // Add wallet images to swiper
        const swiper = document.getElementById('walletSwiper');
        const wrapper = swiper.querySelector('.swiper-wrapper');
        
        data.walletImages.forEach(img => {
            const imageUrl = img.imageUrl?.startsWith('http') 
                ? img.imageUrl 
                : `${API_URL}/uploads/wallet/${img.imageUrl}`;
            
            const slide = document.createElement('div');
            slide.className = 'swiper-slide wallet-slide';
            slide.innerHTML = `
                <div class="celebration-card">
                    <img src="${imageUrl}" alt="${img.title}" class="celebration-image" 
                         onerror="this.src='https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=400&fit=crop'">
                    <div class="celebration-overlay">
                        <h3>${img.title}</h3>
                        <p>${img.shortDescription || ''}</p>
                    </div>
                </div>
            `;
            
            wrapper.appendChild(slide);
        });
        
        // Reinitialize swiper
        if (walletSwiper) {
            walletSwiper.update();
        }
        
    } catch (error) {
        console.error('Error loading wallet images:', error);
    }
}

// ============ LOAD ANNOUNCEMENTS =================
async function loadAnnouncements() {
    try {
        const res = await fetch(`${API_URL}/api/content/announcements`);
        
        if (!res.ok) throw new Error('Failed to load announcements');
        
        const data = await res.json();
        
        if (!data.success || !data.announcements || data.announcements.length === 0) {
            return; // No announcements
        }
        
        // Show first announcement
        const announcement = data.announcements[0];
        
        // Modal 1
        const imageUrl = announcement.imageUrl?.startsWith('http') 
            ? announcement.imageUrl 
            : announcement.imageUrl 
              ? `${API_URL}/uploads/announcements/${announcement.imageUrl}` 
              : null;
        
        if (imageUrl) {
            document.getElementById('announcement2ImageContainer').innerHTML = `
                <img src="${imageUrl}" alt="${announcement.title}" 
                     onerror="this.src='https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=500&h=400&fit=crop'">
            `;
        }
        
        document.getElementById('announcement2Title').textContent = announcement.title;
        document.getElementById('announcement2Body').innerHTML = `<p>${announcement.content}</p>`;
        
        // Show after delay
        setTimeout(() => {
            showModal('announcementModal2');
        }, 2000);
        
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

// ============ EARNINGS CHART =================
function initializeChart() {
    const ctx = document.getElementById('earningsChart');
    if (!ctx) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    // TODO: Get real data from backend
    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [1200, 1900, 800, 1500, 2200, 1800, 2500]
    };
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Earnings (₦)',
                data: chartData.data,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: textColor }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function updateChartTheme() {
    if (!chartInstance) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    chartInstance.options.plugins.legend.labels.color = textColor;
    chartInstance.options.scales.x.ticks.color = textColor;
    chartInstance.options.scales.x.grid.color = gridColor;
    chartInstance.options.scales.y.ticks.color = textColor;
    chartInstance.options.scales.y.grid.color = gridColor;
    
    chartInstance.update();
}

// ============ MODALS =================
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ============ TOAST NOTIFICATION =================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
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
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ INITIALIZATION =================
async function init() {
    console.log('🚀 Initializing Dashboard...');
    
    // 1. Check auth
    if (!checkAuth()) return;
    
    // 2. Load theme
    loadTheme();
    
    // 3. Initialize wallet slider
    initializeWalletSlider();
    
    // 4. Load user data
    await loadUserData();
    
    // 5. Check activation
    await checkActivationStatus();
    
    // 6. Load admin message
    await loadAdminMessage();
    
    // 7. Load referral settings
    await loadReferralSettings();
    
    // 8. Load poll
    await loadActivePoll();
    
    // 9. Load sponsored ad
    await loadSponsoredAd();
    
    // 10. Load wallet images
    await loadWalletImages();
    
    // 11. Load announcements
    await loadAnnouncements();
    
    // 12. Initialize chart
    initializeChart();
    
    console.log('✅ Dashboard initialized successfully!');
}

// ============ EXPOSE FUNCTIONS =================
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.toggleBalance = toggleBalance;
window.showNotificationModal = showNotificationModal;
window.confirmNotifications = confirmNotifications;
window.showVoteModal = showVoteModal;
window.submitVote = submitVote;
window.showLogoutModal = showLogoutModal;
window.confirmLogout = confirmLogout;
window.closeAdminMessage = closeAdminMessage;
window.copyRefLink = copyRefLink;
window.showModal = showModal;
window.closeModal = closeModal;

// ============ START =================
window.addEventListener('DOMContentLoaded', init);

console.log('📍 Dashboard.js loaded - Ready for real data!');