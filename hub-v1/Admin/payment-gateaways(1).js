// ================================================
// EARNCIAL ADMIN - PAYMENT GATEWAYS JAVASCRIPT
// ================================================

const API_URL = 'http://localhost:5000'; //Canza zuwa live server link
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

// ============ STATE VARIABLES ============
let allGateways = [];
let currentGateway = null;
let isEditMode = false;

// ============ CHECK AUTH ============
if (!token) {
    alert('Please login first');
    window.location.href = 'admin-login.html';
}

// ============ SIDEBAR FUNCTIONS ============
function openSidebar() {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
}

// ============ THEME TOGGLE ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.theme-toggle i');
    
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('admin_theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('admin_theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('admin_theme');
    const icon = document.querySelector('.theme-toggle i');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// ============ TOAST NOTIFICATION ============
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
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

// ============ LOAD ALL GATEWAYS ============
async function loadGateways() {
    try {
        console.log('📥 Loading payment gateways...');
        
        showLoading();
        
        const res = await fetch(`${API_URL}/api/admin/payment-gateways`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            throw new Error('Failed to load payment gateways');
        }

        const data = await res.json();
        allGateways = data.gateways || [];
        
        console.log('✅ Loaded gateways:', allGateways.length);
        
        renderGateways();
        updateStats();
        
    } catch (err) {
        console.error('❌ Load gateways error:', err);
        showToast('error', 'Error', err.message || 'Failed to load payment gateways');
        showEmptyState();
    }
}

// ============ RENDER GATEWAYS ============
function renderGateways() {
    const grid = document.getElementById('gatewaysGrid');
    grid.innerHTML = '';

    if (allGateways.length === 0) {
        showEmptyState();
        return;
    }

    allGateways.forEach(gateway => {
        const card = createGatewayCard(gateway);
        grid.appendChild(card);
    });
}

// ============ CREATE GATEWAY CARD ============
function createGatewayCard(gateway) {
    const card = document.createElement('div');
    card.className = `gateway-card ${!gateway.enabled ? 'disabled' : ''}`;
    
    const methods = gateway.supportedMethods || [];
    const methodIcons = {
        card: 'fa-credit-card',
        bank_transfer: 'fa-university',
        ussd: 'fa-mobile-alt',
        mobile_money: 'fa-mobile',
        qr_code: 'fa-qrcode'
    };
    
    card.innerHTML = `
        <div class="gateway-header">
            <div class="gateway-info">
                <div class="gateway-icon">
                    <i class="${gateway.icon || 'fas fa-credit-card'}"></i>
                </div>
                <div class="gateway-name">
                    <h3>${gateway.displayName || gateway.name}</h3>
                    <p>${gateway.slug}</p>
                </div>
            </div>
            <div class="gateway-status">
                <span class="status-badge ${gateway.enabled ? 'active' : 'disabled'}">
                    ${gateway.enabled ? 'Active' : 'Disabled'}
                </span>
                ${gateway.testMode ? '<span class="status-badge test">Test</span>' : ''}
            </div>
        </div>

        <div class="gateway-details">
            <div class="detail-row">
                <span class="detail-label"><i class="fas fa-arrow-down"></i> Min Amount</span>
                <span class="detail-value">₦${gateway.config?.minimumAmount?.toLocaleString() || 0}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label"><i class="fas fa-arrow-up"></i> Max Amount</span>
                <span class="detail-value">₦${gateway.config?.maximumAmount?.toLocaleString() || 0}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label"><i class="fas fa-percentage"></i> Fee</span>
                <span class="detail-value">
                    ${gateway.config?.feeType === 'percentage' 
                        ? `${gateway.config?.transactionFee || 0}%` 
                        : gateway.config?.feeType === 'fixed'
                        ? `₦${gateway.config?.transactionFee || 0}`
                        : 'None'}
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label"><i class="fas fa-clock"></i> Processing</span>
                <span class="detail-value">${gateway.config?.processingTime || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label"><i class="fas fa-chart-line"></i> Transactions</span>
                <span class="detail-value">${gateway.stats?.totalTransactions || 0}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label"><i class="fas fa-sort-numeric-up"></i> Priority</span>
                <span class="detail-value">${gateway.priority || 0}</span>
            </div>
        </div>

        ${methods.length > 0 ? `
            <div class="methods-list">
                ${methods.map(method => `
                    <span class="method-badge">
                        <i class="fas ${methodIcons[method] || 'fa-check'}"></i>
                        ${method.replace('_', ' ')}
                    </span>
                `).join('')}
            </div>
        ` : ''}

        <div class="gateway-actions">
            <button class="action-btn edit" onclick="editGateway('${gateway._id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn toggle ${!gateway.enabled ? 'disabled' : ''}" onclick="toggleGateway('${gateway._id}')">
                <i class="fas fa-${gateway.enabled ? 'pause' : 'play'}"></i>
                ${gateway.enabled ? 'Disable' : 'Enable'}
            </button>
            <button class="action-btn delete" onclick="deleteGateway('${gateway._id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    return card;
}

// ============ UPDATE STATS ============
function updateStats() {
    const active = allGateways.filter(g => g.enabled).length;
    const disabled = allGateways.filter(g => !g.enabled).length;
    const testMode = allGateways.filter(g => g.testMode).length;
    const total = allGateways.length;

    document.getElementById('activeCount').textContent = active;
    document.getElementById('disabledCount').textContent = disabled;
    document.getElementById('testModeCount').textContent = testMode;
    document.getElementById('totalCount').textContent = total;
}

// ============ SEARCH GATEWAYS ============
function searchGateways() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filtered = allGateways.filter(gateway => 
        gateway.name.toLowerCase().includes(searchTerm) ||
        gateway.displayName.toLowerCase().includes(searchTerm) ||
        gateway.slug.toLowerCase().includes(searchTerm) ||
        (gateway.description || '').toLowerCase().includes(searchTerm)
    );

    const grid = document.getElementById('gatewaysGrid');
    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Results Found</h3>
                <p>No payment gateways match your search</p>
            </div>
        `;
        return;
    }

    filtered.forEach(gateway => {
        const card = createGatewayCard(gateway);
        grid.appendChild(card);
    });
}

// ============ SEED DEFAULT GATEWAYS ============
async function seedGateways() {
    if (!confirm('This will create default payment gateways (Paystack, Flutterwave, etc). Continue?')) {
        return;
    }

    try {
        console.log('🌱 Seeding default gateways...');
        
        const res = await fetch(`${API_URL}/api/admin/payment-gateways/seed`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to seed gateways');
        }

        showToast('success', 'Seeded Successfully', 'Default payment gateways created');
        await loadGateways();
        
    } catch (err) {
        console.error('❌ Seed gateways error:', err);
        showToast('error', 'Seed Failed', err.message);
    }
}

// ============ OPEN ADD MODAL ============
function openAddModal() {
    isEditMode = false;
    currentGateway = null;
    
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add Payment Gateway';
    document.getElementById('gatewayForm').reset();
    
    // Set defaults
    document.getElementById('icon').value = 'fas fa-credit-card';
    document.getElementById('minAmount').value = 100;
    document.getElementById('maxAmount').value = 1000000;
    document.getElementById('transactionFee').value = 0;
    document.getElementById('feeType').value = 'none';
    document.getElementById('processingTime').value = 'Instant';
    document.getElementById('priority').value = 0;
    document.getElementById('testMode').checked = true;
    
    document.getElementById('gatewayModal').classList.add('active');
}

// ============ EDIT GATEWAY ============
async function editGateway(gatewayId) {
    try {
        currentGateway = allGateways.find(g => g._id === gatewayId);
        if (!currentGateway) throw new Error('Gateway not found');

        isEditMode = true;
        
        console.log('📝 Editing gateway:', currentGateway.name);

        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Payment Gateway';
        
        // Fill form
        document.getElementById('gatewayName').value = currentGateway.name;
        document.getElementById('displayName').value = currentGateway.displayName;
        document.getElementById('slug').value = currentGateway.slug;
        document.getElementById('icon').value = currentGateway.icon || 'fas fa-credit-card';
        document.getElementById('description').value = currentGateway.description || '';
        document.getElementById('priority').value = currentGateway.priority || 0;
        document.getElementById('testMode').checked = currentGateway.testMode || false;
        
        // Credentials
        document.getElementById('publicKey').value = currentGateway.credentials?.publicKey || '';
        document.getElementById('secretKey').value = currentGateway.credentials?.secretKey || '';
        document.getElementById('merchantId').value = currentGateway.credentials?.merchantId || '';
        document.getElementById('contractCode').value = currentGateway.credentials?.contractCode || '';
        document.getElementById('apiKey').value = currentGateway.credentials?.apiKey || '';
        
        // Config
        document.getElementById('minAmount').value = currentGateway.config?.minimumAmount || 100;
        document.getElementById('maxAmount').value = currentGateway.config?.maximumAmount || 1000000;
        document.getElementById('transactionFee').value = currentGateway.config?.transactionFee || 0;
        document.getElementById('feeType').value = currentGateway.config?.feeType || 'none';
        document.getElementById('processingTime').value = currentGateway.config?.processingTime || 'Instant';
        
        // Supported methods
        const methodCheckboxes = document.querySelectorAll('input[name="methods"]');
        methodCheckboxes.forEach(cb => {
            cb.checked = (currentGateway.supportedMethods || []).includes(cb.value);
        });
        
        // Webhook
        document.getElementById('webhookUrl').value = currentGateway.webhookUrl || '';
        
        document.getElementById('gatewayModal').classList.add('active');
        
    } catch (err) {
        console.error('❌ Edit gateway error:', err);
        showToast('error', 'Error', 'Failed to load gateway details');
    }
}

// ============ SAVE GATEWAY (CREATE/UPDATE) ============
document.getElementById('gatewayForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        // Get selected payment methods
        const methodCheckboxes = document.querySelectorAll('input[name="methods"]:checked');
        const supportedMethods = Array.from(methodCheckboxes).map(cb => cb.value);
        
        const gatewayData = {
            name: document.getElementById('gatewayName').value.trim(),
            displayName: document.getElementById('displayName').value.trim(),
            slug: document.getElementById('slug').value.trim().toLowerCase(),
            icon: document.getElementById('icon').value.trim(),
            description: document.getElementById('description').value.trim(),
            priority: parseInt(document.getElementById('priority').value) || 0,
            testMode: document.getElementById('testMode').checked,
            credentials: {
                publicKey: document.getElementById('publicKey').value.trim(),
                secretKey: document.getElementById('secretKey').value.trim(),
                merchantId: document.getElementById('merchantId').value.trim(),
                contractCode: document.getElementById('contractCode').value.trim(),
                apiKey: document.getElementById('apiKey').value.trim()
            },
            config: {
                minimumAmount: parseInt(document.getElementById('minAmount').value) || 100,
                maximumAmount: parseInt(document.getElementById('maxAmount').value) || 1000000,
                transactionFee: parseFloat(document.getElementById('transactionFee').value) || 0,
                feeType: document.getElementById('feeType').value,
                processingTime: document.getElementById('processingTime').value.trim()
            },
            supportedMethods: supportedMethods,
            webhookUrl: document.getElementById('webhookUrl').value.trim(),
            enabled: currentGateway ? currentGateway.enabled : false
        };

        console.log('📤 Saving gateway:', gatewayData);

        const url = isEditMode 
            ? `${API_URL}/api/admin/payment-gateways/${currentGateway._id}`
            : `${API_URL}/api/admin/payment-gateways`;
        
        const method = isEditMode ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(gatewayData)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to save gateway');
        }

        const data = await res.json();
        
        showToast('success', 
            isEditMode ? 'Gateway Updated' : 'Gateway Created', 
            `${gatewayData.displayName} saved successfully`
        );
        
        closeModal();
        await loadGateways();
        
    } catch (err) {
        console.error('❌ Save gateway error:', err);
        showToast('error', 'Save Failed', err.message);
    }
});

// ============ TOGGLE GATEWAY (ENABLE/DISABLE) ============
async function toggleGateway(gatewayId) {
    try {
        const gateway = allGateways.find(g => g._id === gatewayId);
        if (!gateway) throw new Error('Gateway not found');

        const action = gateway.enabled ? 'disable' : 'enable';
        
        if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${gateway.displayName}?`)) {
            return;
        }

        console.log(`🔄 ${action}ing gateway:`, gateway.name);

        const res = await fetch(`${API_URL}/api/admin/payment-gateways/${gatewayId}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || `Failed to ${action} gateway`);
        }

        showToast('success', 
            'Gateway Updated', 
            `${gateway.displayName} ${action}d successfully`
        );
        
        await loadGateways();
        
    } catch (err) {
        console.error('❌ Toggle gateway error:', err);
        showToast('error', 'Toggle Failed', err.message);
    }
}

// ============ DELETE GATEWAY ============
async function deleteGateway(gatewayId) {
    try {
        const gateway = allGateways.find(g => g._id === gatewayId);
        if (!gateway) throw new Error('Gateway not found');

        if (!confirm(`Delete ${gateway.displayName}? This action cannot be undone!`)) {
            return;
        }

        console.log('🗑️ Deleting gateway:', gateway.name);

        const res = await fetch(`${API_URL}/api/admin/payment-gateways/${gatewayId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to delete gateway');
        }

        showToast('success', 'Gateway Deleted', `${gateway.displayName} deleted successfully`);
        await loadGateways();
        
    } catch (err) {
        console.error('❌ Delete gateway error:', err);
        showToast('error', 'Delete Failed', err.message);
    }
}

// ============ CLOSE MODAL ============
function closeModal() {
    document.getElementById('gatewayModal').classList.remove('active');
    currentGateway = null;
    isEditMode = false;
}

// ============ SHOW LOADING ============
function showLoading() {
    const grid = document.getElementById('gatewaysGrid');
    grid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

// ============ SHOW EMPTY STATE ============
function showEmptyState() {
    const grid = document.getElementById('gatewaysGrid');
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-credit-card"></i>
            <h3>No Payment Gateways</h3>
            <p>Get started by adding your first payment gateway or seeding defaults</p>
            <button class="btn btn-primary" onclick="seedGateways()" style="margin-top: 20px;">
                <i class="fas fa-seedling"></i> Seed Default Gateways
            </button>
        </div>
    `;
}

// ============ LOGOUT ============
function logout() {
    if (confirm('Logout from admin panel?')) {
        localStorage.clear();
        window.location.href = 'admin-login.html';
    }
}

// ============ AUTO-GENERATE SLUG ============
document.getElementById('gatewayName')?.addEventListener('input', function(e) {
    if (!isEditMode) {
        const slug = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        document.getElementById('slug').value = slug;
    }
});

// ============ AUTO-FILL DISPLAY NAME ============
document.getElementById('gatewayName')?.addEventListener('input', function(e) {
    if (!isEditMode && !document.getElementById('displayName').value) {
        document.getElementById('displayName').value = e.target.value;
    }
});

// ============ INITIALIZATION ============
async function init() {
    loadTheme();
    await loadGateways();
    showToast('info', 'Welcome', 'Payment Gateways Management');
}

window.addEventListener('DOMContentLoaded', init);

console.log('✅ Payment Gateways JS Loaded');


// ================================================
// MAKE FUNCTIONS GLOBAL (Saka wannan a karshen file din JS)
// ================================================

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.searchGateways = searchGateways;
window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.seedGateways = seedGateways;
window.editGateway = editGateway;
window.toggleGateway = toggleGateway;
window.deleteGateway = deleteGateway;
window.logout = logout;

console.log('✅ Functions attached to window global scope');
