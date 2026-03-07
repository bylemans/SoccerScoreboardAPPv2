import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDlf3UvAS9HIB9LVRWNCspc7bOVIbTJtj4",
  authDomain: "soccerscoreboardappv2.firebaseapp.com",
  projectId: "soccerscoreboardappv2",
  storageBucket: "soccerscoreboardappv2.firebasestorage.app",
  messagingSenderId: "1052102391458",
  appId: "1:1052102391458:web:581306f87621fcb05b89fb"
};

const VAPID_KEY = "BLDkFX-bhjilIidM9A_KhETyad6VtsVBK0NBBOq9XSPBCDI7st0UPGAH5uAGm0vW7wKDv2cbggBsXUcuGRY2Sdw";

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;

export const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseMessaging = (): Messaging | null => {
  if (typeof window === 'undefined') return null;
  
  if (!messaging) {
    const app = initializeFirebase();
    messaging = getMessaging(app);
  }
  return messaging;
};

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Use existing service worker if available, or register Firebase SW
    let registration: ServiceWorkerRegistration;
    
    const basePath = import.meta.env.BASE_URL || '/';
    const swUrl = `${basePath}firebase-messaging-sw.js`;
    
    const existingReg = await navigator.serviceWorker.getRegistration(basePath);
    if (existingReg) {
      registration = existingReg;
      console.log('Using existing Service Worker registration');
    } else {
      registration = await navigator.serviceWorker.register(swUrl, { scope: basePath });
      console.log('Registered Firebase Service Worker at', swUrl);
    }
    
    // Wait for SW to be active
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') resolve();
        });
      });
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.error('Messaging not available');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log('FCM Token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};
  
  return onMessage(messaging, callback);
};
