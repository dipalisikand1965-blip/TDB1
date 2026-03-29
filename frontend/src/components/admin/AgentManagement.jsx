import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import {
  Users, Plus, Edit, Trash2, Key, Shield, Loader2, RefreshCw,
  UserCheck, UserX, Mail, Phone, Bell, Package, Headphones,
  Inbox, Truck, Eye, EyeOff, Check, X, Clock, Download,
  Plane, Building, UtensilsCrossed, Scissors, Dumbbell, PartyPopper,
  ShoppingBag, GraduationCap, Heart, ShieldCheck, CloudRain, PawPrint
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../../hooks/use-toast';
import { getApiUrl } from '../../utils/api';

// Core permission icons and info
const CORE_PERMISSIONS = {
  notifications: { icon: Bell, name: 'Notifications', color: 'bg-yellow-100 text-yellow-700' },
  orders: { icon: Package, name: 'Orders', color: 'bg-blue-100 text-blue-700' },
  service_desk: { icon: Headphones, name: 'Service Desk', color: 'bg-purple-100 text-purple-700' },
  unified_inbox: { icon: Inbox, name: 'Unified Inbox', color: 'bg-green-100 text-green-700' },
  fulfilment: { icon: Truck, name: 'Fulfilment', color: 'bg-orange-100 text-orange-700' }
};

// Pillar permission icons and info - THE 12 LIVE PILLARS
const PILLAR_PERMISSIONS = {
  pillar_dine:       { icon: UtensilsCrossed, name: 'Dine',      color: 'bg-amber-100 text-amber-700',   emoji: '🍽️' },
  pillar_care:       { icon: Scissors,        name: 'Care',      color: 'bg-red-100 text-red-700',       emoji: '💊' },
  pillar_go:         { icon: PawPrint,        name: 'Go',        color: 'bg-green-100 text-green-700',   emoji: '🐕' },
  pillar_play:       { icon: Heart,           name: 'Play',      color: 'bg-violet-100 text-violet-700', emoji: '🎾' },
  pillar_learn:      { icon: GraduationCap,   name: 'Learn',     color: 'bg-teal-100 text-teal-700',     emoji: '🎓' },
  pillar_celebrate:  { icon: PartyPopper,     name: 'Celebrate', color: 'bg-pink-100 text-pink-700',     emoji: '🎂' },
  pillar_shop:       { icon: ShoppingBag,     name: 'Shop',      color: 'bg-orange-100 text-orange-700', emoji: '🛒' },
  pillar_services:   { icon: ShieldCheck,     name: 'Services',  color: 'bg-blue-100 text-blue-700',     emoji: '🛎️' },
  pillar_paperwork:  { icon: Shield,          name: 'Paperwork', color: 'bg-slate-100 text-slate-700',   emoji: '📄' },
  pillar_emergency:  { icon: Bell,            name: 'Emergency', color: 'bg-red-100 text-red-700',       emoji: '🚨' },
  pillar_farewell:   { icon: Heart,           name: 'Farewell',  color: 'bg-rose-100 text-rose-700',     emoji: '🌈' },
  pillar_adopt:      { icon: PawPrint,        name: 'Adopt',     color: 'bg-purple-100 text-purple-700', emoji: '🐾' },
};

// Combined for badge display
const PERMISSION_CONFIG = { ...CORE_PERMISSIONS, ...PILLAR_PERMISSIONS };

const AgentManagement = ({ authHeaders }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form state for create/edit
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    permissions: ['service_desk', 'unified_inbox']
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${getApiUrl()}/api/admin/agents`, { headers: authHeaders });
      setAgents(res.data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      toast({ title: 'Error', description: 'Failed to load agents', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreateAgent = async () => {
    if (!formData.username || !formData.password || !formData.name) {
      toast({ title: 'Error', description: 'Username, password, and name are required', variant: 'destructive' });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      await axios.post(`${getApiUrl()}/api/admin/agents`, formData, { headers: authHeaders });
      toast({ title: 'Success', description: `Agent "${formData.name}" created successfully` });
      setShowCreateModal(false);
      resetForm();
      fetchAgents();
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to create agent', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!selectedAgent) return;
    
    setSaving(true);
    try {
      await axios.put(`${getApiUrl()}/api/admin/agents/${selectedAgent.id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        permissions: formData.permissions,
        is_active: formData.is_active
      }, { headers: authHeaders });
      
      toast({ title: 'Success', description: 'Agent updated successfully' });
      setShowEditModal(false);
      fetchAgents();
    } catch (error) {
      console.error('Failed to update agent:', error);
      toast({ title: 'Error', description: 'Failed to update agent', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedAgent || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    setSaving(true);
    try {
      await axios.put(`${getApiUrl()}/api/admin/agents/${selectedAgent.id}/password`, {
        new_password: newPassword
      }, { headers: authHeaders });
      
      toast({ title: 'Success', description: 'Password changed successfully' });
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgent = async (agent) => {
    if (!confirm(`Are you sure you want to delete agent "${agent.name}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      await axios.delete(`${getApiUrl()}/api/admin/agents/${agent.id}`, { headers: authHeaders });
      toast({ title: 'Success', description: 'Agent deleted' });
      fetchAgents();
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast({ title: 'Error', description: 'Failed to delete agent', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (agent) => {
    try {
      await axios.put(`${getApiUrl()}/api/admin/agents/${agent.id}`, {
        is_active: !agent.is_active
      }, { headers: authHeaders });
      
      toast({ 
        title: agent.is_active ? 'Agent Disabled' : 'Agent Enabled',
        description: `${agent.name} has been ${agent.is_active ? 'disabled' : 'enabled'}`
      });
      fetchAgents();
    } catch (error) {
      console.error('Failed to toggle agent status:', error);
      toast({ title: 'Error', description: 'Failed to update agent', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      phone: '',
      permissions: ['service_desk', 'unified_inbox']
    });
  };

  // CSV Export function
  const handleExportCSV = () => {
    const headers = ['Username', 'Name', 'Email', 'Phone', 'Status', 'Permissions', 'Created At'];
    const rows = agents.map(a => [
      a.username || '',
      a.name || '',
      a.email || '',
      a.phone || '',
      a.is_active !== false ? 'Active' : 'Inactive',
      (a.permissions || []).join('; '),
      a.created_at ? new Date(a.created_at).toLocaleDateString() : ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agents_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openEditModal = (agent) => {
    setSelectedAgent(agent);
    setFormData({
      username: agent.username,
      password: '',
      name: agent.name,
      email: agent.email || '',
      phone: agent.phone || '',
      permissions: agent.permissions || [],
      is_active: agent.is_active !== false
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (agent) => {
    setSelectedAgent(agent);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
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
            <Users className="w-6 h-6 text-purple-600" />
            Agent Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage agent accounts for the Agent Portal
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchAgents}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportCSV}
            data-testid="export-agents-csv"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Agent Portal Info */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Headphones className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">Agent Portal URL</h3>
            <p className="text-sm text-purple-700 font-mono mt-1">
              {window.location.origin}/agent
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Share this URL with your agents. They can only access features based on their permissions.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Agents</p>
          <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {agents.filter(a => a.is_active !== false).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Disabled</p>
          <p className="text-2xl font-bold text-red-600">
            {agents.filter(a => a.is_active === false).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Logged in Today</p>
          <p className="text-2xl font-bold text-blue-600">
            {agents.filter(a => {
              if (!a.last_login) return false;
              const lastLogin = new Date(a.last_login);
              const today = new Date();
              return lastLogin.toDateString() === today.toDateString();
            }).length}
          </p>
        </Card>
      </div>

      {/* Agents List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Agent</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Username</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Contact</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Permissions</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Last Login</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {agents.map((agent) => (
                <tr key={agent.id} className={agent.is_active === false ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        agent.is_active !== false ? 'bg-purple-100' : 'bg-gray-200'
                      }`}>
                        <span className="text-lg">👤</span>
                      </div>
                      <span className="font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-gray-600 font-mono">{agent.username}</span>
                  </td>
                  <td className="p-3">
                    <div className="text-sm space-y-1">
                      {agent.email && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Mail className="w-3 h-3" />
                          {agent.email}
                        </div>
                      )}
                      {agent.phone && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone className="w-3 h-3" />
                          {agent.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(agent.permissions || []).map(perm => {
                        const config = PERMISSION_CONFIG[perm];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                          <Badge key={perm} className={`text-xs ${config.color}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge 
                      className={agent.is_active !== false 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                      }
                    >
                      {agent.is_active !== false ? (
                        <><UserCheck className="w-3 h-3 mr-1" /> Active</>
                      ) : (
                        <><UserX className="w-3 h-3 mr-1" /> Disabled</>
                      )}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {agent.last_login ? (
                      <div className="text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(agent.last_login).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Never</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openEditModal(agent)}
                        title="Edit Agent"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openPasswordModal(agent)}
                        title="Change Password"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleToggleActive(agent)}
                        title={agent.is_active !== false ? 'Disable Agent' : 'Enable Agent'}
                        className={agent.is_active !== false ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}
                      >
                        {agent.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteAgent(agent)}
                        className="text-red-600 hover:bg-red-50"
                        title="Delete Agent"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {agents.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900">No agents yet</h3>
            <p className="text-sm text-gray-500 mt-1">
              Create your first agent to get started
            </p>
            <Button 
              className="mt-4"
              onClick={() => { resetForm(); setShowCreateModal(true); }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
          </div>
        )}
      </Card>

      {/* Create Agent Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-2 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              Create New Agent
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Username *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g., john.doe"
                />
              </div>
              <div>
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block">Core Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(CORE_PERMISSIONS).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = formData.permissions.includes(key);
                  return (
                    <div
                      key={key}
                      onClick={() => togglePermission(key)}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors border ${
                        isSelected 
                          ? 'bg-purple-50 border-purple-300' 
                          : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">{config.name}</span>
                    </div>
                  );
                })}
              </div>
              
              <Label className="mb-2 block">Pillar Assignments</Label>
              <p className="text-xs text-gray-500 mb-2">Select which pillars this agent can handle</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(PILLAR_PERMISSIONS).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = formData.permissions.includes(key);
                  return (
                    <div
                      key={key}
                      onClick={() => togglePermission(key)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                        isSelected 
                          ? `${config.color} border-current` 
                          : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-lg">{config.emoji}</span>
                      <span className="text-xs font-medium truncate">{config.name.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-white z-10 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAgent}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-2 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-purple-600" />
              Edit Agent: {selectedAgent?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Username</Label>
              <Input value={formData.username} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
            </div>
            
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block">Core Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.entries(CORE_PERMISSIONS).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = formData.permissions.includes(key);
                  return (
                    <div
                      key={key}
                      onClick={() => togglePermission(key)}
                      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors border ${
                        isSelected 
                          ? 'bg-purple-50 border-purple-300' 
                          : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">{config.name}</span>
                    </div>
                  );
                })}
              </div>
              
              <Label className="mb-2 block">Pillar Assignments</Label>
              <p className="text-xs text-gray-500 mb-2">Select which pillars this agent can handle</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(PILLAR_PERMISSIONS).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = formData.permissions.includes(key);
                  return (
                    <div
                      key={key}
                      onClick={() => togglePermission(key)}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border ${
                        isSelected 
                          ? `${config.color} border-current` 
                          : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-lg">{config.emoji}</span>
                      <span className="text-xs font-medium truncate">{config.name.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter className="sticky bottom-0 bg-white z-10 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAgent}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              Change Password
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Set a new password for <strong>{selectedAgent?.name}</strong>
            </p>
            <Label>New Password</Label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={saving || !newPassword}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentManagement;
