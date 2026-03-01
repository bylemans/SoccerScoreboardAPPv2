import { useState, useEffect, useCallback, useRef } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const scheduledIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supported = 'Notification' in window && 
                     'serviceWorker' in navigator && 
                     'PushManager' in window;
    setIsSupported(supported);
  }, []);

  const initializePush = useCallback(async () => {
    if (!isSupported || isInitializing) return null;
    
    setIsInitializing(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        console.log('Push notifications initialized');
      }
      return token;
    } catch (error) {
      console.error('Failed to initialize push:', error);
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [isSupported, isInitializing]);

  const sendPushNotification = useCallback(async (title: string, body: string) => {
    if (!fcmToken) {
      console.log('No FCM token available');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: { token: fcmToken, title, body }
      });

      if (error) {
        console.error('Error sending push:', error);
        return false;
      }

      console.log('Push notification sent:', data);
      return true;
    } catch (error) {
      console.error('Failed to send push:', error);
      return false;
    }
  }, [fcmToken]);

  // Schedule a server-side push notification
  const scheduleAlarm = useCallback(async (delayMs: number, title: string, body: string) => {
    if (!fcmToken) {
      console.log('No FCM token, cannot schedule alarm');
      return;
    }

    const scheduledAt = new Date(Date.now() + delayMs).toISOString();
    
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: { 
          token: fcmToken, 
          title, 
          body, 
          scheduledAt 
        }
      });

      if (error) {
        console.error('Error scheduling push:', error);
      } else {
        console.log(`Alarm scheduled server-side for ${scheduledAt}`, data);
        scheduledIdRef.current = scheduledAt;
      }
    } catch (error) {
      console.error('Failed to schedule push:', error);
    }
  }, [fcmToken]);

  const cancelScheduledAlarm = useCallback(() => {
    // Client-side cancel marker; server alarm may still fire but that's acceptable
    scheduledIdRef.current = null;
    console.log('Scheduled alarm reference cleared');
  }, []);

  // Setup foreground message handler
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return {
    fcmToken,
    isSupported,
    isInitializing,
    initializePush,
    sendPushNotification,
    scheduleAlarm,
    cancelScheduledAlarm,
  };
};
