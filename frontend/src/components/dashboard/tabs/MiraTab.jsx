import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Sparkles, MessageCircle, Zap, Heart, PawPrint, Brain, Calendar, ShoppingBag, Stethoscope, MessageSquare, ChevronRight, Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { API_URL } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { toast } from '../../../hooks/use-toast';

// Memory type icons and colors
const MEMORY_TYPE_CONFIG = {
  event: { icon: Calendar, color: 'purple', label: 'Events & Milestones', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', textColor: 'text-purple-400' },
  health: { icon: Stethoscope, color: 'emerald', label: 'Health & Medical', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', textColor: 'text-emerald-400' },
  shopping: { icon: ShoppingBag, color: 'amber', label: 'Shopping Preferences', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', textColor: 'text-amber-400' },
  general: { icon: MessageSquare, color: 'pink', label: 'General Context', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20', textColor: 'text-pink-400' }
};

const MiraTab = ({ user, pets }) => {
  const primaryPet = pets[0];
  const { token } = useAuth();
  
  // Memory state
  const [memories, setMemories] = useState(null);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoriesError, setMemoriesError] = useState(null);
  const [expandedType, setExpandedType] = useState(null);
  
  // Fetch memories from backend
  const fetchMemories = useCallback(async () => {
    if (!token) return;
    
    setMemoriesLoading(true);
    setMemoriesError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/mira/memory/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMemories(data);
      } else {
        setMemoriesError('Unable to load memories');
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err);
      setMemoriesError('Unable to load memories');
    } finally {
      setMemoriesLoading(false);
    }
  }, [token]);
  
  // Delete a memory
  const deleteMemory = async (memoryId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/mira/memory/${memoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast({ title: 'Memory removed', description: 'Mira will no longer recall this.' });
        fetchMemories(); // Refresh
      }
    } catch (err) {
      console.error('Failed to delete memory:', err);
      toast({ title: 'Error', description: 'Could not remove memory', variant: 'destructive' });
    }
  };
  
  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);
  
  const miraCapabilities = [
    { icon: '🛒', title: 'Shopping Help', desc: 'Find products, compare prices, place orders' },
    { icon: '📅', title: 'Booking Services', desc: 'Schedule grooming, vet visits, boarding' },
    { icon: '💊', title: 'Health Reminders', desc: 'Track vaccinations, medications, appointments' },
    { icon: '🎂', title: 'Celebration Planning', desc: 'Plan birthdays, parties, special occasions' },
    { icon: '✈️', title: 'Travel Assistance', desc: 'Pet-friendly stays, travel arrangements' },
    { icon: '📋', title: 'Document Help', desc: 'KCI paperwork, pet passport, registrations' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300" data-testid="mira-tab">
      {/* Mira Introduction Card */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 text-white border-none shadow-xl relative overflow-hidden rounded-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Meet Mira</h2>
              <p className="text-white/80 text-sm sm:text-base">Your AI Pet Concierge®</p>
            </div>
          </div>
          
          <p className="text-white/90 mb-4 text-sm sm:text-base">
            Hi{user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I&apos;m Mira, your personal AI assistant for everything 
            {primaryPet?.name ? ` ${primaryPet.name}` : ' your pet'} needs. From booking services to finding the perfect treats, 
            I&apos;m here 24/7 to help.
          </p>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button 
              className="bg-white text-purple-600 hover:bg-white/90 font-semibold text-sm"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Mira
            </Button>
            <Button 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20 text-sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Quick Commands
            </Button>
          </div>
        </div>
      </Card>
      
      {/* What Mira Can Do */}
      <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-base sm:text-lg">
          <Heart className="w-5 h-5 text-pink-400" />
          What Mira Can Do For You
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {miraCapabilities.map((cap, idx) => (
            <div 
              key={idx}
              className="p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group"
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
            >
              <span className="text-2xl sm:text-3xl mb-2 sm:mb-3 block group-hover:scale-110 transition-transform">{cap.icon}</span>
              <h4 className="font-semibold text-white text-sm sm:text-base mb-1">{cap.title}</h4>
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">{cap.desc}</p>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Quick Actions */}
      <Card className="p-4 sm:p-6 bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-purple-900/40 border border-purple-500/20 rounded-2xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-base sm:text-lg">
          <Zap className="w-5 h-5 text-purple-400" />
          Try These Quick Commands
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            `Book grooming for ${primaryPet?.name || 'my pet'}`,
            'Find a pet-friendly hotel in Goa',
            'Order birthday cake',
            'Schedule vet appointment',
            'Show my recent orders',
            `What vaccines does ${primaryPet?.name || 'my pet'} need?`
          ].map((cmd, idx) => (
            <Badge 
              key={idx}
              variant="outline"
              className="px-3 py-1.5 sm:px-4 sm:py-2 cursor-pointer bg-slate-800/50 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors text-xs sm:text-sm"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message: cmd } }));
              }}
            >
              🎤 &quot;{cmd}&quot;
            </Badge>
          ))}
        </div>
      </Card>
      
      {/* Pet Context */}
      {primaryPet && (
        <Card className="p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-base sm:text-lg">
            <PawPrint className="w-5 h-5 text-purple-400" />
            Mira Knows About {primaryPet.name}
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <p className="text-[10px] sm:text-xs text-purple-400 font-medium uppercase tracking-wide">Name</p>
              <p className="font-semibold text-white text-sm sm:text-base truncate">{primaryPet.name}</p>
            </div>
            <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/20">
              <p className="text-[10px] sm:text-xs text-pink-400 font-medium uppercase tracking-wide">Breed</p>
              <p className="font-semibold text-white text-sm sm:text-base truncate">{primaryPet.breed || 'Not set'}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <p className="text-[10px] sm:text-xs text-amber-400 font-medium uppercase tracking-wide">Birthday</p>
              <p className="font-semibold text-white text-sm sm:text-base truncate">{primaryPet.birth_date || 'Not set'}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <p className="text-[10px] sm:text-xs text-emerald-400 font-medium uppercase tracking-wide">Soul Score</p>
              <p className="font-semibold text-white text-sm sm:text-base">{Math.min(100, Math.round(primaryPet.overall_score || 0))}%</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-4">
            💡 The more you complete {primaryPet.name}&apos;s Pet Soul™, the more personalized Mira&apos;s recommendations become!
          </p>
        </Card>
      )}
    </div>
  );
};

export default MiraTab;
