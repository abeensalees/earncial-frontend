// ================================================
// EARNCIAL SIGN IN - WITH AUTO ACCOUNT TYPE REDIRECT
// ================================================

// ============ CONSTANTS ============
//const API_URL = 'https://earncial-backend-copy.onrender.com';
const API_URL = 'http://localhost:5000';

// ============ DOM ELEMENTS ============
const body = document.getElementById('body');
const darkModeToggle = document.getElementById('darkModeToggle');
const themeIcon = darkModeToggle.querySelector('i');
const menuToggle = document.getElementById('menuToggle');
const closeSidebarBtn = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');
const loginForm = document.getElementById('loginForm');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const successModal = document.getElementById('successModal');
const errorModal = document.getElementById('errorModal');
const goToDashboardBtn = document.getElementById('goToDashboard');
const closeSuccessModalBtn = document.getElementById('closeSuccessModal');
const closeErrorModalBtn = document.getElementById('closeErrorModal');
const tryAgainBtn = document.getElementById('tryAgain');
const errorMessageContent = document.getElementById('errorMessageContent');
const submitBtn = loginForm.querySelector('button[type="submit"]');

// ============ GLOBAL FLAGS ============
let isSubmitting = false;

// ============ SIDEBAR TOGGLE ============
function openSidebar() {
    sidebar.classList.add('open');
    mobileOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebarFunc() {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

menuToggle.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebarFunc);
mobileOverlay.addEventListener('click', closeSidebarFunc);

// ============ DARK MODE TOGGLE ============
function toggleDarkMode() {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    if (isDark) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }

    // Auto-fill remembered identifier (email or username)
    const rememberMe = localStorage.getItem('rememberMe');
    const savedIdent = localStorage.getItem('userIdentifier');
    if (rememberMe === 'true' && savedIdent) {
        document.getElementById('email').value = savedIdent;
        document.getElementById('rememberMe').checked = true;
        document.getElementById('password').focus();
    }

    darkModeToggle.addEventListener('click', toggleDarkMode);
});

// ============ PASSWORD TOGGLE ============
function togglePasswordVisibility(input, toggleBtn) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    toggleBtn.innerHTML = type === 'password'
        ? '<i class="fas fa-eye"></i>'
        : '<i class="fas fa-eye-slash"></i>';
}

togglePassword.addEventListener('click', () => {
    togglePasswordVisibility(passwordInput, togglePassword);
});

// ============ BUTTON LOADING STATE ============
function setLoading(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    } else {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
}

// ============ FORM VALIDATION ============
function showError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    input.classList.add('error');
    input.classList.remove('success');
    error.textContent = message;
    error.classList.add('show');
}

function showSuccess(inputId) {
    const input = document.getElementById(inputId);
    const errorId = inputId + 'Error';
    const error = document.getElementById(errorId);
    input.classList.remove('error');
    input.classList.add('success');
    if (error) error.classList.remove('show');
}

// ============ VALIDATION — EMAIL OR USERNAME ============
function validateEmail() {
    const input = document.getElementById('email');

    // Auto lowercase + trim
    input.value = input.value.trim().toLowerCase();
    const val = input.value;

    if (!val) {
        showError('email', 'emailError', 'Email or username is required');
        return false;
    }

    const isEmail    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const isUsername = /^[a-z][a-z0-9._]{2,19}$/.test(val);

    if (!isEmail && !isUsername) {
        showError('email', 'emailError', 'Please enter a valid email address or username');
        return false;
    }

    showSuccess('email');
    return true;
}

function validatePassword() {
    const password = document.getElementById('password').value;
    if (!password) {
        showError('password', 'passwordError', 'Password is required');
        return false;
    }
    showSuccess('password');
    return true;
}

// ============ GET DASHBOARD URL BASED ON ACCOUNT TYPE ============
function getDashboardUrl(accountType) {
    if (accountType === 'Advertiser') {
        return 'hub/index.html';
    } else {
        return 'app/index.html';
    }
}

// ============ MODAL FUNCTIONS ============
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

goToDashboardBtn.addEventListener('click', () => {
    closeModal(successModal);
    const user = JSON.parse(localStorage.getItem('earncial_user'));
    window.location.href = getDashboardUrl(user.accountType);
});

closeSuccessModalBtn.addEventListener('click', () => {
    closeModal(successModal);
    const user = JSON.parse(localStorage.getItem('earncial_user'));
    window.location.href = getDashboardUrl(user.accountType);
});

closeErrorModalBtn.addEventListener('click', () => closeModal(errorModal));

tryAgainBtn.addEventListener('click', () => {
    closeModal(errorModal);
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
});

[successModal, errorModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
});

// ============ REAL-TIME VALIDATION ============
document.getElementById('email').addEventListener('blur', validateEmail);
document.getElementById('password').addEventListener('blur', validatePassword);


// ============ REAL-TIME LOWERCASE ============  ← kara nan
document.getElementById('email').addEventListener('input', () => {
    const input = document.getElementById('email');
    const pos = input.selectionStart;
    input.value = input.value.toLowerCase();
    input.setSelectionRange(pos, pos);
});

// ============ FORM SUBMISSION ============
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const isEmailValid    = validateEmail();
    const isPasswordValid = validatePassword();
    if (!isEmailValid || !isPasswordValid) return;

    isSubmitting = true;
    setLoading(true);

    // Send as 'identifier' to backend — works for both email & username
    const identifier = document.getElementById('email').value.trim().toLowerCase();
    const password   = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
        const response = await fetch(`${API_URL}/api/auth/sign-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });

        const result = await response.json();
        setLoading(false);
        isSubmitting = false;

        if (response.ok && result.success) {
            localStorage.setItem('earncial_token', result.token);
            localStorage.setItem('earncial_user', JSON.stringify(result.user));

            // Remember me — save identifier (works for both email & username)
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('userIdentifier', identifier);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('userIdentifier');
            }

            const dashboardUrl = getDashboardUrl(result.user.accountType);

            console.log('✅ Login successful!');
            console.log('👤 User:', result.user.fullName);
            console.log('🎯 Account Type:', result.user.accountType);
            console.log('🚀 Redirecting to:', dashboardUrl);

            successModal.classList.add('active');
            document.body.style.overflow = 'hidden';

            setTimeout(() => {
                window.location.href = dashboardUrl;
            }, 2000);

        } else {
            errorMessageContent.textContent = result.message || 'Invalid credentials. Please check your details and try again.';
            errorModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

    } catch (err) {
        setLoading(false);
        isSubmitting = false;
        console.error('❌ Login error:', err);
        errorMessageContent.textContent = 'Cannot connect to server. Please check your internet connection and try again.';
        errorModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});

// ============ WINDOW RESIZE HANDLER ============
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeSidebarFunc();
});

// ============ ENTER KEY SUBMISSION ============
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginForm.requestSubmit();
});

// ============ INITIALIZATION ============
console.log('🚀 Earncial Sign In - Ready!');
console.log('📍 API URL:', API_URL);
console.log('✅ Auto-redirect based on account type (Advertiser/Earner)');
