
// ================================================
// EARNCIAL ADMIN - CONTENT MANAGER
// 4 Content Types: Announcements, Advertisements, Sponsored Ads, Polls
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('admin_token') || localStorage.getItem('earncial_token');

let currentTab = 'announcements';
let currentEditId = null;
let currentEditType = null;
let deleteTarget = null;
let deleteType = null;

// ============ AUTH CHECK ============
function checkAuth() {
    if (!token) {
        console.error('❌ No token found');
        showToast('error', 'Please login as admin first');
        setTimeout(() => window.location.href = 'admin-login.html', 2000);
        return false;
    }
    console.log('✅ Token found');
    return true;
}

// ============ SIDEBAR & THEME ============
function openSidebar() {
    document.getElementById('sidebar')?.classList.add('active');
    document.getElementById('sidebarOverlay')?.classList.add('active');
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('active');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('themeIcon');
    if (document.body.classList.contains('dark-mode')) {
        icon?.classList.remove('fa-moon');
        icon?.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon?.classList.remove('fa-sun');
        icon?.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

// ============ TOAST ============
function showToast(type, message) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        alert(message);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ============ TAB SWITCHING ============
function switchTab(tabName) {
    currentTab = tabName;
    console.log('🔄 Switching to tab:', tabName);
    
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = Array.from(document.querySelectorAll('.tab')).find(
        tab => tab.textContent.toLowerCase().includes(tabName)
    );
    activeTab?.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-content`)?.classList.add('active');
    
    if (tabName === 'announcements') loadAnnouncements();
    if (tabName === 'advertisements') loadAdvertisements();
    if (tabName === 'sponsored') loadSponsoredAds();
    if (tabName === 'polls') loadPolls();
}

// ============ MODAL ============
function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
    if (modalId.includes('announcement') || modalId.includes('advertisement') || 
        modalId.includes('sponsored') || modalId.includes('poll')) {
        currentEditId = null;
        currentEditType = null;
    }
}

// ============================================
// ANNOUNCEMENTS
// ============================================

function openAnnouncementModal(editData = null) {
    const modal = document.getElementById('announcementModal');
    const modalTitle = document.getElementById('announcementModalTitle');
    const submitBtnText = document.getElementById('announcementBtnText');
    
    if (editData) {
        currentEditId = editData._id;
        currentEditType = 'announcement';
        modalTitle.textContent = 'Edit Announcement';
        submitBtnText.textContent = 'Update';
        
        document.getElementById('announcementTitle').value = editData.title || '';
        document.getElementById('announcementIcon').value = editData.icon || '📢';
        document.getElementById('announcementMessage').value = editData.message || '';
        document.getElementById('announcementTarget').value = editData.targetAudience || 'all';
        document.getElementById('announcementStatus').value = editData.status || 'active';
    } else {
        currentEditId = null;
        currentEditType = null;
        modalTitle.textContent = 'Create Announcement';
        submitBtnText.textContent = 'Create';
        document.getElementById('announcementForm').reset();
    }
    
    modal.classList.add('active');
}

async function loadAnnouncements() {
    if (!checkAuth()) return;
    
    const tbody = document.getElementById('announcementsList');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading announcements...</p>
                </div>
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch(`${API_URL}/api/content/admin/announcements`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        
        const data = await res.json();
        const announcements = data.announcements || data.data || data || [];
        
        renderAnnouncements(announcements);
        
    } catch (err) {
        console.error('❌ Load announcements error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load announcements</h3>
                        <p>${err.message}</p>
                        <button class="btn btn-primary" onclick="loadAnnouncements()" style="margin-top: 16px;">
                            <i class="fas fa-sync"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        showToast('error', 'Failed to load announcements');
    }
}

function renderAnnouncements(announcements) {
    const tbody = document.getElementById('announcementsList');
    if (!tbody) return;
    
    if (!announcements || announcements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-bullhorn"></i>
                        <h3>No Announcements</h3>
                        <p>Create your first announcement to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = announcements.map(item => `
        <tr>
            <td style="font-size: 28px;">${item.icon || '📢'}</td>
            <td><strong>${item.title}</strong></td>
            <td style="max-width: 300px;">${item.message}</td>
            <td>
                <span class="badge badge-${item.targetAudience || 'all'}">
                    ${(item.targetAudience || 'all').toUpperCase()}
                </span>
            </td>
            <td>
                <button class="btn btn-sm ${item.status === 'active' ? 'btn-success' : 'btn-danger'}" 
                        onclick="toggleStatus('announcement', '${item._id}', '${item.status}')">
                    ${item.status === 'active' ? 'Active' : 'Inactive'}
                </button>
            </td>
            <td>${new Date(item.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm btn-icon" 
                            onclick='openAnnouncementModal(${JSON.stringify(item).replace(/'/g, "\\'")})'
                            title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm btn-icon" 
                            onclick="showDeleteModal('${item._id}', 'announcement')" 
                            title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ============ FORM SUBMISSION - ANNOUNCEMENT ============
document.addEventListener('DOMContentLoaded', () => {
    const announcementForm = document.getElementById('announcementForm');
    if (announcementForm) {
        announcementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                title: document.getElementById('announcementTitle')?.value.trim(),
                message: document.getElementById('announcementMessage')?.value.trim(),
                icon: document.getElementById('announcementIcon')?.value.trim() || '📢',
                targetAudience: document.getElementById('announcementTarget')?.value || 'all',
                status: document.getElementById('announcementStatus')?.value || 'active'
            };
            
            if (!data.title || !data.message) {
                showToast('error', 'Please fill in all required fields');
                return;
            }
            
            const submitBtn = document.getElementById('announcementSubmitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                const url = currentEditId 
                    ? `${API_URL}/api/content/announcements/${currentEditId}`
                    : `${API_URL}/api/content/announcements`;
                
                const method = currentEditId ? 'PUT' : 'POST';
                
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to save announcement');
                }
                
                showToast('success', `Announcement ${currentEditId ? 'updated' : 'created'} successfully!`);
                closeModal('announcementModal');
                announcementForm.reset();
                loadAnnouncements();
                
            } catch (err) {
                console.error('❌ Save announcement error:', err);
                showToast('error', err.message || 'Failed to save announcement');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// ============================================
// ADVERTISEMENTS
// ============================================

function openAdvertisementModal(editData = null) {
    const modal = document.getElementById('advertisementModal');
    const modalTitle = document.getElementById('advertisementModalTitle');
    const submitBtnText = document.getElementById('advertisementBtnText');
    const imageInput = document.getElementById('advertisementImage');
    
    if (editData) {
        currentEditId = editData._id;
        currentEditType = 'advertisement';
        modalTitle.textContent = 'Edit Advertisement';
        submitBtnText.textContent = 'Update';
        
        document.getElementById('advertisementTitle').value = editData.title || '';
        document.getElementById('advertisementPrice').value = editData.price || '';
        document.getElementById('advertisementDescription').value = editData.description || '';
        document.getElementById('advertisementActionText').value = editData.actionText || 'Learn More';
        document.getElementById('advertisementActionUrl').value = editData.actionUrl || '';
        document.getElementById('advertisementTarget').value = editData.targetAudience || 'all';
        document.getElementById('advertisementStatus').value = editData.status || 'active';
        
        // Show existing image
        if (editData.imageUrl) {
            const preview = document.getElementById('advertisementPreview');
            const previewImg = document.getElementById('advertisementPreviewImg');
            const imageUrl = editData.imageUrl.startsWith('http') 
                ? editData.imageUrl 
                : `${API_URL}${editData.imageUrl}`;
            previewImg.src = imageUrl;
            preview.classList.add('show');
        }
        
        imageInput.required = false; // Not required when editing
    } else {
        currentEditId = null;
        currentEditType = null;
        modalTitle.textContent = 'Create Advertisement';
        submitBtnText.textContent = 'Create';
        document.getElementById('advertisementForm').reset();
        document.getElementById('advertisementPreview').classList.remove('show');
        imageInput.required = true;
    }
    
    setupImagePreview('advertisement');
    modal.classList.add('active');
}

async function loadAdvertisements() {
    if (!checkAuth()) return;
    
    const tbody = document.getElementById('advertisementsList');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading advertisements...</p>
                </div>
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch(`${API_URL}/api/content/admin/advertisements`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        
        const data = await res.json();
        const advertisements = data.advertisements || data.data || data || [];
        
        renderAdvertisements(advertisements);
        
    } catch (err) {
        console.error('❌ Load advertisements error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load advertisements</h3>
                        <p>${err.message}</p>
                        <button class="btn btn-primary" onclick="loadAdvertisements()" style="margin-top: 16px;">
                            <i class="fas fa-sync"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        showToast('error', 'Failed to load advertisements');
    }
}

function renderAdvertisements(advertisements) {
    const tbody = document.getElementById('advertisementsList');
    if (!tbody) return;
    
    if (!advertisements || advertisements.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-rectangle-ad"></i>
                        <h3>No Advertisements</h3>
                        <p>Create your first advertisement to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = advertisements.map(ad => {
        const imageUrl = ad.imageUrl?.startsWith('http') 
            ? ad.imageUrl 
            : ad.imageUrl?.startsWith('/') 
              ? `${API_URL}${ad.imageUrl}`
              : `${API_URL}/uploads/ads/${ad.imageUrl}`;
        
        return `
            <tr>
                <td>
                    <img src="${imageUrl}" 
                         alt="${ad.title}" 
                         style="width: 70px; height: 70px; object-fit: cover; border-radius: 10px; cursor: pointer; box-shadow: var(--shadow-sm);"
                         onclick="showImageModal('${imageUrl}')"
                         onerror="this.src='https://placehold.co/70x70/00aaff/ffffff?text=Ad'">
                </td>
                <td><strong>${ad.title}</strong></td>
                <td style="max-width: 250px;">${ad.description}</td>
                <td>${ad.price || '<span style="color: var(--gray-400);">N/A</span>'}</td>
                <td>
                    <span class="badge badge-${ad.targetAudience || 'all'}">
                        ${(ad.targetAudience || 'all').toUpperCase()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm ${ad.status === 'active' ? 'btn-success' : 'btn-danger'}" 
                            onclick="toggleStatus('advertisement', '${ad._id}', '${ad.status}')">
                        ${ad.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm btn-icon" 
                                onclick='openAdvertisementModal(${JSON.stringify(ad).replace(/'/g, "\\'")})'
                                title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm btn-icon" 
                                onclick="showDeleteModal('${ad._id}', 'advertisement')" 
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============ FORM SUBMISSION - ADVERTISEMENT ============
document.addEventListener('DOMContentLoaded', () => {
    const advertisementForm = document.getElementById('advertisementForm');
    if (advertisementForm) {
        advertisementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('advertisementTitle')?.value.trim());
            formData.append('description', document.getElementById('advertisementDescription')?.value.trim());
            formData.append('price', document.getElementById('advertisementPrice')?.value.trim() || '');
            formData.append('actionText', document.getElementById('advertisementActionText')?.value.trim() || 'Learn More');
            formData.append('actionUrl', document.getElementById('advertisementActionUrl')?.value.trim());
            formData.append('targetAudience', document.getElementById('advertisementTarget')?.value || 'all');
            formData.append('status', document.getElementById('advertisementStatus')?.value || 'active');
            
            const imageFile = document.getElementById('advertisementImage')?.files[0];
            
            if (!currentEditId && !imageFile) {
                showToast('error', 'Please select an image');
                return;
            }
            
            if (imageFile) {
                formData.append('image', imageFile);
            }
            
            const submitBtn = document.getElementById('advertisementSubmitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                const url = currentEditId 
                    ? `${API_URL}/api/content/advertisements/${currentEditId}`
                    : `${API_URL}/api/content/advertisements`;
                
                const method = currentEditId ? 'PUT' : 'POST';
                
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to save advertisement');
                }
                
                showToast('success', `Advertisement ${currentEditId ? 'updated' : 'created'} successfully!`);
                closeModal('advertisementModal');
                advertisementForm.reset();
                document.getElementById('advertisementPreview').classList.remove('show');
                loadAdvertisements();
                
            } catch (err) {
                console.error('❌ Save advertisement error:', err);
                showToast('error', err.message || 'Failed to save advertisement');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// ============================================
// SPONSORED ADS
// ============================================

function openSponsoredModal(editData = null) {
    const modal = document.getElementById('sponsoredModal');
    const modalTitle = document.getElementById('sponsoredModalTitle');
    const submitBtnText = document.getElementById('sponsoredBtnText');
    const imageInput = document.getElementById('sponsoredImage');
    
    if (editData) {
        currentEditId = editData._id;
        currentEditType = 'sponsored';
        modalTitle.textContent = 'Edit Sponsored Ad';
        submitBtnText.textContent = 'Update';
        
        document.getElementById('sponsoredTitle').value = editData.title || '';
        document.getElementById('sponsoredPrice').value = editData.price || '';
        document.getElementById('sponsoredDescription').value = editData.description || '';
        document.getElementById('sponsoredActionText').value = editData.actionText || 'Buy Now';
        document.getElementById('sponsoredActionUrl').value = editData.actionUrl || '';
        document.getElementById('sponsoredTarget').value = editData.targetAudience || 'all';
        document.getElementById('sponsoredStatus').value = editData.status || 'active';
        
        // Show existing image
        if (editData.imageUrl) {
            const preview = document.getElementById('sponsoredPreview');
            const previewImg = document.getElementById('sponsoredPreviewImg');
            const imageUrl = editData.imageUrl.startsWith('http') 
                ? editData.imageUrl 
                : `${API_URL}${editData.imageUrl}`;
            previewImg.src = imageUrl;
            preview.classList.add('show');
        }
        
        imageInput.required = false;
    } else {
        currentEditId = null;
        currentEditType = null;
        modalTitle.textContent = 'Create Sponsored Ad';
        submitBtnText.textContent = 'Create';
        document.getElementById('sponsoredForm').reset();
        document.getElementById('sponsoredPreview').classList.remove('show');
        imageInput.required = true;
    }
    
    setupImagePreview('sponsored');
    modal.classList.add('active');
}

async function loadSponsoredAds() {
    if (!checkAuth()) return;
    
    const tbody = document.getElementById('sponsoredList');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading sponsored ads...</p>
                </div>
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch(`${API_URL}/api/content/admin/sponsored-ads`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        
        const data = await res.json();
        const sponsoredAds = data.sponsoredAds || data.data || data || [];
        
        renderSponsoredAds(sponsoredAds);
        
    } catch (err) {
        console.error('❌ Load sponsored ads error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load sponsored ads</h3>
                        <p>${err.message}</p>
                        <button class="btn btn-primary" onclick="loadSponsoredAds()" style="margin-top: 16px;">
                            <i class="fas fa-sync"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        showToast('error', 'Failed to load sponsored ads');
    }
}

function renderSponsoredAds(sponsoredAds) {
    const tbody = document.getElementById('sponsoredList');
    if (!tbody) return;
    
    if (!sponsoredAds || sponsoredAds.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-ad"></i>
                        <h3>No Sponsored Ads</h3>
                        <p>Create your first sponsored ad to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = sponsoredAds.map(ad => {
        const imageUrl = ad.imageUrl?.startsWith('http') 
            ? ad.imageUrl 
            : ad.imageUrl?.startsWith('/') 
              ? `${API_URL}${ad.imageUrl}`
              : `${API_URL}/uploads/ads/${ad.imageUrl}`;
        
        return `
            <tr>
                <td>
                    <img src="${imageUrl}" 
                         alt="${ad.title}" 
                         style="width: 70px; height: 70px; object-fit: cover; border-radius: 10px; cursor: pointer; box-shadow: var(--shadow-sm);"
                         onclick="showImageModal('${imageUrl}')"
                         onerror="this.src='https://placehold.co/70x70/00aaff/ffffff?text=Ad'">
                </td>
                <td><strong>${ad.title}</strong></td>
                <td><strong style="color: var(--primary);">${ad.price}</strong></td>
                <td>
                    <span class="badge badge-${ad.targetAudience || 'all'}">
                        ${(ad.targetAudience || 'all').toUpperCase()}
                    </span>
                </td>
                <td>
                    <div style="font-size: 12px; font-weight: 600;">
                        <div style="margin-bottom: 4px;"><i class="fas fa-eye" style="color: var(--primary);"></i> ${ad.impressions || 0} views</div>
                        <div><i class="fas fa-mouse-pointer" style="color: var(--success);"></i> ${ad.clicks || 0} clicks</div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm ${ad.status === 'active' ? 'btn-success' : 'btn-danger'}" 
                            onclick="toggleStatus('sponsored', '${ad._id}', '${ad.status}')">
                        ${ad.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm btn-icon" 
                                onclick='openSponsoredModal(${JSON.stringify(ad).replace(/'/g, "\\'")})'
                                title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm btn-icon" 
                                onclick="showDeleteModal('${ad._id}', 'sponsored')" 
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============ FORM SUBMISSION - SPONSORED AD ============
document.addEventListener('DOMContentLoaded', () => {
    const sponsoredForm = document.getElementById('sponsoredForm');
    if (sponsoredForm) {
        sponsoredForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('sponsoredTitle')?.value.trim());
            formData.append('description', document.getElementById('sponsoredDescription')?.value.trim());
            formData.append('price', document.getElementById('sponsoredPrice')?.value.trim());
            formData.append('actionText', document.getElementById('sponsoredActionText')?.value.trim() || 'Buy Now');
            formData.append('actionUrl', document.getElementById('sponsoredActionUrl')?.value.trim());
            formData.append('targetAudience', document.getElementById('sponsoredTarget')?.value || 'all');
            formData.append('status', document.getElementById('sponsoredStatus')?.value || 'active');
            
            const imageFile = document.getElementById('sponsoredImage')?.files[0];
            
            if (!currentEditId && !imageFile) {
                showToast('error', 'Please select an image');
                return;
            }
            
            if (imageFile) {
                formData.append('image', imageFile);
            }
            
            const submitBtn = document.getElementById('sponsoredSubmitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                const url = currentEditId 
                    ? `${API_URL}/api/content/sponsored-ads/${currentEditId}`
                    : `${API_URL}/api/content/sponsored-ads`;
                
                const method = currentEditId ? 'PUT' : 'POST';
                
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to save sponsored ad');
                }
                
                showToast('success', `Sponsored ad ${currentEditId ? 'updated' : 'created'} successfully!`);
                closeModal('sponsoredModal');
                sponsoredForm.reset();
                document.getElementById('sponsoredPreview').classList.remove('show');
                loadSponsoredAds();
                
            } catch (err) {
                console.error('❌ Save sponsored ad error:', err);
                showToast('error', err.message || 'Failed to save sponsored ad');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// ============================================
// POLLS
// ============================================

function openPollModal(editData = null) {
    const modal = document.getElementById('pollModal');
    const modalTitle = document.getElementById('pollModalTitle');
    const submitBtnText = document.getElementById('pollBtnText');
    const pollOptions = document.getElementById('pollOptions');
    
    if (editData) {
        currentEditId = editData._id;
        currentEditType = 'poll';
        modalTitle.textContent = 'Edit Poll';
        submitBtnText.textContent = 'Update';
        
        document.getElementById('pollQuestion').value = editData.question || '';
        document.getElementById('pollTarget').value = editData.targetAudience || 'all';
        document.getElementById('pollStatus').value = editData.status || 'active';
        
        // Render existing options
        pollOptions.innerHTML = editData.options?.map((opt, idx) => `
            <div class="poll-option-input" style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" placeholder="Option ${idx + 1}" value="${opt.text || opt}" required style="flex: 1;">
                ${idx > 1 ? `<button type="button" class="btn btn-danger btn-sm btn-icon" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>` : ''}
            </div>
        `).join('') || `
            <div class="poll-option-input" style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" placeholder="Option 1" required style="flex: 1;">
            </div>
            <div class="poll-option-input" style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" placeholder="Option 2" required style="flex: 1;">
            </div>
        `;
    } else {
        currentEditId = null;
        currentEditType = null;
        modalTitle.textContent = 'Create Poll';
        submitBtnText.textContent = 'Create';
        document.getElementById('pollForm').reset();
        
        pollOptions.innerHTML = `
            <div class="poll-option-input" style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" placeholder="Option 1" required style="flex: 1;">
            </div>
            <div class="poll-option-input" style="display: flex; gap: 10px; align-items: center;">
                <input type="text" class="form-control" placeholder="Option 2" required style="flex: 1;">
            </div>
        `;
    }
    
    modal.classList.add('active');
}

function addPollOption() {
    const container = document.getElementById('pollOptions');
    if (!container) return;
    
    const optionCount = container.querySelectorAll('.poll-option-input').length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'poll-option-input';
    optionDiv.style.cssText = 'display: flex; gap: 10px; align-items: center;';
    optionDiv.innerHTML = `
        <input type="text" class="form-control" placeholder="Option ${optionCount}" required style="flex: 1;">
        <button type="button" class="btn btn-danger btn-sm btn-icon" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(optionDiv);
}

async function loadPolls() {
    if (!checkAuth()) return;
    
    const tbody = document.getElementById('pollsList');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading polls...</p>
                </div>
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch(`${API_URL}/api/polls`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        
        const data = await res.json();
        const polls = data.polls || data.data || data || [];
        
        renderPolls(polls);
        
    } catch (err) {
        console.error('❌ Load polls error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load polls</h3>
                        <p>${err.message}</p>
                        <button class="btn btn-primary" onclick="loadPolls()" style="margin-top: 16px;">
                            <i class="fas fa-sync"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        showToast('error', 'Failed to load polls');
    }
}

function renderPolls(polls) {
    const tbody = document.getElementById('pollsList');
    if (!tbody) return;
    
    if (!polls || polls.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-poll"></i>
                        <h3>No Polls</h3>
                        <p>Create your first poll to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = polls.map(poll => {
        const totalVotes = poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
        const optionsText = poll.options?.slice(0, 3).map(opt => opt.text).join(', ') || 'No options';
        const moreOptions = poll.options?.length > 3 ? ` +${poll.options.length - 3} more` : '';
        
        return `
            <tr>
                <td><strong>${poll.question}</strong></td>
                <td style="max-width: 250px; font-size: 12px;">${optionsText}${moreOptions}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="showVoters('${poll._id}')" style="font-weight: 700;">
                        <i class="fas fa-users"></i> ${totalVotes}
                    </button>
                </td>
                <td>
                    <span class="badge badge-${poll.targetAudience || 'all'}">
                        ${(poll.targetAudience || 'all').toUpperCase()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm ${poll.status === 'active' ? 'btn-success' : 'btn-danger'}" 
                            onclick="toggleStatus('poll', '${poll._id}', '${poll.status}')">
                        ${poll.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                </td>
                <td>${new Date(poll.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-danger btn-sm btn-icon" 
                                onclick="showDeleteModal('${poll._id}', 'poll')" 
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============ FORM SUBMISSION - POLL ============
document.addEventListener('DOMContentLoaded', () => {
    const pollForm = document.getElementById('pollForm');
    if (pollForm) {
        pollForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const optionInputs = document.querySelectorAll('#pollOptions input');
            const options = Array.from(optionInputs)
                .map(input => input.value.trim())
                .filter(opt => opt);
            
            if (options.length < 2) {
                showToast('error', 'Poll must have at least 2 options');
                return;
            }
            
            const data = {
                question: document.getElementById('pollQuestion')?.value.trim(),
                options,
                targetAudience: document.getElementById('pollTarget')?.value || 'all',
                status: document.getElementById('pollStatus')?.value || 'active'
            };
            
            if (!data.question) {
                showToast('error', 'Please enter a poll question');
                return;
            }
            
            console.log('📤 Sending poll data:', data);
            
            const submitBtn = document.getElementById('pollSubmitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                if (currentEditId) {
                    showToast('error', 'Poll editing not yet supported. Please create a new poll.');
                    return;
                }
                
                const res = await fetch(`${API_URL}/api/polls`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to create poll');
                }
                
                showToast('success', 'Poll created successfully!');
                closeModal('pollModal');
                pollForm.reset();
                loadPolls();
                
            } catch (err) {
                console.error('❌ Save poll error:', err);
                showToast('error', err.message || 'Failed to save poll');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// ============================================
// SHARED FUNCTIONS
// ============================================

// ============ IMAGE PREVIEW ============
function setupImagePreview(type) {
    const imageInput = document.getElementById(`${type}Image`);
    if (!imageInput) return;
    
    // Remove old listener
    const newImageInput = imageInput.cloneNode(true);
    imageInput.parentNode.replaceChild(newImageInput, imageInput);
    
    newImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById(`${type}Preview`);
        const previewImg = document.getElementById(`${type}PreviewImg`);
        
        if (!file) {
            preview?.classList.remove('show');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('error', 'File size too large. Maximum 5MB allowed.');
            this.value = '';
            preview?.classList.remove('show');
            return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast('error', 'Invalid file type. Only JPG, PNG, GIF, WEBP allowed.');
            this.value = '';
            preview?.classList.remove('show');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewImg) previewImg.src = e.target.result;
            preview?.classList.add('show');
        };
        reader.readAsDataURL(file);
    });
}

// ============ TOGGLE STATUS ============
async function toggleStatus(type, id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
        const endpoints = {
            announcement: `/api/content/announcements/${id}`,
            advertisement: `/api/content/advertisements/${id}`,
            sponsored: `/api/content/sponsored-ads/${id}`,
            poll: `/api/polls/${id}/status`
        };
        
        const url = `${API_URL}${endpoints[type]}`;
        const method = type === 'poll' ? 'PATCH' : 'PUT';
        
        const body = type === 'poll' 
            ? JSON.stringify({ status: newStatus })
            : JSON.stringify({ status: newStatus });
        
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update status');
        }
        
        showToast('success', `Status updated to ${newStatus}`);
        
        // Reload current tab
        if (type === 'announcement') loadAnnouncements();
        if (type === 'advertisement') loadAdvertisements();
        if (type === 'sponsored') loadSponsoredAds();
        if (type === 'poll') loadPolls();
        
    } catch (err) {
        console.error('❌ Toggle status error:', err);
        showToast('error', err.message || 'Failed to update status');
    }
}

// ============ SHOW VOTERS ============
async function showVoters(pollId) {
    const modal = document.getElementById('votersModal');
    const tbody = document.getElementById('votersList');
    
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="4">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading voters...</p>
                </div>
            </td>
        </tr>
    `;
    
    modal.classList.add('active');
    
    try {
        const res = await fetch(`${API_URL}/api/polls/${pollId}/voters`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error('Failed to load voters');
        
        const data = await res.json();
        const voters = data.voters || [];
        
        if (voters.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <h3>No Votes Yet</h3>
                            <p>This poll hasn't received any votes</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = voters.map(voter => `
            <tr>
                <td><strong>${voter.username || 'Unknown'}</strong></td>
                <td>${voter.email || 'N/A'}</td>
                <td><span style="color: var(--primary); font-weight: 600;">${voter.votedOption || 'Unknown'}</span></td>
                <td>${new Date(voter.votedAt).toLocaleString()}</td>
            </tr>
        `).join('');
        
    } catch (err) {
        console.error('❌ Load voters error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load voters</h3>
                        <p>${err.message}</p>
                    </div>
                </td>
            </tr>
        `;
        showToast('error', 'Failed to load voters');
    }
}

// ============ SHOW IMAGE MODAL ============
function showImageModal(imageUrl) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('fullImage');
    
    if (!modal || !img) return;
    
    img.src = imageUrl;
    modal.classList.add('active');
}

// ============ DELETE ============
function showDeleteModal(id, type) {
    deleteTarget = id;
    deleteType = type;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('active');
}

async function confirmDelete() {
    if (!deleteTarget || !deleteType) return;
    
    const endpoints = {
        announcement: `/api/content/announcements/${deleteTarget}`,
        advertisement: `/api/content/advertisements/${deleteTarget}`,
        sponsored: `/api/content/sponsored-ads/${deleteTarget}`,
        poll: `/api/polls/${deleteTarget}`
    };
    
    try {
        console.log('🗑️ Deleting:', deleteType, deleteTarget);
        
        const res = await fetch(`${API_URL}${endpoints[deleteType]}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to delete ${deleteType}`);
        }
        
        showToast('success', `${deleteType.charAt(0).toUpperCase() + deleteType.slice(1)} deleted successfully!`);
        closeModal('deleteModal');
        
        // Reload content
        if (deleteType === 'announcement') loadAnnouncements();
        if (deleteType === 'advertisement') loadAdvertisements();
        if (deleteType === 'sponsored') loadSponsoredAds();
        if (deleteType === 'poll') loadPolls();
        
        deleteTarget = null;
        deleteType = null;
        
    } catch (err) {
        console.error('❌ Delete error:', err);
        showToast('error', err.message || `Failed to delete ${deleteType}`);
    }
}

// ============ INITIALIZATION ============
window.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Content Manager...');
    console.log('📍 API URL:', API_URL);
    console.log('🔑 Token:', token ? 'Present' : 'Missing');
    
    loadTheme();
    
    if (checkAuth()) {
        loadAnnouncements(); // Load default tab
    }
    
    console.log('✅ Content Manager initialized');
});

// ============ EXPORTS ============
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.toggleTheme = toggleTheme;
window.switchTab = switchTab;
window.closeModal = closeModal;
window.openAnnouncementModal = openAnnouncementModal;
window.openAdvertisementModal = openAdvertisementModal;
window.openSponsoredModal = openSponsoredModal;
window.openPollModal = openPollModal;
window.addPollOption = addPollOption;
window.toggleStatus = toggleStatus;
window.showVoters = showVoters;
window.showImageModal = showImageModal;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;
window.loadAnnouncements = loadAnnouncements;
window.loadAdvertisements = loadAdvertisements;
window.loadSponsoredAds = loadSponsoredAds;
window.loadPolls = loadPolls;