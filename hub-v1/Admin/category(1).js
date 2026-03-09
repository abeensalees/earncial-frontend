
// ================================================
// EARNCIAL ADMIN - COMPLETE WITH ICON PICKER
// ================================================

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

if (!token) {
    alert('Admin login required');
    window.location.href = 'sign-in.html';
}

let categories = [];
let taskTypes = [];
let editingCategory = null;
let editingTaskType = null;

// ============ AVAILABLE ICONS ============
const AVAILABLE_ICONS = [
    // Social Media
    { class: 'fab fa-facebook-f', name: 'Facebook', category: 'social' },
    { class: 'fab fa-twitter', name: 'Twitter', category: 'social' },
    { class: 'fab fa-instagram', name: 'Instagram', category: 'social' },
    { class: 'fab fa-youtube', name: 'YouTube', category: 'social' },
    { class: 'fab fa-tiktok', name: 'TikTok', category: 'social' },
    { class: 'fab fa-linkedin-in', name: 'LinkedIn', category: 'social' },
    { class: 'fab fa-whatsapp', name: 'WhatsApp', category: 'social' },
    { class: 'fab fa-telegram', name: 'Telegram', category: 'social' },
    { class: 'fab fa-snapchat', name: 'Snapchat', category: 'social' },
    { class: 'fab fa-pinterest', name: 'Pinterest', category: 'social' },
    { class: 'fab fa-reddit', name: 'Reddit', category: 'social' },
    { class: 'fab fa-discord', name: 'Discord', category: 'social' },
    { class: 'fab fa-threads', name: 'Threads', category: 'social' },
    { class: 'fab fa-x-twitter', name: 'X', category: 'social' },
    
    // Actions
    { class: 'fas fa-heart', name: 'Like', category: 'action' },
    { class: 'fas fa-thumbs-up', name: 'Thumbs Up', category: 'action' },
    { class: 'fas fa-comment', name: 'Comment', category: 'action' },
    { class: 'fas fa-share', name: 'Share', category: 'action' },
    { class: 'fas fa-retweet', name: 'Retweet', category: 'action' },
    { class: 'fas fa-user-plus', name: 'Follow', category: 'action' },
    { class: 'fas fa-bell', name: 'Subscribe', category: 'action' },
    { class: 'fas fa-bookmark', name: 'Bookmark', category: 'action' },
    { class: 'fas fa-eye', name: 'View', category: 'action' },
    { class: 'fas fa-play', name: 'Play', category: 'action' },
    { class: 'fas fa-download', name: 'Download', category: 'action' },
    { class: 'fas fa-shopping-cart', name: 'Cart', category: 'action' },
    { class: 'fas fa-star', name: 'Star', category: 'action' },
    { class: 'fas fa-paper-plane', name: 'Send', category: 'action' },
    { class: 'fas fa-mouse-pointer', name: 'Click', category: 'action' },
    { class: 'fas fa-crown', name: 'Premium', category: 'action' },
    
    // General
    { class: 'fas fa-globe', name: 'Globe', category: 'general' },
    { class: 'fas fa-tasks', name: 'Tasks', category: 'general' },
    { class: 'fas fa-check-circle', name: 'Check', category: 'general' },
    { class: 'fas fa-award', name: 'Award', category: 'general' },
    { class: 'fas fa-bullhorn', name: 'Promote', category: 'general' },
    { class: 'fas fa-lightbulb', name: 'Idea', category: 'general' },
    { class: 'fas fa-gift', name: 'Gift', category: 'general' },
    { class: 'fas fa-trophy', name: 'Trophy', category: 'general' },
    { class: 'fas fa-fire', name: 'Fire', category: 'general' },
    { class: 'fas fa-rocket', name: 'Rocket', category: 'general' },
    { class: 'fas fa-chart-line', name: 'Chart', category: 'general' },
    { class: 'fas fa-users', name: 'Users', category: 'general' }
];

// ============ ICON PICKER ============
function initIconPicker(inputId) {
    const input = document.getElementById(inputId);
    
    if (!input) return;

    // Create picker wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'icon-picker-wrapper';
    wrapper.style.position = 'relative';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    
    // Create preview icon
    const previewIcon = document.createElement('i');
    previewIcon.className = input.value || 'fas fa-globe';
    previewIcon.style.cssText = 'position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:20px;color:var(--primary);pointer-events:none;';
    wrapper.appendChild(previewIcon);
    
    input.style.paddingRight = '45px';
    input.style.cursor = 'pointer';
    input.setAttribute('readonly', 'true');
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'icon-dropdown';
    dropdown.style.cssText = `
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-top: 4px;
        max-height: 350px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    dropdown.innerHTML = `
        <div class="icon-search" style="position:sticky;top:0;padding:12px;background:var(--card-bg);border-bottom:1px solid var(--border);z-index:10;">
            <input type="text" 
                   placeholder="Search icons..." 
                   id="${inputId}_search"
                   style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);font-size:14px;">
        </div>
        <div class="icon-grid" id="${inputId}_grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:4px;padding:8px;"></div>
    `;
    wrapper.appendChild(dropdown);
    
    // Render icons
    function renderIcons(filter = '') {
        const grid = document.getElementById(`${inputId}_grid`);
        grid.innerHTML = '';
        
        const filtered = AVAILABLE_ICONS.filter(icon => 
            icon.name.toLowerCase().includes(filter.toLowerCase()) ||
            icon.class.toLowerCase().includes(filter.toLowerCase()) ||
            icon.category.toLowerCase().includes(filter.toLowerCase())
        );
        
        if (filtered.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-muted);">No icons found</div>';
            return;
        }
        
        filtered.forEach(icon => {
            const option = document.createElement('div');
            option.className = 'icon-option';
            option.style.cssText = `
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                padding:12px 8px;
                cursor:pointer;
                border-radius:6px;
                transition:all 0.2s;
                text-align:center;
            `;
            
            if (input.value === icon.class) {
                option.style.background = 'var(--primary)';
                option.style.color = 'white';
            }
            
            option.innerHTML = `
                <i class="${icon.class}" style="font-size:24px;margin-bottom:4px;color:${input.value === icon.class ? 'white' : 'var(--primary)'}"></i>
                <span style="font-size:10px;color:${input.value === icon.class ? 'white' : 'var(--text-muted)'};word-break:break-word;">${icon.name}</span>
            `;
            
            option.onmouseover = () => {
                if (input.value !== icon.class) {
                    option.style.background = 'var(--primary-light, rgba(0,123,255,0.1))';
                }
            };
            
            option.onmouseout = () => {
                if (input.value !== icon.class) {
                    option.style.background = 'transparent';
                }
            };
            
            option.onclick = () => {
                input.value = icon.class;
                previewIcon.className = icon.class;
                dropdown.style.display = 'none';
                
                // Update all options
                renderIcons(document.getElementById(`${inputId}_search`).value);
            };
            
            grid.appendChild(option);
        });
    }
    
    renderIcons();
    
    // Toggle dropdown
    input.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = dropdown.style.display === 'block';
        
        // Close all other dropdowns
        document.querySelectorAll('.icon-dropdown').forEach(d => {
            d.style.display = 'none';
        });
        
        dropdown.style.display = isActive ? 'none' : 'block';
        
        if (!isActive) {
            document.getElementById(`${inputId}_search`).focus();
        }
    });
    
    // Search
    const searchInput = document.getElementById(`${inputId}_search`);
    searchInput.addEventListener('input', (e) => {
        renderIcons(e.target.value);
    });
    
    searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// ============ UI FUNCTIONS ============
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

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = 'fas fa-sun';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
            <p>${message}</p>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 5000);
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
        btn.classList.add('loading');
    } else {
        btn.classList.remove('loading');
    }
}

// ============ LOAD CATEGORIES ============
async function loadCategories() {
    try {
        const res = await fetch(`${API_URL}/api/admin/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to load categories');
        }
        const data = await res.json();
        categories = data.categories || data || [];
        renderCategories();
        populateCategorySelect();
    } catch (err) {
        console.error('Load categories error:', err);
        showToast(err.message || 'Error loading categories', 'error');
    }
}

function renderCategories() {
    const tbody = document.getElementById('categoriesTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!categories || categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">No categories found</td></tr>';
        return;
    }

    categories.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cat.displayName || cat.name}</strong><br><code style="font-size:11px;">${cat.name}</code></td>
            <td><i class="${cat.icon || 'fas fa-globe'}" style="font-size:22px;color:var(--primary);"></i></td>
            <td><span class="status-badge ${cat.isActive ? 'status-active' : 'status-inactive'}">${cat.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${cat.order || 0}</td>
            <td class="actions">
                <button class="btn btn-sm btn-warning" onclick="editCategory('${cat._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteCategory('${cat._id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function populateCategorySelect() {
    const select = document.getElementById('typeCategory');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Select Category --</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat._id;
        opt.textContent = cat.displayName || cat.name;
        select.appendChild(opt);
    });
}

// ============ CATEGORY CRUD ============
async function saveCategory() {
    const nameEl = document.getElementById('catName');
    const displayEl = document.getElementById('catDisplayName');
    const iconEl = document.getElementById('catIcon');
    const orderEl = document.getElementById('catOrder');

    if (!nameEl || !displayEl) {
        showToast('Form elements not found', 'error');
        return;
    }

    const data = {
        name: nameEl.value.trim().toLowerCase(),
        displayName: displayEl.value.trim(),
        icon: iconEl ? iconEl.value.trim() || 'fas fa-globe' : 'fas fa-globe',
        order: orderEl ? parseInt(orderEl.value) || 0 : 0
    };

    if (!data.name || !data.displayName) {
        showToast('Name and Display Name required', 'error');
        return;
    }

    setLoading('saveCatBtn', true);

    try {
        const method = editingCategory ? 'PUT' : 'POST';
        const url = editingCategory 
            ? `${API_URL}/api/admin/categories/${editingCategory}` 
            : `${API_URL}/api/admin/categories`;

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to save');

        showToast(editingCategory ? 'Category updated!' : 'Category created!', 'success');
        await loadCategories();
        resetCategoryForm();
    } catch (err) {
        console.error('Save category error:', err);
        showToast(err.message, 'error');
    } finally {
        setLoading('saveCatBtn', false);
    }
}

function editCategory(id) {
    const cat = categories.find(c => c._id === id);
    if (!cat) return;

    editingCategory = id;
    
    const nameEl = document.getElementById('catName');
    const displayEl = document.getElementById('catDisplayName');
    const iconEl = document.getElementById('catIcon');
    const orderEl = document.getElementById('catOrder');
    const btnText = document.querySelector('#saveCatBtn .btn-text');

    if (nameEl) nameEl.value = cat.name;
    if (displayEl) displayEl.value = cat.displayName;
    if (iconEl) {
        iconEl.value = cat.icon || 'fas fa-globe';
        // Update preview icon
        const previewIcon = iconEl.parentElement.querySelector('i');
        if (previewIcon) previewIcon.className = cat.icon || 'fas fa-globe';
    }
    if (orderEl) orderEl.value = cat.order || 0;
    if (btnText) btnText.innerHTML = '<i class="fas fa-save"></i> Update Category';
}

function confirmDeleteCategory(id) {
    if (confirm('Deactivate this category?')) {
        deleteCategory(id);
    }
}

async function deleteCategory(id) {
    try {
        const res = await fetch(`${API_URL}/api/admin/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed');
        showToast('Category deactivated', 'success');
        await loadCategories();
    } catch (err) {
        showToast('Error deactivating category', 'error');
    }
}

function resetCategoryForm() {
    editingCategory = null;
    
    const nameEl = document.getElementById('catName');
    const displayEl = document.getElementById('catDisplayName');
    const iconEl = document.getElementById('catIcon');
    const orderEl = document.getElementById('catOrder');
    const btnText = document.querySelector('#saveCatBtn .btn-text');

    if (nameEl) nameEl.value = '';
    if (displayEl) displayEl.value = '';
    if (iconEl) {
        iconEl.value = 'fas fa-globe';
        const previewIcon = iconEl.parentElement.querySelector('i');
        if (previewIcon) previewIcon.className = 'fas fa-globe';
    }
    if (orderEl) orderEl.value = '0';
    if (btnText) btnText.innerHTML = '<i class="fas fa-save"></i> Save Category';
}

// ============ LOAD TASK TYPES ============
async function loadTaskTypes() {
    try {
        const res = await fetch(`${API_URL}/api/admin/task-types`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        taskTypes = data.taskTypes || data || [];
        renderTaskTypes();
    } catch (err) {
        console.error('Load task types error:', err);
        showToast('Error loading task types', 'error');
    }
}

function renderTaskTypes() {
    const tbody = document.getElementById('taskTypesTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!taskTypes || taskTypes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No task types found</td></tr>';
        return;
    }

    taskTypes.forEach(type => {
        const cat = categories.find(c => c._id === (type.category?._id || type.category));
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cat ? cat.displayName : 'Unknown'}</td>
            <td><strong>${type.displayName || type.name}</strong><br><code style="font-size:11px;">${type.name}</code></td>
            <td>₦${type.reward}</td>
            <td>${type.duration}s</td>
            <td><i class="${type.icon || 'fas fa-tasks'}" style="font-size:22px;color:var(--primary);"></i></td>
            <td><span class="status-badge ${type.isActive ? 'status-active' : 'status-inactive'}">${type.isActive ? 'Active' : 'Inactive'}</span></td>
            <td class="actions">
                <button class="btn btn-sm btn-warning" onclick="editTaskType('${type._id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteTaskType('${type._id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ============ TASK TYPE CRUD ============
async function saveTaskType() {
    const catEl = document.getElementById('typeCategory');
    const nameEl = document.getElementById('typeName');
    const displayEl = document.getElementById('typeDisplayName');
    const descEl = document.getElementById('typeDescription');
    const rewardEl = document.getElementById('typeReward');
    const durationEl = document.getElementById('typeDuration');
    const iconEl = document.getElementById('typeIcon');
    const orderEl = document.getElementById('typeOrder');

    if (!catEl || !nameEl || !displayEl || !descEl || !rewardEl || !durationEl) {
        showToast('Form elements not found', 'error');
        return;
    }

    const data = {
        category: catEl.value,
        name: nameEl.value.trim().toLowerCase(),
        displayName: displayEl.value.trim(),
        description: descEl.value.trim(),
        reward: parseInt(rewardEl.value),
        duration: parseInt(durationEl.value),
        icon: iconEl ? iconEl.value.trim() || 'fas fa-tasks' : 'fas fa-tasks',
        order: orderEl ? parseInt(orderEl.value) || 0 : 0
    };

    if (!data.category || !data.name || !data.displayName || !data.description || isNaN(data.reward) || isNaN(data.duration)) {
        showToast('Please fill all fields correctly', 'error');
        return;
    }

    setLoading('saveTypeBtn', true);

    try {
        const method = editingTaskType ? 'PUT' : 'POST';
        const url = editingTaskType 
            ? `${API_URL}/api/admin/task-types/${editingTaskType}` 
            : `${API_URL}/api/admin/task-types`;

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed');

        showToast(editingTaskType ? 'Task type updated!' : 'Task type created!', 'success');
        await loadTaskTypes();
        resetTaskTypeForm();
    } catch (err) {
        console.error('Save task type error:', err);
        showToast(err.message, 'error');
    } finally {
        setLoading('saveTypeBtn', false);
    }
}

function editTaskType(id) {
    const type = taskTypes.find(t => t._id === id);
    if (!type) return;

    editingTaskType = id;
    
    const catEl = document.getElementById('typeCategory');
    const nameEl = document.getElementById('typeName');
    const displayEl = document.getElementById('typeDisplayName');
    const descEl = document.getElementById('typeDescription');
    const rewardEl = document.getElementById('typeReward');
    const durationEl = document.getElementById('typeDuration');
    const iconEl = document.getElementById('typeIcon');
    const orderEl = document.getElementById('typeOrder');
    const btnText = document.querySelector('#saveTypeBtn .btn-text');

    if (catEl) catEl.value = type.category?._id || type.category;
    if (nameEl) nameEl.value = type.name;
    if (displayEl) displayEl.value = type.displayName;
    if (descEl) descEl.value = type.description;
    if (rewardEl) rewardEl.value = type.reward;
    if (durationEl) durationEl.value = type.duration;
    if (iconEl) {
        iconEl.value = type.icon || 'fas fa-tasks';
        const previewIcon = iconEl.parentElement.querySelector('i');
        if (previewIcon) previewIcon.className = type.icon || 'fas fa-tasks';
    }
    if (orderEl) orderEl.value = type.order || 0;
    if (btnText) btnText.innerHTML = '<i class="fas fa-save"></i> Update Task Type';
}

function confirmDeleteTaskType(id) {
    if (confirm('Deactivate this task type?')) {
        deleteTaskType(id);
    }
}

async function deleteTaskType(id) {
    try {
        const res = await fetch(`${API_URL}/api/admin/task-types/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed');
        showToast('Task type deactivated', 'success');
        await loadTaskTypes();
    } catch (err) {
        showToast('Error', 'error');
    }
}

function resetTaskTypeForm() {
    editingTaskType = null;
    
    const catEl = document.getElementById('typeCategory');
    const nameEl = document.getElementById('typeName');
    const displayEl = document.getElementById('typeDisplayName');
    const descEl = document.getElementById('typeDescription');
    const rewardEl = document.getElementById('typeReward');
    const durationEl = document.getElementById('typeDuration');
    const iconEl = document.getElementById('typeIcon');
    const orderEl = document.getElementById('typeOrder');
    const btnText = document.querySelector('#saveTypeBtn .btn-text');

    if (catEl) catEl.value = '';
    if (nameEl) nameEl.value = '';
    if (displayEl) displayEl.value = '';
    if (descEl) descEl.value = '';
    if (rewardEl) rewardEl.value = '10';
    if (durationEl) durationEl.value = '30';
    if (iconEl) {
        iconEl.value = 'fas fa-thumbs-up';
        const previewIcon = iconEl.parentElement.querySelector('i');
        if (previewIcon) previewIcon.className = 'fas fa-thumbs-up';
    }
    if (orderEl) orderEl.value = '0';
    if (btnText) btnText.innerHTML = '<i class="fas fa-save"></i> Save Task Type';
}

// ============ LOGOUT ============
function logout() {
    if (confirm('Logout?')) {
        localStorage.clear();
        window.location.href = 'sign-in.html';
    }
}

// ============ INIT ============
async function init() {
    console.log('🚀 Admin Panel Initializing...');
    await loadCategories();
    await loadTaskTypes();
    
    // Initialize icon pickers after DOM is ready
    setTimeout(() => {
        initIconPicker('catIcon');
        initIconPicker('typeIcon');
        console.log('✅ Icon Pickers Initialized!');
    }, 500);
    
    console.log('✅ Admin Panel Ready!');
}

window.addEventListener('DOMContentLoaded', init);

// Close sidebar on mobile click outside
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.querySelector('.menu-toggle');
    if (sidebar && toggle && window.innerWidth <= 768 && sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        closeSidebar();
    }
});

console.log('📄 Admin JS Loaded');