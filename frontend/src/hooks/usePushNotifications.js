/**
 * Push Notification Hook for PWA
 * Handles subscription, permission requests, and notification preferences
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../utils/api';

// Convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = (userId = null) => {
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vapidKey, setVapidKey] = useState(null);

  // Check if push is supported
  const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  // Get current permission status
  useEffect(() => {
    if (!isPushSupported) {
      setLoading(false);
      return;
    }

    setPermission(Notification.permission);
    checkSubscription();
    fetchVapidKey();
  }, []);

  // Fetch VAPID public key from backend
  const fetchVapidKey = async () => {
    try {
      const response = await fetch(`${API_URL}/api/push/vapid-public-key`);
      const data = await response.json();
      setVapidKey(data.public_key);
    } catch (err) {
      console.error('Failed to fetch VAPID key:', err);
      setError('Failed to initialize push notifications');
    }
  };

  // Check if already subscribed
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isPushSupported) {
      setError('Push notifications not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to request notification permission');
      return false;
    }
  }, [isPushSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (preferences = {}) => {
    if (!isPushSupported || !vapidKey) {
      setError('Push notifications not available');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Request permission if not granted
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setLoading(false);
          return false;
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      // Send subscription to backend
      const response = await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: pushSubscription.toJSON(),
          user_id: userId,
          preferences: {
            soul_whisper: true,
            order_updates: true,
            concierge_updates: true,
            promotions: false,
            ...preferences
          }
        })
      });

      if (response.ok) {
        setSubscription(pushSubscription);
        setIsSubscribed(true);
        console.log('Push subscription successful');
        return true;
      } else {
        throw new Error('Failed to register subscription with server');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to subscribe to notifications');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isPushSupported, vapidKey, permission, userId, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    setLoading(true);
    setError(null);

    try {
      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Notify backend
      await fetch(`${API_URL}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription.toJSON())
      });

      setSubscription(null);
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError(err.message || 'Failed to unsubscribe');
      return false;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  // Update preferences
  const updatePreferences = useCallback(async (preferences) => {
    if (!userId) return false;

    try {
      const response = await fetch(`${API_URL}/api/push/preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      return response.ok;
    } catch (err) {
      console.error('Update preferences error:', err);
      return false;
    }
  }, [userId]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    if (!userId) return false;

    try {
      const response = await fetch(`${API_URL}/api/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          title: '🐾 Test Notification',
          body: 'Your push notifications are working!',
          tag: 'test',
          data: {
            type: 'test',
            url: '/member/dashboard'
          }
        })
      });

      return response.ok;
    } catch (err) {
      console.error('Test notification error:', err);
      return false;
    }
  }, [userId]);

  return {
    // State
    isPushSupported,
    permission,
    isSubscribed,
    loading,
    error,
    
    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    sendTestNotification
  };
};

export default usePushNotifications;
