

const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('earncial_token') || localStorage.getItem('admin_token');

let currentSection = 'dashboard';
let currentTheme = 'light';
let allAnnouncements = [];
let allPolls = [];
let allSponsored = [];
let allWalletImages = [];
let allMessages = [];
let allVoters = [];
let pollChart = null;
let editingId = null;
let selectedImages = [];
let editingWalletId = null;
let allGeneralMessages = [];
let editingGeneralId = null;          // For Sponsored
let selectedAnnImages = [];       // For Announcement/Advertisement

if (!token) {
    alert('Please login as admin first');
    window.location.href = 'admin-login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadDashboardStats();
    loadAllData();
});

function toggleContentSidebar() {
    const sidebar = document.getElementById('contentSidebar');
    const overlay = document.getElementById('contentSidebarOverlay');
    
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        closePlatformSidebar();
    }
}

function closeContentSidebar() {
    document.getElementById('contentSidebar').classList.remove('active');
    document.getElementById('contentSidebarOverlay').classList.remove('active');
}

function togglePlatformSidebar() {
    const sidebar = document.getElementById('platformSidebar');
    const overlay = document.getElementById('platformSidebarOverlay');
    
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        closeContentSidebar();
    }
}

function closePlatformSidebar() {
    document.getElementById('platformSidebar').classList.remove('active');
    document.getElementById('platformSidebarOverlay').classList.remove('active');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('adminTheme', isDark ? 'dark' : 'light');
    document.getElementById('themeIcon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('adminTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

function showSection(section) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.style.display = 'none');
    
    document.getElementById(section + '-section').style.display = 'block';
    
    const menuItems = document.querySelectorAll('#contentSidebar .menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    
    const activeItem = Array.from(menuItems).find(item => 
        item.textContent.toLowerCase().includes(section.replace('-', ' '))
    );
    if (activeItem) activeItem.classList.add('active');
    
    currentSection = section;
    closeContentSidebar();
    
    if (section === 'announcements') loadAnnouncements();
    else if (section === 'polls') loadPolls();
    else if (section === 'poll-analytics') loadPollAnalytics();
    else if (section === 'sponsored') loadSponsored();
    else if (section === 'wallet-images') loadWalletImages();
    else if (section === 'messages') loadAdminMessages();
    else if (section === 'referrals') loadReferralsSettings();
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.add('show');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function previewMultipleImages(input, previewContainerId) {
    const container = document.getElementById(previewContainerId);
    
    if (!input.files || input.files.length === 0) return;
    
    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const base64 = await fileToBase64(file);
        
        const isDuplicate = selectedImages.some(img => img.name === file.name && img.size === file.size);
        if (isDuplicate) continue;
        
        const currentIndex = selectedImages.length;
        selectedImages.push({ base64, name: file.name, size: file.size, file });
        
        const imgDiv = document.createElement('div');
        imgDiv.className = 'preview-image-item';
        imgDiv.setAttribute('data-index', currentIndex);
        imgDiv.innerHTML = `
            <img src="${base64}" alt="Image ${currentIndex + 1}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;">
            <button class="remove-preview-btn" onclick="removePreviewImage(${currentIndex})" title="Remove">
                <i class="fas fa-times"></i>
            </button>
            <span style="font-size:10px;color:var(--text-muted);text-align:center;display:block;margin-top:3px;">Image ${currentIndex + 1}</span>
        `;
        container.appendChild(imgDiv);
    }
    
    updateThumbnailSelector();
}

function updateThumbnailSelector() {
    const selector = document.getElementById('newSponsoredThumbnailIndex');
    if (!selector) return;
    const currentVal = selector.value;
    selector.innerHTML = '';
    for (let i = 0; i < selectedImages.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Image ${i + 1}${i === 0 ? ' (Default)' : ''}`;
        selector.appendChild(option);
    }
    if (currentVal < selectedImages.length) selector.value = currentVal;
}

async function previewAnnImages(input) {
    const container = document.getElementById('newAnnouncementImagesPreview');
    if (!input.files || !input.files.length) return;

    for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const isDup = selectedAnnImages.some(img => img.name === file.name && img.size === file.size);
        if (isDup) continue;

        const base64 = await fileToBase64(file);
        const idx = selectedAnnImages.length;
        selectedAnnImages.push({ base64, name: file.name, size: file.size, file });

        const div = document.createElement('div');
        div.className = 'preview-image-item';
        div.setAttribute('data-index', idx);
        div.innerHTML = `
            <img src="${base64}" alt="Image ${idx+1}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;">
            <button class="remove-preview-btn" onclick="removeAnnImage(${idx})" title="Remove">
                <i class="fas fa-times"></i>
            </button>
            <span style="font-size:10px;color:var(--text-muted);text-align:center;display:block;margin-top:3px;">
                Image ${idx+1}
            </span>`;
        container.appendChild(div);
    }
    updateAnnImagesCount();
}

function updateAnnImagesCount() {
    const countEl = document.getElementById('annImagesCount');
    if (countEl) countEl.textContent = selectedAnnImages.length
        ? `${selectedAnnImages.length} image${selectedAnnImages.length > 1 ? 's' : ''} selected`
        : '';
}

function removeAnnImage(index) {
    selectedAnnImages.splice(index, 1);
    const container = document.getElementById('newAnnouncementImagesPreview');
    container.innerHTML = '';
    selectedAnnImages.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'preview-image-item';
        div.setAttribute('data-index', i);
        div.innerHTML = `
            <img src="${img.base64}" alt="Image ${i+1}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;">
            <button class="remove-preview-btn" onclick="removeAnnImage(${i})" title="Remove">
                <i class="fas fa-times"></i>
            </button>
            <span style="font-size:10px;color:var(--text-muted);text-align:center;display:block;margin-top:3px;">
                Image ${i+1}
            </span>`;
        container.appendChild(div);
    });
    updateAnnImagesCount();
}

function removePreviewImage(index) {
    selectedImages.splice(index, 1);
    const container = document.getElementById('newSponsoredImagesPreview');
    container.innerHTML = '';
    selectedImages.forEach((img, i) => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'preview-image-item';
        imgDiv.setAttribute('data-index', i);
        imgDiv.innerHTML = `
            <img src="${img.base64}" alt="Image ${i+1}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;">
            <button class="remove-preview-btn" onclick="removePreviewImage(${i})" title="Remove">
                <i class="fas fa-times"></i>
            </button>
            <span style="font-size:10px;color:var(--text-muted);text-align:center;display:block;margin-top:3px;">Image ${i+1}</span>
        `;
        container.appendChild(imgDiv);
    });
    updateThumbnailSelector();
}

function showToast(msg, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${msg}`;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showSuccess(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
        message.classList.add('show');
        setTimeout(() => message.classList.remove('show'), 3000);
    }
}

async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/api/admin/content/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load stats');
        
        const data = await res.json();
        
        if (document.getElementById('totalAnnouncements')) {
            document.getElementById('totalAnnouncements').textContent = data.stats.announcements || 0;
        }
        if (document.getElementById('totalPolls')) {
            document.getElementById('totalPolls').textContent = data.stats.polls || 0;
        }
        if (document.getElementById('totalSponsored')) {
            document.getElementById('totalSponsored').textContent = data.stats.sponsored || 0;
        }
        if (document.getElementById('totalWalletImages')) {
            document.getElementById('totalWalletImages').textContent = data.stats.walletImages || 0;
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

async function loadAllData() {
    await loadAnnouncements();
    await loadPolls();
    await loadSponsored();
    await loadWalletImages();
    await loadAdModals();
    await loadGeneralMessage();  // ✅ General message banner
}

function toggleContentTypeFields() {
    const type = document.getElementById('newContentType').value;
    const isAd = type === 'advertisement';

    document.getElementById('iconFieldGroup').style.display    = isAd ? 'none'  : 'block';
    document.getElementById('labelFieldGroup').style.display   = isAd ? 'block' : 'none';
    document.getElementById('imagesFieldGroup').style.display  = isAd ? 'block' : 'none';
    document.getElementById('createAnnouncementBtnText').textContent = 
        isAd ? 'Create Advertisement' : 'Create Announcement';
}

async function loadAnnouncements() {
    try {
        const res = await fetch(`${API_URL}/api/admin/announcements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        allAnnouncements = data.announcements || [];
        renderAnnouncementsTable();
    } catch (err) {
        showToast('Failed to load announcements', 'error');
    }
}

function renderAnnouncementsTable() {
    const announcements = allAnnouncements
        .filter(a => a.type !== 'advertisement')
        .sort((a,b) => (a.priority||99) - (b.priority||99));
    const advertisements = allAnnouncements
        .filter(a => a.type === 'advertisement')
        .sort((a,b) => (a.priority||99) - (b.priority||99));

    const annTbody = document.getElementById('announcementsTableBody');
    if (annTbody) {
        if (!announcements.length) {
            annTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted);">No announcements yet</td></tr>';
        } else {
            annTbody.innerHTML = announcements.map(item => `
                <tr>
                    <td><strong>${item.priority || '-'}</strong></td>
                    <td>
                        <div style="font-weight:600;">${item.title}</div>
                        <small style="color:var(--text-muted);">
                            <i class="${item.icon || 'fas fa-bell'}"></i>
                        </small>
                    </td>
                    <td>${item.buttonText
                        ? `<span style="font-size:12px;background:var(--primary-light);color:var(--primary);padding:3px 8px;border-radius:6px;">${item.buttonText}</span>`
                        : '<span style="color:var(--text-muted);font-size:12px;">Close only</span>'}</td>
                    <td><span class="status-badge ${item.active ? 'status-active' : 'status-inactive'}">${item.active ? 'Active' : 'Off'}</span></td>
                    <td>
                        <button class="btn-icon btn-delete" onclick="deleteAnnouncement('${item._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`).join('');
        }
    }

    const adTbody = document.getElementById('advertisementsTableBody');
    if (adTbody) {
        if (!advertisements.length) {
            adTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">No advertisements yet</td></tr>';
        } else {
            adTbody.innerHTML = advertisements.map(item => `
                <tr>
                    <td><strong>${item.priority || '-'}</strong></td>
                    <td><strong>${item.title}</strong></td>
                    <td>${item.label
                        ? `<span style="font-size:12px;background:#fef3c7;color:#d97706;padding:3px 8px;border-radius:6px;">${item.label}</span>`
                        : '-'}</td>
                    <td><span style="font-size:12px;">${item.imageCount || (item.telegramFileIds?.length || 0)} image(s)</span></td>
                    <td>${item.buttonText
                        ? `<span style="font-size:12px;background:var(--primary-light);color:var(--primary);padding:3px 8px;border-radius:6px;">${item.buttonText}</span>`
                        : '<span style="color:var(--text-muted);font-size:12px;">Close only</span>'}</td>
                    <td><span class="status-badge ${item.active ? 'status-active' : 'status-inactive'}">${item.active ? 'Active' : 'Off'}</span></td>
                    <td>
                        <button class="btn-icon btn-delete" onclick="deleteAnnouncement('${item._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`).join('');
        }
    }
}

async function createAnnouncement() {
    try {
        const type    = document.getElementById('newContentType').value;
        const title   = document.getElementById('newAnnouncementTitle').value.trim();
        const content = document.getElementById('newAnnouncementContent').value.trim();

        if (!title) { showToast('Title is required', 'error'); return; }
        if (!content) { showToast('Description is required', 'error'); return; }

        const formData = new FormData();
        formData.append('type',       type);
        formData.append('title',      title);
        formData.append('content',    content);
        formData.append('priority',   document.getElementById('newAnnouncementPriority').value || '1');
        formData.append('active',     document.getElementById('newAnnouncementActive').checked);
        formData.append('buttonText', document.getElementById('newAnnouncementButtonText')?.value?.trim() || '');
        formData.append('buttonUrl',  document.getElementById('newAnnouncementButtonUrl')?.value?.trim()  || '');
        formData.append('audience',   document.getElementById('newAnnouncementAudience')?.value || 'all');

        if (type === 'announcement') {
            formData.append('icon', document.getElementById('newAnnouncementIcon').value || 'fas fa-bell');
        } else {
            formData.append('label', document.getElementById('newAnnouncementLabel')?.value?.trim() || '');
            if (selectedAnnImages.length === 0) {
                showToast('Please upload at least one image', 'error');
                return;
            }
            for (let i = 0; i < selectedAnnImages.length; i++) {
                if (selectedAnnImages[i].file) {
                    formData.append('images', selectedAnnImages[i].file, selectedAnnImages[i].name || `image${i}.jpg`);
                }
            }
        }

        const res = await fetch(`${API_URL}/api/admin/announcements`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to create');
        }

        showToast(`${type === 'advertisement' ? 'Advertisement' : 'Announcement'} created!`, 'success');
        showSuccess('announcementSuccess');

        document.getElementById('newAnnouncementTitle').value   = '';
        document.getElementById('newAnnouncementContent').value = '';
        document.getElementById('newAnnouncementPriority').value = '1';
        document.getElementById('newAnnouncementButtonText').value = '';
        document.getElementById('newAnnouncementButtonUrl').value  = '';
        document.getElementById('newAnnouncementIcon').value    = 'fas fa-bell';
        if (document.getElementById('newAnnouncementLabel'))  document.getElementById('newAnnouncementLabel').value  = '';
        if (document.getElementById('newAnnouncementImages')) document.getElementById('newAnnouncementImages').value = '';
        selectedAnnImages = [];
        const preview = document.getElementById('newAnnouncementImagesPreview');
        if (preview) preview.innerHTML = '';

        loadAnnouncements();
        loadDashboardStats();
    } catch (err) {
        console.error('createAnnouncement error:', err);
        showToast(err.message || 'Error creating - check console', 'error');
    }
}

async function deleteAnnouncement(id) {
    if (!confirm('Delete this item?')) return;
    try {
        const res = await fetch(`${API_URL}/api/admin/announcements/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete');
        showToast('Deleted successfully', 'success');
        loadAnnouncements();
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error deleting', 'error');
    }
}

function addPollOption(containerId) {
    const container = document.getElementById(containerId);
    const optionCount = container.children.length + 1;
    const newOption = document.createElement('div');
    newOption.className = 'poll-option-item';
    newOption.innerHTML = `
        <input type="text" placeholder="Option ${optionCount}" class="poll-option-input">
        <i class="fas fa-times remove-option" onclick="removeOption(this)"></i>
    `;
    container.appendChild(newOption);
}

function removeOption(element) {
    const container = element.closest('#newPollOptionsContainer');
    if (container.children.length > 2) {
        element.closest('.poll-option-item').remove();
    } else {
        showToast('You must have at least 2 options!', 'error');
    }
}

async function loadPolls() {
    try {
        const tbody = document.getElementById('pollsTableBody');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading...</td></tr>';
        
        const res = await fetch(`${API_URL}/api/admin/polls`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load polls');
        
        const data = await res.json();
        allPolls = data.polls || [];
        renderPollsTable();
    } catch (err) {
        console.error('Error loading polls:', err);
        showToast('Failed to load polls', 'error');
    }
}

function renderPollsTable() {
    const tbody = document.getElementById('pollsTableBody');
    tbody.innerHTML = '';
    
    if (allPolls.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No polls found</td></tr>';
        return;
    }
    
    allPolls.forEach((item, index) => {
        const tr = document.createElement('tr');
        const statusClass = item.active ? 'status-active' : 'status-inactive';
        const statusText = item.active ? 'Active' : 'Inactive';
        
        const totalVotes = item.voters?.length || 0;

        const headerText = item.pollId || '';
        const isMongoId    = /^[a-f0-9]{24}$/i.test(headerText.trim());
        const isAutoGenPoll = /^POLL-\d+$/i.test(headerText.trim());
        const displayHeader = (!headerText || isMongoId || isAutoGenPoll)
            ? '<em style="color:var(--text-muted)">—</em>'
            : `<strong>${headerText}</strong>`;
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${displayHeader}</td>
            <td>${item.question}</td>
            <td><strong>${totalVotes}</strong></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${new Date(item.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-delete" onclick="deletePoll('${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function createPoll() {
    try {
        const optionsInputs = document.querySelectorAll('#newPollOptionsContainer .poll-option-input');
        const options = Array.from(optionsInputs)
            .map(input => input.value.trim())
            .filter(val => val !== '');
        
        if (options.length < 2) {
            showToast('Please add at least 2 options!', 'error');
            return;
        }
        
        const question = document.getElementById('newPollQuestion').value.trim();
        const endTime  = document.getElementById('newPollEndTime').value.trim();

        if (!question) {
            showToast('Please enter the poll question', 'error');
            return;
        }

        // No auto-generate - admin sets headerText (display title)
        const headerText = document.getElementById('newPollHeaderText')?.value?.trim() || '';

        const data = {
            headerText,
            question,
            options,
            endTime,
            active:   document.getElementById('newPollActive').checked,
            audience: document.getElementById('newPollAudience')?.value || 'all'
        };
        
        const res = await fetch(`${API_URL}/api/admin/polls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error('Failed to create poll');
        
        showToast('Poll created successfully', 'success');
        showSuccess('pollSuccess');
        
        document.getElementById('newPollId').value       = '';
        document.getElementById('newPollQuestion').value = '';
        document.getElementById('newPollEndTime').value  = '';
        document.getElementById('newPollOptionsContainer').innerHTML = `
            <div class="poll-option-item">
                <input type="text" placeholder="Option 1" class="poll-option-input">
                <i class="fas fa-times remove-option" onclick="removeOption(this)"></i>
            </div>
            <div class="poll-option-item">
                <input type="text" placeholder="Option 2" class="poll-option-input">
                <i class="fas fa-times remove-option" onclick="removeOption(this)"></i>
            </div>
        `;
        
        loadPolls();
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error creating poll', 'error');
    }
}

async function deletePoll(id) {
    if (!confirm('Are you sure you want to delete this poll?')) return;
    
    try {
        const res = await fetch(`${API_URL}/api/admin/polls/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to delete poll');
        
        showToast('Poll deleted successfully', 'success');
        loadPolls();
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error deleting poll', 'error');
    }
}

async function loadPollAnalytics() {
    try {
        const pollRes = await fetch(`${API_URL}/api/admin/polls/active`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!pollRes.ok) throw new Error('Failed to load poll');
        
        const pollData = await pollRes.json();
        const activePoll = pollData.poll;
        
        for (let i = 1; i <= 4; i++) {
            const card = document.getElementById(`pollOption${i}Card`);
            if (card) card.style.display = 'none';
        }
        
        if (!activePoll) {
            document.getElementById('analyticsTotal').textContent = '0';
            document.getElementById('analyticsToday').textContent = '0';
            document.getElementById('analyticsMale').textContent = '0';
            document.getElementById('analyticsFemale').textContent = '0';
            document.getElementById('analyticsEarners').textContent = '0';
            document.getElementById('analyticsAdvertisers').textContent = '0';
            return;
        }
        
        const analyticsRes = await fetch(`${API_URL}/api/admin/polls/${activePoll._id}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!analyticsRes.ok) throw new Error('Failed to load analytics');
        
        const analytics = await analyticsRes.json();
        
        document.getElementById('analyticsTotal').textContent = analytics.analytics.totalVotes;
        document.getElementById('analyticsMale').textContent = analytics.analytics.maleVotes;
        document.getElementById('analyticsFemale').textContent = analytics.analytics.femaleVotes;
        document.getElementById('analyticsEarners').textContent = analytics.analytics.earnerVotes;
        document.getElementById('analyticsAdvertisers').textContent = analytics.analytics.advertiserVotes;
        
        document.getElementById('analyticsToday').textContent = analytics.analytics.todayVotes || 0;
        
        activePoll.options.forEach((option, index) => {
            if (index < 4) {
                const cardNum = index + 1;
                const card = document.getElementById(`pollOption${cardNum}Card`);
                if (card) {
                    card.style.display = 'flex';
                    document.getElementById(`option${cardNum}Votes`).textContent = option.votes || 0;
                    document.getElementById(`option${cardNum}Text`).textContent = option.text;
                }
            }
        });
        
        const pollOptions = analytics.poll?.options || activePoll.options || [];
        if (pollOptions.length) {
            renderPollChart({
                labels: pollOptions.map(o => o.text),
                data:   pollOptions.map(o => o.votes || 0)
            });
        }
        
        allVoters = analytics.analytics.voters || [];
        renderVotersTable();
        updateFilterOptions();
        
    } catch (err) {
        console.error('Error loading poll analytics:', err);
        showToast('Failed to load analytics', 'error');
    }
}

function renderPollChart(chartData) {
    const ctx = document.getElementById('pollChart');
    if (!ctx) return;
    
    if (pollChart) {
        pollChart.destroy();
    }
    
    pollChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Votes',
                data: chartData.data,
                backgroundColor: [
                    'rgba(0, 170, 255, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}

function updateFilterOptions() {
    const filterOption = document.getElementById('filterOption');
    if (!filterOption) return;
    
    filterOption.innerHTML = '<option value="all">All Options</option>';
    
    const pollRes = allPolls.find(p => p.active);
    if (pollRes && pollRes.options) {
        pollRes.options.forEach((opt, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = opt.text;
            filterOption.appendChild(option);
        });
    }
}

function applyVoterFilters() {
    renderVotersTable();
}

function renderVotersTable() {
    const tbody = document.getElementById('votersTableBody');
    tbody.innerHTML = '';
    
    if (!allVoters || allVoters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No voters found</td></tr>';
        return;
    }
    
    const genderFilter = document.getElementById('filterGender')?.value || 'all';
    const typeFilter = document.getElementById('filterUserType')?.value || 'all';
    const optionFilter = document.getElementById('filterOption')?.value || 'all';
    
    let filteredVoters = allVoters;
    
    if (genderFilter !== 'all') {
        filteredVoters = filteredVoters.filter(v => v.gender === genderFilter);
    }
    
    if (typeFilter !== 'all') {
        filteredVoters = filteredVoters.filter(v => v.userType === typeFilter);
    }
    
    if (optionFilter !== 'all') {
        // filter by option text or index
        filteredVoters = filteredVoters.filter(v =>
            (v.option && v.option === optionFilter) ||
            String(v.selectedOption) === optionFilter
        );
    }
    
    if (filteredVoters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No voters match filters</td></tr>';
        return;
    }
    
    filteredVoters.forEach((voter, index) => {
        const tr = document.createElement('tr');
        
        // ✅ voter.option is already the text from backend
        const selectedOptionText = voter.option || voter.selectedOption || 'N/A';
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${voter.username || 'Anonymous'}</strong></td>
            <td>${voter.gender || 'N/A'}</td>
            <td><span class="status-badge ${(voter.userType||'') === 'earner' ? 'status-active' : ''}">${voter.userType || 'N/A'}</span></td>
            <td>${selectedOptionText}</td>
            <td>${voter.votedAt ? new Date(voter.votedAt).toLocaleString() : 'N/A'}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadSponsored() {
    try {
        const tbody = document.getElementById('sponsoredTableBody');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading...</td></tr>';
        
        const res = await fetch(`${API_URL}/api/admin/sponsored`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load sponsored');
        
        const data = await res.json();
        allSponsored = data.sponsored || [];
        renderSponsoredTable();
    } catch (err) {
        console.error('Error loading sponsored:', err);
        showToast('Failed to load sponsored content', 'error');
    }
}

function renderSponsoredTable() {
    const tbody = document.getElementById('sponsoredTableBody');
    tbody.innerHTML = '';
    
    if (allSponsored.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No sponsored content found</td></tr>';
        return;
    }
    
    allSponsored.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    
    allSponsored.forEach((item) => {
        const tr = document.createElement('tr');
        const statusClass = item.active ? 'status-active' : 'status-inactive';
        const statusText = item.active ? 'Active' : 'Inactive';
        
        tr.innerHTML = `
            <td><strong>${item.priority || '-'}</strong></td>
            <td><strong>${item.title}</strong></td>
            <td>${item.price}</td>
            <td><strong>${item.clicks || 0}</strong></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${new Date(item.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-delete" onclick="deleteSponsored('${item._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function createSponsored() {
    try {
        if (selectedImages.length === 0) {
            showToast('Please upload at least one image', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('label', document.getElementById('newSponsoredLabel').value);
        formData.append('title', document.getElementById('newSponsoredTitle').value);
        formData.append('price', document.getElementById('newSponsoredPrice').value);
        formData.append('shortDescription', document.getElementById('newSponsoredShortDesc').value);
        formData.append('fullDescription', document.getElementById('newSponsoredFullDesc').value);
        formData.append('url', document.getElementById('newSponsoredURL').value);
        formData.append('buttonText', document.getElementById('newSponsoredButtonText')?.value || 'Get Now');
        formData.append('priority', document.getElementById('newSponsoredPriority').value);
        formData.append('audience', document.getElementById('newSponsoredAudience')?.value || 'all');
        formData.append('thumbnailIndex', document.getElementById('newSponsoredThumbnailIndex')?.value || '0');
        formData.append('active', document.getElementById('newSponsoredActive').checked);
        
        if (selectedImages.length === 0) {
            showToast('Please upload at least one image', 'error');
            return;
        }

        for (let i = 0; i < selectedImages.length; i++) {
            if (selectedImages[i].file) {
                formData.append('images', selectedImages[i].file, selectedImages[i].name || `image${i}.jpg`);
            }
        }
        
        if (!formData.get('title') || !formData.get('price')) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        const res = await fetch(`${API_URL}/api/admin/sponsored`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!res.ok) throw new Error('Failed to create sponsored content');
        
        showToast('Sponsored content created successfully', 'success');
        showSuccess('sponsoredSuccess');
        
        document.getElementById('newSponsoredLabel').value = 'SPONSORED';
        document.getElementById('newSponsoredTitle').value = '';
        document.getElementById('newSponsoredPrice').value = '';
        document.getElementById('newSponsoredShortDesc').value = '';
        document.getElementById('newSponsoredFullDesc').value = '';
        document.getElementById('newSponsoredURL').value = '';
        if (document.getElementById('newSponsoredButtonText')) {
            document.getElementById('newSponsoredButtonText').value = 'Get Now';
        }
        document.getElementById('newSponsoredPriority').value = '1';
        document.getElementById('newSponsoredImages').value = '';
        document.getElementById('newSponsoredImagesPreview').innerHTML = '';
        selectedImages = [];
        
        loadSponsored();
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error creating sponsored content', 'error');
    }
}

async function deleteSponsored(id) {
    if (!confirm('Are you sure you want to delete this sponsored content?')) return;
    
    try {
        const res = await fetch(`${API_URL}/api/admin/sponsored/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to delete sponsored content');
        
        showToast('Sponsored content deleted successfully', 'success');
        loadSponsored();
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error deleting sponsored content', 'error');
    }
}

async function loadWalletImages() {
    try {
        const tbody = document.getElementById('walletImagesTableBody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Loading...</td></tr>';
        
        const res = await fetch(`${API_URL}/api/admin/wallet-images`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load wallet images');
        
        const data = await res.json();
        allWalletImages = data.walletImages || [];
        renderWalletImagesTable();
    } catch (err) {
        console.error('Error loading wallet images:', err);
        showToast('Failed to load wallet images', 'error');
    }
}

function renderWalletImagesTable() {
    const tbody = document.getElementById('walletImagesTableBody');
    tbody.innerHTML = '';
    
    if (allWalletImages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No wallet images found</td></tr>';
        return;
    }
    
    allWalletImages.forEach((item, index) => {
        const tr = document.createElement('tr');
        const statusClass = item.active ? 'status-active' : 'status-inactive';
        const statusText  = item.active ? 'Active' : 'Inactive';
        const audBadge    = { all: '👥 All', earner: '💼 Earner', advertiser: '📢 Adv' };
        const audColor    = { all: 'var(--primary)', earner: '#10b981', advertiser: '#f59e0b' };
        const aud         = item.audience || 'all';

        tr.innerHTML = `
            <td>${item.priority || 1}</td>
            <td><strong>${item.title}</strong><br>
                <small style="color:var(--text-muted);">${item.shortDescription || ''}</small>
            </td>
            <td><span style="font-size:11px;color:${audColor[aud]};font-weight:600;">${audBadge[aud]||aud}</span></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${new Date(item.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" onclick="editWalletImage('${item._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon ${item.active ? 'btn-delete' : 'btn-up'}"
                            onclick="toggleWalletImage('${item._id}')"
                            title="${item.active ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${item.active ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteWalletImage('${item._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function createWalletImage() {
    try {
        const formData = new FormData();
        formData.append('title', document.getElementById('newWalletImageTitle').value);
        formData.append('shortDescription', document.getElementById('newWalletImageDesc').value);
        formData.append('priority', document.getElementById('newWalletImagePriority')?.value || '1');
        formData.append('audience', document.getElementById('newWalletAudience')?.value || 'all');
        formData.append('active', document.getElementById('newWalletImageActive').checked);
        
        const imageInput = document.getElementById('newWalletImageFile');
        if (!imageInput.files || !imageInput.files[0]) {
            showToast('Please upload an image', 'error');
            return;
        }
        
        formData.append('image', imageInput.files[0]);
        formData.append('audience', document.getElementById('newWalletAudience')?.value || 'all');
        
        if (!formData.get('title')) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        
        const res = await fetch(`${API_URL}/api/admin/wallet-images`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        if (!res.ok) throw new Error('Failed to create wallet image');
        
        showToast('Wallet image created successfully', 'success');
        showSuccess('walletImageSuccess');
        
        document.getElementById('newWalletImageTitle').value = '';
        document.getElementById('newWalletImageDesc').value = '';
        document.getElementById('newWalletImageFile').value = '';
        document.getElementById('newWalletImagePreview').classList.remove('show');
        
        loadWalletImages();
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error creating wallet image', 'error');
    }
}

async function toggleWalletImage(id) {
    const item = allWalletImages.find(w => w._id === id);
    if (!item) return;
    try {
        const res = await fetch(`${API_URL}/api/admin/wallet-images/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ active: !item.active })
        });
        if (!res.ok) throw new Error('Failed to toggle');
        showToast(`Wallet image ${item.active ? 'deactivated' : 'activated'}`, 'success');
        loadWalletImages();
    } catch (err) {
        showToast(err.message || 'Error toggling wallet image', 'error');
    }
}

function editWalletImage(id) {
    const item = allWalletImages.find(w => w._id === id);
    if (!item) return;
    document.getElementById('newWalletImageTitle').value   = item.title || '';
    document.getElementById('newWalletImageDesc').value    = item.shortDescription || '';
    if (document.getElementById('newWalletImagePriority'))
        document.getElementById('newWalletImagePriority').value = item.priority || 1;
    if (document.getElementById('newWalletAudience'))
        document.getElementById('newWalletAudience').value = item.audience || 'all';
    document.getElementById('newWalletImageActive').checked = item.active !== false;
    editingWalletId = id;
    document.querySelector('#wallet-images-section .admin-card').scrollIntoView({ behavior: 'smooth' });
    showToast('Editing wallet image — update fields and save', 'info');
}

async function deleteWalletImage(id) {
    if (!confirm('Are you sure you want to delete this wallet image?')) return;
    
    try {
        const res = await fetch(`${API_URL}/api/admin/wallet-images/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to delete wallet image');
        
        showToast('Wallet image deleted successfully', 'success');
        loadWalletImages();
        loadDashboardStats();
    } catch (err) {
        showToast(err.message || 'Error deleting wallet image', 'error');
    }
}

function handleTargetTypeChange() {
    const targetType = document.getElementById('messageTargetType').value;
    const usernameGroup = document.getElementById('usernameFieldGroup');
    const criteriaGroup = document.getElementById('criteriaFieldsGroup');
    
    if (targetType === 'username') {
        usernameGroup.style.display = 'block';
        criteriaGroup.style.display = 'none';
    } else if (targetType === 'criteria') {
        usernameGroup.style.display = 'none';
        criteriaGroup.style.display = 'block';
    } else {
        usernameGroup.style.display = 'none';
        criteriaGroup.style.display = 'none';
    }
}

async function loadAdminMessages() {
    try {
        const tbody = document.getElementById('messagesTableBody');
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Loading...</td></tr>';
        
        const res = await fetch(`${API_URL}/api/admin/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load messages');
        
        const data = await res.json();
        allMessages = data.messages || [];
        renderMessagesTable();
    } catch (err) {
        console.error('Error loading messages:', err);
        showToast('Failed to load messages', 'error');
    }
}

function renderMessagesTable() {
    const tbody = document.getElementById('messagesTableBody');
    tbody.innerHTML = '';
    
    if (allMessages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">No messages found</td></tr>';
        return;
    }
    
    allMessages.forEach((msg, index) => {
        const tr = document.createElement('tr');
        
        let targetDisplay = '';
        if (msg.targetType === 'all') {
            targetDisplay = '<span class="status-badge" style="background: rgba(139, 92, 246, 0.1); color: var(--purple);">All Users</span>';
        } else if (msg.targetType === 'username') {
            targetDisplay = `<span class="status-badge status-active">${msg.username}</span>`;
        } else if (msg.targetType === 'criteria') {
            const criteriaLabels = {
                'referrals': 'Referrals',
                'tasks_earner': 'Tasks (Earner)',
                'tasks_advertiser': 'Tasks (Adv)',
                'deposit': 'Deposits',
                'withdrawal': 'Withdrawals',
                'earnings': 'Earnings'
            };
            targetDisplay = `<span class="status-badge" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">
                ${criteriaLabels[msg.criteriaType] || msg.criteriaType} ≥ ${msg.criteriaAmount}
            </span>`;
        }
        
        const statusClass = msg.active ? 'status-active' : 'status-inactive';
        const statusText = msg.active ? 'Active' : 'Inactive';
        
        const typeDisplay = msg.type ? 
            `<span class="status-badge" style="background: rgba(${getTypeColor(msg.type)}, 0.1);">${msg.type}</span>` :
            '<span class="status-badge">info</span>';
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${targetDisplay}</td>
            <td>${(() => { const a = msg.audience||'all'; return {all:'👥 All',earner:'💼 Earner',advertiser:'📢 Adv'}[a]||a; })()}</td>
            <td>${typeDisplay}</td>
            <td><strong>${msg.title}</strong></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${msg.text}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${new Date(msg.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" onclick="editMessage('${msg._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon ${msg.active ? 'btn-delete' : 'btn-up'}" 
                            onclick="toggleMessageStatus('${msg._id}')" 
                            title="${msg.active ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${msg.active ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteMessage('${msg._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getTypeColor(type) {
    const colors = {
        'success': '16, 185, 129',
        'warning': '245, 158, 11',
        'danger': '239, 68, 68',
        '': '0, 170, 255'
    };
    return colors[type] || colors[''];
}

async function saveAdminMessage() {
    try {
        const targetType = document.getElementById('messageTargetType').value;
        
        const data = {
            targetType: targetType,
            audience:  document.getElementById('adminMessageAudience')?.value || 'all',
            active: document.getElementById('adminMessageActive').checked,
            type: document.getElementById('adminMessageType').value,
            icon: document.getElementById('adminMessageIcon').value,
            title: document.getElementById('adminMessageTitle').value,
            text: document.getElementById('adminMessageText').value,
            buttonText: document.getElementById('adminMessageButtonText')?.value?.trim() || null,
            buttonUrl:  document.getElementById('adminMessageButtonUrl')?.value?.trim()  || null,
            expiresAt:  document.getElementById('adminMessageExpiry')?.value || null
        };
        
        if (targetType === 'username') {
            data.username = document.getElementById('adminMessageUsername').value.trim();
            if (!data.username) {
                showToast('Please enter a username', 'error');
                return;
            }
        } else if (targetType === 'criteria') {
            data.criteriaType = document.getElementById('messageCriteriaType').value;
            data.criteriaAmount = parseInt(document.getElementById('messageCriteriaAmount').value);
            if (!data.criteriaAmount || data.criteriaAmount <= 0) {
                showToast('Please enter a valid amount/count', 'error');
                return;
            }
        }
        
        if (!data.title || !data.text) {
            showToast('Please fill in title and message', 'error');
            return;
        }
        
        const url = editingId ? 
            `${API_URL}/api/admin/messages/${editingId}` : 
            `${API_URL}/api/admin/messages`;
        
        const method = editingId ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error('Failed to save message');
        
        showToast('Message saved successfully!', 'success');
        showSuccess('messageSuccess');
        
        resetMessageForm();
        loadAdminMessages();
        
    } catch (err) {
        console.error('Error saving message:', err);
        showToast(err.message || 'Error saving message', 'error');
    }
}

function resetMessageForm() {
    document.getElementById('messageTargetType').value = 'all';
    document.getElementById('adminMessageUsername').value = '';
    document.getElementById('messageCriteriaType').value = 'referrals';
    document.getElementById('messageCriteriaAmount').value = '';
    document.getElementById('adminMessageActive').checked = true;
    document.getElementById('adminMessageType').value = 'success';
    document.getElementById('adminMessageIcon').value = 'fa-party-horn';
    document.getElementById('adminMessageTitle').value = '';
    document.getElementById('adminMessageText').value = '';
    if (document.getElementById('adminMessageButtonText')) {
        document.getElementById('adminMessageButtonText').value = '';
    }
    if (document.getElementById('adminMessageButtonUrl')) {
        document.getElementById('adminMessageButtonUrl').value = '';
    }
    
    document.getElementById('usernameFieldGroup').style.display = 'none';
    document.getElementById('criteriaFieldsGroup').style.display = 'none';
    
    editingId = null;
}

function editMessage(id) {
    const message = allMessages.find(m => m._id === id);
    if (!message) return;
    
    editingId = id;
    
    document.getElementById('messageTargetType').value = message.targetType;
    document.getElementById('adminMessageActive').checked = message.active;
    document.getElementById('adminMessageType').value = message.type || '';
    document.getElementById('adminMessageIcon').value = message.icon || 'fa-party-horn';
    document.getElementById('adminMessageTitle').value = message.title;
    document.getElementById('adminMessageText').value = message.text;
    if (document.getElementById('adminMessageButtonText')) {
        document.getElementById('adminMessageButtonText').value = message.buttonText || '';
    }
    if (document.getElementById('adminMessageButtonUrl')) {
        document.getElementById('adminMessageButtonUrl').value = message.buttonUrl || '';
    }
    
    if (message.targetType === 'username') {
        document.getElementById('adminMessageUsername').value = message.username || '';
        document.getElementById('usernameFieldGroup').style.display = 'block';
        document.getElementById('criteriaFieldsGroup').style.display = 'none';
    } else if (message.targetType === 'criteria') {
        document.getElementById('messageCriteriaType').value = message.criteriaType;
        document.getElementById('messageCriteriaAmount').value = message.criteriaAmount;
        document.getElementById('usernameFieldGroup').style.display = 'none';
        document.getElementById('criteriaFieldsGroup').style.display = 'block';
    }
    
    document.querySelector('#messages-section .admin-card').scrollIntoView({ behavior: 'smooth' });
    showToast('Edit mode activated', 'info');
}

async function toggleMessageStatus(id) {
    try {
        const message = allMessages.find(m => m._id === id);
        if (!message) return;
        
        const res = await fetch(`${API_URL}/api/admin/messages/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to toggle status');
        
        showToast(`Message ${message.active ? 'deactivated' : 'activated'}`, 'success');
        loadAdminMessages();
    } catch (err) {
        showToast(err.message || 'Error toggling status', 'error');
    }
}

async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
        const res = await fetch(`${API_URL}/api/admin/messages/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to delete message');
        
        showToast('Message deleted successfully', 'success');
        loadAdminMessages();
    } catch (err) {
        showToast(err.message || 'Error deleting message', 'error');
    }
}

async function loadReferralsSettings() {
    try {
        const res = await fetch(`${API_URL}/api/admin/referrals/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to load settings');
        
        const data = await res.json();
        const settings = data.settings || {};
        
        document.getElementById('earnerBonus').value = settings.earnerBonus || 500;
        document.getElementById('advertiserBonus').value = settings.advertiserBonus || 5;
        
        if (settings.activationFeeBanner) {
            document.getElementById('activationFeeActive').checked = settings.activationFeeBanner.active || false;
            document.getElementById('activationFeeTitle').value = settings.activationFeeBanner.title || '';
            document.getElementById('activationFeeMessage').value = settings.activationFeeBanner.message || '';
            document.getElementById('activationFeeAmount').value = settings.activationFeeBanner.amount || 1000;
            document.getElementById('activationFeeButtonText').value = settings.activationFeeBanner.buttonText || 'Pay Now';
            document.getElementById('activationFeeButtonIcon').value = settings.activationFeeBanner.buttonIcon || 'fa-check-circle';
            document.getElementById('activationFeeBannerType').value = settings.activationFeeBanner.type || 'warning';
        }
        
        if (settings.achievement) {
            const ach = settings.achievement;
            document.getElementById('referralsGoal').value       = ach.goal     || 100;
            document.getElementById('achievementIcon').value     = ach.icon     || 'fa-trophy';
            document.getElementById('achievementGoalText').value = ach.goalText || 'Refer {remaining} more friends!';
            document.getElementById('achievementActive').checked = ach.active !== false;
            const bonusEl = document.getElementById('achievementBonusReward');
            if (bonusEl) bonusEl.value = parseFloat(ach.bonusReward) || 0;
            const achAudEl = document.getElementById('achievementAudience');
            if (achAudEl && ach.audience) achAudEl.value = ach.audience;
        }
        
        document.getElementById('currentEarnerBonus').textContent = `₦${settings.earnerBonus || 500}`;
        document.getElementById('currentAdvertiserBonus').textContent = `${settings.advertiserBonus || 5}%`;
        document.getElementById('currentReferralsGoal').textContent = settings.achievement?.goal || 100;
        document.getElementById('currentActivationFee').textContent = `₦${settings.activationFeeBanner?.amount || 1000}`;
        const bonusStatEl = document.getElementById('currentBonusReward');
        if (bonusStatEl) bonusStatEl.textContent = `₦${settings.achievement?.bonusReward || 0}`;
        const masterEl = document.getElementById('masterReferralText');
        if (masterEl && settings.masterReferralText) masterEl.value = settings.masterReferralText;
        
        updateActivationPreview();
        updateAchievementPreview();
        
    } catch (err) {
        console.error('Error loading referrals settings:', err);
        showToast('Failed to load settings', 'error');
    }
}

async function saveReferralRewards() {
    try {
        const masterText = document.getElementById('masterReferralText')?.value?.trim() || 'Master Referrals';
        const data = {
            earnerBonus:        parseInt(document.getElementById('earnerBonus').value),
            advertiserBonus:    parseFloat(document.getElementById('advertiserBonus').value),
            masterReferralText: masterText
        };
        
        const res = await fetch(`${API_URL}/api/admin/referrals/rewards`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error('Failed to save rewards');
        
        showToast('Referral rewards saved successfully', 'success');
        showSuccess('referralsSuccess');
        
        loadReferralsSettings();
    } catch (err) {
        showToast(err.message || 'Error saving referral rewards', 'error');
    }
}

async function saveActivationFeeBanner() {
    try {
        const data = {
            active: document.getElementById('activationFeeActive').checked,
            title: document.getElementById('activationFeeTitle').value,
            message: document.getElementById('activationFeeMessage').value,
            amount: parseInt(document.getElementById('activationFeeAmount').value),
            buttonText: document.getElementById('activationFeeButtonText').value,
            buttonIcon: document.getElementById('activationFeeButtonIcon').value,
            type: document.getElementById('activationFeeBannerType').value
        };
        
        const res = await fetch(`${API_URL}/api/admin/referrals/activation-fee`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error('Failed to save activation fee banner');
        
        showToast('Activation fee banner saved successfully', 'success');
        showSuccess('referralsSuccess');
        
        loadReferralsSettings();
    } catch (err) {
        showToast(err.message || 'Error saving activation fee banner', 'error');
    }
}

async function saveGeneralMessage() {
    try {
        const data = {
            audience:    document.getElementById('generalMsgAudience')?.value || 'all',
            type:        document.getElementById('generalMsgType').value,
            icon:        document.getElementById('generalMsgIcon').value.trim(),
            title:       document.getElementById('generalMsgTitle').value.trim(),
            text:        document.getElementById('generalMsgText').value.trim(),
            buttonText:  document.getElementById('generalMsgButtonText').value.trim() || null,
            buttonUrl:   document.getElementById('generalMsgButtonUrl').value.trim()  || null,
            active:      document.getElementById('generalMsgActive').checked,
            targetType:  'all',
            isGeneral:   true,
            expiresAt:   document.getElementById('generalMsgExpiry')?.value || null
        };

        if (!data.title || !data.text) {
            showToast('Title and message are required', 'error');
            return;
        }

        const url    = editingGeneralId
            ? `${API_URL}/api/admin/messages/${editingGeneralId}`
            : `${API_URL}/api/admin/messages`;
        const method = editingGeneralId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Failed to save');
        showToast('General message saved!', 'success');

        editingGeneralId = null;
        document.getElementById('generalMsgTitle').value     = '';
        document.getElementById('generalMsgText').value      = '';
        document.getElementById('generalMsgIcon').value      = 'fas fa-bullhorn';
        document.getElementById('generalMsgButtonText').value = '';
        document.getElementById('generalMsgButtonUrl').value  = '';
        document.getElementById('generalMsgActive').checked  = true;

        loadGeneralMessages();
    } catch (err) {
        showToast(err.message || 'Error saving', 'error');
    }
}

async function loadGeneralMessages() {
    try {
        const tbody = document.getElementById('generalMessagesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">Loading...</td></tr>';

        const res = await fetch(`${API_URL}/api/admin/messages?isGeneral=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        allGeneralMessages = (data.messages || []).filter(m => m.isGeneral);
        renderGeneralMessagesTable();
    } catch (err) {
        console.error('loadGeneralMessages error:', err);
    }
}

function renderGeneralMessagesTable() {
    const tbody = document.getElementById('generalMessagesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!allGeneralMessages.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted);">No general messages yet</td></tr>';
        return;
    }

    allGeneralMessages.forEach((msg) => {
        const tr = document.createElement('tr');
        const statusClass = msg.active ? 'status-active' : 'status-inactive';
        const audBadge    = { all:'👥 All', earner:'💼 Earner', advertiser:'📢 Adv' };
        const aud         = msg.audience || 'all';
        const expiry      = msg.expiresAt ? new Date(msg.expiresAt).toLocaleDateString() : 'Never';

        tr.innerHTML = `
            <td><strong>${msg.title}</strong></td>
            <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${msg.text}</td>
            <td><small style="color:var(--primary);">${audBadge[aud]||aud}</small></td>
            <td><span class="status-badge ${statusClass}">${msg.active ? 'Active' : 'Inactive'}</span></td>
            <td><small>${expiry}</small></td>
            <td><small>${new Date(msg.createdAt).toLocaleDateString()}</small></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" onclick="editGeneralMessage('${msg._id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon ${msg.active ? 'btn-delete' : 'btn-up'}"
                            onclick="toggleGeneralMessage('${msg._id}')"
                            title="${msg.active ? 'Deactivate' : 'Activate'}">
                        <i class="fas fa-${msg.active ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteGeneralMessage('${msg._id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editGeneralMessage(id) {
    const msg = allGeneralMessages.find(m => m._id === id);
    if (!msg) return;
    document.getElementById('generalMsgType').value      = msg.type || 'info';
    document.getElementById('generalMsgIcon').value      = msg.icon || 'fas fa-bullhorn';
    document.getElementById('generalMsgTitle').value     = msg.title || '';
    document.getElementById('generalMsgText').value      = msg.text || '';
    document.getElementById('generalMsgButtonText').value = msg.buttonText || '';
    document.getElementById('generalMsgButtonUrl').value  = msg.buttonUrl  || '';
    const genAudEl = document.getElementById('generalMsgAudience');
    if (genAudEl) genAudEl.value = msg.audience || 'all';
    const genExpEl = document.getElementById('generalMsgExpiry');
    if (genExpEl && msg.expiresAt) {
        genExpEl.value = new Date(msg.expiresAt).toISOString().slice(0,16);
    } else if (genExpEl) {
        genExpEl.value = '';
    }
    document.getElementById('generalMsgActive').checked = msg.active !== false;
    document.getElementById('generalMsgActive').checked  = msg.active !== false;
    if (document.getElementById('generalMsgAudience'))
        document.getElementById('generalMsgAudience').value = msg.audience || 'all';
    editingGeneralId = id;
    document.querySelector('#settings-section .admin-card').scrollIntoView({ behavior: 'smooth' });
    showToast('Editing general message — update and save', 'info');
}

async function toggleGeneralMessage(id) {
    const msg = allGeneralMessages.find(m => m._id === id);
    if (!msg) return;
    try {
        const res = await fetch(`${API_URL}/api/admin/messages/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ active: !msg.active })
        });
        if (!res.ok) throw new Error('Failed');
        showToast(`Message ${msg.active ? 'deactivated' : 'activated'}`, 'success');
        loadGeneralMessages();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deleteGeneralMessage(id) {
    if (!confirm('Delete this general message?')) return;
    try {
        const res = await fetch(`${API_URL}/api/admin/messages/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete');
        showToast('Deleted!', 'success');
        loadGeneralMessages();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadGeneralMessage() {
    try {
        const res = await fetch(`${API_URL}/api/admin/messages/general`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.message) return;
        const m = data.message;
        if (document.getElementById('generalMsgType'))    document.getElementById('generalMsgType').value    = m.type || 'info';
        if (document.getElementById('generalMsgIcon'))    document.getElementById('generalMsgIcon').value    = m.icon || 'fas fa-bullhorn';
        if (document.getElementById('generalMsgTitle'))   document.getElementById('generalMsgTitle').value   = m.title || '';
        if (document.getElementById('generalMsgText'))    document.getElementById('generalMsgText').value    = m.text || '';
        if (document.getElementById('generalMsgButtonText')) document.getElementById('generalMsgButtonText').value = m.buttonText || '';
        if (document.getElementById('generalMsgButtonUrl'))  document.getElementById('generalMsgButtonUrl').value  = m.buttonUrl  || '';
        if (document.getElementById('generalMsgActive'))  document.getElementById('generalMsgActive').checked = m.active || false;
    } catch {}
}

async function saveAchievement() {
    try {
        const data = {
            audience:    document.getElementById('achievementAudience')?.value || 'all',
            goal:        parseInt(document.getElementById('referralsGoal').value),
            icon:        document.getElementById('achievementIcon').value,
            goalText:    document.getElementById('achievementGoalText').value,
            active:      document.getElementById('achievementActive').checked,
            bonusReward: parseFloat(document.getElementById('achievementBonusReward')?.value || 0)
        };
        
        const res = await fetch(`${API_URL}/api/admin/referrals/achievement`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error('Failed to save achievement settings');
        
        showToast('Achievement settings saved successfully', 'success');
        showSuccess('referralsSuccess');
        
        loadReferralsSettings();
    } catch (err) {
        showToast(err.message || 'Error saving achievement settings', 'error');
    }
}

function updateActivationPreview() {
    const title = document.getElementById('activationFeeTitle').value || 'Account Not Activated';
    const message = document.getElementById('activationFeeMessage').value || 'Activate your account';
    const amount = document.getElementById('activationFeeAmount').value || '1000';
    const buttonText = document.getElementById('activationFeeButtonText').value || 'Activate Now';
    const buttonIcon = document.getElementById('activationFeeButtonIcon').value || 'fa-check-circle';
    const type = document.getElementById('activationFeeBannerType').value || 'warning';
    
    const processedMessage = message.replace(/{amount}/g, '₦' + amount);
    
    document.getElementById('previewBannerTitle').textContent = title;
    document.getElementById('previewBannerMessage').innerHTML = processedMessage;
    document.getElementById('previewBannerButton').textContent = buttonText;
    document.getElementById('previewBannerIcon').className = `fas ${buttonIcon}`;
    
    const gradients = {
        warning: 'linear-gradient(135deg, #f59e0b, #ef4444)',
        info: 'linear-gradient(135deg, #00aaff, #0066cc)',
        success: 'linear-gradient(135deg, #10b981, #059669)',
        danger: 'linear-gradient(135deg, #ef4444, #dc2626)',
        purple: 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
    };
    document.getElementById('activationBannerPreview').style.background = gradients[type];
}

function updateAchievementPreview() {
    const goal = parseInt(document.getElementById('referralsGoal').value) || 100;
    const goalText = document.getElementById('achievementGoalText').value || 'Refer {remaining} more friends!';
    
    document.getElementById('previewGoal').textContent = goal;
    
    const current = 23;
    const remaining = Math.max(0, goal - current);
    const percentage = Math.min(100, Math.round((current / goal) * 100));
    
    const processedText = goalText
        .replace(/{remaining}/g, remaining)
        .replace(/{goal}/g, goal)
        .replace(/{current}/g, current);
    
    document.getElementById('previewGoalText').textContent = processedText;
    document.getElementById('previewProgressBar').style.width = percentage + '%';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('earncial_token');
        localStorage.removeItem('admin_token');
        window.location.href = 'admin-login.html';
    }
}

window.showSection = showSection;
window.toggleContentSidebar = toggleContentSidebar;
window.closeContentSidebar = closeContentSidebar;
window.togglePlatformSidebar = togglePlatformSidebar;
window.closePlatformSidebar = closePlatformSidebar;
window.toggleTheme = toggleTheme;

window.previewImage = previewImage;
window.previewMultipleImages = previewMultipleImages;
window.removePreviewImage = removePreviewImage;

window.addPollOption = addPollOption;
window.removeOption = removeOption;

let allAdModals = [];
let editingAdModalId = null;

async function loadAdModals() {
    try {
        const res = await fetch(`${API_URL}/api/admin/ad-modal`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load ad modals');
        const data = await res.json();
        allAdModals = data.adModals || [];

        const tbody = document.getElementById('adModalTableBody');
        if (!tbody) return;

        if (!allAdModals.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No ad modals yet</td></tr>';
            return;
        }

        tbody.innerHTML = allAdModals.map(ad => `
            <tr>
                <td>${ad.title}</td>
                <td>${ad.description ? ad.description.substring(0,50)+'...' : '-'}</td>
                <td>${ad.buttonText ? `<a href="${ad.buttonUrl}" target="_blank">${ad.buttonText}</a>` : '-'}</td>
                <td>Every ${ad.intervalHours}h${ad.autoCloseSeconds ? ` · ${ad.autoCloseSeconds}s auto-close` : ''}</td>
                <td><span class="status-badge ${ad.active ? 'active' : 'inactive'}">${ad.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <button class="btn-action btn-edit" onclick="editAdModal('${ad._id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-toggle" onclick="toggleAdModal('${ad._id}')">${ad.active ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>'}</button>
                    <button class="btn-action btn-delete" onclick="deleteAdModal('${ad._id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        showToast(err.message || 'Error loading ad modals', 'error');
    }
}

async function createAdModal() {
    try {
        const formData = new FormData();
        formData.append('title',           document.getElementById('adModalTitle').value.trim());
        formData.append('description',     document.getElementById('adModalDescription').value.trim());
        formData.append('buttonText',      document.getElementById('adModalButtonText').value.trim());
        formData.append('buttonUrl',       document.getElementById('adModalButtonUrl').value.trim());
        formData.append('intervalHours',   document.getElementById('adModalInterval').value || '24');
        formData.append('autoCloseSeconds',document.getElementById('adModalAutoClose').value || '0');
        formData.append('audience',        document.getElementById('adModalAudience')?.value || 'all');
        formData.append('active',          document.getElementById('adModalActive').checked);

        const logoInput = document.getElementById('adModalLogo');
        if (logoInput?.files?.[0]) formData.append('logo', logoInput.files[0]);

        if (!formData.get('title')) {
            showToast('Title is required', 'error');
            return;
        }

        const url    = editingAdModalId ? `${API_URL}/api/admin/ad-modal/${editingAdModalId}` : `${API_URL}/api/admin/ad-modal`;
        const method = editingAdModalId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) throw new Error('Failed to save ad modal');

        showToast(editingAdModalId ? 'Ad modal updated!' : 'Ad modal created!', 'success');
        resetAdModalForm();
        loadAdModals();
    } catch (err) {
        showToast(err.message || 'Error saving ad modal', 'error');
    }
}

function editAdModal(id) {
    const ad = allAdModals.find(a => a._id === id);
    if (!ad) return;
    editingAdModalId = id;

    document.getElementById('adModalTitle').value         = ad.title || '';
    document.getElementById('adModalDescription').value   = ad.description || '';
    document.getElementById('adModalButtonText').value    = ad.buttonText || '';
    document.getElementById('adModalButtonUrl').value     = ad.buttonUrl  || '';
    document.getElementById('adModalInterval').value      = ad.intervalHours || 24;
    document.getElementById('adModalAutoClose').value     = ad.autoCloseSeconds || 0;
    document.getElementById('adModalActive').checked      = ad.active;

    const saveBtn = document.getElementById('adModalSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Update Ad Modal';

    document.getElementById('adModal-section')?.scrollIntoView({ behavior: 'smooth' });
}

function resetAdModalForm() {
    editingAdModalId = null;
    document.getElementById('adModalTitle').value       = '';
    document.getElementById('adModalDescription').value = '';
    document.getElementById('adModalButtonText').value  = '';
    document.getElementById('adModalButtonUrl').value   = '';
    document.getElementById('adModalInterval').value    = '24';
    document.getElementById('adModalAutoClose').value   = '0';
    document.getElementById('adModalActive').checked    = true;
    if (document.getElementById('adModalLogo')) document.getElementById('adModalLogo').value = '';
    if (document.getElementById('adModalLogoPreview')) document.getElementById('adModalLogoPreview').src = '';

    const saveBtn = document.getElementById('adModalSaveBtn');
    if (saveBtn) saveBtn.textContent = 'Create Ad Modal';
}

async function toggleAdModal(id) {
    try {
        const res = await fetch(`${API_URL}/api/admin/ad-modal/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to toggle');
        showToast('Status updated', 'success');
        loadAdModals();
    } catch (err) {
        showToast(err.message || 'Error', 'error');
    }
}

async function deleteAdModal(id) {
    if (!confirm('Delete this ad modal?')) return;
    try {
        const res = await fetch(`${API_URL}/api/admin/ad-modal/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to delete');
        showToast('Deleted', 'success');
        loadAdModals();
    } catch (err) {
        showToast(err.message || 'Error', 'error');
    }
}

window.createAnnouncement     = createAnnouncement;
window.toggleContentTypeFields = toggleContentTypeFields;
window.saveGeneralMessage      = saveGeneralMessage;
window.loadGeneralMessages     = loadGeneralMessages;
window.editGeneralMessage      = editGeneralMessage;
window.toggleGeneralMessage    = toggleGeneralMessage;
window.deleteGeneralMessage    = deleteGeneralMessage;
window.loadGeneralMessage      = loadGeneralMessage;
window.deleteAnnouncement = deleteAnnouncement;

window.createPoll = createPoll;
window.deletePoll = deletePoll;

window.createSponsored = createSponsored;
window.loadAdModals   = loadAdModals;
window.createAdModal  = createAdModal;
window.editAdModal    = editAdModal;
window.resetAdModalForm = resetAdModalForm;
window.toggleAdModal  = toggleAdModal;
window.deleteAdModal  = deleteAdModal;
window.deleteSponsored = deleteSponsored;

window.createWalletImage   = createWalletImage;
window.toggleWalletImage   = toggleWalletImage;
window.editWalletImage     = editWalletImage;
window.previewAnnImages    = previewAnnImages;
window.removeAnnImage      = removeAnnImage;
window.deleteWalletImage = deleteWalletImage;

window.handleTargetTypeChange = handleTargetTypeChange;
window.saveAdminMessage = saveAdminMessage;
window.editMessage = editMessage;
window.toggleMessageStatus = toggleMessageStatus;
window.deleteMessage = deleteMessage;

window.saveReferralRewards = saveReferralRewards;
window.saveActivationFeeBanner = saveActivationFeeBanner;
window.saveAchievement = saveAchievement;
window.updateActivationPreview = updateActivationPreview;
window.updateAchievementPreview = updateAchievementPreview;
window.applyVoterFilters = applyVoterFilters;

window.logout = logout;


