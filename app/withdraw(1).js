// ================================================
// EARNCIAL - WITHDRAW PAGE
// withdraw.js
// ================================================

const API_URL = 'http://localhost:5000';
let token = localStorage.getItem('earncial_token');
let currentUser = null;

// State
let userBanks        = [];
let withdrawSettings = { minAmount: 500, maxAmount: 50000, dailyLimit: 100000, feePercent: 2, pinAttempts: 3, lockDuration: 60 };
let attemptsLeft     = 3;
let lockTimer        = null;
let chartInst        = null;
let historyData      = [];
let currentPage      = 1;
const PAGE_SIZE      = 10;
let currentFilter    = 'all';
let currentPeriod    = 'weekly';
let userBalance      = 0;

// ============ AUTH ============
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
    } catch {
        localStorage.clear();
        window.location.href = 'sign-in.html';
        return false;
    }
}

// ============ THEME ============
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const d = document.body.classList.contains('dark-mode');
    document.getElementById('themeIcon').className = d ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', d ? 'dark' : 'light');
    if (chartInst) updateChartColors();
}

function loadTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// ============ SIDEBAR ============
function openSidebar()  { document.getElementById('sidebar')?.classList.add('active'); document.getElementById('sidebarOverlay')?.classList.add('active'); }
function closeSidebar() { document.getElementById('sidebar')?.classList.remove('active'); document.getElementById('sidebarOverlay')?.classList.remove('active'); }

// ============ LOGOUT ============
function openLogoutModal()  { document.getElementById('logoutModal')?.classList.add('active'); }
function closeLogoutModal() { document.getElementById('logoutModal')?.classList.remove('active'); }
function confirmLogout()    { localStorage.clear(); window.location.href = 'sign-in.html'; }

// ============ TOAST ============
function showToast(type, title, msg = '') {
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
        <i class="fas ${icons[type] || 'fa-info-circle'} toast-icon"></i>
        <div class="toast-content"><strong>${title}</strong><p>${msg}</p></div>`;
    document.getElementById('toastContainer')?.appendChild(t);
    setTimeout(() => {
        t.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => t.remove(), 300);
    }, 3500);
}

// ============ FORMAT ============
const fmt  = v => `₦${parseFloat(v).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const fmtD = d => new Date(d).toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

// ============================================================
// LOAD WITHDRAW SETTINGS
// ============================================================
async function loadWithdrawSettings() {
    try {
        const res = await fetch(`${API_URL}/api/withdraw/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const s = data.settings || data;

        withdrawSettings.minAmount    = s.minAmount    ?? 500;
        withdrawSettings.maxAmount    = s.maxAmount    ?? 50000;
        withdrawSettings.dailyLimit   = s.dailyLimit   ?? 100000;
        withdrawSettings.feePercent   = s.feePercent   ?? 2;
        withdrawSettings.pinAttempts  = s.pinAttempts  ?? 3;
        withdrawSettings.lockDuration = s.lockDuration ?? 60;
        attemptsLeft = withdrawSettings.pinAttempts;

        const minAmt = withdrawSettings.minAmount;
        const maxAmt = withdrawSettings.maxAmount;

        const minEl = document.getElementById('minDisplay');
        const maxEl = document.getElementById('maxDisplay');
        if (minEl) minEl.textContent = fmt(minAmt);
        if (maxEl) maxEl.textContent = fmt(maxAmt);

        const amtInput = document.getElementById('withdrawAmount');
        if (amtInput) { amtInput.min = minAmt; amtInput.max = maxAmt; }

        const cells = document.querySelectorAll('.limit-cell .lc-val');
        if (cells[0]) cells[0].textContent = fmt(minAmt);
        if (cells[1]) cells[1].textContent = fmt(maxAmt);
        if (cells[2]) cells[2].textContent = `${withdrawSettings.feePercent}%`;

        updateAttemptsUI();
        checkFormState();
    } catch (err) {
        console.error('❌ loadWithdrawSettings error:', err);
    }
}

// ============================================================
// LOAD USER BANKS
// ============================================================
async function loadUserBanks() {
    try {
        const res = await fetch(`${API_URL}/api/banks/my-banks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        userBanks = data.banks || [];
        renderBankSelect();
    } catch (err) {
        console.error('❌ loadUserBanks error:', err);
        showToast('error', 'Error', 'Failed to load your bank accounts');
    }
}

function renderBankSelect() {
    const sel = document.getElementById('bankSelect');
    if (!sel) return;

    sel.innerHTML = '<option value="">-- Select Bank Account --</option>';

    if (userBanks.length === 0) {
        sel.innerHTML = '<option value="" disabled>No bank accounts found</option>';
        document.getElementById('noBankBox')?.classList.add('active');
        return;
    }

    userBanks.forEach(bank => {
        const opt = document.createElement('option');
        opt.value = `${bank._id}|${bank.bankName} – ${bank.accountNumber}|${bank.accountNumber}`;
        opt.textContent = `${bank.isPrimary ? '⭐ ' : ''}${bank.bankName} – ${bank.accountNumber}`;
        if (bank.isPrimary) opt.selected = true;
        sel.appendChild(opt);
    });

    updateSummary();
}

// ============================================================
// LOAD PAYMENT METHODS
// ============================================================
async function loadPaymentMethods() {
    const sel = document.getElementById('paymentMethod');
    if (!sel) return;
    sel.innerHTML = '';
    const opt = document.createElement('option');
    opt.value       = 'flutterwave';
    opt.textContent = 'Flutterwave (Automatically)';
    sel.appendChild(opt);
    updateSummary();
}

// ============================================================
// LOAD BANNERS
// ============================================================
async function loadBanners() {
    try {
        const res = await fetch(`${API_URL}/api/withdraw/users--withdraw-messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (data.general)  showBanner('generalBanner', data.general);
        else document.getElementById('generalBanner')?.classList.remove('active');

        if (data.personal) showBanner('userBanner', data.personal);
        else document.getElementById('userBanner')?.classList.remove('active');

    } catch {
        document.getElementById('generalBanner')?.classList.remove('active');
        document.getElementById('userBanner')?.classList.remove('active');
    }
}

const bannerColorMap = { info: 'blue', success: 'green', warning: 'orange', danger: 'red', error: 'red', purple: 'purple' };
const bannerIconMap  = { info: 'fa-info-circle', success: 'fa-check-circle', warning: 'fa-exclamation-triangle', danger: 'fa-times-circle', purple: 'fa-star' };

function showBanner(bannerId, { title, text, type = 'info', icon = null }) {
    const banner = document.getElementById(bannerId);
    if (!banner) return;
    const color   = bannerColorMap[type] || 'blue';
    const iconCls = icon || bannerIconMap[type] || 'fa-info-circle';
    banner.classList.remove('red', 'orange', 'blue', 'green', 'purple', 'active');
    banner.classList.add(color, 'active');
    const iconEl  = banner.querySelector('.banner-icon-wrap i');
    const titleEl = banner.querySelector('.banner-body h4');
    const textEl  = banner.querySelector('.banner-body p');
    if (iconEl)  iconEl.className    = `fas ${iconCls}`;
    if (titleEl) titleEl.textContent = title || '';
    if (textEl)  textEl.innerHTML    = text  || '';
}

// ============================================================
// LOAD USER BALANCE
// ============================================================
async function loadUserBalance() {
    try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const user = data.user || data;
        const balance = user.balance ?? user.mainBalance ?? 0;
        userBalance = balance;

        const balEl = document.getElementById('balanceDisplay');
        if (balEl) balEl.textContent = fmt(balance);

        const cells = document.querySelectorAll('.limit-cell .lc-val');
        if (cells[3]) { cells[3].textContent = fmt(balance); cells[3].style.color = 'var(--success)'; }

        checkFormState();
    } catch {
        // fail silently
    }
}

// ============================================================
// LOCK STATE
// ============================================================
function checkLockState() {
    const lockUntil = localStorage.getItem('withdraw_lock_until');
    if (!lockUntil) return false;

    const unlockTime = parseInt(lockUntil);
    if (Date.now() >= unlockTime) {
        localStorage.removeItem('withdraw_lock_until');
        attemptsLeft = withdrawSettings.pinAttempts;
        updateAttemptsUI();
        return false;
    }

    showLockedState(unlockTime);
    return true;
}

function showLockedState(unlockTime) {
    const formCard = document.querySelector('#withdrawSection .card');
    if (formCard) formCard.style.display = 'none';
    document.getElementById('lockedOverlay')?.classList.add('active');
    startLockCountdown(unlockTime);
}

function startLockCountdown(unlockTime) {
    if (lockTimer) clearInterval(lockTimer);

    function tick() {
        const remaining = unlockTime - Date.now();
        if (remaining <= 0) {
            clearInterval(lockTimer);
            lockTimer = null;
            localStorage.removeItem('withdraw_lock_until');
            attemptsLeft = withdrawSettings.pinAttempts;
            const formCard = document.querySelector('#withdrawSection .card');
            if (formCard) formCard.style.display = '';
            document.getElementById('lockedOverlay')?.classList.remove('active');
            updateAttemptsUI();
            resetPinInputs();
            showToast('success', 'Unlocked', 'You can now make a withdrawal');
            return;
        }
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        const timerEl = document.getElementById('lockTimer');
        if (timerEl) timerEl.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    }

    tick();
    lockTimer = setInterval(tick, 1000);
}

// ============================================================
// PIN UI
// ============================================================
function pinNext(el, nextId) {
    el.value = el.value.replace(/[^0-9]/g, '');
    el.classList.toggle('filled', el.value.length > 0);
    if (el.value.length === 1 && nextId) document.getElementById(nextId)?.focus();
}

function pinBack(e, prevId) {
    if (e.key === 'Backspace' && !e.target.value) document.getElementById(prevId)?.focus();
}

function resetPinInputs() {
    [1,2,3,4].forEach(i => {
        const el = document.getElementById(`wPin${i}`);
        if (el) { el.value = ''; el.classList.remove('filled'); }
    });
    document.getElementById('wPin1')?.focus();
}

function updateAttemptsUI() {
    const max   = withdrawSettings.pinAttempts;
    const left  = attemptsLeft;
    const label = document.getElementById('attemptsLabel');
    if (label) label.textContent = `${left} attempt${left !== 1 ? 's' : ''} remaining`;

    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`dot${i}`);
        if (!dot) continue;
        if (i <= Math.min(max, 3)) {
            dot.style.display    = '';
            dot.style.background = i <= left ? 'var(--border-color)' : 'var(--danger)';
        } else {
            dot.style.display = 'none';
        }
    }
}

function showAttemptsWarning(attemptsRemaining) {
    const formCard = document.querySelector('#withdrawSection .card');
    if (!formCard) return;

    if (!formCard.dataset.originalHtml) {
        formCard.dataset.originalHtml = formCard.innerHTML;
    }

    const isLastAttempt = attemptsRemaining <= 0;

    formCard.innerHTML = `
        <div style="text-align:center;padding:50px 24px;">
            <div style="width:80px;height:80px;border-radius:50%;background:rgba(239,68,68,.1);
                        color:var(--danger);font-size:36px;display:flex;align-items:center;
                        justify-content:center;margin:0 auto 18px;animation:pulse-red 2s infinite;">
                <i class="fas fa-shield-exclamation"></i>
            </div>
            <h3 style="color:var(--danger);font-size:18px;margin-bottom:10px;">Wrong PIN</h3>
            <p style="color:var(--text-muted);font-size:13px;line-height:1.7;margin-bottom:22px;">
                ${isLastAttempt
                    ? 'You have exceeded the maximum PIN attempts. Withdrawals are now locked.'
                    : `Incorrect PIN entered.<br><strong style="color:var(--danger);">${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining</strong> before account is locked.`
                }
            </p>
            ${isLastAttempt ? '' : `
            <button onclick="restoreWithdrawForm()"
                style="padding:12px 28px;background:var(--primary);color:white;border:none;
                       border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;
                       font-family:'Poppins',sans-serif;">
                <i class="fas fa-arrow-left"></i> Try Again
            </button>`}
        </div>`;

    // ✅ Prevent scroll jump
    formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function restoreWithdrawForm() {
    const formCard = document.querySelector('#withdrawSection .card');
    if (!formCard || !formCard.dataset.originalHtml) return;
    formCard.innerHTML = formCard.dataset.originalHtml;
    delete formCard.dataset.originalHtml;
    document.getElementById('withdrawForm')?.addEventListener('submit', handleFormSubmit);
    resetPinInputs();
    updateAttemptsUI();
}

// ============================================================
// SUMMARY UPDATE
// ============================================================
function updateSummary() {
    const amt   = parseFloat(document.getElementById('withdrawAmount')?.value) || 0;
    const fee   = +(amt * (withdrawSettings.feePercent / 100)).toFixed(2);
    const total = +(amt + fee).toFixed(2);

    const bankSel = document.getElementById('bankSelect');
    const bankTxt = bankSel?.options[bankSel.selectedIndex]?.text || '—';
    const gwTxt   = document.getElementById('paymentMethod')?.value || '—';

    const sAmt  = document.getElementById('summaryAmount');
    const sFee  = document.getElementById('summaryFee');
    const sRec  = document.getElementById('summaryReceive');
    const sBank = document.getElementById('summaryBank');
    const sGw   = document.getElementById('summaryGateway');

    if (sAmt)  sAmt.textContent  = fmt(amt);
    if (sFee)  sFee.textContent  = `+ ${fmt(fee)}`;
    if (sRec)  sRec.textContent  = amt.toLocaleString('en-NG', { minimumFractionDigits: 2 });
    if (sBank) sBank.textContent = (bankTxt && bankTxt !== '-- Select Bank Account --') ? bankTxt : '—';
    if (sGw)   sGw.textContent   = (gwTxt   && gwTxt   !== '-- Select Method --')       ? gwTxt   : '—';
}

// ============================================================
// FORM STATE — disable form if balance below minimum
// ============================================================
function checkFormState() {
    const submitBtn = document.getElementById('submitBtn');
    const formInputs = document.querySelectorAll('#withdrawForm input, #withdrawForm select');
    const belowMinBanner = document.getElementById('belowMinBanner');

    const isBelowMin = userBalance < withdrawSettings.minAmount;

    formInputs.forEach(el => { el.disabled = isBelowMin; });
    if (submitBtn) submitBtn.disabled = isBelowMin;

    // Show/hide a banner telling user their balance is too low
    if (belowMinBanner) {
        if (isBelowMin) {
            belowMinBanner.style.display = '';
            const textEl = document.getElementById('belowMinText');
            if (textEl) textEl.textContent = `Your balance is ${fmt(userBalance)} — minimum withdrawal is ${fmt(withdrawSettings.minAmount)}. Earn more to unlock withdrawals.`;
        } else {
            belowMinBanner.style.display = 'none';
        }
    }
}


function handleFormSubmit(e) {
    e.preventDefault();
    if (checkLockState()) return;

    const amt    = parseFloat(document.getElementById('withdrawAmount')?.value) || 0;
    const bank   = document.getElementById('bankSelect')?.value;
    const method = document.getElementById('paymentMethod')?.value;
    const pin    = [1,2,3,4].map(i => document.getElementById(`wPin${i}`)?.value || '').join('');

    if (!bank)   { showToast('error', 'Select Bank',   'Please select a bank account');    return; }
    if (!method) { showToast('error', 'Select Method', 'Please select a payment method');  return; }
    if (amt < withdrawSettings.minAmount) { showToast('error', 'Amount Too Low',  `Minimum withdrawal is ${fmt(withdrawSettings.minAmount)}`); return; }
    if (amt > withdrawSettings.maxAmount) { showToast('error', 'Amount Too High', `Maximum withdrawal is ${fmt(withdrawSettings.maxAmount)}`); return; }

    // ✅ Frontend balance check — no need to hit server
    if (amt > userBalance) {
        showToast('error', 'Insufficient Balance', `You only have ${fmt(userBalance)} available. Please enter a lower amount.`);
        return;
    }

    if (pin.length < 4) { showToast('error', 'PIN Required', 'Please enter your 4-digit withdrawal PIN'); return; }

    const fee     = +(amt * (withdrawSettings.feePercent / 100)).toFixed(2);
    const bankSel = document.getElementById('bankSelect');
    const bankTxt = bankSel.options[bankSel.selectedIndex].text;

    document.getElementById('confirmAmt').textContent    = fmt(amt);
    document.getElementById('confirmMethod').textContent = method;
    document.getElementById('confirmBank').textContent   = bankTxt;
    document.getElementById('confirmModal')?.classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal')?.classList.remove('active');
}

// ============================================================
// SUBMIT WITHDRAWAL (API)
// ============================================================
async function submitWithdrawal() {
    closeConfirmModal();

    const amt     = parseFloat(document.getElementById('withdrawAmount')?.value) || 0;
    const bankVal = document.getElementById('bankSelect')?.value || '';
    const method  = document.getElementById('paymentMethod')?.value || '';
    const pin     = [1,2,3,4].map(i => document.getElementById(`wPin${i}`)?.value || '').join('');

    const bankId = bankVal.split('|')[0];

    const btn  = document.getElementById('submitBtn');
    const icon = btn?.querySelector('.btn-icon');
    const text = btn?.querySelector('.btn-text');

    const resetBtn = () => {
        if (btn)  { btn.classList.remove('loading'); btn.disabled = false; }
        if (icon) icon.style.display = '';
        if (text) text.textContent = 'Submit Withdrawal';
    };

    if (btn)  { btn.classList.add('loading'); btn.disabled = true; }
    if (icon) icon.style.display = 'none';
    if (text) text.textContent = 'Processing...';

    try {
        const res = await fetch(`${API_URL}/api/withdraw/request`, {
            method:  'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body:    JSON.stringify({ amount: amt, bankId, paymentMethod: method, pin })
        });

        const data = await res.json();

        if (!res.ok) {
            if (data.code === 'WRONG_PIN' || res.status === 401) {
                // Always decrement locally first; use server value only if it's lower (more reliable)
                const serverLeft = data.attemptsLeft;
                attemptsLeft = (typeof serverLeft === 'number' && serverLeft < attemptsLeft)
                    ? serverLeft
                    : Math.max(0, attemptsLeft - 1);

                // ✅ Reset FIRST before replacing HTML
                resetBtn();
                resetPinInputs();

                if (attemptsLeft <= 0) {
                    const unlockTime = Date.now() + (withdrawSettings.lockDuration * 60 * 1000);
                    localStorage.setItem('withdraw_lock_until', unlockTime.toString());
                    showAttemptsWarning(0);
                    showLockedState(unlockTime);
                } else {
                    showAttemptsWarning(attemptsLeft);
                }
                return;
            }

            resetBtn();
            resetPinInputs();
            showToast('error', 'Failed', data.message || 'Withdrawal failed');
            return;
        }

        // ✅ Success
        resetBtn();
        attemptsLeft = withdrawSettings.pinAttempts;
        showReceipt(data);
        resetPinInputs();
        await loadUserBalance();
        await loadWithdrawHistory();

    } catch (err) {
        console.error('❌ submitWithdrawal error:', err);
        resetBtn();
        resetPinInputs();
        showToast('error', 'Failed', err.message);
    }
}

// ============================================================
// RECEIPT
// ============================================================
function showReceipt(data) {
    const amt      = parseFloat(document.getElementById('withdrawAmount')?.value) || 0;
    const fee      = +(amt * (withdrawSettings.feePercent / 100)).toFixed(2);
    const total    = +(amt + fee).toFixed(2);
    const bankSel  = document.getElementById('bankSelect');
    const parts    = (bankSel?.value || '').split('|');
    const bankName = parts[1] || data?.bankName || '—';
    const acctRaw  = parts[2] || data?.accountNumber || '0000000000';
    const acctMask = acctRaw.slice(0, -4).replace(/\d/g, '*') + acctRaw.slice(-4);
    const method   = document.getElementById('paymentMethod')?.value || '—';
    const ref      = data?.reference || ('EWD-' + Date.now().toString(36).toUpperCase());
    const now      = new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });

    document.getElementById('rcptAmount').textContent  = fmt(amt);
    document.getElementById('rcptRef').textContent     = ref;
    document.getElementById('rcptBank').textContent    = bankName;
    document.getElementById('rcptAcct').textContent    = acctMask;
    document.getElementById('rcptMethod').textContent  = method;
    document.getElementById('rcptGross').textContent   = fmt(amt);
    document.getElementById('rcptFee').textContent     = `+ ${fmt(fee)}`;
    document.getElementById('rcptTotal').textContent   = fmt(total);
    document.getElementById('rcptNet').textContent     = fmt(amt);
    document.getElementById('rcptDate').textContent    = now;

    const svg = document.querySelector('.check-circle-svg');
    if (svg) { const clone = svg.cloneNode(true); svg.parentNode.replaceChild(clone, svg); }

    document.getElementById('receiptModal')?.classList.add('active');
}

function copyRef() {
    const ref = document.getElementById('rcptRef')?.textContent;
    if (!ref) return;
    navigator.clipboard?.writeText(ref)
        .then(() => showToast('success', 'Copied!', ref))
        .catch(() => {
            const ta = document.createElement('textarea');
            ta.value = ref; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); ta.remove();
            showToast('success', 'Copied!', ref);
        });
}

function closeReceipt() {
    document.getElementById('receiptModal')?.classList.remove('active');
    document.getElementById('withdrawForm')?.reset();
    updateSummary();
}

function shareReceipt() {
    const amt  = document.getElementById('rcptAmount')?.textContent;
    const ref  = document.getElementById('rcptRef')?.textContent;
    const bank = document.getElementById('rcptBank')?.textContent;
    const text = `✅ Earncial Withdrawal\nAmount: ${amt}\nBank: ${bank}\nRef: ${ref}\nPowered by Earncial`;
    if (navigator.share) {
        navigator.share({ title: 'Earncial Receipt', text });
    } else {
        navigator.clipboard?.writeText(text)
            .then(() => showToast('success', 'Receipt copied!', 'Tap to paste anywhere'));
    }
}

// ============================================================
// WITHDRAWAL HISTORY
// ============================================================
async function loadWithdrawHistory() {
    try {
        const res = await fetch(`${API_URL}/api/withdraw/history?page=${currentPage}&limit=${PAGE_SIZE}&status=${currentFilter}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        historyData = data.withdrawals || data.data || [];
        renderHistory(historyData, data.total || historyData.length);
    } catch (err) {
        console.error('❌ loadWithdrawHistory error:', err);
        const tbody = document.getElementById('historyTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">Failed to load history</td></tr>`;
    }
}

function renderHistory(list, total = 0) {
    const tbody  = document.getElementById('historyTableBody');
    const count  = document.getElementById('historyCount');
    const pgInfo = document.getElementById('paginationInfo');

    if (count)  count.textContent  = `${total} record${total !== 1 ? 's' : ''}`;
    if (pgInfo) pgInfo.textContent = `Showing ${list.length} of ${total} records`;
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">
            <i class="fas fa-inbox" style="font-size:32px;display:block;margin-bottom:10px;opacity:.4;"></i>
            No withdrawals found</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map((w, i) => {
        const sClass = { pending: 'status-pending', completed: 'status-completed', failed: 'status-failed' }[w.status] || 'status-pending';
        const sIcon  = { pending: 'fa-clock', completed: 'fa-check-circle', failed: 'fa-times-circle' }[w.status] || 'fa-clock';
        const sLabel = (w.status || 'pending').charAt(0).toUpperCase() + w.status.slice(1);
        const ref    = w.reference || '—';
        const bank   = w.bankName ? `${w.bankName} – ${(w.accountNumber||'').slice(-4).padStart(10,'*')}` : '—';

        return `<tr>
            <td>${((currentPage - 1) * PAGE_SIZE) + i + 1}</td>
            <td>${fmtD(w.createdAt)}</td>
            <td>
                <span style="font-size:11px;font-weight:600;color:var(--primary);">${ref}</span>
                <i class="fas fa-copy" style="cursor:pointer;color:var(--text-muted);font-size:11px;margin-left:5px;"
                   onclick="navigator.clipboard?.writeText('${ref}').then(()=>showToast('success','Copied!','${ref}'))"></i>
            </td>
            <td class="amount-cell">${fmt(w.amount)}</td>
            <td style="color:var(--warning);">+${fmt(w.fee || 0)}</td>
            <td>${bank}</td>
            <td>${w.paymentMethod || '—'}</td>
            <td><span class="status-badge ${sClass}"><i class="fas ${sIcon}"></i> ${sLabel}</span></td>
        </tr>`;
    }).join('');

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = list.length < PAGE_SIZE;
}

function prevPage() { if (currentPage > 1) { currentPage--; loadWithdrawHistory(); } }
function nextPage() { currentPage++; loadWithdrawHistory(); }

document.getElementById('historyFilter')?.addEventListener('change', function () {
    currentFilter = this.value; currentPage = 1; loadWithdrawHistory();
});
document.querySelector('.refresh-btn')?.addEventListener('click', () => loadWithdrawHistory());

// ============================================================
// CHART
// ============================================================
const chartData = {
    weekly:  { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], completed: [0,0,0,0,0,0,0], pending: [0,0,0,0,0,0,0], failed: [0,0,0,0,0,0,0] },
    monthly: { labels: ['W1','W2','W3','W4'],                       completed: [0,0,0,0],         pending: [0,0,0,0],         failed: [0,0,0,0] },
    yearly:  { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], completed: new Array(12).fill(0), pending: new Array(12).fill(0), failed: new Array(12).fill(0) }
};

async function loadChartData(period = 'weekly') {
    try {
        const res = await fetch(`${API_URL}/api/withdraw/chart?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (data.labels)    chartData[period].labels    = data.labels;
        if (data.completed) chartData[period].completed = data.completed;
        if (data.pending)   chartData[period].pending   = data.pending;
        if (data.failed)    chartData[period].failed    = data.failed;

        if (chartInst) {
            chartInst.data.labels           = chartData[period].labels;
            chartInst.data.datasets[0].data = chartData[period].completed;
            chartInst.data.datasets[1].data = chartData[period].pending;
            chartInst.data.datasets[2].data = chartData[period].failed;
            chartInst.update();
        }
    } catch { /* fail silently */ }
}

function getChartColors() {
    const d = document.body.classList.contains('dark-mode');
    return { text: d ? '#f1f5f9' : '#1e293b', muted: d ? '#94a3b8' : '#64748b', grid: d ? '#334155' : '#e2e8f0' };
}

function updateChartColors() {
    if (!chartInst) return;
    const c = getChartColors();
    chartInst.options.plugins.legend.labels.color = c.text;
    chartInst.options.scales.x.ticks.color = c.muted;
    chartInst.options.scales.x.grid.color  = c.grid;
    chartInst.options.scales.y.ticks.color = c.muted;
    chartInst.options.scales.y.grid.color  = c.grid;
    chartInst.update();
}

function initChart() {
    const ctx = document.getElementById('withdrawChart');
    if (!ctx || !window.Chart) return;
    const c = getChartColors();
    const d = chartData.weekly;
    chartInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: d.labels,
            datasets: [
                { label: 'Completed (₦)', data: d.completed, backgroundColor: 'rgba(16,185,129,0.8)',  borderRadius: 5, borderSkipped: false },
                { label: 'Pending (₦)',   data: d.pending,   backgroundColor: 'rgba(245,158,11,0.8)',  borderRadius: 5, borderSkipped: false },
                { label: 'Failed (₦)',    data: d.failed,    backgroundColor: 'rgba(239,68,68,0.8)',   borderRadius: 5, borderSkipped: false }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: c.text, font: { family: 'Poppins' }, boxRadius: 4 } } },
            scales: {
                x: { ticks: { color: c.muted, font: { family: 'Poppins' } }, grid: { color: c.grid } },
                y: { beginAtZero: true, ticks: { color: c.muted, font: { family: 'Poppins' }, callback: v => `₦${v.toLocaleString()}` }, grid: { color: c.grid } }
            }
        }
    });
}

function switchPeriod(p, btn) {
    currentPeriod = p;
    document.querySelectorAll('.cp-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const labels = { weekly: 'Last 7 days', monthly: 'Last 4 weeks', yearly: 'Last 12 months' };
    const labelEl = document.getElementById('chartLabel');
    if (labelEl) labelEl.textContent = labels[p] || '';
    loadChartData(p);
}

// ============================================================
// INIT
// ============================================================
async function init() {
    if (!checkAuth()) return;
    loadTheme();
    initChart();

    await Promise.all([
        loadWithdrawSettings(),
        loadUserBanks(),
        loadPaymentMethods(),
        loadUserBalance(),
        loadBanners(),
        loadWithdrawHistory(),
        loadChartData('weekly')
    ]);

    checkLockState();

    document.getElementById('withdrawAmount')?.addEventListener('input', updateSummary);
    document.getElementById('bankSelect')?.addEventListener('change', updateSummary);
    document.getElementById('paymentMethod')?.addEventListener('change', updateSummary);
    document.getElementById('withdrawForm')?.addEventListener('submit', handleFormSubmit);

    updateSummary();
    updateAttemptsUI();
    console.log('✅ Withdraw page ready');
}

window.addEventListener('DOMContentLoaded', init);

// ============ EXPORTS ============
window.toggleTheme         = toggleTheme;
window.openSidebar         = openSidebar;
window.closeSidebar        = closeSidebar;
window.openLogoutModal     = openLogoutModal;
window.closeLogoutModal    = closeLogoutModal;
window.confirmLogout       = confirmLogout;
window.pinNext             = pinNext;
window.pinBack             = pinBack;
window.updateSummary       = updateSummary;
window.handleFormSubmit    = handleFormSubmit;
window.closeConfirmModal   = closeConfirmModal;
window.submitWithdrawal    = submitWithdrawal;
window.showReceipt         = showReceipt;
window.copyRef             = copyRef;
window.closeReceipt        = closeReceipt;
window.shareReceipt        = shareReceipt;
window.switchPeriod        = switchPeriod;
window.prevPage            = prevPage;
window.nextPage            = nextPage;
window.restoreWithdrawForm = restoreWithdrawForm;