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

// ============ GLOBAL FLAGS ============
let isSubmitting = false;
let formModified = false;

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
    
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // ✅ SABO: URL REFERRAL LOGIC
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
    toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
}

togglePassword.addEventListener('click', () => {
    togglePasswordVisibility(passwordInput, togglePassword);
});

toggleConfirmPassword.addEventListener('click', () => {
    togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
});

// ============ BUTTON LOADING STATE ============
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

// ============ FORM VALIDATION FUNCTIONS ============
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

function validateFullName() {
    const fullName = document.getElementById('fullName').value.trim();
    if (!fullName) {
        showError('fullName', 'fullNameError', 'Full name is required');
        return false;
    }
    if (fullName.length < 2) {
        showError('fullName', 'fullNameError', 'Name is too short');
        return false;
    }
    showSuccess('fullName');
    return true;
}

function validateUsername() {
    const username = document.getElementById('username').value.trim();
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    
    if (!username) {
        showError('username', 'usernameError', 'Username is required');
        return false;
    }
    if (!usernameRegex.test(username)) {
        showError('username', 'usernameError', 'Username must be 3-20 characters (letters, numbers, underscore)');
        return false;
    }
    showSuccess('username');
    return true;
}

function validateEmail() {
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        showError('email', 'emailError', 'Email is required');
        return false;
    }
    if (!emailRegex.test(email)) {
        showError('email', 'emailError', 'Please enter a valid email address');
        return false;
    }
    showSuccess('email');
    return true;
}

function validatePhone() {
    const phone = document.getElementById('phone').value.trim();
    const phoneRegex = /^[0-9\+\-\s]{10,15}$/;
    
    if (!phone) {
        showError('phone', 'phoneError', 'Phone number is required');
        return false;
    }
    if (!phoneRegex.test(phone)) {
        showError('phone', 'phoneError', 'Please enter a valid phone number');
        return false;
    }
    showSuccess('phone');
    return true;
}

function validateCountry() {
    const country = document.getElementById('country').value;
    if (!country) {
        showError('country', 'countryError', 'Please select your country');
        return false;
    }
    showSuccess('country');
    return true;
}

function validateAccountType() {
    const accountType = document.getElementById('accountType').value;
    if (!accountType) {
        showError('accountType', 'accountTypeError', 'Please select account type');
        return false;
    }
    showSuccess('accountType');
    return true;
}

const infoIcon = document.getElementById("typeInfor");
const accountTypeModal = document.getElementById("accountTypeModal");

infoIcon.addEventListener("click", () => {
  accountTypeModal.classList.add("active");
});

function closeAccountTypeModal() {
  accountTypeModal.classList.remove("active");
}

function validatePassword() {
    const password = document.getElementById('password').value;
    if (!password) {
        showError('password', 'passwordError', 'Password is required');
        return false;
    }
    if (password.length < 8) {
        showError('password', 'passwordError', 'Password must be at least 8 characters');
        return false;
    }
    showSuccess('password');
    return true;
}

function validateConfirmPassword() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!confirmPassword) {
        showError('confirmPassword', 'confirmPasswordError', 'Please confirm your password');
        return false;
    }
    if (password !== confirmPassword) {
        showError('confirmPassword', 'confirmPasswordError', 'Passwords do not match');
        return false;
    }
    showSuccess('confirmPassword');
    return true;
}

function validateTerms() {
    const terms = document.getElementById('terms');
    if (!terms.checked) {
        showErrorModal('You must agree to the Terms of Service and Privacy Policy to continue.');
        return false;
    }
    return true;
}

// ============ MODAL FUNCTIONS ============
function showErrorModal(message) {
    errorMessageContent.textContent = message;
    errorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Modal button event listeners
goToDashboardBtn.addEventListener('click', () => {
    closeModal(successModal);
    window.location.href = 'sign-in.html'; // ✅ GYARA: Redirect zuwa Login
});

closeSuccessModalBtn.addEventListener('click', () => {
    closeModal(successModal);
    window.location.href = 'sign-in.html'; // ✅ GYARA: Redirect zuwa Login
});

closeErrorModalBtn.addEventListener('click', () => {
    closeModal(errorModal);
});

// Close modal when clicking outside
[successModal, errorModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// ============ REAL-TIME VALIDATION ============
document.getElementById('fullName').addEventListener('blur', validateFullName);
document.getElementById('username').addEventListener('blur', validateUsername);
document.getElementById('email').addEventListener('blur', validateEmail);
document.getElementById('phone').addEventListener('blur', validatePhone);
document.getElementById('country').addEventListener('change', validateCountry);
document.getElementById('accountType').addEventListener('change', validateAccountType);
document.getElementById('password').addEventListener('blur', validatePassword);
document.getElementById('confirmPassword').addEventListener('blur', validateConfirmPassword);

// Validate confirm password when password changes
document.getElementById('password').addEventListener('input', () => {
    if (document.getElementById('confirmPassword').value) {
        validateConfirmPassword();
    }
});

// ============ FORM SUBMISSION ============
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) {
        return;
    }

    // Validate all fields
    const isFullNameValid = validateFullName();
    const isUsernameValid = validateUsername();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();
    const isCountryValid = validateCountry();
    const isAccountTypeValid = validateAccountType();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isTermsValid = validateTerms();

    // If any validation fails, stop submission
    if (
        !isFullNameValid ||
        !isUsernameValid ||
        !isEmailValid ||
        !isPhoneValid ||
        !isCountryValid ||
        !isAccountTypeValid ||
        !isPasswordValid ||
        !isConfirmPasswordValid ||
        !isTermsValid
    ) {
        return;
    }
    
    // Set submitting flag
    isSubmitting = true;
    
    // Show loading state
    setLoading(true);
    
    // Prepare user data
    const userData = {
        fullName: document.getElementById('fullName').value.trim(),
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        country: document.getElementById('country').value,
        referredBy: document.getElementById('referredBy').value.trim() || undefined,
        accountType: document.getElementById('accountType').value,
        password: document.getElementById('password').value
    };

    try {
        // Send registration request
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        // Hide loading state
        setLoading(false);
        
        // Reset submitting flag
        isSubmitting = false;
        
        if (response.ok && result.success) {
            // ✅ GYARA: Kamo email domin tura shi shafin verify
            const userEmail = document.getElementById('email').value.trim();
            
            // Sabunta Modal Message
            const successTitle = successModal.querySelector('h2');
            const successText = successModal.querySelector('p');
            if(successTitle) successTitle.innerText = "Check Your Email!";
            if(successText) successText.innerHTML = `Welcome <b>${userData.username}</b>!<br><br>We've sent a verification link to <b>${userData.email}</b>. Please verify to activate your account.`;
            
            // ✅ CANZA BUTTON: Maimakon Login, ya tura shi shafin Verify
            goToDashboardBtn.innerText = "Verify Email Now";
            goToDashboardBtn.onclick = () => {
                window.location.href = `verify-email.html?email=${encodeURIComponent(userEmail)}`;
            };

            // Reset form modified flag
            formModified = false;
            
            // Show success modal
            successModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Reset form
            signupForm.reset();
        } else {
            // Show error modal with server message
            errorMessageContent.textContent = result.message || 'Registration failed. Please check your details and try again.';
            errorModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    } catch (err) {
        // Hide loading state
        setLoading(false);
        
        // Reset submitting flag
        isSubmitting = false;
        
        // Log error for debugging
        console.error('Registration error:', err);
        
        // Show error modal
        errorMessageContent.textContent = 'Cannot connect to server. Please check your internet connection and try again.';
        errorModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});

// ============ FORM MODIFICATION TRACKING ============
signupForm.addEventListener('input', () => {
    formModified = true;
});

// ============ PREVENT ACCIDENTAL PAGE LEAVE ============
window.addEventListener('beforeunload', (e) => {
    if (formModified && !successModal.classList.contains('active')) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ============ WINDOW RESIZE HANDLER ============
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        closeSidebarFunc();
    }
});

// ============ INITIALIZATION MESSAGE ============
console.log('🚀 Earncial Sign Up - Ready!');
console.log('📍 API URL:', API_URL);

// ====== ELEMENTS ======
//const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strengthBar');
const strengthText = document.querySelector('#strengthText span');

// ====== FUNCTION TO CHECK PASSWORD STRENGTH ======
function getPasswordStrength(pwd) {
    let score = 0;

    // Length points
    if(pwd.length >= 8) score += 1;
    if(pwd.length >= 12) score += 1;

    // Variety points
    if(/[A-Z]/.test(pwd)) score += 1;
    if(/[a-z]/.test(pwd)) score += 1;
    if(/[0-9]/.test(pwd)) score += 1;
    if(/[^A-Za-z0-9]/.test(pwd)) score += 1;

    return score; // 0 to 6
}

// ====== UPDATE BAR ======
function updateStrengthBar() {
    const pwd = passwordInput.value;
    const score = getPasswordStrength(pwd);

    // Map score (0-6) to percentage
    const percent = Math.min((score / 6) * 100, 100);
    strengthBar.style.width = percent + '%';

    // Optional: gradient-like color based on score
    if(score <= 2) {
        strengthBar.style.background = '#ef4444'; // red
        strengthText.textContent = 'Weak';
    } else if(score <= 4) {
        strengthBar.style.background = '#f59e0b'; // orange
        strengthText.textContent = 'Medium';
    } else {
        strengthBar.style.background = '#10b981'; // green
        strengthText.textContent = 'Strong';
    }

    if(pwd.length === 0){
        strengthBar.style.width = '0%';
        strengthText.textContent = 'Enter password';
    }
}

// ====== EVENT LISTENER ======
passwordInput.addEventListener('input', updateStrengthBar);