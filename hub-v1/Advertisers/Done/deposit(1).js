// ================================================
// EARNCIAL - ADVERTISER WALLET (DEPOSIT) - COMPLETE
// advertiser-wallet.js
// ================================================
const API_URL = 'http://localhost:5000';
let currentUser = null;
let token = null;
// token already declared at top
token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

// ============ CHECK AUTH ============
function checkAuth() {
    token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        console.error('❌ Not authenticated - redirecting...');
        window.location.href = 'sign-in.html';
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        window.currentUser = currentUser;
        console.log('✅ User authenticated:', currentUser.username || currentUser.email);
        return true;
    } catch (e) {
        console.error('❌ Invalid user data:', e);
        localStorage.clear();
        window.location.href = 'sign-in.html';
        return false;
    }
}


let paymentGateways = [];
let deposits = [];
let selectedGateway = null;

// ============ CHECK AUTH ============
if (!token) {
    // No alert - direct redirect
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
        
        if (!res.ok) {
            // ✅ Stop spinner before throwing error
            const btn = document.querySelector('.deposit-btn');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-wallet"></i> Create Deposit';
            }
            
            // Handle specific error codes
            if (data.code === 'PENDING_DEPOSIT_EXISTS') {
                showToast('warning', 'Pending Deposit', data.message);
                if (data.pendingDeposit) {
                    showPendingDepositBanner(data.pendingDeposit);
                }
            } else if (data.code === 'MAX_CANCELLED_REACHED') {
                showToast('error', 'Limit Reached', data.message);
            } else {
                throw new Error(data.message);
            }
            return; // Stop here
        }
        
        setTimeout(() => processPayment(data.deposit), 1500);
        
    } catch (err) {
        showToast('error', 'Failed', err.message);
        
        // ✅ Stop spinner and re-enable button
        const btn = document.querySelector('.deposit-btn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-wallet"></i> Create Deposit';
        }
    }
});

/*function processPayment(deposit) {
    // PAYSTACK DISABLED

    // if (deposit.gateway.slug === \'paystack\') { initiatePaystack(deposit); } else {
        showToast('info', 'Payment Gateway', `Opening gateway...`);
        resetDepositBtn();
    }
}*/

function processPayment(deposit) {
    // PAYSTACK DISABLED
    // if (deposit.gateway.slug === 'paystack') { initiatePaystack(deposit); }
    
    if (deposit.gateway.slug === 'flutterwave') {
        initiateFlutterwave(deposit);
    }
    else if (deposit.gateway.slug === 'manual' || deposit.gateway.slug === 'bank_transfer') {
        initiateManual(deposit);
    } 
    else {
        showToast('error', 'Payment', 'Unsupported payment gateway');
        resetDepositBtn();
    }
}

async function resumePendingDeposit(transactionId) {
    // ✅ Get button and show spinner
    const btn = event?.target?.closest('button');
    let originalHTML = '';
    
    if (btn) {
        originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }
    
    try {
        console.log('🔄 Resuming deposit:', transactionId);
        
        const res = await fetch(`${API_URL}/api/deposits/re-initiate/${transactionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            // ✅ Restore button on error
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
            throw new Error(data.message);
        }
        
        // Process payment (button will be handled by payment flow)
        processPayment(data.deposit);
        
    } catch (err) {
        console.error('❌ Resume error:', err);
        showToast('error', 'Error', err.message);
        
        // ✅ Restore button on error
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHTML || '<i class="fas fa-play-circle"></i> Complete';
        }
    }
}

// PAYSTACK COMMENTED OUT (not used)
// function initiatePaystack(deposit) {
//     const script = document.createElement('script');
//     script.src = 'https://js.paystack.co/v1/inline.js';
//     script.onload = () => {
//         const handler = PaystackPop.setup({
//             key: deposit.gateway.publicKey,
//             email: deposit.user.email,
//             amount: (deposit.amount + (deposit.chargeFee || 0)) * 100,
//             ref: deposit.transactionId,
//             callback: (response) => verifyPayment(deposit.transactionId, response.reference),
//             onClose: () => resetDepositBtn()
//         });
//         handler.openIframe();
//     };
//     document.body.appendChild(script);
// }
// 
// 

// ============ MANUAL BANK TRANSFER ============
// Store pending manual deposit data
let pendingManualDeposit = null;

function initiateManual(deposit) {
    console.log('📋 Manual deposit initiated:', deposit);
    
    // ✅ STORE deposit data - don't create record yet
    pendingManualDeposit = deposit;
    
    // Update modal with deposit details
    document.getElementById('manualAmount').textContent = '₦' + deposit.amount.toLocaleString();
    document.getElementById('bankName').textContent = deposit.gateway.bankName || 'Not Available';
    document.getElementById('accountNumber').textContent = deposit.gateway.accountNumber || 'Not Available';
    document.getElementById('accountName').textContent = deposit.gateway.accountName || 'Not Available';
    
    // Show modal
    const modal = document.getElementById('manualBankModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        console.error('Manual bank modal not found');
        showToast('error', 'Error', 'Could not load payment details');
    }
}

// Copy to clipboard function
function copyToClipboard(elementId, button) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        // Change button
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied');
        
        // Show toast
        showToast('success', 'Copied!', text);
        
        // Reset after 2 seconds
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i> Copy';
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('error', 'Copy Failed', 'Please copy manually');
    });
}

window.copyToClipboard = copyToClipboard;

// Old initiateManual removed
function OLD_initiateManual_REMOVED(deposit) {
    console.log('📋 OLD VERSION - REMOVED');
    
    // This version created modal dynamically - replaced with HTML modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'manualPaymentModal_OLD';
    modal.innerHTML = `
        <div style="background:var(--bg-card);border-radius:20px;padding:30px;max-width:500px;width:90%;box-shadow:var(--shadow);border:1px solid var(--border-color);animation:slideUp .3s;">
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:60px;color:var(--primary);margin-bottom:15px;">
                    <i class="fas fa-university"></i>
                </div>
                <h3 style="color:var(--text-main);font-size:22px;font-weight:700;margin-bottom:8px;">
                    Manual Bank Transfer
                </h3>
                <p style="color:var(--text-muted);font-size:14px;">
                    Transfer ₦${deposit.amount.toLocaleString()} to the account below
                </p>
            </div>
            
            <div style="background:var(--bg-body);padding:20px;border-radius:12px;margin:20px 0;">
                <div style="margin-bottom:15px;">
                    <label style="color:var(--text-muted);font-size:12px;display:block;margin-bottom:5px;">Bank Name</label>
                    <div style="color:var(--text-main);font-weight:600;font-size:16px;">
                        ${deposit.gateway.bankName || 'Loading...'}
                    </div>
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:var(--text-muted);font-size:12px;display:block;margin-bottom:5px;">Account Number</label>
                    <div style="color:var(--text-main);font-weight:600;font-size:18px;letter-spacing:1px;">
                        ${deposit.gateway.accountNumber || 'Loading...'}
                    </div>
                </div>
                <div>
                    <label style="color:var(--text-muted);font-size:12px;display:block;margin-bottom:5px;">Account Name</label>
                    <div style="color:var(--text-main);font-weight:600;font-size:16px;">
                        ${deposit.gateway.accountName || 'Loading...'}
                    </div>
                </div>
            </div>
            
            <div style="background:rgba(0,170,255,0.1);padding:15px;border-radius:10px;margin-bottom:20px;">
                <p style="color:var(--text-main);font-size:13px;line-height:1.6;margin:0;">
                    <i class="fas fa-info-circle" style="color:var(--primary);"></i>
                    <strong>Important:</strong> After making the transfer, your deposit will be verified by our team within 24 hours.
                </p>
            </div>
            
            <button onclick="closeManualModal()" style="width:100%;padding:14px;border-radius:10px;border:none;font-weight:600;font-size:15px;cursor:pointer;font-family:'Poppins',sans-serif;background:var(--primary);color:white;">
                <i class="fas fa-check"></i> I Have Made the Transfer
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// closeManualModal removed - using event listeners now


function initiateFlutterwave(deposit) {
    console.log('💳 Initiating Flutterwave payment:', deposit);
    
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.onload = function() {
        try {
            console.log('✅ Flutterwave SDK loaded');
            
            // DEBUG: Check deposit data
            console.log('📋 Deposit data:', deposit);
            console.log('📋 Gateway:', deposit.gateway);
            console.log('📋 Reference:', deposit.reference);
            console.log('📋 Public Key:', deposit.gateway?.publicKey);
            
            // Validate required fields
            if (!deposit.reference) {
                console.error('❌ Missing deposit.reference!');
                showToast('error', 'Payment Error', 'Transaction reference missing. Please try again.');
                return;
            }
            
            if (!deposit.gateway?.publicKey) {
                console.error('❌ Missing public key!');
                showToast('error', 'Payment Error', 'Payment gateway not configured properly.');
                return;
            }
            
            console.log('✅ All required fields present - initializing Flutterwave...');
            
            FlutterwaveCheckout({
                public_key: deposit.gateway.publicKey,
                tx_ref: deposit.reference,
                amount: deposit.amount,
                currency: 'NGN',
                payment_options: 'card,banktransfer,ussd',
                customer: {
                    email: currentUser?.email || 'user@earncial.com',
                    name: currentUser?.fullName || currentUser?.username || 'Earncial User',
                    phone_number: currentUser?.phone || ''
                },
                customizations: {
                    title: 'Earncial Deposit',
                    description: `Deposit to wallet`,
                    logo: 'https://earncial.com/logo.png'
                },
                callback: function(response) {
                    console.log('✅ Payment callback:', response);
                    
                    if (response.status === 'successful' || response.status === 'completed') {
                        // Set flag to prevent onclose message
                        window.flutterwavePaymentSuccess = true;
                        showToast('success', 'Payment Successful!', 'Verifying your deposit...');
                        verifyDeposit(deposit.transactionId);
                    } else {
                        showToast('error', 'Payment Failed', response.status || 'Transaction was not completed');
                    }
                },
                onclose: function() {
                    console.log('ℹ️ Payment modal closed');
                    
                    // Only show cancelled if payment was NOT successful
                    if (!window.flutterwavePaymentSuccess) {
                        showToast('info', 'Payment Cancelled', 'You closed the payment window');
                    }
                    
                    // Reset flag
                    window.flutterwavePaymentSuccess = false;
                }
            });
        } catch (error) {
            console.error('❌ Flutterwave error:', error);
            showToast('error', 'Payment Error', error.message || 'Could not initialize payment');
        }
    };
    
    script.onerror = function() {
        console.error('❌ Failed to load Flutterwave SDK');
        showToast('error', 'Payment Error', 'Could not load payment system. Please check your internet connection.');
    };
    
    document.body.appendChild(script);
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
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;">No Deposits Found</td></tr>`;
        return;
    }
    
    deposits.forEach((deposit, index) => {
        const row = document.createElement('tr');
        const isPending = deposit.status === 'pending';
        // Format date and time
        const createdDate = new Date(deposit.createdAt);
        const dateStr = createdDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        const timeStr = createdDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        });
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><code style="font-size:15px;">${deposit.transactionId}</code></td>
            <td><span class="amount-${deposit.status === 'success' ? 'success' : 'failed'}">₦${deposit.amount.toLocaleString()}</span></td>
            <td>${deposit.paymentGateway?.displayName || 'Unknown'}</td>
            <td>${dateStr}</td>
            <td style="font-size:12px;color:var(--text-muted);">${timeStr}</td>
            <td><span class="status-badge status-${deposit.status}">${deposit.status.toUpperCase()}</span></td>
            <td>
                ${deposit.status === 'pending' || deposit.status === 'processing' 
                    ? `<button class="btn-resume" onclick="resumePendingDeposit('${deposit.transactionId}')" style="padding: 6px 12px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;"><i class="fas fa-play-circle"></i> Complete</button>` 
                    : deposit.status === 'cancelled'
                    ? `<span style="color:var(--danger);font-size:12px;"><i class="fas fa-times-circle"></i> Cancelled</span>`
                    : `<span style="color:var(--success);font-size:12px;"><i class="fas fa-check-double"></i> Verified</span>`
                }
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

    // Duka Content dina yana nan, ban canza ko harafi daya ba
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
    // Show logout modal
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        // Fallback if modal not found
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




// ============ CHECK FOR PENDING DEPOSIT ============
async function checkPendingDeposit() {
    try {
        const res = await fetch(`${API_URL}/api/deposits/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (data.success && data.hasPending) {
            console.log('⚠️ User has pending deposit:', data.deposit);
            showPendingDepositBanner(data.deposit);
        }
        
    } catch (error) {
        console.error('❌ Error checking pending:', error);
    }
}


// ============ BLOCK CREATE IF PENDING ============
async function checkAndBlockIfPending() {
    try {
        const res = await fetch(`${API_URL}/api/deposits/pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (data.success && data.hasPending) {
            console.log('🚫 BLOCKED: User has pending deposit');
            
            showToast('warning', 'Pending Deposit', 'You have a pending deposit. Complete or cancel it first.');
            
            // Show the pending banner
            showPendingDepositBanner(data.deposit);
            
            return true; // Blocked
        }
        
        return false; // Not blocked
        
    } catch (error) {
        console.error('❌ Error checking pending:', error);
        return false;
    }
}

window.checkAndBlockIfPending = checkAndBlockIfPending;

// ============ SHOW PENDING BANNER ============
function showPendingDepositBanner(deposit) {
    // Create banner
    const banner = document.createElement('div');
    banner.id = 'pendingBanner';
    banner.style.cssText = `
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 15px;
        border-radius: 12px;
        margin-bottom: 20px;
        box-shadow: 0 4px 15px rgba(245,158,11,0.3);
    `;
    
    banner.innerHTML = `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:15px;flex-wrap:wrap;">
            <div style="flex:1;min-width:250px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                    <i class="fas fa-exclamation-triangle" style="font-size:22px;"></i>
                    <h3 style="margin:0;font-size:16px;font-weight:700;">Pending Deposit</h3>
                </div>
                <p style="margin:0;font-size:13px;opacity:0.95;line-height:1.5;">
                    You have a pending deposit of <strong>₦${deposit.amount.toLocaleString()}</strong>. 
                    Complete it or cancel to create a new one.
                </p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button onclick="completePendingDeposit()" style="padding:10px 16px;background:white;color:#d97706;border:none;border-radius:8px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;white-space:nowrap;">
                    <i class="fas fa-check-circle"></i> Complete
                </button>
                <button onclick="cancelPendingDeposit('${deposit.transactionId}')" style="padding:10px 16px;background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.3);border-radius:8px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;white-space:nowrap;">
                    <i class="fas fa-times-circle"></i> Cancel
                </button>
            </div>
        </div>
    `;
    
    // Insert at top of container
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(banner, container.firstChild);
    }
    
    // Store pending deposit data
    window.pendingDepositData = deposit;
}

// ============ COMPLETE PENDING ============
function completePendingDeposit() {
    const deposit = window.pendingDepositData;
    if (!deposit) {
        showToast('error', 'Error', 'No pending deposit data');
        return;
    }
    
    console.log('✅ Resuming pending deposit:', deposit);
    
    // ✅ Show spinner on button
    const btn = event?.target;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }
    
    // Small delay for UX
    setTimeout(() => {
        // Route based on gateway
        if (deposit.gateway.slug === 'flutterwave') {
            initiateFlutterwave(deposit);
        } else if (deposit.gateway.slug === 'manual' || deposit.gateway.slug === 'bank_transfer') {
            initiateManual(deposit);
        } else {
            showToast('error', 'Error', 'Unknown payment method');
            
            // Restore button
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Complete';
            }
        }
    }, 300);
}

// ============ CANCEL PENDING ============
async function cancelPendingDeposit(transactionId) {
    // ✅ Show spinner on button
    const btn = event?.target?.closest('button');
    let originalHTML = '';
    
    if (btn) {
        originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
    }
    
    try {
        console.log('🚫 Cancelling deposit:', transactionId);
        
        const res = await fetch(`${API_URL}/api/deposits/${transactionId}/cancel`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (data.success) {
            // ✅ Check if limit reached
            if (data.limitReached) {
                showToast('warning', 'Limit Reached!', data.message);
            } else if (data.cancelledCount === 2) {
                showToast('warning', 'Warning', 'This is your 2nd cancellation. One more and you must complete a deposit.');
            } else {
                showToast('success', 'Cancelled', data.message);
            }
            
            // Remove banner
            document.getElementById('pendingBanner')?.remove();
            window.pendingDepositData = null;
            
            // Reload deposits
            setTimeout(() => loadDeposits(), 1000);
        } else {
            // ✅ Handle limit errors
            if (data.code === 'MAX_CANCELLED_REACHED') {
                showToast('error', 'Limit Reached', data.message);
                
                // Show complete button if pending exists
                if (data.pendingDeposit) {
                    setTimeout(() => {
                        if (confirm('You must complete your pending deposit. Resume now?')) {
                            checkPendingDeposit();
                        }
                    }, 2000);
                }
            } else {
                showToast('error', 'Error', data.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Cancel error:', error);
        showToast('error', 'Error', 'Could not cancel deposit');
        
        // ✅ Restore button on error
        const btn = event?.target?.closest('button');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHTML || '<i class="fas fa-times-circle"></i> Cancel';
        }
    }
}


// ============ HANDLE CREATE BLOCKED ============
function handleDepositBlocked(error) {
    if (error.code === 'MAX_CANCELLED_REACHED') {
        showToast('error', 'Blocked', 'You have cancelled 3 deposits. Complete your pending deposit first.');
        
        // Check for pending
        setTimeout(() => checkPendingDeposit(), 1500);
    } else if (error.code === 'MAX_CANCELLED_REACHED_NO_PENDING') {
        showToast('error', 'Blocked', 'You have cancelled 3 deposits. Please contact support.');
    }
}

window.handleDepositBlocked = handleDepositBlocked;

window.completePendingDeposit = completePendingDeposit;
window.cancelPendingDeposit = cancelPendingDeposit;

// ============ VERIFY DEPOSIT ============
async function verifyDeposit(depositId) {
    try {
        console.log('🔍 Verifying deposit:', depositId);
        
        // Use transactionId from deposit object
        const transactionId = depositId;
        
        const res = await fetch(`${API_URL}/api/deposits/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transactionId: transactionId,
                gatewayReference: transactionId  // Flutterwave reference
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            console.log('✅ Deposit verified:', data);
            showToast('success', 'Payment Successful!', 'Your wallet has been credited');
            
            // ✅ NO REDIRECT - User stays on page
            // Reload deposits list after 2 seconds
            setTimeout(() => {
                loadDeposits();
            }, 2000);
        } else {
            console.error('❌ Verification failed:', data.message);
            showToast('error', 'Verification Failed', data.message || 'Could not verify payment');
        }
        
    } catch (error) {
        console.error('❌ Verify error:', error);
        showToast('error', 'Error', 'Could not verify payment. Please contact support.');
    }
}

window.verifyDeposit = verifyDeposit;

// ============ INITIALIZE ============
if (!checkAuth()) {
    // Redirect handled in checkAuth
} else {
    console.log('✅ User authenticated:', currentUser.username);
    
    // ✅ Check for pending deposit
    checkPendingDeposit();
}

// ================= EVENT LISTENERS (NO INLINE) =================
document.addEventListener('DOMContentLoaded', function() {
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            document.getElementById('logoutModal')?.classList.add('active');
        });
    }
    
    // Cancel logout
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function() {
            document.getElementById('logoutModal')?.classList.remove('active');
        });
    }
    
    // Confirm logout
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function() {
            localStorage.clear();
            window.location.href = 'sign-in.html';
        });
    }
    
    // Close manual modal
    const closeManualBtn = document.getElementById('closeManualBtn');
    if (closeManualBtn) {
        closeManualBtn.addEventListener('click', function() {
            document.getElementById('manualBankModal')?.classList.remove('active');
        });
    }
    
    // Confirm manual transfer
    const confirmManualBtn = document.getElementById('confirmManualBtn');
    if (confirmManualBtn) {
        confirmManualBtn.addEventListener('click', async function() {
            if (!pendingManualDeposit) {
                showToast('error', 'Error', 'No pending deposit data');
                return;
            }
            
            // Disable button
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            try {
                // ✅ NOW create the deposit record
                console.log('✅ User confirmed payment - creating record...');
                
                const response = await fetch(`${API_URL}/api/deposits/${pendingManualDeposit.transactionId}/confirm-manual`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('manualBankModal')?.classList.remove('active');
                    showToast('success', 'Noted!', 'Your deposit will be confirmed within 24 hours');
                    
                    // Clear pending data
                    pendingManualDeposit = null;
                    
                    // Reload deposits
                    setTimeout(() => loadDeposits(), 2000);
                } else {
                    showToast('error', 'Error', data.message || 'Could not save deposit');
                }
            } catch (error) {
                console.error('❌ Error:', error);
                showToast('error', 'Error', 'Could not process request');
            } finally {
                // Re-enable button
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-check"></i> I Have Made the Transfer';
            }
        });
    }
});
