
// ================================================
// WALLET TRANSFER - REAL BACKEND INTEGRATION
// ================================================

const API_URL = 'http://localhost:5000'; // CANJA wannan zuwa ainihin backend URL ɗinka
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// Transfer settings from backend
let TRANSFER_SETTINGS = {
    minTransfer: 100,
    transferFeePercentage: 2
};

// ================= CHECK AUTH =================
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        showToast('Please login first', 'warning');
        setTimeout(() => {
            window.location.href = '../sign-in.html';
        }, 1500);
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        return true;
    } catch (e) {
        console.error('Invalid user data:', e);
        localStorage.clear();
        window.location.href = '../sign-in.html';
        return false;
    }
}

// ================= LOAD TRANSFER SETTINGS =================
async function loadTransferSettings() {
    try {
        const res = await fetch(`${API_URL}/api/transfer/check-eligibility`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            console.warn('⚠️ Using default transfer settings');
            return;
        }

        const data = await res.json();
        
        if (data.success) {
            TRANSFER_SETTINGS.minTransfer = data.minTransferAmount || 100;
            TRANSFER_SETTINGS.transferFeePercentage = data.transferFeePercentage || 2;
            console.log('✅ Transfer settings loaded:', TRANSFER_SETTINGS);
        }
    } catch (err) {
        console.error('❌ Load settings error:', err);
        showToast('Using default transfer settings', 'info');
    }
}

// ================= LOAD WALLET BALANCES =================
async function loadWalletBalances() {
    try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                showToast('Session expired. Please login again', 'error');
                setTimeout(() => {
                    localStorage.clear();
                    window.location.href = '../sign-in.html';
                }, 2000);
                return;
            }
            throw new Error('Failed to load balances');
        }

        const data = await res.json();
        
        if (data.success && data.user) {
            currentUser = data.user;
            localStorage.setItem('earncial_user', JSON.stringify(currentUser));
            updateWalletDisplay();
            console.log('✅ Wallet balances refreshed');
        }
    } catch (err) {
        console.error('❌ Load balances error:', err);
        showToast('Could not refresh balance', 'warning');
        // Use cached data
        updateWalletDisplay();
    }
}

function updateWalletDisplay() {
    const earningsEl = document.getElementById('earningsBalance');
    const mainEl = document.getElementById('mainBalance');
    
    if (earningsEl) {
        earningsEl.textContent = (currentUser.earningsBalance || 0).toLocaleString('en-NG', {
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2
        });
    }
    
    if (mainEl) {
        mainEl.textContent = (currentUser.balance || 0).toLocaleString('en-NG', {
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2
        });
    }
}

// ================= QUICK AMOUNT BUTTONS =================
function setQuickAmount(amount) {
    const input = document.getElementById('transferAmount');
    if (!input) return;
    
    if (amount === 'all') {
        input.value = currentUser.earningsBalance || 0;
    } else {
        input.value = amount;
    }
    calculateTransfer();
}

// ================= CALCULATE TRANSFER =================
function calculateTransfer() {
    const amountInput = document.getElementById('transferAmount');
    const displayAmount = document.getElementById('displayAmount');
    const displayFee = document.getElementById('displayFee');
    const displayReceive = document.getElementById('displayReceive');
    const btn = document.getElementById('transferBtn');
    
    if (!amountInput || !displayAmount || !displayFee || !displayReceive || !btn) return;
    
    const amount = parseFloat(amountInput.value) || 0;
    const feePercentage = TRANSFER_SETTINGS.transferFeePercentage / 100;
    const fee = amount * feePercentage;
    const receive = amount - fee;

    displayAmount.textContent = amount.toLocaleString('en-NG', {
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2
    });
    
    displayFee.textContent = fee.toLocaleString('en-NG', {
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2
    });
    
    displayReceive.textContent = receive.toLocaleString('en-NG', {
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2
    });

    // Enable/disable button with validation
    const minTransfer = TRANSFER_SETTINGS.minTransfer;
    const earningsBalance = currentUser.earningsBalance || 0;
    
    if (amount === 0) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-wallet"></i> Enter Amount to Transfer';
    } else if (amount < minTransfer) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-exclamation-circle"></i> Minimum ₦${minTransfer.toLocaleString()} Required`;
    } else if (amount > earningsBalance) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Insufficient Earnings Balance';
    } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Proceed to Transfer';
    }
}

// ================= SHOW CONFIRMATION MODAL =================
function showConfirmationModal() {
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const feePercentage = TRANSFER_SETTINGS.transferFeePercentage / 100;
    const fee = amount * feePercentage;
    const receive = amount - fee;

    const confirmAmount = document.getElementById('confirmAmount');
    const confirmFee = document.getElementById('confirmFee');
    const confirmReceive = document.getElementById('confirmReceive');
    
    if (confirmAmount) confirmAmount.textContent = amount.toLocaleString('en-NG', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (confirmFee) confirmFee.textContent = fee.toLocaleString('en-NG', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (confirmReceive) confirmReceive.textContent = receive.toLocaleString('en-NG', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    openModal('confirmModal');
}

// ================= EXECUTE TRANSFER =================
async function executeTransfer() {
    const amountInput = document.getElementById('transferAmount');
    if (!amountInput) return;
    
    const amount = parseFloat(amountInput.value);

    // Client-side validation
    if (amount > (currentUser.earningsBalance || 0)) {
        showToast('Insufficient earnings balance!', 'error');
        closeModal('confirmModal');
        return;
    }

    if (amount < TRANSFER_SETTINGS.minTransfer) {
        showToast(`Minimum transfer amount is ₦${TRANSFER_SETTINGS.minTransfer.toLocaleString()}`, 'error');
        closeModal('confirmModal');
        return;
    }

    const confirmBtn = document.querySelector('#confirmModal .btn-modal:first-child');
    if (!confirmBtn) return;
    
    const originalHTML = confirmBtn.innerHTML;
    
    try {
        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const res = await fetch(`${API_URL}/api/transfer/earnings-to-balance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Transfer failed');
        }

        if (data.success) {
            // Update local balances from server response
            currentUser.earningsBalance = data.balances.earningsBalance;
            currentUser.balance = data.balances.balance;
            localStorage.setItem('earncial_user', JSON.stringify(currentUser));

            // Update display
            updateWalletDisplay();

            // Calculate for success modal
            const feePercentage = TRANSFER_SETTINGS.transferFeePercentage / 100;
            const fee = amount * feePercentage;
            const receive = amount - fee;

            // Close confirmation modal
            closeModal('confirmModal');
            
            // Show success modal
            const successTxnId = document.getElementById('successTxnId');
            const successAmount = document.getElementById('successAmount');
            const successReceive = document.getElementById('successReceive');
            const successNewBalance = document.getElementById('successNewBalance');
            
            if (successTxnId) successTxnId.textContent = data.transferId || `TXN${Date.now().toString().substr(-8)}`;
            if (successAmount) successAmount.textContent = amount.toLocaleString('en-NG', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            if (successReceive) successReceive.textContent = receive.toLocaleString('en-NG', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            if (successNewBalance) successNewBalance.textContent = currentUser.balance.toLocaleString('en-NG', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            
            openModal('successModal');

            // Reset form
            const form = document.getElementById('transferForm');
            if (form) form.reset();
            calculateTransfer();

            showToast('Transfer completed successfully!', 'success');

            // Reload transaction history
            setTimeout(() => loadTransactionHistory(), 500);
        } else {
            throw new Error(data.message || 'Transfer failed');
        }

    } catch (err) {
        console.error('❌ Transfer error:', err);
        showToast(err.message || 'Transfer failed. Please try again.', 'error');
        
        // Restore button
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalHTML;
        
        closeModal('confirmModal');
    }
}

// ================= LOAD TRANSACTION HISTORY =================
async function loadTransactionHistory() {
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    
    try {
        // Show loading state
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading transactions...</p>
                </td>
            </tr>
        `;
        
        const res = await fetch(`${API_URL}/api/transfer/history`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error('Failed to load history');

        const data = await res.json();
        
        if (!data.transfers || data.transfers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No transfer history yet</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.transfers.map(txn => {
            const date = new Date(txn.createdAt).toLocaleString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const statusClass = txn.status === 'completed' ? 'success' : 'failed';
            const statusIcon = txn.status === 'completed' ? 'check-circle' : 'times-circle';

            return `
                <tr>
                    <td>${date}</td>
                    <td><strong>${(txn._id || '').substring(0, 10).toUpperCase()}</strong></td>
                    <td>₦${txn.amount.toLocaleString('en-NG', {minimumFractionDigits: 2})}</td>
                    <td>₦${txn.fee.toLocaleString('en-NG', {minimumFractionDigits: 2})}</td>
                    <td><strong style="color: #10b981;">₦${txn.amountReceived.toLocaleString('en-NG', {minimumFractionDigits: 2})}</strong></td>
                    <td>
                        <span class="status-badge status-${statusClass}">
                            <i class="fas fa-${statusIcon}"></i>
                            ${txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        console.log('✅ Transaction history loaded:', data.transfers.length, 'transactions');

    } catch (err) {
        console.error('❌ Load history error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load transfer history</p>
                    <button onclick="loadTransactionHistory()" class="btn-retry">Retry</button>
                </td>
            </tr>
        `;
    }
}

// ================= MODAL FUNCTIONS =================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// ================= THEME TOGGLE =================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('themeIcon');
    if (document.body.classList.contains('dark-mode')) {
        if (icon) icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        if (icon) icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// ================= SIDEBAR FUNCTIONS =================
function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showToast('Logging out...', 'info');
        setTimeout(() => {
            localStorage.clear();
            window.location.href = '../sign-in.html';
        }, 1000);
    }
}

// ================= TOAST NOTIFICATION =================
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    
    // Create container if it doesn't exist
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <div class="toast-content">
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <p>${message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ================= REFRESH BUTTON =================
function refreshData() {
    showToast('Refreshing data...', 'info');
    loadWalletBalances();
    loadTransactionHistory();
}

// ================= INITIALIZATION =================
async function init() {
    console.log('🚀 Initializing Wallet Transfer Page...');
    
    if (!checkAuth()) return;

    loadTheme();

    try {
        // Load all data in sequence
        await loadTransferSettings();
        await loadWalletBalances();
        await loadTransactionHistory();

        // Add event listeners
        const transferAmount = document.getElementById('transferAmount');
        if (transferAmount) {
            transferAmount.addEventListener('input', calculateTransfer);
        }
        
        const transferForm = document.getElementById('transferForm');
        if (transferForm) {
            transferForm.addEventListener('submit', function(e) {
                e.preventDefault();
                showConfirmationModal();
            });
        }

        // Calculate initial display
        calculateTransfer();

        console.log('✅ Wallet Transfer Page Loaded Successfully');
        showToast(`Welcome back, ${currentUser.username || 'User'}!`, 'success');
        
    } catch (err) {
        console.error('❌ Initialization error:', err);
        showToast('Some features may not be available', 'warning');
    }
}

// ================= START APPLICATION =================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ================= PREVENT MEMORY LEAKS =================
window.addEventListener('beforeunload', function() {
    // Cleanup if needed
    console.log('👋 Page unloading...');
});