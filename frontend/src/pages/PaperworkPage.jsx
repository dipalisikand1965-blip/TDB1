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
import MiraChatWidget from '../components/MiraChatWidget';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import ProductCard from '../components/ProductCard';
import AdminQuickEdit from '../components/AdminQuickEdit';
import SEOHead from '../components/SEOHead';
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
    file_url: ''
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900" data-testid="paperwork-page">
      {/* SEO Meta Tags */}
      <SEOHead page="paperwork" path="/paperwork" />

      {/* Hero Section */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="max-w-3xl">
            <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 mb-4">
              <Lock className="w-3 h-3 mr-1" /> Secure Pet Document Vault
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Dog's Complete Life File
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8">
              Identity, medical records, travel papers, insurance — neatly organized, 
              securely stored, instantly accessible when you need them.
            </p>
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Button 
                  size="lg" 
                  className="bg-white text-blue-900 hover:bg-blue-50"
                  onClick={() => setShowUploadModal(true)}
                  data-testid="upload-document-btn"
                >
                  <Upload className="w-5 h-5 mr-2" /> Upload Document
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="bg-white text-blue-900 hover:bg-blue-50"
                  onClick={() => setShowUploadModal(true)}
                >
                  <FileText className="w-5 h-5 mr-2" /> Access Document Vault
                </Button>
              )}
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => document.getElementById('paperwork-products')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <FileText className="w-5 h-5 mr-2" /> Shop Document Kits
              </Button>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <Shield className="w-6 h-6 mx-auto mb-2 text-blue-300" />
              <p className="text-sm text-blue-200">Secure Storage</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <Bell className="w-6 h-6 mx-auto mb-2 text-blue-300" />
              <p className="text-sm text-blue-200">Smart Reminders</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <Plane className="w-6 h-6 mx-auto mb-2 text-blue-300" />
              <p className="text-sm text-blue-200">Travel Ready</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <PawPrint className="w-6 h-6 mx-auto mb-2 text-blue-300" />
              <p className="text-sm text-blue-200">Earn Paw Points</p>
            </div>
          </div>
        </div>
      </section>

      {/* Document Vault Section (for logged in users) */}
      {user && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            {/* Pet Selector */}
            {userPets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Select Pet</h2>
                <div className="flex flex-wrap gap-3">
                  {userPets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPet(pet)}
                      className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
                        selectedPet?.id === pet.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <PawPrint className="w-4 h-4" />
                      {pet.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedPet && (
              <>
                {/* Progress Card */}
                <Card className="p-6 mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedPet.name}'s Document Vault</h3>
                      <p className="text-blue-200">{getTotalDocuments()} documents uploaded</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{getCompletionPercentage()}%</p>
                      <p className="text-sm text-blue-200">Essential Docs</p>
                    </div>
                  </div>
                  <Progress value={getCompletionPercentage()} className="h-2 bg-blue-400" />
                  <p className="text-sm text-blue-200 mt-2">
                    {getCompletionPercentage() < 100 
                      ? "Upload microchip, vaccination, and adoption docs to complete essentials"
                      : "All essential documents uploaded! Great job! 🎉"
                    }
                  </p>
                </Card>

                {/* Document Folders Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {Object.entries(CATEGORY_CONFIG).map(([catId, config]) => {
                    const Icon = config.icon;
                    const catDocs = documents[catId]?.documents || [];
                    const isActive = activeCategory === catId;
                    
                    return (
                      <Card 
                        key={catId}
                        className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                          isActive ? `ring-2 ring-offset-2 ${config.borderColor} ring-blue-500` : ''
                        }`}
                        onClick={() => setActiveCategory(isActive ? null : catId)}
                        data-testid={`folder-${catId}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${config.color}`}>
                            {isActive ? (
                              <FolderOpen className="w-6 h-6 text-white" />
                            ) : (
                              <Folder className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{config.name}</h3>
                            <p className="text-sm text-gray-500">{catDocs.length} documents</p>
                          </div>
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                        </div>
                        
                        {/* Expanded Document List */}
                        {isActive && catDocs.length > 0 && (
                          <div className="mt-4 pt-4 border-t space-y-2">
                            {catDocs.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <File className={`w-4 h-4 ${config.textColor}`} />
                                  <span className="text-sm text-gray-700">{doc.document_name}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {isActive && catDocs.length === 0 && (
                          <div className="mt-4 pt-4 border-t text-center py-4">
                            <p className="text-sm text-gray-500">No documents yet</p>
                            <Button 
                              size="sm" 
                              className="mt-2" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadForm(prev => ({ ...prev, category: catId }));
                                setShowUploadModal(true);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Document
                            </Button>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>

                {/* Upcoming Reminders */}
                {reminders.length > 0 && (
                  <Card className="p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-blue-600" /> Upcoming Reminders
                    </h3>
                    <div className="space-y-3">
                      {reminders.slice(0, 5).map((reminder) => (
                        <div key={reminder.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900">{reminder.title}</p>
                              <p className="text-sm text-gray-500">{reminder.reminder_date}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-blue-600">{reminder.channel}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {userPets.length === 0 && (
              <Card className="p-8 text-center">
                <PawPrint className="w-12 h-12 mx-auto text-blue-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Your Pet First</h3>
                <p className="text-gray-500 mb-4">Create a pet profile to start building their document vault</p>
                <Button onClick={() => window.location.href = '/pet-profile'}>
                  Add Pet Profile
                </Button>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Products & Bundles Section */}
      <section id="paperwork-products" className="py-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Document Organization Kits
            </h2>
            <p className="text-gray-600">Everything you need to keep your pet's paperwork organized</p>
          </div>
          
          {/* Bundles */}
          {bundles.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-600" /> Featured Bundles
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.map((bundle) => (
                  <Card 
                    key={bundle.id} 
                    className={`p-5 border-2 hover:shadow-xl transition-all ${
                      bundle.is_premium ? 'border-blue-400 bg-gradient-to-b from-blue-50 to-white' : 'border-gray-200'
                    }`}
                    data-testid={`bundle-${bundle.id}`}
                  >
                    {bundle.is_premium && (
                      <Badge className="bg-blue-600 mb-3">Premium</Badge>
                    )}
                    {bundle.is_recommended && !bundle.is_premium && (
                      <Badge className="bg-green-600 mb-3">Recommended</Badge>
                    )}
                    {bundle.for_new_pet_parents && (
                      <Badge variant="outline" className="text-purple-600 border-purple-300 mb-3">For New Pet Parents</Badge>
                    )}
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{bundle.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{bundle.description}</p>
                    
                    {bundle.includes_service && (
                      <Badge variant="outline" className="text-blue-600 mb-3">
                        <CheckCircle className="w-3 h-3 mr-1" /> Includes {bundle.service_type?.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl font-bold text-blue-600">₹{bundle.price}</span>
                      <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                      <Badge className="bg-green-100 text-green-700">
                        Save ₹{bundle.original_price - bundle.price}
                      </Badge>
                    </div>
                    
                    {bundle.paw_reward_points > 0 && (
                      <p className="text-sm text-blue-600 mb-4">🐾 Earn {bundle.paw_reward_points} Paw Points</p>
                    )}
                    
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        addToCart({
                          id: bundle.id,
                          name: bundle.name,
                          price: bundle.price,
                          image: bundle.image || 'https://via.placeholder.com/200?text=Paperwork+Bundle',
                          quantity: 1,
                          pillar: 'paperwork'
                        });
                        toast({
                          title: "Added to Cart! 📄",
                          description: `${bundle.name} added to your cart`
                        });
                      }}
                    >
                      Add to Cart
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Products by Type - Using ProductCard for clickable modals */}
          {products.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
                Individual Products
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {products.slice(0, 10).map((product) => (
                  <ProductCard key={product.id} product={product} pillar="paperwork" />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Need Help Organizing Documents?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Our concierge® team can help you organize, digitize, and set up reminders for all your pet's important paperwork.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50"
            onClick={() => setShowRequestModal(true)}
          >
            Request Document Assistance <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Document
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select 
                value={uploadForm.category} 
                onValueChange={(v) => setUploadForm({...uploadForm, category: v, subcategory: ''})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Document Type</Label>
              <Select 
                value={uploadForm.subcategory} 
                onValueChange={(v) => setUploadForm({...uploadForm, subcategory: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSubcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name} {sub.required && <span className="text-red-500">*</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Document Name *</Label>
              <Input 
                value={uploadForm.document_name}
                onChange={(e) => setUploadForm({...uploadForm, document_name: e.target.value})}
                placeholder="e.g., Vaccination Certificate 2024"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Document Date</Label>
                <Input 
                  type="date"
                  value={uploadForm.document_date}
                  onChange={(e) => setUploadForm({...uploadForm, document_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input 
                  type="date"
                  value={uploadForm.expiry_date}
                  onChange={(e) => setUploadForm({...uploadForm, expiry_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Upload Document *</Label>
              <div className="mt-2 space-y-3">
                {/* File Input */}
                <div className="relative">
                  <input 
                    type="file" 
                    id="document-file-input"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadForm({...uploadForm, file: file, file_url: ''});
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('document-file-input')?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    {uploadForm.file ? (
                      <div className="text-center">
                        <p className="font-medium text-green-600">✅ {uploadForm.file.name}</p>
                        <p className="text-xs text-gray-500">{(uploadForm.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC up to 10MB</p>
                      </>
                    )}
                  </button>
                </div>
                
                {/* OR Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">OR paste URL</span>
                  </div>
                </div>
                
                {/* URL Input */}
                <Input 
                  value={uploadForm.file_url}
                  onChange={(e) => setUploadForm({...uploadForm, file_url: e.target.value, file: null})}
                  placeholder="https://drive.google.com/..."
                  disabled={!!uploadForm.file}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea 
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({...uploadForm, notes: e.target.value})}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label>Set Reminder</Label>
                <Switch 
                  checked={uploadForm.reminder_enabled}
                  onCheckedChange={(v) => setUploadForm({...uploadForm, reminder_enabled: v})}
                />
              </div>
              
              {uploadForm.reminder_enabled && (
                <>
                  <div>
                    <Label>Reminder Date</Label>
                    <Input 
                      type="date"
                      value={uploadForm.reminder_date}
                      onChange={(e) => setUploadForm({...uploadForm, reminder_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Reminder Channel</Label>
                    <Select 
                      value={uploadForm.reminder_channel}
                      onValueChange={(v) => setUploadForm({...uploadForm, reminder_channel: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="app">App Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowUploadModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={uploading || !uploadForm.document_name || !uploadForm.file_url}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Assistance Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Document Assistance</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-gray-600">
                Our concierge® team can help organize, digitize, and manage your pet's paperwork.
              </p>
            </div>
            
            {selectedPet && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <PawPrint className="w-5 h-5 text-blue-600" />
                <span className="font-medium">{selectedPet.name}</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <Label>What do you need help with?</Label>
                <Select 
                  value={requestForm.request_type}
                  onValueChange={(value) => setRequestForm(prev => ({ ...prev, request_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document_assistance">Document Organization</SelectItem>
                    <SelectItem value="digitization">Scan & Digitize Papers</SelectItem>
                    <SelectItem value="travel_docs">Travel Document Prep</SelectItem>
                    <SelectItem value="insurance_claim">Insurance Claim Help</SelectItem>
                    <SelectItem value="record_retrieval">Retrieve Medical Records</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Describe your request</Label>
                <Textarea
                  placeholder="Tell us what you need help with..."
                  value={requestForm.description}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Urgency</Label>
                <Select 
                  value={requestForm.urgency}
                  onValueChange={(value) => setRequestForm(prev => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - When convenient</SelectItem>
                    <SelectItem value="normal">Normal - Within a few days</SelectItem>
                    <SelectItem value="high">High - Within 24 hours</SelectItem>
                    <SelectItem value="urgent">Urgent - ASAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleSubmitRequest}
              disabled={submitting || !requestForm.description.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="submit-paperwork-request-btn"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><FileText className="w-4 h-4 mr-2" /> Submit Request</>
              )}
            </Button>
            
            {!user && (
              <p className="text-xs text-center text-gray-500">
                Sign in to submit requests and track your documents.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* === SERVICE CATALOG WITH PRICING === */}
      <ServiceCatalogSection 
        pillar="paperwork"
        title="Paperwork, Personalised"
        subtitle="Documentation services with transparent pricing"
        maxServices={8}
      />
      
      {/* Mira Floating Chat Widget */}
      <MiraChatWidget pillar="paperwork" />
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="paperwork" position="bottom-left" />
    </div>
  );
};

export default PaperworkPage;
