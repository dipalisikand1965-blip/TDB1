/**
 * PetMilestoneTimeline - Beautiful timeline of pet milestones
 * Mobile-first design with animations
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Sparkles, Trophy, Heart, Loader2, ChevronRight, X, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const MILESTONE_ICONS = {
  first_profile: '🎉',
  first_order: '🛒',
  birthday: '🎂',
  gotcha_day: '💝',
  first_grooming: '✂️',
  first_vet_visit: '🩺',
  vaccination: '💉',
  first_playdate: '🐕',
  first_travel: '✈️',
  soul_50: '🧭',
  soul_100: '⭐',
  '1_year_member': '🏆',
  custom: '📌',
};

const PetMilestoneTimeline = ({ petId, petName, onMilestoneAdd }) => {
  const { token } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [milestoneTypes, setMilestoneTypes] = useState([]);
  const [newMilestone, setNewMilestone] = useState({
    milestone_type: 'custom',
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchMilestones();
    fetchMilestoneTypes();
  }, [petId]);

  const fetchMilestones = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/engagement/milestones/${petId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setMilestones(data);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestoneTypes = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/engagement/admin/milestone-types`);
      if (response.ok) {
        const data = await response.json();
        setMilestoneTypes(data);
      }
    } catch (error) {
      console.error('Error fetching milestone types:', error);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim()) {
      toast.error('Please enter a title for the milestone');
      return;
    }

    try {
      const response = await fetch(`${getApiUrl()}/api/engagement/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          pet_id: petId,
          ...newMilestone
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Milestone added! +${data.points_awarded} Paw Points 🎉`);
        setShowAddForm(false);
        setNewMilestone({
          milestone_type: 'custom',
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
        fetchMilestones();
        onMilestoneAdd?.();
      } else {
        toast.error('Failed to add milestone');
      }
    } catch (error) {
      console.error('Error adding milestone:', error);
      toast.error('Failed to add milestone');
    }
  };

  const autoDetectMilestones = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/engagement/milestones/auto-detect/${petId}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        if (data.milestones_created > 0) {
          toast.success(`Found ${data.milestones_created} new milestones! 🎉`);
          fetchMilestones();
        } else {
          toast.info('No new milestones found');
        }
      }
    } catch (error) {
      console.error('Error auto-detecting milestones:', error);
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-gray-900">Milestone Timeline</h3>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
            {milestones.length} moments
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={autoDetectMilestones}
            className="text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" /> Auto-detect
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Add Milestone Form */}
      {showAddForm && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-purple-900">Add a Milestone</h4>
            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-purple-800">Type</Label>
              <select
                value={newMilestone.milestone_type}
                onChange={(e) => setNewMilestone({ ...newMilestone, milestone_type: e.target.value })}
                className="w-full mt-1 p-2 border rounded-lg text-sm"
              >
                {milestoneTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.icon || MILESTONE_ICONS[type.id] || '📌'} {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label className="text-sm text-purple-800">Title</Label>
              <Input
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder={`${petName}'s first...`}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm text-purple-800">Date</Label>
              <Input
                type="date"
                value={newMilestone.date}
                onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <Button
              onClick={handleAddMilestone}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Add Milestone
            </Button>
          </div>
        </Card>
      )}

      {/* Timeline */}
      {milestones.length === 0 ? (
        <Card className="p-6 text-center bg-gray-50">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">No milestones yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Start capturing {petName}'s special moments!
          </p>
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add First Milestone
          </Button>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-pink-400 to-amber-400" />
          
          {/* Milestone items */}
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id || index} className="relative flex gap-4 ml-2">
                {/* Icon */}
                <div className="relative z-10 flex-shrink-0 w-8 h-8 bg-white rounded-full border-2 border-purple-400 flex items-center justify-center text-lg shadow-sm">
                  {MILESTONE_ICONS[milestone.milestone_type] || '📌'}
                </div>
                
                {/* Content */}
                <Card className="flex-1 p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{milestone.title}</h4>
                      {milestone.description && (
                        <p className="text-xs text-gray-500 mt-1">{milestone.description}</p>
                      )}
                    </div>
                    {milestone.points_awarded > 0 && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">
                        +{milestone.points_awarded} pts
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(milestone.date)}
                  </p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetMilestoneTimeline;
