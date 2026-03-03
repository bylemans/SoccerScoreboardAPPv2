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

  // Schedule a server-side push notification via the database
  const scheduleAlarm = useCallback(async (delayMs: number, title: string, body: string) => {
    if (!fcmToken) {
      console.log('No FCM token, cannot schedule alarm');
      return;
    }

    const sendAt = new Date(Date.now() + delayMs).toISOString();
    
    try {
      // Cancel any existing scheduled alarm first
      if (scheduledIdRef.current) {
        await supabase
          .from('scheduled_notifications')
          .delete()
          .eq('id', scheduledIdRef.current);
      }

      const { data, error } = await supabase
        .from('scheduled_notifications')
        .insert({
          fcm_token: fcmToken,
          title,
          body,
          send_at: sendAt,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error scheduling notification:', error);
      } else {
        console.log(`Alarm scheduled in DB for ${sendAt}, id: ${data.id}`);
        scheduledIdRef.current = data.id;
      }
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }, [fcmToken]);

  const cancelScheduledAlarm = useCallback(async () => {
    if (scheduledIdRef.current) {
      try {
        await supabase
          .from('scheduled_notifications')
          .delete()
          .eq('id', scheduledIdRef.current);
        console.log('Scheduled alarm cancelled:', scheduledIdRef.current);
      } catch (err) {
        console.error('Failed to cancel alarm:', err);
      }
      scheduledIdRef.current = null;
    }
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
