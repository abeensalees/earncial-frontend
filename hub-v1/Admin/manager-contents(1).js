
// ================================================
// EARNCIAL ADMIN - CONTENT MANAGER
// Complete with Edit, Status Toggle, Target Audience, Voters
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('admin_token') || localStorage.getItem('earncial_token');

let currentTab = 'announcements';
let currentContentType = null;
let currentEditId = null;
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
    if (tabName === 'polls') loadPolls();
    if (tabName === 'ads') loadAds();
}

// ============ MODAL ============
function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
    if (modalId === 'contentModal') {
        currentContentType = null;
        currentEditId = null;
    }
}

// ============ CREATE MODAL ============
function openCreateModal(type) {
    currentContentType = type;
    currentEditId = null;
    
    const modal = document.getElementById('contentModal');
    const modalTitle = document.getElementById('modalTitleText');
    const submitBtnText = document.getElementById('submitBtnText');
    const formFields = document.getElementById('formFields');
    
    const titles = {
        announcement: '📢 Create Announcement',
        poll: '📊 Create Poll',
        ad: '📱 Create Sponsored Ad'
    };
    
    modalTitle.textContent = titles[type] || 'Create Content';
    submitBtnText.textContent = 'Create';
    
    formFields.innerHTML = getFormFields(type);
    
    // Setup image preview for ads
    if (type === 'ad') {
        setupImagePreview();
    }
    
    modal.classList.add('active');
}

// ============ EDIT MODAL ============
function openEditModal(type, id, data) {
    currentContentType = type;
    currentEditId = id;
    
    const modal = document.getElementById('contentModal');
    const modalTitle = document.getElementById('modalTitleText');
    const submitBtnText = document.getElementById('submitBtnText');
    const formFields = document.getElementById('formFields');
    
    const titles = {
        announcement: '✏️ Edit Announcement',
        poll: '✏️ Edit Poll',
        ad: '✏️ Edit Ad'
    };
    
    modalTitle.textContent = titles[type] || 'Edit Content';
    submitBtnText.textContent = 'Update';
    
    formFields.innerHTML = getFormFields(type, data);
    
    // Setup image preview for ads
    if (type === 'ad') {
        setupImagePreview();
        
        // Show existing image
        if (data.imageUrl) {
            const preview = document.getElementById('imagePreview');
            const previewImg = document.getElementById('previewImg');
            if (preview && previewImg) {
                const imageUrl = data.imageUrl.startsWith('http') 
                    ? data.imageUrl 
                    : `${API_URL}${data.imageUrl}`;
                previewImg.src = imageUrl;
                preview.classList.add('show');
            }
        }
    }
    
    modal.classList.add('active');
}

// ============ FORM FIELDS ============
function getFormFields(type, data = {}) {
    const commonFields = `
        <div class="form-group">
            <label class="form-label">Target Audience</label>
            <select class="form-control" id="targetAudience">
                <option value="all" ${data.targetAudience === 'all' ? 'selected' : ''}>All Users</option>
                <option value="advertisers" ${data.targetAudience === 'advertisers' ? 'selected' : ''}>Advertisers Only</option>
                <option value="earners" ${data.targetAudience === 'earners' ? 'selected' : ''}>Earners Only</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="status">
                <option value="active" ${data.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${data.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            </select>
        </div>
    `;
    
    if (type === 'announcement') {
        return `
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" class="form-control" id="title" placeholder="Announcement title" value="${data.title || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Icon (Emoji)</label>
                    <input type="text" class="form-control" id="icon" placeholder="📢" maxlength="2" value="${data.icon || '📢'}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Message *</label>
                <textarea class="form-control" id="message" placeholder="Enter announcement message" required>${data.message || ''}</textarea>
            </div>
            ${commonFields}
        `;
    }
    
    if (type === 'poll') {
        const optionsHTML = data.options?.map((opt, idx) => `
            <div class="poll-option-input">
                <input type="text" class="form-control" placeholder="Option ${idx + 1}" value="${opt.text || opt}" required>
                <button type="button" class="btn btn-danger btn-sm btn-icon" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('') || `
            <div class="poll-option-input">
                <input type="text" class="form-control" placeholder="Option 1" required>
            </div>
            <div class="poll-option-input">
                <input type="text" class="form-control" placeholder="Option 2" required>
            </div>
        `;
        
        return `
            <div class="form-group">
                <label class="form-label">Question *</label>
                <input type="text" class="form-control" id="question" placeholder="Enter poll question" value="${data.question || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Options *</label>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px;" id="pollOptions">
                    ${optionsHTML}
                </div>
                <button type="button" class="btn btn-primary btn-sm" onclick="addPollOption()">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            </div>
            ${commonFields}
        `;
    }
    
    if (type === 'ad') {
        const imageRequired = !data._id; // Only require image if creating new ad
        return `
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" class="form-control" id="title" placeholder="Ad title" value="${data.title || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">CTA Text</label>
                    <input type="text" class="form-control" id="ctaText" placeholder="Learn More" value="${data.ctaText || 'Learn More'}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Description *</label>
                <textarea class="form-control" id="description" placeholder="Ad description" required>${data.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Upload Image ${imageRequired ? '*' : '(Optional)'}</label>
                <input type="file" class="form-control" id="image" accept="image/*" ${imageRequired ? 'required' : ''}>
                <p class="form-help">
                    <i class="fas fa-info-circle"></i>
                    Maximum 5MB. Formats: JPG, PNG, GIF, WEBP
                </p>
                <div class="image-preview" id="imagePreview">
                    <img id="previewImg" alt="Preview">
                    <p class="image-preview-text">
                        <i class="fas fa-check-circle"></i> Image ready to upload
                    </p>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Target URL *</label>
                <input type="url" class="form-control" id="targetUrl" placeholder="https://example.com/product" value="${data.targetUrl || ''}" required>
            </div>
            ${commonFields}
        `;
    }
    
    return '';
}

// ============ IMAGE PREVIEW ============
function setupImagePreview() {
    const imageInput = document.getElementById('image');
    if (!imageInput) return;
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
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

// ============ POLL OPTIONS ============
function addPollOption() {
    const container = document.getElementById('pollOptions');
    if (!container) return;
    
    const optionCount = container.querySelectorAll('.poll-option-input').length + 1;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'poll-option-input';
    optionDiv.innerHTML = `
        <input type="text" class="form-control" placeholder="Option ${optionCount}" required>
        <button type="button" class="btn btn-danger btn-sm btn-icon" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(optionDiv);
}

// ============ FORM SUBMISSION ============
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contentForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        try {
            if (currentContentType === 'announcement') {
                await saveAnnouncement();
            } else if (currentContentType === 'poll') {
                await savePoll();
            } else if (currentContentType === 'ad') {
                await saveAd();
            }
        } catch (err) {
            console.error('❌ Save error:', err);
            showToast('error', err.message || 'Failed to save');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
});

// ============ SAVE ANNOUNCEMENT ============
async function saveAnnouncement() {
    const data = {
        title: document.getElementById('title')?.value.trim(),
        message: document.getElementById('message')?.value.trim(),
        icon: document.getElementById('icon')?.value.trim() || '📢',
        targetAudience: document.getElementById('targetAudience')?.value || 'all',
        status: document.getElementById('status')?.value || 'active'
    };
    
    if (!data.title || !data.message) {
        throw new Error('Please fill in all required fields');
    }
    
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
    closeModal('contentModal');
    loadAnnouncements();
}

// ============ SAVE POLL ============
async function savePoll() {
    const optionInputs = document.querySelectorAll('#pollOptions input');
    const options = Array.from(optionInputs).map(input => ({
        text: input.value.trim()
    })).filter(opt => opt.text);
    
    if (options.length < 2) {
        throw new Error('Poll must have at least 2 options');
    }
    
    const data = {
        question: document.getElementById('question')?.value.trim(),
        options,
        targetAudience: document.getElementById('targetAudience')?.value || 'all',
        status: document.getElementById('status')?.value || 'active'
    };
    
    if (!data.question) {
        throw new Error('Please enter a poll question');
    }
    
    // Note: Edit functionality for polls would require backend update endpoint
    if (currentEditId) {
        throw new Error('Poll editing not yet supported. Please create a new poll.');
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
    closeModal('contentModal');
    loadPolls();
}

// ============ SAVE AD ============
async function saveAd() {
    const formData = new FormData();
    formData.append('title', document.getElementById('title')?.value.trim());
    formData.append('description', document.getElementById('description')?.value.trim());
    formData.append('ctaText', document.getElementById('ctaText')?.value.trim() || 'Learn More');
    formData.append('targetUrl', document.getElementById('targetUrl')?.value.trim());
    formData.append('targetAudience', document.getElementById('targetAudience')?.value || 'all');
    formData.append('status', document.getElementById('status')?.value || 'active');
    
    const imageFile = document.getElementById('image')?.files[0];
    
    // Only require image if creating new ad
    if (!currentEditId && !imageFile) {
        throw new Error('Please select an image');
    }
    
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    const url = currentEditId 
        ? `${API_URL}/api/content/ads/${currentEditId}`
        : `${API_URL}/api/content/ads`;
    
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
        throw new Error(errorData.message || 'Failed to save ad');
    }
    
    showToast('success', `Ad ${currentEditId ? 'updated' : 'created'} successfully!`);
    closeModal('contentModal');
    loadAds();
}

// ============ LOAD ANNOUNCEMENTS ============
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
                        <button class="btn btn-primary" onclick="loadAnnouncements()">
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
            <td style="font-size: 24px;">${item.icon || '📢'}</td>
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
                            onclick='openEditModal("announcement", "${item._id}", ${JSON.stringify(item).replace(/'/g, "\\'")})' 
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

// ============ LOAD POLLS ============
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
                        <button class="btn btn-success" onclick="loadPolls()">
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
        const optionsText = poll.options?.map(opt => opt.text).join(', ') || 'No options';
        
        return `
            <tr>
                <td><strong>${poll.question}</strong></td>
                <td style="max-width: 250px; font-size: 12px;">${optionsText}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="showVoters('${poll._id}')">
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

// ============ LOAD ADS ============
async function loadAds() {
    if (!checkAuth()) return;
    
    const tbody = document.getElementById('adsList');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading ads...</p>
                </div>
            </td>
        </tr>
    `;
    
    try {
        const res = await fetch(`${API_URL}/api/content/admin/ads`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        
        const data = await res.json();
        const ads = data.ads || data.data || data || [];
        
        renderAds(ads);
        
    } catch (err) {
        console.error('❌ Load ads error:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load ads</h3>
                        <p>${err.message}</p>
                        <button class="btn btn-info" onclick="loadAds()">
                            <i class="fas fa-sync"></i> Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        showToast('error', 'Failed to load ads');
    }
}

function renderAds(ads) {
    const tbody = document.getElementById('adsList');
    if (!tbody) return;
    
    if (!ads || ads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <i class="fas fa-ad"></i>
                        <h3>No Ads</h3>
                        <p>Create your first sponsored ad to get started</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = ads.map(ad => {
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
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; cursor: pointer;"
                         onclick="showImageModal('${imageUrl}')"
                         onerror="this.src='https://placehold.co/60x60/e2e8f0/64748b?text=Ad'">
                </td>
                <td><strong>${ad.title}</strong></td>
                <td style="max-width: 250px; font-size: 13px;">${ad.description}</td>
                <td>
                    <span class="badge badge-${ad.targetAudience || 'all'}">
                        ${(ad.targetAudience || 'all').toUpperCase()}
                    </span>
                </td>
                <td>
                    <div style="font-size: 12px;">
                        <div><i class="fas fa-eye"></i> ${ad.impressions || 0} views</div>
                        <div><i class="fas fa-mouse-pointer"></i> ${ad.clicks || 0} clicks</div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm ${ad.status === 'active' ? 'btn-success' : 'btn-danger'}" 
                            onclick="toggleStatus('ad', '${ad._id}', '${ad.status}')">
                        ${ad.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm btn-icon" 
                                onclick='openEditModal("ad", "${ad._id}", ${JSON.stringify(ad).replace(/'/g, "\\'")})' 
                                title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm btn-icon" 
                                onclick="showDeleteModal('${ad._id}', 'ad')" 
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============ TOGGLE STATUS ============
async function toggleStatus(type, id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
        const endpoints = {
            announcement: `/api/content/announcements/${id}`,
            poll: `/api/polls/${id}/status`,
            ad: `/api/content/ads/${id}`
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
        if (type === 'poll') loadPolls();
        if (type === 'ad') loadAds();
        
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
                <td>${voter.votedOption || 'Unknown'}</td>
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
        poll: `/api/polls/${deleteTarget}`,
        ad: `/api/content/ads/${deleteTarget}`
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
        if (deleteType === 'poll') loadPolls();
        if (deleteType === 'ad') loadAds();
        
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
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.addPollOption = addPollOption;
window.toggleStatus = toggleStatus;
window.showVoters = showVoters;
window.showImageModal = showImageModal;
window.showDeleteModal = showDeleteModal;
window.confirmDelete = confirmDelete;
window.loadAnnouncements = loadAnnouncements;
window.loadPolls = loadPolls;
window.loadAds = loadAds;