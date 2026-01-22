import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Mail, MessageSquare, Bell, Send, Clock, RefreshCw, Loader2,
  ChevronRight, Eye, Calendar, Filter, Search, Inbox, BarChart3,
  CheckCircle, XCircle, AlertCircle, PawPrint, User, Phone,
  FileText, Edit, Trash2, Plus, Copy, History, Settings, Zap
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../../hooks/use-toast';
import { getApiUrl } from '../../utils/api';

// Channel icons and colors
const CHANNEL_CONFIG = {
  email: { icon: Mail, color: 'bg-blue-100 text-blue-700', label: 'Email' },
  whatsapp: { icon: MessageSquare, color: 'bg-green-100 text-green-700', label: 'WhatsApp' },
  in_app: { icon: Bell, color: 'bg-purple-100 text-purple-700', label: 'In-App' }
};

// Priority colors
const PRIORITY_CONFIG = {
  critical: { color: 'bg-red-100 text-red-700', label: 'Critical' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
  normal: { color: 'bg-blue-100 text-blue-700', label: 'Normal' },
  low: { color: 'bg-gray-100 text-gray-600', label: 'Low' }
};

const CommunicationsManager = ({ authHeaders }) => {
  const [activeView, setActiveView] = useState('templates');
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [pendingReminders, setPendingReminders] = useState([]);
  const [configStatus, setConfigStatus] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Test email form
  const [testEmail, setTestEmail] = useState({
    to_email: '',
    subject: 'Test Email from The Doggy Company',
    body: 'This is a test email from the Unified Reminder System.\n\nIf you received this, email integration is working correctly!',
    pet_name: ''
  });

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, analyticsRes, historyRes, pendingRes, configRes] = await Promise.all([
        axios.get(`${getApiUrl()}/api/admin/communications/templates`, { headers: authHeaders }),
        axios.get(`${getApiUrl()}/api/admin/communications/analytics`, { headers: authHeaders }),
        axios.get(`${getApiUrl()}/api/admin/communications/history?limit=50`, { headers: authHeaders }),
        axios.get(`${getApiUrl()}/api/admin/communications/pending?days_ahead=14`, { headers: authHeaders }),
        axios.get(`${getApiUrl()}/api/admin/communications/config-status`, { headers: authHeaders })
      ]);
      
      setTemplates(templatesRes.data.templates || []);
      setAnalytics(analyticsRes.data);
      setHistory(historyRes.data.history || []);
      setPendingReminders(pendingRes.data.reminders || []);
      setConfigStatus(configRes.data);
    } catch (error) {
      console.error('Failed to fetch communications data:', error);
      toast({ title: 'Error', description: 'Failed to load communications data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendTestEmail = async () => {
    if (!testEmail.to_email) {
      toast({ title: 'Error', description: 'Please enter an email address', variant: 'destructive' });
      return;
    }
    
    setSending(true);
    try {
      const res = await axios.post(
        `${getApiUrl()}/api/admin/communications/test-email`,
        testEmail,
        { headers: authHeaders }
      );
      
      if (res.data.success) {
        toast({ title: 'Success', description: 'Test email sent successfully!' });
        setShowTestEmailModal(false);
      } else {
        toast({ title: 'Failed', description: res.data.error || 'Failed to send email', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to send test email', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-purple-600" />
            Unified Communications
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Memory-driven messaging system powered by Pet Soul™
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowTestEmailModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Test Email
          </Button>
        </div>
      </div>

      {/* Integration Status Cards */}
      {configStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`p-4 border-l-4 ${configStatus.email?.configured ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${configStatus.email?.configured ? 'bg-green-100' : 'bg-red-100'}`}>
                <Mail className={`w-5 h-5 ${configStatus.email?.configured ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Email ({configStatus.email?.provider})</p>
                <p className="text-xs text-gray-500">{configStatus.email?.sender_email}</p>
              </div>
              {configStatus.email?.configured ? (
                <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 ml-auto" />
              )}
            </div>
          </Card>
          
          <Card className={`p-4 border-l-4 border-l-yellow-500`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">WhatsApp</p>
                <p className="text-xs text-gray-500">Provisional (click-to-chat)</p>
              </div>
              <AlertCircle className="w-5 h-5 text-yellow-500 ml-auto" />
            </div>
          </Card>
          
          <Card className={`p-4 border-l-4 border-l-green-500`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">In-App</p>
                <p className="text-xs text-gray-500">Ready</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white">
            <p className="text-sm text-gray-500">Total Sent</p>
            <p className="text-2xl font-bold text-purple-600">{analytics.total_sent}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white">
            <p className="text-sm text-gray-500">Last 7 Days</p>
            <p className="text-2xl font-bold text-blue-600">{analytics.sent_last_7_days}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-white">
            <p className="text-sm text-gray-500">Templates</p>
            <p className="text-2xl font-bold text-green-600">{templates.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-white">
            <p className="text-sm text-gray-500">Pending Reminders</p>
            <p className="text-2xl font-bold text-orange-600">{pendingReminders.length}</p>
          </Card>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'history', label: 'History', icon: History },
          { id: 'pending', label: 'Pending', icon: Clock },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeView === tab.id ? 'default' : 'ghost'}
            className={activeView === tab.id ? 'bg-purple-600' : ''}
            onClick={() => setActiveView(tab.id)}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Templates View */}
      {activeView === 'templates' && (
        <div className="space-y-4">
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Intelligence Rules</h3>
                <p className="text-sm text-purple-700 mt-1">
                  Max 1 message per pet per week (except critical). Silent during quiet hours (10 PM - 8 AM).
                  Never repeats same message type within 30 days.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4">
            {templates.map((template) => {
              const channelConfig = CHANNEL_CONFIG[template.channel] || CHANNEL_CONFIG.email;
              const priorityConfig = PRIORITY_CONFIG[template.priority] || PRIORITY_CONFIG.normal;
              const ChannelIcon = channelConfig.icon;
              
              return (
                <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {template.is_default && (
                          <Badge className="bg-gray-100 text-gray-600 text-xs">System</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-3">{template.trigger_description}</p>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={channelConfig.color}>
                          <ChannelIcon className="w-3 h-3 mr-1" />
                          {channelConfig.label}
                        </Badge>
                        <Badge className={priorityConfig.color}>
                          {priorityConfig.label}
                        </Badge>
                        {template.variables?.length > 0 && (
                          <span className="text-xs text-gray-400">
                            Variables: {template.variables.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreviewModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <Card className="p-12 text-center">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900">No communications yet</h3>
              <p className="text-sm text-gray-500 mt-1">
                Sent communications will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => {
                const channelConfig = CHANNEL_CONFIG[item.channel] || CHANNEL_CONFIG.email;
                const ChannelIcon = channelConfig.icon;
                
                return (
                  <Card key={idx} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${channelConfig.color}`}>
                        <ChannelIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 truncate">{item.subject}</span>
                          <Badge className={item.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {item.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {item.pet_name && (
                            <span className="flex items-center gap-1">
                              <PawPrint className="w-3 h-3" />
                              {item.pet_name}
                            </span>
                          )}
                          {item.parent_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {item.parent_email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(item.sent_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pending Reminders View */}
      {activeView === 'pending' && (
        <div className="space-y-4">
          {pendingReminders.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900">All caught up!</h3>
              <p className="text-sm text-gray-500 mt-1">
                No pending reminders in the next 14 days
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingReminders.map((reminder, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-orange-100">
                        <Bell className="w-5 h-5 text-orange-600" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{reminder.pet_name}</span>
                          <Badge className="bg-purple-100 text-purple-700">{reminder.type.replace(/_/g, ' ')}</Badge>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {reminder.parent_name && <span>{reminder.parent_name} • </span>}
                          {reminder.days_until !== undefined && (
                            <span className="text-orange-600 font-medium">
                              {reminder.days_until === 0 ? 'Today' : 
                               reminder.days_until === 1 ? 'Tomorrow' : 
                               `In ${reminder.days_until} days`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={PRIORITY_CONFIG[reminder.priority]?.color || 'bg-gray-100'}>
                      {reminder.priority}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Template Preview
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-gray-500">Template Name</Label>
                <p className="font-medium">{selectedTemplate.name}</p>
              </div>
              
              <div>
                <Label className="text-gray-500">Trigger</Label>
                <p className="text-sm">{selectedTemplate.trigger_description}</p>
              </div>
              
              <div>
                <Label className="text-gray-500">Subject</Label>
                <p className="font-medium">{selectedTemplate.subject}</p>
              </div>
              
              <div>
                <Label className="text-gray-500">Message Body</Label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg border whitespace-pre-wrap text-sm">
                  {selectedTemplate.body}
                </div>
              </div>
              
              {selectedTemplate.variables?.length > 0 && (
                <div>
                  <Label className="text-gray-500">Variables</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTemplate.variables.map((v) => (
                      <Badge key={v} variant="outline" className="font-mono text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Email Modal */}
      <Dialog open={showTestEmailModal} onOpenChange={setShowTestEmailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600" />
              Send Test Email
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Recipient Email *</Label>
              <Input
                type="email"
                value={testEmail.to_email}
                onChange={(e) => setTestEmail({ ...testEmail, to_email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            
            <div>
              <Label>Subject</Label>
              <Input
                value={testEmail.subject}
                onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Pet Name (optional)</Label>
              <Input
                value={testEmail.pet_name}
                onChange={(e) => setTestEmail({ ...testEmail, pet_name: e.target.value })}
                placeholder="e.g., Mojo"
              />
              <p className="text-xs text-gray-500 mt-1">Adds a pet badge to the email</p>
            </div>
            
            <div>
              <Label>Message</Label>
              <Textarea
                value={testEmail.body}
                onChange={(e) => setTestEmail({ ...testEmail, body: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestEmailModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendTestEmail}
              disabled={sending || !testEmail.to_email}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunicationsManager;
