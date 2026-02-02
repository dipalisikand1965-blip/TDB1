import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../hooks/use-toast';
import ProductManager from '../components/ProductManager';
import CollectionManager from '../components/CollectionManager';
import ReviewsManager from '../components/ReviewsManager';
import AutoshipManager from '../components/AutoshipManager';
import FulfilmentManager from '../components/FulfilmentManager';
import ReportsManager from '../components/ReportsManager';
import MISDashboard from '../components/admin/MISDashboard';
import PillarCategoryManager from '../components/PillarCategoryManager';
import EnhancedCollectionManager from '../components/EnhancedCollectionManager';
import OccasionBoxManager from '../components/OccasionBoxManager';
import PartnerManager from '../components/PartnerManager';
import PricingHub from '../components/PricingHub';
import StayManager from '../components/admin/StayManager';
import TravelManager from '../components/admin/TravelManager';
import CareManager from '../components/admin/CareManager';
import EnjoyManager from '../components/admin/EnjoyManager';
import FitManager from '../components/admin/FitManager';
import LearnManager from '../components/admin/LearnManager';
import AdvisoryManager from '../components/admin/AdvisoryManager';
import PaperworkManager from '../components/admin/PaperworkManager';
import EmergencyManager from '../components/admin/EmergencyManager';
import CelebrateManager from '../components/admin/CelebrateManager';
import NPSManager from '../components/admin/NPSManager';
import AdoptManager from '../components/admin/AdoptManager';
import FarewellManager from '../components/admin/FarewellManager';
import ShopManager from '../components/admin/ShopManager';
import DataMigration from '../components/DataMigration';
import { DashboardTab, OrdersTab, MembersTab, ChatsTab, DineManager, ServiceDesk, ProductTagsManager, MembershipManager, AboutManager, MemberDirectory } from '../components/admin';
import PageContentManager from '../components/admin/PageContentManager';
import NotificationBell from '../components/admin/NotificationBell';
import UnifiedInbox from '../components/admin/UnifiedInbox';
import CelebrationsCalendar from '../components/admin/CelebrationsCalendar';
import BreedTagsManager from '../components/admin/BreedTagsManager';
import AgentManagement from '../components/admin/AgentManagement';
import CommunicationsManager from '../components/admin/CommunicationsManager';
import MiraMemoryManager from '../components/admin/MiraMemoryManager';
import AutomatedRemindersManager from '../components/admin/AutomatedRemindersManager';
import KitAssemblyManager from '../components/admin/KitAssemblyManager';
// ConciergeCommandCenter DEPRECATED - features merged into ServiceDesk
import AdvancedAnalyticsDashboard from '../components/admin/AdvancedAnalyticsDashboard';
import UnifiedProductBox from '../components/admin/UnifiedProductBox';
import ServiceBox from '../components/admin/ServiceBox';
import ConciergeExperiencesAdmin from '../components/admin/ConciergeExperiencesAdmin';
import PillarQueues from '../components/admin/PillarQueues';
import { testimonials as mockTestimonials, faqs as mockFaqs } from '../mockData';
import { API_URL } from '../utils/api';
import { getPetPhotoUrl } from '../utils/petAvatar';
import {
  Lock,
  User,
  MessageCircle,
  Cake,
  Ticket,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  X,
  PawPrint,
  Package,
  Video,
  Edit,
  Trash2,
  Plus,
  Save,
  Image,
  DollarSign,
  Tag,
  Download,
  Upload,
  CloudDownload,
  Zap,
  Users,
  ShoppingBag,
  Star,
  Heart,
  Syringe,
  Pill,
  Stethoscope,
  Scale,
  FileText,
  HelpCircle,
  Store,
  Cookie,
  Phone,
  Mail,
  Building,
  Sparkles,
  Utensils,
  Layers,
  Calendar,
  Truck,
  BarChart3,
  Gift,
  Inbox,
  Settings,
  PartyPopper,
  Dumbbell,
  Megaphone,
  Brain,
  Bell,
  Headphones,
  AlertCircle,
  ExternalLink,
  Crown,
  Database,
  TrendingUp,
  GraduationCap,
  Flame,
  Briefcase
} from 'lucide-react';
import AdminEngagement from '../components/AdminEngagement';

const Admin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dashboard data
  const [dashboard, setDashboard] = useState(null);
  const [chats, setChats] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedPetProfile, setSelectedPetProfile] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [memberDetails, setMemberDetails] = useState({ orders: [], pets: [] });
  
  // Health Vault state
  const [showHealthVaultModal, setShowHealthVaultModal] = useState(false);
  const [selectedPetForHealth, setSelectedPetForHealth] = useState(null);
  const [healthVaultData, setHealthVaultData] = useState({
    vaccines: [],
    medications: [],
    vet_visits: [],
    weight_history: [],
    vets: []
  });
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthTab, setHealthTab] = useState('vaccines');
  const [showAddVaccineModal, setShowAddVaccineModal] = useState(false);
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [newVaccine, setNewVaccine] = useState({ vaccine_name: '', date_given: '', next_due_date: '', vet_name: '', notes: '' });
  const [newMedication, setNewMedication] = useState({ medication_name: '', dosage: '', frequency: '', start_date: '', end_date: '', reason: '', notes: '' });
  
  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [seedingAll, setSeedingAll] = useState(false);
  const [seedingProduction, setSeedingProduction] = useState(false);

  // Seed All function - uses UPSERT so existing data is preserved
  const seedAllPillars = async () => {
    setSeedingAll(true);
    try {
      // UNIVERSAL SEED - Seeds ALL 14 pillars with products, services, pricing, shipping
      toast({ title: '🚀 Universal Seed Started', description: 'Seeding all 14 pillars + enhancing tags... This may take 30-60 seconds.' });
      
      console.log('[Universal Seed] Starting seed to:', `${API_URL}/api/admin/universal-seed`);
      
      const response = await fetch(`${API_URL}/api/admin/universal-seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[Universal Seed] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Universal Seed] Success:', data);
        
        // Now run Product Intelligence to enhance all tags
        toast({ title: '🏷️ Enhancing Product Tags...', description: 'Adding pillar, breed, size, occasion tags...' });
        
        try {
          const tagResponse = await fetch(`${API_URL}/api/admin/products/run-intelligence?update_db=true`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (tagResponse.ok) {
            const tagData = await tagResponse.json();
            console.log('[Universal Seed] Tag enhancement:', tagData);
            
            toast({
              title: '✅ Universal Seed + Tags Complete!',
              description: `Products seeded & ${tagData.results?.tags_added || 0} tags enhanced across ${tagData.results?.products_processed || 0} products`,
              duration: 8000
            });
          }
        } catch (tagError) {
          console.log('[Universal Seed] Tag enhancement skipped:', tagError);
          toast({
            title: '✅ Universal Seed Complete!',
            description: `Products seeded. Tag enhancement will run on next restart.`,
            duration: 8000
          });
        }
      } else {
        const errorText = await response.text();
        console.error('[Universal Seed] Failed:', response.status, errorText);
        toast({ 
          title: 'Seed Failed', 
          description: `Status ${response.status}: ${errorText.slice(0, 100)}`, 
          variant: 'destructive',
          duration: 10000 
        });
      }
    } catch (error) {
      console.error('[Universal Seed] Error:', error);
      toast({ 
        title: 'Network Error', 
        description: `Failed to connect: ${error.message}`, 
        variant: 'destructive',
        duration: 10000 
      });
    } finally {
      setSeedingAll(false);
    }
  };

  // Seed Production Data - FAQs, Collections, Sample Tickets
  const seedProductionData = async () => {
    setSeedingProduction(true);
    try {
      console.log('[Seed Production] Starting...');
      toast({ title: '🚀 Seeding Production Data...', description: 'Adding FAQs, Collections, Tickets' });
      
      const response = await fetch(`${API_URL}/api/admin/seed-production-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      console.log('[Seed Production] Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Seed Production] Success:', data);
        toast({
          title: '✅ Production Data Seeded!',
          description: `${data.results?.faqs || 0} FAQs, ${data.results?.collections || 0} Collections seeded`,
          duration: 5000
        });
        fetchDashboard();
      } else {
        const errorText = await response.text();
        console.error('[Seed Production] Failed:', response.status, errorText);
        toast({ 
          title: 'Seed Failed', 
          description: `Status ${response.status}: ${errorText.slice(0, 100)}`, 
          variant: 'destructive',
          duration: 8000 
        });
      }
    } catch (error) {
      console.error('[Seed Production] Error:', error);
      toast({ 
        title: 'Network Error', 
        description: `Failed: ${error.message}`, 
        variant: 'destructive',
        duration: 8000 
      });
    } finally {
      setSeedingProduction(false);
    }
  };

  useEffect(() => {
    if (selectedMember) {
      const fetchDetails = async () => {
        try {
          const [ordersRes, petsRes] = await Promise.all([
            fetch(`${API_URL}/api/admin/orders?email=${selectedMember.email}`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/api/admin/pets?search=${selectedMember.email}`, { headers: getAuthHeaders() })
          ]);
          
          const ordersData = await ordersRes.json();
          const petsData = await petsRes.json();
          
          setMemberDetails({
            orders: ordersData.orders || [],
            pets: petsData.pets || []
          });
        } catch (e) {
          console.error("Failed to fetch member details", e);
        }
      };
      fetchDetails();
    } else {
      setMemberDetails({ orders: [], pets: [] });
    }
  }, [selectedMember]);
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Products
  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productFilter, setProductFilter] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Site Content
  const [siteContent, setSiteContent] = useState(null);
  const [editingVideo, setEditingVideo] = useState(null);
  
  // Sync & Import
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef(null);
  
  // Orders
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderFilter, setOrderFilter] = useState('');
  
  // Members
  const [members, setMembers] = useState([]);
  const [memberStats, setMemberStats] = useState({});
  
  // Chatbase
  const [chatbaseChats, setChatbaseChats] = useState([]);
  const [syncingChatbase, setSyncingChatbase] = useState(false);
  const [expandedChat, setExpandedChat] = useState(null);
  
  // FAQs
  const [faqs, setFaqs] = useState([]);
  const [faqCategories, setFaqCategories] = useState([]);
  const [editingFaq, setEditingFaq] = useState(null);
  const [showFaqModal, setShowFaqModal] = useState(false);
  
  // Testimonials
  const [testimonials, setTestimonials] = useState([]);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  
  // Blog Posts
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogCategories, setBlogCategories] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Pet Profiles
  const [petProfiles, setPetProfiles] = useState([]);
  const [petStats, setPetStats] = useState({});
  
  // Loyalty Points
  const [loyaltyStats, setLoyaltyStats] = useState(null);
  
  // Discount Codes
  const [discountCodes, setDiscountCodes] = useState([]);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  
  // Abandoned Carts
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [abandonedStats, setAbandonedStats] = useState({});
  const [selectedAbandonedCarts, setSelectedAbandonedCarts] = useState([]);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [abandonedCartSettings, setAbandonedCartSettings] = useState({
    enabled: true,
    reminders: [
      { reminder_num: 1, delay_hours: 1, subject: "🛒 You left something behind!", include_discount: false },
      { reminder_num: 2, delay_hours: 24, subject: "🐾 Your pup is still waiting!", include_discount: false },
      { reminder_num: 3, delay_hours: 72, subject: "🎁 Final reminder + 10% OFF!", include_discount: true, discount_code: "COMEBACK10", discount_percent: 10 }
    ]
  });
  const [showAbandonedCartSettingsModal, setShowAbandonedCartSettingsModal] = useState(false);

  // Franchise Inquiries
  const [franchiseInquiries, setFranchiseInquiries] = useState([]);
  const [franchiseStats, setFranchiseStats] = useState({});
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  // Streaties Program
  const [streatiesStats, setStreatiesStats] = useState(null);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [newDonation, setNewDonation] = useState({ ngo_name: '', city: '', amount: 0, animals_fed: 0, description: '' });

  // Check for stored auth

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        localStorage.setItem('adminAuth', btoa(`${username}:${password}`));
        setIsAuthenticated(true);
        fetchDashboard();
      } else {
        setLoginError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setLoginError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const getAuthHeaders = () => {
    const auth = localStorage.getItem('adminAuth');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.new.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    setPasswordChanging(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_password: passwordData.current,
          new_password: passwordData.new,
          confirm_password: passwordData.confirm
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Update stored auth with new password
        const newAuth = btoa(`${username}:${passwordData.new}`);
        localStorage.setItem('adminAuth', newAuth);
        setPassword(passwordData.new);
        
        setShowPasswordModal(false);
        setPasswordData({ current: '', new: '', confirm: '' });
        alert('Password changed successfully!');
      } else {
        setPasswordError(data.detail || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('An error occurred. Please try again.');
    }
    setPasswordChanging(false);
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  // Check for stored auth
  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    if (storedAuth) {
      // Decode and restore username/password from stored auth
      try {
        const decoded = atob(storedAuth);
        const [storedUsername, storedPassword] = decoded.split(':');
        if (storedUsername && storedPassword) {
          setUsername(storedUsername);
          setPassword(storedPassword);
        }
      } catch (e) {
        console.error('Error decoding stored auth:', e);
      }
      setIsAuthenticated(true);
      fetchDashboard();
    }
  }, []);

  const fetchChats = async () => {
    try {
      let url = `${API_URL}/api/admin/chats?limit=100`;
      if (filterCity) url += `&city=${filterCity}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats);
      }
      
      // Also fetch Chatbase chats
      const cbResponse = await fetch(`${API_URL}/api/admin/chatbase-chats?limit=100`, { headers: getAuthHeaders() });
      if (cbResponse.ok) {
        const cbData = await cbResponse.json();
        setChatbaseChats(cbData.chats || []);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  };

  const syncChatbase = async () => {
    setSyncingChatbase(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/sync-chatbase`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Chatbase sync complete! Fetched: ${data.total_fetched}, New: ${data.new_synced}`);
        fetchChats();
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.detail}`);
      }
    } catch (error) {
      console.error('Chatbase sync failed:', error);
      alert('Failed to sync Chatbase conversations');
    }
    setSyncingChatbase(false);
  };

  const fetchCustomRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/custom-requests`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCustomRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch custom requests:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      let url = `${API_URL}/api/admin/products?limit=500`;
      if (productFilter) url += `&category=${productFilter}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setProductCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchSiteContent = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/site-content`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSiteContent(data);
      }
    } catch (error) {
      console.error('Failed to fetch site content:', error);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/sync/status`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      let url = `${API_URL}/api/admin/orders?limit=100`;
      if (orderFilter) url += `&status=${orderFilter}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setOrderStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/members`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
        setMemberStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  // Fetch FAQs
  const fetchFaqs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/faqs`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const faqList = data.faqs || [];
        setFaqs(faqList);
        setFaqCategories(data.categories || []);
        
        // Auto-seed from mockData if empty
        if (faqList.length === 0 && mockFaqs && mockFaqs.length > 0) {
          console.log('Seeding FAQs from mockData...');
          for (const faq of mockFaqs) {
            await fetch(`${API_URL}/api/admin/faqs`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                question: faq.question,
                answer: faq.answer,
                category: faq.category || 'General',
                is_featured: true
              })
            });
          }
          // Refresh to show seeded data
          const refreshed = await fetch(`${API_URL}/api/admin/faqs`, { headers: getAuthHeaders() });
          if (refreshed.ok) {
            const refreshedData = await refreshed.json();
            setFaqs(refreshedData.faqs || []);
            setFaqCategories(refreshedData.categories || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    }
  };

  // Save FAQ
  const saveFaq = async (faqData) => {
    try {
      const isEdit = faqData.id && !faqData.id.startsWith('new-');
      const url = isEdit ? `${API_URL}/api/admin/faqs/${faqData.id}` : `${API_URL}/api/admin/faqs`;
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(faqData)
      });
      if (response.ok) {
        fetchFaqs();
        setShowFaqModal(false);
        setEditingFaq(null);
      }
    } catch (error) {
      console.error('Failed to save FAQ:', error);
    }
  };

  // Delete FAQ
  const deleteFaq = async (faqId) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await fetch(`${API_URL}/api/admin/faqs/${faqId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchFaqs();
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
    }
  };

  // Fetch Testimonials
  const fetchTestimonials = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/testimonials`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const testimonialList = data.testimonials || [];
        setTestimonials(testimonialList);
        
        // Auto-seed from mockData if empty
        if (testimonialList.length === 0 && mockTestimonials && mockTestimonials.length > 0) {
          console.log('Seeding testimonials from mockData...');
          for (const testimonial of mockTestimonials.slice(0, 6)) {
            await fetch(`${API_URL}/api/admin/testimonials`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                name: testimonial.name,
                pet_name: testimonial.petName || testimonial.pet_name,
                location: testimonial.location || 'India',
                text: testimonial.text,
                rating: testimonial.rating || 5,
                avatar: testimonial.avatar,
                is_featured: true,
                is_approved: true
              })
            });
          }
          // Refresh to show seeded data
          const refreshed = await fetch(`${API_URL}/api/admin/testimonials`, { headers: getAuthHeaders() });
          if (refreshed.ok) {
            const refreshedData = await refreshed.json();
            setTestimonials(refreshedData.testimonials || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
    }
  };

  // Save Testimonial
  const saveTestimonial = async (data) => {
    try {
      const isEdit = data.id && !data.id.startsWith('new-');
      const url = isEdit ? `${API_URL}/api/admin/testimonials/${data.id}` : `${API_URL}/api/admin/testimonials`;
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (response.ok) {
        fetchTestimonials();
        setShowTestimonialModal(false);
        setEditingTestimonial(null);
      }
    } catch (error) {
      console.error('Failed to save testimonial:', error);
    }
  };

  // Delete Testimonial
  const deleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await fetch(`${API_URL}/api/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchTestimonials();
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
    }
  };

  // Fetch Blog Posts
  const fetchBlogPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/blog-posts`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setBlogPosts(data.posts || []);
      }
      // Also fetch categories
      const catResponse = await fetch(`${API_URL}/api/admin/blog-categories`, {
        headers: getAuthHeaders()
      });
      if (catResponse.ok) {
        const catData = await catResponse.json();
        setBlogCategories(catData.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    }
  };

  // Save Blog Post
  const saveBlogPost = async (data) => {
    try {
      const isEdit = data.id && !data.id.startsWith('new-');
      const url = isEdit ? `${API_URL}/api/admin/blog-posts/${data.id}` : `${API_URL}/api/admin/blog-posts`;
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (response.ok) {
        fetchBlogPosts();
        setShowPostModal(false);
        setEditingPost(null);
      }
    } catch (error) {
      console.error('Failed to save blog post:', error);
    }
  };

  // Save Blog Category
  const saveBlogCategory = async (data) => {
    try {
      const isEdit = data.id && !data.id.startsWith('new-');
      const url = isEdit ? `${API_URL}/api/admin/blog-categories/${data.id}` : `${API_URL}/api/admin/blog-categories`;
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (response.ok) {
        fetchBlogPosts(); // Refresh categories too
        setShowCategoryModal(false);
        setEditingCategory(null);
      }
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  // Delete Blog Category
  const deleteBlogCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/blog-categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        fetchBlogPosts();
      } else {
        const err = await response.json();
        alert(err.detail || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Delete Blog Post
  const deleteBlogPost = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await fetch(`${API_URL}/api/admin/blog-posts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchBlogPosts();
    } catch (error) {
      console.error('Failed to delete blog post:', error);
    }
  };

  // Fetch Pet Profiles
  const fetchPetProfiles = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pets`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPetProfiles(data.pets || []);
        setPetStats(data.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch pet profiles:', error);
    }
  };

  // Fetch Loyalty Stats
  const fetchLoyaltyStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/loyalty/stats`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setLoyaltyStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch loyalty stats:', error);
    }
  };

  // Fetch Health Vault Data for a Pet
  const fetchHealthVaultData = async (petId) => {
    setLoadingHealth(true);
    try {
      const [vaccinesRes, medicationsRes, visitsRes, weightRes, vetsRes] = await Promise.all([
        fetch(`${API_URL}/api/pet-vault/${petId}/vaccines`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/pet-vault/${petId}/medications`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/pet-vault/${petId}/visits`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/pet-vault/${petId}/weight-history`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/pet-vault/${petId}/vets`, { headers: getAuthHeaders() })
      ]);
      
      const vaccines = vaccinesRes.ok ? await vaccinesRes.json() : { vaccines: [] };
      const medications = medicationsRes.ok ? await medicationsRes.json() : { medications: [] };
      const visits = visitsRes.ok ? await visitsRes.json() : { visits: [] };
      const weight = weightRes.ok ? await weightRes.json() : { history: [] };
      const vets = vetsRes.ok ? await vetsRes.json() : { vets: [] };
      
      setHealthVaultData({
        vaccines: vaccines.vaccines || [],
        medications: medications.medications || [],
        vet_visits: visits.visits || [],
        weight_history: weight.history || [],
        vets: vets.vets || []
      });
    } catch (error) {
      console.error('Failed to fetch health vault data:', error);
    } finally {
      setLoadingHealth(false);
    }
  };

  // Add vaccine record
  const handleAddVaccine = async () => {
    if (!selectedPetForHealth || !newVaccine.vaccine_name || !newVaccine.date_given) return;
    try {
      const response = await fetch(`${API_URL}/api/pet-vault/${selectedPetForHealth.id}/vaccines`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newVaccine)
      });
      if (response.ok) {
        toast({ title: 'Vaccine Added', description: `${newVaccine.vaccine_name} recorded successfully` });
        setShowAddVaccineModal(false);
        setNewVaccine({ vaccine_name: '', date_given: '', next_due_date: '', vet_name: '', notes: '' });
        fetchHealthVaultData(selectedPetForHealth.id);
      }
    } catch (error) {
      console.error('Failed to add vaccine:', error);
      toast({ title: 'Error', description: 'Failed to add vaccine', variant: 'destructive' });
    }
  };

  // Add medication record
  const handleAddMedication = async () => {
    if (!selectedPetForHealth || !newMedication.medication_name || !newMedication.dosage) return;
    try {
      const response = await fetch(`${API_URL}/api/pet-vault/${selectedPetForHealth.id}/medications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newMedication)
      });
      if (response.ok) {
        toast({ title: 'Medication Added', description: `${newMedication.medication_name} recorded successfully` });
        setShowAddMedicationModal(false);
        setNewMedication({ medication_name: '', dosage: '', frequency: '', start_date: '', end_date: '', reason: '', notes: '' });
        fetchHealthVaultData(selectedPetForHealth.id);
      }
    } catch (error) {
      console.error('Failed to add medication:', error);
      toast({ title: 'Error', description: 'Failed to add medication', variant: 'destructive' });
    }
  };

  // Fetch Discount Codes
  const fetchDiscountCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/discount-codes`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setDiscountCodes(data.codes || []);
      }
    } catch (error) {
      console.error('Failed to fetch discount codes:', error);
    }
  };

  // Save Discount Code
  const saveDiscountCode = async (data) => {
    try {
      const isEdit = data.id && !data.id.startsWith('new-');
      const url = isEdit ? `${API_URL}/api/admin/discount-codes/${data.id}` : `${API_URL}/api/admin/discount-codes`;
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (response.ok) {
        fetchDiscountCodes();
        setShowDiscountModal(false);
        setEditingDiscount(null);
      }
    } catch (error) {
      console.error('Failed to save discount code:', error);
    }
  };

  // Delete Discount Code
  const deleteDiscountCode = async (id) => {
    if (!window.confirm('Delete this discount code?')) return;
    try {
      await fetch(`${API_URL}/api/admin/discount-codes/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      fetchDiscountCodes();
    } catch (error) {
      console.error('Failed to delete discount code:', error);
    }
  };

  // Fetch Abandoned Carts
  const fetchAbandonedCarts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/abandoned-carts`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAbandonedCarts(data.carts || []);
        setAbandonedStats(data.stats || {});
      }
      
      // Also fetch settings
      const settingsRes = await fetch(`${API_URL}/api/admin/app-settings`, {
        headers: getAuthHeaders()
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.settings) {
          setAbandonedCartSettings({
            enabled: settingsData.settings.abandoned_cart_enabled !== false,
            reminders: settingsData.settings.abandoned_cart_reminders || abandonedCartSettings.reminders
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch abandoned carts:', error);
    }
  };

  const saveAbandonedCartSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/app-settings`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abandoned_cart_enabled: abandonedCartSettings.enabled,
          abandoned_cart_reminders: abandonedCartSettings.reminders
        })
      });
      if (response.ok) {
        toast({ title: "Settings saved", description: "Abandoned cart settings updated successfully" });
        setShowAbandonedCartSettingsModal(false);
      } else {
        toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to save abandoned cart settings:', error);
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
  };

  const updateReminderSetting = (index, field, value) => {
    const newReminders = [...abandonedCartSettings.reminders];
    newReminders[index] = { ...newReminders[index], [field]: value };
    setAbandonedCartSettings({ ...abandonedCartSettings, reminders: newReminders });
  };

  // Fetch Franchise Inquiries
  const fetchFranchiseInquiries = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/franchise`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setFranchiseInquiries(data.inquiries || []);
        setFranchiseStats(data.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch franchise inquiries:', error);
    }
  };

  const updateFranchiseInquiry = async (inquiryId, update) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/franchise/${inquiryId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(update)
      });
      if (response.ok) {
        fetchFranchiseInquiries();
        setShowInquiryModal(false);
      }
    } catch (error) {
      console.error('Failed to update inquiry:', error);
    }
  };

  const deleteFranchiseInquiry = async (inquiryId) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/franchise/${inquiryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        fetchFranchiseInquiries();
      }
    } catch (error) {
      console.error('Failed to delete inquiry:', error);
    }
  };

  // Fetch Streaties Stats
  const fetchStreatiesStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/streaties`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setStreatiesStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch streaties stats:', error);
    }
  };

  const updateStreatiesStats = async (stats) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/streaties/stats`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(stats)
      });
      if (response.ok) {
        fetchStreatiesStats();
      }
    } catch (error) {
      console.error('Failed to update streaties stats:', error);
    }
  };

  const addStreatiesDonation = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/streaties/donation`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newDonation)
      });
      if (response.ok) {
        fetchStreatiesStats();
        setShowDonationModal(false);
        setNewDonation({ ngo_name: '', city: '', amount: 0, animals_fed: 0, description: '' });
      }
    } catch (error) {
      console.error('Failed to add donation:', error);
    }
  };

  // Trigger Abandoned Cart Check
  const triggerAbandonedCartCheck = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/abandoned-carts/trigger-check`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Sent ${data.reminders_sent} reminder emails`);
        fetchAbandonedCarts();
      }
    } catch (error) {
      console.error('Failed to trigger cart check:', error);
    }
  };

  // Send reminder to selected abandoned carts
  const sendRemindersToSelected = async () => {
    if (selectedAbandonedCarts.length === 0) {
      alert('Please select at least one cart to send reminders');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/admin/abandoned-carts/send-reminders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cart_ids: selectedAbandonedCarts })
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Sent ${data.reminders_sent} reminder${data.reminders_sent !== 1 ? 's' : ''}`);
        setSelectedAbandonedCarts([]);
        fetchAbandonedCarts();
      }
    } catch (error) {
      console.error('Failed to send reminders:', error);
      alert('Failed to send reminders');
    }
  };

  // Send reminder to individual cart
  const sendReminderToCart = async (cartId, email) => {
    setSendingReminder(cartId);
    try {
      const response = await fetch(`${API_URL}/api/admin/abandoned-carts/${cartId}/send-reminder`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        alert(`Reminder sent to ${email}`);
        fetchAbandonedCarts();
      } else {
        const err = await response.json();
        alert(err.detail || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
      alert('Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  // Toggle cart selection
  const toggleCartSelection = (cartId) => {
    setSelectedAbandonedCarts(prev => 
      prev.includes(cartId) 
        ? prev.filter(id => id !== cartId)
        : [...prev, cartId]
    );
  };

  // Select all carts
  const toggleSelectAllCarts = () => {
    if (selectedAbandonedCarts.length === abandonedCarts.filter(c => c.email).length) {
      setSelectedAbandonedCarts([]);
    } else {
      setSelectedAbandonedCarts(abandonedCarts.filter(c => c.email).map(c => c.id));
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchOrders();
        alert('Order updated!');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const updateMemberTier = async (userId, tier) => {
    try {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const response = await fetch(`${API_URL}/api/admin/members/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ membership_tier: tier, membership_expires: expires })
      });
      if (response.ok) {
        fetchMembers();
        alert('Member tier updated!');
      }
    } catch (error) {
      console.error('Failed to update member:', error);
    }
  };

  const syncFromShopify = async () => {
    if (!window.confirm('This will sync all products from thedoggybakery.com. Continue?')) return;
    
    setSyncing(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/sync/shopify`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Sync completed!\n\nFetched: ${data.total_fetched}\nAdded: ${data.added}\nUpdated: ${data.updated}`);
        fetchProducts();
        fetchSyncStatus();
      } else {
        alert('Sync failed. Check console for details.');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Check console for details.');
    }
    setSyncing(false);
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const auth = localStorage.getItem('adminAuth');
      const response = await fetch(`${API_URL}/api/admin/products/import-csv`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}` },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`CSV Import completed!\n\nImported: ${data.imported}\nUpdated: ${data.updated}\nErrors: ${data.errors?.length || 0}`);
        fetchProducts();
      } else {
        alert('CSV import failed');
      }
    } catch (error) {
      console.error('CSV import failed:', error);
      alert('CSV import failed');
    }
    setImporting(false);
    e.target.value = ''; // Reset file input
  };

  const exportCsv = async () => {
    try {
      const auth = localStorage.getItem('adminAuth');
      const response = await fetch(`${API_URL}/api/admin/products/export-csv`, {
        headers: { 'Authorization': `Basic ${auth}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products_export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const saveProduct = async (product) => {
    try {
      const isNew = !product.id || product.id.startsWith('new-');
      const url = isNew 
        ? `${API_URL}/api/admin/products`
        : `${API_URL}/api/admin/products/${product.id}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        fetchProducts();
        setEditingProduct(null);
        alert('Product saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchProducts();
        alert('Product deleted successfully!');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const saveVideos = async (videos) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/site-content/videos`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(videos)
      });
      
      if (response.ok) {
        fetchSiteContent();
        setEditingVideo(null);
        alert('Videos saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save videos:', error);
    }
  };

  const sendNotification = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/send-notification/${sessionId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.whatsapp_url) {
          window.open(data.whatsapp_url, '_blank');
        }
        alert(data.email_sent ? 'Email notification sent!' : 'Email failed, but WhatsApp link generated.');
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const updateChatStatus = async (sessionId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/chats/${sessionId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchChats();
        fetchDashboard();
      }
    } catch (error) {
      console.error('Failed to update chat:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'chats') fetchChats();
      else if (activeTab === 'requests') fetchCustomRequests();
      else if (activeTab === 'products') {
        fetchProducts();
        fetchSyncStatus();
      }
      else if (activeTab === 'content') fetchSiteContent();
      else if (activeTab === 'orders') fetchOrders();
      else if (activeTab === 'members') fetchMembers();
      else if (activeTab === 'faqs') fetchFaqs();
      else if (activeTab === 'testimonials') fetchTestimonials();
      else if (activeTab === 'insights') fetchBlogPosts();
      else if (activeTab === 'pets') fetchPetProfiles();
      else if (activeTab === 'loyalty') fetchLoyaltyStats();
      else if (activeTab === 'discounts') fetchDiscountCodes();
      else if (activeTab === 'abandoned') fetchAbandonedCarts();
      else if (activeTab === 'franchise') fetchFranchiseInquiries();
      else if (activeTab === 'streaties') fetchStreatiesStats();
    }
  }, [isAuthenticated, activeTab, filterCity, filterStatus, productFilter, orderFilter]);

  // Fetch health vault data when modal opens
  useEffect(() => {
    if (showHealthVaultModal && selectedPetForHealth) {
      fetchHealthVaultData(selectedPetForHealth.id);
    }
  }, [showHealthVaultModal, selectedPetForHealth]);

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white/95 backdrop-blur shadow-2xl" data-testid="admin-login-card">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
            <p className="text-gray-500 mt-2">The Doggy Company</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  data-testid="admin-username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  data-testid="admin-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  data-testid="toggle-password-visibility"
                >
                  {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="text-red-500 text-sm text-center">{loginError}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={loading}
              data-testid="admin-login-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <div className="text-center mt-4">
              <a 
                href="/admin/forgot-password" 
                className="text-sm text-purple-600 hover:text-purple-700 hover:underline"
                data-testid="forgot-password-link"
              >
                Forgot Password?
              </a>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <PawPrint className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-sm sm:text-base">TDB Admin</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Welcome, Aditya</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => setShowPasswordModal(true)} className="text-xs hidden sm:flex">
                <Lock className="w-4 h-4 mr-1" /> Change Password
              </Button>
              <NotificationBell 
                credentials={{ username, password }}
                onNavigate={(link) => {
                  // Parse the link to extract tab and subtab
                  const url = new URL(link, window.location.origin);
                  const tab = url.searchParams.get('tab');
                  const subtab = url.searchParams.get('subtab');
                  if (tab) {
                    setActiveTab(tab);
                  }
                }}
              />
              <Button variant="ghost" size="icon" onClick={fetchDashboard} className="h-8 w-8 sm:h-10 sm:w-10">
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 sm:h-10 sm:w-10">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Mobile Tab Selector */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-xl border shadow-sm"
            data-testid="admin-mobile-menu-btn"
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-purple-600" />
              <span className="font-medium">{activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/30 z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              {/* Menu Panel */}
              <div className="fixed top-0 left-0 right-0 bottom-0 z-50 bg-white overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                  <span className="font-bold text-lg">Admin Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Command Center */}
                  <div>
                    <p className="px-2 py-1 text-xs font-bold text-purple-700 uppercase mb-2 flex items-center gap-1">
                      🎯 Command Center
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'servicedesk', label: 'Service Desk', icon: Ticket },
                        { id: 'inbox', label: 'Unified Inbox', icon: Inbox },
                        { id: 'pillar-queues', label: 'Pillar Queues', icon: Package },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-3 rounded-lg text-left ${activeTab === tab.id ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <tab.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Members & Pets */}
                  <div>
                    <p className="px-2 py-1 text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1">
                      👥 Members & Pets
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'member-directory', label: 'Pet Parents', icon: Users },
                        { id: 'pets', label: 'Pet Profiles', icon: PawPrint },
                        { id: 'membership', label: 'Membership', icon: Crown },
                        { id: 'loyalty', label: 'Loyalty', icon: Star },
                        { id: 'engagement', label: 'Engagement', icon: Flame },
                        { id: 'celebrations', label: 'Celebrations', icon: Calendar },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-3 rounded-lg text-left ${activeTab === tab.id ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <tab.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Operations */}
                  <div>
                    <p className="px-2 py-1 text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-1">
                      📦 Operations
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'orders', label: 'Orders', icon: Package },
                        { id: 'fulfilment', label: 'Fulfilment', icon: Package },
                        { id: 'autoship', label: 'Autoship', icon: RefreshCw },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-3 rounded-lg text-left ${activeTab === tab.id ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <tab.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Catalog */}
                  <div>
                    <p className="px-2 py-1 text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-1">
                      🏪 Catalog
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'product-box', label: 'Product Box', icon: Package },
                        { id: 'service-box', label: 'Service Box', icon: Store },
                        { id: 'pricing', label: 'Pricing', icon: DollarSign },
                        { id: 'experiences', label: 'Experiences', icon: Calendar },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-3 rounded-lg text-left ${activeTab === tab.id ? 'bg-amber-100 text-amber-700 border-2 border-amber-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <tab.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Analytics & Tools */}
                  <div>
                    <p className="px-2 py-1 text-xs font-bold text-pink-700 uppercase mb-2 flex items-center gap-1">
                      📊 Analytics & Tools
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'analytics', label: 'Analytics', icon: Eye },
                        { id: 'reports', label: 'Reports', icon: FileText },
                        { id: 'communications', label: 'Comms', icon: Send },
                        { id: 'mira-memory', label: 'Mira Memory', icon: MessageCircle },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                          className={`flex items-center gap-2 p-3 rounded-lg text-left ${activeTab === tab.id ? 'bg-pink-100 text-pink-700 border-2 border-pink-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <tab.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Desktop Tabs - Reorganized Tabs - Cleaner Layout */}
        <div className="mb-8 hidden md:block">
          {/* Command Center - Most Used Daily */}
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <span className="text-xs text-gray-500 px-2 py-1 font-bold uppercase bg-purple-100 rounded">🎯 Command Center</span>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'servicedesk', label: 'Service Desk', icon: Ticket },
              { id: 'inbox', label: 'Unified Inbox', icon: Inbox },
              { id: 'pillar-queues', label: 'Pillar Queues', icon: Package },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={activeTab === tab.id ? 'bg-purple-600' : ''}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </Button>
            ))}
          </div>
          
          {/* Members & Pets */}
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <span className="text-xs text-gray-500 px-2 py-1 font-bold uppercase bg-blue-100 rounded">👥 Members & Pets</span>
            {[
              { id: 'member-directory', label: 'Pet Parents', icon: Users },
              { id: 'pets', label: 'Pet Profiles', icon: PawPrint },
              { id: 'membership', label: 'Membership', icon: Crown },
              { id: 'loyalty', label: 'Loyalty', icon: Star },
              { id: 'engagement', label: 'Engagement', icon: Flame },
              { id: 'celebrations', label: 'Celebrations', icon: Calendar },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={activeTab === tab.id ? 'bg-blue-600' : ''}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </Button>
            ))}
          </div>
          
          {/* Commerce */}
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <span className="text-xs text-gray-500 px-2 py-1 font-bold uppercase bg-green-100 rounded">📦 Commerce</span>
            {[
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'fulfilment', label: 'Fulfilment', icon: Truck },
              { id: 'product-box', label: 'Product Box', icon: Package },
              { id: 'service-box', label: 'Service Box', icon: Briefcase },
              { id: 'collections', label: 'Collections', icon: Layers },
              { id: 'pricing', label: 'Pricing', icon: Tag },
              { id: 'autoship', label: 'Autoship', icon: RefreshCw },
              { id: 'abandoned', label: 'Abandoned', icon: ShoppingBag },
              { id: 'discounts', label: 'Discounts', icon: Tag },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={activeTab === tab.id ? 'bg-green-600 text-white' : ''}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </Button>
            ))}
          </div>
          
          {/* The 14 Pillars - Compact Icon Bar */}
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <span className="text-xs text-gray-500 px-2 py-1 font-bold uppercase bg-pink-100 rounded">🏛️ 14 Pillars</span>
            {[
              { id: 'products', emoji: '🎂', label: 'Celebrate' },
              { id: 'dine', emoji: '🍽️', label: 'Dine' },
              { id: 'stay', emoji: '🏨', label: 'Stay' },
              { id: 'travel', emoji: '✈️', label: 'Travel' },
              { id: 'care', emoji: '💊', label: 'Care' },
              { id: 'enjoy', emoji: '🎾', label: 'Enjoy' },
              { id: 'fit', emoji: '🏃', label: 'Fit' },
              { id: 'learn', emoji: '🎓', label: 'Learn' },
              { id: 'paperwork', emoji: '📄', label: 'Paperwork' },
              { id: 'advisory', emoji: '📋', label: 'Advisory' },
              { id: 'emergency', emoji: '🚨', label: 'Emergency' },
              { id: 'farewell', emoji: '🌈', label: 'Farewell' },
              { id: 'adopt', emoji: '🐾', label: 'Adopt' },
              { id: 'shop', emoji: '🛒', label: 'Shop' },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                className={activeTab === tab.id ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'hover:bg-purple-50'}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                title={tab.label}
                data-testid={`admin-tab-${tab.id}`}
              >
                <span className="text-lg mr-1">{tab.emoji}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </Button>
            ))}
          </div>
          
          {/* Mira & AI */}
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <span className="text-xs text-gray-500 px-2 py-1 font-bold uppercase bg-violet-100 rounded">🤖 Mira & AI</span>
            {[
              { id: 'chats', label: 'Mira Chats', icon: MessageCircle },
              { id: 'mira-memory', label: 'Memory', icon: Brain },
              { id: 'kit-assembly', label: 'Kit Assembly', icon: Package },
              { id: 'communications', label: 'Communications', icon: Mail },
              { id: 'reminders', label: 'Reminders', icon: Bell },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={activeTab === tab.id ? 'bg-violet-600' : ''}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </Button>
            ))}
          </div>
          
          {/* Marketing Tools */}
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <span className="text-xs text-gray-500 px-2 py-1 font-bold uppercase bg-rose-100 rounded">📣 Marketing</span>
            {[
              { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
              { id: 'occasion-boxes', label: 'Occasion Boxes', icon: Gift },
              { id: 'proactive', label: 'Proactive', icon: Bell },
              { id: 'notifications', label: 'Push', icon: Bell },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={activeTab === tab.id ? 'bg-rose-600 text-white' : ''}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </Button>
            ))}
          </div>
          
          {/* Analytics & Reports */}
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <span className="text-xs text-gray-500 px-2 py-1 font-bold uppercase bg-amber-100 rounded">📈 Analytics</span>
            {[
              { id: 'mis', label: 'Live MIS', icon: BarChart3 },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'reviews', label: 'Reviews', icon: MessageCircle },
              { id: 'nps', label: 'Pawmoter', icon: Star },
              { id: 'site-status', label: 'Site Status', icon: FileText },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={activeTab === tab.id ? 'bg-amber-600' : ''}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </Button>
            ))}
          </div>
          
          {/* Content */}
          <div className="flex gap-2 flex-wrap items-center mb-4">
            <span className="text-xs text-gray-500 px-2 py-1 font-bold uppercase bg-cyan-100 rounded">📝 Content</span>
            {[
              { id: 'insights', label: 'Blog', icon: FileText },
              { id: 'testimonials', label: 'Testimonials', icon: Star },
              { id: 'faqs', label: 'FAQs', icon: HelpCircle },
              { id: 'about', label: 'About', icon: Sparkles },
              { id: 'pages', label: 'CMS', icon: FileText },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={activeTab === tab.id ? 'bg-cyan-600' : ''}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </Button>
            ))}
          </div>
          
          {/* Config - Admin Only */}
          <div className="flex gap-2 flex-wrap items-center mb-4 pt-2 border-t">
            <span className="text-xs text-gray-500 px-2 py-1 font-bold uppercase bg-slate-200 rounded">⚙️ Config</span>
            {[
              { id: 'agents', label: 'Agents', icon: Users },
              { id: 'members', label: 'Customers', icon: Users },
              { id: 'concierge-experiences', label: 'Concierge XP', icon: Sparkles },
              { id: 'product-tags', label: 'Tags', icon: Tag },
              { id: 'breed-tags', label: 'Breeds', icon: PawPrint },
              { id: 'requests', label: 'Custom Cakes', icon: Cake },
              { id: 'streaties', label: 'Streaties', icon: Heart },
              { id: 'franchise', label: 'Franchise', icon: Building },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                className={activeTab === tab.id ? 'bg-slate-700' : ''}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                data-testid={`admin-tab-${tab.id}`}
              >
                <tab.icon className="w-4 h-4 mr-1" />
                {tab.label}
              </Button>
            ))}
            
            {/* Master Controls */}
            <div className="ml-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs font-bold"
                onClick={seedAllPillars}
                disabled={seedingAll}
                data-testid="universal-seed-btn"
              >
                {seedingAll ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                {seedingAll ? 'Seeding...' : 'Universal Seed'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-700 text-white border-0 text-xs"
                onClick={seedProductionData}
                disabled={seedingProduction}
                data-testid="seed-production-btn"
              >
                {seedingProduction ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Database className="w-3 h-3 mr-1" />}
                Seed Production
              </Button>
            </div>
          </div>
        </div>

        {/* Fulfilment Tab */}
        {activeTab === 'fulfilment' && (
          <FulfilmentManager authHeaders={getAuthHeaders()} />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsManager authHeaders={getAuthHeaders()} />
        )}

        {/* Advanced Analytics Tab */}
        {activeTab === 'analytics' && (
          <AdvancedAnalyticsDashboard authHeaders={getAuthHeaders()} />
        )}

        {/* Site Status Report Tab */}
        {activeTab === 'site-status' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Site Status Report</h2>
                <p className="text-gray-500">Current system health and recent changes</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.open('/admin-docs/site-status-report.md', '_blank')}
              >
                <FileText className="w-4 h-4 mr-2" />
                View Full Report
              </Button>
            </div>
            
            {/* Quick Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">12</p>
                    <p className="text-sm text-green-600">Features Working</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700">5</p>
                    <p className="text-sm text-yellow-600">Pending Features</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700">2</p>
                    <p className="text-sm text-red-600">Blocked (Awaiting Keys)</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Changes */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Last 24 Hours - Work Completed
              </h3>
              <div className="space-y-3">
                {[
                  { status: '✅', text: 'Restaurant Modal Layout Fixed (Desktop & Mobile)', time: '2:00 AM' },
                  { status: '✅', text: 'Fresh Pet Meals Grid - Now single column on mobile', time: '1:45 AM' },
                  { status: '✅', text: 'Mira AI Tabs - Auto-send messages working', time: '1:30 AM' },
                  { status: '✅', text: 'Mira AI Product Cards - Increased size for readability', time: '1:15 AM' },
                  { status: '✅', text: 'Mira Pillar Switch Bug - Travel kit now shows correctly', time: '1:00 AM' },
                  { status: '✅', text: 'Trainer Cards Redesigned - Compact horizontal layout', time: '12:30 AM' },
                  { status: '✅', text: 'Training Bundles - Now clickable with hover states', time: '12:00 AM' },
                  { status: '✅', text: 'Mobile Typography - 16px minimum fonts', time: '11:30 PM' },
                  { status: '✅', text: 'Mobile Audit - 100% pass rate on 9 pages', time: '11:00 PM' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">{item.status}</span>
                    <span className="flex-1 text-sm">{item.text}</span>
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Credentials */}
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-3">Test Credentials</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Member Login</p>
                  <p className="font-mono">dipali@clubconcierge.in / test123</p>
                </div>
                <div>
                  <p className="text-gray-500">Admin Login</p>
                  <p className="font-mono">aditya / lola4304</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Product Tags Tab */}
        {activeTab === 'product-tags' && (
          <ProductTagsManager credentials={{ username, password }} />
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboard && (
          <DashboardTab 
            dashboard={dashboard}
            products={products}
            onSelectChat={setSelectedChat}
            authHeaders={getAuthHeaders()}
          />
        )}

        {/* Live MIS Dashboard */}
        {activeTab === 'mis' && (
          <MISDashboard authHeaders={getAuthHeaders()} />
        )}

        {/* Unified Inbox */}
        {activeTab === 'inbox' && (
          <UnifiedInbox credentials={{ username, password }} />
        )}

        {/* Pillar Queues */}
        {activeTab === 'pillar-queues' && (
          <PillarQueues authHeaders={getAuthHeaders()} />
        )}

        {/* Celebrations Calendar */}
        {activeTab === 'celebrations' && (
          <CelebrationsCalendar />
        )}

        {/* Breed Tags Manager */}
        {activeTab === 'breed-tags' && (
          <BreedTagsManager />
        )}

        {/* Agent Management */}
        {activeTab === 'agents' && (
          <AgentManagement authHeaders={getAuthHeaders()} />
        )}

        {/* Communications Manager */}
        {activeTab === 'communications' && (
          <CommunicationsManager authHeaders={getAuthHeaders()} />
        )}

        {/* Automated Reminders Manager */}
        {activeTab === 'reminders' && (
          <AutomatedRemindersManager authHeaders={getAuthHeaders()} />
        )}

        {/* ConciergeCommandCenter DEPRECATED - Use Service Desk instead */}

        {/* Mira Memory Manager */}
        {activeTab === 'mira-memory' && (
          <MiraMemoryManager />
        )}

        {/* Kit Assembly Manager Tab */}
        {activeTab === 'kit-assembly' && (
          <KitAssemblyManager />
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <OrdersTab 
            orders={orders}
            orderStats={orderStats}
            orderFilter={orderFilter}
            setOrderFilter={setOrderFilter}
            fetchOrders={fetchOrders}
            updateOrderStatus={updateOrderStatus}
            setSelectedOrderDetails={setSelectedOrderDetails}
          />
        )}

        {/* Pet Parent Directory Tab */}
        {activeTab === 'member-directory' && (
          <MemberDirectory />
        )}

        {/* Membership Manager Tab */}
        {activeTab === 'membership' && (
          <MembershipManager />
        )}

        {/* Members/Customers Tab */}
        {activeTab === 'members' && (
          <MembersTab 
            members={members}
            memberStats={memberStats}
            setSelectedMember={setSelectedMember}
            updateMemberTier={updateMemberTier}
          />
        )}

        {/* Chats Tab */}
        {activeTab === 'chats' && (
          <ChatsTab 
            chatbaseChats={chatbaseChats}
            chats={chats}
            expandedChat={expandedChat}
            setExpandedChat={setExpandedChat}
            filterCity={filterCity}
            setFilterCity={setFilterCity}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            syncChatbase={syncChatbase}
            syncingChatbase={syncingChatbase}
            fetchChats={fetchChats}
            setSelectedChat={setSelectedChat}
            sendNotification={sendNotification}
          />
        )}

        {/* Products Tab - Using ProductManager Component */}
        {activeTab === 'products' && (
          <CelebrateManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Unified Product Box Tab */}
        {activeTab === 'product-box' && (
          <UnifiedProductBox />
        )}

        {/* Service Box Tab */}
        {activeTab === 'service-box' && (
          <ServiceBox />
        )}

        {/* Concierge Experiences Admin Tab */}
        {activeTab === 'concierge-experiences' && (
          <ConciergeExperiencesAdmin />
        )}

        {/* Autoship Tab */}
        {activeTab === 'autoship' && (
          <AutoshipManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <CollectionManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <ReviewsManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Content Tab - Videos */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-600" />
                  Homepage Videos
                </h3>
                <Button 
                  className="bg-purple-600"
                  onClick={() => {
                    const newVideo = { id: `v-${Date.now()}`, title: '', thumbnail: '', description: '', videoUrl: '' };
                    setSiteContent(prev => ({
                      ...prev,
                      videos: [...(prev?.videos || []), newVideo]
                    }));
                    setEditingVideo(newVideo);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />Add Video
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {siteContent?.videos?.map((video, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative">
                      {video.thumbnail && (
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingVideo(video)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{video.title}</p>
                      <p className="text-xs text-gray-500 truncate">{video.description}</p>
                    </div>
                  </Card>
                ))}
              </div>

              {siteContent?.videos?.length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button 
                    className="bg-green-600"
                    onClick={() => saveVideos(siteContent.videos)}
                  >
                    <Save className="w-4 h-4 mr-2" />Save All Videos
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Other Site Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Text</label>
                  <Input 
                    value={siteContent?.bannerText || ''}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, bannerText: e.target.value }))}
                    placeholder="Delivery banner text..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <Input 
                    value={siteContent?.whatsappNumber || ''}
                    onChange={(e) => setSiteContent(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                    placeholder="+91 96631 85747"
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Custom Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {customRequests.map((req, idx) => (
              <Card key={idx} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{req.name}</h4>
                    <p className="text-sm text-gray-500">{req.email} • {req.phone}</p>
                    {req.notes && <p className="text-sm text-gray-600 mt-2">{req.notes}</p>}
                  </div>
                  <Badge variant={req.status === 'pending' ? 'default' : 'secondary'}>{req.status}</Badge>
                </div>
                {req.image_path && (
                  <a href={`${API_URL}/${req.image_path}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 text-sm mt-2 inline-block hover:underline">
                    View uploaded image →
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* NPS/Pawmoter Score Tab */}
        {activeTab === 'nps' && (
          <NPSManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Customer Testimonials ({testimonials.length})</h3>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                setEditingTestimonial({ id: `new-${Date.now()}`, name: '', location: '', pet_name: '', rating: 5, text: '', is_featured: false, is_approved: true });
                setShowTestimonialModal(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />Add Testimonial
              </Button>
            </div>
            
            <Card className="p-6">
              <div className="space-y-4">
                {testimonials.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No testimonials yet. Add your first one!</p>
                ) : testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                        <span className="text-sm text-gray-500">• {testimonial.location}</span>
                        {testimonial.pet_name && <Badge variant="outline" className="text-xs">Pet: {testimonial.pet_name}</Badge>}
                        {testimonial.is_featured && <Badge className="bg-yellow-500 text-xs">Featured</Badge>}
                        {!testimonial.is_approved && <Badge variant="destructive" className="text-xs">Pending</Badge>}
                      </div>
                      <div className="flex mb-2">
                        {[...Array(testimonial.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm">{testimonial.text}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingTestimonial(testimonial); setShowTestimonialModal(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteTestimonial(testimonial.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Testimonial Modal */}
            {showTestimonialModal && editingTestimonial && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-white p-6">
                  <h3 className="text-lg font-bold mb-4">{editingTestimonial.id?.startsWith('new-') ? 'Add' : 'Edit'} Testimonial</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Customer Name *</label>
                        <Input value={editingTestimonial.name} onChange={(e) => setEditingTestimonial({...editingTestimonial, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Location</label>
                        <Input value={editingTestimonial.location || ''} onChange={(e) => setEditingTestimonial({...editingTestimonial, location: e.target.value})} placeholder="e.g., Mumbai" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Pet Name</label>
                        <Input value={editingTestimonial.pet_name || ''} onChange={(e) => setEditingTestimonial({...editingTestimonial, pet_name: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Rating</label>
                        <select className="w-full border rounded-md p-2" value={editingTestimonial.rating || 5} onChange={(e) => setEditingTestimonial({...editingTestimonial, rating: parseInt(e.target.value)})}>
                          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Review Text *</label>
                      <textarea className="w-full border rounded-md p-2 h-24" value={editingTestimonial.text || ''} onChange={(e) => setEditingTestimonial({...editingTestimonial, text: e.target.value})} />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editingTestimonial.is_featured || false} onChange={(e) => setEditingTestimonial({...editingTestimonial, is_featured: e.target.checked})} />
                        <span className="text-sm">Featured</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={editingTestimonial.is_approved !== false} onChange={(e) => setEditingTestimonial({...editingTestimonial, is_approved: e.target.checked})} />
                        <span className="text-sm">Approved</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => { setShowTestimonialModal(false); setEditingTestimonial(null); }}>Cancel</Button>
                    <Button className="bg-purple-600" onClick={() => saveTestimonial(editingTestimonial)} disabled={!editingTestimonial.name || !editingTestimonial.text}>Save</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Insights/Blog Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">📝 Insights & Blog ({blogPosts.length})</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    if (confirm('Seed sample blog posts? This will add 6 articles if none exist.')) {
                      try {
                        const response = await fetch(`${API_URL}/api/admin/blog-posts/seed`, {
                          method: 'POST',
                          headers: getAuthHeaders()
                        });
                        const data = await response.json();
                        alert(data.message || 'Seeded!');
                        fetchBlogPosts();
                      } catch (err) {
                        alert('Failed to seed posts');
                      }
                    }
                  }}
                >
                  🌱 Seed Posts
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditingCategory({ id: `new-${Date.now()}`, name: '', description: '', order: blogCategories.length + 1 });
                  setShowCategoryModal(true);
                }}>
                  <Layers className="w-4 h-4 mr-2" />Manage Categories
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                  setEditingPost({ id: `new-${Date.now()}`, title: '', excerpt: '', content: '', category: blogCategories[0]?.name || 'Tips', status: 'draft', is_featured: false });
                  setShowPostModal(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />New Post
                </Button>
              </div>
            </div>
            
            {/* Categories Overview */}
            {blogCategories.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {blogCategories.map(cat => (
                  <Badge 
                    key={cat.id} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-purple-50"
                    onClick={() => {
                      setEditingCategory(cat);
                      setShowCategoryModal(true);
                    }}
                  >
                    {cat.name} ({blogPosts.filter(p => p.category === cat.name).length})
                  </Badge>
                ))}
              </div>
            )}
            
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {blogPosts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 col-span-2">No blog posts yet. Create your first one!</p>
                ) : blogPosts.map((post) => (
                  <Card key={post.id} className="p-4 border hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900 line-clamp-2">{post.title}</h4>
                      <div className="flex gap-1">
                        {post.is_featured && <Badge className="bg-yellow-500 text-xs">Featured</Badge>}
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>{post.status}</Badge>
                      </div>
                    </div>
                    {post.excerpt && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.excerpt}</p>}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.views || 0} views</span>
                      <Badge variant="outline" className="text-xs">{post.category}</Badge>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => { setEditingPost(post); setShowPostModal(true); }}>
                        <Edit className="w-3 h-3 mr-1" />Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteBlogPost(post.id)}>
                        <Trash2 className="w-3 h-3 mr-1" />Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
            
            {/* Blog Post Modal */}
            {showPostModal && editingPost && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <Card className="w-full max-w-2xl bg-white p-6 my-8">
                  <h3 className="text-lg font-bold mb-4">{editingPost.id?.startsWith('new-') ? 'Create' : 'Edit'} Blog Post</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Title *</label>
                      <Input value={editingPost.title} onChange={(e) => setEditingPost({...editingPost, title: e.target.value})} placeholder="Post title" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <select className="w-full border rounded-md p-2" value={editingPost.category || 'Tips'} onChange={(e) => setEditingPost({...editingPost, category: e.target.value})}>
                          {blogCategories.length > 0 ? (
                            blogCategories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))
                          ) : (
                            <>
                              <option value="Tips">Tips</option>
                              <option value="News">News</option>
                              <option value="Recipes">Recipes</option>
                              <option value="Stories">Stories</option>
                              <option value="Health">Health</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <select className="w-full border rounded-md p-2" value={editingPost.status || 'draft'} onChange={(e) => setEditingPost({...editingPost, status: e.target.value})}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Excerpt (Short description)</label>
                      <textarea className="w-full border rounded-md p-2 h-16" value={editingPost.excerpt || ''} onChange={(e) => setEditingPost({...editingPost, excerpt: e.target.value})} placeholder="Brief description for previews..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Content *</label>
                      <textarea className="w-full border rounded-md p-2 h-40" value={editingPost.content || ''} onChange={(e) => setEditingPost({...editingPost, content: e.target.value})} placeholder="Full blog post content..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Image URL</label>
                      <Input value={editingPost.image_url || ''} onChange={(e) => setEditingPost({...editingPost, image_url: e.target.value})} placeholder="https://..." />
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={editingPost.is_featured || false} onChange={(e) => setEditingPost({...editingPost, is_featured: e.target.checked})} />
                      <span className="text-sm">Featured Post</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => { setShowPostModal(false); setEditingPost(null); }}>Cancel</Button>
                    <Button className="bg-purple-600" onClick={() => saveBlogPost(editingPost)} disabled={!editingPost.title || !editingPost.content}>Save</Button>
                  </div>
                </Card>
              </div>
            )}
            
            {/* Category Management Modal */}
            {showCategoryModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-white p-6">
                  <h3 className="text-lg font-bold mb-4">Manage Blog Categories</h3>
                  
                  {/* Existing Categories */}
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {blogCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-xs text-gray-500">{cat.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditingCategory(cat)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          {!cat.is_default && (
                            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteBlogCategory(cat.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add/Edit Category Form */}
                  {editingCategory && (
                    <div className="border-t pt-4 space-y-3">
                      <h4 className="text-sm font-semibold">{editingCategory.id?.startsWith('new-') ? 'Add New' : 'Edit'} Category</h4>
                      <div>
                        <label className="text-sm font-medium">Name *</label>
                        <Input value={editingCategory.name || ''} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} placeholder="Category name" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Input value={editingCategory.description || ''} onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})} placeholder="Brief description" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveBlogCategory(editingCategory)} disabled={!editingCategory.name}>
                          {editingCategory.id?.startsWith('new-') ? 'Add' : 'Save'} Category
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCategory({ id: `new-${Date.now()}`, name: '', description: '', order: blogCategories.length + 1 })}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}>Close</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* FAQs Tab */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Manage FAQs ({faqs.length})</h3>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                setEditingFaq({ id: `new-${Date.now()}`, question: '', answer: '', category: 'General', order: faqs.length, is_featured: false });
                setShowFaqModal(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />Add FAQ
              </Button>
            </div>
            
            {/* Category Summary */}
            {faqCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {faqCategories.map(cat => (
                  <Badge key={cat} variant="outline">{cat} ({faqs.filter(f => f.category === cat).length})</Badge>
                ))}
              </div>
            )}
            
            <Card className="p-6">
              <div className="space-y-4">
                {faqs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No FAQs yet. Add your first one!</p>
                ) : faqs.map((faq) => (
                  <div key={faq.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{faq.category}</Badge>
                          {faq.is_featured && <Badge className="bg-yellow-500 text-xs">Featured</Badge>}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-1">{faq.question}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingFaq(faq); setShowFaqModal(true); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteFaq(faq.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* FAQ Modal */}
            {showFaqModal && editingFaq && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-white p-6">
                  <h3 className="text-lg font-bold mb-4">{editingFaq.id?.startsWith('new-') ? 'Add' : 'Edit'} FAQ</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <select className="w-full border rounded-md p-2" value={editingFaq.category || 'General'} onChange={(e) => setEditingFaq({...editingFaq, category: e.target.value})}>
                        <optgroup label="General">
                          <option value="General">General</option>
                          <option value="Orders & Delivery">Orders & Delivery</option>
                          <option value="Products & Ingredients">Products & Ingredients</option>
                          <option value="Customization">Customization</option>
                          <option value="Payments & Refunds">Payments & Refunds</option>
                        </optgroup>
                        <optgroup label="Pillars">
                          <option value="Celebrate">🎂 Celebrate</option>
                          <option value="Dine">🍽️ Dine</option>
                          <option value="Stay">🏨 Stay</option>
                          <option value="Travel">✈️ Travel</option>
                          <option value="Care">💊 Care</option>
                          <option value="Shop">🛍️ Shop</option>
                        </optgroup>
                        <optgroup label="Features">
                          <option value="Mira AI">Mira AI</option>
                          <option value="Membership">Membership</option>
                          <option value="Autoship">Autoship</option>
                          <option value="Pet Soul">Pet Soul</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Question *</label>
                      <Input value={editingFaq.question || ''} onChange={(e) => setEditingFaq({...editingFaq, question: e.target.value})} placeholder="What is the question?" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Answer *</label>
                      <textarea className="w-full border rounded-md p-2 h-32" value={editingFaq.answer || ''} onChange={(e) => setEditingFaq({...editingFaq, answer: e.target.value})} placeholder="The answer to the question..." />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium">Display Order</label>
                        <Input type="number" value={editingFaq.order || 0} onChange={(e) => setEditingFaq({...editingFaq, order: parseInt(e.target.value) || 0})} />
                      </div>
                      <label className="flex items-center gap-2 mt-6">
                        <input type="checkbox" checked={editingFaq.is_featured || false} onChange={(e) => setEditingFaq({...editingFaq, is_featured: e.target.checked})} />
                        <span className="text-sm">Featured</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => { setShowFaqModal(false); setEditingFaq(null); }}>Cancel</Button>
                    <Button className="bg-purple-600" onClick={() => saveFaq(editingFaq)} disabled={!editingFaq.question || !editingFaq.answer}>Save</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* About Page Manager Tab */}
        {activeTab === 'about' && (
          <AboutManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Page Content CMS Tab */}
        {activeTab === 'pages' && (
          <PageContentManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Dine Tab */}
        {activeTab === 'dine' && (
          <DineManager credentials={{ username, password }} />
        )}

        {/* Stay Tab */}
        {activeTab === 'stay' && (
          <StayManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Travel Tab */}
        {activeTab === 'travel' && (
          <TravelManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Care Tab */}
        {activeTab === 'care' && (
          <CareManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Enjoy Tab */}
        {activeTab === 'enjoy' && (
          <EnjoyManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Fit Tab */}
        {activeTab === 'fit' && (
          <FitManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Learn Tab */}
        {activeTab === 'learn' && (
          <LearnManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Advisory Tab */}
        {activeTab === 'advisory' && (
          <AdvisoryManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Paperwork Tab */}
        {activeTab === 'paperwork' && (
          <PaperworkManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Emergency Tab */}
        {activeTab === 'emergency' && (
          <EmergencyManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Farewell Tab */}
        {activeTab === 'farewell' && (
          <FarewellManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Adopt Tab */}
        {activeTab === 'adopt' && (
          <AdoptManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Shop Tab */}
        {activeTab === 'shop' && (
          <ShopManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Service Desk Tab - Redirect to Full Screen Page */}
        {activeTab === 'servicedesk' && (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
            <div className="text-center space-y-4">
              <div className="p-6 bg-purple-100 rounded-full inline-block">
                <Headphones className="w-16 h-16 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Service Desk</h2>
              <p className="text-gray-500 max-w-md">
                For the best experience, Service Desk opens as a dedicated full-screen workspace 
                with spacious layout and easy navigation.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/admin/service-desk')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                  data-testid="open-service-desk-btn"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Open Service Desk
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/agent')}
                  className="px-8 py-3"
                >
                  <User className="w-5 h-5 mr-2" />
                  Agent Portal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pet Profiles Tab */}
        {activeTab === 'pets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">🐾 Pet Profiles ({petProfiles.length})</h3>
              <Button variant="outline" onClick={fetchPetProfiles}>
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                <p className="text-sm text-gray-500">Total Pets</p>
                <p className="text-2xl font-bold text-purple-600">{petStats.total || petProfiles.length}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
                <p className="text-sm text-gray-500">Upcoming Birthdays</p>
                <p className="text-2xl font-bold text-blue-600">{petStats.upcoming_birthdays || 0}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                <p className="text-sm text-gray-500">With Personas</p>
                <p className="text-2xl font-bold text-green-600">{petStats.with_personas || 0}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50">
                <p className="text-sm text-gray-500">Celebrations Set</p>
                <p className="text-2xl font-bold text-orange-600">{petStats.with_celebrations || 0}</p>
              </Card>
            </div>
            
            <Card className="p-6">
              <div className="space-y-4">
                {petProfiles.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pet profiles yet. Customers can create them via Pet Soul.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Pet</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Pet Pass</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Breed</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600 bg-purple-50">Pet Parent</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Birthday</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Source</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {petProfiles.map((pet) => (
                          <tr 
                            key={pet.id} 
                            className="border-b border-gray-100 hover:bg-purple-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedPetProfile(pet)}
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <img src={getPetPhotoUrl(pet)} alt={pet.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{pet.name}</p>
                                  <p className="text-xs text-gray-500">{pet.gender}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              {pet.pet_pass_number ? (
                                <span className="font-mono text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  {pet.pet_pass_number}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <span className="text-sm text-gray-600">{pet.breed || '-'}</span>
                            </td>
                            <td className="py-3 px-2 bg-purple-50/50">
                              <div>
                                <p className="font-medium text-purple-700">{pet.owner_name || 'Not specified'}</p>
                                <p className="text-xs text-gray-500">{pet.owner_email || ''}</p>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              {pet.birth_date ? (
                                <span className="text-sm text-gray-600">🎂 {new Date(pet.birth_date).toLocaleDateString()}</span>
                              ) : (
                                <span className="text-xs text-gray-400">Not set</span>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              {pet.source === 'shopify_embed' && (
                                <Badge className="bg-green-100 text-green-700 text-xs">Shopify</Badge>
                              )}
                              {pet.source === 'direct' && (
                                <Badge className="bg-blue-100 text-blue-700 text-xs">Direct</Badge>
                              )}
                              {!pet.source && <span className="text-xs text-gray-400">-</span>}
                            </td>
                            <td className="py-3 px-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/pet/${pet.id}`, '_blank');
                                }}
                                className="text-xs"
                              >
                                View Soul
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Loyalty Points Tab */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">⭐ Loyalty Points Program</h3>
              <Button variant="outline" onClick={fetchLoyaltyStats}>
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
            </div>
            
            {loyaltyStats && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50">
                    <p className="text-sm text-gray-500">Points in Circulation</p>
                    <p className="text-2xl font-bold text-yellow-600">{loyaltyStats.total_points_in_circulation?.toLocaleString() || 0}</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                    <p className="text-sm text-gray-500">Total Ever Earned</p>
                    <p className="text-2xl font-bold text-purple-600">{loyaltyStats.total_points_ever_earned?.toLocaleString() || 0}</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50">
                    <p className="text-sm text-gray-500">Potential Liability</p>
                    <p className="text-2xl font-bold text-red-600">₹{loyaltyStats.potential_liability?.toLocaleString() || 0}</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                    <p className="text-sm text-gray-500">Users with Points</p>
                    <p className="text-2xl font-bold text-green-600">{loyaltyStats.users_with_points || 0}</p>
                  </Card>
                </div>

                {/* Config */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Points Configuration</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Earn Rate</p>
                      <p className="font-medium">1 point per ₹10 spent</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Redemption Value</p>
                      <p className="font-medium">1 point = ₹0.50</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Membership Multipliers</p>
                      <p className="font-medium">Free: 1x | Pawsome: 1.5x | Premium: 2x | VIP: 3x</p>
                    </div>
                  </div>
                </Card>

                {/* Top Users */}
                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Top Point Holders</h4>
                  <div className="space-y-3">
                    {(loyaltyStats.top_users || []).slice(0, 10).map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{user.name || user.email}</p>
                            <p className="text-xs text-gray-500">{user.membership_tier || 'free'} member</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{user.loyalty_points?.toLocaleString()} pts</p>
                          <p className="text-xs text-gray-500">Earned: {user.total_points_earned?.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {(!loyaltyStats.top_users || loyaltyStats.top_users.length === 0) && (
                      <p className="text-gray-500 text-center py-4">No users with points yet</p>
                    )}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Engagement Tab - Phase 1 Features */}
        {activeTab === 'engagement' && (
          <AdminEngagement />
        )}

        {/* Discount Codes Tab */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">🎟️ Discount Codes ({discountCodes.length})</h3>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                setEditingDiscount({ 
                  id: `new-${Date.now()}`, 
                  code: '', 
                  type: 'percentage', 
                  value: 10, 
                  min_order: 0,
                  is_active: true 
                });
                setShowDiscountModal(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />Add Code
              </Button>
            </div>
            
            <Card className="p-6">
              <div className="space-y-4">
                {discountCodes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No discount codes yet. Create your first one!</p>
                ) : discountCodes.map((code) => (
                  <div key={code.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-lg font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded">{code.code}</code>
                        <Badge variant={code.is_active ? 'default' : 'secondary'}>
                          {code.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {code.type === 'percentage' ? `${code.value}% off` : `₹${code.value} off`}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{code.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Used {code.times_used || 0} times
                        {code.usage_limit && ` / ${code.usage_limit} limit`}
                        {code.min_order > 0 && ` • Min order: ₹${code.min_order}`}
                        {code.valid_until && (
                          <span className={new Date(code.valid_until) < new Date() ? 'text-red-500' : 'text-green-600'}>
                            {' '}• Expires: {new Date(code.valid_until).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingDiscount(code); setShowDiscountModal(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteDiscountCode(code.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Discount Code Modal */}
            {showDiscountModal && editingDiscount && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-white p-6">
                  <h3 className="text-lg font-bold mb-4">{editingDiscount.id?.startsWith('new-') ? 'Create' : 'Edit'} Discount Code</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Code *</label>
                      <Input value={editingDiscount.code || ''} onChange={(e) => setEditingDiscount({...editingDiscount, code: e.target.value.toUpperCase()})} placeholder="e.g., SAVE20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <select className="w-full border rounded-md p-2" value={editingDiscount.type || 'percentage'} onChange={(e) => setEditingDiscount({...editingDiscount, type: e.target.value})}>
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Value</label>
                        <Input type="number" value={editingDiscount.value || ''} onChange={(e) => setEditingDiscount({...editingDiscount, value: parseFloat(e.target.value) || 0})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Min Order (₹)</label>
                        <Input type="number" value={editingDiscount.min_order || ''} onChange={(e) => setEditingDiscount({...editingDiscount, min_order: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Max Discount (₹)</label>
                        <Input type="number" value={editingDiscount.max_discount || ''} onChange={(e) => setEditingDiscount({...editingDiscount, max_discount: parseFloat(e.target.value) || 0})} placeholder="Optional" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Usage Limit</label>
                      <Input type="number" value={editingDiscount.usage_limit || ''} onChange={(e) => setEditingDiscount({...editingDiscount, usage_limit: parseInt(e.target.value) || null})} placeholder="Leave empty for unlimited" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Valid From</label>
                        <Input type="date" value={editingDiscount.valid_from?.split('T')[0] || ''} onChange={(e) => setEditingDiscount({...editingDiscount, valid_from: e.target.value ? new Date(e.target.value).toISOString() : null})} />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Valid Until (Expiry)</label>
                        <Input type="date" value={editingDiscount.valid_until?.split('T')[0] || ''} onChange={(e) => setEditingDiscount({...editingDiscount, valid_until: e.target.value ? new Date(e.target.value).toISOString() : null})} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input value={editingDiscount.description || ''} onChange={(e) => setEditingDiscount({...editingDiscount, description: e.target.value})} placeholder="e.g., 20% off for new customers" />
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={editingDiscount.is_active !== false} onChange={(e) => setEditingDiscount({...editingDiscount, is_active: e.target.checked})} />
                      <span className="text-sm">Active</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => { setShowDiscountModal(false); setEditingDiscount(null); }}>Cancel</Button>
                    <Button className="bg-purple-600" onClick={() => saveDiscountCode(editingDiscount)} disabled={!editingDiscount.code}>Save</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Abandoned Carts Tab */}
        {activeTab === 'abandoned' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">🛒 Abandoned Carts ({abandonedCarts.length})</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAbandonedCartSettingsModal(true)}>
                  <Settings className="w-4 h-4 mr-2" />Settings
                </Button>
                <Button variant="outline" onClick={fetchAbandonedCarts}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={triggerAbandonedCartCheck}>
                  <Mail className="w-4 h-4 mr-2" />Send Reminders
                </Button>
              </div>
            </div>
            
            {/* Settings Quick View */}
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${abandonedCartSettings.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium">Auto Reminders: {abandonedCartSettings.enabled ? 'Enabled' : 'Disabled'}</span>
                  <span className="text-gray-500">|</span>
                  <span className="text-sm text-gray-600">
                    {abandonedCartSettings.reminders.length} reminder{abandonedCartSettings.reminders.length !== 1 ? 's' : ''} configured
                    ({abandonedCartSettings.reminders.map(r => `${r.delay_hours}h`).join(', ')})
                  </span>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowAbandonedCartSettingsModal(true)}>
                  Configure
                </Button>
              </div>
            </Card>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50">
                <p className="text-sm text-gray-500">Active Carts</p>
                <p className="text-2xl font-bold text-orange-600">{abandonedStats.active || 0}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                <p className="text-sm text-gray-500">Recovered</p>
                <p className="text-2xl font-bold text-green-600">{abandonedStats.converted || 0}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                <p className="text-sm text-gray-500">Potential Revenue</p>
                <p className="text-2xl font-bold text-purple-600">₹{abandonedStats.potential_revenue?.toLocaleString() || 0}</p>
              </Card>
            </div>
            
            <Card className="p-6">
              {/* Selection header */}
              {abandonedCarts.filter(c => c.email).length > 0 && (
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedAbandonedCarts.length === abandonedCarts.filter(c => c.email).length && abandonedCarts.filter(c => c.email).length > 0}
                      onChange={toggleSelectAllCarts}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">Select All ({abandonedCarts.filter(c => c.email).length} with email)</span>
                  </label>
                  {selectedAbandonedCarts.length > 0 && (
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={sendRemindersToSelected}>
                      <Mail className="w-4 h-4 mr-2" />
                      Send to {selectedAbandonedCarts.length} Selected
                    </Button>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                {abandonedCarts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No abandoned carts yet</p>
                ) : abandonedCarts.map((cart) => (
                  <div key={cart.id} className={`p-4 rounded-lg border-2 transition-all ${selectedAbandonedCarts.includes(cart.id) ? 'border-purple-500 bg-purple-50' : 'border-transparent bg-gray-50'}`}>
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      {cart.email && (
                        <input 
                          type="checkbox" 
                          checked={selectedAbandonedCarts.includes(cart.id)}
                          onChange={() => toggleCartSelection(cart.id)}
                          className="mt-1 w-4 h-4 rounded border-gray-300"
                        />
                      )}
                      
                      {/* Cart Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{cart.email || <span className="text-gray-400 italic">No email</span>}</p>
                            <p className="text-sm text-gray-500">{cart.name || 'Guest'}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={cart.status === 'converted' ? 'success' : cart.status === 'active' ? 'warning' : 'secondary'}>
                              {cart.status}
                            </Badge>
                            <p className="text-lg font-bold text-purple-600 mt-1">₹{cart.subtotal?.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>{cart.items?.length || 0} items • Updated: {new Date(cart.updated_at).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Reminders sent: {cart.reminders_sent || 0}</p>
                        </div>
                        {cart.items && cart.items.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            Items: {cart.items.map(i => i.name).join(', ')}
                          </div>
                        )}
                      </div>
                      
                      {/* Individual Send Button */}
                      {cart.email && cart.status !== 'converted' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => sendReminderToCart(cart.id, cart.email)}
                          disabled={sendingReminder === cart.id}
                          className="flex-shrink-0"
                        >
                          {sendingReminder === cart.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-1" />
                              Send
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Streaties Tab */}
        {activeTab === 'streaties' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">🧡 Streaties Program</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchStreatiesStats}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
                <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowDonationModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />Log Donation
                </Button>
              </div>
            </div>
            
            {streatiesStats && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50">
                    <p className="text-sm text-gray-500">Strays Fed Monthly</p>
                    <p className="text-2xl font-bold text-orange-600">{streatiesStats.strays_fed_monthly?.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-r from-pink-50 to-rose-50">
                    <p className="text-sm text-gray-500">NGO Partners</p>
                    <p className="text-2xl font-bold text-pink-600">{streatiesStats.ngo_partners}</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-r from-purple-50 to-violet-50">
                    <p className="text-sm text-gray-500">Cities Covered</p>
                    <p className="text-2xl font-bold text-purple-600">{streatiesStats.cities_covered}</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                    <p className="text-sm text-gray-500">Total Donated</p>
                    <p className="text-2xl font-bold text-green-600">₹{streatiesStats.total_donated?.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
                    <p className="text-sm text-gray-500">Donation %</p>
                    <p className="text-2xl font-bold text-blue-600">{streatiesStats.donation_percentage}%</p>
                  </Card>
                </div>

                {/* Recent Donations */}
                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Recent Donations</h4>
                  {streatiesStats.recent_donations?.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No donations logged yet</p>
                  ) : (
                    <div className="space-y-3">
                      {streatiesStats.recent_donations?.map((donation, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{donation.ngo_name}</p>
                            <p className="text-sm text-gray-500">{donation.city} • {donation.animals_fed} animals fed</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">₹{donation.amount?.toLocaleString()}</p>
                            <p className="text-xs text-gray-400">{new Date(donation.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* Donation Modal */}
            {showDonationModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-white p-6">
                  <h3 className="text-lg font-bold mb-4">Log New Donation</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">NGO/Organization Name</label>
                      <Input value={newDonation.ngo_name} onChange={(e) => setNewDonation({...newDonation, ngo_name: e.target.value})} placeholder="e.g., CUPA, Blue Cross" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">City</label>
                        <Input value={newDonation.city} onChange={(e) => setNewDonation({...newDonation, city: e.target.value})} placeholder="e.g., Bangalore" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Amount (₹)</label>
                        <Input type="number" value={newDonation.amount} onChange={(e) => setNewDonation({...newDonation, amount: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Animals Fed</label>
                      <Input type="number" value={newDonation.animals_fed} onChange={(e) => setNewDonation({...newDonation, animals_fed: parseInt(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input value={newDonation.description} onChange={(e) => setNewDonation({...newDonation, description: e.target.value})} placeholder="Monthly feeding drive..." />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowDonationModal(false)}>Cancel</Button>
                    <Button className="bg-orange-600" onClick={addStreatiesDonation} disabled={!newDonation.ngo_name}>Save Donation</Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Franchise Tab */}
        {activeTab === 'franchise' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">🏪 Franchise Inquiries</h3>
              <Button variant="outline" onClick={fetchFranchiseInquiries}>
                <RefreshCw className="w-4 h-4 mr-2" />Refresh
              </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-violet-50">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-purple-600">{franchiseStats.total || 0}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
                <p className="text-sm text-gray-500">New</p>
                <p className="text-2xl font-bold text-blue-600">{franchiseStats.new || 0}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50">
                <p className="text-sm text-gray-500">Contacted</p>
                <p className="text-2xl font-bold text-yellow-600">{franchiseStats.contacted || 0}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50">
                <p className="text-sm text-gray-500">In Discussion</p>
                <p className="text-2xl font-bold text-orange-600">{franchiseStats.in_discussion || 0}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                <p className="text-sm text-gray-500">Converted</p>
                <p className="text-2xl font-bold text-green-600">{franchiseStats.converted || 0}</p>
              </Card>
            </div>
            
            <Card className="p-6">
              <div className="space-y-4">
                {franchiseInquiries.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No franchise inquiries yet</p>
                ) : franchiseInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-gray-900">{inquiry.name}</h4>
                        <Badge variant={
                          inquiry.status === 'new' ? 'default' : 
                          inquiry.status === 'contacted' ? 'secondary' : 
                          inquiry.status === 'in_discussion' ? 'outline' :
                          inquiry.status === 'converted' ? 'success' : 'destructive'
                        }>
                          {inquiry.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {inquiry.city} • {inquiry.investment || 'Not specified'} • {new Date(inquiry.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{inquiry.email} • {inquiry.phone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedInquiry(inquiry); setShowInquiryModal(true); }}>
                        <Eye className="w-3 h-3 mr-1" />View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteFranchiseInquiry(inquiry.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Inquiry Detail Modal */}
            {showInquiryModal && selectedInquiry && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-lg bg-white p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Franchise Inquiry</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowInquiryModal(false)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{selectedInquiry.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">City</p>
                        <p className="font-medium">{selectedInquiry.city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedInquiry.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{selectedInquiry.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Investment</p>
                        <p className="font-medium">{selectedInquiry.investment || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{new Date(selectedInquiry.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {selectedInquiry.message && (
                      <div>
                        <p className="text-sm text-gray-500">Message</p>
                        <p className="font-medium bg-gray-50 p-3 rounded-lg">{selectedInquiry.message}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Status</p>
                      <select 
                        className="w-full border rounded-md p-2" 
                        value={selectedInquiry.status}
                        onChange={(e) => setSelectedInquiry({...selectedInquiry, status: e.target.value})}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="in_discussion">In Discussion</option>
                        <option value="converted">Converted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Notes</p>
                      <textarea 
                        className="w-full border rounded-md p-2" 
                        rows={3}
                        value={selectedInquiry.notes || ''}
                        onChange={(e) => setSelectedInquiry({...selectedInquiry, notes: e.target.value})}
                        placeholder="Add internal notes..."
                      />
                    </div>

                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => setShowInquiryModal(false)}>Cancel</Button>
                    <Button className="bg-purple-600" onClick={() => updateFranchiseInquiry(selectedInquiry.id, { status: selectedInquiry.status, notes: selectedInquiry.notes })}>
                      Save Changes
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Pillars & Categories Tab */}
        {activeTab === 'pillars' && (
          <PillarCategoryManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Campaign Collections Tab */}
        {activeTab === 'campaigns' && (
          <EnhancedCollectionManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Occasion Boxes Tab */}
        {activeTab === 'occasion-boxes' && (
          <OccasionBoxManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Proactive Notifications Tab */}
        {activeTab === 'proactive' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-rose-600" />
                  Proactive Notifications
                </h2>
                <p className="text-gray-600">Automatic reminders for vaccinations, birthdays, and ticket updates</p>
              </div>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_URL}/api/notifications/check`, {
                      method: 'POST',
                      headers: getAuthHeaders()
                    });
                    const data = await response.json();
                    toast({
                      title: '✅ Notification Check Complete',
                      description: `Sent: ${data.total_sent}, Failed: ${data.total_failed}`
                    });
                  } catch (error) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700"
              >
                <Bell className="w-4 h-4 mr-2" />
                Run Check Now
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    💉
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Vaccination Reminders</h3>
                    <p className="text-sm text-blue-600">7 days before due date</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-pink-50 border-pink-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    🎂
                  </div>
                  <div>
                    <h3 className="font-semibold text-pink-900">Birthday Reminders</h3>
                    <p className="text-sm text-pink-600">7 days before birthday</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    📋
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">Ticket Updates</h3>
                    <p className="text-sm text-purple-600">Status change notifications</p>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>System checks for upcoming vaccinations, birthdays, and ticket changes</li>
                <li>Matching users are sent push notifications (if subscribed)</li>
                <li>Notifications are logged to prevent duplicates</li>
                <li>Run manually or set up a scheduled job (recommended: every hour)</li>
              </ol>
            </div>
          </Card>
        )}

        {/* Partner Management Tab */}
        {activeTab === 'partners' && (
          <PartnerManager getAuthHeader={getAuthHeaders} />
        )}

        {/* Pricing Hub Tab */}
        {activeTab === 'pricing' && (
          <PricingHub getAuthHeader={getAuthHeaders} />
        )}

        {/* Data Migration Tab */}
        {activeTab === 'migration' && (
          <DataMigration adminAuth={btoa(`${username}:${password}`)} />
        )}
      </div>

      {/* Pet Profile Detail Modal */}
      {selectedPetProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                  <img src={getPetPhotoUrl(selectedPetProfile)} alt={selectedPetProfile.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPetProfile.name}</h2>
                  <p className="text-gray-600">{selectedPetProfile.breed} • {selectedPetProfile.species} • {selectedPetProfile.gender}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedPetProfile.soul?.persona && <Badge className="bg-purple-600">{selectedPetProfile.soul.persona}</Badge>}
                    <Badge variant="outline">Age: {selectedPetProfile.age_years || '?'}y {selectedPetProfile.age_months || '?'}m</Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => window.open(`/pet/${selectedPetProfile.id}`, '_blank')}
                    >
                      <Sparkles className="w-4 h-4 mr-1" /> View Full Soul
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedPetForHealth(selectedPetProfile);
                        setShowHealthVaultModal(true);
                      }}
                    >
                      <Heart className="w-4 h-4 mr-1" /> Health Vault
                    </Button>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPetProfile(null)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Soul Section */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" /> Soul & Personality
                </h3>
                <div className="grid md:grid-cols-2 gap-4 bg-purple-50 p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-purple-600 font-semibold uppercase">Special Move</p>
                    <p className="font-medium">{selectedPetProfile.soul?.special_move || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-semibold uppercase">Human Job</p>
                    <p className="font-medium">{selectedPetProfile.soul?.human_job || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-semibold uppercase">Security Blanket</p>
                    <p className="font-medium">{selectedPetProfile.soul?.security_blanket || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-semibold uppercase">Love Language</p>
                    <p className="font-medium">{selectedPetProfile.soul?.love_language || 'Not set'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-purple-600 font-semibold uppercase">Personality Tag</p>
                    <p className="font-medium text-lg">"{selectedPetProfile.soul?.personality_tag || 'Good Dog'}"</p>
                  </div>
                </div>
              </section>

              {/* Preferences Section */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" /> Preferences
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Favorite Flavors</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedPetProfile.preferences?.favorite_flavors?.map(f => (
                          <Badge key={f} variant="secondary" className="bg-orange-100 text-orange-800">{f}</Badge>
                        )) || <span className="text-gray-400 italic">None selected</span>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Allergies</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Array.isArray(selectedPetProfile.preferences?.allergies) 
                          ? selectedPetProfile.preferences.allergies.map(a => <Badge key={a} variant="destructive" className="bg-red-100 text-red-800 border-red-200">{a}</Badge>)
                          : <span className="text-gray-700">{selectedPetProfile.preferences?.allergies || 'None'}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Texture</p>
                        <p className="font-medium capitalize">{selectedPetProfile.preferences?.texture_preference || 'Any'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Treat Size</p>
                        <p className="font-medium capitalize">{selectedPetProfile.preferences?.treat_size || 'Any'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Activity</p>
                        <p className="font-medium capitalize">{selectedPetProfile.preferences?.activity_level || 'Unknown'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Flavor Profile</p>
                        <p className="font-medium capitalize">{selectedPetProfile.preferences?.flavor_profile || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Celebrations Section */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" /> Celebrations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedPetProfile.celebrations?.map((cel, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-green-50 transition-colors">
                      <div>
                        <p className="font-medium capitalize">{cel.custom_name || cel.occasion?.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">{cel.date}</p>
                      </div>
                      {cel.is_recurring && <Badge variant="outline" className="text-xs">Yearly</Badge>}
                    </div>
                  )) || <p className="text-gray-500 italic">No celebrations added</p>}
                </div>
              </section>

              {/* Owner Section */}
              <section className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Parent Details
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedPetProfile.owner_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedPetProfile.owner_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedPetProfile.owner_phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <Badge variant={selectedPetProfile.whatsapp_reminders ? 'success' : 'secondary'}>
                    WhatsApp: {selectedPetProfile.whatsapp_reminders ? 'On' : 'Off'}
                  </Badge>
                  <Badge variant={selectedPetProfile.email_reminders ? 'success' : 'secondary'}>
                    Email: {selectedPetProfile.email_reminders ? 'On' : 'Off'}
                  </Badge>
                </div>
              </section>
            </div>
          </Card>
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600">
                  {selectedMember.name?.charAt(0) || selectedMember.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMember.name || 'Member'}</h2>
                  <p className="text-gray-500">{selectedMember.email}</p>
                  <Badge className="mt-1" variant={
                    selectedMember.membership_tier === 'vip' ? 'warning' :
                    selectedMember.membership_tier === 'premium' ? 'default' :
                    selectedMember.membership_tier === 'pawsome' ? 'secondary' : 'outline'
                  }>
                    {selectedMember.membership_tier.toUpperCase()} Member
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Joined</p>
                  <p className="font-medium">{new Date(selectedMember.created_at).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Phone</p>
                  <p className="font-medium">{selectedMember.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Total Spend</p>
                  <p className="font-medium text-green-600 font-bold">
                    ₹{memberDetails.orders.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Last Active</p>
                  <p className="font-medium">{selectedMember.last_chat_date || 'N/A'}</p>
                </div>
              </div>

              {selectedMember.membership_expires && (
                <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Membership expires on <strong>{new Date(selectedMember.membership_expires).toLocaleDateString()}</strong>
                  </p>
                </div>
              )}

              {/* Pets Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-purple-600" /> Pets ({memberDetails.pets.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {memberDetails.pets.map(pet => (
                    <div key={pet.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border">
                        <img src={getPetPhotoUrl(pet)} alt={pet.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{pet.name}</p>
                        <p className="text-xs text-gray-500">{pet.breed} • {pet.gender}</p>
                      </div>
                    </div>
                  ))}
                  {memberDetails.pets.length === 0 && <p className="text-sm text-gray-500 italic">No pets registered.</p>}
                </div>
              </div>

              {/* Order History Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Order History ({memberDetails.orders.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {memberDetails.orders.map(order => (
                    <div key={order.orderId} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrderDetails(order)}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{order.orderId}</p>
                          <Badge variant="outline" className="text-xs">{order.status}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()} • {order.items.length} items</p>
                      </div>
                      <p className="font-bold text-sm">₹{order.total}</p>
                    </div>
                  ))}
                  {memberDetails.orders.length === 0 && <p className="text-sm text-gray-500 italic">No orders found.</p>}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-2">Actions</h4>
                <div className="flex gap-2">
                  <select 
                    className="border rounded px-3 py-2 text-sm"
                    value={selectedMember.membership_tier}
                    onChange={(e) => updateMemberTier(selectedMember.id, e.target.value)}
                  >
                    <option value="guest">Guest</option>
                    <option value="free">Free</option>
                    <option value="pawsome">Pawsome</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                  <Button variant="outline" size="sm">Reset Chat Limit</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Order #{selectedOrderDetails.orderId}</h3>
                <p className="text-sm text-gray-500">{new Date(selectedOrderDetails.created_at).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrderDetails(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Bar */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <Badge className="text-lg" variant={
                    selectedOrderDetails.status === 'delivered' ? 'success' : 'default'
                  }>{selectedOrderDetails.status?.toUpperCase()}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-purple-600">₹{selectedOrderDetails.total}</p>
                </div>
              </div>

              {/* Customer & Delivery */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold border-b pb-2 mb-2">Customer</h4>
                  <p className="font-medium">{selectedOrderDetails.customer?.parentName}</p>
                  <p className="text-sm text-gray-600">{selectedOrderDetails.customer?.email}</p>
                  <p className="text-sm text-gray-600">{selectedOrderDetails.customer?.phone}</p>
                </div>
                <div>
                  <h4 className="font-semibold border-b pb-2 mb-2">Delivery</h4>
                  <p className="font-medium">{selectedOrderDetails.delivery?.name}</p>
                  <p className="text-sm text-gray-600">{selectedOrderDetails.delivery?.address}</p>
                  <p className="text-sm text-gray-600">{selectedOrderDetails.delivery?.city}, {selectedOrderDetails.delivery?.pincode}</p>
                </div>
              </div>

              {/* Reference Images Section (Order Level) */}
              {selectedOrderDetails.reference_images && selectedOrderDetails.reference_images.length > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
                  <h4 className="font-bold text-purple-800 text-sm mb-3 flex items-center gap-2">
                    📷 REFERENCE IMAGES FOR KITCHEN ({selectedOrderDetails.reference_images.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedOrderDetails.reference_images.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img 
                          src={img.url} 
                          alt={`Reference ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-purple-400 cursor-pointer hover:opacity-80"
                          onClick={() => window.open(img.url, '_blank')}
                        />
                        <p className="text-xs text-purple-700 mt-1 truncate">{img.item_name}</p>
                        {img.pet_name && <p className="text-xs text-gray-500">Pet: {img.pet_name}</p>}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600 mt-2 italic">⚠️ Click image to view full size. Kitchen must follow these designs.</p>
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="font-semibold border-b pb-2 mb-2">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                      {/* Reference Image with prominent display */}
                      {(item.customDetails?.referenceImage || item.reference_image) && (
                        <div className="relative">
                          <img 
                            src={item.customDetails?.referenceImage || item.reference_image} 
                            className="w-20 h-20 object-cover rounded-lg border-2 border-purple-500 cursor-pointer hover:opacity-80" 
                            alt="Reference"
                            onClick={() => window.open(item.customDetails?.referenceImage || item.reference_image, '_blank')}
                          />
                          <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">📷</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">{item.name}</p>
                          <p className="font-bold">₹{item.price * item.quantity}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} 
                          {item.selectedSize && ` • ${item.selectedSize}`}
                          {item.selectedFlavor && ` • ${item.selectedFlavor}`}
                        </p>
                        {item.customDetails && (
                          <div className="mt-2 text-xs bg-white p-2 rounded border">
                            {item.customDetails.petName && <p><strong>Pet Name (ON CAKE):</strong> {item.customDetails.petName}</p>}
                            {item.customDetails.customText && <p><strong>Custom Text:</strong> {item.customDetails.customText}</p>}
                            {item.customDetails.shape && <p><strong>Shape:</strong> {item.customDetails.shape}</p>}
                            {item.customDetails.flavor && <p><strong>Flavor:</strong> {item.customDetails.flavor}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrderDetails.specialInstructions && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <h4 className="font-semibold text-yellow-800 text-sm mb-1">Special Instructions</h4>
                  <p className="text-sm text-yellow-900">{selectedOrderDetails.specialInstructions}</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedOrderDetails(null)}>Close</Button>
              <Button onClick={() => window.print()}>Print Order</Button>
            </div>
          </Card>
        </div>
      )}
      {/* Chat Detail Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-purple-50">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedChat.pet_name || 'Chat Details'}</h3>
                <p className="text-sm text-gray-500">{selectedChat.city} • {selectedChat.service_type}</p>
                <p className="text-xs text-gray-400">{new Date(selectedChat.updated_at || selectedChat.created_at).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)}><X className="w-5 h-5" /></Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh] space-y-4">
              {selectedChat.messages?.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-gray-100 ml-8' : 'bg-purple-50 mr-8'}`}>
                  <p className="text-xs font-medium text-gray-500 mb-1">{msg.role === 'user' ? 'Customer' : 'Mira'}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => updateChatStatus(selectedChat.session_id, 'completed')}>
                  <CheckCircle className="w-4 h-4 mr-2" />Mark Complete
                </Button>
                <Button variant="outline" onClick={() => sendNotification(selectedChat.session_id)}>
                  <Send className="w-4 h-4 mr-2" />Notify
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setSelectedChat(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center bg-purple-50">
              <h3 className="font-semibold text-gray-900">
                {editingProduct.id?.startsWith('new-') ? 'Add Product' : 'Edit Product'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingProduct(null)}><X className="w-5 h-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <Input 
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <Input 
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    placeholder="cakes, treats, etc."
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
                  <Input 
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                  <Input 
                    type="number"
                    value={editingProduct.originalPrice || editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <Input 
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Options (e.g., Base, Flavour, Weight)
                </label>
                <div className="space-y-3 mb-3">
                  {(editingProduct.options || []).map((option, idx) => (
                    <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={option.name || ''}
                          onChange={(e) => {
                            const newOptions = [...(editingProduct.options || [])];
                            newOptions[idx] = { ...newOptions[idx], name: e.target.value };
                            setEditingProduct({ ...editingProduct, options: newOptions });
                          }}
                          placeholder="Option name (e.g., Base, Flavour, Weight)"
                          className="flex-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const newOptions = (editingProduct.options || []).filter((_, i) => i !== idx);
                            setEditingProduct({ ...editingProduct, options: newOptions });
                          }}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <Input
                        value={(option.values || []).join(', ')}
                        onChange={(e) => {
                          const newOptions = [...(editingProduct.options || [])];
                          newOptions[idx] = { 
                            ...newOptions[idx], 
                            values: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                          };
                          setEditingProduct({ ...editingProduct, options: newOptions });
                        }}
                        placeholder="Values (comma-separated): Oats, Ragi"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(editingProduct.options || []), { name: '', values: [], position: (editingProduct.options || []).length + 1 }];
                    setEditingProduct({ ...editingProduct, options: newOptions });
                  }}
                >
                  + Add Option (Base/Flavour/Weight)
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Common options: Base (Oats, Ragi), Flavour (Chicken, Banana, etc.), Weight (500g, 1kg)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variants (auto-generated from options, or edit JSON)
                </label>
                <textarea 
                  value={JSON.stringify(editingProduct.variants || [], null, 2)}
                  onChange={(e) => {
                    try {
                      setEditingProduct({ ...editingProduct, variants: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                  className="w-full border rounded-lg p-3 text-sm font-mono"
                  rows={6}
                  placeholder='[{"title": "Oats / Chicken / 500g", "price": 650, "option1": "Oats", "option2": "Chicken", "option3": "500g"}]'
                />
                <p className="text-xs text-gray-500 mt-1">
                  Each variant should have: title, price, option1, option2, option3 (matching your options above)
                </p>
              </div>

              {/* Legacy fields - hidden but kept for backward compatibility */}
              <details className="text-sm">
                <summary className="text-gray-500 cursor-pointer">Legacy Size/Flavor fields (deprecated)</summary>
                <div className="mt-2 space-y-3 opacity-60">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sizes (JSON)</label>
                    <textarea 
                      value={JSON.stringify(editingProduct.sizes || [], null, 2)}
                      onChange={(e) => {
                        try {
                          setEditingProduct({ ...editingProduct, sizes: JSON.parse(e.target.value) });
                        } catch {}
                      }}
                      className="w-full border rounded-lg p-2 text-xs font-mono"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Flavors (JSON)</label>
                    <textarea 
                      value={JSON.stringify(editingProduct.flavors || [], null, 2)}
                      onChange={(e) => {
                        try {
                          setEditingProduct({ ...editingProduct, flavors: JSON.parse(e.target.value) });
                        } catch {}
                      }}
                      className="w-full border rounded-lg p-2 text-xs font-mono"
                      rows={2}
                    />
                  </div>
                </div>
              </details>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingProduct(null)}>Cancel</Button>
              <Button className="bg-purple-600" onClick={() => saveProduct(editingProduct)}>
                <Save className="w-4 h-4 mr-2" />Save Product
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Video Edit Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center bg-purple-50">
              <h3 className="font-semibold text-gray-900">Edit Video</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditingVideo(null)}><X className="w-5 h-5" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <Input 
                  value={editingVideo.title}
                  onChange={(e) => {
                    const updated = { ...editingVideo, title: e.target.value };
                    setEditingVideo(updated);
                    setSiteContent(prev => ({
                      ...prev,
                      videos: prev.videos.map(v => v.id === updated.id ? updated : v)
                    }));
                  }}
                  placeholder="Video title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <Input 
                  value={editingVideo.thumbnail}
                  onChange={(e) => {
                    const updated = { ...editingVideo, thumbnail: e.target.value };
                    setEditingVideo(updated);
                    setSiteContent(prev => ({
                      ...prev,
                      videos: prev.videos.map(v => v.id === updated.id ? updated : v)
                    }));
                  }}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input 
                  value={editingVideo.description}
                  onChange={(e) => {
                    const updated = { ...editingVideo, description: e.target.value };
                    setEditingVideo(updated);
                    setSiteContent(prev => ({
                      ...prev,
                      videos: prev.videos.map(v => v.id === updated.id ? updated : v)
                    }));
                  }}
                  placeholder="Short description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (Instagram/YouTube)</label>
                <Input 
                  value={editingVideo.videoUrl}
                  onChange={(e) => {
                    const updated = { ...editingVideo, videoUrl: e.target.value };
                    setEditingVideo(updated);
                    setSiteContent(prev => ({
                      ...prev,
                      videos: prev.videos.map(v => v.id === updated.id ? updated : v)
                    }));
                  }}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingVideo(null)}>Done</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Abandoned Cart Settings Modal */}
      {showAbandonedCartSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">🛒 Abandoned Cart Settings</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAbandonedCartSettingsModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Auto Send Reminders</p>
                  <p className="text-sm text-gray-500">Automatically send recovery emails to abandoned carts</p>
                </div>
                <Switch 
                  checked={abandonedCartSettings.enabled}
                  onCheckedChange={(checked) => setAbandonedCartSettings({...abandonedCartSettings, enabled: checked})}
                />
              </div>
              
              {/* Reminder Configuration */}
              <div>
                <h4 className="font-medium mb-3">Email Sequence</h4>
                <div className="space-y-4">
                  {abandonedCartSettings.reminders.map((reminder, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-purple-100 text-purple-700">Reminder {reminder.reminder_num}</Badge>
                        {reminder.include_discount && (
                          <Badge className="bg-green-100 text-green-700">🎁 Includes Discount</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Send After (hours)</Label>
                          <Input
                            type="number"
                            value={reminder.delay_hours}
                            onChange={(e) => updateReminderSetting(index, 'delay_hours', parseInt(e.target.value) || 1)}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label>Subject Line</Label>
                          <Input
                            value={reminder.subject}
                            onChange={(e) => updateReminderSetting(index, 'subject', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={reminder.include_discount}
                            onChange={(e) => updateReminderSetting(index, 'include_discount', e.target.checked)}
                          />
                          <span className="text-sm">Include Discount</span>
                        </label>
                        
                        {reminder.include_discount && (
                          <>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Code:</Label>
                              <Input
                                className="w-32"
                                value={reminder.discount_code || ''}
                                onChange={(e) => updateReminderSetting(index, 'discount_code', e.target.value)}
                                placeholder="COMEBACK10"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">%:</Label>
                              <Input
                                type="number"
                                className="w-20"
                                value={reminder.discount_percent || 10}
                                onChange={(e) => updateReminderSetting(index, 'discount_percent', parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={saveAbandonedCartSettings}>
                  Save Settings
                </Button>
                <Button variant="outline" onClick={() => setShowAbandonedCartSettingsModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" /> Change Admin Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {passwordError}
              </div>
            )}
            <div>
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  placeholder="Enter new password (min 6 chars)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordModal(false);
              setPasswordData({ current: '', new: '', confirm: '' });
              setPasswordError('');
              setShowPasswords({ current: false, new: false, confirm: false });
            }}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={passwordChanging}>
              {passwordChanging ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Health Vault Modal */}
      {showHealthVaultModal && selectedPetForHealth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-red-50 to-pink-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                  <img src={getPetPhotoUrl(selectedPetForHealth)} alt={selectedPetForHealth.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" /> {selectedPetForHealth.name}'s Health Vault
                  </h2>
                  <p className="text-sm text-gray-500">{selectedPetForHealth.breed} • {selectedPetForHealth.species}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowHealthVaultModal(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 p-3 border-b bg-gray-50">
              {[
                { id: 'vaccines', label: 'Vaccines', icon: Syringe, count: healthVaultData.vaccines.length },
                { id: 'medications', label: 'Medications', icon: Pill, count: healthVaultData.medications.length },
                { id: 'visits', label: 'Vet Visits', icon: Stethoscope, count: healthVaultData.vet_visits.length },
                { id: 'weight', label: 'Weight', icon: Scale, count: healthVaultData.weight_history.length },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={healthTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  className={healthTab === tab.id ? 'bg-red-500 hover:bg-red-600' : ''}
                  onClick={() => setHealthTab(tab.id)}
                >
                  <tab.icon className="w-4 h-4 mr-1" />
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge className={`ml-1 ${healthTab === tab.id ? 'bg-white text-red-600' : 'bg-red-100 text-red-700'}`}>
                      {tab.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingHealth ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
                </div>
              ) : (
                <>
                  {/* Vaccines Tab */}
                  {healthTab === 'vaccines' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Vaccination Records</h3>
                        <Button size="sm" onClick={() => setShowAddVaccineModal(true)} className="bg-red-500 hover:bg-red-600">
                          <Plus className="w-4 h-4 mr-1" /> Add Vaccine
                        </Button>
                      </div>
                      {healthVaultData.vaccines.length === 0 ? (
                        <Card className="p-8 text-center">
                          <Syringe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No vaccination records yet</p>
                          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddVaccineModal(true)}>
                            Add First Vaccine
                          </Button>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {healthVaultData.vaccines.map((vaccine, idx) => (
                            <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Syringe className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{vaccine.vaccine_name}</p>
                                    <p className="text-sm text-gray-500">
                                      Given: {new Date(vaccine.date_given).toLocaleDateString()}
                                      {vaccine.vet_name && ` • Dr. ${vaccine.vet_name}`}
                                    </p>
                                    {vaccine.notes && <p className="text-sm text-gray-400 mt-1">{vaccine.notes}</p>}
                                  </div>
                                </div>
                                {vaccine.next_due_date && (
                                  <Badge className={new Date(vaccine.next_due_date) < new Date() ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                                    Due: {new Date(vaccine.next_due_date).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Medications Tab */}
                  {healthTab === 'medications' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Active & Past Medications</h3>
                        <Button size="sm" onClick={() => setShowAddMedicationModal(true)} className="bg-red-500 hover:bg-red-600">
                          <Plus className="w-4 h-4 mr-1" /> Add Medication
                        </Button>
                      </div>
                      {healthVaultData.medications.length === 0 ? (
                        <Card className="p-8 text-center">
                          <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No medication records yet</p>
                          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddMedicationModal(true)}>
                            Add First Medication
                          </Button>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {healthVaultData.medications.map((med, idx) => (
                            <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Pill className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{med.medication_name}</p>
                                    <p className="text-sm text-gray-500">
                                      {med.dosage} • {med.frequency}
                                    </p>
                                    {med.reason && <p className="text-sm text-gray-400 mt-1">For: {med.reason}</p>}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge className={!med.end_date || new Date(med.end_date) > new Date() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                                    {!med.end_date || new Date(med.end_date) > new Date() ? 'Active' : 'Completed'}
                                  </Badge>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Started: {new Date(med.start_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Vet Visits Tab */}
                  {healthTab === 'visits' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Vet Visit History</h3>
                      </div>
                      {healthVaultData.vet_visits.length === 0 ? (
                        <Card className="p-8 text-center">
                          <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No vet visits recorded yet</p>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {healthVaultData.vet_visits.map((visit, idx) => (
                            <Card key={idx} className="p-4">
                              <div className="flex gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Stethoscope className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-semibold text-gray-900">{visit.reason}</p>
                                      <p className="text-sm text-gray-500">Dr. {visit.vet_name} {visit.clinic_name && `• ${visit.clinic_name}`}</p>
                                    </div>
                                    <p className="text-sm text-gray-500">{new Date(visit.visit_date).toLocaleDateString()}</p>
                                  </div>
                                  {visit.diagnosis && <p className="text-sm text-gray-600 mt-2">Diagnosis: {visit.diagnosis}</p>}
                                  {visit.treatment && <p className="text-sm text-gray-600">Treatment: {visit.treatment}</p>}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Weight History Tab */}
                  {healthTab === 'weight' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Weight History</h3>
                      </div>
                      {healthVaultData.weight_history.length === 0 ? (
                        <Card className="p-8 text-center">
                          <Scale className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No weight records yet</p>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {healthVaultData.weight_history.map((entry, idx) => (
                            <Card key={idx} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Scale className="w-5 h-5 text-orange-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{entry.weight_kg} kg</p>
                                    <p className="text-sm text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                {entry.notes && <p className="text-sm text-gray-400">{entry.notes}</p>}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Add Vaccine Modal */}
      <Dialog open={showAddVaccineModal} onOpenChange={setShowAddVaccineModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-green-600" /> Add Vaccination Record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Vaccine Name *</Label>
              <Input
                value={newVaccine.vaccine_name}
                onChange={(e) => setNewVaccine({ ...newVaccine, vaccine_name: e.target.value })}
                placeholder="e.g., Rabies, DHPP, Bordetella"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date Given *</Label>
                <Input
                  type="date"
                  value={newVaccine.date_given}
                  onChange={(e) => setNewVaccine({ ...newVaccine, date_given: e.target.value })}
                />
              </div>
              <div>
                <Label>Next Due Date</Label>
                <Input
                  type="date"
                  value={newVaccine.next_due_date}
                  onChange={(e) => setNewVaccine({ ...newVaccine, next_due_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Vet Name</Label>
              <Input
                value={newVaccine.vet_name}
                onChange={(e) => setNewVaccine({ ...newVaccine, vet_name: e.target.value })}
                placeholder="Dr. Smith"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newVaccine.notes}
                onChange={(e) => setNewVaccine({ ...newVaccine, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVaccineModal(false)}>Cancel</Button>
            <Button onClick={handleAddVaccine} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-1" /> Add Vaccine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medication Modal */}
      <Dialog open={showAddMedicationModal} onOpenChange={setShowAddMedicationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-600" /> Add Medication Record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Medication Name *</Label>
              <Input
                value={newMedication.medication_name}
                onChange={(e) => setNewMedication({ ...newMedication, medication_name: e.target.value })}
                placeholder="e.g., Apoquel, Carprofen"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dosage *</Label>
                <Input
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  placeholder="e.g., 5mg, 1 tablet"
                />
              </div>
              <div>
                <Label>Frequency *</Label>
                <Input
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  placeholder="e.g., Twice daily"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={newMedication.start_date}
                  onChange={(e) => setNewMedication({ ...newMedication, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date (if known)</Label>
                <Input
                  type="date"
                  value={newMedication.end_date}
                  onChange={(e) => setNewMedication({ ...newMedication, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Reason/Condition</Label>
              <Input
                value={newMedication.reason}
                onChange={(e) => setNewMedication({ ...newMedication, reason: e.target.value })}
                placeholder="e.g., Allergies, Joint pain"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newMedication.notes}
                onChange={(e) => setNewMedication({ ...newMedication, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMedicationModal(false)}>Cancel</Button>
            <Button onClick={handleAddMedication} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-1" /> Add Medication
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
