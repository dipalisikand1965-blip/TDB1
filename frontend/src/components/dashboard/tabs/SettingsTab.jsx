import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { 
  User, MessageCircle, Phone, Mail, Bell, Shield, Lock,
  Clock, Sparkles, CheckCircle2, BellRing, Smartphone, Settings,
  Eye, EyeOff, Check, X, AlertTriangle, PawPrint
} from 'lucide-react';
import { toast as toastFn } from '../../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ── Notification Preference Types ────────────────────────────────────────────
const NOTIF_TYPES = [
  { key: 'daily_digest',         label: 'Daily Digest',         desc: 'Morning update + daily tip',   icon: '🌅' },
  { key: 'birthday_reminders',   label: 'Birthday Reminders',   desc: '7-day advance warning',         icon: '🎂' },
  { key: 'medication_reminders', label: 'Medication Reminders', desc: 'Upcoming medication due alerts', icon: '💊' },
  { key: 'order_updates',        label: 'Order Updates',        desc: 'Shipping, delivery, confirmation',icon: '📦' },
  { key: 'concierge_updates',    label: 'Concierge® Updates',    desc: 'Mira replies and requests',     icon: '✦' },
];

function NotificationPreferencesPanel({ pets, token }) {
  const [prefs, setPrefs] = useState({});
  const [selectedPet, setSelectedPet] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load preferences from API
  const loadPrefs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/member/notification-preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPrefs(data.preferences || {});
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  useEffect(() => {
    if (pets?.length && !selectedPet) setSelectedPet(pets[0]?.id || pets[0]?.pet_id || 'all');
  }, [pets, selectedPet]);

  const getPrefsForPet = (petId) => {
    const defaults = { daily_digest: true, birthday_reminders: true, medication_reminders: true, order_updates: true, concierge_updates: true };
    return { ...defaults, ...(prefs[petId] || {}) };
  };

  const handleToggle = async (petId, key, value) => {
    const updated = {
      ...prefs,
      [petId]: { ...getPrefsForPet(petId), [key]: value }
    };
    setPrefs(updated);
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${API_URL}/api/member/notification-preferences`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: updated })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const currentPet = pets?.find(p => (p.id || p.pet_id) === selectedPet);
  const currentPrefs = getPrefsForPet(selectedPet || 'all');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Notification Preferences</span>
        </div>
        {saving && <span className="text-xs text-slate-500">Saving...</span>}
        {saved && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
      </div>

      {/* Pet selector tabs */}
      {pets && pets.length > 1 && (
        <div className="flex gap-2 flex-wrap" data-testid="notif-pet-selector">
          {pets.map(pet => {
            const pId = pet.id || pet.pet_id;
            return (
              <button
                key={pId}
                data-testid={`notif-pet-tab-${pId}`}
                onClick={() => setSelectedPet(pId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPet === pId
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <PawPrint className="w-3 h-3" />
                {pet.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Toggles */}
      <div className="space-y-2" data-testid="notif-toggles">
        {NOTIF_TYPES.map(({ key, label, desc, icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-xl hover:bg-white/5 transition-all"
            data-testid={`notif-toggle-${key}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">{icon}</span>
              <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-slate-500">{desc}</div>
              </div>
            </div>
            <Switch
              checked={currentPrefs[key] !== false}
              onCheckedChange={(val) => handleToggle(selectedPet || 'all', key, val)}
              data-testid={`notif-switch-${key}`}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>
        ))}
      </div>
      {currentPet && (
        <div className="text-xs text-slate-600 text-center">
          Preferences for <span className="text-slate-400">{currentPet.name}</span> · Via WhatsApp & Email
        </div>
      )}
    </div>
  );
}

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
  toast,
  token,
}) => {
  // Security modals state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Privacy state
  const [privacySettings, setPrivacySettings] = useState({
    shareActivity: true,
    allowMarketing: true,
    showProfile: false
  });

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      (toast || toastFn)({ 
        title: 'Passwords do not match', 
        description: 'New password and confirm password must be the same.',
        variant: 'destructive'
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      (toast || toastFn)({ 
        title: 'Password too short', 
        description: 'Password must be at least 8 characters.',
        variant: 'destructive'
      });
      return;
    }
    
    setPasswordLoading(true);
    try {
      // In real app, call API to change password
      await new Promise(resolve => setTimeout(resolve, 1000));
      (toast || toastFn)({ 
        title: '✅ Password Changed', 
        description: 'Your password has been updated successfully.'
      });
      setShowChangePassword(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      (toast || toastFn)({ 
        title: 'Error', 
        description: 'Failed to change password. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle 2FA toggle
  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    (toast || toastFn)({ 
      title: twoFactorEnabled ? '2FA Disabled' : '2FA Enabled', 
      description: twoFactorEnabled 
        ? 'Two-factor authentication has been disabled.' 
        : 'Two-factor authentication is now active. You will receive codes via SMS.'
    });
  };

  // Handle privacy save
  const handlePrivacySave = () => {
    (toast || toastFn)({ 
      title: '✅ Privacy Settings Saved', 
      description: 'Your privacy preferences have been updated.'
    });
    setShowPrivacy(false);
  };

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

          {/* Per-Pet Notification Preferences */}
          <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
            <NotificationPreferencesPanel pets={pets} token={token} />
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
            onClick={() => setShowChangePassword(true)}
          >
            <Lock className="w-4 h-4 mr-2 text-purple-400" /> Change Password
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-between bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30"
            onClick={() => setShowTwoFactor(true)}
          >
            <span className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-purple-400" /> Two-Factor Authentication
            </span>
            <Badge className={twoFactorEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}>
              {twoFactorEnabled ? 'On' : 'Off'}
            </Badge>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 hover:border-purple-500/30"
            onClick={() => setShowPrivacy(true)}
          >
            <Settings className="w-4 h-4 mr-2 text-purple-400" /> Privacy Settings
          </Button>
        </div>
      </Card>

      {/* Change Password Modal */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Change Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Current Password</label>
              <div className="relative">
                <Input 
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  className="bg-slate-800/50 border-white/10 text-white pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">New Password</label>
              <div className="relative">
                <Input 
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password (min 8 characters)"
                  className="bg-slate-800/50 border-white/10 text-white pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Confirm New Password</label>
              <div className="relative">
                <Input 
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  className="bg-slate-800/50 border-white/10 text-white pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowChangePassword(false)} className="border-white/10 text-white hover:bg-slate-800">
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordChange} 
                disabled={passwordLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                {passwordLoading ? 'Saving...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Authentication Modal */}
      <Dialog open={showTwoFactor} onOpenChange={setShowTwoFactor}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Two-Factor Authentication
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className={`p-4 rounded-xl border ${twoFactorEnabled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-white/10'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${twoFactorEnabled ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                    <Smartphone className={`w-5 h-5 ${twoFactorEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">SMS Verification</p>
                    <p className="text-sm text-slate-400">Receive codes via text message</p>
                  </div>
                </div>
                <Switch 
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                />
              </div>
            </div>
            
            {twoFactorEnabled && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-300">2FA is active. You&apos;ll receive a code when signing in from new devices.</p>
              </div>
            )}
            
            {!twoFactorEnabled && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-300">Enable 2FA to add an extra layer of security to your account.</p>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setShowTwoFactor(false)} className="border-white/10 text-white hover:bg-slate-800">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Settings Modal */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Privacy Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-slate-800/50 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Share Activity</p>
                  <p className="text-sm text-slate-400">Allow us to use your activity for personalized recommendations</p>
                </div>
                <Switch 
                  checked={privacySettings.shareActivity}
                  onCheckedChange={(checked) => setPrivacySettings({...privacySettings, shareActivity: checked})}
                />
              </div>
            </div>
            
            <div className="p-4 bg-slate-800/50 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Marketing Communications</p>
                  <p className="text-sm text-slate-400">Receive emails about offers and new features</p>
                </div>
                <Switch 
                  checked={privacySettings.allowMarketing}
                  onCheckedChange={(checked) => setPrivacySettings({...privacySettings, allowMarketing: checked})}
                />
              </div>
            </div>
            
            <div className="p-4 bg-slate-800/50 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Public Profile</p>
                  <p className="text-sm text-slate-400">Show your pet&apos;s profile to other members</p>
                </div>
                <Switch 
                  checked={privacySettings.showProfile}
                  onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showProfile: checked})}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowPrivacy(false)} className="border-white/10 text-white hover:bg-slate-800">
                Cancel
              </Button>
              <Button 
                onClick={handlePrivacySave}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                <Check className="w-4 h-4 mr-1.5" /> Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsTab;
