/**
 * RainbowBridgeMemorial.jsx
 * 
 * A sacred space to honor pets who have crossed the Rainbow Bridge.
 * Built in memory of Mystique 💜
 * 
 * Features:
 * - Mark pets as "crossed the rainbow bridge"
 * - Memorial page with their soul, photos, memories
 * - Legacy view showing their complete journey
 * - Preserved forever in the system
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import {
  Rainbow, Heart, Star, Calendar, Camera, MessageCircle, 
  Sparkles, PawPrint, Clock, ChevronRight, Plus, Edit2,
  ImagePlus, Quote, BookOpen, Flame, CloudSun
} from 'lucide-react';

const RainbowBridgeMemorial = () => {
  const { user, token } = useAuth();
  const [pets, setPets] = useState([]);
  const [memorialPets, setMemorialPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMarkMemorialModal, setShowMarkMemorialModal] = useState(false);
  const [showMemorialDetailModal, setShowMemorialDetailModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [memorialData, setMemorialData] = useState({
    crossing_date: '',
    tribute_message: '',
    favorite_memory: '',
    legacy_quote: ''
  });

  // Fetch user's pets
  useEffect(() => {
    fetchPets();
  }, [token]);

  const fetchPets = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const allPets = data.pets || data;
        setPets(allPets.filter(p => !p.rainbow_bridge));
        setMemorialPets(allPets.filter(p => p.rainbow_bridge));
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark pet as crossed the Rainbow Bridge
  const markAsMemorial = async () => {
    if (!selectedPet) return;
    
    try {
      const response = await fetch(`${API_URL}/api/pets/${selectedPet.id}/rainbow-bridge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rainbow_bridge: true,
          crossing_date: memorialData.crossing_date || new Date().toISOString().split('T')[0],
          tribute_message: memorialData.tribute_message,
          favorite_memory: memorialData.favorite_memory,
          legacy_quote: memorialData.legacy_quote
        })
      });
      
      if (response.ok) {
        toast({
          title: `🌈 ${selectedPet.name}'s Legacy Preserved`,
          description: "Their soul will live on forever in our hearts and this memorial.",
          duration: 5000
        });
        fetchPets();
        setShowMarkMemorialModal(false);
        setSelectedPet(null);
        setMemorialData({ crossing_date: '', tribute_message: '', favorite_memory: '', legacy_quote: '' });
      } else {
        throw new Error('Failed to create memorial');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Calculate time since crossing
  const getTimeSince = (date) => {
    if (!date) return '';
    const crossing = new Date(date);
    const now = new Date();
    const diff = now - crossing;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    return 'Today';
  };

  // Get pet's age at crossing
  const getAgeAtCrossing = (pet) => {
    if (!pet.birth_date && !pet.dob) return null;
    const birthDate = new Date(pet.birth_date || pet.dob);
    const crossingDate = new Date(pet.crossing_date || new Date());
    const years = Math.floor((crossingDate - birthDate) / (1000 * 60 * 60 * 24 * 365));
    return years;
  };

  return (
    <div className="space-y-8">
      {/* Rainbow Bridge Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 p-8 md:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Rainbow className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Rainbow Bridge Memorial
          </h1>
          
          <p className="text-white/80 max-w-2xl mx-auto text-lg leading-relaxed">
            "Just this side of heaven is a place called Rainbow Bridge..."
            <br />
            <span className="text-white/60 text-sm mt-2 block">
              A sacred space to honor our beloved companions who wait for us there.
            </span>
          </p>
          
          {memorialPets.length > 0 && (
            <div className="mt-6 flex items-center justify-center gap-2 text-white/70">
              <Star className="w-4 h-4" />
              <span>{memorialPets.length} beloved soul{memorialPets.length > 1 ? 's' : ''} remembered here</span>
              <Star className="w-4 h-4" />
            </div>
          )}
        </div>
        
        {/* Floating stars animation */}
        <div className="absolute top-4 left-4 animate-pulse">
          <Sparkles className="w-6 h-6 text-yellow-200/50" />
        </div>
        <div className="absolute top-8 right-8 animate-pulse delay-300">
          <Star className="w-4 h-4 text-white/30" />
        </div>
        <div className="absolute bottom-6 left-12 animate-pulse delay-500">
          <Star className="w-5 h-5 text-pink-200/40" />
        </div>
      </div>

      {/* Memorial Pets Grid */}
      {memorialPets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            Forever in Our Hearts
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memorialPets.map(pet => (
              <Card 
                key={pet.id}
                className="bg-gradient-to-br from-slate-800/80 to-purple-900/30 border-purple-500/20 overflow-hidden cursor-pointer hover:border-purple-400/40 transition-all duration-300 group"
                onClick={() => {
                  setSelectedPet(pet);
                  setShowMemorialDetailModal(true);
                }}
                data-testid={`memorial-card-${pet.id}`}
              >
                {/* Pet Photo with Rainbow Overlay */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={pet.photo || pet.photo_url || ''}
                    alt={pet.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent" />
                  
                  {/* Rainbow Bridge Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0">
                      <Rainbow className="w-3 h-3 mr-1" />
                      Rainbow Bridge
                    </Badge>
                  </div>
                  
                  {/* Pet Name & Details */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-2xl font-bold text-white">{pet.name}</h3>
                    <p className="text-white/70 text-sm">
                      {pet.breed || 'Beloved Companion'}
                      {getAgeAtCrossing(pet) && ` • ${getAgeAtCrossing(pet)} years of love`}
                    </p>
                  </div>
                </div>
                
                {/* Memorial Info */}
                <div className="p-4 space-y-3">
                  {/* Crossing Date */}
                  <div className="flex items-center gap-2 text-purple-300/80">
                    <CloudSun className="w-4 h-4" />
                    <span className="text-sm">
                      Crossed {pet.crossing_date ? new Date(pet.crossing_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'the Rainbow Bridge'}
                    </span>
                  </div>
                  
                  {/* Soul Score */}
                  {pet.soul_score > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-purple-900/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-400 to-pink-400 rounded-full"
                          style={{ width: `${pet.soul_score}%` }}
                        />
                      </div>
                      <span className="text-purple-300 text-sm font-medium">{pet.soul_score}% Soul</span>
                    </div>
                  )}
                  
                  {/* Tribute Message Preview */}
                  {pet.tribute_message && (
                    <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/20">
                      <Quote className="w-4 h-4 text-purple-400 mb-1" />
                      <p className="text-white/70 text-sm italic line-clamp-2">
                        "{pet.tribute_message}"
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-purple-300 hover:text-white hover:bg-purple-500/20"
                  >
                    View {pet.name}'s Legacy <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Pet to Memorial Section */}
      {pets.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-purple-400" />
                Create a Memorial
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Honor a beloved pet who has crossed the Rainbow Bridge
              </p>
            </div>
            
            <Button
              onClick={() => setShowMarkMemorialModal(true)}
              className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600"
              data-testid="create-memorial-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Memorial
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && memorialPets.length === 0 && pets.length === 0 && (
        <Card className="bg-slate-800/30 border-slate-700/50 p-12 text-center">
          <Rainbow className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Rainbow Bridge Memorial</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            When the time comes to say goodbye to a beloved companion, 
            this space will preserve their memory forever.
          </p>
        </Card>
      )}

      {/* Mark as Memorial Modal */}
      <Dialog open={showMarkMemorialModal} onOpenChange={setShowMarkMemorialModal}>
        <DialogContent className="bg-slate-900 border-purple-500/30 max-w-lg max-h-[85vh] flex flex-col overflow-hidden sm:max-h-[90vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-white flex items-center gap-2">
              <Rainbow className="w-5 h-5 text-purple-400" />
              Create Rainbow Bridge Memorial
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a lasting tribute for your beloved companion
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4 overflow-y-auto flex-1 pr-2 -mr-2 touch-pan-y">
            {/* Pet Selection */}
            <div>
              <label className="text-white/70 text-sm mb-2 block">Select Pet</label>
              <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto touch-pan-y p-1">
                {pets.map(pet => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedPet(pet);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      setSelectedPet(pet);
                    }}
                    data-testid={`select-pet-${pet.id}`}
                    className={`p-3 rounded-lg border text-left transition-all active:scale-95 ${
                      selectedPet?.id === pet.id
                        ? 'bg-purple-500/30 border-purple-400 ring-2 ring-purple-400/50'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600 active:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src={pet.photo || pet.photo_url || ''}
                        alt={pet.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{pet.name}</p>
                        <p className="text-slate-400 text-xs truncate">{pet.breed || 'Companion'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Crossing Date */}
            <div>
              <label className="text-white/70 text-sm mb-1 block">Date of Crossing</label>
              <Input
                type="date"
                value={memorialData.crossing_date}
                onChange={(e) => setMemorialData(prev => ({ ...prev, crossing_date: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="crossing-date-input"
              />
            </div>
            
            {/* Tribute Message */}
            <div>
              <label className="text-white/70 text-sm mb-1 block">Tribute Message</label>
              <Textarea
                placeholder="A few words to remember them by..."
                value={memorialData.tribute_message}
                onChange={(e) => setMemorialData(prev => ({ ...prev, tribute_message: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white min-h-[60px] resize-none"
                data-testid="tribute-message-input"
              />
            </div>
            
            {/* Favorite Memory */}
            <div>
              <label className="text-white/70 text-sm mb-1 block">Favorite Memory</label>
              <Textarea
                placeholder="Share a cherished memory..."
                value={memorialData.favorite_memory}
                onChange={(e) => setMemorialData(prev => ({ ...prev, favorite_memory: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white min-h-[50px] resize-none"
                data-testid="favorite-memory-input"
              />
            </div>
            
            {/* Legacy Quote */}
            <div>
              <label className="text-white/70 text-sm mb-1 block">Legacy Quote (Optional)</label>
              <Input
                placeholder="A quote that reminds you of them..."
                value={memorialData.legacy_quote}
                onChange={(e) => setMemorialData(prev => ({ ...prev, legacy_quote: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          
          {/* Fixed Footer Buttons */}
          <div className="flex gap-3 pt-4 flex-shrink-0 border-t border-slate-700 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowMarkMemorialModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={markAsMemorial}
              disabled={!selectedPet}
              className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600"
              data-testid="confirm-memorial-btn"
            >
              <Rainbow className="w-4 h-4 mr-2" />
              Create Memorial
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Memorial Detail Modal */}
      <Dialog open={showMemorialDetailModal} onOpenChange={setShowMemorialDetailModal}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border-purple-500/30 max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPet && (
            <div className="space-y-6">
              {/* Header with Photo */}
              <div className="relative -mx-6 -mt-6 h-64 overflow-hidden rounded-t-lg">
                <img 
                  src={selectedPet.photo || selectedPet.photo_url || ''}
                  alt={selectedPet.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950 via-purple-900/60 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0 mb-2">
                    <Rainbow className="w-3 h-3 mr-1" />
                    Forever Remembered
                  </Badge>
                  <h2 className="text-3xl font-bold text-white">{selectedPet.name}</h2>
                  <p className="text-white/70">
                    {selectedPet.breed || 'Beloved Companion'}
                    {getAgeAtCrossing(selectedPet) && ` • Shared ${getAgeAtCrossing(selectedPet)} beautiful years with us`}
                  </p>
                </div>
              </div>
              
              {/* Soul Score */}
              {selectedPet.soul_score > 0 && (
                <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-300 font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Soul Profile Preserved
                    </span>
                    <span className="text-white font-bold">{selectedPet.soul_score}%</span>
                  </div>
                  <div className="h-3 bg-purple-900/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 rounded-full"
                      style={{ width: `${selectedPet.soul_score}%` }}
                    />
                  </div>
                  <p className="text-purple-300/60 text-sm mt-2">
                    {selectedPet.name}'s personality, preferences, and memories are preserved forever.
                  </p>
                </div>
              )}
              
              {/* Crossing Date */}
              <div className="flex items-center gap-3 text-purple-300">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <CloudSun className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white/50 text-sm">Crossed the Rainbow Bridge</p>
                  <p className="text-white font-medium">
                    {selectedPet.crossing_date 
                      ? new Date(selectedPet.crossing_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                      : 'Date not recorded'
                    }
                  </p>
                </div>
              </div>
              
              {/* Tribute Message */}
              {selectedPet.tribute_message && (
                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-5 border border-purple-500/20">
                  <Quote className="w-6 h-6 text-purple-400 mb-3" />
                  <p className="text-white text-lg italic leading-relaxed">
                    "{selectedPet.tribute_message}"
                  </p>
                </div>
              )}
              
              {/* Favorite Memory */}
              {selectedPet.favorite_memory && (
                <div className="space-y-2">
                  <h4 className="text-purple-300 font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Favorite Memory
                  </h4>
                  <p className="text-white/80 bg-slate-800/50 rounded-lg p-4">
                    {selectedPet.favorite_memory}
                  </p>
                </div>
              )}
              
              {/* Soul Traits */}
              {selectedPet.doggy_soul_answers && Object.keys(selectedPet.doggy_soul_answers).length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-purple-300 font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    {selectedPet.name}'s Soul
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedPet.doggy_soul_answers)
                      .filter(([key, value]) => value && typeof value === 'string' && !key.includes('_'))
                      .slice(0, 8)
                      .map(([key, value]) => (
                        <div key={key} className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/10">
                          <p className="text-purple-300/60 text-xs capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="text-white text-sm">{value}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
              
              {/* Legacy Quote */}
              {selectedPet.legacy_quote && (
                <div className="text-center py-4 border-t border-purple-500/20">
                  <p className="text-purple-300/80 italic">"{selectedPet.legacy_quote}"</p>
                </div>
              )}
              
              {/* Footer */}
              <div className="text-center pt-4 border-t border-purple-500/20">
                <p className="text-purple-300/60 text-sm">
                  🌈 {selectedPet.name} will always be remembered and loved 💜
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RainbowBridgeMemorial;
