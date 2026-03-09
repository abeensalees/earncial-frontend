
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
        
        // Check PIN status
        const pinBtn = document.getElementById('changePinBtn');
        if (user.hasPin) {
            pinBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Change Withdrawal';
        } else {
            pinBtn.innerHTML = '<i class="fas fa-lock"></i> Set Withdrawal';
        }
        
        window.currentUser = user;
        
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
    
    if (!newName || newName.length < 2) {
        showToast('Name must be at least 2 characters', 'error', 'Invalid Name');
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

// ================= PIN FUNCTIONS =================
function moveToNextPin(type, pinNumber, event) {
    const input = event.target;
    if (input.value) {
        input.classList.add('filled');
        if (pinNumber < 4) {
            document.getElementById(`${type}Pin${pinNumber + 1}`).focus();
        }
    } else {
        input.classList.remove('filled');
    }
}

function clearPinInputs(type) {
    const types = type === 'all' ? ['current', 'new', 'confirm'] : [type];
    types.forEach(t => {
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`${t}Pin${i}`);
            if (el) {
                el.value = '';
                el.classList.remove('filled');
            }
        }
    });
}

async function changePIN() {
    const user = window.currentUser;
    
    let currentPin = '';
    if (user && user.hasPin) {
        currentPin = ['1', '2', '3', '4'].map(n => document.getElementById(`currentPin${n}`).value).join('');
        if (currentPin.length !== 4) {
            showToast('Please enter current PIN', 'error', 'Current PIN Required');
            return;
        }
    }
    
    const newPin = ['1', '2', '3', '4'].map(n => document.getElementById(`newPin${n}`).value).join('');
    if (newPin.length !== 4) {
        showToast('Please enter new PIN', 'error', 'New PIN Required');
        return;
    }
    
    if (!/^\d{4}$/.test(newPin)) {
        showToast('PIN must be 4 digits', 'error', 'Invalid PIN');
        clearPinInputs('new');
        return;
    }
    
    const confirmPin = ['1', '2', '3', '4'].map(n => document.getElementById(`confirmPin${n}`).value).join('');
    if (confirmPin.length !== 4) {
        showToast('Please confirm PIN', 'error', 'Confirm PIN Required');
        return;
    }
    
    if (newPin !== confirmPin) {
        showToast('PINs do not match', 'error', 'PIN Mismatch');
        clearPinInputs('confirm');
        return;
    }
    
    try {
        const endpoint = user && user.hasPin ? '/api/auth/change-pin' : '/api/auth/set-pin';
        const body = user && user.hasPin ? { currentPin, newPin } : { pin: newPin };
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        clearPinInputs('all');
        document.getElementById('changePinBtn').innerHTML = '<i class="fas fa-sync-alt"></i> Change Withdrawal';
        
        if (window.currentUser) {
            window.currentUser.hasPin = true;
        }
        
        showModal('pinSuccessModal');
        showToast(user && user.hasPin ? 'PIN changed successfully' : 'PIN set successfully', 'success', 'PIN Updated');
        
    } catch (error) {
        console.error('❌ Error:', error);
        showToast(error.message || 'Failed to update PIN', 'error', 'Update Failed');
    }
}

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
    if (confirm('Are you sure you want to logout?')) {
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
window.changePIN = changePIN;
window.moveToNextPin = moveToNextPin;
window.showModal = showModal;
window.closeModal = closeModal;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.logout = logout;