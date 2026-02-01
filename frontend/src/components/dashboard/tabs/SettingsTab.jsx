import React from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { 
  User, MessageCircle, Phone, Mail, Bell, Shield, Lock,
  Clock, Sparkles, CheckCircle2, BellRing, Smartphone
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
    <div>
      {/* Voice Quick Actions on Mobile */}
      <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border border-purple-200 md:hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Voice Quick Actions</h3>
            <p className="text-xs text-gray-500">Hands-free voice commands</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {['Book grooming', 'Schedule vet', 'Order food', 'Find walker', 'Plan birthday'].map((cmd) => (
            <span 
              key={cmd}
              className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-purple-700 border border-purple-200"
            >
              🎤 &quot;{cmd}&quot;
            </span>
          ))}
        </div>
        <button 
          onClick={() => setShowVoiceActions(true)}
          className="w-full mt-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          🎙️ Try Voice Quick Actions
        </button>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" /> Profile Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
              <Input defaultValue={user.name} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
              <Input defaultValue={user.email} disabled className="bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
              <Input defaultValue={user.phone} />
            </div>
            <Button className="mt-2 bg-purple-600 hover:bg-purple-700">Update Profile</Button>
          </div>
        </Card>

        <div className="space-y-6">
          {/* Communication Channels */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-600" /> Communication Channels
              {settingsLoading && <span className="text-xs text-gray-400 ml-2">Saving...</span>}
              {settingsSaved && <span className="text-xs text-green-500 ml-2">✓ Saved</span>}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Choose how you&apos;d like to hear from us</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" /> Email
                  </label>
                  <p className="text-xs text-gray-500">Order confirmations & updates</p>
                </div>
                <Switch checked={settings.email} onCheckedChange={() => handleSettingChange('email')} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
                  </label>
                  <p className="text-xs text-gray-500">Quick updates & reminders</p>
                </div>
                <Switch checked={settings.whatsapp} onCheckedChange={() => handleSettingChange('whatsapp')} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-500" /> SMS
                  </label>
                  <p className="text-xs text-gray-500">Text message alerts</p>
                </div>
                <Switch checked={settings.sms} onCheckedChange={() => handleSettingChange('sms')} />
              </div>
            </div>
          </Card>

          {/* Notification Types */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" /> Notification Preferences
            </h3>
            <p className="text-sm text-gray-500 mb-4">What would you like to be notified about?</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900">📦 Order Updates</label>
                  <p className="text-xs text-gray-500">Shipping, delivery & status changes</p>
                </div>
                <Switch checked={settings.order_updates} onCheckedChange={() => handleSettingChange('order_updates')} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900">🎁 Promotions & Offers</label>
                  <p className="text-xs text-gray-500">Exclusive deals & new launches</p>
                </div>
                <Switch checked={settings.promotional} onCheckedChange={() => handleSettingChange('promotional')} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900">🎂 Celebration Reminders</label>
                  <p className="text-xs text-gray-500">Pet birthdays & gotcha days</p>
                </div>
                <Switch checked={settings.celebration_reminders} onCheckedChange={() => handleSettingChange('celebration_reminders')} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900">💊 Health Reminders</label>
                  <p className="text-xs text-gray-500">Vaccination & vet appointment reminders</p>
                </div>
                <Switch checked={settings.health_reminders} onCheckedChange={() => handleSettingChange('health_reminders')} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900">🐾 Community Updates</label>
                  <p className="text-xs text-gray-500">Events, meetups & pawrent activities</p>
                </div>
                <Switch checked={settings.community_updates} onCheckedChange={() => handleSettingChange('community_updates')} />
              </div>
            </div>
          </Card>

          {/* PWA Push Notifications */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-600" /> Push Notifications
              <Badge className="bg-blue-100 text-blue-700 text-xs">PWA</Badge>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Get instant notifications on your device - even when the app is closed. Never miss an update!
            </p>
            
            <div className="space-y-4">
              {!isPushSupported ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <Smartphone className="w-4 h-4 inline mr-1" />
                    Push notifications require a modern browser. Try Chrome, Firefox, or Edge.
                  </p>
                </div>
              ) : pushPermission === 'denied' ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    🚫 Notifications are blocked. Please enable them in your browser settings.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-500" />
                        Enable Push Notifications
                      </label>
                      <p className="text-xs text-gray-500">Receive instant alerts on your device</p>
                    </div>
                    <Switch 
                      checked={isPushSubscribed}
                      disabled={pushLoading}
                      onCheckedChange={async (checked) => {
                        if (checked) {
                          const success = await subscribeToPush({
                            soul_whisper: settings.soul_whisper,
                            order_updates: settings.order_updates,
                            concierge_updates: true
                          });
                          if (success) {
                            toast({ title: '🔔 Notifications enabled!', description: "You'll now receive instant updates" });
                          }
                        } else {
                          const success = await unsubscribeFromPush();
                          if (success) {
                            toast({ title: 'Notifications disabled', description: 'You can re-enable anytime' });
                          }
                        }
                      }}
                    />
                  </div>
                  
                  {isPushSubscribed && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-800 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Notifications Active
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            You&apos;ll receive Soul Whispers™, order updates & concierge® replies
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-100"
                          onClick={async () => {
                            const sent = await sendTestNotification();
                            if (sent) {
                              toast({ title: '📬 Test sent!', description: 'Check your notifications' });
                            }
                          }}
                        >
                          Test 🔔
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Soul Whisper™ Settings */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" /> Soul Whisper™
              <Badge className="bg-purple-100 text-purple-700 text-xs">Pet Pass</Badge>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Receive gentle daily reminders to deepen your bond with your pet. One soul question at a time, delivered via WhatsApp.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    Enable Soul Whisper
                  </label>
                  <p className="text-xs text-gray-500">Daily soul questions via WhatsApp</p>
                </div>
                <Switch 
                  checked={settings.soul_whisper} 
                  onCheckedChange={() => handleSettingChange('soul_whisper')} 
                />
              </div>
              
              {settings.soul_whisper && (
                <>
                  <div className="p-3 bg-white rounded-lg border">
                    <label className="text-sm font-medium text-gray-900 mb-2 block">Frequency</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'daily', label: 'Daily', icon: '☀️' },
                        { value: 'twice_weekly', label: '2x Week', icon: '📅' },
                        { value: 'weekly', label: 'Weekly', icon: '📆' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSettings(prev => ({ ...prev, soul_whisper_frequency: opt.value }));
                            handleSettingChange('soul_whisper_frequency', opt.value);
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            settings.soul_whisper_frequency === opt.value
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg border">
                    <label className="text-sm font-medium text-gray-900 mb-2 block">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Preferred Time
                    </label>
                    <select 
                      className="w-full p-2 border rounded-lg text-sm"
                      value={settings.soul_whisper_time}
                      onChange={(e) => {
                        setSettings(prev => ({ ...prev, soul_whisper_time: e.target.value }));
                        handleSettingChange('soul_whisper_time', e.target.value);
                      }}
                    >
                      <option value="08:00">8:00 AM - Early Bird 🌅</option>
                      <option value="10:00">10:00 AM - Morning ☀️</option>
                      <option value="14:00">2:00 PM - Afternoon 🌤️</option>
                      <option value="18:00">6:00 PM - Evening 🌆</option>
                      <option value="20:00">8:00 PM - Night 🌙</option>
                    </select>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-2">📱 Preview Message:</p>
                    <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-green-500">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Soul Whisper for {pets[0]?.name || 'your pet'} 💜</span>
                        <br />
                        <span className="text-gray-600 italic">&quot;What&apos;s {pets[0]?.name || 'your pet'}&apos;s favourite spot in the house?&quot;</span>
                        <br />
                        <span className="text-xs text-purple-600">Tap to answer →</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Privacy & Security */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" /> Privacy & Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-gray-900">Share Pet Data</label>
                  <p className="text-xs text-gray-500">Allow Mira to personalize recommendations</p>
                </div>
                <Switch checked={settings.shareData} onCheckedChange={() => handleSettingChange('shareData')} />
              </div>
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full justify-start text-left">
                  <Lock className="w-4 h-4 mr-2" /> Change Password
                </Button>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-400">
                  By using this account, you agree to our <a href="/terms-of-service" className="text-purple-600 hover:underline">Terms & Conditions</a>.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
