// ================================================
// EARNCIAL SIGN UP - COMPLETE JAVASCRIPT
// ================================================

// ============ CONSTANTS ============
const API_URL = 'http://localhost:5000'; // Ka canza bayan deployment

// ============ DOM ELEMENTS ============
const body = document.getElementById('body');
const darkModeToggle = document.getElementById('darkModeToggle');
const themeIcon = darkModeToggle.querySelector('i');
const menuToggle = document.getElementById('menuToggle');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const signupForm = document.getElementById('signupForm');
const togglePassword = document.getElementById('togglePassword');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const goToDashboardBtn = document.getElementById('goToDashboard');
const closeSuccessModalBtn = document.getElementById('closeSuccessModal');
const closeErrorModalBtn = document.getElementById('closeErrorModal');
const errorMessageContent = document.getElementById('errorMessageContent');
const submitBtn = signupForm.querySelector('button[type="submit"]');

// Password strength elements
const strengthBar = document.getElementById('strengthBar');
const strengthTextEl = document.getElementById('strengthText');

// ============ GLOBAL FLAGS ============
let isSubmitting = false;
let formModified = false;

// ============ SIDEBAR — DESKTOP FIXED / MOBILE TOGGLE ============
function isMobile() {
    return window.innerWidth <= 768;
}

function openSidebar() {
    sidebar.classList.add('open');
    if (isMobile()) {
        mobileOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebarFunc() {
    if (isMobile()) {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    // Desktop: ba a rufe sidebar
}

function handleSidebarOnResize() {
    if (!isMobile()) {
        // Desktop: sidebar ta kasance fixed open
        sidebar.classList.add('open');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        // Mobile: rufe sidebar ta default
        sidebar.classList.remove('open');
    }
}

menuToggle.addEventListener('click', () => {
    if (sidebar.classList.contains('open') && isMobile()) {
        closeSidebarFunc();
    } else {
        openSidebar();
    }
});

closeSidebarBtn.addEventListener('click', () => {
    if (isMobile()) closeSidebarFunc();
});

mobileOverlay.addEventListener('click', closeSidebarFunc);

window.addEventListener('resize', handleSidebarOnResize);

// ============ DARK MODE ============
function toggleDarkMode() {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    if (isDark) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

// ============ DOM CONTENT LOADED ============
document.addEventListener('DOMContentLoaded', () => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Desktop sidebar: nuna ta atomatik
    handleSidebarOnResize();

    // URL Referral Logic
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const referredByInput = document.getElementById('referredBy');
    if (refCode && referredByInput) {
        referredByInput.value = refCode;
        referredByInput.readOnly = true;
        referredByInput.style.backgroundColor = 'rgba(0, 170, 255, 0.1)';
        referredByInput.style.cursor = 'not-allowed';
    }
});

// ============ PASSWORD TOGGLE ============
function togglePasswordVisibility(input, toggleBtn) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    const icon = toggleBtn.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
}

togglePassword.addEventListener('click', () => togglePasswordVisibility(passwordInput, togglePassword));
toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword));

// ============ PASSWORD STRENGTH ============
function getPasswordStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0–6
}

function updateStrengthBar() {
    const pwd = passwordInput.value;
    const labelEl = strengthTextEl.querySelector('.label');

    if (!pwd) {
        strengthBar.style.width = '0%';
        strengthBar.className = 'strength-bar-fill';
        strengthTextEl.className = 'strength-text';
        if (labelEl) labelEl.textContent = 'Enter password';
        return;
    }

    const score = getPasswordStrength(pwd);
    let level, percent, label;

    if (score <= 2) {
        level = 'weak'; percent = '33%'; label = 'Weak';
    } else if (score <= 4) {
        level = 'medium'; percent = '66%'; label = 'Medium';
    } else {
        level = 'strong'; percent = '100%'; label = 'Strong';
    }

    strengthBar.style.width = percent;
    strengthBar.className = 'strength-bar-fill ' + level;
    strengthTextEl.className = 'strength-text ' + level;
    if (labelEl) labelEl.textContent = label;
}

passwordInput.addEventListener('input', updateStrengthBar);

// ============ LOADING STATE ============
function setLoading(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    } else {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
}

// ============ VALIDATION HELPERS ============
function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (!input || !error) return;
    input.classList.add('error');
    input.classList.remove('success');
    error.textContent = message;
    error.classList.add('show');
}

function showSuccess(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const error = document.getElementById(inputId + 'Error');
    input.classList.remove('error');
    input.classList.add('success');
    if (error) error.classList.remove('show');
}

/*/ ============ FIELD VALIDATORS ============
function validateFullName() {
    const val = document.getElementById('fullName').value.trim();
    if (!val) { showError('fullName', 'fullNameError', 'Full name is required'); return false; }
    if (val.length < 6) { showError('fullName', 'fullNameError', 'Name is too short'); return false; }
    showSuccess('fullName'); return true;
}


function validateUsername() {
    let val = document.getElementById('username').value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');
    
    document.getElementById('username').value = val;
    
    const regex = /^[a-z][a-z0-9]{2,19}$/;
    
    const reservedUsernames = [
        "admin",
        "support",
        "owner",
        "moderator",
        "system",
        "root",
        "about",
        "contact",
        "help",
        "api",
        "earncial",
        "earncialofficial"
    ];
    
    if (!val) {
        showError('username', 'usernameError', 'Username is required');
        return false;
    }
    
    if (!regex.test(val)) {
        showError(
            'username',
            'usernameError',
            'Username must be 3-20 characters, start with a letter, and contain only lowercase letters and numbers'
        );
        return false;
    }
    
    // Block reserved exact names
    if (reservedUsernames.includes(val)) {
        showError(
            'username',
            'usernameError',
            'This username is not allowed'
        );
        return false;
    }
    
    // Block anything containing earncial
    if (val.includes("earncial")) {
        showError(
            'username',
            'usernameError',
            'Username cannot contain platform name'
        );
        return false;
    }
    
    showSuccess('username');
    return true;
}

function validateEmail() {
    const val = document.getElementById('email').value.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) { showError('email', 'emailError', 'Email is required'); return false; }
    if (!regex.test(val)) { showError('email', 'emailError', 'Please enter a valid email address'); return false; }
    showSuccess('email'); return true;
}

function validatePhone() {
    const val = document.getElementById('phone').value.trim();
    const regex = /^[0-9\+\-\s]{10,15}$/;
    if (!val) { showError('phone', 'phoneError', 'Phone number is required'); return false; }
    if (!regex.test(val)) { showError('phone', 'phoneError', 'Please enter a valid phone number'); return false; }
    showSuccess('phone'); return true;
}*/

// ============ FIELD VALIDATORS ============

function validateFullName() {
    const val = document.getElementById('fullName').value.trim();
    if (!val) { showError('fullName', 'fullNameError', 'Full name is required'); return false; }
    if (val.length < 6) { showError('fullName', 'fullNameError', 'Name is too short'); return false; }
    showSuccess('fullName'); return true;
}

function validateUsername() {
    let val = document.getElementById('username').value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '');

    document.getElementById('username').value = val;

    const regex = /^[a-z][a-z0-9._]{2,19}$/;

    const reservedUsernames = [
        "admin", "username", "support", "owner", "moderator", "system",
        "root", "about", "contact", "help", "api",
        "earncial", "earncialofficial", "superadmin", "staff",
        "official", "verify", "security", "billing", "payment",
        "withdraw", "deposit", "null", "undefined", "test",
        "noreply", "no-reply", "info", "hello", "team",
        "careers", "jobs", "press", "media", "legal",
        "privacy", "terms", "cookies", "dashboard", "login",
        "signup", "signin", "register", "account", "profile",
        "settings", "notification", "notifications", "mail",
        "email", "password", "reset", "ban", "banned",
        "delete", "deleted", "suspended", "anonymous", "guest"
    ];

    if (!val) {
        showError('username', 'usernameError', 'Username is required');
        return false;
    }

    if (!regex.test(val)) {
        showError('username', 'usernameError',
            'Username must be 3-20 characters, start with a letter, and contain only lowercase letters, numbers, dots or underscores');
        return false;
    }

    // No consecutive dots or underscores
    if (/[._]{2,}/.test(val)) {
        showError('username', 'usernameError', 'No consecutive dots or underscores allowed');
        return false;
    }

    // Cannot end with . or _
    if (/[._]$/.test(val)) {
        showError('username', 'usernameError', 'Username cannot end with a dot or underscore');
        return false;
    }

    // Block reserved names
    if (reservedUsernames.includes(val)) {
        showError('username', 'usernameError', 'This username is not allowed');
        return false;
    }

    // Block anything containing earncial
    if (val.includes('earncial')) {
        showError('username', 'usernameError', 'Username cannot contain platform name');
        return false;
    }

    showSuccess('username');
    return true;
}

function validateEmail() {
    // Auto lowercase
    const input = document.getElementById('email');
    input.value = input.value.trim().toLowerCase();
    const val = input.value;

    // Basic format check
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val) { showError('email', 'emailError', 'Email is required'); return false; }
    if (!regex.test(val)) { showError('email', 'emailError', 'Please enter a valid email address'); return false; }

    // Must have valid TLD (.com .net .org etc — no weird endings)
    const validTLD = /\.(com|ng|com.ng|net|org|io|co|edu|gov|me|app|dev|ng|uk|us|ca|au|de|fr|jp|br|in|info|biz)$/i;
    if (!validTLD.test(val)) {
        showError('email', 'emailError', 'Please use a valid email ending e.g. .com, .net, .org');
        return false;
    }

    // Allowed providers only
    const allowedProviders = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
        'icloud.com', 'protonmail.com', 'proton.me', 'live.com',
        'me.com', 'ymail.com', 'googlemail.com'
    ];
    const domain = val.split('@')[1];
    if (!allowedProviders.includes(domain)) {
        showError('email', 'emailError', 'Please use a supported email provider (Gmail, Yahoo, Outlook, etc.)');
        return false;
    }

 // Block our own domain
    const blockedDomains = ['earncial.com', 'earncial.ng', 'earncial.com.ng', 'earncial.co', 'earncial.org'];
    if (blockedDomains.includes(domain)) {
        showError('email', 'emailError', 'You cannot register with an Earncial email address');
        return false;
    }
    
    showSuccess('email');
    return true;
}

function validatePhone() {
    const val = document.getElementById('phone').value.trim();
    const regex = /^[0-9\+\-\s]{10,15}$/;
    if (!val) { showError('phone', 'phoneError', 'Phone number is required'); return false; }
    if (!regex.test(val)) { showError('phone', 'phoneError', 'Please enter a valid phone number'); return false; }
    showSuccess('phone'); return true;
}

// Referral — auto lowercase (matches username format)
const referredByInput = document.getElementById('referredBy');
if (referredByInput) {
    referredByInput.addEventListener('input', () => {
        referredByInput.value = referredByInput.value.trim().toLowerCase().replace(/\s+/g, '');
    });
}
// ===== GENDER VALIDATION (Radio Buttons) =====
function validateGender() {
    const selected = document.querySelector('input[name="gender"]:checked');
    const errorEl = document.getElementById('genderError');
    if (!selected) {
        if (errorEl) { errorEl.textContent = 'Please select your gender'; errorEl.classList.add('show'); }
        return false;
    }
    if (errorEl) errorEl.classList.remove('show');
    return true;
}

function validateCountry() {
    const val = document.getElementById('country').value;
    if (!val) { showError('country', 'countryError', 'Please select your country'); return false; }
    showSuccess('country'); return true;
}

function validateAccountType() {
    const val = document.getElementById('accountType').value;
    if (!val) { showError('accountType', 'accountTypeError', 'Please select account type'); return false; }
    showSuccess('accountType'); return true;
}

function validatePassword() {
    const val = document.getElementById('password').value;
    if (!val) { showError('password', 'passwordError', 'Password is required'); return false; }
    if (val.length < 8) { showError('password', 'passwordError', 'Password must be at least 8 characters'); return false; }
    showSuccess('password'); return true;
}

function validateConfirmPassword() {
    const pw = document.getElementById('password').value;
    const cpw = document.getElementById('confirmPassword').value;
    if (!cpw) { showError('confirmPassword', 'confirmPasswordError', 'Please confirm your password'); return false; }
    if (pw !== cpw) { showError('confirmPassword', 'confirmPasswordError', 'Passwords do not match'); return false; }
    showSuccess('confirmPassword'); return true;
}

function validateTerms() {
    const terms = document.getElementById('terms');
    if (!terms.checked) {
        showErrorModal('You must agree to the Terms of Service and Privacy Policy to continue.');
        return false;
    }
    return true;
}

// ============ REAL-TIME VALIDATION ============
document.getElementById('fullName').addEventListener('blur', validateFullName);
document.getElementById('username').addEventListener('blur', validateUsername);
document.getElementById('email').addEventListener('blur', validateEmail);
document.getElementById('phone').addEventListener('blur', validatePhone);
document.getElementById('country').addEventListener('change', validateCountry);
document.getElementById('accountType').addEventListener('change', validateAccountType);
document.getElementById('password').addEventListener('blur', validatePassword);
document.getElementById('confirmPassword').addEventListener('blur', validateConfirmPassword);

// Gender radio real-time
document.querySelectorAll('input[name="gender"]').forEach(radio => {
    radio.addEventListener('change', validateGender);
});

// Revalidate confirm password when password changes
document.getElementById('password').addEventListener('input', () => {
    if (document.getElementById('confirmPassword').value) validateConfirmPassword();
});

// ============ ACCOUNT TYPE INFO MODAL ============
const infoIcon = document.getElementById('typeInfor');
const accountTypeModal = document.getElementById('accountTypeModal');

if (infoIcon) {
    infoIcon.addEventListener('click', () => accountTypeModal.classList.add('active'));
}

function closeAccountTypeModal() {
    accountTypeModal.classList.remove('active');
}

// ============ MODAL HELPERS ============
function showErrorModal(message) {
    errorMessageContent.textContent = message;
    errorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

goToDashboardBtn.addEventListener('click', () => {
    closeModal(successModal);
    window.location.href = 'sign-in.html';
});

closeSuccessModalBtn.addEventListener('click', () => {
    closeModal(successModal);
    window.location.href = 'sign-in.html';
});

closeErrorModalBtn.addEventListener('click', () => closeModal(errorModal));

[successModal, errorModal, accountTypeModal].forEach(modal => {
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal(modal);
    });
});

// ============ FORM SUBMISSION ============
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate all fields
    const checks = [
        validateFullName(),
        validateUsername(),
        validateEmail(),
        validatePhone(),
        validateGender(),       // ✅ Gender radio validation
        validateCountry(),
        validateAccountType(),
        validatePassword(),
        validateConfirmPassword(),
        validateTerms()
    ];

    if (checks.includes(false)) return;

    isSubmitting = true;
    setLoading(true);

    // Get gender value
    const selectedGender = document.querySelector('input[name="gender"]:checked');

    const userData = {
        fullName:    document.getElementById('fullName').value.trim(),
        username:    document.getElementById('username').value.trim(),
        email:       document.getElementById('email').value.trim(),
        phone:       document.getElementById('phone').value.trim(),
        gender:      selectedGender ? selectedGender.value : '',
        country:     document.getElementById('country').value,
        referredBy:  document.getElementById('referredBy').value.trim() || undefined,
        accountType: document.getElementById('accountType').value,
        password:    document.getElementById('password').value
    };

    try {
        const response = await fetch(`${API_URL}/api/auth/sign-up`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        setLoading(false);
        isSubmitting = false;

        if (response.ok && result.success) {
            const userEmail = userData.email;

            // Update success modal content
            const successTitle = successModal.querySelector('h2');
            const successText  = successModal.querySelector('p');
            if (successTitle) successTitle.innerText = 'Check Your Email!';
            if (successText)  successText.innerHTML  = `Welcome <b>${userData.username}</b>!<br><br>We've sent a verification link to <b>${userEmail}</b>. Please verify your email address.`;

            goToDashboardBtn.innerText = 'Verify Email Now';
            goToDashboardBtn.onclick = () => {
                window.location.href = `verify-email.html?email=${encodeURIComponent(userEmail)}`;
            };

            formModified = false;
            successModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            signupForm.reset();

            // Reset strength bar after form reset
            strengthBar.style.width = '0%';
            strengthBar.className = 'strength-bar-fill';
            strengthTextEl.className = 'strength-text';
            const labelEl = strengthTextEl.querySelector('.label');
            if (labelEl) labelEl.textContent = 'Enter password';

        } else {
            showErrorModal(result.message || 'Registration failed. Please check your details and try again.');
        }

    } catch (err) {
        setLoading(false);
        isSubmitting = false;
        console.error('Registration error:', err);
        showErrorModal('Cannot connect to server. Please check your internet connection and try again.');
    }
});

// ============ FORM MODIFICATION TRACKING ============
signupForm.addEventListener('input', () => { formModified = true; });

// ============ PREVENT ACCIDENTAL PAGE LEAVE ============
window.addEventListener('beforeunload', (e) => {
    if (formModified && !successModal.classList.contains('active')) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ============ INIT ============
console.log('🚀 Earncial Sign Up - Ready!');
console.log('📍 API URL:', API_URL);