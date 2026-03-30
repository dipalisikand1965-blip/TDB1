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
import { usePillarContext } from '../context/PillarContext';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import PillarTopicsGrid, { DEFAULT_PILLAR_TOPICS } from '../components/PillarTopicsGrid';
import { PillarDailyTip, PillarHelpBuckets, PillarGuidedPaths } from '../components/PillarGoldSections';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import ProductCard from '../components/ProductCard';
import { ConciergeButton } from '../components/mira-os';
import PillarPicksSection from '../components/PillarPicksSection';
import MiraCuratedLayer from '../components/Mira/MiraCuratedLayer';
import PersonalizedPicks from '../components/PersonalizedPicks';
import MiraAdvisorCard from '../components/MiraAdvisorCard';
import { getSoulBasedReason } from '../utils/petSoulInference';
import SoulMadeCollection from '../components/SoulMadeCollection';
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import ArchetypeProducts from '../components/ArchetypeProducts';
import CuratedBundles from '../components/CuratedBundles';
import { ChecklistDownloadButton } from '../components/checklists';
import { getPetPhotoUrl } from '../utils/petAvatar';
import {
  Shield, Heart, Plane, FileText, Sparkles, Scale, Upload, Download,
  Folder, FolderOpen, File, Eye, Trash2, Bell, Calendar, Clock,
  CheckCircle, AlertCircle, Plus, ChevronRight, Lock, Search,
  PawPrint, Star, Loader2, X, ExternalLink, ArrowRight, ShoppingBag,
  MessageCircle, Crown, Brain, Lightbulb, HelpCircle, Gift
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CMS CONFIG - Fallback if CMS returns empty
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_CATEGORY_CONFIG = {
  identity: { id: 'identity', name: 'Identity & Safety', icon: 'Shield', color: 'from-blue-600 to-indigo-700', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200', description: 'Core identity documents', subcategories: [{ id: 'microchip', name: 'Microchip Registration', required: true }, { id: 'adoption', name: 'Adoption Certificate', required: true }, { id: 'pedigree', name: 'Pedigree Certificate' }, { id: 'registration', name: 'KCI Registration' }] },
  medical: { id: 'medical', name: 'Medical & Health', icon: 'Heart', color: 'from-red-500 to-rose-600', bgColor: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200', description: 'Health records & vaccinations', subcategories: [{ id: 'vaccination', name: 'Vaccination Records', required: true, has_reminder: true }, { id: 'deworming', name: 'Deworming Records', has_reminder: true }, { id: 'health_checkup', name: 'Health Checkup Reports' }, { id: 'prescriptions', name: 'Prescriptions' }] },
  travel: { id: 'travel', name: 'Travel Documents', icon: 'Plane', color: 'from-cyan-500 to-blue-600', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600', borderColor: 'border-cyan-200', description: 'Travel certificates', subcategories: [{ id: 'airline_cert', name: 'Airline Health Certificate' }, { id: 'pet_passport', name: 'Pet Passport' }, { id: 'import_permit', name: 'Import Permit' }] },
  insurance: { id: 'insurance', name: 'Insurance & Financial', icon: 'FileText', color: 'from-emerald-500 to-green-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200', description: 'Insurance & receipts', subcategories: [{ id: 'policy', name: 'Insurance Policy' }, { id: 'claims', name: 'Claim Documents' }, { id: 'receipts', name: 'Purchase Receipts' }] },
  care: { id: 'care', name: 'Care & Training', icon: 'Sparkles', color: 'from-purple-500 to-violet-600', bgColor: 'bg-purple-50', textColor: 'text-purple-600', borderColor: 'border-purple-200', description: 'Grooming & training', subcategories: [{ id: 'grooming', name: 'Grooming Records' }, { id: 'training_cert', name: 'Training Certificates' }, { id: 'behavior', name: 'Behavior Reports' }] },
  legal: { id: 'legal', name: 'Legal & Compliance', icon: 'Scale', color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200', description: 'Licenses & permits', subcategories: [{ id: 'license', name: 'Pet License' }, { id: 'permits', name: 'Housing Permits' }, { id: 'noc', name: 'Society NOC' }] }
};

const DEFAULT_MIRA_PROMPTS = [
  { id: '1', type: 'tip', trigger: 'no_microchip', message: "{petName} doesn't have microchip records yet. This is essential for identification and safety." },
  { id: '2', type: 'reminder', trigger: 'vaccination_due', message: "Vaccination is due soon. Would you like me to remind you closer to the date?" },
  { id: '3', type: 'suggestion', trigger: 'incomplete_vault', message: "Your document vault is {percent}% complete. Our concierge team can help you organize the rest!" }
];

const DEFAULT_CONCIERGE_SERVICES = [
  { id: 'doc-assist', name: 'Document Assistance', description: 'Help organizing, digitizing, and setting up reminders', price: 499, turnaround: '24-48 hours', cta_text: 'Get Help', includes: ['Document review', 'Digital organization', 'Reminder setup'] },
  { id: 'passport-service', name: 'Pet Passport Service', description: 'Full-service passport processing for international travel', price: 2999, turnaround: '5-7 days', cta_text: 'Start Process', includes: ['Document collection', 'Vet coordination', 'Application filing'] },
  { id: 'insurance-advisory', name: 'Insurance Advisory', description: 'Expert help comparing and choosing pet insurance', price: 0, turnaround: '1-2 days', cta_text: 'Get Free Advice', includes: ['Policy comparison', 'Coverage analysis', 'Claim guidance'] }
];

// Icon mapping for dynamic rendering
const ICON_MAP = { Shield, Heart, Plane, FileText, Sparkles, Scale, Folder, Star, Crown, Bell, Brain };

const PaperworkPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/paperwork/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Keep {petName}'s world in order",
    subtitle: 'Your secure vault for all pet documents, records & reminders',
    askMira: {
      enabled: true,
      placeholder: 'Find vaccination records... insurance renewal dates',
      buttonColor: 'bg-blue-500'
    },
    sections: {
      askMira: { enabled: true },
      miraPrompts: { enabled: true },
      documentVault: { enabled: true },
      documentKits: { enabled: true },
      conciergeServices: { enabled: true },
      bundles: { enabled: true },
      products: { enabled: true },
      personalized: { enabled: true }
    }
  });
  const [cmsCategories, setCmsCategories] = useState([]);
  const [cmsConciergeServices, setCmsConciergeServices] = useState([]);
  const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);
  const [cmsHelpBuckets, setCmsHelpBuckets] = useState([]);
  const [cmsDailyTips, setCmsDailyTips] = useState([]);
  const [cmsGuidedPaths, setCmsGuidedPaths] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [documents, setDocuments] = useState({});
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [categories, setCategories] = useState({});
  const [reminders, setReminders] = useState([]);
  
  // Use global pet context
  const { currentPet } = usePillarContext();
  const activePet = currentPet || selectedPet;
  
  // Ask Mira state
  const [askMiraQuestion, setAskMiraQuestion] = useState('');
  const [askMiraLoading, setAskMiraLoading] = useState(false);
  
  // Product modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES - Categories, prompts with fallback to defaults
  // ═══════════════════════════════════════════════════════════════════════════════
  const documentCategories = cmsCategories.length > 0 ? cmsCategories : Object.values(DEFAULT_CATEGORY_CONFIG);
  const documentCategoriesMap = cmsCategories.length > 0 
    ? cmsCategories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {})
    : DEFAULT_CATEGORY_CONFIG;
  const conciergeServices = cmsConciergeServices.length > 0 ? cmsConciergeServices : DEFAULT_CONCIERGE_SERVICES;
  const miraPrompts = cmsMiraPrompts.length > 0 ? cmsMiraPrompts : DEFAULT_MIRA_PROMPTS;
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') || 
    `Keep ${activePet?.name || 'your pet'}'s world in order`;

  // Get contextual Mira prompt based on document state
  const getContextualMiraPrompt = () => {
    const completionPercent = getCompletionPercentage();
    if (completionPercent < 30) {
      const prompt = miraPrompts.find(p => p.trigger === 'no_microchip') || miraPrompts[0];
      return { ...prompt, message: prompt?.message?.replace('{petName}', activePet?.name || 'Your pet') || '' };
    } else if (completionPercent < 100) {
      const prompt = miraPrompts.find(p => p.trigger === 'incomplete_vault') || miraPrompts[2];
      return { ...prompt, message: prompt?.message?.replace('{percent}', completionPercent) || '' };
    }
    return null;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig();
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPet && token) {
      fetchPetDocuments(selectedPet.id);
      fetchPetReminders(selectedPet.id);
    }
  }, [selectedPet, token]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/paperwork/page-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config && Object.keys(data.config).length > 0) {
          setCmsConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.documentCategories?.length > 0) {
          setCmsCategories(data.documentCategories);
        }
        if (data.conciergeServices?.length > 0) {
          setCmsConciergeServices(data.conciergeServices);
        }
        if (data.miraPrompts?.length > 0) {
          setCmsMiraPrompts(data.miraPrompts);
        }
        if (data.helpBuckets?.length > 0) {
          setCmsHelpBuckets(data.helpBuckets);
        }
        if (data.dailyTips?.length > 0) {
          setCmsDailyTips(data.dailyTips);
        }
        if (data.guidedPaths?.length > 0) {
          setCmsGuidedPaths(data.guidedPaths);
        }
        console.log('[PaperworkPage] CMS config loaded');
      }
    } catch (error) {
      console.error('Failed to fetch CMS config:', error);
    }
  };

  const handleAskMira = async () => {
    if (!askMiraQuestion.trim()) return;
    setAskMiraLoading(true);
    try {
      // Open Mira AI with the question
      window.dispatchEvent(new CustomEvent('openMiraAI', {
        detail: { 
          message: askMiraQuestion, 
          context: 'paperwork', 
          pillar: 'paperwork',
          pet_name: activePet?.name,
          pet_breed: activePet?.breed
        }
      }));
      setAskMiraQuestion('');
    } catch (error) {
      console.error('Mira error:', error);
    } finally {
      setAskMiraLoading(false);
    }
  };

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
        toast({
          title: "Request Submitted!",
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

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price || 999,
      quantity: 1,
      image_url: product.image || product.image_url,
      pillar: 'paperwork'
    });
    toast({
      title: "Added to cart",
      description: product.name,
    });
    setSelectedProduct(null);
  };

  const selectedSubcategories = documentCategoriesMap[uploadForm.category]?.subcategories || [];

  // Get contextual Mira prompt for display
  const contextualPrompt = getContextualMiraPrompt();

  return (
    <PillarPageLayout
      pillar="paperwork"
      title="Paperwork - Document Vault | The Doggy Company"
      description="Secure pet document storage. Identity, medical records, travel papers, insurance - neatly organized, securely stored, instantly accessible."
    >
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. ASK MIRA BAR - CMS DRIVEN (Moved to TOP as per requirements) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.askMira?.enabled !== false && (
        <section className="py-8 px-4 bg-gradient-to-b from-slate-50 to-white" data-testid="paperwork-ask-mira">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="paperwork-page-title">
                {pageTitle}
              </h1>
              <p className="text-gray-600 mt-2">{cmsConfig.subtitle}</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-center bg-white rounded-full border border-gray-200 shadow-sm p-1.5 pl-5">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Input
                  value={askMiraQuestion}
                  onChange={(e) => setAskMiraQuestion(e.target.value)}
                  placeholder={cmsConfig.askMira?.placeholder || "Find vaccination records... insurance renewal dates"}
                  className="flex-1 border-0 focus-visible:ring-0 text-sm placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleAskMira()}
                  data-testid="ask-paperwork-input"
                />
                <Button
                  onClick={handleAskMira}
                  disabled={askMiraLoading || !askMiraQuestion.trim()}
                  className={`rounded-full ${cmsConfig.askMira?.buttonColor || 'bg-blue-500'} hover:opacity-90 h-10 w-10 p-0`}
                >
                  {askMiraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. MIRA'S CONTEXTUAL PROMPT - CMS DRIVEN */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.miraPrompts?.enabled !== false && contextualPrompt && activePet && (
        <div className="px-4 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  {contextualPrompt.type === 'tip' ? <Lightbulb className="w-6 h-6" /> :
                   contextualPrompt.type === 'reminder' ? <Bell className="w-6 h-6" /> :
                   <Sparkles className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                      {contextualPrompt.type === 'tip' ? 'Mira\'s Tip' : 
                       contextualPrompt.type === 'reminder' ? 'Reminder' : 'Suggestion'}
                    </span>
                  </div>
                  <p className="text-sm md:text-base font-medium leading-relaxed" data-testid="mira-contextual-prompt">
                    {contextualPrompt.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          2b. PAPERWORK TOPIC CARDS GRID (Gold Standard)
          ════════════════════════════════════════════════════════════════════ */}
      <PillarTopicsGrid
        pillar="paperwork"
        topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.paperwork}
        columns={4}
      />

      {/* ════════════════════════════════════════════════════════════════════
          3. DAILY PAPERWORK TIP + 4. HOW CAN WE HELP + 5. GUIDED PATHS
          Gold Standard sections
          ════════════════════════════════════════════════════════════════════ */}
      <PillarDailyTip
        tips={cmsDailyTips.length > 0 ? cmsDailyTips : [
          { category: 'Document Safety', tip: 'Store a digital backup of all pet documents in the cloud. If you ever need them at a vet or border control, you\'ll have instant access.', icon: 'Shield', color: 'from-blue-500 to-indigo-500' },
          { category: 'Vaccination Records', tip: 'Set a calendar reminder 1 month before each vaccination is due. Staying ahead of renewals means no last-minute scramble before boarding or travel.', icon: 'Calendar', color: 'from-indigo-500 to-blue-600' },
          { category: 'Insurance Tips', tip: 'Read your pet insurance policy thoroughly before you need it. Knowing your coverage limits and exclusions prevents surprises at the worst moment.', icon: 'Clipboard', color: 'from-blue-600 to-sky-600' },
          { category: 'Microchip', tip: 'Update your microchip registration every time you move or change phone numbers. This is the most commonly overlooked step in pet ID management.', icon: 'CheckCircle', color: 'from-sky-500 to-blue-500' },
          { category: 'Travel Documents', tip: 'If you plan to travel internationally with your pet, start the health certificate process at least 90 days in advance. Requirements are strict and time-sensitive.', icon: 'MapPin', color: 'from-blue-500 to-cyan-500' },
          { category: 'Medical History', tip: 'Keep a running medical history document that you take to every vet visit. It prevents repeating tests and helps new vets understand your pet\'s full picture.', icon: 'Clipboard', color: 'from-cyan-500 to-blue-500' },
          { category: 'Identity Documents', tip: 'A current, clear photo of your pet is a document. Update it every 6 months. In the event of loss or theft, you\'ll need it immediately.', icon: 'BookOpen', color: 'from-indigo-400 to-blue-500' },
        ]}
        tipLabel="Today's Document Tip"
      />

      <PillarHelpBuckets
        pillar="paperwork"
        buckets={cmsHelpBuckets.length > 0 ? cmsHelpBuckets : [
          { id: 'records', title: 'Update Records', icon: 'Clipboard', color: 'blue', items: ['Vaccination records', 'Medical history', 'Vet contact details', 'Insurance documents'] },
          { id: 'insurance', title: 'Find Insurance', icon: 'Shield', color: 'indigo', items: ['Compare policies', 'Understand coverage', 'File a claim', 'Annual review'] },
          { id: 'vault', title: 'Health Vault', icon: 'BookOpen', color: 'cyan', items: ['Upload documents', 'Set reminders', 'Share with vets', 'Travel document prep'] },
        ]}
      />

      <PillarGuidedPaths
        pillar="paperwork"
        heading="Guided Document Paths"
        paths={cmsGuidedPaths.length > 0 ? cmsGuidedPaths : [
          { title: 'New Puppy Documents', topicSlug: 'identity', steps: ['Microchip registration', 'First vet records', 'Vaccination schedule', 'Pet insurance signup', 'Digital backup'], color: 'blue' },
          { title: 'Annual Document Review', topicSlug: 'renewal', steps: ['Check vaccination dates', 'Review insurance', 'Update microchip', 'Photo update', 'Vet contact update'], color: 'indigo' },
          { title: 'Travel Document Prep', topicSlug: 'travel', steps: ['Health certificate', 'Import permits', 'Vaccination certificates', 'Microchip check', 'Airline paperwork'], color: 'cyan' },
          { title: 'Insurance Management', topicSlug: 'insurance', steps: ['Compare policies', 'Document pre-conditions', 'Submit application', 'Store policy docs', 'Set renewal reminder'], color: 'sky' },
        ]}
      />

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-300" />
              <span className="text-sm text-slate-200">Secure Document Vault</span>
            </div>
            <div className="flex gap-3">
              {user ? (
                <Button 
                  size="sm" 
                  className="bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => setShowUploadModal(true)}
                  data-testid="upload-document-btn"
                >
                  <Upload className="w-4 h-4 mr-1" /> Upload Document
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => setShowUploadModal(true)}
                >
                  <FileText className="w-4 h-4 mr-1" /> Access Vault
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => document.getElementById('paperwork-products')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Shop Kits
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. DOCUMENT VAULT SECTION - CMS DRIVEN Categories */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.documentVault?.enabled !== false && user && (
        <section className="py-12 bg-white" data-testid="document-vault-section">
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
                      : "All essential documents uploaded! Great job!"
                    }
                  </p>
                </Card>

                {/* Document Folders Grid - Using CMS categories */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  {documentCategories.map((catConfig) => {
                    const catId = catConfig.id;
                    const IconComponent = ICON_MAP[catConfig.icon] || Folder;
                    const catDocs = documents[catId]?.documents || [];
                    const isActive = activeCategory === catId;
                    
                    return (
                      <Card 
                        key={catId}
                        className={`p-2 sm:p-4 cursor-pointer transition-all hover:shadow-lg ${
                          isActive ? `ring-2 ring-offset-2 ring-blue-500` : ''
                        }`}
                        onClick={() => setActiveCategory(isActive ? null : catId)}
                        data-testid={`folder-${catId}`}
                      >
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                          <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${catConfig.color}`}>
                            {isActive ? (
                              <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            ) : (
                              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 text-center sm:text-left">
                            <h3 className="font-semibold text-gray-900 text-xs sm:text-base">{catConfig.name}</h3>
                            <p className="text-[10px] sm:text-sm text-gray-500">{catDocs.length} docs</p>
                          </div>
                          <ChevronRight className={`hidden sm:block w-5 h-5 text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                        </div>
                        
                        {/* Expanded Document List */}
                        {isActive && catDocs.length > 0 && (
                          <div className="mt-4 pt-4 border-t space-y-2">
                            {catDocs.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <File className={`w-4 h-4 ${catConfig.textColor}`} />
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 4. DOCUMENT ORGANISATION KITS - Products with Full Modal */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.documentKits?.enabled !== false && (
        <section id="paperwork-products" className="py-12 bg-gradient-to-b from-slate-50 to-white" data-testid="document-kits-section">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Document Organisation Kits
              </h2>
              <p className="text-gray-600">Everything you need to keep your pet's paperwork organized</p>
            </div>
            
            {/* Bundles */}
            {bundles.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /> Featured Bundles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {bundles.map((bundle) => (
                    <Card 
                      key={bundle.id} 
                      className={`p-4 sm:p-5 border-2 hover:shadow-xl transition-all ${
                        bundle.is_premium ? 'border-blue-400 bg-gradient-to-b from-blue-50 to-white' : 'border-gray-200'
                      }`}
                      data-testid={`bundle-${bundle.id}`}
                    >
                      {bundle.is_premium && (
                        <Badge className="bg-blue-600 mb-2 sm:mb-3 text-[10px] sm:text-xs">Premium</Badge>
                      )}
                      {bundle.is_recommended && !bundle.is_premium && (
                        <Badge className="bg-green-600 mb-2 sm:mb-3 text-[10px] sm:text-xs">Recommended</Badge>
                      )}
                      {bundle.for_new_pet_parents && (
                        <Badge variant="outline" className="text-purple-600 border-purple-300 mb-2 sm:mb-3 text-[10px] sm:text-xs">New Parents</Badge>
                      )}
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{bundle.name}</h4>
                      <p className="text-sm text-gray-600 mb-4">{bundle.description}</p>
                      
                      {bundle.includes_service && (
                        <Badge variant="outline" className="text-blue-600 mb-3">
                          <CheckCircle className="w-3 h-3 mr-1" /> Includes {bundle.service_type?.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold text-blue-600">{bundle.price}</span>
                        {bundle.original_price && bundle.original_price > bundle.price && (
                          <>
                            <span className="text-sm text-gray-400 line-through">{bundle.original_price}</span>
                            <Badge className="bg-green-100 text-green-700">
                              Save {Math.round(bundle.original_price - bundle.price)}
                            </Badge>
                          </>
                        )}
                      </div>
                      
                      {bundle.paw_reward_points > 0 && (
                        <p className="text-sm text-blue-600 mb-4">Earn {bundle.paw_reward_points} Paw Points</p>
                      )}
                      
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          addToCart({
                            id: bundle.id,
                            name: bundle.name,
                            price: bundle.price,
                            image: bundle.image || '',
                            quantity: 1,
                            pillar: 'paperwork'
                          });
                          toast({
                            title: "Added to Cart!",
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
            
            {/* Products with Click Modal */}
            {products.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                  Individual Products
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {products.slice(0, 10).map((product, idx) => (
                    <Card 
                      key={product.id || idx}
                      className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                      onClick={() => setSelectedProduct(product)}
                      data-testid={`product-${product.id || idx}`}
                    >
                      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                        {product.image || product.image_url ? (
                          <img 
                            src={product.image || product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-12 h-12 text-blue-200" />
                          </div>
                        )}
                        {product.compare_price && product.compare_price > product.price && (
                          <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">
                            {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                          </Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">{product.name}</h3>
                        <div className="flex items-baseline gap-2">
                          <span className="text-blue-600 font-bold">{product.price}</span>
                          {product.compare_price && product.compare_price > product.price && (
                            <span className="text-gray-400 text-xs line-through">{product.compare_price}</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <Card 
            className="bg-white max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              {(selectedProduct.image || selectedProduct.image_url) ? (
                <img 
                  src={selectedProduct.image || selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <FileText className="w-16 h-16 text-blue-300" />
                </div>
              )}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h2>
              <p className="text-gray-600 text-sm mb-4">{selectedProduct.description}</p>
              
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-blue-600">{selectedProduct.price}</span>
                {selectedProduct.compare_price && selectedProduct.compare_price > selectedProduct.price && (
                  <>
                    <span className="text-gray-400 line-through">{selectedProduct.compare_price}</span>
                    <Badge className="bg-green-100 text-green-700">
                      {Math.round((1 - selectedProduct.price / selectedProduct.compare_price) * 100)}% off
                    </Badge>
                  </>
                )}
              </div>
              
              {selectedProduct.paw_reward_points && (
                <p className="text-sm text-blue-600 mb-4 flex items-center gap-1">
                  <PawPrint className="w-4 h-4" />
                  Earn {selectedProduct.paw_reward_points} paw points
                </p>
              )}
              
              <Button 
                onClick={() => handleAddToCart(selectedProduct)}
                className="w-full bg-blue-500 hover:bg-blue-600"
                size="lg"
              >
                Add to Cart - {selectedProduct.price}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 5. CONCIERGE SERVICES - CMS DRIVEN */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.conciergeServices?.enabled !== false && (
        <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-700 text-white" data-testid="concierge-services-section">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Need Help Organizing Documents?</h2>
              <p className="text-blue-100">Our concierge team can help you organize, digitize, and set up reminders</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {conciergeServices.map((service) => (
                <Card key={service.id} className="p-6 bg-white/10 backdrop-blur border-white/20 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-blue-200">{service.turnaround}</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-100 mb-4">{service.description}</p>
                  {service.includes && service.includes.length > 0 && (
                    <ul className="text-sm text-blue-100 mb-4 space-y-1">
                      {service.includes.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-300" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold">
                      {service.price === 0 ? 'Free' : `${service.price}`}
                    </span>
                    <Button 
                      size="sm" 
                      className="bg-white text-blue-600 hover:bg-blue-50"
                      onClick={() => setShowRequestModal(true)}
                    >
                      {service.cta_text || 'Get Started'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => setShowRequestModal(true)}
              >
                Request Document Assistance <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      )}

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
                  {documentCategories.map((catConfig) => (
                    <SelectItem key={catConfig.id} value={catConfig.id}>{catConfig.name}</SelectItem>
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
                        <p className="font-medium text-green-600">{uploadForm.file.name}</p>
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
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">OR paste URL</span>
                  </div>
                </div>
                
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
                disabled={uploading || !uploadForm.document_name || (!uploadForm.file_url && !uploadForm.file)}
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
                Our concierge team can help organize, digitize, and manage your pet's paperwork.
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
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PERSONALIZED SECTIONS - CMS DRIVEN */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.personalized?.enabled !== false && (
        <>
          {/* SERVICE CATALOG WITH PRICING */}
          <ServiceCatalogSection 
            pillar="paperwork"
            title="Paperwork, Personalised"
            subtitle="Documentation services with transparent pricing"
            maxServices={8}
          />

          {/* SOUL MADE COLLECTION */}
          <section className="py-12 px-4" data-testid="paperwork-soul-made-section">
            <div className="max-w-6xl mx-auto">
              {/* {/* <SoulMadeCollection
                pillar="paperwork"
                maxItems={8}
                showTitle={true}
              /> */} */}
            </div>
          </section>

          {/* BREED-SMART RECOMMENDATIONS */}
          <section className="py-8 px-4" data-testid="paperwork-breed-smart-section">
            <div className="max-w-6xl mx-auto">
              <BreedSmartRecommendations pillar="paperwork" />
            </div>
          </section>

          {/* ARCHETYPE-PERSONALIZED PRODUCTS */}
          <section className="py-8 px-4">
            <div className="max-w-6xl mx-auto">
              <ArchetypeProducts pillar="paperwork" maxProducts={8} showTitle={true} /> */}
            </div>
          </section>

          {/* CURATED BUNDLES */}
          <section className="py-8 px-4">
            <div className="max-w-6xl mx-auto">
              <CuratedBundles pillar="paperwork" showTitle={true} /> */}
            </div>
          </section>
        </>
      )}
      
      {/* MIRA'S CURATED LAYER */}
      <div className="py-8 bg-gradient-to-b from-white to-slate-50/30">
        {/* Personalized Product Picks */}
        <PersonalizedPicks pillar="paperwork" maxProducts={6} />

        {/* MIRA ADVISOR */}
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <MiraAdvisorCard pillar="paperwork" activePet={activePet} />
          
          {/* Download Documents Organizer Checklist */}
          <div className="mt-4 flex justify-center">
            <ChecklistDownloadButton 
              pillar="paperwork" 
              variant="outline"
              className="border-slate-400 text-slate-700 hover:bg-slate-50"
            />
          </div>
        </div>
        
        <MiraCuratedLayer
          pillar="paperwork"
          activePet={activePet || userPets?.[0]}
          token={token}
          userEmail={user?.email}
          isLoading={!userPets && !!token}
        />
        
        {/* Mira's Picks for Pet */}
        {(activePet || userPets?.[0]) && (
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <PillarPicksSection pillar="paperwork" pet={activePet || userPets?.[0]} />
          </div>
        )}
      </div>
      
      {/* Concierge® Button */}
      <ConciergeButton 
        pillar="paperwork" 
        position="bottom-right"
        showLabel
      />
    </PillarPageLayout>
  );
};

export default PaperworkPage;
