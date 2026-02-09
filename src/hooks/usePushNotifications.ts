import { useState, useEffect, useCallback, useRef } from 'react';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const scheduledAlarmRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if push notifications are supported
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

  // Schedule a push notification for when timer ends
  const scheduleAlarm = useCallback((delayMs: number, title: string, body: string) => {
    // Clear any existing scheduled alarm
    if (scheduledAlarmRef.current) {
      clearTimeout(scheduledAlarmRef.current);
    }

    // Schedule the alarm
    scheduledAlarmRef.current = setTimeout(async () => {
      await sendPushNotification(title, body);
    }, delayMs);

    console.log(`Alarm scheduled for ${delayMs}ms from now`);
  }, [sendPushNotification]);

  const cancelScheduledAlarm = useCallback(() => {
    if (scheduledAlarmRef.current) {
      clearTimeout(scheduledAlarmRef.current);
      scheduledAlarmRef.current = null;
      console.log('Scheduled alarm cancelled');
    }
  }, []);

  // Setup foreground message handler
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);
      // The notification will be shown automatically by the browser
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scheduledAlarmRef.current) {
        clearTimeout(scheduledAlarmRef.current);
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
