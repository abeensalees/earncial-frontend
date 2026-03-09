// ============================================================
// EARNCIAL - ACTIVATION PAGE (Flutterwave Only)
// ============================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token');

// State
let activationFee = 0;
let selectedGateway = null;
let transactionId = null;
let flwTransactionId = null; // ✅ Flutterwave's own transaction ID

// ============ CHECK AUTH ============
if (!token) {
    alert('Please login first');
    window.location.href = 'sign-in.html';
}

// ============ INIT ============
async function init() {
    loadTheme();
    await checkActivationStatus();
}

// ============ CHECK ACTIVATION STATUS ============
async function checkActivationStatus() {
    try {
        const res = await fetch(`${API_URL}/api/activation/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to check status');

        const data = await res.json();
        activationFee = data.activation.fee;

        // Already activated
        if (data.user.isActivated) {
            showToast('success', 'Already Activated', 'Redirecting to dashboard...');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }

        // Activation not required
        if (!data.activation.required) {
            showToast('info', 'No Activation Needed', 'Redirecting...');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }

        // Update fee displays
        document.getElementById('payFee').textContent = ' ₦' + activationFee.toLocaleString() + ' ';
        document.getElementById('activationFee').textContent = '₦' + activationFee.toLocaleString();
        document.getElementById('inforBoxFee').textContent = '₦' + activationFee.toLocaleString();

        // Load Flutterwave gateway
        await loadGateway();

    } catch (error) {
        console.error('Check status error:', error);
        showToast('error', 'Error', error.message);
    }
}

// ============ LOAD FLUTTERWAVE GATEWAY ============
async function loadGateway() {
    try {
        const res = await fetch(`${API_URL}/api/activation/gateways`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load gateway');

        const data = await res.json();
        const gateways = data.gateways || [];

        // ✅ Get Flutterwave only
        const flw = gateways.find(g => g.slug === 'flutterwave');

        if (!flw) {
            showToast('error', 'Error', 'Payment gateway not available');
            document.getElementById('payBtn')?.setAttribute('disabled', true);
            return;
        }

        selectedGateway = flw;
        console.log('✅ Gateway loaded:', flw.displayName);

    } catch (error) {
        console.error('Load gateway error:', error);
        showToast('error', 'Error', 'Failed to load payment method');
    }
}

// ============ FORM SUBMIT ============
document.getElementById('activationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!selectedGateway) {
        showToast('error', 'Error', 'Payment gateway not available. Please refresh.');
        return;
    }

    await processPayment();
});

// ============ PROCESS PAYMENT ============
async function processPayment() {
    try {
        showToast('warning', 'Processing', 'Initializing payment...');

        // Initiate payment on backend
        const res = await fetch(`${API_URL}/api/activation/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ paymentGatewayId: selectedGateway.id })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to initiate payment');
        }

        const data = await res.json();
        transactionId = data.payment.transactionId;

        // ✅ Open Flutterwave
        openFlutterwave(data.payment);

    } catch (error) {
        console.error('Process payment error:', error);
        showToast('error', 'Payment Failed', error.message);
    }
}

// ============ OPEN FLUTTERWAVE ============
function openFlutterwave(paymentData) {
    let paymentSuccessful = false;

    FlutterwaveCheckout({
        public_key: paymentData.gateway.publicKey,
        tx_ref: paymentData.transactionId,       // ACT-xxxxx - namu
        amount: activationFee,
        currency: 'NGN',
        payment_options: 'banktransfer,card',     // ✅ Bank transfer default, card option
        customer: {
            email: paymentData.user.email,
            name: paymentData.user.name
        },
        customizations: {
            title: 'Earncial  Activation',
            description: `Activate your account for ₦${activationFee.toLocaleString()}`,
            logo: window.location.origin + 'logo.png'
        },
        callback: function(data) {
            console.log('Flutterwave callback:', data);

            if (data.status === 'successful' || data.status === 'completed') {
                paymentSuccessful = true;
                verifyPayment(data.tx_ref, data.transaction_id);
            } else {
                showToast('error', 'Payment Failed', 'Payment was not successful');
            }
        },
        onclose: function() {
            if (!paymentSuccessful) {
                // ✅ User ya rufe kafin ya biya
                showToast('warning', 'Cancelled', 'Payment window closed without completing');
            } else {
                // ✅ User ya rufe BAYAN ya biya - polling ta riga ta fara ko success modal yana fitowa
                // Babu toast - polling system zai handle shi
                console.log('Modal closed after payment - polling active or success shown');
            }
        }
    });
}

// ============ VERIFY PAYMENT ============
async function verifyPayment(txRef, flwTxId) {
    try {
        showToast('warning', 'Verifying', 'Please wait, verifying payment...');

        const res = await fetch(`${API_URL}/api/activation/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                transactionId: txRef,
                flwTransactionId: flwTxId
            })
        });

        const data = await res.json();

        if (data.success) {
            stopPolling();
            showSuccessModal();
        } else {
            // ✅ Verify ta kasa amma payment ya yi - fara polling
            console.warn('Verify failed, starting polling...', data.message);
            startPolling(txRef, flwTxId);
        }

    } catch (error) {
        console.error('Verify error:', error);
        // ✅ Network error - fara polling
        startPolling(txRef, flwTxId);
    }
}

// ============ POLLING SYSTEM ============
let pollingInterval = null;
let pollingTimeout = null;
let pollingAttempts = 0;
const MAX_ATTEMPTS = 30; // 30 × 10s = 5 minutes

function startPolling(txRef, flwTxId) {
    if (pollingInterval) return; // Already polling

    showPendingBanner();
    pollingAttempts = 0;

    console.log('🔄 Starting polling...');

    pollingInterval = setInterval(async () => {
        pollingAttempts++;
        console.log(`🔄 Poll attempt ${pollingAttempts}/${MAX_ATTEMPTS}`);

        // Option 1: Try verify endpoint again
        try {
            const res = await fetch(`${API_URL}/api/activation/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    transactionId: txRef,
                    flwTransactionId: flwTxId
                })
            });

            const data = await res.json();

            if (data.success || data.alreadyActivated) {
                stopPolling();
                hidePendingBanner();
                showSuccessModal();
                return;
            }

        } catch (err) {
            console.warn('Poll attempt failed:', err.message);
        }

        // Option 2: Check activation status directly
        try {
            const statusRes = await fetch(`${API_URL}/api/activation/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const statusData = await statusRes.json();

            if (statusData.user?.isActivated) {
                stopPolling();
                hidePendingBanner();
                showSuccessModal();
                return;
            }
        } catch (err) {
            console.warn('Status check failed:', err.message);
        }

        // Max attempts reached
        if (pollingAttempts >= MAX_ATTEMPTS) {
            stopPolling();
            showTimeoutMessage();
        }

    }, 10000); // Check kowane 10 seconds
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    pollingAttempts = 0;
}

function showPendingBanner() {
    const banner = document.getElementById('pendingBanner');
    if (banner) {
        banner.classList.add('active');
        document.getElementById('pendingMsg').textContent =
            'Payment received! Confirming activation... Please wait.';
    }
    // Disable pay button during polling
    const btn = document.getElementById('payBtn');
    if (btn) btn.disabled = true;
}

function hidePendingBanner() {
    const banner = document.getElementById('pendingBanner');
    if (banner) banner.classList.remove('active');
    const btn = document.getElementById('payBtn');
    if (btn) btn.disabled = false;
}

function showTimeoutMessage() {
    hidePendingBanner();
    showToast('warning', 'Taking longer than usual',
        'Your payment was received. Check back in a few minutes or contact support.');
}

// ============ SUCCESS MODAL ============
function showSuccessModal() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('activationDate').textContent = dateStr;
    document.getElementById('modalAmount').textContent = '₦' + activationFee.toLocaleString();
    document.getElementById('successModal').classList.add('active');
    showToast('success', 'Activation Successful', 'Your account is now active!');
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

// ============ THEME ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('themeIcon');
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('earncial_theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('earncial_theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('earncial_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

// ============ SIDEBAR ============
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

// ============ TOAST ============
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    else if (type === 'error') icon = 'fa-times-circle';
    else if (type === 'warning') icon = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fas ${icon} toast-icon"></i>
        <div class="toast-content">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============ LOGOUT ============
function openLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.classList.add('active');
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.classList.remove('active');
}

function confirmLogout() {
    localStorage.clear();
    window.location.href = 'sign-in.html';
}

// Modal close on outside click
document.getElementById('successModal')?.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
});

// ============ EXPOSE GLOBALS ============
window.openLogoutModal = openLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.confirmLogout = confirmLogout;
window.goToDashboard = goToDashboard;
window.toggleTheme = toggleTheme;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;

// ============ START ============
window.addEventListener('DOMContentLoaded', init);