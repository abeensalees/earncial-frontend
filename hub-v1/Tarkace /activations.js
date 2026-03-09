
// ============================================================
// EARNCIAL - ACTIVATION PAGE
// ============================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token');

// State
let activationFee = 0;
let gateways = [];
let selectedGateway = null;
let transactionId = null;
let userData = {};

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
        userData = data.user;
        activationFee = data.activation.fee;

        // Already activated - redirect
        if (data.user.isActivated) {
            showToast('success', 'Already Activated', 'Redirecting to dashboard...');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }

        // Activation not required - redirect
        if (!data.activation.required) {
            showToast('info', 'No Activation Needed', 'Redirecting...');
            setTimeout(() => window.location.href = 'dashboard.html', 2000);
            return;
        }

        // Update fee displays
        document.getElementById('payFee').textContent = ' ₦' + activationFee.toLocaleString() + ' ';
        document.getElementById('activationFee').textContent = '₦' + activationFee.toLocaleString();
        document.getElementById('inforBoxFee').textContent = '₦' + activationFee.toLocaleString();

        // Load gateways
        await loadGateways();

    } catch (error) {
        console.error('Check status error:', error);
        showToast('error', 'Error', error.message);
    }
}

// ============ LOAD GATEWAYS ============
async function loadGateways() {
    try {
        const res = await fetch(`${API_URL}/api/activation/gateways`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load gateways');

        const data = await res.json();
        gateways = data.gateways || [];

        const select = document.getElementById('paymentMethod');
        select.innerHTML = '<option value="">-- Select Payment Method --</option>';

        gateways.forEach(gateway => {
            const option = document.createElement('option');
            option.value = gateway.id;
            option.textContent = gateway.displayName;
            option.dataset.slug = gateway.slug;
            option.dataset.publicKey = gateway.publicKey || '';
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Load gateways error:', error);
        showToast('error', 'Error', 'Failed to load payment methods');
    }
}

// ============ FORM SUBMIT ============
document.getElementById('activationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const gatewayId = document.getElementById('paymentMethod').value;

    if (!gatewayId) {
        showToast('error', 'Error', 'Please select a payment method');
        return;
    }

    const option = document.getElementById('paymentMethod').selectedOptions[0];
    selectedGateway = {
        id: gatewayId,
        name: option.textContent,
        slug: option.dataset.slug,
        publicKey: option.dataset.publicKey
    };

    await processPayment();
});

// ============ PROCESS PAYMENT ============
async function processPayment() {
    try {
        showToast('warning', 'Processing', 'Initializing payment...');

        // Initiate payment
        const res = await fetch(`${API_URL}/api/activation/initiate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ paymentGatewayId: selectedGateway.id })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to initiate payment');
        }

        const data = await res.json();
        transactionId = data.payment.transactionId;

        // Open Paystack
        if (selectedGateway.slug === 'paystack') {
            openPaystack(data.payment);
        } else {
            showToast('info', 'Payment Pending', 'Follow instructions to complete');
        }

    } catch (error) {
        console.error('Process payment error:', error);
        showToast('error', 'Payment Failed', error.message);
    }
}

// ============ OPEN PAYSTACK ============
function openPaystack(paymentData) {
    const handler = PaystackPop.setup({
        key: paymentData.gateway.publicKey,
        email: paymentData.user.email,
        amount: activationFee * 100,
        currency: 'NGN',
        ref: paymentData.transactionId,
        metadata: {
            custom_fields: [
                {
                    display_name: "Customer Name",
                    variable_name: "customer_name",
                    value: paymentData.user.name
                },
                {
                    display_name: "Payment Type",
                    variable_name: "payment_type",
                    value: "Account Activation"
                }
            ]
        },
        callback: function(response) {
            verifyPayment(response.reference);
        },
        onClose: function() {
            showToast('warning', 'Payment Cancelled', 'You closed the payment window');
        }
    });

    handler.openIframe();
}

// ============ VERIFY PAYMENT ============
async function verifyPayment(gatewayRef) {
    try {
        showToast('warning', 'Verifying', 'Please wait...');

        const res = await fetch(`${API_URL}/api/activation/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                transactionId: transactionId,
                gatewayReference: gatewayRef
            })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Verification failed');
        }

        const data = await res.json();
        showSuccessModal();

    } catch (error) {
        console.error('Verify error:', error);
        showToast('error', 'Verification Failed', error.message);
    }
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
function logout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }
}

// Modal close on outside click
document.getElementById('successModal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.remove('active');
    }
});

// ============ START ============
window.addEventListener('DOMContentLoaded', init);

