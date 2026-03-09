// ================================================
// EARNCIAL - BANK SETTINGS PAGE (FRONTEND)
// UPDATED: PERSISTENT PIN LOGIC & UI AUTO-HIDE
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

// ✅ NEW: UPDATE PIN UI LOGIC
function updatePinUI() {
    const userData = JSON.parse(localStorage.getItem('earncial_user'));
    
    // Check if user has a PIN in their profile data
    if (userData && userData.hasPin) { 
        const pinCard = document.getElementById('setPinForm').closest('.settings-card');
        if (pinCard) {
            pinCard.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <i class="fas fa-shield-alt" style="font-size: 50px; color: var(--success); margin-bottom: 15px;"></i>
                    <h3>Security PIN Active</h3>
                    <p style="color: var(--text-muted); font-size: 14px;">Your withdrawal PIN is securely set. To change it, please visit your <a href="profile.html" style="color: var(--primary); font-weight: bold;">Profile Settings</a>.</p>
                </div>
            `;
        }
    }
}

// ======== PIN INPUT AUTO-FOCUS ========
function setupPinInputs() {
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                pinInputs[index - 1].focus();
            }
        });

        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    });
}



// ============================================================
// ADD SEARCHABLE DROPDOWN FOR BANKS
// ============================================================

// Popular Nigerian banks (will appear at top)
const POPULAR_BANKS = [
    'Access Bank',
    'GTBank',
    'Zenith Bank',
    'First Bank of Nigeria',
    'UBA',
    'Fidelity Bank',
    'Stanbic IBTC Bank',
    'Sterling Bank',
    'Union Bank',
    'Wema Bank',
    'Kuda Bank',
    'Opay',
    'Palmpay',
    'Moniepoint'
];

// ✅ UPDATED: Load banks with search and popular sorting
async function loadBanksList() {
    try {
        const res = await fetch(`${API_URL}/api/banks/list`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to load banks');

        const data = await res.json();
        let banksList = data.banks || [];

        // Sort: Popular banks first, then alphabetically
        banksList.sort((a, b) => {
            const aIsPopular = POPULAR_BANKS.some(pop => a.name.includes(pop));
            const bIsPopular = POPULAR_BANKS.some(pop => b.name.includes(pop));
            
            if (aIsPopular && !bIsPopular) return -1;
            if (!aIsPopular && bIsPopular) return 1;
            return a.name.localeCompare(b.name);
        });

        // Create search input
        const searchWrapper = document.createElement('div');
        searchWrapper.style.cssText = 'position:relative;margin-bottom:10px;';
        searchWrapper.innerHTML = `
            <input 
                type="text" 
                id="bankSearch" 
                placeholder="🔍 Search bank name..."
                style="width:100%;padding:12px 15px;border:1px solid var(--border-color);border-radius:8px;font-size:14px;background:var(--bg-card);color:var(--text-main);"
            />
        `;

        // Insert search above select
        bankNameSelect.parentNode.insertBefore(searchWrapper, bankNameSelect);

        // Populate dropdown
        renderBankOptions(banksList);

        // Setup search functionality
        const searchInput = document.getElementById('bankSearch');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = banksList.filter(bank => 
                bank.name.toLowerCase().includes(searchTerm)
            );
            renderBankOptions(filtered);
        });
        
    } catch (err) {
        console.error('Banks list error:', err);
        showToast('error', 'Error', 'Failed to load banks list');
    }
}

// ✅ NEW: Render bank options
function renderBankOptions(banks) {
    bankNameSelect.innerHTML = '<option value="">-- Select Bank --</option>';
    
    banks.forEach(bank => {
        const option = document.createElement('option');
        option.value = bank.code;
        option.textContent = bank.name;
        option.dataset.bankName = bank.name;
        
        // Add emoji for popular banks
        const isPopular = POPULAR_BANKS.some(pop => bank.name.includes(pop));
        if (isPopular) {
            option.textContent = '⭐ ' + bank.name;
        }
        
        bankNameSelect.appendChild(option);
    });
}

// ============================================================
// ALTERNATIVE: Pure Select2 Style (More Advanced)
// ============================================================

// If you want fancy dropdown with icons and search built-in,
// add this to your HTML <head>:
/*
<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />
<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
*/

// Then use this instead:
function initSelect2() {
    $(bankNameSelect).select2({
        placeholder: '🔍 Search bank...',
        allowClear: true,
        width: '100%',
        templateResult: formatBankOption,
        templateSelection: formatBankOption
    });
}

function formatBankOption(bank) {
    if (!bank.id) return bank.text;
    
    const isPopular = POPULAR_BANKS.some(pop => bank.text.includes(pop));
    const icon = isPopular ? '⭐' : '🏦';
    
    return $(`<span>${icon} ${bank.text}</span>`);
}

/*/ ======== LOAD NIGERIAN BANKS (FOR DROPDOWN) ========
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
            option.value = bank.code;
            option.textContent = bank.name;
            option.dataset.bankName = bank.name;
            bankNameSelect.appendChild(option);
        });
        
    } catch (err) {
        showToast('error', 'Error', 'Failed to load banks list');
    }
}*/

// ======== VERIFY ACCOUNT NAME VIA PAYSTACK ========
accountNumberInput.addEventListener('input', function() {
    const accountNumber = this.value.trim();
    const bankCode = bankNameSelect.value;

    if (verificationTimeout) clearTimeout(verificationTimeout);
    accountNameInput.value = '';

    if (accountNumber.length === 10 && bankCode) {
        accountNameInput.value = 'Verifying...';
        accountNameInput.style.color = 'var(--warning)';

        verificationTimeout = setTimeout(async () => {
            await verifyAccountName(bankCode, accountNumber);
        }, 1000);
    }
});

bankNameSelect.addEventListener('change', function() {
    accountNumberInput.value = '';
    accountNameInput.value = '';
});

async function verifyAccountName(bankCode, accountNumber) {
    try {
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

        accountNameInput.value = data.accountName;
        accountNameInput.style.color = 'var(--success)';
        showToast('success', 'Verified', `Account: ${data.accountName}`);

    } catch (err) {
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
        showToast('error', 'Incomplete Form', 'Please fill all fields');
        return;
    }

    const btn = e.target.querySelector('.submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
        const res = await fetch(`${API_URL}/api/banks/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bankName, bankCode, accountNumber, accountName })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to add bank');

        showToast('success', 'Bank Added', 'Bank account successfully added');
        await loadUserBanks();
        addBankForm.reset();
        accountNameInput.value = '';

    } catch (err) {
        showToast('error', 'Failed', err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Bank Account';
    }
});

// ======== SET PIN ========
setPinForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const pin = Array.from(document.querySelectorAll('.pin-digit[id^="pin"]')).map(i => i.value).join('');
    const confirmPin = Array.from(document.querySelectorAll('.pin-digit[id^="confirmPin"]')).map(i => i.value).join('');

    if (pin.length !== 4 || pin !== confirmPin) {
        showToast('error', 'Validation Error', 'PINs must match and be 4 digits');
        return;
    }

    const btn = e.target.querySelector('.submit-btn');
    btn.disabled = true;

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

        // ✅ UPDATE LOCAL STORAGE SO UI HIDDEN ON NEXT LOAD
        const userData = JSON.parse(localStorage.getItem('earncial_user'));
        userData.hasPin = true;
        localStorage.setItem('earncial_user', JSON.stringify(userData));

        showToast('success', 'PIN Set', 'Security PIN created successfully');
        updatePinUI(); // Hide the card immediately

    } catch (err) {
        showToast('error', 'Failed', err.message);
    } finally {
        btn.disabled = false;
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

    } catch (err) {
        showToast('error', 'Error', 'Failed to load your bank accounts');
    }
}

// ======== RENDER BANKS TABLE ========
function renderBanksTable() {
    if (banks.length === 0) {
        banksTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">No Bank Accounts Found</td></tr>`;
        return;
    }

    banksTableBody.innerHTML = '';
    banks.forEach((bank, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><span class="bank-badge"><i class="fas fa-university"></i> ${bank.bankName}</span></td>
            <td><strong>${bank.accountNumber}</strong></td>
            <td>${bank.accountName}</td>
            <td>${bank.isPrimary ? '<span class="primary-badge">Primary</span>' : 'Secondary'}</td>
            <td>${formatDate(bank.createdAt)}</td>
            <td>
                ${!bank.isPrimary ? `<button onclick="setPrimary('${bank._id}')" class="action-btn btn-primary"><i class="fas fa-star"></i></button>` : ''}
                <button onclick="confirmDelete('${bank._id}')" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>
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
        if (!res.ok) throw new Error('Failed to update primary bank');
        showToast('success', 'Updated', 'Primary bank updated');
        await loadUserBanks();
    } catch (err) {
        showToast('error', 'Failed', err.message);
    }
}

// ======== DELETE BANK ========
async function deleteBank() {
    if (!bankToDelete) return;
    try {
        const res = await fetch(`${API_URL}/api/banks/delete/${bankToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete bank');
        showToast('success', 'Deleted', 'Account removed');
        closeDeleteModal();
        await loadUserBanks();
    } catch (err) {
        showToast('error', 'Failed', err.message);
    }
}

function confirmDelete(bankId) { bankToDelete = bankId; deleteModal.classList.add('active'); }
function closeDeleteModal() { deleteModal.classList.remove('active'); bankToDelete = null; }

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function logout() {
    console.log('logout() function called');
    // Open modal instead of confirm
    const modal = document.getElementById('logoutModal');
    console.log('Modal element:', modal);
    if (modal) {
        modal.classList.add('active');
        console.log('Modal active class added');
    } else {
        console.error('Modal not found!');
    }
}

// ======== INIT ========
async function init() {
    if (!checkAuth()) return;
    loadTheme();
    setupPinInputs();
    updatePinUI(); // ✅ Check PIN status on load
    await loadBanksList();
    await loadUserBanks();
    setupLogoutModal(); // ✅ Setup logout modal
}


// ============================================================
// LOGOUT MODAL SETUP
// ============================================================
function setupLogoutModal() {
    console.log('setupLogoutModal called');
    
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const modal = document.getElementById('logoutModal');
    const logoutBtn = document.getElementById('logoutBtn');
    
    console.log('Elements found:', {
        cancelBtn: !!cancelBtn,
        confirmBtn: !!confirmBtn,
        modal: !!modal,
        logoutBtn: !!logoutBtn
    });
    
    // Setup logout button to open modal
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logout button clicked');
            if (modal) {
                modal.classList.add('active');
                console.log('Modal opened');
            }
        });
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel clicked');
            if (modal) modal.classList.remove('active');
        });
    }
    
    // Confirm button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            console.log('Confirm logout clicked');
            localStorage.clear();
            window.location.href = 'sign-in.html';
        });
    }
}

window.addEventListener('DOMContentLoaded', init);

// Expose functions
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.setPrimary = setPrimary;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.deleteBank = deleteBank;