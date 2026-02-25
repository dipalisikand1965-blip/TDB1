/**
 * PushNotificationBanner - Prominent CTA to enable push notifications
 * Shows on dashboard for users who haven't enabled notifications
 */

import React, { useState } from 'react';
import { Bell, BellRing, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import usePushNotifications from '../hooks/usePushNotifications';
import { toast } from '../hooks/use-toast';

const PushNotificationBanner = ({ userId, petName = 'your pup' }) => {
  const [dismissed, setDismissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe: subscribeToPush,
  } = usePushNotifications(userId);
  
  // Don't show if:
  // - Already subscribed
  // - Push not supported
  // - User dismissed this session
  // - Permission denied
  if (isSubscribed || !isSupported || dismissed || permission === 'denied') {
    return null;
  }
  
  // Show success state briefly
  if (showSuccess) {
    return (
      <Card className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" data-testid="push-success-banner">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-800">Notifications Enabled! 🎉</p>
            <p className="text-sm text-green-600">You&apos;ll now get instant updates about {petName}</p>
          </div>
        </div>
      </Card>
    );
  }
  
  const handleEnable = async () => {
    const success = await subscribeToPush({
      soul_whisper: true,
      order_updates: true,
      celebration_reminders: true,
      concierge_updates: true
    });
    
    if (success) {
      setShowSuccess(true);
      toast({ 
        title: '🔔 Notifications Enabled!', 
        description: `You'll get updates about ${petName}'s Soul Whispers, orders & more` 
      });
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      toast({ 
        title: 'Permission Needed', 
        description: 'Please allow notifications in your browser settings',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Card 
      className="mb-6 p-4 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-purple-200 relative overflow-hidden"
      data-testid="push-notification-banner"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16 blur-2xl" />
      
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Animated bell icon */}
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <BellRing className="w-7 h-7 text-white animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">!</span>
            </span>
          </div>
          
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Stay Connected with {petName}!
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Get instant updates: Soul Whispers™, order tracking, celebration reminders &amp; Meera&apos;s tips
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleEnable}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            data-testid="enable-push-btn"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Enabling...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Enable Notifications
              </>
            )}
          </Button>
          
          <button
            onClick={() => setDismissed(true)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default PushNotificationBanner;
