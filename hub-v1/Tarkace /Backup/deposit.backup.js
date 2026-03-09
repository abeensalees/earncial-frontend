// ================================================
// EARNCIAL - ADVERTISER WALLET (DEPOSIT) - COMPLETE
// advertiser-wallet.js
// ================================================
const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

let paymentGateways = [];
let deposits = [];
let selectedGateway = null;

// ============ CHECK AUTH ============
if (!token) {
    alert('Please login first');
    window.location.href = 'sign-in.html';
}

// ============ SIDEBAR & THEME ============
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('themeIcon');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('themeIcon');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

// ============ TOAST ============
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ============ LOAD PAYMENT GATEWAYS ============
async function loadPaymentGateways() {
    try {
        const res = await fetch(`${API_URL}/api/public/payment-gateways`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        paymentGateways = data.gateways || [];
        populatePaymentMethods();
        
    } catch (err) {
        console.error(err);
        showToast('error', 'Error', 'Failed to load payment methods.');
    }
}

// ============ POPULATE PAYMENT METHODS ============
function populatePaymentMethods() {
    const select = document.getElementById('paymentMethod');
    select.innerHTML = '<option value="">-- Select Payment --</option>';
    
    paymentGateways.forEach(gateway => {
        const option = document.createElement('option');
        option.value = gateway.id;
        option.textContent = `${gateway.displayName}`;
        option.dataset.gateway = JSON.stringify(gateway);
        select.appendChild(option);
    });
}

// ============ UPDATE MIN DEPOSIT ON METHOD CHANGE ============
document.getElementById('paymentMethod')?.addEventListener('change', function() {
    const option = this.options[this.selectedIndex];
    if (option.value) {
        selectedGateway = JSON.parse(option.dataset.gateway);
        document.getElementById('minimumDeposit').textContent = `₦${selectedGateway.config.minimumAmount.toLocaleString()}`;
        document.getElementById('depositAmount').min = selectedGateway.config.minimumAmount;
        updateFeeInfo();
    } else {
        selectedGateway = null;
        document.getElementById('minimumDeposit').textContent = '0';
        document.getElementById('feeInfo').style.display = 'none';
    }
});

document.getElementById('depositAmount')?.addEventListener('input', () => {
    if (selectedGateway) updateFeeInfo();
});

function updateFeeInfo() {
    if (!selectedGateway) return;
    const amount = parseFloat(document.getElementById('depositAmount').value) || 0;
    if (amount < selectedGateway.config.minimumAmount) {
        document.getElementById('feeInfo').style.display = 'none';
        return;
    }
    
    let fee = 0;
    let feeText = '';
    if (selectedGateway.config.feeType === 'percentage') {
        fee = Math.ceil((amount * selectedGateway.config.transactionFee) / 100);
        feeText = `${selectedGateway.config.transactionFee}%`;
    } else if (selectedGateway.config.feeType === 'fixed') {
        fee = selectedGateway.config.transactionFee;
        feeText = `₦${fee.toLocaleString()}`;
    }
    
    const total = amount + fee;
    const feeInfo = document.getElementById('feeInfo');
    if (feeInfo) {
        feeInfo.style.display = 'block';
        feeInfo.innerHTML = `
            <p style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span><i class="fas fa-money-bill-wave" style="color: var(--primary);"></i> Amount:</span>
                <strong>₦${amount.toLocaleString()}</strong>
            </p>
            <p style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span><i class="fas fa-receipt" style="color: var(--primary);"></i> Fee (${feeText}):</span>
                <strong style="color: ${fee > 0 ? 'var(--warning)' : 'var(--success)'};">₦${fee.toLocaleString()}</strong>
            </p>
            <hr style="border: none; border-top: 2px solid var(--primary); margin: 10px 0;">
            <p style="margin: 8px 0; display: flex; justify-content: space-between; font-size: 16px;">
                <span><i class="fas fa-coins" style="color: var(--primary);"></i> Total to Pay:</span>
                <strong style="color: var(--primary); font-size: 18px;">₦${total.toLocaleString()}</strong>
            </p>`;
    }
}

// ============ SET QUICK AMOUNT ============
function setAmount(amount) {
    document.getElementById('depositAmount').value = amount;
    if (selectedGateway) updateFeeInfo();
}

// ============ HANDLE DEPOSIT FORM ============
document.getElementById('depositForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const gatewayId = document.getElementById('paymentMethod').value;
    
    try {
        const btn = document.querySelector('.deposit-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        const res = await fetch(`${API_URL}/api/deposits/initiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount, paymentGatewayId: gatewayId, paymentMethod: 'card' })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        
        setTimeout(() => processPayment(data.deposit), 1500);
        
    } catch (err) {
        showToast('error', 'Failed', err.message);
        resetDepositBtn();
    }
});

/*function processPayment(deposit) {
    if (deposit.gateway.slug === 'paystack') {
        initiatePaystack(deposit);
    } else {
        showToast('info', 'Payment Gateway', `Opening gateway...`);
        resetDepositBtn();
    }
}*/

function processPayment(deposit) {
    if (deposit.gateway.slug === 'paystack') {
        initiatePaystack(deposit);
    } 
    else if (deposit.gateway.slug === 'flutterwave') {
        initiateFlutterwave(deposit);
    } 
    else {
        showToast('error', 'Payment', 'Unsupported payment gateway');
        resetDepositBtn();
    }
}

async function resumePendingDeposit(transactionId) {
    try {
        const res = await fetch(`${API_URL}/api/deposits/re-initiate/${transactionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        processPayment(data.deposit);
    } catch (err) {
        showToast('error', 'Error', err.message);
    }
}

function initiatePaystack(deposit) {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => {
        const handler = PaystackPop.setup({
            key: deposit.gateway.publicKey,
            email: deposit.user.email,
            amount: (deposit.amount + (deposit.chargeFee || 0)) * 100,
            ref: deposit.transactionId,
            callback: (response) => verifyPayment(deposit.transactionId, response.reference),
            onClose: () => resetDepositBtn()
        });
        handler.openIframe();
    };
    document.body.appendChild(script);
}


function initiateFlutterwave(deposit) {
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';

    script.onload = () => {
        FlutterwaveCheckout({
            public_key: deposit.gateway.publicKey, // Client ID / Public Key
            
            tx_ref: deposit.transactionId,
            amount: deposit.amount + (deposit.chargeFee || 0),
            currency: "NGN",
            payment_options: "card,banktransfer,ussd",
            customer: {
                email: deposit.user.email,
                name: deposit.user.fullName || "Earncial User",
            },
            callback: function (response) {
                verifyPayment(deposit.transactionId, response.transaction_id);
            },
            onclose: function () {
                resetDepositBtn();
            },
            customizations: {
                title: "Earncial Wallet Deposit",
                description: "Fund your advertiser wallet",
                logo: "https://yourdomain.com/logo.png"
            }
        });
    };

    document.body.appendChild(script);
}

async function verifyPayment(transactionId, gatewayReference) {
    try {
        const res = await fetch(`${API_URL}/api/deposits/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ transactionId, gatewayReference })
        });
        const data = await res.json();
        if (data.success) {
            showSuccessModal(data.deposit);
            loadDeposits();
            document.getElementById('depositForm').reset();
        }
        resetDepositBtn();
    } catch (err) {
        showToast('error', 'Error', err.message);
        resetDepositBtn();
    }
}

// ============ FILTER & LOAD ============
function filterUserHistory() {
    const status = document.getElementById('userHistoryFilter').value;
    loadDeposits(status);
}

async function loadDeposits(status = 'all') {
    try {
        let url = `${API_URL}/api/deposits/my-deposits?limit=20`;
        if (status !== 'all') url += `&status=${status}`;
        
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        deposits = data.deposits || [];
        renderDeposits();
    } catch (err) { console.error(err); }
}

function renderDeposits() {
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (deposits.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;">No Deposits Found</td></tr>`;
        return;
    }
    
    deposits.forEach((deposit, index) => {
        const row = document.createElement('tr');
        const isPending = deposit.status === 'pending';
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><code>${deposit.transactionId}</code></td>
            <td><span class="amount-${deposit.status === 'success' ? 'success' : 'failed'}">₦${deposit.amount.toLocaleString()}</span></td>
            <td>${deposit.paymentGateway?.displayName || 'Unknown'}</td>
            <td>${new Date(deposit.createdAt).toLocaleDateString()}</td>
            <td><span class="status-badge status-${deposit.status}">${deposit.status.toUpperCase()}</span></td>
            <td>
                ${isPending ? `<button class="btn-resume" onclick="resumePendingDeposit('${deposit.transactionId}')" style="padding: 6px 12px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-play-circle"></i> Complete</button>` : `<i class="fas fa-check-double" style="color:var(--success)"></i> Verified`}
            </td>`;
        tbody.appendChild(row);
    });
}

// ============ SUCCESS MODAL (RESIZED & SCROLLABLE) ============
function showSuccessModal(deposit) {
    const overlay = document.createElement('div');
    overlay.className = 'success-modal-overlay';
    // GYARA: Muna amfani da Flex domin centering, da kuma blur
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(8px);
        z-index: 9999; display: flex; align-items: center;
        justify-content: center; padding: 20px; animation: fadeIn 0.3s ease;
    `;

    const modal = document.createElement('div');
    // GYARA: Saka max-height da overflow-y: auto domin scrolling
    modal.style.cssText = `
        background: var(--bg-card); border-radius: 24px;
        padding: 30px; width: 100%; max-width: 450px;
        max-height: 90vh; overflow-y: auto; text-align: center;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4); border: 2px solid var(--success);
        animation: slideUpBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;

    // Duka Content dinka yana nan, ban canza ko harafi daya ba
    modal.innerHTML = `
        <div style="margin-bottom: 25px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); 
                border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                margin: 0 auto 20px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);">
                <i class="fas fa-check" style="font-size: 40px; color: white;"></i>
            </div>
            <h2 style="font-size: 24px; font-weight: 800; color: var(--text-main); margin-bottom: 10px;">
                Payment Successful! 🎉
            </h2>
            <p style="font-size: 14px; color: var(--text-muted);">
                Your wallet has been credited successfully
            </p>
        </div>

        <div style="background: linear-gradient(135deg, var(--primary-light), rgba(16, 185, 129, 0.1)); 
            border-radius: 20px; padding: 20px; margin-bottom: 25px; border: 2px solid var(--success);">
            <div style="margin-bottom: 15px;">
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 5px;">Amount Credited</p>
                <h3 style="font-size: 36px; font-weight: 900; color: #10b981; margin: 0;">
                    ₦${deposit.amount.toLocaleString()}
                </h3>
            </div>
            
            <div style="background: var(--bg-card); border-radius: 15px; padding: 15px;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span style="color: var(--text-muted); font-size: 12px;">Transaction ID</span>
                    <code style="font-size: 12px;">${deposit.transactionId}</code>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span style="color: var(--text-muted); font-size: 12px;">Old Balance</span>
                    <span style="font-size: 12px;">₦${deposit.oldBalance.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="color: var(--text-muted); font-size: 12px;">New Balance</span>
                    <span style="color: var(--success); font-weight: 800; font-size: 14px;">₦${deposit.newBalance.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 12px; margin-bottom: 20px; border-left: 4px solid var(--success);">
            <p style="color: var(--text-main); font-size: 13px; margin: 0;">
                <i class="fas fa-check-circle" style="color: var(--success);"></i> You can now use your balance!
            </p>
        </div>

        <button onclick="this.closest('.success-modal-overlay').remove()" 
            style="width: 100%; padding: 15px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); 
            color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer;">
            Awesome, Got it!
        </button>
        
        <p style="margin-top: 15px; font-size: 11px; color: var(--text-muted);">
            Closing in <span id="countdown">10</span>s
        </p>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Countdown logic
    let seconds = 30;
    const interval = setInterval(() => {
        seconds--;
        const el = modal.querySelector('#countdown');
        if (el) el.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(interval);
            if (overlay.parentNode) overlay.remove();
        }
    }, 3000);
}

function resetDepositBtn() {
    const btn = document.querySelector('.deposit-btn');
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Proceed to Payment';
    }
}

function logout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }
}

async function init() {
    loadTheme();
    await loadPaymentGateways();
    await loadDeposits();
    showToast('info', 'Welcome', 'Select payment method to deposit');

}

window.addEventListener('DOMContentLoaded', init);

// EXPORTS
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.setAmount = setAmount;
window.logout = logout;
window.filterUserHistory = filterUserHistory;
window.loadDeposits = loadDeposits;
window.resumePendingDeposit = resumePendingDeposit;