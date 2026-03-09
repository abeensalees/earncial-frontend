// ================================================
// EARNCIAL EMAIL VERIFICATION - FULL LOGIC
// ================================================

const API_URL = 'http://localhost:5000'; 

document.addEventListener('DOMContentLoaded', () => {
    // ============ DOM ELEMENTS ============
    const body = document.getElementById('body');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const userEmailElement = document.getElementById('userEmail');
    const verificationStatus = document.getElementById('verificationStatus');
    const resendBtn = document.getElementById('resendBtn');
    
    // Modals
    const successModal = document.getElementById('successModal');
    const errorModal = document.getElementById('errorModal');
    const resendModal = document.getElementById('resendModal');
    const errorMessage = document.getElementById('errorMessage');

    // ============ 1. DARK MODE & SIDEBAR ============
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
        darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });

    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        mobileOverlay.classList.add('active');
    });

    [closeSidebar, mobileOverlay].forEach(btn => {
        btn.addEventListener('click', () => {
            sidebar.classList.remove('open');
            mobileOverlay.classList.remove('active');
        });
    });

    // ============ 2. KAMO PARAMETERS DAGA URL ============
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const tokenParam = urlParams.get('token');

    // Nuna Email din User nan take
    if (emailParam) {
        userEmailElement.textContent = emailParam;
        localStorage.setItem('verificationEmail', emailParam);
    } else if (localStorage.getItem('verificationEmail')) {
        userEmailElement.textContent = localStorage.getItem('verificationEmail');
    }

    // ============ 3. AUTO-VERIFY LOGIC ============
    if (tokenParam) {
        verifyUserEmail(tokenParam);
    }

    async function verifyUserEmail(token) {
        verificationStatus.style.display = 'block';
        verificationStatus.classList.add('verifying');

        try {
            const response = await fetch(`${API_URL}/api/auth/verify/${token}`);
            const result = await response.json();

            verificationStatus.classList.remove('verifying');

            if (response.ok && result.success) {
                verificationStatus.classList.add('success');
                verificationStatus.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <h3>Verified Successfully!</h3>
                    <p>${result.message}</p>
                `;
                setTimeout(() => successModal.classList.add('active'), 1000);
            } else {
                throw new Error(result.message || 'Verification failed');
            }
        } catch (err) {
            verificationStatus.classList.remove('verifying');
            verificationStatus.classList.add('error');
            verificationStatus.innerHTML = `
                <i class="fas fa-times-circle"></i>
                <h3>Verification Failed</h3>
                <p>${err.message}</p>
            `;
            errorMessage.textContent = err.message;
            errorModal.classList.add('active');
        }
    }

    // ============ 4. RESEND LOGIC (NO GANDA) ============
    resendBtn.addEventListener('click', async () => {
        // Kamo email din dake cikin span din kai tsaye
        const email = userEmailElement.textContent;

        if (!email || email === 'user@example.com') {
            alert('Email not detected. Please register again.');
            return;
        }

        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';

        try {
            const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            const data = await res.json();

            if (res.ok) {
                resendModal.classList.add('active');
            } else {
                alert(data.message || 'Error resending email');
            }
        } catch (err) {
            alert('Server error. Please try again.');
        } finally {
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend verification email';
        }
    });

    // ============ 5. MODAL & OTHER BUTTONS ============
    document.getElementById('goToDashboard').addEventListener('click', () => {
        window.location.href = 'sign-in.html';
    });

    document.getElementById('closeErrorModal').addEventListener('click', () => {
        errorModal.classList.remove('active');
    });

    document.getElementById('closeResendModal').addEventListener('click', () => {
        resendModal.classList.remove('active');
    });

    document.getElementById('openEmailBtn').addEventListener('click', () => {
        window.location.href = 'mailto:';
    });
});