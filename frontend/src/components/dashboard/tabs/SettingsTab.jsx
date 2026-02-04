import React from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { 
  User, MessageCircle, Phone, Mail, Bell, Shield, Lock,
  Clock, Sparkles, CheckCircle2, BellRing, Smartphone, Settings
} from 'lucide-react';

const SettingsTab = ({ 
  user,
  pets,
  settings,
  settingsLoading,
  settingsSaved,
  isPushSupported,
  pushPermission,
  isPushSubscribed,
  pushLoading,
  handleSettingChange,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
  setSettings,
  setShowVoiceActions,
  toast
}) => {
  return (
    <div className="animate-in fade-in-50 duration-300 space-y-6" data-testid="settings-tab">
      {/* Voice Quick Actions on Mobile */}
      <Card className="p-4 bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-purple-900/40 border border-purple-500/20 md:hidden rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">Voice Quick Actions</h3>
            <p className="text-xs text-slate-400">Hands-free voice commands</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {['Book grooming', 'Schedule vet', 'Order food', 'Find walker', 'Plan birthday'].map((cmd) => (
            <span 
              key={cmd}
              className="px-3 py-1.5 bg-slate-800/50 rounded-full text-xs font-medium text-purple-300 border border-purple-500/20"
            >
              🎤 &quot;{cmd}&quot;
            </span>
          ))}
        </div>
        <button 
          onClick={() => setShowVoiceActions(true)}
          className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
        >
          🎙️ Try Voice Quick Actions
        </button>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile Information */}
        <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
          <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-white">
            <User className="w-5 h-5 text-purple-400" /> Profile Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">Full Name</label>
              <Input 
                defaultValue={user.name} 
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">Email</label>
              <Input 
                defaultValue={user.email} 
                disabled 
                className="bg-slate-800/30 border-white/5 text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-300">Phone</label>
              <Input 
                defaultValue={user.phone} 
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500/50"
              />
            </div>
            <Button className="w-full sm:w-auto mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
              Update Profile
            </Button>
          </div>
        </Card>

        <div className="space-y-4 sm:space-y-6">
          {/* Communication Channels */}
          <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
            <h3 className="text-base sm:text-lg font-bold mb-1 flex items-center gap-2 text-white">
              <MessageCircle className="w-5 h-5 text-purple-400" /> Communication Channels
            </h3>
            <div className="flex items-center gap-2 mb-4">
              {settingsLoading && <span className="text-xs text-slate-400">Saving...</span>}
              {settingsSaved && <span className="text-xs text-emerald-400">✓ Saved</span>}
            </div>
            <p className="text-sm text-slate-400 mb-4">Choose how you&apos;d like to hear from us</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" /> Email
                  </label>
                  <p className="text-xs text-slate-400">Order confirmations & updates</p>
                </div>
                <Switch checked={settings.email} onCheckedChange={() => handleSettingChange('email')} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-400" /> WhatsApp
                  </label>
                  <p className="text-xs text-slate-400">Quick updates & reminders</p>
                </div>
                <Switch checked={settings.whatsapp} onCheckedChange={() => handleSettingChange('whatsapp')} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-400" /> SMS
                  </label>
                  <p className="text-xs text-slate-400">Text message alerts</p>
                </div>
                <Switch checked={settings.sms} onCheckedChange={() => handleSettingChange('sms')} />
              </div>
            </div>
          </Card>

          {/* Notification Types */}
          <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
            <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <Bell className="w-5 h-5 text-purple-400" /> Notification Preferences
            </h3>
            <p className="text-sm text-slate-400 mb-4">What would you like to be notified about?</p>
            <div className="space-y-3">
              {[
                { key: 'order_updates', icon: '📦', label: 'Order Updates', desc: 'Shipping, delivery & status changes' },
                { key: 'promotional', icon: '🎁', label: 'Promotions & Offers', desc: 'Exclusive deals & new launches' },
                { key: 'celebration_reminders', icon: '🎂', label: 'Celebration Reminders', desc: 'Pet birthdays & gotcha days' },
                { key: 'health_reminders', icon: '💊', label: 'Health Reminders', desc: 'Vaccination & vet appointments' },
                { key: 'community_updates', icon: '🐾', label: 'Community Updates', desc: 'Events, meetups & activities' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl">
                  <div className="space-y-0.5 flex-1 min-w-0 mr-3">
                    <label className="text-sm font-medium text-white truncate block">{item.icon} {item.label}</label>
                    <p className="text-xs text-slate-400 truncate">{item.desc}</p>
                  </div>
                  <Switch 
                    checked={settings[item.key]} 
                    onCheckedChange={() => handleSettingChange(item.key)} 
                    className="flex-shrink-0"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* PWA Push Notifications */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-2xl">
        <h3 className="text-base sm:text-lg font-bold mb-2 flex items-center gap-2 text-white">
          <BellRing className="w-5 h-5 text-blue-400" /> Push Notifications
          <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">PWA</Badge>
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Get instant notifications on your device - even when the app is closed. Never miss an update!
        </p>
        
        <div className="space-y-4">
          {!isPushSupported ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-sm text-amber-300">
                <Smartphone className="w-4 h-4 inline mr-1" />
                Push notifications require a modern browser. Try Chrome, Firefox, or Edge.
              </p>
            </div>
          ) : pushPermission === 'denied' ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-300">
                🚫 Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/30 rounded-xl gap-3">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    Enable Push Notifications
                  </label>
                  <p className="text-xs text-slate-400">Receive instant alerts on your device</p>
                </div>
                <div className="flex gap-2">
                  {isPushSubscribed ? (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={unsubscribeFromPush}
                        disabled={pushLoading}
                        className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50"
                      >
                        Disable
                      </Button>
                      <Button 
                        size="sm"
                        onClick={sendTestNotification}
                        disabled={pushLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        Test
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={subscribeToPush}
                      disabled={pushLoading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                    >
                      {pushLoading ? 'Enabling...' : 'Enable Now'}
                    </Button>
                  )}
                </div>
              </div>
              
              {isPushSubscribed && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Push notifications are enabled! You&apos;ll receive instant updates.</span>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Security & Privacy */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-white">
          <Shield className="w-5 h-5 text-purple-400" /> Security & Privacy
        </h3>
        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full justify-start bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30"
          >
            <Lock className="w-4 h-4 mr-2 text-purple-400" /> Change Password
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30"
          >
            <Shield className="w-4 h-4 mr-2 text-purple-400" /> Two-Factor Authentication
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30"
          >
            <Settings className="w-4 h-4 mr-2 text-purple-400" /> Privacy Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsTab;
