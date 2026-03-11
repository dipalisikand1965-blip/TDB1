/**
 * LearnPage.jsx - Golden Standard Redesign
 * 
 * The Learn Pillar: Simple, useful education for pet parents.
 * Formula: Read → Watch → Shop / Book / Ask
 * 
 * Key Sections (streamlined):
 * 1. Hero with Ask Learn AI
 * 2. 8 Core Action Cards (3 Bento Buckets)
 * 3. Life Stage Cards (with real images)
 * 4. Guided Learning Paths
 * 5. Products That Help (separate)
 * 6. Services That Help (separate, watercolor style)
 * 7. Near Me
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import NearbyLearnServices from '../components/learn/NearbyLearnServices';
import MiraAdvisorCard from '../components/MiraAdvisorCard';
import { ChecklistDownloadButton } from '../components/checklists';
import { getPetPhotoUrl } from '../utils/petAvatar';
import {
  BookOpen, Brain, GraduationCap, Heart, Star, Sparkles,
  Loader2, Send, ArrowRight, ChevronRight, MapPin, Target,
  ShoppingBag, Users, Play, PawPrint, Scissors, Plane, Baby, Dog
} from 'lucide-react';

// Life Stage Images (curated, real photos)
const LIFE_STAGE_IMAGES = {
  puppy: "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=800&q=80",
  adult: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
  senior: "https://images.unsplash.com/photo-1558929996-da64ba858215?w=800&q=80",
  adoption: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80"
};

// Guided Path configurations
const GUIDED_PATHS = [
  { 
    id: 'new-puppy',
    title: 'New Puppy', 
    icon: '🐶', 
    color: 'pink',
    steps: ['First week home', 'Toilet training', 'Teething basics', 'Sleep routine', 'Socialization']
  },
  { 
    id: 'adoption',
    title: 'New Adoption', 
    icon: '🏠', 
    color: 'green',
    steps: ['Decompression', 'Trust building', 'First routine', 'Boundaries', 'Settling in']
  },
  { 
    id: 'senior',
    title: 'Senior Care', 
    icon: '🦮', 
    color: 'amber',
    steps: ['Mobility support', 'Comfort needs', 'Diet changes', 'Rest patterns', 'Health monitoring']
  },
  { 
    id: 'behavior',
    title: 'Behavior', 
    icon: '🧠', 
    color: 'purple',
    steps: ['Understanding triggers', 'Positive training', 'Consistency', 'Patience', 'Expert help']
  }
];

const LearnPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { currentPet, pets: contextPets } = usePillarContext();
  
  // State
  const [askQuestion, setAskQuestion] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState('');
  const [requestForm, setRequestForm] = useState({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    guest_pet_name: '',
    guest_pet_breed: '',
    notes: ''
  });
  
  const activePet = currentPet || selectedPet;
  const petName = activePet?.name || 'Your Pet';

  // Fetch user pets
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setUserPets(data.pets || []);
          if (data.pets?.length > 0 && !selectedPet) {
            setSelectedPet(data.pets[0]);
          }
        })
        .catch(console.error);
    }
  }, [token]);

  // Handle Ask Learn submission
  const handleAskLearn = () => {
    if (!askQuestion.trim()) return;
    
    // Open Mira with the query
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: askQuestion,
        context: 'learn',
        pillar: 'learn',
        pet_name: activePet?.name,
        pet_breed: activePet?.breed
      }
    }));
    setAskQuestion('');
  };

  // Handle concierge request
  const handleRequestSubmit = async () => {
    const payload = {
      type: 'learn_concierge',
      pillar: 'learn',
      request_type: requestType,
      customer: user ? {
        name: user.name,
        email: user.email,
        phone: user.phone
      } : {
        name: requestForm.guest_name,
        email: requestForm.guest_email,
        phone: requestForm.guest_phone
      },
      pet: activePet || {
        name: requestForm.guest_pet_name,
        breed: requestForm.guest_pet_breed
      },
      notes: requestForm.notes
    };

    try {
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({ title: 'Request Submitted!', description: 'Our team will contact you within 2 hours.' });
        setShowRequestModal(false);
        setRequestForm({ guest_name: '', guest_phone: '', guest_email: '', guest_pet_name: '', guest_pet_breed: '', notes: '' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Please try again.', variant: 'destructive' });
    }
  };

  // Open request modal with type
  const openRequest = (type) => {
    setRequestType(type);
    setShowRequestModal(true);
  };

  return (
    <PillarPageLayout
      pillar="learn"
      title="Learn - Training & Education | The Doggy Company"
      description="Simple, useful education for pet parents. Training and guidance that respects personality."
    >
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO: Ask Learn AI */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-teal-50 via-white to-amber-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge className="bg-teal-600 text-white mb-4 px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Mira Learn AI
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Master Pet Parenthood
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Trusted guidance for every stage of {petName}'s life. Read → Watch → Apply.
          </p>
          
          {/* Ask Input */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <Input
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskLearn()}
              placeholder={`Ask anything about ${petName}...`}
              className="w-full py-7 pl-5 pr-14 text-lg rounded-2xl border-2 border-teal-200 focus:border-teal-500 shadow-lg bg-white"
              data-testid="ask-learn-input"
            />
            <Button
              onClick={handleAskLearn}
              disabled={askLoading || !askQuestion.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-700 rounded-xl h-12 w-12"
              data-testid="ask-learn-submit"
            >
              {askLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          
          {/* Quick Chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['Puppy biting', 'Potty training', 'Leash pulling', 'Senior diet', 'Anxiety'].map((q) => (
              <button
                key={q}
                onClick={() => { setAskQuestion(q); handleAskLearn(); }}
                className="px-4 py-2 bg-white border border-teal-200 rounded-full text-sm font-medium text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition-all shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
          
          <ChecklistDownloadButton 
            pillar="learn" 
            variant="outline"
            className="border-teal-300 text-teal-700 hover:bg-teal-50"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 8 CORE ACTION CARDS - Bento Grid (3 Buckets) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">How can we help?</h2>
            <p className="text-gray-600 mt-2">Choose what matters most right now</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bucket 1: Products & Routines */}
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 rounded-3xl hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Products & Routines</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Help me choose the right products', icon: '🛒' },
                  { label: 'Build a routine for my dog', icon: '📅' },
                  { label: 'Help me with grooming choices', icon: '✨' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => openRequest(item.label)}
                    className="w-full flex items-center gap-3 p-4 bg-white/80 hover:bg-white rounded-2xl transition-all text-left group/item"
                    data-testid={`action-products-${idx}`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-gray-900 flex-1">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </Card>
            
            {/* Bucket 2: Life Stage & Care */}
            <Card className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200 rounded-3xl hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Life Stage & Care</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Guide me for my puppy', icon: '🐶' },
                  { label: 'Help me with senior dog care', icon: '🦮' },
                  { label: 'Recommend what suits my breed', icon: '🎯' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => openRequest(item.label)}
                    className="w-full flex items-center gap-3 p-4 bg-white/80 hover:bg-white rounded-2xl transition-all text-left group/item"
                    data-testid={`action-lifestage-${idx}`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-gray-900 flex-1">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </Card>
            
            {/* Bucket 3: Support & Services */}
            <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 rounded-3xl hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Support & Services</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Find the right trainer', icon: '🎓' },
                  { label: 'Help me prepare for travel', icon: '✈️' },
                  { label: 'Find help near me', icon: '📍' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => item.label.includes('near me') ? document.getElementById('near-me')?.scrollIntoView({ behavior: 'smooth' }) : openRequest(item.label)}
                    className="w-full flex items-center gap-3 p-4 bg-white/80 hover:bg-white rounded-2xl transition-all text-left group/item"
                    data-testid={`action-support-${idx}`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover/item:text-gray-900 flex-1">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LIFE STAGE CARDS - Visual Heavy */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Learn by Life Stage</h2>
            <p className="text-gray-600 mt-2">Every stage needs different care</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { stage: 'Puppy', desc: '0-1 year', image: LIFE_STAGE_IMAGES.puppy, color: 'pink' },
              { stage: 'Adult', desc: '1-7 years', image: LIFE_STAGE_IMAGES.adult, color: 'blue' },
              { stage: 'Senior', desc: '7+ years', image: LIFE_STAGE_IMAGES.senior, color: 'amber' },
              { stage: 'New Adoption', desc: 'Just joined', image: LIFE_STAGE_IMAGES.adoption, color: 'green' }
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => openRequest(`${item.stage} care guidance`)}
                className="relative aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer group"
                data-testid={`life-stage-${item.stage.toLowerCase().replace(' ', '-')}`}
              >
                <img 
                  src={item.image} 
                  alt={item.stage}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-lg md:text-xl font-bold">{item.stage}</h3>
                  <p className="text-sm text-white/80">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* GUIDED LEARNING PATHS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <Badge className="bg-violet-600 text-white mb-3">
              <Target className="w-3 h-3 mr-1" />
              Step-by-Step
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Guided Learning Paths</h2>
            <p className="text-gray-600 mt-2">Structured journeys for specific situations</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {GUIDED_PATHS.map((path) => (
              <Card
                key={path.id}
                onClick={() => openRequest(`${path.title} guided path`)}
                className={`p-5 cursor-pointer rounded-3xl border-2 hover:shadow-lg transition-all bg-gradient-to-br from-${path.color}-50 to-${path.color}-100 border-${path.color}-200 hover:border-${path.color}-300`}
                data-testid={`path-${path.id}`}
              >
                <span className="text-3xl mb-3 block">{path.icon}</span>
                <h3 className="font-bold text-gray-900 mb-2">{path.title}</h3>
                <div className="space-y-1">
                  {path.steps.slice(0, 3).map((step, idx) => (
                    <p key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-gray-400" />
                      {step}
                    </p>
                  ))}
                  <p className="text-xs text-gray-500 font-medium">+{path.steps.length - 3} more...</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MIRA ADVISOR */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <MiraAdvisorCard pillar="learn" activePet={activePet} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* NEAR ME - Local Services */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section id="near-me">
        <NearbyLearnServices />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* REQUEST MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-600" />
              {requestType || 'Request Help'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Pet Selection */}
            {userPets.length > 0 ? (
              <div>
                <Label className="text-sm font-medium mb-2 block">Select Your Pet</Label>
                <div className="flex gap-2 flex-wrap">
                  {userPets.map(pet => (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPet(pet)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                        selectedPet?.id === pet.id 
                          ? 'border-teal-500 bg-teal-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img 
                        src={getPetPhotoUrl(pet)} 
                        alt={pet.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium">{pet.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Pet Name</Label>
                  <Input
                    placeholder="e.g., Mojo"
                    value={requestForm.guest_pet_name}
                    onChange={(e) => setRequestForm({...requestForm, guest_pet_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs">Breed</Label>
                  <Input
                    placeholder="e.g., Labrador"
                    value={requestForm.guest_pet_breed}
                    onChange={(e) => setRequestForm({...requestForm, guest_pet_breed: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {/* Guest Contact */}
            {!user && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="col-span-2">
                  <Label className="text-xs">Your Name</Label>
                  <Input
                    placeholder="Full name"
                    value={requestForm.guest_name}
                    onChange={(e) => setRequestForm({...requestForm, guest_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    placeholder="+91..."
                    value={requestForm.guest_phone}
                    onChange={(e) => setRequestForm({...requestForm, guest_phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    placeholder="email@example.com"
                    value={requestForm.guest_email}
                    onChange={(e) => setRequestForm({...requestForm, guest_email: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {/* Notes */}
            <div>
              <Label className="text-xs">Additional Notes (optional)</Label>
              <Textarea
                placeholder="Tell us more about what you need..."
                value={requestForm.notes}
                onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleRequestSubmit}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              Submit Request
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Our team will contact you within 2 hours
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </PillarPageLayout>
  );
};

export default LearnPage;
