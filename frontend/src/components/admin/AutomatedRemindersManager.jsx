import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { 
  Bell, Calendar, Clock, Check, X, RefreshCw,
  Syringe, Scissors, Cake, Heart, Mail, MessageCircle,
  Play, Pause, History, Settings, AlertCircle, Send
} from 'lucide-react';
import { API_URL } from '../../utils/api';

// Reminder types configuration
const REMINDER_TYPES = {
  vaccination: {
    name: 'Vaccination Reminders',
    icon: Syringe,
    color: 'blue',
    description: '7 days before vaccine due date',
    frequency: 'Per pet, based on vaccine schedule'
  },
  grooming: {
    name: 'Grooming Reminders',
    icon: Scissors,
    color: 'purple',
    description: 'Based on coat type and last grooming',
    frequency: 'Every 4-8 weeks depending on breed'
  },
  birthday: {
    name: 'Birthday Reminders',
    icon: Cake,
    color: 'pink',
    description: '5 days before pet birthday',
    frequency: 'Annual per pet'
  },
  health_checkup: {
    name: 'Health Checkup Reminders',
    icon: Heart,
    color: 'red',
    description: 'Annual wellness checkup reminder',
    frequency: 'Annual per pet'
  }
};

const AutomatedRemindersManager = ({ authHeaders }) => {
  const [reminders, setReminders] = useState([]);
  const [pendingReminders, setPendingReminders] = useState([]);
  const [sentHistory, setSentHistory] = useState([]);
  const [schedulerStatus, setSchedulerStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load pending reminders
      const pendingRes = await fetch(`${API_URL}/api/admin/communications/pending`, {
        headers: authHeaders
      });
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingReminders(data.pending_reminders || []);
      }

      // Load communication history
      const historyRes = await fetch(`${API_URL}/api/admin/communications/history?limit=50`, {
        headers: authHeaders
      });
      if (historyRes.ok) {
        const data = await historyRes.json();
        setSentHistory(data.history || []);
      }

      // Load analytics for scheduler status
      const analyticsRes = await fetch(`${API_URL}/api/admin/communications/analytics`, {
        headers: authHeaders
      });
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setSchedulerStatus(data);
      }
    } catch (error) {
      console.error('Error loading reminders data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (reminder) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/communications/send`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: reminder.template_id,
          pet_id: reminder.pet_id,
          send_now: true
        })
      });

      if (response.ok) {
        loadData(); // Refresh
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const runScheduler = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/communications/run-scheduler`, {
        method: 'POST',
        headers: authHeaders
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error running scheduler:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-purple-600" />
            Automated Reminders
          </h2>
          <p className="text-gray-600 mt-1">
            Manage automated health and celebration reminders for all pets
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={runScheduler} size="sm" className="bg-purple-600">
            <Play className="w-4 h-4 mr-2" />
            Run Scheduler Now
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingReminders.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{schedulerStatus.total_sent || 0}</div>
                <div className="text-sm text-gray-600">Total Sent</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{schedulerStatus.last_7_days || 0}</div>
                <div className="text-sm text-gray-600">Last 7 Days</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <div className="text-sm text-gray-600">Scheduler</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {['overview', 'pending', 'history'].map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'bg-purple-600' : ''}
          >
            {tab === 'overview' && <Settings className="w-4 h-4 mr-2" />}
            {tab === 'pending' && <Clock className="w-4 h-4 mr-2" />}
            {tab === 'history' && <History className="w-4 h-4 mr-2" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'pending' && pendingReminders.length > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingReminders.length}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(REMINDER_TYPES).map(([type, config]) => {
            const Icon = config.icon;
            const colorClasses = {
              blue: 'bg-blue-50 border-blue-200 text-blue-700',
              purple: 'bg-purple-50 border-purple-200 text-purple-700',
              pink: 'bg-pink-50 border-pink-200 text-pink-700',
              red: 'bg-red-50 border-red-200 text-red-700'
            };
            
            return (
              <Card key={type} className={`border ${colorClasses[config.color]?.split(' ')[1] || ''}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colorClasses[config.color]?.split(' ')[0] || 'bg-gray-50'}`}>
                        <Icon className={`w-5 h-5 ${colorClasses[config.color]?.split(' ')[2] || 'text-gray-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{config.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                        <p className="text-xs text-gray-500 mt-2">{config.frequency}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Reminders</CardTitle>
            <CardDescription>
              Reminders queued for sending. Click "Send Now" to send immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingReminders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No pending reminders</p>
                <p className="text-sm mt-1">The scheduler will check for new reminders automatically</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReminders.map((reminder, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg border bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        {reminder.type === 'vaccination' ? (
                          <Syringe className="w-4 h-4 text-yellow-600" />
                        ) : reminder.type === 'birthday' ? (
                          <Cake className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <Bell className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {reminder.pet_name || 'Pet'} - {reminder.reminder_type || reminder.type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {reminder.member_name || reminder.member_email || 'Member'}
                        </p>
                        {reminder.due_date && (
                          <p className="text-xs text-gray-400">
                            Due: {new Date(reminder.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-yellow-700 bg-yellow-50">
                        Pending
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => sendReminder(reminder)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sent History</CardTitle>
            <CardDescription>
              Recent communications sent by the automated reminder system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No history yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sentHistory.slice(0, 20).map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        item.status === 'sent' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {item.channel === 'email' ? (
                          <Mail className={`w-4 h-4 ${
                            item.status === 'sent' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        ) : (
                          <MessageCircle className={`w-4 h-4 ${
                            item.status === 'sent' ? 'text-green-600' : 'text-red-600'
                          }`} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {item.template_name || item.type || 'Communication'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.recipient_email || item.pet_name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {item.sent_at ? new Date(item.sent_at).toLocaleDateString() : ''}
                      </span>
                      <Badge variant={item.status === 'sent' ? 'default' : 'destructive'} className="text-xs">
                        {item.status === 'sent' ? (
                          <><Check className="w-3 h-3 mr-1" /> Sent</>
                        ) : (
                          <><X className="w-3 h-3 mr-1" /> Failed</>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Intelligence Rules */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            Intelligence Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-white rounded-lg">
              <p className="font-medium text-gray-800">📫 Max 1 message/week</p>
              <p className="text-gray-500 text-xs mt-1">Per pet, to avoid overwhelming pet parents</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="font-medium text-gray-800">🌙 Quiet Hours</p>
              <p className="text-gray-500 text-xs mt-1">No messages between 9 PM - 8 AM IST</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="font-medium text-gray-800">🎯 Smart Prioritization</p>
              <p className="text-gray-500 text-xs mt-1">Health reminders take priority over promotional</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedRemindersManager;
