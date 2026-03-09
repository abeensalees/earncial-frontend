// ================================================
// EARNCIAL - BANK SETTINGS PAGE (FRONTEND)
// WITH PAYSTACK ACCOUNT VERIFICATION & PIN
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('earncial_token');
let currentUser = null;
let banks = [];
let bankToDelete = null;
let verificationTimeout = null;

// ======== CHECK AUTH ========
function checkAuth() {
    token = localStorage.getItem('earncial_token');
    const userData = localStorage.getItem('earncial_user');

    if (!token || !userData) {
        alert('Please login first');
        window.location.href = 'sign-in.html';
        return false;
    }

    try {
        currentUser = JSON.parse(userData);
        return true;
    } catch (e) {
        console.error('Invalid user data');
        localStorage.clear();
        window.location.href = 'sign-in.html';
        return false;
    }
}

// ======== DOM ELEMENTS ========
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const themeIcon = document.getElementById('themeIcon');
const toastContainer = document.getElementById('toastContainer');
const deleteModal = document.getElementById('deleteModal');

const addBankForm = document.getElementById('addBankForm');
const setPinForm = document.getElementById('setPinForm');
const banksTableBody = document.getElementById('banksTableBody');

const bankNameSelect = document.getElementById('bankName');
const accountNumberInput = document.getElementById('accountNumber');
const accountNameInput = document.getElementById('accountName');

const pinInputs = document.querySelectorAll('.pin-digit');

// ======== UI FUNCTIONS ========
function openSidebar() {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeIcon.classList.toggle('fa-moon', !isDark);
    themeIcon.classList.toggle('fa-sun', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
}

function showToast(type, title, message) {
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
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ======== PIN INPUT AUTO-FOCUS ========
function setupPinInputs() {
    pinInputs.forEach((input, index) => {
        // Auto-focus next input
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
        });

        // Backspace to previous input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                pinInputs[index - 1].focus();
            }
        });

        // Only allow numbers
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    });
}

// ======== LOAD NIGERIAN BANKS (FOR DROPDOWN) ========
async function loadBanksList() {
    try {
        const res = await fetch(`${API_URL}/api/banks/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load banks');

        const data = await res.json();
        const banksList = data.banks || [];

        bankNameSelect.innerHTML = '<option value="">-- Select Bank --</option>';
        
        banksList.forEach(bank => {
            const option = document.createElement('option');
            option.value = bank.code; // Paystack bank code
            option.textContent = bank.name;
            option.dataset.bankName = bank.name;
            bankNameSelect.appendChild(option);
        });

        console.log('✅ Banks list loaded:', banksList.length);
        
    } catch (err) {
        console.error('❌ Error loading banks:', err);
        showToast('error', 'Error', 'Failed to load banks list');
    }
}

// ======== VERIFY ACCOUNT NAME VIA PAYSTACK ========
accountNumberInput.addEventListener('input', function() {
    const accountNumber = this.value.trim();
    const bankCode = bankNameSelect.value;

    // Clear previous verification timeout
    if (verificationTimeout) {
        clearTimeout(verificationTimeout);
    }

    // Reset account name field
    accountNameInput.value = '';

    // Only verify when we have 10 digits
    if (accountNumber.length === 10 && bankCode) {
        accountNameInput.value = 'Verifying...';
        accountNameInput.style.color = 'var(--warning)';

        // Debounce API call by 1 second
        verificationTimeout = setTimeout(async () => {
            await verifyAccountName(bankCode, accountNumber);
        }, 1000);
    }
});

bankNameSelect.addEventListener('change', function() {
    // Reset when bank changes
    accountNumberInput.value = '';
    accountNameInput.value = '';
});

async function verifyAccountName(bankCode, accountNumber) {
    try {
        console.log('🔍 Verifying account:', bankCode, accountNumber);

        const res = await fetch(`${API_URL}/api/banks/verify-account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bankCode, accountNumber })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Verification failed');

        // Success!
        accountNameInput.value = data.accountName;
        accountNameInput.style.color = 'var(--success)';
        showToast('success', 'Account Verified', `Account belongs to ${data.accountName}`);

        console.log('✅ Account verified:', data.accountName);

    } catch (err) {
        console.error('❌ Verification failed:', err);
        accountNameInput.value = 'Verification Failed';
        accountNameInput.style.color = 'var(--danger)';
        showToast('error', 'Verification Failed', err.message);
    }
}

// ======== ADD BANK ACCOUNT ========
addBankForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const bankCode = bankNameSelect.value;
    const bankName = bankNameSelect.options[bankNameSelect.selectedIndex].dataset.bankName;
    const accountNumber = accountNumberInput.value.trim();
    const accountName = accountNameInput.value.trim();

    if (!bankCode || !accountNumber || !accountName) {
        showToast('error', 'Incomplete Form', 'Please fill all fields and verify account');
        return;
    }

    if (accountName === 'Verifying...' || accountName === 'Verification Failed') {
        showToast('error', 'Invalid Account', 'Please wait for verification or enter valid account');
        return;
    }

    const btn = e.target.querySelector('.submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Bank...';

    try {
        const res = await fetch(`${API_URL}/api/banks/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                bankName,
                bankCode,
                accountNumber,
                accountName
            })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to add bank');

        showToast('success', 'Bank Added', 'Your bank account has been added successfully');
        
        // Reload banks table
        await loadUserBanks();
        
        // Reset form
        addBankForm.reset();
        accountNameInput.value = '';

    } catch (err) {
        console.error('❌ Error adding bank:', err);
        showToast('error', 'Failed', err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Bank Account';
    }
});

// ======== SET/CHANGE PIN ========
setPinForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const pin1 = document.getElementById('pin1').value;
    const pin2 = document.getElementById('pin2').value;
    const pin3 = document.getElementById('pin3').value;
    const pin4 = document.getElementById('pin4').value;

    const confirmPin1 = document.getElementById('confirmPin1').value;
    const confirmPin2 = document.getElementById('confirmPin2').value;
    const confirmPin3 = document.getElementById('confirmPin3').value;
    const confirmPin4 = document.getElementById('confirmPin4').value;

    const pin = pin1 + pin2 + pin3 + pin4;
    const confirmPin = confirmPin1 + confirmPin2 + confirmPin3 + confirmPin4;

    if (pin.length !== 4 || confirmPin.length !== 4) {
        showToast('error', 'Invalid PIN', 'Please enter a 4-digit PIN');
        return;
    }

    if (pin !== confirmPin) {
        showToast('error', 'PIN Mismatch', 'PINs do not match. Please try again');
        return;
    }

    const btn = e.target.querySelector('.submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting PIN...';

    try {
        const res = await fetch(`${API_URL}/api/banks/set-pin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pin })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to set PIN');

        showToast('success', 'PIN Set Successfully', 'Your security PIN has been created');
        
        // Reset form
        setPinForm.reset();

    } catch (err) {
        console.error('❌ Error setting PIN:', err);
        showToast('error', 'Failed', err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Set Security PIN';
    }
});

// ======== LOAD USER BANKS ========
async function loadUserBanks() {
    try {
        const res = await fetch(`${API_URL}/api/banks/my-banks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load banks');

        const data = await res.json();
        banks = data.banks || [];

        renderBanksTable();

        console.log('✅ User banks loaded:', banks.length);

    } catch (err) {
        console.error('❌ Error loading banks:', err);
        showToast('error', 'Error', 'Failed to load your bank accounts');
    }
}

// ======== RENDER BANKS TABLE ========
function renderBanksTable() {
    if (banks.length === 0) {
        banksTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No Bank Accounts</h3>
                    <p>Add your first bank account above</p>
                </td>
            </tr>
        `;
        return;
    }

    banksTableBody.innerHTML = '';

    banks.forEach((bank, index) => {
        const row = document.createElement('tr');
        
        const isPrimary = bank.isPrimary || false;
        const formattedDate = formatDate(bank.createdAt);

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <span class="bank-badge">
                    <i class="fas fa-university"></i> ${bank.bankName}
                </span>
            </td>
            <td><strong>${bank.accountNumber}</strong></td>
            <td>${bank.accountName}</td>
            <td>
                ${isPrimary ? 
                    '<span class="primary-badge"><i class="fas fa-star"></i> Primary</span>' : 
                    '<span style="color: var(--text-muted); font-size: 13px;">Secondary</span>'
                }
            </td>
            <td>${formattedDate}</td>
            <td>
                ${!isPrimary ? `
                    <button class="action-btn btn-primary" title="Set as Primary" onclick="setPrimary('${bank._id}')">
                        <i class="fas fa-star"></i>
                    </button>
                ` : ''}
                <button class="action-btn btn-delete" title="Delete" onclick="confirmDelete('${bank._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        banksTableBody.appendChild(row);
    });
}

// ======== SET PRIMARY BANK ========
async function setPrimary(bankId) {
    try {
        const res = await fetch(`${API_URL}/api/banks/set-primary/${bankId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to set primary');

        showToast('success', 'Primary Bank Updated', 'Bank account set as primary successfully');
        
        await loadUserBanks();

    } catch (err) {
        console.error('❌ Error setting primary:', err);
        showToast('error', 'Failed', err.message);
    }
}

// ======== DELETE BANK CONFIRMATION ========
function confirmDelete(bankId) {
    bankToDelete = bankId;
    deleteModal.classList.add('active');
}

function closeDeleteModal() {
    deleteModal.classList.remove('active');
    bankToDelete = null;
}

async function deleteBank() {
    if (!bankToDelete) return;

    try {
        const res = await fetch(`${API_URL}/api/banks/delete/${bankToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to delete bank');

        showToast('success', 'Bank Deleted', 'Bank account removed successfully');
        
        closeDeleteModal();
        await loadUserBanks();

    } catch (err) {
        console.error('❌ Error deleting bank:', err);
        showToast('error', 'Failed', err.message);
        closeDeleteModal();
    }
}

// ======== HELPER FUNCTIONS ========
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }
}

// ======== INIT ========
async function init() {
    if (!checkAuth()) return;

    loadTheme();
    setupPinInputs();
    
    await loadBanksList();
    await loadUserBanks();

    showToast('success', 'Bank Settings', 'Manage your bank accounts securely');
}

window.addEventListener('DOMContentLoaded', init);

// Expose functions to window
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.setPrimary = setPrimary;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.deleteBank = deleteBank;

console.log('✅ Bank Settings JS Loaded');