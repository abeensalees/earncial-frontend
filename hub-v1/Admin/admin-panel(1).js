
// ================================================
// CONTENT MANAGEMENT - ADMIN PANEL
// ================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

let currentSection = 'dashboard';
let currentTheme = 'light';
let currentDeposit = null;
let editingWallet = null;

// ================= CHECK TOKEN =================
if (!token) {
    console.warn('No authentication token found');
    window.location.href = 'admin-login.html';
}

// ================= DOM READY =================
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadDashboardStats();
    loadExistingContent();
    setupAutoPreview();
});

// ================= SIDEBAR =================
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ================= THEME TOGGLE =================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('adminTheme', isDark ? 'dark' : 'light');
    document.getElementById('themeIcon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

// ================= SECTION NAVIGATION =================
function showSection(section) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.style.display = 'none');
    
    document.getElementById(section + '-section').style.display = 'block';
    
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    
    const activeItem = Array.from(menuItems).find(item => 
        item.textContent.toLowerCase().includes(section)
    );
    if (activeItem) activeItem.classList.add('active');
    
    currentSection = section;
    closeSidebar();
}

// ================= IMAGE PREVIEW =================
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.add('show');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ================= HTML PREVIEW =================
function updatePreview(contentId, previewId) {
    const content = document.getElementById(contentId).value;
    const preview = document.getElementById(previewId);
    preview.innerHTML = content;
}

function setupAutoPreview() {
    const contentFields = [
        { contentId: 'announcement1Content', previewId: 'announcement1Preview' },
        { contentId: 'announcement2Content', previewId: 'announcement2ContentPreview' },
        { contentId: 'sponsoredFullDesc', previewId: 'sponsoredDescPreview' }
    ];
    
    contentFields.forEach(({ contentId, previewId }) => {
        const field = document.getElementById(contentId);
        if (field) {
            field.addEventListener('input', () => {
                updatePreview(contentId, previewId);
            });
        }
    });
}

// ================= POLL OPTIONS =================
function addPollOption() {
    const container = document.getElementById('pollOptionsContainer');
    const optionCount = container.children.length + 1;
    const newOption = document.createElement('div');
    newOption.className = 'poll-option-item';
    newOption.innerHTML = `
        <input type="text" placeholder="Option ${optionCount}" class="poll-option-input">
        <i class="fas fa-times remove-option" onclick="removeOption(this)"></i>
    `;
    container.appendChild(newOption);
}

function removeOption(element) {
    const container = document.getElementById('pollOptionsContainer');
    if (container.children.length > 2) {
        element.closest('.poll-option-item').remove();
    } else {
        showToast('You must have at least 2 options!', 'error');
    }
}

// ================= FILE TO BASE64 =================
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ================= API HELPER =================
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        if (body) options.body = JSON.stringify(body);
        
        const res = await fetch(`${API_URL}${endpoint}`, options);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Request failed');
        
        return data;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

// ================= LOAD DASHBOARD STATS =================
async function loadDashboardStats() {
    try {
        const data = await apiCall('/api/admin/stats');
        
        if (document.getElementById('activeSponsoreds')) {
            document.getElementById('activeSponsoreds').textContent = data.activeSponsored || 0;
        }
        if (document.getElementById('activeModals')) {
            document.getElementById('activeModals').textContent = data.activeModals || 0;
        }
        if (document.getElementById('activePolls')) {
            document.getElementById('activePolls').textContent = data.activePolls || 0;
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

// ================= SAVE ANNOUNCEMENT =================
async function saveAnnouncement(number) {
    try {
        const data = {
            active: document.getElementById(`announcement${number}Active`).checked,
            title: document.getElementById(`announcement${number}Title`).value,
            content: document.getElementById(`announcement${number}Content`).value,
        };
        
        if (number === 2) {
            data.icon = document.getElementById('announcement2Icon').value;
            
            const imageInput = document.getElementById('announcement2Image');
            if (imageInput.files && imageInput.files[0]) {
                data.image = await fileToBase64(imageInput.files[0]);
            }
        }
        
        const result = await apiCall(`/api/admin/announcements/${number}`, 'POST', data);
        
        showToast(result.message || 'Announcement saved successfully', 'success');
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error saving announcement', 'error');
    }
}

// ================= SAVE ADMIN MESSAGE =================
async function saveAdminMessage() {
    try {
        const data = {
            active: document.getElementById('adminMessageActive').checked,
            type: document.getElementById('adminMessageType').value,
            icon: document.getElementById('adminMessageIcon').value,
            title: document.getElementById('adminMessageTitle').value,
            text: document.getElementById('adminMessageText').value,
        };
        
        const result = await apiCall('/api/admin/admin-message', 'POST', data);
        
        showToast(result.message || 'Message saved successfully', 'success');
    } catch (err) {
        showToast(err.message || 'Error saving message', 'error');
    }
}

// ================= SAVE POLL =================
async function savePoll() {
    try {
        const options = Array.from(document.querySelectorAll('.poll-option-input'))
            .map(input => input.value)
            .filter(val => val.trim() !== '');
        
        if (options.length < 2) {
            showToast('Please add at least 2 options!', 'error');
            return;
        }
        
        const data = {
            active: document.getElementById('pollActive').checked,
            pollId: document.getElementById('pollId').value,
            question: document.getElementById('pollQuestion').value,
            options: options,
            endTime: document.getElementById('pollEndTime').value,
        };
        
        const result = await apiCall('/api/admin/polls', 'POST', data);
        
        showToast(result.message || 'Poll saved successfully', 'success');
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error saving poll', 'error');
    }
}

// ================= SAVE SPONSORED =================
async function saveSponsored() {
    try {
        const data = {
            active: document.getElementById('sponsoredActive').checked,
            label: document.getElementById('sponsoredLabel').value,
            title: document.getElementById('sponsoredTitle').value,
            price: document.getElementById('sponsoredPrice').value,
            shortDescription: document.getElementById('sponsoredShortDesc').value,
            fullDescription: document.getElementById('sponsoredFullDesc').value,
            url: document.getElementById('sponsoredURL').value,
        };
        
        const thumbInput = document.getElementById('sponsoredThumb');
        if (thumbInput.files && thumbInput.files[0]) {
            data.thumbnail = await fileToBase64(thumbInput.files[0]);
        }
        
        const imagesInput = document.getElementById('sponsoredImages');
        if (imagesInput.files && imagesInput.files.length > 0) {
            const imagesPromises = Array.from(imagesInput.files).map(file => fileToBase64(file));
            data.images = await Promise.all(imagesPromises);
        }
        
        const result = await apiCall('/api/admin/sponsored', 'POST', data);
        
        showToast(result.message || 'Sponsored content saved successfully', 'success');
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error saving sponsored content', 'error');
    }
}

// ================= SAVE SETTINGS =================
async function saveSettings() {
    try {
        const data = {
            activationFee: document.getElementById('activationFee').value,
            earnerBonus: document.getElementById('earnerBonus').value,
            advertiserBonus: document.getElementById('advertiserBonus').value,
            referralGoal: document.getElementById('referralGoal').value,
        };
        
        const result = await apiCall('/api/admin/settings', 'POST', data);
        
        showToast(result.message || 'Settings saved successfully', 'success');
    } catch (err) {
        showToast(err.message || 'Error saving settings', 'error');
    }
}

// ================= LOAD EXISTING CONTENT =================
async function loadExistingContent() {
    try {
        // Load Announcements
        const announcements = await apiCall('/api/admin/announcements');
        
        if (announcements.announcement1) {
            document.getElementById('announcement1Active').checked = announcements.announcement1.active || false;
            document.getElementById('announcement1Title').value = announcements.announcement1.title || '';
            document.getElementById('announcement1Content').value = announcements.announcement1.content || '';
        }
        
        if (announcements.announcement2) {
            document.getElementById('announcement2Active').checked = announcements.announcement2.active || false;
            document.getElementById('announcement2Title').value = announcements.announcement2.title || '';
            document.getElementById('announcement2Icon').value = announcements.announcement2.icon || '';
            document.getElementById('announcement2Content').value = announcements.announcement2.content || '';
        }
        
        // Load Admin Message
        const adminMessage = await apiCall('/api/admin/admin-message');
        
        if (adminMessage) {
            document.getElementById('adminMessageActive').checked = adminMessage.active || false;
            document.getElementById('adminMessageType').value = adminMessage.messageType || '';
            document.getElementById('adminMessageIcon').value = adminMessage.icon || '';
            document.getElementById('adminMessageTitle').value = adminMessage.title || '';
            document.getElementById('adminMessageText').value = adminMessage.text || '';
        }
        
        // Load Poll
        const poll = await apiCall('/api/admin/polls/active');
        
        if (poll && poll.pollId) {
            document.getElementById('pollActive').checked = poll.active || false;
            document.getElementById('pollId').value = poll.pollId || '';
            document.getElementById('pollQuestion').value = poll.question || '';
            document.getElementById('pollEndTime').value = poll.endTime || '';
            
            const container = document.getElementById('pollOptionsContainer');
            container.innerHTML = '';
            if (poll.options && poll.options.length > 0) {
                poll.options.forEach((option, index) => {
                    const optionDiv = document.createElement('div');
                    optionDiv.className = 'poll-option-item';
                    optionDiv.innerHTML = `
                        <input type="text" placeholder="Option ${index + 1}" class="poll-option-input" value="${option.text}">
                        <i class="fas fa-times remove-option" onclick="removeOption(this)"></i>
                    `;
                    container.appendChild(optionDiv);
                });
            }
        }
        
        // Load Sponsored
        const sponsored = await apiCall('/api/admin/sponsored/active');
        
        if (sponsored && sponsored.title) {
            document.getElementById('sponsoredActive').checked = sponsored.active || false;
            document.getElementById('sponsoredLabel').value = sponsored.label || 'SPONSORED';
            document.getElementById('sponsoredTitle').value = sponsored.title || '';
            document.getElementById('sponsoredPrice').value = sponsored.price || '';
            document.getElementById('sponsoredShortDesc').value = sponsored.shortDescription || '';
            document.getElementById('sponsoredFullDesc').value = sponsored.fullDescription || '';
            document.getElementById('sponsoredURL').value = sponsored.url || '';
        }
        
        // Load Settings
        const settings = await apiCall('/api/admin/settings');
        
        if (settings) {
            document.getElementById('activationFee').value = settings.activationFee || 1000;
            document.getElementById('earnerBonus').value = settings.earnerBonus || 500;
            document.getElementById('advertiserBonus').value = settings.advertiserBonus || 5;
            document.getElementById('referralGoal').value = settings.referralGoal || 100;
        }
        
    } catch (err) {
        console.error('Error loading existing content:', err);
    }
}

// ================= TOAST NOTIFICATIONS =================
function showToast(msg, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;';
    document.body.appendChild(container);
    return container;
}

// ================= SUCCESS MESSAGE =================
function showSuccess(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
        message.classList.add('show');
        setTimeout(() => message.classList.remove('show'), 3000);
    }
}

// ================= LOGOUT =================
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('earncial_token');
        localStorage.removeItem('admin_token');
        window.location.href = 'admin-login.html';
    }
}

// ================= SIDEBAR TOGGLE FOR MOBILE =================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    }
}

// Export
window.toggleSidebar = toggleSidebar;


function toggleSidebars() {
    const sidebars = document.getElementById('sidebars');
    const overlays = document.getElementById('sidebarOverlays');
    
    if (sidebars.classList.contains('active')) {
        sidebars.classList.remove('active');
        overlays.classList.remove('active');
    } else {
        sidebars.classList.add('active');
        overlays.classList.add('active');
    }
}

// Export
window.toggleSidebars = toggleSidebars;

// ================= EXPORTS =================
window.showSection = showSection;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.previewImage = previewImage;
window.updatePreview = updatePreview;
window.addPollOption = addPollOption;
window.removeOption = removeOption;
window.saveAnnouncement = saveAnnouncement;
window.saveAdminMessage = saveAdminMessage;
window.savePoll = savePoll;
window.saveSponsored = saveSponsored;
window.saveSettings = saveSettings;
window.logout = logout;