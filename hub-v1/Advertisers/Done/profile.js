
// ================= API CONFIG =================
// ✅ BA localhost BA - Ready for deployment!
const API_URL = 'http://localhost:5000'; // Change to https://api.earncial.com for production

// ================= GET USER TOKEN =================
function getToken() {
    return localStorage.getItem('earncial_token');
}

// ================= CHECK AUTH =================
function checkAuth() {
    const token = getToken();
    const userData = localStorage.getItem('earncial_user');
    
    if (!token || !userData) {
        window.location.href = 'sign-in.html';
        return false;
    }
    
    try {
        window.currentUser = JSON.parse(userData);
        return true;
    } catch (e) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
        return false;
    }
}

// ================= LOAD USER DATA =================
async function loadUserData() {
    if (!checkAuth()) return;
    
    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        const user = data.user;
        
        // Update UI
        document.getElementById('fullNameValue').innerHTML = `${user.fullName} <i class="fas fa-pencil-alt edit-icon"></i>`;
        document.getElementById('fullNameInput').value = user.fullName;
        document.getElementById('username').textContent = user.username;
        document.getElementById('email').textContent = user.email;
        document.getElementById('phoneNumber').textContent = user.phone;
        document.getElementById('country').textContent = user.country;
        console.log("Referred By:", user.referredBy);
        // Format date
        const createdDate = new Date(user.createdAt);
        document.getElementById('createdAt').textContent = createdDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
        
        // PIN logic removed - advertiser doesn't need withdrawal PIN
        
        window.currentUser = user;
        
        // Update profile header and status
        updateProfileHeader();
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast('Failed to load profile', 'error', 'Error');
        
        if (error.message.includes('token') || error.message.includes('Unauthorized')) {
            localStorage.removeItem('earncial_token');
            localStorage.removeItem('earncial_user');
            window.location.href = 'sign-in.html';
        }
    }
}

// ================= NAME EDIT FUNCTIONS =================
function editFullName() {
    document.getElementById('fullNameValue').style.display = 'none';
    document.getElementById('nameEditForm').style.display = 'block';
    document.getElementById('fullNameInput').focus();
}

function cancelEditFullName() {
    document.getElementById('nameEditForm').style.display = 'none';
    document.getElementById('fullNameValue').style.display = 'flex';
}

async function saveFullName() {
    const newName = document.getElementById('fullNameInput').value.trim();
    
    if (!newName || newName.length < 8) {
        showToast('Name must be at least 8 characters', 'error', 'Invalid Name');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/auth/update-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ fullName: newName })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        document.getElementById('fullNameValue').innerHTML = `${newName} <i class="fas fa-pencil-alt edit-icon"></i>`;
        cancelEditFullName();
        showToast('Name updated successfully', 'success', 'Profile Updated');
        
        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('earncial_user'));
        userData.fullName = newName;
        localStorage.setItem('earncial_user', JSON.stringify(userData));
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast(error.message || 'Failed to update name', 'error', 'Update Failed');
    }
}

// ================= PASSWORD VALIDATION =================
function validatePassword(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    updateRequirementUI(document.getElementById('reqLength'), requirements.length);
    updateRequirementUI(document.getElementById('reqUppercase'), requirements.uppercase);
    updateRequirementUI(document.getElementById('reqLowercase'), requirements.lowercase);
    updateRequirementUI(document.getElementById('reqNumber'), requirements.number);
    updateRequirementUI(document.getElementById('reqSpecial'), requirements.special);
    
    return Object.values(requirements).every(req => req === true);
}

function updateRequirementUI(element, met) {
    if (!element) return;
    const text = element.textContent.replace('✓', '').replace('•', '').trim();
    if (met) {
        element.classList.add('met');
        element.innerHTML = '<i class="fas fa-check-circle"></i> ' + text;
    } else {
        element.classList.remove('met');
        element.innerHTML = '<i class="fas fa-circle"></i> ' + text;
    }
}

function resetRequirementsUI() {
    ['reqLength', 'reqUppercase', 'reqLowercase', 'reqNumber', 'reqSpecial'].forEach(id => {
        const el = document.getElementById(id);
        if (el) updateRequirementUI(el, false);
    });
}

// ================= CHANGE PASSWORD =================
async function changePassword() {
    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    
    if (!currentPass) {
        showToast('Please enter current password', 'error', 'Current Password Required');
        return;
    }
    
    if (!newPass) {
        showToast('Please enter new password', 'error', 'New Password Required');
        return;
    }
    
    if (!validatePassword(newPass)) {
        showToast('Password does not meet requirements', 'error', 'Password Requirements');
        return;
    }
    
    if (newPass !== confirmPass) {
        showToast('Passwords do not match', 'error', 'Password Mismatch');
        return;
    }
    
    if (newPass === currentPass) {
        showToast('New password cannot be same as current', 'error', 'Password Same');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                currentPassword: currentPass,
                newPassword: newPass
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        resetRequirementsUI();
        
        showToast('Password changed successfully', 'success', 'Password Updated');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast(error.message || 'Failed to change password', 'error', 'Update Failed');
    }
}

// PIN functions removed - advertiser account

// ================= UI FUNCTIONS =================
function showToast(message, type = 'info', title = '') {
    const container = document.getElementById('toastContainer');
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="${icons[type]}"></i></div>
        <div class="toast-content">
            ${title ? `<strong>${title}</strong>` : ''}
            <p>${message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function showModal(id) {
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = 'auto';
}

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

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function logout() {
    // confirm removed - direct action
{
        localStorage.removeItem('earncial_token');
        localStorage.removeItem('earncial_user');
        window.location.href = 'sign-in.html';
    }
}

// ================= INIT =================
window.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    loadUserData();
    
    // Load theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
    
    // Password validation
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', (e) => {
            validatePassword(e.target.value);
        });
    }
    
    setTimeout(() => {
        showToast('Update your profile settings', 'info', 'Profile Settings');
    }, 1000);
});

// Make functions global
window.editFullName = editFullName;
window.cancelEditFullName = cancelEditFullName;
window.saveFullName = saveFullName;
window.changePassword = changePassword;
window.showModal = showModal;
window.closeModal = closeModal;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.logout = logout;

// ================= UPDATE PROFILE HEADER & STATUS =================
function updateProfileHeader() {
    const user = window.currentUser;
    if (!user) return;
    
    // Update profile header name
    const profileName = document.getElementById('profileFullName');
    if (profileName) {
        profileName.textContent = user.fullName || user.username || 'User';
    }
    
    // Update status badge
    const statusBadge = document.getElementById('accountStatusBadge');
    if (statusBadge) {
        // Check isActivated field (backend uses this)
        if (user.isActivated === true) {
            statusBadge.className = 'status-badge activated';
            statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Activated';
        } else {
            statusBadge.className = 'status-badge inactive';
            statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Not Activated';
        }
    }
}

// Call after loading user data


// ================= EVENT LISTENERS  =================
document.addEventListener('DOMContentLoaded', function() {
    
    // Logout button in sidebar
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            document.getElementById('logoutModal')?.classList.add('active');
        });
    }
    
    // Menu toggle (mobile)
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            sidebar?.classList.toggle('active');
            overlay?.classList.toggle('active');
        });
    }
    
    // Sidebar overlay close
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            document.getElementById('sidebar')?.classList.remove('active');
            this.classList.remove('active');
        });
    }
    
    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    // Logout modal buttons
    const cancelLogout = document.querySelector('[data-action="cancel-logout"]');
    if (cancelLogout) {
        cancelLogout.addEventListener('click', function() {
            document.getElementById('logoutModal')?.classList.remove('active');
        });
    }
    
    const confirmLogout = document.querySelector('[data-action="confirm-logout"]');
    if (confirmLogout) {
        confirmLogout.addEventListener('click', function() {
            localStorage.clear();
            window.location.href = 'sign-in.html';
        });
    }
    
    // Back button
    const backBtn = document.querySelector('[data-href]');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = this.getAttribute('data-href');
        });
    }
    
    // Edit name buttons
    const editNameBtn = document.getElementById('editFullNameBtn');
    if (editNameBtn) {
        editNameBtn.addEventListener('click', editFullName);
    }
    
    const cancelNameBtn = document.getElementById('cancelEditNameBtn');
    if (cancelNameBtn) {
        cancelNameBtn.addEventListener('click', cancelEditFullName);
    }
    
    const saveNameBtn = document.getElementById('saveFullNameBtn');
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', saveFullName);
    }
    
    // Modal triggers
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            showModal(modalId);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
});
