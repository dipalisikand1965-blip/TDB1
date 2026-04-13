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

import React, { useState, useEffect, useRef } from 'react';
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
  const [tributeName, setTributeName] = useState('');
  const [submittingTribute, setSubmittingTribute] = useState(false);
  const [showAddMemorial, setShowAddMemorial] = useState(false);
  const [addForm, setAddForm] = useState({ pet_name:'', breed:'', crossing_date:'', tribute_message:'', photo:'' });
  const [submittingMemorial, setSubmittingMemorial] = useState(false);
  const [memorialSubmitted, setMemorialSubmitted] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ title: 'File too large', description: 'Max 10MB', variant: 'destructive' }); return; }
    setPhotoUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPhotoPreview(base64);
      setAddForm(prev => ({ ...prev, photo: base64 }));
      setPhotoUploading(false);
    };
    reader.readAsDataURL(file);
  };

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
          from_name: tributeName.trim() || user?.name || user?.email?.split('@')[0] || 'Anonymous',
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
        setTributeName('');
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

  // Submit a new community memorial
  const handleAddMemorial = async () => {
    if (!addForm.pet_name.trim() || !addForm.tribute_message.trim()) return;
    setSubmittingMemorial(true);
    try {
      const res = await fetch(`${API_URL}/api/rainbow-bridge/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        setMemorialSubmitted(true);
        setAddForm({ pet_name:'', breed:'', crossing_date:'', tribute_message:'', photo:'' });
        setPhotoPreview(null);
        setShowAddMemorial(false);
        toast({ title: '💜 Submitted for Review', description: `${addForm.pet_name}'s memorial will appear after approval.`, duration: 5000 });
      }
    } catch (e) { console.error(e); }
    finally { setSubmittingMemorial(false); }
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
    <>
    <section className="bg-gradient-to-b from-slate-900 via-purple-950/95 to-slate-950 rounded-3xl p-6 sm:p-10 mt-8 shadow-2xl shadow-purple-950/40">
    <div className="space-y-8">
      {/* Memorial Wall Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Rainbow className="w-8 h-8 text-purple-400" />
          Memorial Wall
          <Rainbow className="w-8 h-8 text-pink-400" />
        </h2>
        <p className="text-white/70 text-base max-w-xl mx-auto leading-relaxed">
          A place to honour the dogs who shaped us.<br />
          Forever loved. Never forgotten.
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

        {/* Add Memorial CTA */}
        {token && !memorialSubmitted && (
          <div className="flex justify-center pt-2">
            <Button
              data-testid="wall-add-memorial-btn"
              onClick={() => setShowAddMemorial(true)}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold px-6 py-2 rounded-full shadow-lg shadow-purple-900/40 transition-all duration-200"
            >
              <PawPrint className="w-4 h-4 mr-2" />
              Add Your Pet's Memorial
            </Button>
          </div>
        )}
        {token && memorialSubmitted && (
          <p className="text-center text-purple-300/70 text-sm">💜 Submitted — we'll add it to the wall after review.</p>
        )}
      </div>

      {/* Memorial Grid — auto-fill like Celebration Wall */}
      {memorials.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
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

                {/* Owner Photo — artwork/memory shared by the family */}
                {memorial.owner_photo && (
                  <div className="mt-2 -mx-4 -mb-4">
                    <div className="relative overflow-hidden">
                      <img
                        src={memorial.owner_photo}
                        alt={memorial.owner_photo_caption || `${memorial.pet_name} — a memory`}
                        className="w-full object-cover max-h-64"
                        style={{ objectPosition: 'top' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {memorial.owner_photo_caption && (
                        <p className="absolute bottom-2 left-0 right-0 text-center text-white/80 text-xs italic px-3">
                          {memorial.owner_photo_caption}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex-1 text-purple-300 hover:text-white hover:bg-purple-500/20 text-xs"
                    onClick={() => {
                      setSelectedMemorial(memorial);
                      setShowDetailModal(true);
                    }}
                  >
                    View Legacy
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-pink-500/80 to-purple-500/80 hover:from-pink-500 hover:to-purple-500 text-white text-xs"
                    onClick={() => {
                      setSelectedMemorial(memorial);
                      setTributeName(user?.name || '');
                      setShowTributeModal(true);
                    }}
                    data-testid={`tribute-btn-${memorial.pet_id}`}
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    Tribute for {memorial.pet_name}
                  </Button>
                </div>
                
                {/* Tribute count */}
                {memorial.tribute_count > 0 && (
                  <p className="text-pink-400/70 text-xs text-center pt-1 flex items-center justify-center gap-1">
                    <Heart className="w-3 h-3 fill-pink-400/50" />
                    {memorial.tribute_count} {memorial.tribute_count === 1 ? 'tribute' : 'tributes'} shared
                  </p>
                )}
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

              {/* Owner's artwork / Gyan — shown full width when present */}
              {selectedMemorial.owner_photo && (
                <div className="relative -mx-6 overflow-hidden rounded-xl">
                  <img
                    src={selectedMemorial.owner_photo}
                    alt={selectedMemorial.owner_photo_caption || `${selectedMemorial.pet_name} — a memory`}
                    className="w-full object-cover"
                    style={{ maxHeight: '520px', objectPosition: 'top' }}
                  />
                  {selectedMemorial.owner_photo_caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-4">
                      <p className="text-white/90 text-sm italic text-center tracking-wide">
                        {selectedMemorial.owner_photo_caption}
                      </p>
                    </div>
                  )}
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
              Leave a Tribute{selectedMemorial ? ` for ${selectedMemorial.pet_name}` : ''}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMemorial && (
            <div className="space-y-4 pt-4">
              {/* Pet thumbnail */}
              <div className="flex items-center gap-3 bg-purple-900/20 rounded-lg p-3">
                <img 
                  src={selectedMemorial.photo || ''}
                  alt={selectedMemorial.pet_name}
                  className="w-12 h-12 rounded-full object-cover border border-purple-500/30"
                />
                <div>
                  <p className="text-white font-medium">{selectedMemorial.pet_name}</p>
                  <p className="text-purple-300/60 text-sm">In loving memory 🌈</p>
                </div>
              </div>
              
              {/* Your name */}
              <div>
                <label className="text-purple-300 text-sm mb-1 block">Your name</label>
                <input
                  type="text"
                  value={tributeName}
                  onChange={(e) => setTributeName(e.target.value)}
                  placeholder={user?.name || 'Your name'}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  data-testid="tribute-name-input"
                />
              </div>
              
              {/* Your message */}
              <div>
                <label className="text-purple-300 text-sm mb-1 block">Your message for {selectedMemorial.pet_name}</label>
                <Textarea
                  placeholder={`Share a few words for ${selectedMemorial.pet_name}...`}
                  value={tributeText}
                  onChange={(e) => setTributeText(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px] text-sm"
                  data-testid="tribute-text-input"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTributeModal(false)}
                  className="flex-1 border-slate-700 text-slate-300"
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
                  Submit Tribute
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </section>

    {/* Add Your Pet's Memorial — Dialog (desktop) */}
    <Dialog open={showAddMemorial} onOpenChange={setShowAddMemorial}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border-purple-500/30 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            🌷 Add a Memorial
          </DialogTitle>
        </DialogHeader>
        <p className="text-purple-300/70 text-sm -mt-2 mb-4 leading-relaxed">
          Share your pet's story with the community. We'll review it with care before it appears on the wall.
        </p>
        <div className="space-y-4">
          {[
            { key:'pet_name', label:"Pet's Name *", placeholder:'e.g. Mystique', type:'text' },
            { key:'breed', label:'Breed', placeholder:'e.g. Shih Tzu', type:'text' },
            { key:'crossing_date', label:'When did they cross the bridge?', placeholder:'e.g. March 2023 or 2024-01-15', type:'text' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-purple-300 text-sm mb-1 block font-medium">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={addForm[f.key]}
                onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-slate-500"
              />
            </div>
          ))}

          {/* Photo upload — same pattern as Celebration Wall */}
          <div>
            <label className="text-purple-300 text-sm mb-1 block font-medium">Photo (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handlePhotoFile(e.target.files?.[0])}
            />
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-purple-500/40" />
                <button
                  onClick={() => { setPhotoPreview(null); setAddForm(prev => ({ ...prev, photo: '' })); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-black/80"
                >✕</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="w-full h-24 border-2 border-dashed border-purple-500/40 rounded-lg text-purple-300/60 text-sm hover:border-purple-400/70 hover:text-purple-300 transition-colors flex flex-col items-center justify-center gap-1"
                data-testid="memorial-photo-upload-btn"
              >
                {photoUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
                  <span className="text-2xl">🐾</span>
                  <span>Upload a photo of {addForm.pet_name || 'your pet'}</span>
                  <span className="text-xs opacity-60">JPG, PNG — max 10MB</span>
                </>}
              </button>
            )}
          </div>
          <div>
            <label className="text-purple-300 text-sm mb-1 block font-medium">Your tribute message *</label>
            <Textarea
              placeholder="Tell us about your beloved companion — their spirit, their quirks, what made them irreplaceable…"
              rows={4}
              value={addForm.tribute_message}
              onChange={e => setAddForm(prev => ({ ...prev, tribute_message: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white text-sm placeholder:text-slate-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddMemorial(false)} className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button
              onClick={handleAddMemorial}
              disabled={submittingMemorial || !addForm.pet_name.trim() || !addForm.tribute_message.trim()}
              className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white"
              data-testid="wall-submit-memorial-btn"
            >
              {submittingMemorial ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
              Submit Memorial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default RainbowBridgeWall;
