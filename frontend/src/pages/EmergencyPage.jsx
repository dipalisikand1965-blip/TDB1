import React, { useState, useEffect } from 'react';
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
import { toast } from '../hooks/use-toast';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import AdminQuickEdit from '../components/AdminQuickEdit';
import ProductCard from '../components/ProductCard';
import { getPetPhotoUrl } from '../utils/petAvatar';
import PillarPageLayout from '../components/PillarPageLayout';
import {
  AlertTriangle, Search, Heart, Phone, MapPin, Clock, Ambulance,
  ChevronRight, Sparkles, Star, Loader2, Send, ArrowRight, Play,
  ChevronDown, Users, Shield, Wind, Skull, CloudLightning, ShieldAlert,
  CheckCircle, PawPrint, PhoneCall, Siren, Radio, AlertCircle, ShoppingBag
} from 'lucide-react';

// Emergency Type Configuration - Red/Urgent theme
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

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80'
];

const EmergencyPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [config, setConfig] = useState({});
  
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
    notes: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
    if (user && token) {
      fetchUserPets();
    }
  }, [user, token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
    if (!user) {
      window.location.href = '/login?redirect=/emergency';
      return;
    }
    if (type) {
      setRequestForm(prev => ({ ...prev, emergency_type: type }));
    }
    setSelectedPet(null);
    setShowRequestModal(true);
  };

  const submitRequest = async () => {
    if (!selectedPet && requestForm.emergency_type !== 'found_pet') {
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requestForm,
          pet_id: selectedPet?.id,
          pet_name: selectedPet?.name || requestForm.pet_description,
          pet_breed: selectedPet?.breed,
          pet_age: selectedPet?.age,
          pet_species: selectedPet?.species || 'dog',
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          user_phone: user?.phone
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "🚨 Emergency Request Submitted!",
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

  const featuredPartners = partners.filter(p => p.is_featured);

  return (
    <PillarPageLayout
      pillar="emergency"
      title="If Something Feels Urgent"
      description="Immediate support when it matters most"
    >
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="emergency" position="bottom-left" />
    </PillarPageLayout>
  );
};
export default EmergencyPage;
