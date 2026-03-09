// ================================================
// EARNCIAL ADVERTISER DASHBOARD - advertiser-dashboard.js
// COMPLETE - REAL API CALLS - NO PLACEHOLDERS
// ================================================

const API_URL = 'http://localhost:5000';

// ============ ADVERTISER-ONLY PAGE GUARD ============
// Runs immediately - redirect if not an Advertiser account
(function() {
    const _token = localStorage.getItem('earncial_token');
    if (!_token) { window.location.href = 'sign-in.html'; return; }
    try {
        const _user = JSON.parse(localStorage.getItem('earncial_user') || '{}');
        const _type = (_user.accountType || '').toLowerCase();
        if (_type && _type !== 'advertiser') {
            // Has accountType but it's not advertiser - redirect
            window.location.href = 'sign-in.html';
        }
    } catch(e) { /* Let fetchUserData handle it */ }
})();

// ============ GLOBAL STATE ============
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// ✅ ADVERTISER DASHBOARD - audience is always 'advertiser'
// No dynamic detection needed - this file is advertiser-only
function getUserAudience() {
    return 'advertiser';
}

// ✅ Audience double-check - only show 'all' or 'advertiser' content
function isVisibleToUser(item) {
    if (!item) return false;
    const aud = (item.audience || 'all').toLowerCase();
    return aud === 'all' || aud === 'advertiser';
}

let isBalanceHidden = false;
let chartInstance = null;
let walletSwiper = null;
let notificationsEnabled = localStorage.getItem('notifications_enabled') === 'true';
let selectedPollOption = null;
let selectedPollText = '';
let currentPollId = null;
let currentSponsoredId = null;
let currentSponsoredUrl = null;
let currentSponsoredImages = [];
let announcementsData = [];


// ============ TEXT-TO-SPEECH ENGINE ============
let speechEnabled = false;  // Will auto-enable on scroll
let isSpeaking = false;
let hasSpokenWelcome = false;
let scrollTriggerActivated = false;

// Check browser support immediately
if ('speechSynthesis' in window) {
    console.log('✅ Speech Synthesis API supported');
    console.log('📢 Available voices will load shortly...');
} else {
    console.error('❌ Speech Synthesis NOT supported in this browser');
}

function speak(text, options = {}) {
    if (!speechEnabled || isSpeaking) {
        console.log('🔇 Speech skipped:', speechEnabled ? 'already speaking' : 'not enabled yet');
        return;
    }
    
    if (!('speechSynthesis' in window)) {
        console.error('❌ Speech synthesis not supported');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Professional voice settings
    utterance.rate = options.rate || 0.95;      // Slightly slower = more professional
    utterance.pitch = options.pitch || 1.0;     // Normal pitch
    utterance.volume = options.volume || 0.85;  // 85% volume
    utterance.lang = 'en-US';                    // English US

    // Try to use a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
        v.name.includes('Google') || 
        v.name.includes('Microsoft') ||
        v.name.includes('Samantha') ||
        v.name.includes('Daniel')
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => { isSpeaking = true; };
    utterance.onend   = () => { isSpeaking = false; };
    utterance.onerror = () => { isSpeaking = false; };

    console.log('🎙️ Attempting to speak:', text.substring(0, 80) + '...');
    console.log('📢 Voice:', utterance.voice?.name || 'default', 'Rate:', utterance.rate, 'Volume:', utterance.volume);
    
    window.speechSynthesis.speak(utterance);
}


// ============ AUTO SPEECH TRIGGER ON SCROLL ============
function activateSpeechOnScroll() {
    if (scrollTriggerActivated) return;
    
    let scrolled = false;
    let scrollTimeout = null;

    window.addEventListener('scroll', function onScroll() {
        if (scrollTriggerActivated) return;
        
        scrolled = true;
        clearTimeout(scrollTimeout);
        
        // Wait for scroll to stop (300ms idle)
        scrollTimeout = setTimeout(() => {
            if (!scrollTriggerActivated && scrolled) {
                scrollTriggerActivated = true;
                speechEnabled = true;
                console.log('🎙️ Speech activated by user scroll interaction');
                console.log('📢 speechEnabled:', speechEnabled, 'hasSpokenWelcome:', hasSpokenWelcome);
                
                // Remove listener after activation
                window.removeEventListener('scroll', onScroll);
                
                // Speak welcome immediately
                if (!hasSpokenWelcome && currentUser) {
                    speakWelcome();
                }
            }
        }, 300);
    }, { passive: true });

    console.log('👂 Listening for scroll to activate voice...');
}
function speakWelcome() {
    if (!currentUser || hasSpokenWelcome) return;
    
    hasSpokenWelcome = true;
    const username = currentUser.username || currentUser.firstName || 'User';
    const greeting = getGreeting();
    
    let message = `${greeting}, ${username}. `;
    message += `Welcome back to your dashboard. `;
    
    setTimeout(() => speak(message), 800);
}

function speakStats(stats) {
    if (!stats || !scrollTriggerActivated) return;
    
    let message = `Here is your overview. `;
    message += `You have ${stats.totalTasks || 0} total tasks. `;
    
    if (stats.pendingTasks > 0) {
        message += `${stats.pendingTasks} pending approval. `;
    }
    if (stats.approvedTasks > 0) {
        message += `${stats.approvedTasks} active. `;
    }
    if (stats.completedTasks > 0) {
        message += `${stats.completedTasks} completed. `;
    }
    if (stats.rejectedTasks > 0) {
        message += `${stats.rejectedTasks} rejected. `;
    }
    
    // Balance (if visible)
    if (!isBalanceHidden && stats.balance !== undefined) {
        const bal = Math.floor(stats.balance);
        message += `Your wallet balance is ${bal} naira. `;
    }
    
    message += `Have a productive day.`;
    
    setTimeout(() => speak(message), 2000);
}

function speakBalanceToggle(hidden) {
    if (!scrollTriggerActivated) return;
    const msg = hidden 
        ? "Balance hidden for security."
        : "Balance now showing.";
    speak(msg);
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}



// Load voices when available
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('🎙️ Voices loaded:', voices.length, 'available');
        console.log('📢 Sample voices:', voices.slice(0, 5).map(v => v.name + ' (' + v.lang + ')'));
    };
}

// ============ 1. CHECK AUTH ============
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        window.location.href = 'sign-in.html';
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        // Show stale data from localStorage immediately (will be replaced by API)
        document.getElementById('userName').textContent =
            currentUser.username || currentUser.username || 'User';
        // ✅ Referral link - window.location.origin (real domain, not hardcoded)
        const refUsername = currentUser.username || '';
        document.getElementById('refLinkInput').value =
            `${window.location.origin}/sign-up?ref=${refUsername}`;
        return true;
    } catch (e) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
        return false;
    }
}

// ============ 2. FETCH USER DATA (/api/users/me) ============
async function fetchUserData() {
    try {
        const res = await fetch(`${API_URL}/api/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            localStorage.clear();
            window.location.href = 'sign-in.html';
            return;
        }

        if (!res.ok) return;

        const data = await res.json();
        if (!data.success || !data.user) return;

        currentUser = data.user;
        localStorage.setItem('earncial_user', JSON.stringify(data.user));

        // ✅ Advertiser-only: double-check after API confirms accountType
        const _accountType = (currentUser.accountType || '').toLowerCase();
        if (_accountType && _accountType !== 'advertiser') {
            localStorage.clear();
            window.location.href = 'sign-in.html';
            return;
        }

        // ✅ Update username
        document.getElementById('userName').textContent =
            currentUser.username || 'Advertiser';

        // ✅ Balance - available balance for advertiser
        const balance = currentUser.balance || 0;
        document.getElementById('balanceDisplay').textContent =
            `₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

        // ✅ Balance from User model
        const fmt  = (n) => `₦${(n||0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
        document.getElementById('advBalance').textContent = fmt(currentUser.balance);
        document.getElementById('balanceDisplay').textContent = fmt(currentUser.balance);

        // ✅ Referrals (from User model)
        const refCount = currentUser.referralCount || 0;
        document.getElementById('refCount').textContent      = refCount.toLocaleString();
        // ✅ Active Referrals stat card
        const arEl = document.getElementById('activeReferrals');
        if (arEl) arEl.textContent = refCount.toLocaleString();

        // ✅ Task + Deposit stats fetched from /api/advertiser/stats (NOT on User model)
        fetchAdvertiserStats();

        // ✅ Referral link - use window.location.origin for real domain
        const origin      = window.location.origin;
        const refUsername = currentUser.username || '';
        document.getElementById('refLinkInput').value =
            `${origin}/sign-up?ref=${refUsername}`;

    } catch (error) {
        console.error('❌ fetchUserData failed:', error);
    }
}

// ============ ADVERTISER STATS (/api/advertiser/stats) ============
async function fetchAdvertiserStats() {
    try {
        const res = await fetch(`${API_URL}/api/advertiser/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.stats) return;

        const s    = data.stats;
        const fmt  = (n) => `₦${(n||0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
        const fmtN = (n) => (n||0).toLocaleString();

        // Task counts
        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        setEl('totalTasks',     fmtN(s.totalTasks));
        setEl('approvedTasks',  fmtN(s.approvedTasks));   // active tasks
        setEl('pendingTasks',   fmtN(s.pendingTasks));    // review tasks
        setEl('completedTasks', fmtN(s.completedTasks));
        setEl('rejectedTasks',  fmtN(s.rejectedTasks));

        // Finance
        setEl('totalBudget',   fmt(s.totalBudget));
        setEl('totalSpending', fmt(s.totalSpending));
        setEl('totalDeposit',  fmt(s.totalDeposit));
        setEl('lastDeposit',   fmt(s.lastDeposit));

        // Budget cards
        setEl('advBalance',         fmt(s.balance));
        setEl('lastDepositAmount',  fmt(s.lastDeposit));

        if (s.lastDepositDate) {
            const diffDays = Math.floor((new Date() - new Date(s.lastDepositDate)) / 86400000);
            setEl('lastDepositDate',
                diffDays === 0 ? 'Today' :
                diffDays === 1 ? 'Yesterday' :
                `${diffDays} days ago`);
        } else {
            setEl('lastDepositDate', 'No deposits yet');
        }

    } catch (err) {
        console.error('❌ fetchAdvertiserStats failed:', err);
    }
}

// ============ 3. CHECK ACTIVATION ============
async function checkActivation() {
    try {
        const res = await fetch(`${API_URL}/api/activation/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            hideActivationBanner();
            return;
        }

        const data = await res.json();

        const isActivated = data.user?.isActivated || currentUser?.isActivated || false;
        const activationRequired = data.activation?.required || false;

        // Update activation amount if present
        if (data.activation?.amount) {
            document.getElementById('activationAmount').textContent =
                `₦${data.activation.amount.toLocaleString()}`;
        }

        if (!activationRequired || isActivated) {
            hideActivationBanner();
        } else {
            showActivationBanner();
        }

    } catch (error) {
        console.error('❌ checkActivation failed:', error);
        hideActivationBanner();
    }
}

function showActivationBanner() {
    document.getElementById('activationBanner').style.display = 'flex';
    const withdrawBtn = document.getElementById('withdrawBtn');
    withdrawBtn.innerHTML = '<i class="fas fa-lock"></i> Activate';
    withdrawBtn.onclick = () => window.location.href = 'activation.html';
}

function hideActivationBanner() {
    document.getElementById('activationBanner').style.display = 'none';
    const withdrawBtn = document.getElementById('withdrawBtn');
    withdrawBtn.innerHTML = '<i class="fas fa-arrow-up"></i> Withdraw';
    withdrawBtn.onclick = () => window.location.href = 'withdraw.html';
}

// ✅ Fetch general message banner (Banner #2 from admin)
// Called after activation check

// ============ 4. FETCH ADMIN MESSAGE (/api/user-messages/my-messages) ============
async function fetchAdminMessage() {
    try {
        // Hide banner by default
        document.getElementById('adminMessageBanner').style.display = 'none';

        const res = await fetch(`${API_URL}/api/user-messages/my-messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) return;

        const data = await res.json();

        if (!data.success || !data.messages || data.messages.length === 0) return;

        const msg = data.messages[0];
        const banner = document.getElementById('adminMessageBanner');

        banner.className = `admin-message-banner ${msg.type || 'success'}`;
        banner.style.display = 'flex';

        document.getElementById('adminMessageTitle').innerHTML = msg.title || '';
        document.getElementById('adminMessageText').innerHTML = msg.text || '';

        // Update icon
        if (msg.icon) {
            const iconEl = banner.querySelector('.admin-message-icon i');
            if (iconEl) iconEl.className = `fas ${msg.icon}`;
        }

        // ✅ Show button if buttonUrl exists
        let bannerBtn = document.getElementById('adminMessageBtn');
        if (msg.buttonText && msg.buttonUrl) {
            if (!bannerBtn) {
                // Create button if not in HTML
                bannerBtn = document.createElement('a');
                bannerBtn.id = 'adminMessageBtn';
                bannerBtn.className = 'admin-message-btn';
                bannerBtn.target = '_blank';
                bannerBtn.rel = 'noopener noreferrer';
                banner.appendChild(bannerBtn);
            }
            bannerBtn.textContent = msg.buttonText;
            bannerBtn.href = msg.buttonUrl;
            bannerBtn.style.display = 'inline-block';
        } else if (bannerBtn) {
            bannerBtn.style.display = 'none';
        }

        // Store message ID so we can mark as viewed when closed
        banner.dataset.messageId = msg._id;

    } catch (error) {
        console.error('❌ fetchAdminMessage failed:', error);
    }
}

function closeAdminMessage() {
    // ✅ Don't remove from UI - admin message stays visible until expired
    // Only mark as viewed in backend
    const banner = document.getElementById('adminMessageBanner');
    const msgId = banner?.dataset?.messageId;
    if (msgId) {
        fetch(`${API_URL}/api/user-messages/mark-viewed/${msgId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
    }
}

// ============ 5. FETCH REFERRAL SETTINGS ============
async function fetchReferralSettings() {
    try {
        const res = await fetch(`${API_URL}/api/referrals/public-settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            console.warn('⚠️ fetchReferralSettings failed:', res.status);
            return;
        }

        const data = await res.json();
        const settings = data.settings || data;
        console.log('⚙️ Referral settings:', JSON.stringify({
            earnerBonus: settings.earnerBonus,
            masterReferralText: settings.masterReferralText,
            achievementActive: settings.achievement?.active
        }));

        // Referral bonuses
        if (settings.earnerBonus !== undefined) {
            document.getElementById('earnerBonus').textContent =
                `₦${Number(settings.earnerBonus).toLocaleString()}`;
        }
        if (settings.advertiserBonus !== undefined) {
            document.getElementById('advertiserBonus').textContent =
                `${settings.advertiserBonus}%`;
        }

        // Achievement section
        if (settings.achievement) {
            const ach = settings.achievement;

            // ✅ Audience check - hide if not for this user type
            const achVisible = isVisibleToUser(ach);

            // Show/hide achievement section based on active flag AND audience
            const achSection = document.querySelector('.ref-achievement-section');
            if (achSection) {
                achSection.style.display = (ach.active && achVisible) ? 'block' : 'none';
            }

            if (ach.active && achVisible) {
                // Icon
                if (ach.icon) {
                    const iconEl = document.getElementById('achievementIcon');
                    if (iconEl) iconEl.className = `fas ${ach.icon}`;
                }

                // ✅ FIX: bonusReward - parse correctly from any type
                const rewardEl = document.getElementById('achievementReward');
                if (rewardEl) {
                    const bonus = parseFloat(ach.bonusReward) || 0;
                    rewardEl.textContent = `₦${bonus.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
                }

                // Goal
                const refGoal  = parseInt(ach.goal) || 100;
                const refCount = parseInt(currentUser?.referralCount) || 0;
                const remaining  = Math.max(0, refGoal - refCount);
                const percentage = Math.min(100, Math.round((refCount / refGoal) * 100));

                const refGoalEl = document.getElementById('refGoal');
                const refRemEl  = document.getElementById('refRemaining');
                const refFillEl = document.getElementById('refProgressFill');
                if (refGoalEl) refGoalEl.textContent       = refGoal;
                if (refRemEl)  refRemEl.textContent        = remaining;
                if (refFillEl) refFillEl.style.width       = `${percentage}%`;

                // Goal text from settings, replace placeholders
                let goalText = ach.goalText ||
                    'Refer <strong>{remaining}</strong> more friends to reach your goal! 🎁';

                if (refCount >= refGoal) {
                    goalText = `🎉 <strong>Congratulations!</strong> You've reached your referral goal!`;
                } else {
                    goalText = goalText
                        .replace(/{remaining}/g, `<strong>${remaining}</strong>`)
                        .replace(/{goal}/g, refGoal)
                        .replace(/{current}/g, refCount);
                }
                const refGoalTextEl = document.getElementById('refGoalText');
                if (refGoalTextEl) refGoalTextEl.innerHTML = goalText;
            }
        }

        // ✅ Master Referrals title - always apply (outside achievement block)
        const masterTitleEl = document.getElementById('achievementTitle') || document.getElementById('masterReferralTitle');
        if (masterTitleEl && settings.masterReferralText) {
            masterTitleEl.textContent = settings.masterReferralText;
        }

        // Activation banner from settings
        if (settings.activationFeeBanner && settings.activationFeeBanner.active) {
            const banner = settings.activationFeeBanner;
            const amountEl = document.getElementById('activationAmount');
            if (amountEl && banner.amount) {
                amountEl.textContent = `₦${Number(banner.amount).toLocaleString()}`;
            }
        }

    } catch (error) {
        console.error('❌ fetchReferralSettings failed:', error);
    }
}

// ============ 6. FETCH ANNOUNCEMENTS (/api/content/announcements) ============
async function fetchAnnouncements() {
    try {
        const res = await fetch(`${API_URL}/api/content/announcements?audience=${getUserAudience()}`);
        if (!res.ok) {
            console.warn('⚠️ fetchAnnouncements: res not ok', res.status);
            return;
        }
        const data = await res.json();
        console.log('📢 Announcements from API:', data.announcements?.length || 0, 'ads:', data.advertisements?.length || 0);

        // ✅ Frontend double-check: filter by audience
        const announcements  = (data.announcements  || [])
            .filter(isVisibleToUser)
            .sort((a,b)=>(a.priority||99)-(b.priority||99));
        const advertisements = (data.advertisements || [])
            .filter(isVisibleToUser)
            .sort((a,b)=>(a.priority||99)-(b.priority||99));

        console.log('📢 After filter:', announcements.length, 'ads:', advertisements.length);

        if (!announcements.length && !advertisements.length) {
            console.warn('⚠️ No visible announcements after filter');
            return;
        }

        // Build modal chain:
        // All announcements (text modals) first → then all advertisements → then ad modal
        // Delay modal chain - give page time to fully settle
        setTimeout(() => buildAnnouncementChain(announcements, advertisements), 3000);

    } catch (error) {
        console.error('❌ fetchAnnouncements failed:', error);
    }
}

// Global modal queue - so X button can advance it
let _modalQueue = [];
let _modalIndex = 0;

function buildAnnouncementChain(announcements, advertisements) {
    // Build a queue: [ann1, ann2, ..., ad1, ad2, ...]
    _modalQueue = [
        ...announcements.map(a  => ({ ...a, _modalType: 'announcement' })),
        ...advertisements.map(a => ({ ...a, _modalType: 'advertisement' }))
    ];
    _modalIndex = 0;

    console.log('🔗 buildAnnouncementChain queue length:', _modalQueue.length);
    if (!_modalQueue.length) return;

    showQueuedModal(_modalQueue, 0);
}

// Called by X button on modals - advances to next in queue
function dismissAnnouncementModal(modalNum) {
    const id = modalNum === 1 ? 'announcementModal1' : 'announcementModal2';
    closeModal(id);
    _modalIndex++;
    if (_modalIndex < _modalQueue.length) {
        setTimeout(() => showQueuedModal(_modalQueue, _modalIndex), 400);
    } else {
        // Queue done - show ad modal
        setTimeout(() => fetchAndShowAdModal(), 600);
    }
}

function showQueuedModal(queue, index) {
    console.log('🎭 showQueuedModal index:', index, 'of', queue.length);
    if (index >= queue.length) {
        // All done - show ad modal last
        setTimeout(() => fetchAndShowAdModal(), 600);
        return;
    }

    const item = queue[index];
    const isLast = index === queue.length - 1;
    const next = () => {
        closeModal(item._modalType === 'announcement' ? 'announcementModal1' : 'announcementModal2');
        setTimeout(() => showQueuedModal(queue, index + 1), 400);
    };

    if (item._modalType === 'announcement') {
        // ===== TEXT ANNOUNCEMENT MODAL =====
        const iconEl = document.querySelector('#announcementModal1 .modal-icon i');
        if (iconEl) iconEl.className = item.icon || 'fas fa-bell';

        const titleEl = document.querySelector('#announcementModal1 .modal-title');
        if (titleEl) titleEl.textContent = item.title || '';

        const btnHtml = '';  // Button below handles the action
        const bodyEl = document.getElementById('announcement1Body');
        if (bodyEl) bodyEl.innerHTML = `<div style="line-height:1.7;">${item.content || ''}</div>`;

        // Button: if admin set buttonText use it, else default
        const continueBtn = document.getElementById('announcement1ContinueBtn')
                         || document.querySelector('#announcementModal1 .btn-modal');
        if (continueBtn) {
            if (isLast) {
                const label = item.buttonText || 'Got It';
                continueBtn.innerHTML = `<i class="fas fa-check"></i> ${label}`;
                continueBtn.onclick = () => {
                    if (item.buttonUrl) window.open(item.buttonUrl, '_blank');
                    closeModal('announcementModal1');
                };
            } else {
                const label = item.buttonText || 'Continue';
                continueBtn.innerHTML = `<i class="fas fa-arrow-right"></i> ${label}`;
                continueBtn.onclick = () => {
                    if (item.buttonUrl) window.open(item.buttonUrl, '_blank');
                    next();
                };
            }
        }

        console.log('🟢 Showing announcementModal1:', item.title);
        _showModalDirect('announcementModal1');

    } else {
        // ===== ADVERTISEMENT MODAL (image slider) =====
        const title2 = document.getElementById('announcement2Title');
        if (title2) title2.textContent = item.title || '';

        // Label badge
        const labelEl = document.getElementById('announcement2Label');
        if (labelEl) {
            if (item.label) {
                labelEl.textContent = item.label;
                labelEl.style.display = 'inline-block';
            } else {
                labelEl.style.display = 'none';
            }
        }

        const body2 = document.getElementById('announcement2Body');
        if (body2) body2.innerHTML = `<div style="line-height:1.7;">${item.content || ''}</div>`;

        // Image slider
        buildAdvertisementSlider(item.imageUrls || []);

        // Button: use admin buttonText or default
        const closeBtn2 = document.getElementById('announcement2CloseBtn')
                       || document.querySelector('#announcementModal2 .btn-modal');
        if (closeBtn2) {
            if (isLast) {
                const label = item.buttonText || 'Close';
                closeBtn2.innerHTML = `<i class="fas fa-check"></i> ${label}`;
                closeBtn2.onclick = () => {
                    if (item.buttonUrl) window.open(item.buttonUrl, '_blank');
                    closeModal('announcementModal2');
                };
            } else {
                const label = item.buttonText || 'Continue';
                closeBtn2.innerHTML = `<i class="fas fa-arrow-right"></i> ${label}`;
                closeBtn2.onclick = () => {
                    if (item.buttonUrl) window.open(item.buttonUrl, '_blank');
                    next();
                };
            }
        }

        console.log('🟢 Showing announcementModal2:', item.title);
        _showModalDirect('announcementModal2');
    }
}

function buildAdvertisementSlider(images) {
    const container = document.getElementById('announcement2ImageContainer');
    if (!container) return;

    const valid = (images || []).filter(u => u);
    if (!valid.length) { container.style.display = 'none'; return; }

    container.style.display = 'block';

    if (valid.length === 1) {
        container.innerHTML = `<img src="${valid[0]}" alt="Advertisement"
            style="width:100%;max-height:240px;object-fit:cover;border-radius:12px;"
            onerror="this.parentElement.style.display='none'">`;
        return;
    }

    // Destroy old swiper
    if (window._advSwiper) { try { window._advSwiper.destroy(true,true); } catch(e){} window._advSwiper=null; }

    container.innerHTML = `
        <div class="swiper adv-swiper" style="border-radius:12px;overflow:hidden;max-height:260px;">
            <div class="swiper-wrapper">
                ${valid.map(url => `
                    <div class="swiper-slide">
                        <img src="${url}" alt="Advertisement"
                             style="width:100%;height:240px;object-fit:cover;"
                             onerror="this.src='images/placeholder.png'">
                    </div>`).join('')}
            </div>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-next" style="color:white;--swiper-navigation-size:20px;"></div>
            <div class="swiper-button-prev" style="color:white;--swiper-navigation-size:20px;"></div>
        </div>`;

    setTimeout(() => {
        window._advSwiper = new Swiper('.adv-swiper', {
            loop: valid.length > 1,
            autoplay: { delay: 3000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
    }, 80);
}

// ============ 7. FETCH ALL WALLET IMAGES → BUILD SWIPER SLIDES ============
async function fetchWalletImage() {
    try {
        const res = await fetch(`${API_URL}/api/content/wallet-images/active?audience=${getUserAudience()}`);
        if (!res.ok) return;

        const data = await res.json();
        // ✅ Sort by priority (1 = highest priority = first)
        const images = (data.walletImages || []).sort((a, b) => (a.priority || 99) - (b.priority || 99));
        if (!images.length) return;

        // ✅ Destroy old Swiper before rebuilding
        if (walletSwiper) {
            try { walletSwiper.destroy(true, true); } catch (e) {}
            walletSwiper = null;
        }

        const swiperWrapper = document.querySelector('#walletSwiper .swiper-wrapper');
        if (!swiperWrapper) return;

        // Remove all existing celebration slides (keep only wallet card slide = first child)
        const allSlides = swiperWrapper.querySelectorAll('.swiper-slide');
        allSlides.forEach((slide, i) => { if (i > 0) slide.remove(); });

        // ✅ Add one slide per wallet image (all images, in priority order)
        images.forEach((img) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide wallet-slide';
            slide.innerHTML = `
                <div class="celebration-card">
                    <img src="${img.imageUrl || ''}"
                         alt="${img.title || 'Promo'}"
                         class="celebration-image"
                         style="width:100%;height:100%;object-fit:cover;"
                         onerror="this.style.display='none'">
                    <div class="celebration-overlay">
                        <h3>${img.title || ''}</h3>
                        <p>${img.shortDescription || ''}</p>
                    </div>
                </div>`;
            swiperWrapper.appendChild(slide);
        });

        // ✅ Re-init Swiper with loop only if >1 slide
        const totalSlides = swiperWrapper.children.length;
        walletSwiper = new Swiper('#walletSwiper', {
            autoplay: { delay: 4500, disableOnInteraction: false },
            loop: totalSlides > 1,
            speed: 800,
            pagination: { el: '#walletSwiper .swiper-pagination', clickable: true }
        });

    } catch (error) {
        console.error('❌ fetchWalletImage failed:', error);
        // Fallback: init Swiper with just the wallet card
        if (!walletSwiper) {
            walletSwiper = new Swiper('#walletSwiper', {
                autoplay: { delay: 4500, disableOnInteraction: false },
                loop: false, speed: 800
            });
        }
    }
}

// ============ 8. FETCH POLL (/api/content/polls/active) ============
async function fetchPoll() {
    try {
        // Hide poll section by default
        document.getElementById('pollSection').style.display = 'none';

        const res = await fetch(`${API_URL}/api/content/polls/active?audience=${getUserAudience()}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!data.poll) return;

        const poll = data.poll;
        currentPollId = poll._id;  // ✅ use MongoDB _id for vote route

        // ✅ FIX: pollId = Header Text admin sets (e.g. "Weekly Poll", "Community Vote")
        // If it looks like a MongoDB ObjectId or is empty - fall back to question
        const titleEl = document.getElementById('adminPollTitle');
        if (titleEl) {
            // pollId = headerText admin set. Show it if it's a real title,
            // otherwise fall back to poll.question
            const headerText   = poll.pollId || '';
            const looksLikeId  = /^[a-f0-9]{24}$/i.test(headerText.trim());
            const isAutoGen    = /^POLL-\d+$/i.test(headerText.trim());
            titleEl.textContent = (!headerText || looksLikeId || isAutoGen)
                ? (poll.question || 'Community Poll')
                : headerText;
        }

        // Show poll section
        document.getElementById('pollSection').style.display = 'block';
        document.getElementById('pollQuestion').textContent = poll.question;

        // ✅ Check if current user already voted
        try {
            const voteCheckRes = await fetch(
                `${API_URL}/api/polls/${encodeURIComponent(poll._id)}/user-vote`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (voteCheckRes.ok) {
                const voteData = await voteCheckRes.json();
                if (voteData.hasVoted) {
                    // ✅ Hide poll card completely if already voted
                    document.getElementById('pollSection').style.display = 'none';
                    return;
                }
            }
        } catch(e) { /* silent */ }

        // End time
        // ✅ endTime stored as display string (e.g., "Poll ends in 7 days")
        if (poll.endTime) {
            document.getElementById('pollEndTime').textContent = poll.endTime;
        } else {
            document.getElementById('pollEndTime').textContent = '';
        }

        // Render poll options
        const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

        document.getElementById('pollOptions').innerHTML = poll.options.map((opt, i) => {
            const percentage = totalVotes > 0
                ? Math.round((opt.votes / totalVotes) * 100)
                : 0;
            return `
                <div class="poll-option" data-option-id="${i}"
                     onclick="selectPollOption(${i}, '${opt.text.replace(/'/g, "\\'")}')">
                    <div class="option-row">
                        <div class="option-radio"></div>
                        <div class="option-text">${opt.text}</div>
                        <div class="option-percentage">${percentage}%</div>
                    </div>
                    <div class="option-bar">
                        <div class="option-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('❌ fetchPoll failed:', error);
        document.getElementById('pollSection').style.display = 'none';
    }
}

function selectPollOption(id, text) {
    document.querySelectorAll('.poll-option').forEach(opt => opt.classList.remove('selected'));
    const el = document.querySelector(`.poll-option[data-option-id="${id}"]`);
    if (el) el.classList.add('selected');
    selectedPollOption = id;
    selectedPollText = text;
}

function showVoteModal() {
    if (selectedPollOption === null) {
        alert('Please select an option first!');
        return;
    }
    document.getElementById('selectedOption').textContent = selectedPollText;
    showModal('voteModal');
}

async function submitVote() {
    try {
        if (!currentPollId) return;

        const res = await fetch(`${API_URL}/api/polls/${currentPollId}/vote`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ optionIndex: selectedPollOption })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.message || 'Failed to submit vote');
            closeModal('voteModal');
            return;
        }

        closeModal('voteModal');
        setTimeout(() => showModal('voteSuccessModal'), 300);
        // Refresh poll with updated counts
        // ✅ Hide poll card immediately after voting
        document.getElementById('pollSection').style.display = 'none';

    } catch (error) {
        console.error('❌ submitVote failed:', error);
        alert('Failed to submit vote. Please try again.');
        closeModal('voteModal');
    }
}

// ============ 9. FETCH ALL SPONSORED → PRIORITY ORDER + NAV DOTS ============
let allSponsoredList = [];
let currentSponsoredIndex = 0;
let sponsoredModalSwiper = null;

async function fetchSponsored() {
    try {
        document.getElementById('sponsoredSection').style.display = 'none';

        const res = await fetch(`${API_URL}/api/content/sponsored-ads/active?audience=${getUserAudience()}`);
        if (!res.ok) return;

        const data = await res.json();

        // ✅ Sort by priority (1 = highest = first)
        // ✅ Frontend double-check: filter by audience
        allSponsoredList = (data.sponsored || [])
            .filter(isVisibleToUser)
            .sort((a, b) => (a.priority || 99) - (b.priority || 99));
        if (!allSponsoredList.length) return;

        document.getElementById('sponsoredSection').style.display = 'block';

        // Show first card
        renderSponsoredCard(0);

        // Build nav dots + prev/next arrows
        buildSponsoredNavDots();

        // ✅ Auto-rotate cards every 4 seconds
        if (window._sponsoredAutoplay) clearInterval(window._sponsoredAutoplay);
        if (allSponsoredList.length > 1) {
            window._sponsoredAutoplay = setInterval(() => {
                const next = (currentSponsoredIndex + 1) % allSponsoredList.length;
                renderSponsoredCard(next);
                updateSponsoredDots(next);
            }, 4000);
        }

    } catch (error) {
        console.error('❌ fetchSponsored failed:', error);
        document.getElementById('sponsoredSection').style.display = 'none';
    }
}

function renderSponsoredCard(index) {
    if (index < 0 || index >= allSponsoredList.length) return;
    currentSponsoredIndex = index;
    const sp = allSponsoredList[index];

    // Store current for handlers
    currentSponsoredId     = sp._id;
    currentSponsoredUrl    = sp.url || null;
    currentSponsoredImages = sp.imageUrls || [];

    const btnLabel = sp.buttonText || 'Get Now';

    if (sp.label) document.getElementById('sponsoredLabel').textContent = sp.label;
    document.getElementById('sponsoredTitle').textContent       = sp.title || '';
    document.getElementById('sponsoredDescription').textContent = sp.shortDescription || '';
    document.getElementById('sponsoredPrice').textContent       = sp.price || '';

    // ✅ Card image(s) - build mini swiper if multiple images
    buildSponsoredCardImages(sp, currentSponsoredImages);

    document.getElementById('sponsoredGetBtn').innerHTML =
        `<i class="fas fa-shopping-cart"></i> ${btnLabel}`;
    document.getElementById('sponsoredGetBtn').onclick = openSponsoredUrl;

    updateSponsoredDots(index);
}

function buildSponsoredCardImages(sp, images) {
    const validImages = (images || []).filter(u => u);
    const thumbContainer = document.getElementById('sponsoredImgContainer');

    if (!thumbContainer) {
        // Fallback: just update the single thumb img
        const thumbEl = document.getElementById('sponsoredThumb');
        if (thumbEl) {
            const thumbIdx = sp.thumbnailIndex || 0;
            const url = sp.imageUrl || validImages[thumbIdx] || validImages[0] || null;
            if (url) { thumbEl.src = url; thumbEl.onerror = () => { thumbEl.src='images/placeholder.png'; }; }
        }
        return;
    }

    if (!validImages.length) {
        thumbContainer.style.display = 'none';
        return;
    }

    thumbContainer.style.display = 'block';

    if (validImages.length === 1) {
        thumbContainer.innerHTML = `
            <img src="${validImages[0]}" alt="${sp.title||''}"
                 style="width:100%;height:200px;object-fit:cover;border-radius:12px;"
                 onerror="this.src='images/placeholder.png'">`;
        return;
    }

    // Multiple images → Swiper card
    thumbContainer.innerHTML = `
        <div class="swiper sp-card-swiper" style="height:200px;border-radius:12px;overflow:hidden;">
            <div class="swiper-wrapper">
                ${validImages.map(url => `
                    <div class="swiper-slide">
                        <img src="${url}" alt="${sp.title||''}"
                             style="width:100%;height:200px;object-fit:cover;"
                             onerror="this.src='images/placeholder.png'">
                    </div>`).join('')}
            </div>
            <div class="swiper-pagination" style="bottom:4px;"></div>
        </div>`;

    setTimeout(() => {
        new Swiper('.sp-card-swiper', {
            loop: validImages.length > 1,
            autoplay: { delay: 3000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true }
        });
    }, 50);
}

function updateSponsoredDots(index) {
    const dots = document.querySelectorAll('.sp-nav-dot');
    dots.forEach((d, i) => {
        d.style.background = i === index
            ? 'var(--primary)' : 'rgba(255,255,255,0.4)';
        d.style.width  = i === index ? '20px' : '8px';
    });
}

function sponsoredPrev() {
    if (!allSponsoredList.length) return;
    const prev = (currentSponsoredIndex - 1 + allSponsoredList.length) % allSponsoredList.length;
    renderSponsoredCard(prev);
    updateSponsoredDots(prev);
    // Reset autoplay
    if (window._sponsoredAutoplay) clearInterval(window._sponsoredAutoplay);
    if (allSponsoredList.length > 1) {
        window._sponsoredAutoplay = setInterval(() => {
            const next = (currentSponsoredIndex + 1) % allSponsoredList.length;
            renderSponsoredCard(next);
            updateSponsoredDots(next);
        }, 4000);
    }
}

function sponsoredNext() {
    if (!allSponsoredList.length) return;
    const next = (currentSponsoredIndex + 1) % allSponsoredList.length;
    renderSponsoredCard(next);
    updateSponsoredDots(next);
    if (window._sponsoredAutoplay) clearInterval(window._sponsoredAutoplay);
    if (allSponsoredList.length > 1) {
        window._sponsoredAutoplay = setInterval(() => {
            const n = (currentSponsoredIndex + 1) % allSponsoredList.length;
            renderSponsoredCard(n);
            updateSponsoredDots(n);
        }, 4000);
    }
}

function buildSponsoredNavDots() {
    const old = document.getElementById('sponsoredNavDots');
    if (old) old.remove();
    if (allSponsoredList.length <= 1) return;

    const dots = document.createElement('div');
    dots.id = 'sponsoredNavDots';
    dots.style.cssText = 'display:flex;justify-content:center;gap:7px;margin-top:10px;padding-bottom:4px;';
    dots.innerHTML = allSponsoredList.map((_, i) => `
        <span onclick="renderSponsoredCard(${i})" data-sdot="${i}"
              style="width:9px;height:9px;border-radius:50%;cursor:pointer;display:inline-block;
                     transition:background 0.3s;background:${i === 0 ? 'var(--primary)' : 'var(--border-color)'};"></span>
    `).join('');
    const section = document.getElementById('sponsoredSection');
    if (section) section.appendChild(dots);
}

function updateSponsoredDots(activeIndex) {
    document.querySelectorAll('[data-sdot]').forEach((dot) => {
        const i = parseInt(dot.dataset.sdot);
        dot.style.background = i === activeIndex ? 'var(--primary)' : 'var(--border-color)';
    });
}

// ✅ Open sponsored modal - loads current item data + all images
function openSponsoredModal() {
    const sp = allSponsoredList[currentSponsoredIndex];
    if (!sp) return;

    const btnLabel = sp.buttonText || 'Get Now';
    const images   = sp.imageUrls || [];
    const hasUrl   = !!sp.url;

    // Title, price, description
    document.getElementById('sponsoredModalTitle').textContent = sp.title || '';
    document.getElementById('sponsoredModalPrice').textContent = sp.price || '';
    document.getElementById('sponsoredModalDescription').innerHTML = sp.fullDescription || sp.shortDescription || '';

    // ✅ Buy button - dynamic text from admin
    const buyBtn = document.getElementById('modalBuyBtn');
    if (buyBtn) {
        buyBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> ${btnLabel}`;
        buyBtn.style.display = hasUrl ? 'flex' : 'none';
        buyBtn.onclick = openSponsoredUrl;
    }

    // ✅ Visit button - show only if URL exists
    const visitBtn = document.getElementById('modalVisitBtn');
    if (visitBtn) {
        visitBtn.innerHTML = `<i class="fas fa-external-link-alt"></i> Visit Store`;
        visitBtn.style.display = hasUrl ? 'flex' : 'none';
        visitBtn.onclick = openSponsoredUrl;
    }

    // ✅ Build image slider
    buildSponsoredModalSlider(images);

    // Show the modal directly (bypass showModal to avoid recursion)
    _showModalDirect('sponsoredModal');
}

function buildSponsoredModalSlider(images) {
    const container = document.getElementById('sponsoredModalSlider');
    if (!container) return;

    if (sponsoredModalSwiper) {
        try { sponsoredModalSwiper.destroy(true, true); } catch (e) {}
        sponsoredModalSwiper = null;
    }

    const validImages = (images || []).filter(u => u);

    if (!validImages.length) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    if (validImages.length === 1) {
        container.innerHTML = `
            <img src="${validImages[0]}" alt="Sponsored"
                 style="width:100%;height:280px;object-fit:cover;border-radius:12px;"
                 onerror="this.src='images/placeholder.png'">`;
        return;
    }

    container.innerHTML = `
        <div class="swiper sp-modal-swiper" style="height:280px;border-radius:12px;overflow:hidden;">
            <div class="swiper-wrapper">
                ${validImages.map(url => `
                    <div class="swiper-slide">
                        <img src="${url}" alt="Sponsored"
                             style="width:100%;height:280px;object-fit:cover;"
                             onerror="this.src='images/placeholder.png'">
                    </div>`).join('')}
            </div>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-next" style="color:white;"></div>
            <div class="swiper-button-prev" style="color:white;"></div>
        </div>`;

    setTimeout(() => {
        sponsoredModalSwiper = new Swiper('.sp-modal-swiper', {
            loop: validImages.length > 1,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
        });
    }, 80);
}

function openSponsoredUrl() {
    if (currentSponsoredUrl) {
        window.open(currentSponsoredUrl, '_blank');
    }
    if (currentSponsoredId) {
        fetch(`${API_URL}/api/content/sponsored-ads/${currentSponsoredId}/click`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
    }
}

// ============ 10. WALLET SLIDER INIT ============
function initializeWalletSlider() {
    walletSwiper = new Swiper('#walletSwiper', {
        autoplay: { delay: 4500, disableOnInteraction: false },
        loop: true,
        speed: 800
    });
}

// ============ 11. EARNINGS CHART ============
// ============ SPENDING/DEPOSIT CHART ============

async function fetchChartData(period) {
    period = period || document.getElementById('chartPeriod')?.value || 'weekly';
    
    if (!chartInstance) {
        console.warn('⚠️ Spending chart not initialized yet');
        return;
    }

    try {
        console.log(`📊 Fetching spending chart data (${period})...`);
        const res = await fetch(`${API_URL}/api/advertiser/spending-chart?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            console.error(`❌ Spending chart API error: ${res.status} ${res.statusText}`);
            return;
        }

        const data = await res.json();
        console.log('📊 Spending chart response:', data);

        if (!data.success) {
            console.error('❌ Spending chart API returned success=false:', data.message);
            return;
        }

        if (!data.labels || !Array.isArray(data.labels)) {
            console.error('❌ Spending chart: invalid labels', data.labels);
            return;
        }

        chartInstance.data.labels = data.labels;
        chartInstance.data.datasets[0].data = data.spending || [];
        chartInstance.data.datasets[1].data = data.deposits || [];
        chartInstance.update();

        console.log('✅ Spending chart updated successfully');

    } catch(e) {
        console.error('❌ Spending chart fetch error:', e);
    }
}

function initializeChart() {
    // ── Spending/Deposit Chart ──
    const ctx = document.getElementById('spendingChart');
    if (!ctx) return;

    const periodSelect = document.getElementById('chartPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', () => fetchChartData(periodSelect.value));
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Spending (₦)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgb(239, 68, 68)',
                    pointRadius: 4
                },
                {
                    label: 'Deposits (₦)',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: 'rgb(16, 185, 129)',
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-main'),
                        font: { family: 'Poppins' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-muted'),
                        font: { family: 'Poppins' },
                        callback: (val) => `₦${val.toLocaleString()}`
                    },
                    grid: {
                        color: getComputedStyle(document.body)
                            .getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body)
                            .getPropertyValue('--text-muted'),
                        font: { family: 'Poppins' }
                    },
                    grid: {
                        color: getComputedStyle(document.body)
                            .getPropertyValue('--border-color')
                    }
                }
            }
        }
    });
}

// ============ 12. SIDEBAR ============
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============ 13. THEME ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('themeIcon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    if (chartInstance) {
        const textColor  = isDark ? '#f1f5f9' : '#1e293b';
        const mutedColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor  = isDark ? '#334155' : '#e2e8f0';
        chartInstance.options.plugins.legend.labels.color = textColor;
        chartInstance.options.scales.x.ticks.color  = mutedColor;
        chartInstance.options.scales.x.grid.color   = gridColor;
        chartInstance.options.scales.y.ticks.color  = mutedColor;
        chartInstance.options.scales.y.grid.color   = gridColor;
        chartInstance.update();
    }
}

// ============ 14. BALANCE TOGGLE ============
function toggleBalance() {
    const display = document.getElementById('balanceDisplay');
    const icon    = document.getElementById('eyeIcon');

    isBalanceHidden = !isBalanceHidden;

    if (isBalanceHidden) {
        display.dataset.original = display.textContent;
        display.textContent = '₦•••••';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        display.textContent = display.dataset.original ||
            `₦${(currentUser?.balance || 0).toLocaleString()}`;
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ============ 15. NOTIFICATIONS ============
function showNotificationModal() {
    if (notificationsEnabled) {
        // Toggle OFF
        notificationsEnabled = false;
        localStorage.setItem('notifications_enabled', 'false');
        document.getElementById('notifEnableBtn').classList.remove('enabled');
        document.getElementById('notifBtnText').textContent = 'Enable Notifications';
        document.getElementById('notifIcon').className = 'fas fa-bell-slash';
        showModal('notifDisabledModal');

        // Tell backend
        fetch(`${API_URL}/api/users/disable-notifications`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});
    } else {
        showModal('notificationSettingsModal');
    }
}

function confirmNotifications() {
    notificationsEnabled = true;
    localStorage.setItem('notifications_enabled', 'true');
    document.getElementById('notifEnableBtn').classList.add('enabled');
    document.getElementById('notifBtnText').textContent = 'Notifications On';
    document.getElementById('notifIcon').className = 'fas fa-bell';
    closeModal('notificationSettingsModal');
    setTimeout(() => showModal('notifEnabledModal'), 300);

    // Tell backend
    fetch(`${API_URL}/api/users/enable-notifications`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {});
}

// ============ 16. COPY REFERRAL LINK ============
function copyRefLink() {
    const input = document.getElementById('refLinkInput');
    input.select();
    try {
        document.execCommand('copy');
    } catch (e) {
        navigator.clipboard.writeText(input.value).catch(() => {});
    }
    showModal('copySuccessModal');
}

// ============ 17. MODALS ============
function showModal(id) {
    // ✅ Intercept sponsoredModal - always load current data first
    if (id === 'sponsoredModal') {
        openSponsoredModal();
        return;
    }
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function _showModalDirect(id) {
    // Internal: show without interception (used inside openSponsoredModal)
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function showLogoutModal()  { showModal('logoutModal'); }

function confirmLogout() {
    localStorage.clear();
    window.location.href = 'sign-in.html';
}

// ============ 18. ANNOUNCEMENTS MODAL CHAIN ============
function showAnnouncementsIfAny() {
    // ✅ Only show if announcements were fetched
    if (announcementsData.length > 0) {
        setTimeout(() => showModal('announcementModal1'), 2000);
    }
}

// ============ INIT - PRIORITY ORDER ============
async function init() {
    // 1. Check auth first (redirect if not logged in)
    if (!checkAuth()) return;

    // 2. Load saved theme immediately
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }

    // 3. Restore notification button state
    if (notificationsEnabled) {
        document.getElementById('notifEnableBtn').classList.add('enabled');
        document.getElementById('notifBtnText').textContent = 'Notifications On';
        document.getElementById('notifIcon').className = 'fas fa-bell';
    }

    // 4. Hide conditional sections by default (before API loads)
    document.getElementById('activationBanner').style.display  = 'none';
    document.getElementById('adminMessageBanner').style.display = 'none';
    document.getElementById('pollSection').style.display        = 'none';
    document.getElementById('sponsoredSection').style.display   = 'none';

    // 5. Initialize chart immediately (wallet swiper handled by fetchWalletImage)
    initializeChart();
    // Fetch real chart data after init (non-blocking)
    setTimeout(() => fetchChartData('weekly'), 500);

    // 6. Fetch all data in parallel (priority: user data first)
    try {
        // User data first - most critical
        await fetchUserData();

        // Then all other data in parallel
        await Promise.all([
            checkActivation(),
            fetchReferralSettings(),
            fetchAdminMessage(),
            fetchAnnouncements(),
            fetchWalletImage(),
            fetchPoll(),
            fetchSponsored(),
            fetchGeneralMessage()
            // Note: fetchAdvertiserStats() called inside fetchUserData
        ]);

    } catch (err) {
        console.error('❌ Init fetch error:', err);
    }

    // ✅ Show Ad Modal after delay (announcements shown inside fetchAnnouncements)
    setTimeout(() => fetchAndShowAdModal(), 3000);
}

// ============ GENERAL MESSAGE BANNER (Banner #2) ============
async function fetchGeneralMessage() {
    try {
        const res = await fetch(`${API_URL}/api/user-messages/general`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.message) return;

        const msg = data.message;
        const banner2 = document.getElementById('generalMessageBanner');
        if (!banner2) return;

        // Build banner content
        const colorMap = {
            info:    'linear-gradient(135deg,#00aaff,#0066cc)',
            success: 'linear-gradient(135deg,#10b981,#059669)',
            warning: 'linear-gradient(135deg,#f59e0b,#d97706)',
            danger:  'linear-gradient(135deg,#ef4444,#dc2626)',
            purple:  'linear-gradient(135deg,#8b5cf6,#6d28d9)'
        };
        banner2.style.background = colorMap[msg.type] || colorMap.info;
        banner2.style.display    = 'flex';

        const iconEl  = banner2.querySelector('.gen-msg-icon');
        const titleEl = banner2.querySelector('.gen-msg-title');
        const textEl  = banner2.querySelector('.gen-msg-text');
        const btnEl   = banner2.querySelector('.gen-msg-btn');

        if (iconEl)  iconEl.className  = `${msg.icon || 'fas fa-bullhorn'} gen-msg-icon`;
        if (titleEl) titleEl.textContent = msg.title || '';
        if (textEl)  textEl.innerHTML    = msg.text  || '';

        if (btnEl) {
            if (msg.buttonText && msg.buttonUrl) {
                btnEl.textContent = msg.buttonText;
                btnEl.href        = msg.buttonUrl;
                btnEl.target      = '_blank';
                btnEl.style.display = 'inline-flex';
            } else {
                btnEl.style.display = 'none';
            }
        }

    } catch (e) {
        console.error('❌ fetchGeneralMessage failed:', e);
    }
}


// ============ AD MODAL SYSTEM ============
let adModalTimer = null;

async function fetchAndShowAdModal() {
    try {
        const res = await fetch(`${API_URL}/api/content/ad-modal/active?audience=${getUserAudience()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.adModal) return;

        const ad = data.adModal;

        // Check dismiss interval
        const dismissKey = `ad_dismissed_${ad._id}`;
        const lastDismissed = localStorage.getItem(dismissKey);
        if (lastDismissed) {
            const diffMs    = Date.now() - parseInt(lastDismissed);
            const intervalMs = (ad.intervalHours || 24) * 3600000;
            if (diffMs < intervalMs) return;
        }

        const modal = document.getElementById('adModal');
        if (!modal) return;

        // Logo
        const logoEl = modal.querySelector('.ad-modal-logo');
        if (logoEl) {
            logoEl.innerHTML = ad.logoUrl
                ? `<img src="${ad.logoUrl}" alt="Logo" style="max-height:60px;max-width:180px;object-fit:contain;">`
                : `<div style="font-size:32px;font-weight:800;color:white;">${ad.title || 'Earncial'}</div>`;
        }

        // Title & description
        const titleEl = modal.querySelector('.ad-modal-title');
        const descEl  = modal.querySelector('.ad-modal-desc');
        if (titleEl) titleEl.textContent = ad.title       || '';
        if (descEl)  descEl.textContent  = ad.description || '';

        // Action button
        const actionBtn = modal.querySelector('.ad-modal-action');
        if (actionBtn) {
            if (ad.buttonText && ad.buttonUrl) {
                actionBtn.dataset.origText = ad.buttonText;
                actionBtn.textContent      = ad.buttonText;
                actionBtn.href             = ad.buttonUrl;
                actionBtn.style.display    = 'block';
                // ✅ FIX: clicking ad button = dismiss modal (user interacted)
                actionBtn.onclick = (e) => {
                    e.preventDefault();
                    window.open(ad.buttonUrl, '_blank');
                    dismissAdModal();
                };
            } else {
                // No button - still need a way to close after timer
                actionBtn.style.display = 'none';
            }
        }

        modal.dataset.dismissKey = dismissKey;
        modal.style.display = 'flex';

        // ✅ Auto-close is REQUIRED - no manual close
        // If admin set seconds use it, else default 15 seconds
        const closeAfter = (ad.autoCloseSeconds && ad.autoCloseSeconds > 0)
            ? ad.autoCloseSeconds
            : 15;
        startAdCountdown(closeAfter, dismissKey);

    } catch (err) {
        console.error('❌ Ad modal fetch failed:', err);
    }
}

function startAdCountdown(seconds, dismissKey) {
    const timerEl = document.getElementById('adModalTimer');
    if (!timerEl) return;

    let remaining = seconds;
    timerEl.textContent   = remaining;
    timerEl.style.display = 'flex';

    // Update action button text to show user must click
    const actionBtn = document.querySelector('#adModal .ad-modal-action');
    if (actionBtn && actionBtn.style.display !== 'none') {
        const origText = actionBtn.dataset.origText || actionBtn.textContent;
        actionBtn.dataset.origText = origText;
        actionBtn.textContent = `${origText} (${remaining}s)`;
    }

    if (adModalTimer) clearInterval(adModalTimer);
    adModalTimer = setInterval(() => {
        remaining--;

        // Update timer display
        if (timerEl) timerEl.textContent = remaining;

        // Update button countdown text
        if (actionBtn && actionBtn.style.display !== 'none') {
            const base = actionBtn.dataset.origText || '';
            actionBtn.textContent = remaining > 0
                ? `${base} (${remaining}s)`
                : (base || 'Click to Continue');
        }

        if (remaining <= 0) {
            clearInterval(adModalTimer);
            adModalTimer = null;
            // ✅ FIX: Timer done → do NOT auto close
            // User MUST click the ad button - reset button text to invite click
            if (timerEl) timerEl.style.display = 'none';
            if (actionBtn) {
                actionBtn.textContent = actionBtn.dataset.origText || 'View Ad';
                // Flash button to draw attention
                actionBtn.style.animation = 'pulse 0.6s ease 3';
            }
        }
    }, 1000);
}

// ✅ Called only when user explicitly clicks ad button
function dismissAdModal() {
    const modal = document.getElementById('adModal');
    if (!modal) return;
    const dismissKey = modal.dataset.dismissKey;
    if (dismissKey) localStorage.setItem(dismissKey, Date.now().toString());
    modal.style.display = 'none';
    if (adModalTimer) { clearInterval(adModalTimer); adModalTimer = null; }
    const timerEl = document.getElementById('adModalTimer');
    if (timerEl) timerEl.style.display = 'none';
}

function closeAdModal() {
    // ✅ Manual close only saved after timer ends (user must interact with ad)
    const modal = document.getElementById('adModal');
    if (!modal) return;
    // Only allow close if timer has expired (remaining = 0 = timerEl hidden)
    const timerEl = document.getElementById('adModalTimer');
    const timerDone = !timerEl || timerEl.style.display === 'none' || parseInt(timerEl.textContent || '1') <= 0;
    if (!timerDone) {
        // Timer still running - shake modal to indicate can't close yet
        modal.style.animation = 'shake 0.4s ease';
        setTimeout(() => { modal.style.animation = ''; }, 500);
        return;
    }
    dismissAdModal();
}


window.addEventListener('DOMContentLoaded', init);

// ============ EXPOSE FUNCTIONS TO HTML ============
window.openSidebar          = openSidebar;
window.closeSidebar         = closeSidebar;
window.toggleTheme          = toggleTheme;
window.toggleBalance         = toggleBalance;
window.showNotificationModal = showNotificationModal;
window.confirmNotifications  = confirmNotifications;
window.copyRefLink           = copyRefLink;
window.showVoteModal         = showVoteModal;
window.submitVote            = submitVote;
window.selectPollOption      = selectPollOption;
window.closeAdminMessage     = closeAdminMessage;
window.showLogoutModal       = showLogoutModal;
window.confirmLogout         = confirmLogout;
window.showModal             = showModal;
window.closeModal            = closeModal;
window.openSponsoredUrl      = openSponsoredUrl;
window.openSponsoredModal    = openSponsoredModal;   // ✅ Details button
window.renderSponsoredCard   = renderSponsoredCard;  // ✅ Nav dots onclick
window.closeAdModal              = closeAdModal;
window.dismissAnnouncementModal  = dismissAnnouncementModal;
window.dismissAdModal         = dismissAdModal;
window.fetchChartData         = fetchChartData;
window.fetchAdvertiserStats   = fetchAdvertiserStats;        // ✅ Ad modal dismiss on click
window.sponsoredPrev         = sponsoredPrev;         // ✅ Sponsored card prev
window.sponsoredNext         = sponsoredNext;         // ✅ Sponsored card next
window.updateSponsoredDots   = updateSponsoredDots;   // ✅ Update dots
