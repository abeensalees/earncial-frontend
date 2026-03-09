// ================================================
// EARNCIAL - ADMIN SETTINGS MANAGER
// WITH ADVERTISER REFERRAL SUPPORT
// ================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

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
}

function loadTheme() {
    const savedTheme = localStorage.getItem('admin_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.theme-toggle i').className = 'fas fa-sun';
    }
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

// ============ LOAD SETTINGS ============
async function loadSettings() {
    try {
        console.log('📥 Loading settings...');
        
        const res = await fetch(`${API_URL}/api/admin/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load settings');

        const settings = await res.json();
        console.log('✅ Settings loaded:', settings);

        // Populate form
        document.getElementById('activationFee').value = settings.activationFee || 0;
        document.getElementById('referralReward').value = settings.referralActivationReward || 0;
        document.getElementById('advertiserReferralPercent').value = settings.advertiserReferralPercentage || 0;
        document.getElementById('activationRequired').checked = settings.isActivationRequired || false;
        document.getElementById('referralEnabled').checked = settings.referralProgramEnabled || false;

        // Update UI
        updateOverviewCards(settings);
        updatePreview();
        updateAdvertiserPreview();
        
        showToast('success', 'Settings Loaded', 'Platform settings loaded successfully');
        
    } catch (err) {
        console.error('❌ Load settings error:', err);
        showToast('error', 'Error', err.message || 'Failed to load settings');
    }
}

// ============ UPDATE OVERVIEW CARDS ============
function updateOverviewCards(settings) {
    document.getElementById('activationStatus').textContent = settings.isActivationRequired ? 'ENABLED' : 'DISABLED';
    document.getElementById('activationFeeDisplay').textContent = '₦' + (settings.activationFee || 0).toLocaleString();
    document.getElementById('referralStatus').textContent = settings.referralProgramEnabled ? 'ACTIVE' : 'INACTIVE';
    document.getElementById('referralRewardDisplay').textContent = '₦' + (settings.referralActivationReward || 0).toLocaleString();
    document.getElementById('advertiserRewardDisplay').textContent = (settings.advertiserReferralPercentage || 0) + '%';
}

// ============ UPDATE USER REFERRAL PREVIEW ============
function updatePreview() {
    const activationFee = parseFloat(document.getElementById('activationFee').value) || 0;
    const referralReward = parseFloat(document.getElementById('referralReward').value) || 0;
    const profit = activationFee - referralReward;

    document.getElementById('previewActivationFee').textContent = '₦' + activationFee.toLocaleString();
    document.getElementById('previewReferralReward').textContent = '₦' + referralReward.toLocaleString();
    document.getElementById('previewProfit').textContent = '₦' + profit.toLocaleString();

    // Update overview cards
    document.getElementById('activationStatus').textContent = document.getElementById('activationRequired').checked ? 'ENABLED' : 'DISABLED';
    document.getElementById('activationFeeDisplay').textContent = '₦' + activationFee.toLocaleString();
    document.getElementById('referralStatus').textContent = document.getElementById('referralEnabled').checked ? 'ACTIVE' : 'INACTIVE';
    document.getElementById('referralRewardDisplay').textContent = '₦' + referralReward.toLocaleString();
}

// ============ UPDATE ADVERTISER REFERRAL PREVIEW ============
function updateAdvertiserPreview() {
    const percentage = parseFloat(document.getElementById('advertiserReferralPercent').value) || 0;
    const exampleDeposit = 10000; // Fixed example
    const reward = Math.floor((exampleDeposit * percentage) / 100);

    document.getElementById('examplePercent').textContent = percentage + '%';
    document.getElementById('exampleReward').textContent = '₦' + reward.toLocaleString();
    document.getElementById('advertiserRewardDisplay').textContent = percentage + '%';
}

// ============ SAVE SETTINGS ============
async function saveSettings() {
    try {
        const saveBtn = document.getElementById('saveBtn');
        const saveStatus = document.getElementById('saveStatus');
        
        // Show saving status
        saveBtn.disabled = true;
        saveStatus.classList.add('saving');
        saveStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Saving...</span>';

        const settings = {
            activationFee: parseFloat(document.getElementById('activationFee').value) || 0,
            referralActivationReward: parseFloat(document.getElementById('referralReward').value) || 0,
            advertiserReferralPercentage: parseFloat(document.getElementById('advertiserReferralPercent').value) || 0,
            isActivationRequired: document.getElementById('activationRequired').checked,
            referralProgramEnabled: document.getElementById('referralEnabled').checked
        };

        // Validation
        if (settings.advertiserReferralPercentage < 0 || settings.advertiserReferralPercentage > 20) {
            throw new Error('Advertiser referral percentage must be between 0% and 20%');
        }

        if (settings.referralActivationReward > settings.activationFee) {
            throw new Error('Referral reward cannot exceed activation fee');
        }

        console.log('📤 Saving settings:', settings);

        const res = await fetch(`${API_URL}/api/admin/settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(settings)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to save settings');
        }

        const data = await res.json();
        console.log('✅ Settings saved:', data);

        // Update UI
        updateOverviewCards(data.settings || settings);
        
        // Show success status
        saveStatus.classList.remove('saving');
        saveStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>All changes saved</span>';
        
        showToast('success', 'Settings Saved', 'Platform settings updated successfully');
        
    } catch (err) {
        console.error('❌ Save settings error:', err);
        
        const saveStatus = document.getElementById('saveStatus');
        saveStatus.classList.remove('saving');
        saveStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>All changes saved</span>';
        
        showToast('error', 'Save Failed', err.message);
    } finally {
        document.getElementById('saveBtn').disabled = false;
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
    loadTheme();
    await loadSettings();
}

window.addEventListener('DOMContentLoaded', init);

console.log('✅ Admin Settings Manager Loaded');
console.log('📊 Features: Activation, User Referrals, Advertiser Referrals');