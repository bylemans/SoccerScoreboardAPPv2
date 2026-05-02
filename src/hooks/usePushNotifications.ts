import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const scheduledIdRef = useRef<string | null>(null);

  // Determine support — native Capacitor always supported
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setIsSupported(true);
      return;
    }
    const supported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;
    setIsSupported(supported);
  }, []);

  // Set up native push listeners once on mount so we never miss the registration event
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let registrationListener: any;
    let errorListener: any;

    PushNotifications.addListener('registration', (token) => {
      setFcmToken(token.value);
      console.log('[Push] Native FCM token obtained');
    }).then(l => { registrationListener = l; });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] Native registration error:', err);
    }).then(l => { errorListener = l; });

    return () => {
      registrationListener?.remove();
      errorListener?.remove();
    };
  }, []);

  const initializePush = useCallback(async () => {
    if (isInitializing) return null;
    setIsInitializing(true);

    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') {
          await PushNotifications.register();
          // Token arrives via the listener set up above
        }
        return null;
      }

      if (!isSupported) return null;

      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        console.log('[Push] Web FCM token obtained');
      }
      return token;
    } catch (error) {
      console.error('[Push] Failed to initialize:', error);
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [isSupported, isInitializing]);

  const scheduleAlarm = useCallback(async (delayMs: number, title: string, body: string) => {
    if (!fcmToken) {
      console.log('[Push] No FCM token, cannot schedule alarm');
      return;
    }

    const sendAt = new Date(Date.now() + delayMs).toISOString();

    try {
      // Clear any previous unsent alarm for this device
      await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('fcm_token', fcmToken)
        .eq('sent', false);

      const { data, error } = await supabase
        .from('scheduled_notifications')
        .insert({ fcm_token: fcmToken, title, body, send_at: sendAt })
        .select('id')
        .single();

      if (error) {
        console.error('[Push] Error scheduling alarm:', error);
      } else {
        scheduledIdRef.current = data.id;
        console.log(`[Push] Alarm scheduled for ${sendAt}, id: ${data.id}`);
      }
    } catch (error) {
      console.error('[Push] Failed to schedule alarm:', error);
    }
  }, [fcmToken]);

  const cancelScheduledAlarm = useCallback(async () => {
    if (!scheduledIdRef.current) return;
    try {
      await supabase
        .from('scheduled_notifications')
        .delete()
        .eq('id', scheduledIdRef.current);
      console.log('[Push] Alarm cancelled:', scheduledIdRef.current);
    } catch (err) {
      console.error('[Push] Failed to cancel alarm:', err);
    }
    scheduledIdRef.current = null;
  }, []);

  // Foreground message handler (web only)
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('[Push] Foreground message:', payload);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return {
    fcmToken,
    isSupported,
    isInitializing,
    initializePush,
    scheduleAlarm,
    cancelScheduledAlarm,
  };
};
