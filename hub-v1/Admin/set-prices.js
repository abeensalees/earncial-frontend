// ================================================
// EARNCIAL ADMIN - SET TASK PRICES (FIXED VERSION)
// File: set-price.js
// ================================================

const API_URL = 'http://localhost:5000';
let authToken = localStorage.getItem('earncial_token');

// ==================== GLOBAL STATE ====================
let allPrices = [];
let currentPlatform = 'facebook';
let currentUser = null;

// ==================== PLATFORM DEFINITIONS ====================
const PLATFORMS = {
    facebook: {
        name: 'Facebook',
        icon: 'fab fa-facebook-f',
        tasks: [
            { name: 'Page Like', icon: 'fas fa-thumbs-up' },
            { name: 'Post Like', icon: 'fas fa-heart' },
            { name: 'Comment', icon: 'fas fa-comment' },
            { name: 'Share Post', icon: 'fas fa-share' },
            { name: 'Follow Profile', icon: 'fas fa-user-plus' },
            { name: 'Video View', icon: 'fas fa-eye' },
            { name: 'Join Group', icon: 'fas fa-users' }
        ]
    },
    instagram: {
        name: 'Instagram',
        icon: 'fab fa-instagram',
        tasks: [
            { name: 'Follow Account', icon: 'fas fa-user-plus' },
            { name: 'Like Post', icon: 'fas fa-heart' },
            { name: 'Comment', icon: 'fas fa-comment' },
            { name: 'Save Post', icon: 'fas fa-bookmark' },
            { name: 'Share to Story', icon: 'fas fa-share' },
            { name: 'Reel View', icon: 'fas fa-play' },
            { name: 'IGTV View', icon: 'fas fa-video' }
        ]
    },
    twitter: {
        name: 'Twitter',
        icon: 'fab fa-twitter',
        tasks: [
            { name: 'Follow Account', icon: 'fas fa-user-plus' },
            { name: 'Like Tweet', icon: 'fas fa-heart' },
            { name: 'Retweet', icon: 'fas fa-retweet' },
            { name: 'Reply/Comment', icon: 'fas fa-comment' },
            { name: 'Quote Tweet', icon: 'fas fa-quote-right' },
            { name: 'Bookmark Tweet', icon: 'fas fa-bookmark' },
            { name: 'View Tweet', icon: 'fas fa-eye' }
        ]
    },
    youtube: {
        name: 'YouTube',
        icon: 'fab fa-youtube',
        tasks: [
            { name: 'Subscribe', icon: 'fas fa-bell' },
            { name: 'Like Video', icon: 'fas fa-thumbs-up' },
            { name: 'Comment on Video', icon: 'fas fa-comment' },
            { name: 'Watch Video (Full)', icon: 'fas fa-eye' },
            { name: 'Share Video', icon: 'fas fa-share' },
            { name: 'Watch + Like + Comment', icon: 'fas fa-play-circle' },
            { name: 'Save to Playlist', icon: 'fas fa-bookmark' }
        ]
    },
    tiktok: {
        name: 'TikTok',
        icon: 'fab fa-tiktok',
        tasks: [
            { name: 'Follow Account', icon: 'fas fa-user-plus' },
            { name: 'Like Video', icon: 'fas fa-heart' },
            { name: 'Comment', icon: 'fas fa-comment' },
            { name: 'Share Video', icon: 'fas fa-share' },
            { name: 'Watch Video (Full)', icon: 'fas fa-eye' },
            { name: 'Favorite Video', icon: 'fas fa-bookmark' },
            { name: 'Download Video', icon: 'fas fa-download' }
        ]
    },
    linkedin: {
        name: 'LinkedIn',
        icon: 'fab fa-linkedin-in',
        tasks: [
            { name: 'Connect with Profile', icon: 'fas fa-user-plus' },
            { name: 'Like Post', icon: 'fas fa-thumbs-up' },
            { name: 'Comment on Post', icon: 'fas fa-comment' },
            { name: 'Share Post', icon: 'fas fa-share' },
            { name: 'Follow Company Page', icon: 'fas fa-building' },
            { name: 'Endorse Skill', icon: 'fas fa-star' },
            { name: 'Write Recommendation', icon: 'fas fa-pen' }
        ]
    },
    pinterest: {
        name: 'Pinterest',
        icon: 'fab fa-pinterest-p',
        tasks: [
            { name: 'Follow Account', icon: 'fas fa-user-plus' },
            { name: 'Save Pin', icon: 'fas fa-thumbtack' },
            { name: 'Comment on Pin', icon: 'fas fa-comment' },
            { name: 'Share Pin', icon: 'fas fa-share' },
            { name: 'Follow Board', icon: 'fas fa-folder-plus' },
            { name: 'Like Pin', icon: 'fas fa-heart' }
        ]
    },
    snapchat: {
        name: 'Snapchat',
        icon: 'fab fa-snapchat-ghost',
        tasks: [
            { name: 'Add Friend', icon: 'fas fa-user-plus' },
            { name: 'View Story', icon: 'fas fa-eye' },
            { name: 'View Snap', icon: 'fas fa-camera' },
            { name: 'Subscribe to Channel', icon: 'fas fa-bell' },
            { name: 'Share Story', icon: 'fas fa-share' },
            { name: 'Watch Spotlight', icon: 'fas fa-play' }
        ]
    },
    reddit: {
        name: 'Reddit',
        icon: 'fab fa-reddit-alien',
        tasks: [
            { name: 'Join Subreddit', icon: 'fas fa-users' },
            { name: 'Upvote Post', icon: 'fas fa-arrow-up' },
            { name: 'Comment on Post', icon: 'fas fa-comment' },
            { name: 'Share Post', icon: 'fas fa-share' },
            { name: 'Give Award', icon: 'fas fa-award' },
            { name: 'Save Post', icon: 'fas fa-bookmark' }
        ]
    },
    whatsapp: {
        name: 'WhatsApp',
        icon: 'fab fa-whatsapp',
        tasks: [
            { name: 'Join Group', icon: 'fas fa-users' },
            { name: 'Share Status', icon: 'fas fa-share' },
            { name: 'View Status', icon: 'fas fa-eye' },
            { name: 'Follow Channel', icon: 'fas fa-bell' },
            { name: 'Forward Message', icon: 'fas fa-forward' },
            { name: 'Add Contact', icon: 'fas fa-user-plus' }
        ]
    },
    telegram: {
        name: 'Telegram',
        icon: 'fab fa-telegram-plane',
        tasks: [
            { name: 'Join Group', icon: 'fas fa-users' },
            { name: 'Join Channel', icon: 'fas fa-bell' },
            { name: 'React to Post', icon: 'fas fa-thumbs-up' },
            { name: 'Comment on Post', icon: 'fas fa-comment' },
            { name: 'Forward Post', icon: 'fas fa-share' },
            { name: 'View Post', icon: 'fas fa-eye' },
            { name: 'Start Bot', icon: 'fas fa-robot' }
        ]
    },
    threads: {
        name: 'Threads',
        icon: 'fab fa-threads',
        tasks: [
            { name: 'Follow Account', icon: 'fas fa-user-plus' },
            { name: 'Like Thread', icon: 'fas fa-heart' },
            { name: 'Reply to Thread', icon: 'fas fa-reply' },
            { name: 'Repost Thread', icon: 'fas fa-retweet' },
            { name: 'Quote Thread', icon: 'fas fa-quote-right' },
            { name: 'Share Thread', icon: 'fas fa-share' }
        ]
    },
    spotify: {
        name: 'Spotify',
        icon: 'fab fa-spotify',
        tasks: [
            { name: 'Follow Artist', icon: 'fas fa-user-plus' },
            { name: 'Save Track', icon: 'fas fa-heart' },
            { name: 'Stream Song', icon: 'fas fa-play' },
            { name: 'Follow Playlist', icon: 'fas fa-list' },
            { name: 'Save Album', icon: 'fas fa-compact-disc' }
        ]
    },
    audiomack: {
        name: 'Audiomack',
        icon: 'fas fa-music',
        tasks: [
            { name: 'Follow Artist', icon: 'fas fa-user-plus' },
            { name: 'Stream Song', icon: 'fas fa-play' },
            { name: 'Favorite Song', icon: 'fas fa-heart' },
            { name: 'Repost Track', icon: 'fas fa-retweet' },
            { name: 'Download Song', icon: 'fas fa-download' }
        ]
    },
    boomplay: {
        name: 'Boomplay',
        icon: 'fas fa-compact-disc',
        tasks: [
            { name: 'Follow Artist', icon: 'fas fa-user-plus' },
            { name: 'Stream Song', icon: 'fas fa-play' },
            { name: 'Like Song', icon: 'fas fa-heart' },
            { name: 'Download Track', icon: 'fas fa-download' },
            { name: 'Share Song', icon: 'fas fa-share' }
        ]
    },
    playstore: {
        name: 'Play Store',
        icon: 'fab fa-google-play',
        tasks: [
            { name: 'Download App', icon: 'fas fa-download' },
            { name: 'Rate App (5 Stars)', icon: 'fas fa-star' },
            { name: 'Write Review', icon: 'fas fa-comment' },
            { name: 'Install & Open App', icon: 'fas fa-mobile-alt' },
            { name: 'Mark Review Helpful', icon: 'fas fa-thumbs-up' }
        ]
    },
    appstore: {
        name: 'App Store',
        icon: 'fab fa-app-store-ios',
        tasks: [
            { name: 'Download App', icon: 'fas fa-download' },
            { name: 'Rate App (5 Stars)', icon: 'fas fa-star' },
            { name: 'Write Review', icon: 'fas fa-comment' },
            { name: 'Install & Open App', icon: 'fas fa-mobile-alt' },
            { name: 'Mark Review Helpful', icon: 'fas fa-thumbs-up' }
        ]
    },
    website: {
        name: 'Website',
        icon: 'fas fa-globe',
        tasks: [
            { name: 'Visit Website', icon: 'fas fa-eye' },
            { name: 'Stay 30 Seconds', icon: 'fas fa-clock' },
            { name: 'Click Link/Button', icon: 'fas fa-mouse-pointer' },
            { name: 'Newsletter Signup', icon: 'fas fa-envelope' },
            { name: 'Share Website', icon: 'fas fa-share' },
            { name: 'Watch Video on Site', icon: 'fas fa-play' }
        ]
    },
    google: {
        name: 'Google Review',
        icon: 'fab fa-google',
        tasks: [
            { name: '5-Star Rating', icon: 'fas fa-star' },
            { name: 'Write Review', icon: 'fas fa-comment' },
            { name: 'Upload Photo Review', icon: 'fas fa-camera' },
            { name: 'Mark Review Helpful', icon: 'fas fa-thumbs-up' },
            { name: 'Check-in Location', icon: 'fas fa-map-marker-alt' }
        ]
    },
    trustpilot: {
        name: 'Trustpilot',
        icon: 'fas fa-star',
        tasks: [
            { name: '5-Star Review', icon: 'fas fa-star' },
            { name: 'Write Detailed Review', icon: 'fas fa-pen' },
            { name: 'Mark Review Useful', icon: 'fas fa-thumbs-up' },
            { name: 'Share Review', icon: 'fas fa-share' }
        ]
    }
};

// ==================== CONFIRMATION MODAL ====================
let confirmCallback = null;

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').classList.add('active');
    
    confirmCallback = onConfirm;
    
    const yesBtn = document.getElementById('confirmYesBtn');
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    
    newYesBtn.addEventListener('click', () => {
        closeConfirmModal();
        if (confirmCallback) {
            confirmCallback();
            confirmCallback = null;
        }
    });
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    confirmCallback = null;
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    console.log('🚀 Initializing Set Prices Panel...');
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.className = 'fas fa-sun';
    }
    
    const isAdmin = await checkAuth();
    if (!isAdmin) return;
    
    loadPlatformTabs();
    loadPlatformSections();
    await fetchAllPrices();
    setupEventListeners();
    
    console.log('%c✅ Set Prices Panel Loaded!', 'color: #10b981; font-size: 14px; font-weight: bold;');
}

// ==================== AUTHENTICATION ====================
async function checkAuth() {
    try {
        authToken = localStorage.getItem('earncial_token');
        
        if (!authToken) {
            console.error('❌ No auth token found');
            showToast('Please login first', 'error');
            setTimeout(() => window.location.href = '../sign-in.html', 1500);
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
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = '../sign-in.html', 1500);
            return false;
        }

        const data = await response.json();
        
        if (!data.success) {
            console.error('❌ Auth failed:', data.message);
            localStorage.removeItem('earncial_token');
            setTimeout(() => window.location.href = '../sign-in.html', 1500);
            return false;
        }

        currentUser = data.user;
        console.log('✅ User authenticated:', currentUser.username);

        if (currentUser.role !== 'admin') {
            console.error('❌ Access denied: User is not admin');
            showToast('Access Denied: Admin privileges required', 'error');
            setTimeout(() => window.location.href = '../dashboard.html', 1500);
            return false;
        }

        return true;

    } catch (error) {
        console.error('❌ Auth check error:', error);
        showToast('Authentication error. Please login again.', 'error');
        setTimeout(() => window.location.href = '../sign-in.html', 1500);
        return false;
    }
}

// ==================== API HELPER ====================
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
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => window.location.href = '../sign-in.html', 1500);
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

// ==================== LOAD PLATFORM TABS ====================
function loadPlatformTabs() {
    const tabsContainer = document.getElementById('platformTabs');
    let tabsHTML = '';
    
    Object.keys(PLATFORMS).forEach((key, index) => {
        const platform = PLATFORMS[key];
        const activeClass = index === 0 ? 'active' : '';
        tabsHTML += `
            <button class="tab-btn ${activeClass}" data-platform="${key}">
                <i class="${platform.icon}"></i> ${platform.name}
            </button>
        `;
    });
    
    tabsContainer.innerHTML = tabsHTML;
    
    const newPricePlatform = document.getElementById('newPricePlatform');
    if (newPricePlatform) {
        let optionsHTML = '';
        Object.keys(PLATFORMS).forEach(key => {
            optionsHTML += `<option value="${key}">${PLATFORMS[key].name}</option>`;
        });
        newPricePlatform.innerHTML = optionsHTML;
    }
}

// ==================== LOAD PLATFORM SECTIONS ====================
function loadPlatformSections() {
    const sectionsContainer = document.getElementById('platformSections');
    let sectionsHTML = '';
    
    Object.keys(PLATFORMS).forEach((key, index) => {
        const platform = PLATFORMS[key];
        const activeClass = index === 0 ? 'active' : '';
        
        sectionsHTML += `
            <div class="price-section ${activeClass}" id="${key}-section">
                <div class="section-header">
                    <h3><i class="${platform.icon}"></i> ${platform.name} Task Prices</h3>
                    <div class="bulk-actions">
                        <button class="bulk-btn create" onclick="openCreateModal('${key}')">
                            <i class="fas fa-plus"></i> Create New
                        </button>
                        <button class="bulk-btn increase" onclick="bulkAdjust('${key}', 1)">
                            <i class="fas fa-arrow-up"></i> +₦1 All
                        </button>
                        <button class="bulk-btn decrease" onclick="bulkAdjust('${key}', -1)">
                            <i class="fas fa-arrow-down"></i> -₦1 All
                        </button>
                        <button class="bulk-btn reset" onclick="resetPlatform('${key}')">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                        <button class="bulk-btn export" onclick="exportCurrentPlatform('${key}')">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 40%;">Task Type</th>
                                <th style="width: 20%;">Price per Task</th>
                                <th style="width: 15%;">Status</th>
                                <th style="width: 25%;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="${key}-tbody">
                            ${platform.tasks.map(task => `
                                <tr data-task="${task.name}">
                                    <td>
                                        <div class="task-name-cell">
                                            <div class="task-icon-sm">
                                                <i class="${task.icon}"></i>
                                            </div>
                                            <span>${task.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="price-input">
                                            <span class="currency">₦</span>
                                            <input type="number" value="0" min="0" step="0.5" 
                                                   data-platform="${key}" data-task="${task.name}">
                                        </div>
                                    </td>
                                    <td class="status-cell">
                                        <span class="status-badge status-inactive">NOT SET</span>
                                    </td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="btn btn-approve" onclick="saveSingle('${key}', '${task.name}')" title="Save">
                                                <i class="fas fa-save"></i> Save
                                            </button>
                                            <button class="btn btn-edit" onclick="editPrice('${key}', '${task.name}')" title="Edit">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-reject" onclick="toggleStatus('${key}', '${task.name}')" title="Toggle">
                                                <i class="fas fa-power-off"></i> Toggle
                                            </button>
                                            <button class="btn btn-delete" onclick="deletePrice('${key}', '${task.name}')" title="Delete">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    sectionsContainer.innerHTML = sectionsHTML;
}

// ==================== FETCH ALL PRICES ====================
async function fetchAllPrices() {
    try {
        showLoading(true);
        
        console.log('📥 Fetching task prices from /api/admin/task-prices');
        
        const data = await apiRequest('/api/admin/task-prices');
        
        console.log('📦 API Response:', data);
        
        if (data.success && data.data) {
            allPrices = data.data;
            
            console.log('✅ Loaded', allPrices.length, 'task prices');
            console.log('📋 Prices:', allPrices);
            
            updateAllInputs();
            await updateStatistics();
        } else {
            console.log('⚠️ No prices found');
            allPrices = [];
        }
        
        showLoading(false);
    } catch (error) {
        console.error('❌ Error fetching prices:', error);
        showToast('Failed to load prices: ' + error.message, 'error');
        showLoading(false);
        allPrices = [];
    }
}

// ==================== UPDATE ALL INPUTS ====================
function updateAllInputs() {
    console.log('🔄 Updating inputs with fetched prices...');
    
    allPrices.forEach(price => {
        const input = document.querySelector(`input[data-platform="${price.platform}"][data-task="${price.taskType}"]`);
        
        if (input) {
            console.log(`✏️ Updating ${price.platform} - ${price.taskType}: ₦${price.price}`);
            
            input.value = price.price;
            input.dataset.priceId = price._id;
            input.dataset.status = price.status;
            
            const row = input.closest('tr');
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                statusBadge.textContent = price.status.toUpperCase();
                statusBadge.className = `status-badge status-${price.status}`;
            }
        } else {
            console.warn(`⚠️ Input not found for ${price.platform} - ${price.taskType}`);
        }
    });
    
    console.log('✅ Inputs updated successfully');
}

// ==================== UPDATE STATISTICS ====================
async function updateStatistics() {
    try {
        console.log('📊 Fetching statistics...');
        
        const data = await apiRequest('/api/admin/task-prices/statistics');
        
        console.log('📦 Statistics Response:', data);
        
        if (data.success && data.data) {
            const stats = data.data;
            
            document.getElementById('totalPlatforms').textContent = stats.totalPlatforms || 20;
            document.getElementById('totalTasks').textContent = `${stats.overall?.totalTasks || 0}+`;
            document.getElementById('averagePrice').textContent = `₦${(stats.overall?.averagePrice || 0).toFixed(2)}`;
            
            console.log('✅ Statistics updated successfully');
        }
    } catch (error) {
        console.error('❌ Error fetching statistics:', error);
    }
}

// ==================== SAVE SINGLE PRICE ====================
async function saveSingle(platform, taskName) {
    const input = document.querySelector(`input[data-platform="${platform}"][data-task="${taskName}"]`);
    const price = parseFloat(input.value) || 0;
    
    if (price < 0) {
        showToast('Price cannot be negative', 'error');
        input.value = 0;
        return;
    }
    
    try {
        showLoading(true);
        
        const data = await apiRequest('/api/admin/task-prices', {
            method: 'POST',
            body: JSON.stringify({
                platform,
                taskType: taskName,
                price,
                status: 'active'
            })
        });
        
        if (data.success) {
            showToast(`${taskName} price updated to ₦${price}`, 'success');
            await fetchAllPrices();
        }
        
        showLoading(false);
    } catch (error) {
        showToast(error.message || 'Failed to save price', 'error');
        showLoading(false);
    }
}

// ==================== SAVE ALL PRICES ====================
async function saveAllPrices() {
    showConfirmModal(
        'Save All Price Changes',
        'Are you sure you want to save all price modifications across all platforms? This will update all task prices at once.',
        async () => {
            try {
                showLoading(true);
                
                const allInputs = document.querySelectorAll('input[data-platform]');
                const pricesToSave = [];
                
                allInputs.forEach(input => {
                    const platform = input.dataset.platform;
                    const taskType = input.dataset.task;
                    const price = parseFloat(input.value) || 0;
                    
                    if (price > 0) {
                        pricesToSave.push({
                            platform,
                            taskType,
                            price,
                            status: 'active'
                        });
                    }
                });
                
                if (pricesToSave.length === 0) {
                    showToast('No prices to save', 'error');
                    showLoading(false);
                    return;
                }
                
                console.log(`📤 Saving ${pricesToSave.length} prices...`);
                
                const promises = pricesToSave.map(priceData => 
                    apiRequest('/api/admin/task-prices', {
                        method: 'POST',
                        body: JSON.stringify(priceData)
                    })
                );
                
                await Promise.all(promises);
                
                await fetchAllPrices();
                
                showToast(`Successfully saved ${pricesToSave.length} task prices!`, 'success');
                showLoading(false);
                
            } catch (error) {
                console.error('❌ Error saving all prices:', error);
                showToast('Failed to save all prices: ' + error.message, 'error');
                showLoading(false);
            }
        }
    );
}

// ==================== OPEN CREATE MODAL ====================
function openCreateModal(platform = null) {
    if (platform) {
        document.getElementById('newPricePlatform').value = platform;
    }
    document.getElementById('createPriceModal').classList.add('active');
}

function closeCreateModal() {
    document.getElementById('createPriceModal').classList.remove('active');
    document.getElementById('newPriceTaskType').value = '';
    document.getElementById('newPriceAmount').value = '';
    document.getElementById('newPriceStatus').value = 'active';
}

// ==================== CREATE NEW PRICE ====================
async function createNewPrice() {
    const platform = document.getElementById('newPricePlatform').value;
    const taskType = document.getElementById('newPriceTaskType').value.trim();
    const price = parseFloat(document.getElementById('newPriceAmount').value);
    const status = document.getElementById('newPriceStatus').value;
    
    if (!taskType || isNaN(price) || price < 0) {
        showToast('Please fill all fields correctly', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const data = await apiRequest('/api/admin/task-prices', {
            method: 'POST',
            body: JSON.stringify({ platform, taskType, price, status })
        });
        
        if (data.success) {
            closeCreateModal();
            await fetchAllPrices();
            showToast(`Price for ${taskType} created successfully!`, 'success');
        }
        
        showLoading(false);
    } catch (error) {
        showToast(error.message || 'Failed to create price', 'error');
        showLoading(false);
    }
}

// ==================== EDIT PRICE ====================
function editPrice(platform, taskName) {
    const input = document.querySelector(`input[data-platform="${platform}"][data-task="${taskName}"]`);
    const priceId = input.dataset.priceId;
    
    if (!priceId) {
        showToast('Price not found in database. Save it first.', 'error');
        return;
    }
    
    const priceData = allPrices.find(p => p._id === priceId);
    if (!priceData) {
        showToast('Price not found', 'error');
        return;
    }
    
    document.getElementById('editPricePlatform').value = PLATFORMS[platform].name;
    document.getElementById('editPriceTaskType').value = taskName;
    document.getElementById('editPriceAmount').value = priceData.price;
    document.getElementById('editPriceStatus').value = priceData.status;
    document.getElementById('editPriceId').value = priceId;
    
    document.getElementById('editPriceModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editPriceModal').classList.remove('active');
}

// ==================== UPDATE PRICE ====================
async function updatePrice() {
    const priceId = document.getElementById('editPriceId').value;
    const price = parseFloat(document.getElementById('editPriceAmount').value);
    const status = document.getElementById('editPriceStatus').value;
    
    const priceData = allPrices.find(p => p._id === priceId);
    if (!priceData) {
        showToast('Price not found', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        const data = await apiRequest('/api/admin/task-prices', {
            method: 'POST',
            body: JSON.stringify({
                platform: priceData.platform,
                taskType: priceData.taskType,
                price,
                status
            })
        });
        
        if (data.success) {
            closeEditModal();
            await fetchAllPrices();
            showToast('Price updated successfully!', 'success');
        }
        
        showLoading(false);
    } catch (error) {
        showToast(error.message || 'Failed to update price', 'error');
        showLoading(false);
    }
}

// ==================== TOGGLE STATUS ====================
async function toggleStatus(platform, taskName) {
    const input = document.querySelector(`input[data-platform="${platform}"][data-task="${taskName}"]`);
    const priceId = input.dataset.priceId;
    
    if (!priceId) {
        showToast('Price not found in database. Save it first.', 'error');
        return;
    }
    
    const priceData = allPrices.find(p => p._id === priceId);
    if (!priceData) {
        showToast('Price not found', 'error');
        return;
    }
    
    const newStatus = priceData.status === 'active' ? 'inactive' : 'active';
    
    showConfirmModal(
        'Toggle Status',
        `Change ${taskName} status from "${priceData.status}" to "${newStatus}"?`,
        async () => {
            try {
                showLoading(true);
                
                const data = await apiRequest('/api/admin/task-prices', {
                    method: 'POST',
                    body: JSON.stringify({
                        platform: priceData.platform,
                        taskType: priceData.taskType,
                        price: priceData.price,
                        status: newStatus
                    })
                });
                
                if (data.success) {
                    await fetchAllPrices();
                    showToast(`Status changed to ${newStatus}`, 'success');
                }
                
                showLoading(false);
            } catch (error) {
                showToast(error.message || 'Failed to toggle status', 'error');
                showLoading(false);
            }
        }
    );
}

// ==================== DELETE PRICE ====================
async function deletePrice(platform, taskName) {
    const input = document.querySelector(`input[data-platform="${platform}"][data-task="${taskName}"]`);
    const priceId = input.dataset.priceId;
    
    if (!priceId) {
        showToast('Price not found in database', 'error');
        return;
    }
    
    showConfirmModal(
        'Delete Task Price',
        `Are you sure you want to delete the price for "${taskName}"? This action cannot be undone.`,
        async () => {
            try {
                showLoading(true);
                
                const data = await apiRequest(`/api/admin/task-prices/${priceId}`, {
                    method: 'DELETE'
                });
                
                if (data.success) {
                    await fetchAllPrices();
                    input.value = 0;
                    delete input.dataset.priceId;
                    showToast(`${taskName} price deleted successfully`, 'success');
                }
                
                showLoading(false);
            } catch (error) {
                showToast(error.message || 'Failed to delete price', 'error');
                showLoading(false);
            }
        }
    );
}

// ==================== BULK ADJUST ====================
async function bulkAdjust(platform, adjustment) {
    const platformName = PLATFORMS[platform].name;
    
    showConfirmModal(
        'Bulk Price Adjustment',
        `Adjust all ${platformName} prices by ₦${adjustment}? This will affect all task prices for this platform.`,
        async () => {
            const inputs = document.querySelectorAll(`input[data-platform="${platform}"]`);
            const promises = [];
            
            showLoading(true);
            
            for (const input of inputs) {
                const currentPrice = parseFloat(input.value) || 0;
                const newPrice = Math.max(0, currentPrice + adjustment);
                const taskName = input.dataset.task;
                
                promises.push(
                    apiRequest('/api/admin/task-prices', {
                        method: 'POST',
                        body: JSON.stringify({
                            platform,
                            taskType: taskName,
                            price: newPrice,
                            status: 'active'
                        })
                    })
                );
            }
            
            try {
                await Promise.all(promises);
                await fetchAllPrices();
                showToast(`All ${platformName} prices adjusted by ₦${adjustment}`, 'success');
            } catch (error) {
                showToast(error.message || 'Failed to bulk adjust', 'error');
            }
            
            showLoading(false);
        }
    );
}

// ==================== RESET PLATFORM ====================
async function resetPlatform(platform) {
    const platformName = PLATFORMS[platform].name;
    
    showConfirmModal(
        'Reset Platform Prices',
        `Reset all ${platformName} prices to ₦0? This will delete all price configurations for this platform.`,
        async () => {
            const inputs = document.querySelectorAll(`input[data-platform="${platform}"]`);
            const promises = [];
            
            showLoading(true);
            
            for (const input of inputs) {
                const priceId = input.dataset.priceId;
                if (priceId) {
                    promises.push(
                        apiRequest(`/api/admin/task-prices/${priceId}`, {
                            method: 'DELETE'
                        })
                    );
                }
            }
            
            try {
                await Promise.all(promises);
                await fetchAllPrices();
                showToast(`All ${platformName} prices reset`, 'success');
            } catch (error) {
                showToast(error.message || 'Failed to reset platform', 'error');
            }
            
            showLoading(false);
        }
    );
}

// ==================== EXPORT PLATFORM ====================
function exportCurrentPlatform(platform) {
    const platformData = allPrices.filter(p => p.platform === platform);
    
    if (platformData.length === 0) {
        showToast('No data to export', 'error');
        return;
    }
    
    showConfirmModal(
        'Export Prices',
        `Export all ${PLATFORMS[platform].name} prices as CSV file?`,
        () => {
            const csv = [
                ['Task Type', 'Price', 'Status'],
                ...platformData.map(p => [p.taskType, p.price, p.status])
            ].map(row => row.join(',')).join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${platform}_prices_${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast(`${PLATFORMS[platform].name} prices exported!`, 'success');
        }
    );
}

// ==================== EXPORT ALL PRICES ====================
function exportPrices() {
    if (allPrices.length === 0) {
        showToast('No data to export', 'error');
        return;
    }
    
    showConfirmModal(
        'Export All Prices',
        `Export all task prices from all platforms as CSV file?`,
        () => {
            const csv = [
                ['Platform', 'Task Type', 'Price', 'Status'],
                ...allPrices.map(p => [p.platform, p.taskType, p.price, p.status])
            ].map(row => row.join(',')).join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `all_prices_${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast('All prices exported successfully!', 'success');
        }
    );
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.dataset.platform;
            switchPlatform(platform);
        });
    });
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
        
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
}

function switchPlatform(platform) {
    currentPlatform = platform;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.platform === platform);
    });
    
    document.querySelectorAll('.price-section').forEach(section => {
        section.classList.toggle('active', section.id === `${platform}-section`);
    });
}

// ==================== THEME TOGGLE ====================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('#themeToggle i');
    
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// ==================== UI HELPERS ====================
function showLoading(show) {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle';
        toastIcon.style.color = 'var(--danger)';
        toast.style.borderLeftColor = 'var(--danger)';
    } else if (type === 'warning') {
        toastIcon.className = 'fas fa-exclamation-triangle';
        toastIcon.style.color = 'var(--warning)';
        toast.style.borderLeftColor = 'var(--warning)';
    } else {
        toastIcon.className = 'fas fa-check-circle';
        toastIcon.style.color = 'var(--success)';
        toast.style.borderLeftColor = 'var(--success)';
    }
    
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ==================== LOGOUT ====================
function logout() {
    showConfirmModal(
        'Logout Confirmation',
        'Are you sure you want to logout from the admin panel?',
        () => {
            localStorage.removeItem('earncial_token');
            window.location.href = '../sign-in.html';
        }
    );
}

// ==================== GLOBAL FUNCTIONS ====================
window.openCreateModal = openCreateModal;
window.closeCreateModal = closeCreateModal;
window.createNewPrice = createNewPrice;
window.editPrice = editPrice;
window.closeEditModal = closeEditModal;
window.updatePrice = updatePrice;
window.saveSingle = saveSingle;
window.saveAllPrices = saveAllPrices;
window.toggleStatus = toggleStatus;
window.deletePrice = deletePrice;
window.bulkAdjust = bulkAdjust;
window.resetPlatform = resetPlatform;
window.exportCurrentPlatform = exportCurrentPlatform;
window.exportPrices = exportPrices;
window.logout = logout;
window.closeConfirmModal = closeConfirmModal;

console.log('🎉 Set Prices JS Loaded Successfully with All Features!');