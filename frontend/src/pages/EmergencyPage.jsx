import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import { ConciergeButton } from '../components/mira-os';
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import ArchetypeProducts from '../components/ArchetypeProducts';
import CuratedBundles from '../components/CuratedBundles';
import { ChecklistDownloadButton } from '../components/checklists';
// Emergency Components
import { 
  UrgentHelpButtons, 
  PetEmergencyFile, 
  NearbyEmergencyHelp,
  EmergencySituationGuides,
  EmergencyProductsGrid
} from '../components/emergency';
import {
  AlertTriangle, Search, Heart, Phone, MapPin, Clock, Ambulance,
  ChevronRight, Star, Loader2, ArrowRight, Shield, Wind, Skull, 
  CloudLightning, ShieldAlert, CheckCircle, PhoneCall, Siren, 
  Plane, Baby, Calendar, Navigation, Download
} from 'lucide-react';

// Emergency Type Configuration
const EMERGENCY_TYPES = {
  lost_pet: { name: 'Lost Pet Alert', icon: Search, color: 'from-red-600 to-rose-700', bgColor: 'bg-red-50', textColor: 'text-red-600' },
  medical_emergency: { name: 'Medical Emergency', icon: AlertTriangle, color: 'from-red-500 to-orange-600', bgColor: 'bg-red-50', textColor: 'text-red-600' },
  accident_injury: { name: 'Accident & Injury', icon: Ambulance, color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  poisoning: { name: 'Poisoning', icon: Skull, color: 'from-purple-600 to-violet-700', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  breathing_distress: { name: 'Breathing Difficulty', icon: Wind, color: 'from-blue-600 to-cyan-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  found_pet: { name: 'Found Pet Report', icon: Heart, color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  natural_disaster: { name: 'Natural Disaster', icon: CloudLightning, color: 'from-slate-600 to-gray-700', bgColor: 'bg-slate-50', textColor: 'text-slate-600' },
  aggressive_animal: { name: 'Aggressive Animal', icon: ShieldAlert, color: 'from-amber-600 to-yellow-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600' }
};

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical - Life Threatening', color: 'bg-red-600' },
  { value: 'urgent', label: 'Urgent - Needs Help Fast', color: 'bg-orange-500' },
  { value: 'high', label: 'High - Serious Concern', color: 'bg-amber-500' },
  { value: 'moderate', label: 'Moderate - Need Guidance', color: 'bg-yellow-500' }
];

// Special Emergency Paths Configuration
const SPECIAL_PATHS = [
  {
    id: 'lost_pet',
    icon: Search,
    title: 'Lost Pet',
    description: 'Step-by-step guide to find your missing pet',
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50',
    steps: ['Create alert poster', 'Notify neighbors', 'Check shelters', 'Social media blast']
  },
  {
    id: 'travel_emergency',
    icon: Plane,
    title: 'Travel Emergency',
    description: 'Help when away from home with your pet',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    steps: ['Find nearest vet', 'Language support', 'Insurance assistance', 'Emergency transport']
  },
  {
    id: 'puppy_emergency',
    icon: Baby,
    title: 'Puppy Emergency',
    description: 'Special care for young pets in distress',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    steps: ['Age-specific first aid', 'Dehydration check', 'Temperature monitoring', 'Vet guidance']
  },
  {
    id: 'senior_emergency',
    icon: Calendar,
    title: 'Senior Pet',
    description: 'Gentle care for elderly pets in crisis',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    steps: ['Mobility assistance', 'Pain management', 'Comfort measures', 'End-of-life support']
  }
];

const EmergencyPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { currentPet } = usePillarContext();
  
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState({});
  const [showSpecialPath, setShowSpecialPath] = useState(null);
  
  // AI Triage State
  const [triageQuery, setTriageQuery] = useState('');
  const [triageResponse, setTriageResponse] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);
  const [showTriageResponse, setShowTriageResponse] = useState(false);
  
  const activePet = currentPet || selectedPet;
  
  const [requestForm, setRequestForm] = useState({
    emergency_type: 'medical_emergency',
    severity: 'urgent',
    description: '',
    location: '',
    city: '',
    landmark: '',
    symptoms: '',
    last_seen_location: '',
    last_seen_time: '',
    distinctive_features: '',
    notes: '',
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    pet_description: ''
  });

  // Refs for scrolling
  const nearbyHelpRef = useRef(null);
  const petFileRef = useRef(null);
  const guidesRef = useRef(null);
  const productsRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/emergency/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Emergency help for {petName}",
    subtitle: '24/7 emergency vets, first aid & urgent care resources',
    askMira: {
      enabled: true,
      placeholder: "Emergency vet near me... poison control",
      buttonColor: 'bg-red-500'
    },
    sections: {
      askMira: { enabled: true },
      miraPrompts: { enabled: true },
      emergency: { enabled: true },
      bundles: { enabled: true },
      products: { enabled: true },
      personalized: { enabled: true }
    }
  });
  const [cmsCategories, setCmsCategories] = useState([]);
  const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') || 
    `Emergency help for ${activePet?.name || 'your pet'}`;
  
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/emergency/page-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config && Object.keys(data.config).length > 0) {
          setCmsConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.categories?.length > 0) {
          setCmsCategories(data.categories);
        }
        if (data.miraPrompts?.length > 0) {
          setCmsMiraPrompts(data.miraPrompts);
        }
        console.log('[EmergencyPage] CMS config loaded');
      }
    } catch (error) {
      console.error('[EmergencyPage] Failed to fetch CMS config:', error);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
    fetchData();
    if (user && token) {
      fetchUserPets();
    }
  }, [user, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [partnersRes, productsRes, bundlesRes, configRes] = await Promise.all([
        fetch(`${API_URL}/api/emergency/vets`),
        fetch(`${API_URL}/api/emergency/products`),
        fetch(`${API_URL}/api/emergency/bundles`),
        fetch(`${API_URL}/api/emergency/config`)
      ]);
      
      if (partnersRes.ok) {
        const data = await partnersRes.json();
        setPartners(data.vets || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }
      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPets(data.pets || []);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const handleEmergencyRequest = (type = null) => {
    if (type) {
      setRequestForm(prev => ({ ...prev, emergency_type: type }));
    }
    setSelectedPet(null);
    setShowRequestModal(true);
  };

  const submitRequest = async () => {
    if (!user && (!requestForm.guest_phone || !requestForm.guest_name)) {
      toast({
        title: "Contact Details Required",
        description: "Please provide your name and phone number so we can reach you",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedPet && requestForm.emergency_type !== 'found_pet' && user) {
      toast({
        title: "Select a Pet",
        description: "Please select which pet needs help",
        variant: "destructive"
      });
      return;
    }
    
    if (!requestForm.description.trim()) {
      toast({
        title: "Describe the Emergency",
        description: "Please describe what happened",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/emergency/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...requestForm,
          pet_id: selectedPet?.id,
          pet_name: selectedPet?.name || requestForm.pet_description,
          pet_breed: selectedPet?.breed,
          pet_age: selectedPet?.age,
          pet_species: selectedPet?.species || 'dog',
          user_id: user?.id,
          user_name: user?.name || requestForm.guest_name,
          user_email: user?.email || requestForm.guest_email,
          user_phone: user?.phone || requestForm.guest_phone,
          is_guest: !user
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Emergency Request Submitted!",
          description: result.message
        });
        setShowRequestModal(false);
        setRequestForm({
          emergency_type: 'medical_emergency',
          severity: 'urgent',
          description: '',
          location: '',
          city: '',
          landmark: '',
          symptoms: '',
          last_seen_location: '',
          last_seen_time: '',
          distinctive_features: '',
          notes: ''
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Failed to submit request",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToNearbyHelp = () => {
    nearbyHelpRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPetFile = () => {
    petFileRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openWhatsAppConcierge = () => {
    window.open('https://wa.me/918971702582?text=Hi, I need emergency assistance for my pet', '_blank');
  };

  // AI Emergency Triage - Opens Mira with the query
  const handleEmergencyTriage = () => {
    if (!triageQuery.trim()) return;
    
    // Open Mira with emergency context pre-filled
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: triageQuery,
        initialQuery: triageQuery,
        context: 'emergency_triage',
        pillar: 'emergency',
        pet_name: activePet?.name,
        pet_breed: activePet?.breed,
        urgent: true
      }
    }));
    
    // Clear the input
    setTriageQuery('');
    setShowTriageResponse(false);
  };

  const featuredPartners = partners.filter(p => p.is_featured);

  return (
    <PillarPageLayout
      pillar="emergency"
      title="Emergency - 24/7 Pet Support | The Doggy Company"
      description="Immediate help for lost pets, medical emergencies, accidents, and more. Our team and partner network are ready to respond 24/7."
    >
      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 1: URGENT HELP BUTTONS - Top of page, panic mode, no scrolling needed
          ═══════════════════════════════════════════════════════════════════════════ */}
      <UrgentHelpButtons 
        onFindClinic={scrollToNearbyHelp}
        onOpenPetFile={scrollToPetFile}
        petName={activePet?.name}
      />

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 1.5: AI EMERGENCY TRIAGE - Quick AI assessment
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-6 px-4 bg-gradient-to-b from-red-50 to-white" data-testid="emergency-triage-section">
        <div className="max-w-4xl mx-auto">
          <Card className="p-4 border-2 border-red-200 bg-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Quick Emergency Assessment</h3>
                <p className="text-xs text-gray-600">Describe the situation for immediate guidance</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="e.g., My dog ate chocolate, he's vomiting..."
                value={triageQuery}
                onChange={(e) => setTriageQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleEmergencyTriage()}
                className="flex-1"
                data-testid="emergency-triage-input"
              />
              <Button 
                onClick={handleEmergencyTriage}
                disabled={triageLoading || !triageQuery.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {triageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assess'}
              </Button>
            </div>
            
            {showTriageResponse && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                {triageLoading ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assessing emergency situation...
                  </div>
                ) : (
                  <div>
                    <div className="prose prose-sm max-w-none">
                      {triageResponse.split('\n').map((line, idx) => (
                        <p key={idx} className={`text-sm ${line.includes('CRITICAL') || line.includes('URGENT') ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setTriageQuery('');
                          setShowTriageResponse(false);
                        }}
                      >
                        Ask Another
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleEmergencyRequest()}
                      >
                        Report Full Emergency
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* Download Emergency Checklists */}
          <div className="mt-4 flex justify-center">
            <ChecklistDownloadButton 
              pillar="emergency" 
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 2: NEARBY EMERGENCY HELP - Google Places API for real-time clinic finder
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div ref={nearbyHelpRef}>
        <NearbyEmergencyHelp />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 3: CONCIERGE HELP - Human support layer via WhatsApp
          ═══════════════════════════════════════════════════════════════════════════ */}
      <ServiceCatalogSection 
        pillar="emergency"
        title="Concierge Will Assist"
        subtitle="We can help coordinate things for you right now"
        maxServices={6}
        hidePrice={true}
      />

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 4: MY PET EMERGENCY FILE - Auto-loaded pet medical info
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div ref={petFileRef}>
        <PetEmergencyFile 
          pet={activePet}
          onEdit={() => toast({ title: 'Edit Pet', description: 'Navigate to My Pets to update info' })}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 5: EMERGENCY SITUATION GUIDES - 10+ actionable guides
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div ref={guidesRef}>
        <EmergencySituationGuides 
          onFindClinic={scrollToNearbyHelp}
          onContactConcierge={openWhatsAppConcierge}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 6: EMERGENCY PRODUCTS & BUNDLES - First-aid kits, recovery items
          Stacked Layout: Bundles on TOP, Products BELOW
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div ref={productsRef}>
        <section className="py-8 px-4 bg-gradient-to-b from-red-50 to-white" data-testid="emergency-products-section">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Emergency Preparedness</h2>
            </div>
            
            {/* BUNDLES ON TOP - Full width row */}
            <div className="mb-8">
              <CuratedBundles pillar="emergency" maxBundles={3} showTitle={true} />
            </div>
            
            {/* PRODUCTS BELOW - Full width grid */}
            <div>
              <EmergencyProductsGrid maxProducts={12} showPersonalized={true} />
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 7: SMART PICKS - Breed/age/size personalized products
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-white" data-testid="emergency-smart-picks-section">
        <div className="max-w-6xl mx-auto">
          <BreedSmartRecommendations pillar="emergency" />
        </div>
      </section>

      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <ArchetypeProducts pillar="emergency" maxProducts={6} showTitle={true} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 8: SPECIAL EMERGENCY PATHS - Lost Pet, Travel, Puppy, Senior
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-white" data-testid="special-paths-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Special Emergency Paths</h2>
            <p className="text-sm text-gray-600">Tailored help for specific situations</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SPECIAL_PATHS.map((path) => {
              const Icon = path.icon;
              const isExpanded = showSpecialPath === path.id;
              
              return (
                <div key={path.id} className="flex flex-col">
                  <button
                    onClick={() => setShowSpecialPath(isExpanded ? null : path.id)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      isExpanded 
                        ? `bg-gradient-to-br ${path.color} text-white shadow-lg` 
                        : `${path.bgColor} hover:shadow-md border-2 border-transparent hover:border-gray-200`
                    }`}
                    data-testid={`special-path-${path.id}`}
                  >
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      isExpanded ? 'bg-white/20' : 'bg-white shadow-sm'
                    }`}>
                      <Icon className={`w-6 h-6 ${isExpanded ? 'text-white' : 'text-gray-700'}`} />
                    </div>
                    <p className={`text-sm font-semibold ${isExpanded ? 'text-white' : 'text-gray-800'}`}>
                      {path.title}
                    </p>
                    <p className={`text-xs mt-1 ${isExpanded ? 'text-white/80' : 'text-gray-500'}`}>
                      {path.description}
                    </p>
                  </button>
                  
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Quick Steps:</p>
                      <ul className="space-y-1">
                        {path.steps.map((step, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                            <span className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        size="sm" 
                        className="w-full mt-3 text-xs"
                        onClick={openWhatsAppConcierge}
                      >
                        Get Concierge Help
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 9: FOLLOW-UP & RECOVERY - Post-emergency support
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gradient-to-b from-emerald-50 to-white" data-testid="recovery-section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Follow-up & Recovery</h2>
            <p className="text-sm text-gray-600">After the emergency, we're still here</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-4 border-l-4 border-emerald-500">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Discharge Checklist
              </h3>
              <p className="text-sm text-gray-600">
                Ensure you have all prescriptions, follow-up appointments, and care instructions before leaving the clinic.
              </p>
            </Card>
            
            <Card className="p-4 border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Medication Reminders
              </h3>
              <p className="text-sm text-gray-600">
                Set up medication schedules and reminders through your pet profile to stay on track with recovery.
              </p>
            </Card>
            
            <Card className="p-4 border-l-4 border-purple-500">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-600" />
                Concierge Follow-up
              </h3>
              <p className="text-sm text-gray-600">
                Our team will check in on your pet's recovery and help with any post-emergency needs.
              </p>
            </Card>
          </div>
          
          <div className="text-center mt-6">
            <Button onClick={openWhatsAppConcierge} className="bg-emerald-600 hover:bg-emerald-700">
              <Phone className="w-4 h-4 mr-2" />
              Schedule Follow-up with Concierge
            </Button>
          </div>
        </div>
      </section>

      {/* 24/7 Emergency Hotline Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center animate-pulse">
                <Phone className="w-5 h-5 text-red-800" />
              </div>
              <div>
                <p className="text-sm opacity-80">24/7 Emergency Hotline</p>
                <p className="text-xl font-bold">{config.hotline || '+91 96631 85747'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                size="sm" 
                className="bg-white text-red-600 hover:bg-red-50"
                onClick={() => handleEmergencyRequest()}
                data-testid="report-emergency-btn"
              >
                <AlertTriangle className="w-4 h-4 mr-1" /> Report Emergency
              </Button>
              <a href={`tel:${config.hotline || '+919663185747'}`}>
                <Button size="sm" variant="outline" className="border-white text-white hover:bg-white/10">
                  <PhoneCall className="w-4 h-4 mr-1" /> Call Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Report Emergency
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Emergency Type */}
            <div>
              <Label>Type of Emergency *</Label>
              <Select 
                value={requestForm.emergency_type} 
                onValueChange={(v) => setRequestForm({...requestForm, emergency_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMERGENCY_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div>
              <Label>How serious is this? *</Label>
              <Select 
                value={requestForm.severity} 
                onValueChange={(v) => setRequestForm({...requestForm, severity: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Guest Contact Info */}
            {!user && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Your Contact Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-amber-700">Your Name *</Label>
                    <Input
                      value={requestForm.guest_name}
                      onChange={(e) => setRequestForm({...requestForm, guest_name: e.target.value})}
                      placeholder="Your name"
                      className="border-amber-300"
                    />
                  </div>
                  <div>
                    <Label className="text-amber-700">Phone Number *</Label>
                    <Input
                      value={requestForm.guest_phone}
                      onChange={(e) => setRequestForm({...requestForm, guest_phone: e.target.value})}
                      placeholder="+91 98765 43210"
                      className="border-amber-300"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-amber-700">Describe your pet</Label>
                  <Input
                    value={requestForm.pet_description}
                    onChange={(e) => setRequestForm({...requestForm, pet_description: e.target.value})}
                    placeholder="e.g., Brown Labrador, 3 years old, named Max"
                    className="border-amber-300"
                  />
                </div>
              </div>
            )}

            {/* Pet Selection for logged-in users */}
            {user && requestForm.emergency_type !== 'found_pet' && (
              <div>
                <Label className="mb-2 block">Select Your Pet *</Label>
                {userPets.length === 0 ? (
                  <Card className="p-4 text-center bg-red-50 border-red-200">
                    <p className="text-red-700">Please add a pet profile first</p>
                    <Button size="sm" className="mt-2" onClick={() => window.location.href = '/pet-profile'}>
                      Add Pet
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {userPets.map((pet) => (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedPet(pet)}
                        className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all ${
                          selectedPet?.id === pet.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-lg">🐕</span>
                        </div>
                        <div>
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-sm text-gray-500">{pet.breed}</p>
                        </div>
                        {selectedPet?.id === pet.id && (
                          <CheckCircle className="w-5 h-5 text-red-600 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <Label>What happened? *</Label>
              <Textarea
                value={requestForm.description}
                onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                placeholder="Describe the emergency in detail..."
                rows={3}
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={requestForm.city}
                  onChange={(e) => setRequestForm({...requestForm, city: e.target.value})}
                  placeholder="Mumbai, Delhi..."
                />
              </div>
              <div>
                <Label>Landmark</Label>
                <Input
                  value={requestForm.landmark}
                  onChange={(e) => setRequestForm({...requestForm, landmark: e.target.value})}
                  placeholder="Near..."
                />
              </div>
            </div>

            {/* Lost Pet Specific Fields */}
            {requestForm.emergency_type === 'lost_pet' && (
              <>
                <div>
                  <Label>Last Seen Location</Label>
                  <Input
                    value={requestForm.last_seen_location}
                    onChange={(e) => setRequestForm({...requestForm, last_seen_location: e.target.value})}
                    placeholder="Where was your pet last seen?"
                  />
                </div>
                <div>
                  <Label>Last Seen Time</Label>
                  <Input
                    type="datetime-local"
                    value={requestForm.last_seen_time}
                    onChange={(e) => setRequestForm({...requestForm, last_seen_time: e.target.value})}
                  />
                </div>
              </>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowRequestModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={submitRequest}
                disabled={(!user && (!requestForm.guest_phone || !requestForm.guest_name)) || !requestForm.description.trim() || submitting}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Siren className="w-4 h-4 mr-2" /> Submit Emergency</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Concierge Button */}
      <ConciergeButton 
        pillar="emergency" 
        position="bottom-right"
        showLabel
      />
    </PillarPageLayout>
  );
};

export default EmergencyPage;
