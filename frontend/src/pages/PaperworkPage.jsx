import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Progress } from '../components/ui/progress';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import ProductCard from '../components/ProductCard';
import AdminQuickEdit from '../components/AdminQuickEdit';
import PillarPageLayout from '../components/PillarPageLayout';
import {
  Shield, Heart, Plane, FileText, Sparkles, Scale, Upload, Download,
  Folder, FolderOpen, File, Eye, Trash2, Bell, Calendar, Clock,
  CheckCircle, AlertCircle, Plus, ChevronRight, Lock, Search,
  PawPrint, Star, Loader2, X, ExternalLink, ArrowRight, ShoppingBag
} from 'lucide-react';

// Document Categories with icons and colors
const CATEGORY_CONFIG = {
  identity: { name: 'Identity & Safety', icon: Shield, color: 'from-blue-600 to-indigo-700', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
  medical: { name: 'Medical & Health', icon: Heart, color: 'from-red-500 to-rose-600', bgColor: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200' },
  travel: { name: 'Travel Documents', icon: Plane, color: 'from-cyan-500 to-blue-600', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600', borderColor: 'border-cyan-200' },
  insurance: { name: 'Insurance & Financial', icon: FileText, color: 'from-emerald-500 to-green-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' },
  care: { name: 'Care & Training', icon: Sparkles, color: 'from-purple-500 to-violet-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600', borderColor: 'border-purple-200' },
  legal: { name: 'Legal & Compliance', icon: Scale, color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' }
};

const PaperworkPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [documents, setDocuments] = useState({});
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [categories, setCategories] = useState({});
  const [reminders, setReminders] = useState([]);
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    category: 'identity',
    subcategory: '',
    document_name: '',
    document_date: '',
    expiry_date: '',
    notes: '',
    reminder_enabled: false,
    reminder_date: '',
    reminder_channel: 'email',
    file_url: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    request_type: 'document_assistance',
    description: '',
    urgency: 'normal'
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPet && token) {
      fetchPetDocuments(selectedPet.id);
      fetchPetReminders(selectedPet.id);
    }
  }, [selectedPet, token]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [productsRes, bundlesRes, configRes] = await Promise.all([
        fetch(`${API_URL}/api/paperwork/products`),
        fetch(`${API_URL}/api/paperwork/bundles`),
        fetch(`${API_URL}/api/paperwork/categories`)
      ]);
      
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
        setCategories(data.categories || {});
      }
      
      if (user && token) {
        await fetchUserPets();
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
        const pets = data.pets || [];
        setUserPets(pets);
        if (pets.length > 0 && !selectedPet) {
          setSelectedPet(pets[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const fetchPetDocuments = async (petId) => {
    try {
      const response = await fetch(`${API_URL}/api/paperwork/documents/${petId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents_by_category || {});
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchPetReminders = async (petId) => {
    try {
      const response = await fetch(`${API_URL}/api/paperwork/reminders/${petId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedPet) {
      toast({ title: "Select a Pet", description: "Please select a pet first", variant: "destructive" });
      return;
    }
    if (!uploadForm.document_name || (!uploadForm.file_url && !uploadForm.file)) {
      toast({ title: "Required Fields", description: "Please fill in document name and upload a file or provide URL", variant: "destructive" });
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pet_id', selectedPet.id);
      formData.append('category', uploadForm.category);
      formData.append('subcategory', uploadForm.subcategory);
      formData.append('document_name', uploadForm.document_name);
      formData.append('document_date', uploadForm.document_date);
      formData.append('expiry_date', uploadForm.expiry_date);
      formData.append('notes', uploadForm.notes);
      formData.append('reminder_enabled', uploadForm.reminder_enabled);
      formData.append('reminder_date', uploadForm.reminder_date);
      formData.append('reminder_channel', uploadForm.reminder_channel);
      
      // Add file or URL
      if (uploadForm.file) {
        formData.append('file', uploadForm.file);
      } else if (uploadForm.file_url) {
        formData.append('file_url', uploadForm.file_url);
      }
      
      const response = await fetch(`${API_URL}/api/paperwork/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Document uploaded successfully" });
        setShowUploadModal(false);
        setUploadForm({
          category: 'identity',
          subcategory: '',
          document_name: '',
          document_date: '',
          expiry_date: '',
          notes: '',
          reminder_enabled: false,
          reminder_date: '',
          reminder_channel: 'email',
          file_url: '',
          file: null
        });
        fetchPetDocuments(selectedPet.id);
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.detail || "Failed to upload", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload document", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const getTotalDocuments = () => {
    return Object.values(documents).reduce((sum, cat) => sum + (cat.documents?.length || 0), 0);
  };

  const getCompletionPercentage = () => {
    const requiredDocs = ['microchip', 'vaccination', 'adoption'];
    const uploadedSubcats = Object.values(documents).flatMap(cat => cat.documents?.map(d => d.subcategory) || []);
    const completed = requiredDocs.filter(r => uploadedSubcats.includes(r)).length;
    return Math.round((completed / requiredDocs.length) * 100);
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please describe what help you need",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/paperwork/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...requestForm,
          pet_id: selectedPet?.id,
          pet_name: selectedPet?.name,
          user_email: user?.email,
          user_name: user?.name,
          user_phone: user?.phone
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Request Submitted! 📄",
          description: "Our team will help you with your paperwork within 24 hours."
        });
        setShowRequestModal(false);
        setRequestForm({
          request_type: 'document_assistance',
          description: '',
          urgency: 'normal'
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
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSubcategories = categories[uploadForm.category]?.subcategories || [];

  return (
    <PillarPageLayout
      pillar="paperwork"
      title="Paperwork for {name}"
      description="Handled quietly, without stress"
    >
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="paperwork" position="bottom-left" />
    </PillarPageLayout>
  );
};
export default PaperworkPage;
