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
import ProductCard from '../components/ProductCard';
import AdminQuickEdit from '../components/AdminQuickEdit';
import { getPetPhotoUrl } from '../utils/petAvatar';
import PillarPageLayout from '../components/PillarPageLayout';
import {
  Brain, Heart, Apple, Home, Stethoscope, GraduationCap,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Users, Calendar, MapPin, Award,
  Phone, Video, MessageCircle, Mail, Clock, PawPrint, Shield, ShoppingBag, AlertCircle
} from 'lucide-react';

// Advisory Type Configuration - Violet/Purple theme
const ADVISORY_TYPES = {
  behaviour: { name: 'Behaviour Consultations', icon: Brain, color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
  nutrition: { name: 'Nutrition Planning', icon: Apple, color: 'from-emerald-500 to-green-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  senior_care: { name: 'Senior Pet Planning', icon: Heart, color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  new_pet: { name: 'New Pet Guidance', icon: Home, color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  health: { name: 'Health Advisory', icon: Stethoscope, color: 'from-rose-500 to-pink-600', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  training: { name: 'Training Consultations', icon: GraduationCap, color: 'from-indigo-500 to-blue-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' }
};

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild - Just seeking advice' },
  { value: 'moderate', label: 'Moderate - Ongoing concern' },
  { value: 'severe', label: 'Severe - Significant issue' },
  { value: 'urgent', label: 'Urgent - Need immediate help' }
];

const FORMAT_OPTIONS = [
  { value: 'video_call', label: 'Video Call', icon: Video },
  { value: 'phone_call', label: 'Phone Call', icon: Phone },
  { value: 'chat', label: 'Chat/Messaging', icon: MessageCircle },
  { value: 'email', label: 'Email Consultation', icon: Mail }
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80'
];

const AdvisoryPage = () => {
  const { user, token } = useAuth();
  
  const [advisors, setAdvisors] = useState([]);
  const [featuredAdvisors, setFeaturedAdvisors] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  
  const [requestForm, setRequestForm] = useState({
    advisory_type: 'behaviour',
    concern: '',
    concern_duration: '',
    severity: 'moderate',
    previous_consultations: false,
    current_treatments: '',
    preferred_format: 'video_call',
    preferred_time: '',
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
      const [advisorsRes, featuredRes, productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/advisory/advisors`),
        fetch(`${API_URL}/api/advisory/advisors?is_featured=true`),
        fetch(`${API_URL}/api/advisory/products`),
        fetch(`${API_URL}/api/advisory/bundles`)
      ]);
      
      if (advisorsRes.ok) {
        const data = await advisorsRes.json();
        setAdvisors(data.advisors || []);
      }
      if (featuredRes.ok) {
        const data = await featuredRes.json();
        setFeaturedAdvisors(data.advisors || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
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

  const handleConsultationRequest = (type = null) => {
    if (!user) {
      window.location.href = '/login?redirect=/advisory';
      return;
    }
    if (type) {
      setRequestForm(prev => ({ ...prev, advisory_type: type }));
    }
    setSelectedPet(null);
    setShowRequestModal(true);
  };

  const submitRequest = async () => {
    if (!selectedPet) {
      toast({
        title: "Select a Pet",
        description: "Please select which pet needs advisory",
        variant: "destructive"
      });
      return;
    }
    
    if (!requestForm.concern.trim()) {
      toast({
        title: "Describe Your Concern",
        description: "Please describe what you need help with",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/advisory/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requestForm,
          pet_id: selectedPet.id,
          pet_name: selectedPet.name,
          pet_breed: selectedPet.breed,
          pet_age: selectedPet.age,
          pet_species: selectedPet.species || 'dog',
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          user_phone: user?.phone
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Write to Pet Soul - Record advisory consultation
        try {
          await fetch(`${API_URL}/api/pet-vault/${selectedPet.id}/record-advisory-consult`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              advisor_id: 'tdc-advisory',
              advisor_name: 'The Doggy Company Advisory',
              service_type: requestForm.advisory_type,
              consultation_type: requestForm.preferred_format,
              date: new Date().toISOString().split('T')[0],
              duration_minutes: null,
              summary: requestForm.concern.substring(0, 200),
              recommendations: [],
              follow_up_date: null,
              booking_id: result.request_id
            })
          });
        } catch (soulError) {
          console.warn('Pet Soul update failed (non-blocking):', soulError);
        }
        
        toast({
          title: "Request Submitted! 🧠",
          description: result.message
        });
        setShowRequestModal(false);
        setRequestForm({
          advisory_type: 'behaviour',
          concern: '',
          concern_duration: '',
          severity: 'moderate',
          previous_consultations: false,
          current_treatments: '',
          preferred_format: 'video_call',
          preferred_time: '',
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

  const filteredAdvisors = selectedType 
    ? advisors.filter(a => a.specialties?.includes(selectedType))
    : advisors;

  return (
    <PillarPageLayout
      pillar="advisory"
      title="Guidance for {name}"
      description="When clarity helps before deciding"
    >
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="advisory" position="bottom-left" />
    </PillarPageLayout>
  );
};
export default AdvisoryPage;
