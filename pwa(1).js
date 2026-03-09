// ═══════════════════════════════════════════════════════
// Earncial PWA — pwa.js
// Link this file in every page with ONE line:
//   <script src="/pwa.js"></script>
// It injects the install banner + iOS modal automatically.
// No other code needed on any page.
// ═══════════════════════════════════════════════════════

(function() {
  'use strict';
  
  // ── 1. Inject CSS ───────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    // CSS variables fallback (for pages that may not have them)
    ':root{--pwa-blue:#00AAFF;--pwa-blue-dk:#0088CC;--pwa-blue-dp:#005A8C;}',
    
    // Install banner
    '.pwa-banner{position:fixed;bottom:0;left:0;right:0;z-index:10000;background:#fff;border-top:2px solid var(--blue,#00AAFF);padding:14px 20px;display:none;align-items:center;gap:14px;box-shadow:0 -4px 24px rgba(0,0,0,.12);animation:pwa-up .4s cubic-bezier(.34,1.3,.64,1);}',
    '.pwa-banner.show{display:flex;}',
    '@keyframes pwa-up{from{transform:translateY(100%);}to{transform:translateY(0);}}',
    '.pwa-banner-ico{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,var(--blue,#00AAFF),var(--blue-dp,#005A8C));display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;flex-shrink:0;}',
    '.pwa-banner-txt{flex:1;min-width:0;}',
    '.pwa-banner-title{font-family:"Plus Jakarta Sans",sans-serif;font-size:13.5px;font-weight:800;color:var(--text,#1E293B);}',
    '.pwa-banner-sub{font-size:11.5px;color:var(--text3,#64748B);margin-top:2px;}',
    '.pwa-banner-btn{background:var(--blue,#00AAFF);color:#fff;border:none;border-radius:10px;padding:9px 18px;font-family:"Plus Jakarta Sans",sans-serif;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap;transition:.3s;display:flex;align-items:center;gap:7px;flex-shrink:0;}',
    '.pwa-banner-btn:hover{background:var(--blue-dk,#0088CC);}',
    '.pwa-banner-close{background:none;border:none;color:var(--text3,#64748B);font-size:16px;cursor:pointer;padding:6px;border-radius:8px;transition:.2s;flex-shrink:0;}',
    '.pwa-banner-close:hover{background:rgba(0,0,0,.05);}',
    'body.dm .pwa-banner{background:#1e293b;border-color:#00AAFF;}',
    'body.dm .pwa-banner-title{color:#f0f9ff;}',
    'body.dm .pwa-banner-sub{color:#94a3b8;}',
    'body.dm .pwa-banner-close{color:#94a3b8;}',
    'body.dm .pwa-banner-close:hover{background:#334155;}',
    '[data-dm="1"] .pwa-banner{background:#1e293b;border-color:#00AAFF;}',
    '[data-dm="1"] .pwa-banner-title{color:#f0f9ff;}',
    '[data-dm="1"] .pwa-banner-sub{color:#94a3b8;}',
    '[data-dm="1"] .pwa-banner-close{color:#94a3b8;}',
    '@media(max-width:480px){.pwa-banner{padding:12px 14px;gap:10px;}.pwa-banner-sub{display:none;}}',
    
    // iOS modal
    '.ios-modal-bg{position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:none;align-items:flex-end;justify-content:center;}',
    '.ios-modal-bg.show{display:flex;}',
    '.ios-modal{background:#fff;border-radius:24px 24px 0 0;padding:28px 24px 44px;width:100%;max-width:500px;box-shadow:0 -8px 40px rgba(0,0,0,.2);animation:modal-up .4s cubic-bezier(.34,1.3,.64,1);}',
    'body.dm .ios-modal,[data-dm="1"] .ios-modal{background:#1e293b;}',
    '@keyframes modal-up{from{transform:translateY(100%);}to{transform:translateY(0);}}',
    '.ios-modal-handle{width:40px;height:4px;border-radius:2px;background:#E2E8F0;margin:0 auto 20px;}',
    '.ios-modal-header{display:flex;align-items:center;gap:14px;margin-bottom:24px;}',
    '.ios-modal-app-ico{width:56px;height:56px;border-radius:14px;overflow:hidden;box-shadow:0 4px 12px rgba(0,170,255,.3);flex-shrink:0;background:#00AAFF;display:flex;align-items:center;justify-content:center;}',
    '.ios-modal-app-ico img{width:100%;height:100%;object-fit:contain;}',
    '.ios-modal-app-name{font-family:"Plus Jakarta Sans",sans-serif;font-size:18px;font-weight:900;color:var(--text,#1E293B);}',
    'body.dm .ios-modal-app-name,[data-dm="1"] .ios-modal-app-name{color:#f0f9ff;}',
    '.ios-modal-app-sub{font-size:12.5px;color:var(--text3,#64748B);margin-top:3px;}',
    '.ios-modal-close{margin-left:auto;width:32px;height:32px;border-radius:50%;background:#F1F5F9;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748B;font-size:14px;transition:.2s;}',
    '.ios-modal-close:hover{background:#E2E8F0;}',
    '.ios-steps{display:flex;flex-direction:column;gap:16px;}',
    '.ios-step{display:flex;align-items:flex-start;gap:14px;}',
    '.ios-step-num{width:28px;height:28px;border-radius:50%;background:#00AAFF;color:#fff;font-family:"Plus Jakarta Sans",sans-serif;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}',
    '.ios-step-txt{font-size:14px;color:var(--text2,#334155);line-height:1.6;}',
    'body.dm .ios-step-txt,[data-dm="1"] .ios-step-txt{color:#94a3b8;}',
    '.ios-step-txt strong{color:var(--text,#1E293B);font-weight:700;}',
    'body.dm .ios-step-txt strong,[data-dm="1"] .ios-step-txt strong{color:#f0f9ff;}',
    '.ios-step-icon{display:inline-flex;align-items:center;gap:4px;background:#F0F9FF;border:1px solid #E2E8F0;border-radius:8px;padding:3px 9px;font-size:12px;font-weight:700;color:#00AAFF;margin:0 2px;vertical-align:middle;}',
    'body.dm .ios-step-icon,[data-dm="1"] .ios-step-icon{background:#334155;border-color:#475569;}',
  ].join('');
  document.head.appendChild(style);
  
  // ── 2. Inject HTML ──────────────────────────────────
  var html = [
    // Install banner
    '<div class="pwa-banner" id="pwaBanner">',
    '  <div class="pwa-banner-ico"><i class="fas fa-mobile-alt"></i></div>',
    '  <div class="pwa-banner-txt">',
    '    <div class="pwa-banner-title">Add Earncial to Home Screen</div>',
    '    <div class="pwa-banner-sub">Faster access. Works offline. No app store needed.</div>',
    '  </div>',
    '  <button class="pwa-banner-btn" id="pwaInstall"><i class="fas fa-plus"></i> Install</button>',
    '  <button class="pwa-banner-close" id="pwaDismiss"><i class="fas fa-times"></i></button>',
    '</div>',
    
    // iOS modal
    '<div class="ios-modal-bg" id="iosModalBg">',
    '  <div class="ios-modal">',
    '    <div class="ios-modal-handle"></div>',
    '    <div class="ios-modal-header">',
    '      <div class="ios-modal-app-ico">',
    '        <img src="/logo.png" alt="Earncial" onerror="this.style.display=\'none\'">',
    '      </div>',
    '      <div>',
    '        <div class="ios-modal-app-name">Install Earncial</div>',
    '        <div class="ios-modal-app-sub">Add to your iPhone Home Screen</div>',
    '      </div>',
    '      <button class="ios-modal-close" id="iosModalClose"><i class="fas fa-times"></i></button>',
    '    </div>',
    '    <div class="ios-steps">',
    '      <div class="ios-step">',
    '        <div class="ios-step-num">1</div>',
    '        <div class="ios-step-txt">Tap the <span class="ios-step-icon"><i class="fas fa-share-square"></i> Share</span> button at the bottom of Safari</div>',
    '      </div>',
    '      <div class="ios-step">',
    '        <div class="ios-step-num">2</div>',
    '        <div class="ios-step-txt">Scroll and tap <span class="ios-step-icon"><i class="fas fa-plus-square"></i> Add to Home Screen</span></div>',
    '      </div>',
    '      <div class="ios-step">',
    '        <div class="ios-step-num">3</div>',
    '        <div class="ios-step-txt"><strong>Tap "Add"</strong> — Earncial will appear on your home screen like a native app!</div>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>',
  ].join('\n');
  
  var wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);
  
  // ── 3. Logic ────────────────────────────────────────
  var pwaPrompt = null;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  
  function showBanner() {
    var b = document.getElementById('pwaBanner');
    if (b) b.classList.add('show');
  }
  
  function hideBanner() {
    var b = document.getElementById('pwaBanner');
    if (b) b.classList.remove('show');
  }
  
  // Android/Chrome — native install prompt
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    pwaPrompt = e;
    if (!localStorage.getItem('ec-pwa-dismissed') && !isStandalone) {
      setTimeout(showBanner, 5000);
    }
  });
  
  // Install button clicked
  document.addEventListener('click', function(e) {
    if (e.target && e.target.closest('#pwaInstall')) {
      if (pwaPrompt) {
        hideBanner();
        pwaPrompt.prompt();
        pwaPrompt.userChoice.then(function(r) {
          if (r.outcome === 'accepted') localStorage.setItem('ec-pwa-installed', '1');
          pwaPrompt = null;
        });
      } else if (isIOS) {
        hideBanner();
        var m = document.getElementById('iosModalBg');
        if (m) m.classList.add('show');
      }
    }
    
    // Dismiss banner
    if (e.target && e.target.closest('#pwaDismiss')) {
      hideBanner();
      localStorage.setItem('ec-pwa-dismissed', '1');
    }
    
    // Close iOS modal
    if (e.target && (e.target.closest('#iosModalClose') || e.target.id === 'iosModalBg')) {
      var m = document.getElementById('iosModalBg');
      if (m) m.classList.remove('show');
    }
  });
  
  // iOS — show install instructions
  if (isIOS && !isStandalone && !localStorage.getItem('ec-pwa-dismissed') && !localStorage.getItem('ec-ios-shown')) {
    setTimeout(function() {
      var btn = document.getElementById('pwaInstall');
      if (btn) btn.innerHTML = '<i class="fas fa-share-square"></i> How to Install';
      showBanner();
      localStorage.setItem('ec-ios-shown', '1');
    }, 6000);
  }
  
  // After install — hide banner
  window.addEventListener('appinstalled', function() {
    hideBanner();
    localStorage.setItem('ec-pwa-installed', '1');
  });
  
  // ── 4. Service Worker registration ─────────────────
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(function(e) {
      console.warn('[PWA] SW registration failed:', e);
    });
  }
  
})();