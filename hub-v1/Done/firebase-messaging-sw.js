// ============================================================
// FIREBASE MESSAGING SERVICE WORKER
// ============================================================

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ✅ Firebase Config
firebase.initializeApp({
    apiKey: "AIzaSyD-oB1wuM8nBA4XPayAaDCiNPiBXxF-N2o",
    authDomain: "earncialwebapp.firebaseapp.com",
    projectId: "earncialwebapp",
    storageBucket: "earncialwebapp.firebasestorage.app",
    messagingSenderId: "565842184528",
    appId: "1:565842184528:web:24e7093c33b520b9ab0455"
});

const messaging = firebase.messaging();

// ============================================================
// HANDLE BACKGROUND NOTIFICATIONS
// ============================================================
messaging.onBackgroundMessage((payload) => {
    console.log('📩 Background notification received:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.imageUrl || payload.notification.image || '/logo.png',
        badge: '/badge.png',
        data: payload.data,
        vibrate: [200, 100, 200],
        requireInteraction: payload.data?.requireInteraction === 'true',
        actions: [
            {
                action: 'open',
                title: 'Open',
                icon: '/icons/open.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/close.png'
            }
        ],
        tag: `earncial-${payload.data?.type || 'general'}-${Date.now()}`
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ============================================================
// HANDLE NOTIFICATION CLICK
// ============================================================
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        // User clicked close button
        return;
    }

    // Get URL from notification data
    const urlToOpen = event.notification.data?.url || '/dashboard';

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if app is already open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // If not open, open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ============================================================
// HANDLE NOTIFICATION CLOSE
// ============================================================
self.addEventListener('notificationclose', (event) => {
    console.log('🔕 Notification closed:', event);
    
    // Optional: Track notification dismissal
    // You can send analytics here
});

console.log('✅ Service Worker loaded');