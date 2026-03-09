
// ============================================================
// BROWSER PUSH NOTIFICATIONS - COMPLETE FRONTEND
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';

// ✅ Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyD-oB1wuM8nBA4XPayAaDCiNPiBXxF-N2o",
    authDomain: "earncialwebapp.firebaseapp.com",
    projectId: "earncialwebapp",
    storageBucket: "earncialwebapp.firebasestorage.app",
    messagingSenderId: "565842184528",
    appId: "1:565842184528:web:24e7093c33b520b9ab0455"
};

// ✅ VAPID Key
const VAPID_KEY = "BDNDhVVke-fLdVd4ywp3JeXPgnTrib7j0esAdJyDMGn37wyxtiGAA_8GtTT7RK_k6jqZqhBmjpMeYjD_CpuqUfw";

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ============================================================
// REQUEST NOTIFICATION PERMISSION
// ============================================================
async function requestNotificationPermission() {
    try {
        console.log('📲 Requesting notification permission...');

        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('❌ This browser does not support notifications');
            return null;
        }

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('✅ Notification permission granted');

            // Get FCM Token
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY
            });

            console.log('🔑 FCM Token:', token);

            // ✅ Save token to backend
            await saveFCMToken(token);

            return token;

        } else if (permission === 'denied') {
            console.log('❌ Notification permission denied');
            showNotificationDeniedMessage();
            return null;
            
        } else {
            console.log('⚠️ Notification permission dismissed');
            return null;
        }

    } catch (error) {
        console.error('❌ Notification error:', error);
        return null;
    }
}

// ============================================================
// SAVE FCM TOKEN TO BACKEND
// ============================================================
async function saveFCMToken(token) {
    try {
        const authToken = localStorage.getItem('earncial_token');

        if (!authToken) {
            console.log('⚠️ No auth token found');
            return;
        }

        const res = await fetch('http://localhost:5000/api/users/save-fcm-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fcmToken: token })
        });

        const data = await res.json();

        if (res.ok) {
            console.log('✅ FCM token saved to backend');
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast('success', 'Notifications Enabled', 'You will now receive instant updates!');
            }
        } else {
            console.error('❌ Failed to save FCM token:', data.message);
        }

    } catch (error) {
        console.error('❌ Save FCM token error:', error);
    }
}

// ============================================================
// LISTEN FOR FOREGROUND NOTIFICATIONS
// ============================================================
onMessage(messaging, (payload) => {
    console.log('📩 Foreground notification received:', payload);

    const { title, body } = payload.notification;
    const imageUrl = payload.notification.imageUrl || payload.notification.image;
    const notificationType = payload.data?.type || 'general';

    // ✅ Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: imageUrl || '/logo.png',
            badge: '/badge.png',
            tag: `earncial-${notificationType}-${Date.now()}`,
            requireInteraction: payload.data?.requireInteraction === 'true',
            vibrate: [200, 100, 200],
            data: payload.data,
            silent: false
        });

        // ✅ Handle notification click
        notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            
            const url = payload.data?.url || '/dashboard';
            window.location.href = url;
            
            notification.close();
        };

        // Auto close after 10 seconds if not clicked
        setTimeout(() => {
            notification.close();
        }, 10000);
    }

    // ✅ Show in-app toast notification
    if (typeof showToast === 'function') {
        const toastType = getToastType(notificationType);
        showToast(toastType, title, body);
    }

    // ✅ Play notification sound
    playNotificationSound(notificationType);

    // ✅ Update notification badge (if exists)
    updateNotificationBadge();
});

// ============================================================
// GET TOAST TYPE BASED ON NOTIFICATION TYPE
// ============================================================
function getToastType(notificationType) {
    const typeMap = {
        'task_approved': 'success',
        'task_rejected': 'error',
        'deposit_confirmed': 'success',
        'withdrawal_approved': 'success',
        'referral_bonus': 'success',
        'account_activated': 'success',
        'new_task': 'info',
        'advertiser_task_approved': 'success',
        'advertiser_task_rejected': 'error',
        'new_submission': 'info',
        'new_deposit': 'info',
        'new_withdrawal': 'info',
        'welcome': 'info'
    };
    
    return typeMap[notificationType] || 'info';
}

// ============================================================
// PLAY NOTIFICATION SOUND
// ============================================================
function playNotificationSound(type) {
    try {
        // Different sounds for different types
        const soundMap = {
            'task_approved': '/sounds/success.mp3',
            'deposit_confirmed': '/sounds/cash.mp3',
            'withdrawal_approved': '/sounds/success.mp3',
            'referral_bonus': '/sounds/bonus.mp3',
            'task_rejected': '/sounds/error.mp3',
            'default': '/sounds/notification.mp3'
        };

        const soundFile = soundMap[type] || soundMap['default'];
        
        const audio = new Audio(soundFile);
        audio.volume = 0.5;
        audio.play().catch(err => {
            // Fallback to default notification sound
            const defaultAudio = new Audio('/sounds/notification.mp3');
            defaultAudio.volume = 0.5;
            defaultAudio.play().catch(() => {
                console.log('Could not play sound');
            });
        });
    } catch (error) {
        console.log('Audio not available');
    }
}

// ============================================================
// UPDATE NOTIFICATION BADGE
// ============================================================
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        const currentCount = parseInt(badge.textContent || '0');
        badge.textContent = currentCount + 1;
        badge.style.display = 'inline-block';
    }
}

// ============================================================
// SHOW NOTIFICATION DENIED MESSAGE
// ============================================================
function showNotificationDeniedMessage() {
    const message = `
        <div style="padding: 20px; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #ef4444;">
                <i class="fas fa-bell-slash"></i> Notifications Blocked
            </h3>
            <p style="margin: 0 0 15px; color: #475569;">
                You've blocked notifications. To receive instant updates about task approvals, deposits, and earnings:
            </p>
            <ol style="margin: 0; padding-left: 20px; color: #475569;">
                <li>Click the lock icon (🔒) in your browser's address bar</li>
                <li>Find "Notifications" in the permissions</li>
                <li>Change it to "Allow"</li>
                <li>Refresh this page</li>
            </ol>
        </div>
    `;

    // Show in modal or container
    const container = document.getElementById('notificationMessage');
    if (container) {
        container.innerHTML = message;
    }
}

// ============================================================
// CHECK NOTIFICATION SUPPORT
// ============================================================
function checkNotificationSupport() {
    if (!('Notification' in window)) {
        console.log('❌ This browser does not support notifications');
        return false;
    }

    if (!('serviceWorker' in navigator)) {
        console.log('❌ This browser does not support service workers');
        return false;
    }

    if (!('PushManager' in window)) {
        console.log('❌ This browser does not support push notifications');
        return false;
    }

    return true;
}

// ============================================================
// SHOW NOTIFICATION PROMPT (Nice UI)
// ============================================================
function showNotificationPrompt() {
    // Don't show if already decided
    if (Notification.permission !== 'default') {
        return;
    }

    const promptHTML = `
        <div id="notificationPrompt" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; max-width: 400px; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); padding: 25px; animation: slideUp 0.3s ease;">
            <div style="display: flex; align-items: start; gap: 15px;">
                <div style="font-size: 40px;">🔔</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 10px; font-size: 18px; color: #1e293b;">Enable Notifications</h3>
                    <p style="margin: 0 0 15px; font-size: 14px; color: #64748b; line-height: 1.5;">
                        Get instant updates about task approvals, earnings, deposits, and more!
                    </p>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="enableNotifications()" style="flex: 1; padding: 10px; background: #00aaff; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Enable
                        </button>
                        <button onclick="dismissNotificationPrompt()" style="padding: 10px 20px; background: #f1f5f9; color: #64748b; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            Later
                        </button>
                    </div>
                </div>
                <button onclick="dismissNotificationPrompt()" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; padding: 0; line-height: 1;">
                    ×
                </button>
            </div>
        </div>
    `;

    // Add to page
    const container = document.createElement('div');
    container.innerHTML = promptHTML;
    document.body.appendChild(container);
}

// ============================================================
// ENABLE NOTIFICATIONS (Called from prompt)
// ============================================================
window.enableNotifications = async function() {
    dismissNotificationPrompt();
    await requestNotificationPermission();
};

// ============================================================
// DISMISS NOTIFICATION PROMPT
// ============================================================
window.dismissNotificationPrompt = function() {
    const prompt = document.getElementById('notificationPrompt');
    if (prompt) {
        prompt.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => {
            prompt.remove();
        }, 300);
    }
    
    // Don't show again for 7 days
    localStorage.setItem('notificationPromptDismissed', Date.now().toString());
};

// ============================================================
// CHECK IF SHOULD SHOW PROMPT
// ============================================================
function shouldShowNotificationPrompt() {
    // Check if dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem('notificationPromptDismissed');
    if (dismissedAt) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
            return false;
        }
    }

    // Check if user is logged in
    if (!localStorage.getItem('earncial_token')) {
        return false;
    }

    // Check current permission
    if (Notification.permission !== 'default') {
        return false;
    }

    return true;
}

// ============================================================
// INITIALIZE NOTIFICATIONS
// ============================================================
async function initNotifications() {
    if (!checkNotificationSupport()) {
        console.log('⚠️ Notifications not supported on this browser');
        return;
    }

    try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service Worker registered:', registration);

        // Check current permission
        const permission = Notification.permission;
        
        if (permission === 'default') {
            // Show nice prompt after 3 seconds
            setTimeout(() => {
                if (shouldShowNotificationPrompt()) {
                    showNotificationPrompt();
                }
            }, 3000);
            
        } else if (permission === 'granted') {
            // User already granted permission, get token
            await requestNotificationPermission();
            
        } else {
            // Permission denied
            console.log('❌ Notification permission denied by user');
        }

    } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
    }
}

// ============================================================
// TEST NOTIFICATION (For development)
// ============================================================
window.testNotification = function() {
    if (Notification.permission === 'granted') {
        new Notification('🎉 Test Notification', {
            body: 'Your notifications are working perfectly!',
            icon: '/logo.png',
            badge: '/badge.png',
            vibrate: [200, 100, 200]
        });
    } else {
        console.log('⚠️ Notification permission not granted');
    }
};

// ============================================================
// AUTO-INITIALIZE
// ============================================================
if (localStorage.getItem('earncial_token')) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotifications);
    } else {
        initNotifications();
    }
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================
export { 
    requestNotificationPermission,
    initNotifications,
    checkNotificationSupport
};

console.log('✅ Notifications module loaded');