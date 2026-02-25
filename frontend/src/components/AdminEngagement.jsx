/**
 * AdminEngagement - Admin panel for engagement features
 * Milestones, Streaks, Shareable Cards configuration
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Flame, Share2, Settings, Plus, Trash2, Save, 
  Loader2, Edit2, X, Check, Gift, Star, Calendar, Sparkles,
  Image, Palette
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getApiUrl } from '../utils/api';
import { toast } from 'sonner';

const AdminEngagement = () => {
  const [activeTab, setActiveTab] = useState('milestones');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [milestoneTypes, setMilestoneTypes] = useState([]);
  const [cardTemplates, setCardTemplates] = useState([]);
  const [streakConfig, setStreakConfig] = useState(null);
  
  // Edit states
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [newMilestone, setNewMilestone] = useState(null);

  useEffect(() => {
    fetchAllConfigs();
  }, []);

  const fetchAllConfigs = async () => {
    setLoading(true);
    try {
      const [milestonesRes, templatesRes, streakRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/engagement/admin/milestone-types`),
        fetch(`${getApiUrl()}/api/engagement/admin/card-templates`),
        fetch(`${getApiUrl()}/api/engagement/admin/streak-config`)
      ]);

      if (milestonesRes.ok) setMilestoneTypes(await milestonesRes.json());
      if (templatesRes.ok) setCardTemplates(await templatesRes.json());
      if (streakRes.ok) setStreakConfig(await streakRes.json());
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to load engagement settings');
    } finally {
      setLoading(false);
    }
  };

  const saveMilestoneTypes = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/engagement/admin/milestone-types`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestoneTypes)
      });
      if (response.ok) {
        toast.success('Milestone types saved!');
        setEditingMilestone(null);
      } else {
        toast.error('Failed to save milestone types');
      }
    } catch (error) {
      toast.error('Error saving milestone types');
    } finally {
      setSaving(false);
    }
  };

  const saveCardTemplates = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/engagement/admin/card-templates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardTemplates)
      });
      if (response.ok) {
        toast.success('Card templates saved!');
        setEditingTemplate(null);
      } else {
        toast.error('Failed to save card templates');
      }
    } catch (error) {
      toast.error('Error saving card templates');
    } finally {
      setSaving(false);
    }
  };

  const saveStreakConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/engagement/admin/streak-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streakConfig)
      });
      if (response.ok) {
        toast.success('Streak configuration saved!');
      } else {
        toast.error('Failed to save streak config');
      }
    } catch (error) {
      toast.error('Error saving streak config');
    } finally {
      setSaving(false);
    }
  };

  const addNewMilestone = () => {
    setNewMilestone({
      id: `custom_${Date.now()}`,
      name: 'New Milestone',
      icon: '🎯',
      description: 'Description here',
      category: 'general',
      points_reward: 50,
      auto_detect: false,
      is_active: true
    });
  };

  const saveNewMilestone = () => {
    if (newMilestone) {
      setMilestoneTypes([...milestoneTypes, newMilestone]);
      setNewMilestone(null);
    }
  };

  const deleteMilestone = (id) => {
    setMilestoneTypes(milestoneTypes.filter(m => m.id !== id));
  };

  const updateMilestone = (id, field, value) => {
    setMilestoneTypes(milestoneTypes.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const addStreakReward = () => {
    const newReward = {
      days: (streakConfig.streak_rewards.length + 1) * 7,
      points: 100,
      badge: 'New Badge',
      icon: '🎁'
    };
    setStreakConfig({
      ...streakConfig,
      streak_rewards: [...streakConfig.streak_rewards, newReward]
    });
  };

  const updateStreakReward = (index, field, value) => {
    const newRewards = [...streakConfig.streak_rewards];
    newRewards[index] = { ...newRewards[index], [field]: value };
    setStreakConfig({ ...streakConfig, streak_rewards: newRewards });
  };

  const deleteStreakReward = (index) => {
    setStreakConfig({
      ...streakConfig,
      streak_rewards: streakConfig.streak_rewards.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Engagement Settings</h2>
          <p className="text-gray-500">Configure milestones, streaks, and shareable cards</p>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span className="text-sm text-gray-500">Phase 1 Features</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Milestones
          </TabsTrigger>
          <TabsTrigger value="streaks" className="flex items-center gap-2">
            <Flame className="w-4 h-4" /> Streaks
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Cards
          </TabsTrigger>
        </TabsList>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Milestone Types</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={addNewMilestone}>
                  <Plus className="w-4 h-4 mr-1" /> Add Type
                </Button>
                <Button size="sm" onClick={saveMilestoneTypes} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save All
                </Button>
              </div>
            </div>

            {/* New Milestone Form */}
            {newMilestone && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-green-800">New Milestone Type</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setNewMilestone(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={saveNewMilestone} className="bg-green-600 hover:bg-green-700">
                      <Check className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm">ID</Label>
                    <Input 
                      value={newMilestone.id} 
                      onChange={(e) => setNewMilestone({ ...newMilestone, id: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Name</Label>
                    <Input 
                      value={newMilestone.name} 
                      onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Icon (emoji)</Label>
                    <Input 
                      value={newMilestone.icon} 
                      onChange={(e) => setNewMilestone({ ...newMilestone, icon: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Points Reward</Label>
                    <Input 
                      type="number"
                      value={newMilestone.points_reward} 
                      onChange={(e) => setNewMilestone({ ...newMilestone, points_reward: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Milestone List */}
            <div className="space-y-3">
              {milestoneTypes.map((milestone) => (
                <div 
                  key={milestone.id} 
                  className={`p-4 border rounded-lg transition-all ${
                    editingMilestone === milestone.id 
                      ? 'border-purple-400 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {editingMilestone === milestone.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm">Name</Label>
                          <Input 
                            value={milestone.name} 
                            onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Icon</Label>
                          <Input 
                            value={milestone.icon} 
                            onChange={(e) => updateMilestone(milestone.id, 'icon', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Points</Label>
                          <Input 
                            type="number"
                            value={milestone.points_reward} 
                            onChange={(e) => updateMilestone(milestone.id, 'points_reward', parseInt(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Category</Label>
                          <select
                            value={milestone.category}
                            onChange={(e) => updateMilestone(milestone.id, 'category', e.target.value)}
                            className="mt-1 w-full border rounded-md p-2"
                          >
                            <option value="general">General</option>
                            <option value="health">Health</option>
                            <option value="social">Social</option>
                            <option value="achievement">Achievement</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Description</Label>
                        <Input 
                          value={milestone.description} 
                          onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingMilestone(null)}>
                          Done
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{milestone.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{milestone.name}</p>
                          <p className="text-sm text-gray-500">{milestone.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          milestone.category === 'achievement' ? 'bg-amber-100 text-amber-700' :
                          milestone.category === 'health' ? 'bg-green-100 text-green-700' :
                          milestone.category === 'social' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {milestone.category}
                        </span>
                        <span className="text-sm font-medium text-purple-600">
                          +{milestone.points_reward} pts
                        </span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditingMilestone(milestone.id)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => deleteMilestone(milestone.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Streaks Tab */}
        <TabsContent value="streaks" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Streak Configuration</h3>
              <Button size="sm" onClick={saveStreakConfig} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save Config
              </Button>
            </div>

            {streakConfig && (
              <div className="space-y-6">
                {/* Basic Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Min Actions Per Day</Label>
                    <Input 
                      type="number"
                      value={streakConfig.min_actions_per_day}
                      onChange={(e) => setStreakConfig({ ...streakConfig, min_actions_per_day: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum actions to maintain streak</p>
                  </div>
                  <div>
                    <Label>Reset Hour (UTC)</Label>
                    <Input 
                      type="number"
                      min="0"
                      max="23"
                      value={streakConfig.reset_hour}
                      onChange={(e) => setStreakConfig({ ...streakConfig, reset_hour: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">When streak resets if not maintained</p>
                  </div>
                </div>

                {/* Qualifying Actions */}
                <div>
                  <Label>Qualifying Actions</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {streakConfig.qualifying_actions?.map((action, i) => (
                      <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Streak Rewards */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Streak Rewards</Label>
                    <Button size="sm" variant="outline" onClick={addStreakReward}>
                      <Plus className="w-4 h-4 mr-1" /> Add Reward
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {streakConfig.streak_rewards?.map((reward, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <Input 
                          value={reward.icon}
                          onChange={(e) => updateStreakReward(index, 'icon', e.target.value)}
                          className="w-16 text-center text-xl"
                          placeholder="🎁"
                        />
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Days</Label>
                            <Input 
                              type="number"
                              value={reward.days}
                              onChange={(e) => updateStreakReward(index, 'days', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Badge Name</Label>
                            <Input 
                              value={reward.badge}
                              onChange={(e) => updateStreakReward(index, 'badge', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Points</Label>
                            <Input 
                              type="number"
                              value={reward.points}
                              onChange={(e) => updateStreakReward(index, 'points', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => deleteStreakReward(index)}
                          className="text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Shareable Card Templates</h3>
              <Button size="sm" onClick={saveCardTemplates} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save Templates
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cardTemplates.map((template) => (
                <div 
                  key={template.id}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    editingTemplate === template.id ? 'border-purple-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setEditingTemplate(template.id === editingTemplate ? null : template.id)}
                >
                  {/* Preview */}
                  <div 
                    className={`aspect-square bg-gradient-to-br ${template.background_gradient} p-4 flex flex-col items-center justify-center ${template.text_color}`}
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full mb-2" />
                    <p className="font-bold text-sm">{template.name}</p>
                    <p className="text-xs opacity-70">{template.category}</p>
                  </div>

                  {/* Edit Overlay */}
                  {editingTemplate === template.id && (
                    <div className="absolute inset-0 bg-black/70 p-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <Input 
                          value={template.name}
                          onChange={(e) => {
                            setCardTemplates(cardTemplates.map(t => 
                              t.id === template.id ? { ...t, name: e.target.value } : t
                            ));
                          }}
                          className="bg-white/20 border-white/30 text-white placeholder-white/50"
                          placeholder="Template Name"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Input 
                          value={template.background_gradient}
                          onChange={(e) => {
                            setCardTemplates(cardTemplates.map(t => 
                              t.id === template.id ? { ...t, background_gradient: e.target.value } : t
                            ));
                          }}
                          className="bg-white/20 border-white/30 text-white placeholder-white/50 text-xs"
                          placeholder="Gradient classes"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-white text-xs">
                            <input 
                              type="checkbox"
                              checked={template.show_stats}
                              onChange={(e) => {
                                setCardTemplates(cardTemplates.map(t => 
                                  t.id === template.id ? { ...t, show_stats: e.target.checked } : t
                                ));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded"
                            />
                            Stats
                          </label>
                          <label className="flex items-center gap-1 text-white text-xs">
                            <input 
                              type="checkbox"
                              checked={template.show_qr}
                              onChange={(e) => {
                                setCardTemplates(cardTemplates.map(t => 
                                  t.id === template.id ? { ...t, show_qr: e.target.checked } : t
                                ));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded"
                            />
                            QR
                          </label>
                        </div>
                        <label className="flex items-center gap-1 text-white text-xs">
                          <input 
                            type="checkbox"
                            checked={template.is_active}
                            onChange={(e) => {
                              setCardTemplates(cardTemplates.map(t => 
                                t.id === template.id ? { ...t, is_active: e.target.checked } : t
                              ));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded"
                          />
                          Active
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Active Badge */}
                  {template.is_active && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 mt-4">
              Click on a template to edit. Use Tailwind gradient classes like &quot;from-purple-600 to-pink-500&quot;.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEngagement;
