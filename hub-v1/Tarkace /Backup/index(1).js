// ================================================
// EARNCIAL EARNER DASHBOARD - COMPLETE JAVASCRIPT
// NO FAKE DATA - ONLY REAL BACKEND DATA
// ================================================

// ============ CONSTANTS ============
const API_URL = 'http://localhost:5000';

// ============ CHECK AUTHENTICATION ============
function checkAuth() {
    const token = localStorage.getItem('earncial_token');
    const user = localStorage.getItem('earncial_user');
    
    if (!token || !user) {
        window.location.href = 'sign-in.html';
        return null;
    }
    
    try {
        return JSON.parse(user);
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'sign-in.html';
        return null;
    }
}

// ============ LOAD USER DATA ============
function loadUserData() {
    const user = checkAuth();
    
    if (!user) return;
    
    // Update Welcome Message
    const welcomeUsername = document.getElementById('welcomeUsername');
    if (welcomeUsername) {
        welcomeUsername.textContent = user.username || user.fullName || 'User';
    }
    
    // Update Main Balance
    const balanceDisplay = document.getElementById('balanceDisplay');
    if (balanceDisplay) {
        const balance = user.balance || 0;
        balanceDisplay.setAttribute('data-initial', balance);
        balanceDisplay.textContent = '₦' + balance.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    // Update Earnings Balance (for slider)
    const earningsBalance = document.getElementById('earningsBalance');
    if (earningsBalance) {
        const earnings = user.earningsBalance || 0;
        earningsBalance.textContent = '₦' + earnings.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    // Update Referral Link with Real Username
    const refLinkInput = document.getElementById('refLink');
    if (refLinkInput && user.username) {
        const referralLink = `http://127.0.0.1:8080/sign-up?ref=${user.username}`;
        refLinkInput.value = referralLink;
    }
    
    // Update Stats Cards
    updateStatsCards(user);
    
    console.log('✅ User data loaded:', user);
}

// ============ UPDATE STATS CARDS ============
function updateStatsCards(user) {
    const referralCount = user.referralCount || 0;
    const completedTasks = user.completedTasks || 0;
    const totalWithdrawn = user.totalWithdrawn || 0;
    
    const referralCounter = document.querySelector('.counter[data-target="12"]');
    if (referralCounter) {
        referralCounter.setAttribute('data-target', referralCount);
    }
    
    const tasksCounter = document.querySelector('.counter[data-target="45"]');
    if (tasksCounter) {
        tasksCounter.setAttribute('data-target', completedTasks);
    }
    
    const withdrawnCounter = document.querySelector('.currency-counter[data-target="5000"]');
    if (withdrawnCounter) {
        withdrawnCounter.setAttribute('data-target', totalWithdrawn);
    }
}

// ============ LOGOUT FUNCTION ============
function logout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    
    if (!confirmLogout) return;
    
    localStorage.removeItem('earncial_token');
    localStorage.removeItem('earncial_user');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('userEmail');
    
    window.location.href = 'sign-in.html';
}

// ============ SIDEBAR LOGIC ============
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');

function openSidebar() {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ============ DARK MODE LOGIC ============
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    
    if (isDark) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('themeIcon');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    } else if (icon) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// ============ WALLET SLIDER LOGIC ============
let currentWalletSlide = 0;
let walletAutoSlide;

function slideToWallet(index) {
    currentWalletSlide = index;
    const slides = document.getElementById('walletSlides');
    if (!slides) return;
    
    slides.style.transform = `translateX(-${index * 100}%)`;
    
    document.querySelectorAll('.slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function nextWallet() {
    currentWalletSlide = (currentWalletSlide + 1) % 2;
    slideToWallet(currentWalletSlide);
}

function previousWallet() {
    currentWalletSlide = (currentWalletSlide - 1 + 2) % 2;
    slideToWallet(currentWalletSlide);
}

function startWalletAutoSlide() {
    walletAutoSlide = setInterval(nextWallet, 5000);
}

function stopWalletAutoSlide() {
    clearInterval(walletAutoSlide);
}

function initWalletSlider() {
    const sliderContainer = document.querySelector('.wallet-slider-container');
    if (!sliderContainer) return;
    
    // Start auto-slide
    startWalletAutoSlide();
    
    // Stop on hover
    sliderContainer.addEventListener('mouseenter', stopWalletAutoSlide);
    sliderContainer.addEventListener('mouseleave', startWalletAutoSlide);
    
    // Touch swipe support
    let touchStart = 0;
    let touchEnd = 0;
    
    sliderContainer.addEventListener('touchstart', e => {
        touchStart = e.changedTouches[0].screenX;
    });
    
    sliderContainer.addEventListener('touchend', e => {
        touchEnd = e.changedTouches[0].screenX;
        if (touchStart - touchEnd > 50) nextWallet();
        if (touchEnd - touchStart > 50) previousWallet();
    });
}

// ============ WALLET BALANCE TOGGLE ============
let isBalanceHidden = false;
function toggleBalance() {
    const displays = document.querySelectorAll('.wallet-amount');
    const icons = document.querySelectorAll('.eye-toggle i');
    
    isBalanceHidden = !isBalanceHidden;

    displays.forEach(display => {
        if (isBalanceHidden) {
            display.classList.add('hidden');
        } else {
            display.classList.remove('hidden');
        }
    });
    
    icons.forEach(icon => {
        if (isBalanceHidden) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
}

// ============ COPY REFERRAL LINK ============
function copyRef() {
    const copyText = document.getElementById("refLink");
    const btn = document.querySelector('.ref-copy-btn');
    
    if (!copyText) return;
    
    copyText.focus();
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText.value)
            .then(() => {
                showCopySuccess(btn);
            })
            .catch(err => {
                console.error("Could not copy text: ", err);
                document.execCommand('copy');
                showCopySuccess(btn);
            });
    } else {
        document.execCommand('copy');
        showCopySuccess(btn);
    }
    
    function showCopySuccess(buttonElement) {
        const originalHTML = buttonElement.innerHTML;
        const originalBackground = buttonElement.style.background;
        
        buttonElement.style.background = '#22c55e';
        buttonElement.innerHTML = '<i class="fas fa-check"></i> Copied!';
        
        setTimeout(() => {
            buttonElement.style.background = originalBackground;
            buttonElement.innerHTML = originalHTML;
        }, 2000);
    }
}

// ============ MODAL FUNCTIONS ============
function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ============ POLL SYSTEM - FIXED (NO FAKE DATA) ============
let selectedPollOption = null;
let hasVoted = false;

function selectPollOption(option) {
    if (hasVoted) return;
    
    document.querySelectorAll('.poll-option-item').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    option.classList.add('selected');
    selectedPollOption = option;
    document.getElementById('submitPollBtn').disabled = false;
}

async function submitPollVote() {
    if (!selectedPollOption || hasVoted) return;
    
    const pollSection = document.querySelector('.poll-section');
    if (!pollSection) return;
    
    const pollId = pollSection.getAttribute('data-poll-id');
    const optionId = selectedPollOption.getAttribute('data-option-id');
    const token = localStorage.getItem('earncial_token');
    
    try {
        const response = await fetch(`${API_URL}/api/polls/${pollId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ optionId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            hasVoted = true;
            displayPollResults(result.results);
            
            const btn = document.getElementById('submitPollBtn');
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Vote Submitted';
            btn.disabled = true;
            btn.classList.add('success');
        } else {
            alert(result.message || 'Failed to submit vote');
        }
    } catch (error) {
        console.error('Poll vote error:', error);
        alert('Network error. Please try again.');
    }
}

function displayPollResults(results) {
    const options = document.querySelectorAll('.poll-option-item');
    const totalVotes = results.totalVotes;
    
    results.options.forEach((optionData, index) => {
        const option = options[index];
        if (!option) return;
        
        const percentage = totalVotes > 0 
            ? Math.round((optionData.votes / totalVotes) * 100) 
            : 0;
        
        option.querySelector('.option-progress-bar').style.width = percentage + '%';
        option.querySelector('.option-percent').textContent = percentage + '%';
        option.onclick = null;
        option.style.cursor = 'default';
    });
    
    const pollInfoEl = document.querySelector('.poll-info span:first-child');
    if (pollInfoEl) {
        pollInfoEl.innerHTML = `<i class="fas fa-users"></i> ${totalVotes} votes`;
    }
}

async function fetchActivePoll() {
    try {
        console.log('📊 Fetching active poll...');
        
        const response = await fetch(`${API_URL}/api/polls/active`);
        const data = await response.json();
        
        if (data.success && data.poll) {
            renderPoll(data.poll);
            showPollSection();
            console.log('✅ Active poll loaded');
        } else {
            console.log('ℹ️ No active poll available');
            hidePollSection();
        }
    } catch (error) {
        console.error('❌ Error fetching poll:', error);
        hidePollSection();
    }
}

function renderPoll(poll) {
    const pollSection = document.querySelector('.poll-section');
    if (!pollSection) return;
    
    pollSection.setAttribute('data-poll-id', poll._id);
    
    const questionEl = document.querySelector('.poll-question-text');
    if (questionEl) {
        questionEl.textContent = poll.question;
    }
    
    const optionsContainer = document.getElementById('pollOptions');
    if (optionsContainer && poll.options) {
        optionsContainer.innerHTML = poll.options.map((option, index) => `
            <div class="poll-option-item" data-option-id="${option._id}" data-votes="${option.votes}" onclick="selectPollOption(this)">
                <div class="option-progress-bar"></div>
                <div class="option-content-wrapper">
                    <div class="option-left">
                        <div class="option-check"></div>
                        <span class="option-text">${option.text}</span>
                    </div>
                    <div class="option-percent">0%</div>
                </div>
            </div>
        `).join('');
    }
    
    // Check if user has already voted
    checkUserVoteStatus(poll._id);
}

function showPollSection() {
    const pollSection = document.querySelector('.poll-section');
    if (pollSection) {
        pollSection.style.display = 'block';
    }
}

function hidePollSection() {
    const pollSection = document.querySelector('.poll-section');
    if (pollSection) {
        pollSection.style.display = 'none';
    }
}

async function checkUserVoteStatus(pollId) {
    const token = localStorage.getItem('earncial_token');
    
    try {
        const response = await fetch(`${API_URL}/api/polls/${pollId}/user-vote`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.hasVoted) {
            hasVoted = true;
            displayPollResults(data.results);
            
            const btn = document.getElementById('submitPollBtn');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Already Voted';
                btn.disabled = true;
                btn.classList.add('success');
            }
        }
    } catch (error) {
        console.error('Error checking vote status:', error);
    }
}

/*/ ============ SPONSORED ADS SYSTEM - FIXED (NO FAKE DATA) ============
async function fetchSponsoredAd() {
    try {
        console.log('📢 Fetching sponsored ad...');
        
        const response = await fetch(`${API_URL}/api/content/ads`);
        const data = await response.json();
        
        if (data.success && data.ads && data.ads.length > 0) {
            const ad = data.ads[0];
            renderSponsoredCard(ad);
            showAdCard();
            console.log('✅ Sponsored ad loaded');
        } else {
            console.log('ℹ️ No sponsored ads available');
            hideAdCard();
        }
    } catch (error) {
        console.error('❌ Error fetching sponsored ad:', error);
        hideAdCard();
    }
}

function renderSponsoredCard(ad) {
    const adCard = document.querySelector('.ad-card-pro');
    if (!adCard) return;
    
    adCard.innerHTML = `
        <div class="ad-badge">SPONSORED</div>
        <img src="${ad.imageUrl || 'https://placehold.co/600x150/00aaff/ffffff?text=Ad+Image'}" 
             alt="${ad.title}" class="ad-image" 
             onerror="this.src='https://placehold.co/600x150/00aaff/ffffff?text=Ad+Image'">
        <div class="ad-content">
            <div class="ad-title">${ad.title}</div>
            <div class="ad-description">${ad.description}</div>
            <div class="ad-price">${ad.ctaText || ad.price || 'Learn More'}</div>
            <div class="ad-btn">View Details</div>
        </div>
    `;
    
    adCard.onclick = () => {
        showSponsoredAdModal(ad);
    };
}

function showAdCard() {
    const adCard = document.querySelector('.ad-card-pro');
    if (adCard) {
        adCard.style.display = 'flex';
    }
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
    document.getElementById('sponsoredPrice').textContent = ad.ctaText || ad.price || 'Learn More';
    
    const actionBtn = document.getElementById('sponsoredActionBtn');
    actionBtn.textContent = ad.ctaText || 'Get Offer';
    actionBtn.onclick = () => {
        if (ad.targetUrl || ad.actionUrl) {
            window.open(ad.targetUrl || ad.actionUrl, '_blank', 'noopener,noreferrer');
        }
        closeModal('sponsoredModal');
    };
    
    showModal('sponsoredModal');
}*/




// ============ SPONSORED ADS SYSTEM - FIXED (Fetch from correct endpoint) ============
async function fetchSponsoredAd() {
    try {
        console.log('📢 Fetching sponsored ad for dashboard...');
        
        // ✅ GYARA: Use correct endpoint for dashboard sponsored ad
        const response = await fetch(`${API_URL}/api/content/sponsored-ads/active`);
        const data = await response.json();
        
        if (data.success && data.sponsoredAd) {
            const ad = data.sponsoredAd;
            renderSponsoredCard(ad);
            showAdCard();
            console.log('✅ Sponsored ad loaded:', ad.title);
        } else {
            console.log('ℹ️ No sponsored ads available');
            hideAdCard();
        }
    } catch (error) {
        console.error('❌ Error fetching sponsored ad:', error);
        hideAdCard();
    }
}

function renderSponsoredCard(ad) {
    const adCard = document.querySelector('.ad-card-pro');
    if (!adCard) return;
    
    // ✅ GYARA: Construct correct image URL
    const imageUrl = ad.imageUrl?.startsWith('http') 
        ? ad.imageUrl 
        : ad.imageUrl?.startsWith('/') 
          ? `${API_URL}${ad.imageUrl}`
          : `${API_URL}/uploads/ads/${ad.imageUrl}`;
    
    adCard.innerHTML = `
        <div class="ad-badge">SPONSORED</div>
        <img src="${imageUrl}" 
             alt="${ad.title}" 
             class="ad-image" 
             onerror="this.src='https://placehold.co/600x150/00aaff/ffffff?text=Ad+Image'">
        <div class="ad-content">
            <div class="ad-title">${ad.title}</div>
            <div class="ad-description">${ad.description}</div>
            <div class="ad-price">${ad.price}</div>
            <div class="ad-btn">${ad.actionText || 'View Details'}</div>
        </div>
    `;
    
    adCard.onclick = () => {
        showSponsoredAdModal(ad);
        trackAdClick(ad._id); // ✅ Track clicks
    };
}

function showAdCard() {
    const adCard = document.querySelector('.ad-card-pro');
    if (adCard) {
        adCard.style.display = 'flex';
    }
}

function hideAdCard() {
    const adCard = document.querySelector('.ad-card-pro');
    if (adCard) {
        adCard.style.display = 'none';
    }
}

function showSponsoredAdModal(ad) {
    // ✅ GYARA: Construct correct image URL
    const imageUrl = ad.imageUrl?.startsWith('http') 
        ? ad.imageUrl 
        : ad.imageUrl?.startsWith('/') 
          ? `${API_URL}${ad.imageUrl}`
          : `${API_URL}/uploads/ads/${ad.imageUrl}`;
    
    document.getElementById('sponsoredImage').src = imageUrl;
    document.getElementById('sponsoredImage').onerror = function() {
        this.src = 'https://placehold.co/600x200/00aaff/ffffff?text=Sponsored';
    };
    
    document.getElementById('sponsoredTitle').textContent = ad.title;
    document.getElementById('sponsoredDescription').textContent = ad.description;
    document.getElementById('sponsoredPrice').textContent = ad.price;
    
    const actionBtn = document.getElementById('sponsoredActionBtn');
    actionBtn.textContent = ad.actionText || 'Get Offer';
    actionBtn.onclick = () => {
        if (ad.actionUrl || ad.targetUrl) {
            window.open(ad.actionUrl || ad.targetUrl, '_blank', 'noopener,noreferrer');
        }
        closeModal('sponsoredModal');
    };
    
    showModal('sponsoredModal');
}

// ✅ NEW: Track ad clicks
async function trackAdClick(adId) {
    try {
        await fetch(`${API_URL}/api/content/sponsored-ads/${adId}/click`, {
            method: 'POST'
        });
        console.log('✅ Ad click tracked');
    } catch (error) {
        console.error('❌ Error tracking ad click:', error);
    }
}

// ============ FETCH ADVERTISEMENTS (Modal Popups after Announcements) ============
async function fetchAdvertisements() {
    try {
        console.log('📢 Fetching advertisements...');
        
        const response = await fetch(`${API_URL}/api/content/advertisements`);
        const data = await response.json();
        
        if (data.success && data.advertisements && data.advertisements.length > 0) {
            // Show first advertisement after announcement is closed
            const advertisement = data.advertisements[0];
            
            // Wait for announcement modal to be closed first
            const checkAnnouncementClosed = setInterval(() => {
                const announcementModal = document.getElementById('announcementModal');
                if (!announcementModal || announcementModal.style.display !== 'flex') {
                    clearInterval(checkAnnouncementClosed);
                    setTimeout(() => {
                        showAdvertisementModal(advertisement);
                    }, 500);
                }
            }, 500);
            
            console.log('✅ Advertisement loaded:', advertisement.title);
        } else {
            console.log('ℹ️ No advertisements available');
        }
    } catch (error) {
        console.error('❌ Error fetching advertisements:', error);
    }
}

function showAdvertisementModal(ad) {
    const modal = document.getElementById('advertisementModal');
    if (!modal) {
        console.warn('⚠️ Advertisement modal not found in HTML');
        return;
    }
    
    // ✅ GYARA: Construct correct image URL
    const imageUrl = ad.imageUrl?.startsWith('http') 
        ? ad.imageUrl 
        : ad.imageUrl?.startsWith('/') 
          ? `${API_URL}${ad.imageUrl}`
          : `${API_URL}/uploads/ads/${ad.imageUrl}`;
    
    const content = modal.querySelector('.modal-content');
    
    content.innerHTML = `
        <span class="close-modal" onclick="closeModal('advertisementModal')">&times;</span>
        <img src="${imageUrl}" 
             alt="${ad.title}" 
             style="width: 100%; border-radius: 12px; margin-bottom: 20px;"
             onerror="this.src='https://placehold.co/600x300/00aaff/ffffff?text=Advertisement'">
        <h3 style="color: var(--text-main); margin-bottom:10px;">${ad.title}</h3>
        <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 15px;">${ad.description}</p>
        ${ad.price ? `<div style="font-size: 24px; font-weight: 800; color: var(--primary); margin-bottom: 15px;">₦${ad.price}</div>` : ''}
        <div style="display: flex; gap: 10px;">
            <button class="btn-modal" onclick="visitAdvertisement('${ad.actionUrl || ad.targetUrl}', '${ad._id}')">
                ${ad.actionText || 'Learn More'}
            </button>
            <button class="btn-modal" style="background: var(--gray-300); color: var(--text-main);" onclick="closeModal('advertisementModal')">
                Close
            </button>
        </div>
    `;
    
    showModal('advertisementModal');
}

function visitAdvertisement(url, adId) {
    if (url) {
        // Track click
        trackAdvertisementClick(adId);
        // Open URL
        window.open(url, '_blank', 'noopener,noreferrer');
    }
    closeModal('advertisementModal');
}

async function trackAdvertisementClick(adId) {
    try {
        await fetch(`${API_URL}/api/content/advertisements/${adId}/click`, {
            method: 'POST'
        });
        console.log('✅ Advertisement click tracked');
    } catch (error) {
        console.error('❌ Error tracking advertisement click:', error);
    }
}

// ============ FETCH ANNOUNCEMENTS - FIXED (NO FAKE DATA) ============
async function fetchAnnouncements() {
    try {
        console.log('📢 Fetching announcements...');
        
        const response = await fetch(`${API_URL}/api/content/announcements`);
        const data = await response.json();
        
        if (data.success && data.announcements && data.announcements.length > 0) {
            const announcement = data.announcements[0];
            showAnnouncementModal(announcement);
            console.log('✅ Announcement loaded');
        } else {
            console.log('ℹ️ No announcements available');
            // Kar a nuna komai
        }
    } catch (error) {
        console.error('❌ Error fetching announcements:', error);
        // Kar a nuna komai
    }
}

function showAnnouncementModal(announcement) {
    const modal = document.getElementById('announcementModal');
    if (!modal) return;
    
    const content = modal.querySelector('.modal-content');
    
    content.innerHTML = `
        <span class="close-modal" onclick="closeModal('announcementModal')">&times;</span>
        <div style="font-size: 50px; margin-bottom: 15px;">${announcement.icon || '⚠️'}</div>
        <h3 style="color: var(--text-main); margin-bottom:10px;">${announcement.title}</h3>
        <p style="color: var(--text-muted); line-height: 1.6;">${announcement.message}</p>
        <button class="btn-modal" onclick="closeModal('announcementModal')">I Understand</button>
    `;
    
    setTimeout(() => {
        showModal('announcementModal');
    }, 500);
}

// ============ SWITCH ACCOUNT TYPE ============
async function switchAccountType() {
    const user = JSON.parse(localStorage.getItem('earncial_user'));
    if (!user) return;
    
    const confirmMessage = 'Switch to Advertiser account?\n\nYou will be redirected to the advertiser dashboard.';
    
    if (!confirm(confirmMessage)) return;
    
    // Show toast notification
    showToast('Switching to Advertiser account...', 'success');
    
    // Redirect after short delay
    setTimeout(() => {
        window.location.href = 'advertiser-dashboard.html';
    }, 1000);
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#00aaff'};
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
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ============ COUNTING ANIMATIONS ============
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    const speed = 200;
    
    counters.forEach(counter => {
        const updateCount = () => {
            const isCurrency = counter.classList.contains('currency-counter');
            const target = parseFloat(counter.getAttribute('data-target').replace(/[^0-9.-]+/g,""));
            const currentText = counter.innerText.replace(/[^0-9.-]+/g,"");
            const count = parseFloat(currentText) || 0;
            const inc = target / speed;
            
            if (count < target) {
                const newCount = count + inc;
                let formattedValue;
                if (isCurrency) {
                    formattedValue = '₦' + Math.ceil(newCount).toLocaleString('en-US', {minimumFractionDigits: 0});
                } else {
                    formattedValue = Math.ceil(newCount).toLocaleString('en-US', {minimumFractionDigits: 0});
                }
                counter.innerText = formattedValue;
                setTimeout(updateCount, 20);
            } else {
                let finalValue;
                if (isCurrency) {
                    finalValue = '₦' + target.toLocaleString('en-US', {minimumFractionDigits: 0});
                } else {
                    finalValue = target.toLocaleString('en-US', {minimumFractionDigits: 0});
                }
                counter.innerText = finalValue;
            }
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCount();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(counter);
    });
    
    // Balance animation
    const balanceElement = document.getElementById('balanceDisplay');
    if (balanceElement) {
        const initialBalance = parseFloat(balanceElement.getAttribute('data-initial')) || 0;

        if (initialBalance > 0 && !balanceElement.classList.contains('hidden')) {
            let current = 0;
            const increment = initialBalance / 100;
            const interval = setInterval(() => {
                current += increment;
                if (current >= initialBalance) {
                    current = initialBalance;
                    clearInterval(interval);
                }
                balanceElement.innerText = '₦' + current.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
            }, 15);
        } else {
            balanceElement.innerText = '₦' + initialBalance.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        }
    }
}

// ============ WINDOW RESIZE HANDLER ============
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// ============ CLOSE MODALS ON OUTSIDE CLICK ============
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
});

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
// ============ INITIALIZATION ============
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Earner Dashboard...');
    
    // 1. Check authentication
    checkAuth();
    
    // 2. Load user data
    loadUserData();
    
    // 3. Load theme
    loadTheme();
    
    // 4. Initialize wallet slider
    initWalletSlider();
    
    // 5. Initialize counters
    initCounters();
    
    // 6. Fetch announcements (shows first if available)
    fetchAnnouncements();
    
    // 7. Fetch advertisements (shows after announcement closes)
    fetchAdvertisements();
    
    // 8. Fetch active poll (shows if available)
    fetchActivePoll();
    
    // 9. Fetch sponsored ad for dashboard card (shows if available)
    fetchSponsoredAd();
    
    console.log('✅ Earner Dashboard initialized');
});

// ============ INITIALIZATION MESSAGE ============
console.log('🚀 Earncial Earner Dashboard - Ready!');
console.log('📍 API URL:', API_URL);
console.log('✅ Features: Poll, Ads, Slider, Switch Account');
console.log('⚠️ NO FAKE DATA - Only real backend data will be displayed');