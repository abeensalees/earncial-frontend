// ================= API CONFIG =================
const API_URL = 'http://localhost:5000';

// ================= DOM ELEMENTS =================
const resetForm = document.getElementById('resetForm');
const emailInput = document.getElementById('email');
const submitBtn = document.getElementById('submitBtn');
const forgotFormDiv = document.getElementById('forgotForm');
const successMessageDiv = document.getElementById('successMessage');
const emailDisplay = document.getElementById('emailDisplay');
const toastContainer = document.getElementById('toastContainer');
const darkModeToggle = document.getElementById('darkModeToggle');

// ================= DARK MODE =================
function toggleTheme() {
  const body = document.body;
  const icon = darkModeToggle.querySelector('i');
  
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

darkModeToggle.addEventListener('click', toggleTheme);

// Load theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  darkModeToggle.querySelector('i').classList.remove('fa-moon');
  darkModeToggle.querySelector('i').classList.add('fa-sun');
}

// ================= TOAST NOTIFICATION =================
function showToast(message, type = 'info', title = '') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    'success': 'fas fa-check-circle',
    'error': 'fas fa-exclamation-circle'
  };
  
  toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icons[type]}"></i>
        </div>
        <div class="toast-content">
            ${title ? `<strong>${title}</strong>` : ''}
            <p>${message}</p>
        </div>
    `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 5000);
}

// ================= FORM SUBMISSION =================
resetForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = emailInput.value.trim();
  
  if (!email) {
    showToast('Please enter your email address', 'error', 'Email Required');
    emailInput.focus();
    return;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast('Please enter a valid email address', 'error', 'Invalid Email');
    emailInput.focus();
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  
  try {
    const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to send reset email');
    }
    
    // Show success message
    emailDisplay.textContent = email;
    forgotFormDiv.style.display = 'none';
    successMessageDiv.classList.add('active');
    
    showToast('Password reset link sent successfully!', 'success', 'Email Sent');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showToast(error.message || 'Failed to send reset email. Please try again.', 'error', 'Error');
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reset Link';
  }
});