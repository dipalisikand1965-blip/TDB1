/**
 * RainbowBridgeWall.jsx
 * 
 * Public Memorial Wall - A beautiful gallery where pet parents can:
 * - See all pets who have crossed the Rainbow Bridge
 * - Pay tributes and leave condolences
 * - Share in the community's love and support
 * 
 * Built in loving memory of Mystique 💜
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import {
  Rainbow, Heart, Star, Calendar, MessageCircle, 
  Sparkles, PawPrint, Send, Users, Flame, CloudSun,
  Quote, ChevronRight, Loader2
} from 'lucide-react';

const RainbowBridgeWall = () => {
  const { user, token } = useAuth();
  const [memorials, setMemorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemorial, setSelectedMemorial] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTributeModal, setShowTributeModal] = useState(false);
  const [tributeText, setTributeText] = useState('');
  const [submittingTribute, setSubmittingTribute] = useState(false);

  // Fetch all public memorials
  useEffect(() => {
    fetchMemorials();
  }, []);

  const fetchMemorials = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rainbow-bridge/wall`);
      if (response.ok) {
        const data = await response.json();
        setMemorials(data.memorials || []);
      }
    } catch (error) {
      console.error('Error fetching memorials:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit a tribute
  const submitTribute = async () => {
    if (!tributeText.trim() || !selectedMemorial) return;
    
    setSubmittingTribute(true);
    try {
      const response = await fetch(`${API_URL}/api/rainbow-bridge/${selectedMemorial.pet_id}/tribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: tributeText,
          from_name: user?.name || user?.email?.split('@')[0] || 'Anonymous',
          from_email: user?.email || 'anonymous'
        })
      });
      
      if (response.ok) {
        toast({
          title: '💜 Tribute Sent',
          description: `Your tribute for ${selectedMemorial.pet_name} has been shared`,
          duration: 4000
        });
        setTributeText('');
        setShowTributeModal(false);
        fetchMemorials(); // Refresh to show new tribute count
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not send tribute',
        variant: 'destructive'
      });
    } finally {
      setSubmittingTribute(false);
    }
  };

  // Calculate time since crossing
  const getTimeSince = (date) => {
    if (!date) return '';
    const crossing = new Date(date);
    const now = new Date();
    const diff = now - crossing;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Memorial Wall Header */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
          <Rainbow className="w-7 h-7 text-purple-400" />
          Memorial Wall
          <Rainbow className="w-7 h-7 text-pink-400" />
        </h2>
        <p className="text-white/60 max-w-2xl mx-auto">
          A community space to honor and remember our beloved companions who wait for us at the Rainbow Bridge. 
          Leave a tribute to show you care.
        </p>
        
        {memorials.length > 0 && (
          <div className="flex items-center justify-center gap-4 text-white/50 text-sm">
            <span className="flex items-center gap-1">
              <PawPrint className="w-4 h-4" />
              {memorials.length} souls remembered
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-pink-400" />
              {memorials.reduce((sum, m) => sum + (m.tribute_count || 0), 0)} tributes shared
            </span>
          </div>
        )}
      </div>

      {/* Memorial Grid */}
      {memorials.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {memorials.map((memorial) => (
            <Card 
              key={memorial.id || memorial.pet_id}
              className="bg-gradient-to-br from-slate-800/90 to-purple-900/40 border-purple-500/20 overflow-hidden group hover:border-purple-400/40 transition-all duration-300"
              data-testid={`wall-memorial-${memorial.pet_id}`}
            >
              {/* Pet Photo */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={memorial.photo || ''}
                  alt={memorial.pet_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/95 via-purple-900/50 to-transparent" />
                
                {/* Rainbow Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-gradient-to-r from-violet-500/90 to-pink-500/90 text-white border-0 backdrop-blur-sm">
                    <Rainbow className="w-3 h-3 mr-1" />
                    Forever Loved
                  </Badge>
                </div>
                
                {/* Tribute Count */}
                {memorial.tribute_count > 0 && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-pink-500/80 text-white border-0">
                      <Heart className="w-3 h-3 mr-1" />
                      {memorial.tribute_count}
                    </Badge>
                  </div>
                )}
                
                {/* Pet Name & Owner */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-bold text-white">{memorial.pet_name}</h3>
                  <p className="text-white/70 text-sm">
                    {memorial.breed || 'Beloved Companion'}
                  </p>
                  <p className="text-purple-300/80 text-xs mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Loved by {memorial.owner_name || 'A devoted pet parent'}
                  </p>
                </div>
              </div>
              
              {/* Memorial Content */}
              <div className="p-4 space-y-3">
                {/* Crossing Date */}
                <div className="flex items-center gap-2 text-purple-300/70 text-sm">
                  <CloudSun className="w-4 h-4" />
                  <span>Crossed {getTimeSince(memorial.crossing_date)}</span>
                </div>
                
                {/* Tribute Message Preview */}
                {memorial.tribute_message && (
                  <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/20">
                    <p className="text-white/80 text-sm italic line-clamp-2">
                      "{memorial.tribute_message}"
                    </p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex-1 text-purple-300 hover:text-white hover:bg-purple-500/20"
                    onClick={() => {
                      setSelectedMemorial(memorial);
                      setShowDetailModal(true);
                    }}
                  >
                    View Legacy
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-500 hover:to-purple-500 text-white"
                    onClick={() => {
                      setSelectedMemorial(memorial);
                      setShowTributeModal(true);
                    }}
                    data-testid={`tribute-btn-${memorial.pet_id}`}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Tribute
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-800/30 border-slate-700/50 p-12 text-center">
          <Rainbow className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white/70 mb-2">Memorial Wall</h3>
          <p className="text-slate-400">
            When pet parents choose to share their memorials publicly, they will appear here.
          </p>
        </Card>
      )}

      {/* Memorial Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border-purple-500/30 max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMemorial && (
            <div className="space-y-6">
              {/* Header with Photo */}
              <div className="relative -mx-6 -mt-6 h-56 overflow-hidden rounded-t-lg">
                <img 
                  src={selectedMemorial.photo || ''}
                  alt={selectedMemorial.pet_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950 via-purple-900/60 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0 mb-2">
                    <Rainbow className="w-3 h-3 mr-1" />
                    Forever in Our Hearts
                  </Badge>
                  <h2 className="text-3xl font-bold text-white">{selectedMemorial.pet_name}</h2>
                  <p className="text-white/70">{selectedMemorial.breed || 'Beloved Companion'}</p>
                </div>
              </div>
              
              {/* Owner Info */}
              <div className="flex items-center gap-3 bg-purple-900/20 rounded-lg p-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {(selectedMemorial.owner_name || 'P')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{selectedMemorial.owner_name || 'Pet Parent'}</p>
                  <p className="text-purple-300/60 text-sm">{selectedMemorial.pet_name}'s devoted human</p>
                </div>
              </div>
              
              {/* Crossing Date */}
              <div className="flex items-center gap-3 text-purple-300">
                <CloudSun className="w-5 h-5" />
                <span>
                  Crossed the Rainbow Bridge on{' '}
                  {selectedMemorial.crossing_date 
                    ? new Date(selectedMemorial.crossing_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'a day we hold dear'
                  }
                </span>
              </div>
              
              {/* Tribute Message */}
              {selectedMemorial.tribute_message && (
                <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-5 border border-purple-500/20">
                  <Quote className="w-6 h-6 text-purple-400 mb-3" />
                  <p className="text-white text-lg italic leading-relaxed">
                    "{selectedMemorial.tribute_message}"
                  </p>
                </div>
              )}
              
              {/* Favorite Memory */}
              {selectedMemorial.favorite_memory && (
                <div>
                  <h4 className="text-purple-300 font-medium flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4" />
                    A Cherished Memory
                  </h4>
                  <p className="text-white/80 bg-slate-800/50 rounded-lg p-4">
                    {selectedMemorial.favorite_memory}
                  </p>
                </div>
              )}
              
              {/* Soul Score if available */}
              {selectedMemorial.soul_score > 0 && (
                <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-purple-300 font-medium">Soul Profile Preserved</span>
                    <span className="text-white font-bold">{selectedMemorial.soul_score}%</span>
                  </div>
                  <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-400 to-pink-400 rounded-full"
                      style={{ width: `${selectedMemorial.soul_score}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Tributes Section */}
              {selectedMemorial.tributes && selectedMemorial.tributes.length > 0 && (
                <div>
                  <h4 className="text-purple-300 font-medium flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-pink-400" />
                    Community Tributes ({selectedMemorial.tributes.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedMemorial.tributes.slice(0, 5).map((tribute, idx) => (
                      <div key={idx} className="bg-slate-800/50 rounded-lg p-3 text-sm">
                        <p className="text-white/80 italic">"{tribute.message}"</p>
                        <p className="text-purple-300/60 text-xs mt-1">— {tribute.from_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Pay Tribute Button */}
              <Button 
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                onClick={() => {
                  setShowDetailModal(false);
                  setShowTributeModal(true);
                }}
              >
                <Heart className="w-4 h-4 mr-2" />
                Leave a Tribute for {selectedMemorial.pet_name}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tribute Modal */}
      <Dialog open={showTributeModal} onOpenChange={setShowTributeModal}>
        <DialogContent className="bg-slate-900 border-purple-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Send a Tribute
            </DialogTitle>
          </DialogHeader>
          
          {selectedMemorial && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 bg-purple-900/20 rounded-lg p-3">
                <img 
                  src={selectedMemorial.photo || ''}
                  alt={selectedMemorial.pet_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-white font-medium">{selectedMemorial.pet_name}</p>
                  <p className="text-purple-300/60 text-sm">In loving memory</p>
                </div>
              </div>
              
              <Textarea
                placeholder={`Share a few words for ${selectedMemorial.pet_name}...`}
                value={tributeText}
                onChange={(e) => setTributeText(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                data-testid="tribute-text-input"
              />
              
              {user ? (
                <p className="text-purple-300/60 text-sm">
                  Sending as {user.name || user.email}
                </p>
              ) : (
                <p className="text-purple-300/60 text-sm">
                  Sign in to attach your name to this tribute
                </p>
              )}
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTributeModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitTribute}
                  disabled={!tributeText.trim() || submittingTribute}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500"
                  data-testid="submit-tribute-btn"
                >
                  {submittingTribute ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Tribute
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RainbowBridgeWall;
