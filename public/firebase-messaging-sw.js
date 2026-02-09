// Firebase Cloud Messaging Service Worker
// This runs in the background to receive push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDlf3UvAS9HIB9LVRWNCspc7bOVIbTJtj4",
  authDomain: "soccerscoreboardappv2.firebaseapp.com",
  projectId: "soccerscoreboardappv2",
  storageBucket: "soccerscoreboardappv2.firebasestorage.app",
  messagingSenderId: "1052102391458",
  appId: "1:1052102391458:web:581306f87621fcb05b89fb"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || '⏱️ Period Ended!';
  const notificationOptions = {
    body: payload.notification?.body || 'Time is up!',
    icon: '/app-icon.png',
    badge: '/app-icon.png',
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    tag: 'timer-alarm',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
