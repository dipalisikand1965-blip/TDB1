import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import ProductManager from '../components/ProductManager';
import CollectionManager from '../components/CollectionManager';
import ReviewsManager from '../components/ReviewsManager';
import {
  Lock,
  User,
  MessageCircle,
  Cake,
  Eye,
  RefreshCw,
  Send,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
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
  FileText,
  HelpCircle,
  Store,
  Cookie,
  Phone,
  Mail,
  Heart,
  Building,
  Sparkles,
  Utensils,
  Layers,
  Calendar
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Admin = () => {
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
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const [editingPost, setEditingPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  
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
        setFaqs(data.faqs || []);
        setFaqCategories(data.categories || []);
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
        setTestimonials(data.testimonials || []);
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
    } catch (error) {
      console.error('Failed to fetch abandoned carts:', error);
    }
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
            <p className="text-gray-500 mt-2">The Doggy Bakery</p>
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
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  data-testid="admin-password"
                  required
                />
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
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">TDB Admin</h1>
                <p className="text-xs text-gray-500">Welcome, Aditya</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={fetchDashboard}>
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b pb-4 flex-wrap">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: "reviews", label: "Reviews", icon: MessageCircle },
            { id: 'chats', label: 'Mira Chats', icon: MessageCircle },
            { id: 'members', label: 'Customers', icon: Users },
            { id: 'pets', label: '🐾 Pet Profiles', icon: PawPrint },
            { id: 'loyalty', label: '⭐ Loyalty', icon: Star },
            { id: 'discounts', label: '🎟️ Discounts', icon: Tag },
            { id: 'abandoned', label: '🛒 Abandoned', icon: ShoppingBag },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'collections', label: 'Collections', icon: Layers },
            { id: 'testimonials', label: 'Testimonials', icon: Star },
            { id: 'insights', label: 'Blog', icon: FileText },
            { id: 'faqs', label: 'FAQs', icon: HelpCircle },
            { id: 'requests', label: 'Custom Cakes', icon: Cake },
            { id: 'streaties', label: '🧡 Streaties', icon: Heart },
            { id: 'franchise', label: '🏪 Franchise', icon: Building },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className={activeTab === tab.id ? 'bg-purple-600' : ''}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`admin-tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboard && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6" data-testid="stat-total-chats">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <MessageCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Chats</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard.summary.total_chats}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Chats</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard.summary.active_chats}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-100 rounded-xl">
                    <Cake className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Custom Requests</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard.summary.total_custom_requests}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Products</p>
                    <p className="text-3xl font-bold text-gray-900">{products.length || '200+'}</p>
                  </div>
                </div>
              </Card>
            </div>

            {dashboard.city_breakdown && dashboard.city_breakdown.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Chats by City
                </h3>
                <div className="flex gap-4 flex-wrap">
                  {dashboard.city_breakdown.map((city, idx) => (
                    <div key={idx} className="px-4 py-2 bg-gray-100 rounded-lg">
                      <span className="font-medium">{city._id || 'Unknown'}</span>
                      <span className="ml-2 text-gray-500">({city.count})</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Mira Conversations</h3>
              <div className="space-y-3">
                {dashboard.recent_chats?.map((chat, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setSelectedChat(chat); }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {chat.pet_name || 'Unknown Pet'} 
                          {chat.pet_breed && <span className="text-gray-500 text-sm ml-2">({chat.pet_breed})</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                          {chat.city || 'Unknown city'} • {chat.service_type || 'General inquiry'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={chat.status === 'active' ? 'default' : 'secondary'}>
                        {chat.status}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Order Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-700">{orderStats.pending || 0}</p>
              </Card>
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-600">Confirmed</p>
                <p className="text-3xl font-bold text-blue-700">{orderStats.confirmed || 0}</p>
              </Card>
              <Card className="p-4 bg-green-50 border-green-200">
                <p className="text-sm text-green-600">Delivered</p>
                <p className="text-3xl font-bold text-green-700">{orderStats.delivered || 0}</p>
              </Card>
              <Card className="p-4 bg-purple-50 border-purple-200">
                <p className="text-sm text-purple-600">Total Orders</p>
                <p className="text-3xl font-bold text-purple-700">{orders.length}</p>
              </Card>
            </div>

            {/* Filter */}
            <Card className="p-4">
              <div className="flex gap-4 flex-wrap">
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Button variant="outline" onClick={fetchOrders}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
              </div>
            </Card>

            {/* Orders List */}
            <div className="space-y-4">
              {orders.map((order, idx) => {
                // Check if order contains custom cake items
                const hasCustomCake = order.items?.some(item => item.isCustomCake || item.id?.startsWith('custom-cake'));
                
                return (
                <Card 
                  key={idx} 
                  className={`p-4 ${hasCustomCake ? 'ring-2 ring-orange-400 bg-orange-50/30' : ''}`}
                  data-testid={`order-${idx}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">{order.orderId}</h3>
                        <Badge variant={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'pending' ? 'warning' :
                          order.status === 'confirmed' ? 'default' : 'secondary'
                        }>
                          {order.status || 'pending'}
                        </Badge>
                        {hasCustomCake && (
                          <Badge className="bg-orange-500 text-white">
                            🎂 Custom Cake Order
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-purple-600">₹{order.total}</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Customer</p>
                      <p className="font-medium">{order.customer?.parentName}</p>
                      <p className="text-sm text-gray-600">{order.customer?.phone}</p>
                      <p className="text-sm text-gray-600">{order.customer?.whatsappNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Pet</p>
                      <p className="font-medium">{order.pet?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-600">{order.pet?.breed} • {order.pet?.age}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Delivery</p>
                      <p className="font-medium">{order.delivery?.city}</p>
                      <p className="text-sm text-gray-600">{order.delivery?.address?.slice(0, 50)}...</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-500 uppercase mb-2">Items</p>
                    {order.items?.map((item, i) => (
                      <div key={i} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {item.isCustomCake || item.id?.startsWith('custom-cake') ? '🎂 ' : ''}
                            {item.name} 
                            {item.selectedSize && ` (${item.selectedSize}`}
                            {item.selectedFlavor && `, ${item.selectedFlavor})`}
                            {!item.selectedSize && !item.selectedFlavor && item.size && ` (${item.size}, ${item.flavor})`}
                            {' '}x{item.quantity}
                          </span>
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                        </div>
                        
                        {/* Custom Cake Details */}
                        {(item.isCustomCake || item.customDetails) && item.customDetails && (
                          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-xs text-orange-600 uppercase font-semibold mb-2">🎂 Custom Cake Details</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Shape:</span>
                                <p className="font-medium">{item.customDetails.shapeIcon || ''} {item.customDetails.shape}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Flavor:</span>
                                <p className="font-medium">{item.customDetails.flavorIcon || ''} {item.customDetails.flavor}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Weight:</span>
                                <p className="font-medium">{item.customDetails.weight || '500g'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Text on Cake:</span>
                                <p className="font-medium text-purple-700">&quot;{item.customDetails.customText || 'None'}&quot;</p>
                              </div>
                            </div>
                            
                            {/* Reference Image */}
                            {item.customDetails.referenceImage && (
                              <div className="mt-3 pt-3 border-t border-orange-200">
                                <p className="text-xs text-orange-600 uppercase font-semibold mb-2">📸 Reference Image (Make it look like this)</p>
                                <img 
                                  src={item.customDetails.referenceImage} 
                                  alt="Customer reference" 
                                  className="w-32 h-32 object-cover rounded-lg border-2 border-orange-300 cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() => window.open(item.customDetails.referenceImage, '_blank')}
                                />
                                <p className="text-xs text-gray-500 mt-1">Click to view full size</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.specialInstructions && (
                    <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-yellow-600 uppercase">Special Instructions</p>
                      <p className="text-sm">{order.specialInstructions}</p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.orderId, 'confirmed')}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.orderId, 'preparing')}>
                      Preparing
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.orderId, 'delivered')}>
                      Delivered
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.orderId, 'cancelled'); }}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => setSelectedOrderDetails(order)}>
                      View Details
                    </Button>
                  </div>
                </Card>
              );
              })}
              {orders.length === 0 && (
                <Card className="p-8 text-center text-gray-500">
                  No orders yet. Orders placed via checkout will appear here.
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Members/Customers Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Member Stats */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Card className="p-4">
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-3xl font-bold">{members.length}</p>
              </Card>
              <Card className="p-4 bg-gray-50">
                <p className="text-sm text-gray-500">Guest</p>
                <p className="text-3xl font-bold text-gray-600">{memberStats.guest || 0}</p>
              </Card>
              <Card className="p-4 bg-white border">
                <p className="text-sm text-gray-500">Free</p>
                <p className="text-3xl font-bold text-gray-600">{memberStats.free || 0}</p>
              </Card>
              <Card className="p-4 bg-blue-50">
                <p className="text-sm text-blue-600">Pawsome</p>
                <p className="text-3xl font-bold text-blue-700">{memberStats.pawsome || 0}</p>
              </Card>
              <Card className="p-4 bg-purple-50">
                <p className="text-sm text-purple-600">Premium</p>
                <p className="text-3xl font-bold text-purple-700">{memberStats.premium || 0}</p>
              </Card>
              <Card className="p-4 bg-amber-50">
                <p className="text-sm text-amber-600">VIP</p>
                <p className="text-3xl font-bold text-amber-700">{memberStats.vip || 0}</p>
              </Card>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chats Today</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-purple-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedMember(member)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium">{member.name || 'Guest'}</p>
                        <p className="text-xs text-gray-500">Joined {new Date(member.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{member.email}</p>
                        <p className="text-xs text-gray-500">{member.phone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          member.membership_tier === 'vip' ? 'warning' :
                          member.membership_tier === 'premium' ? 'default' :
                          member.membership_tier === 'pawsome' ? 'secondary' : 
                          member.membership_tier === 'guest' ? 'outline' : 'secondary'
                        }>
                          {member.membership_tier || 'free'}
                        </Badge>
                        {member.membership_expires && (
                          <p className="text-xs text-gray-500 mt-1">
                            Exp: {new Date(member.membership_expires).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {member.chat_count_today || 0}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          defaultValue={member.membership_tier || 'free'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateMemberTier(member.id, e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="guest">Guest</option>
                          <option value="free">Free</option>
                          <option value="pawsome">Pawsome</option>
                          <option value="premium">Premium</option>
                          <option value="vip">VIP</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {members.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No customers found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chats Tab */}
        {activeTab === 'chats' && (
          <div className="space-y-6">
            {/* Chatbase Section */}
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-purple-900">Mira AI (Chatbase)</h3>
                  <p className="text-sm text-purple-600">{chatbaseChats.length} conversations synced</p>
                </div>
                <Button 
                  onClick={syncChatbase} 
                  disabled={syncingChatbase}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncingChatbase ? 'animate-spin' : ''}`} />
                  {syncingChatbase ? 'Syncing...' : 'Sync from Chatbase'}
                </Button>
              </div>
            </Card>

            {/* Chatbase Conversations */}
            {chatbaseChats.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Chatbase Conversations</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {chatbaseChats.map((chat, idx) => (
                    <Card 
                      key={idx} 
                      className="p-4 border-l-4 border-l-purple-500 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setExpandedChat(expandedChat === idx ? null : idx)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {chat.customer_name || 'Guest User'}
                          </h4>
                          <div className="flex flex-col gap-1 mt-1">
                            {chat.customer_phone && (
                              <a href={`https://wa.me/91${chat.customer_phone}`} target="_blank" rel="noopener noreferrer" 
                                 className="text-sm text-green-600 hover:underline flex items-center gap-1"
                                 onClick={(e) => e.stopPropagation()}>
                                <Phone className="w-3 h-3" /> +91 {chat.customer_phone}
                              </a>
                            )}
                            {chat.customer_email && (
                              <a href={`mailto:${chat.customer_email}`} 
                                 className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                 onClick={(e) => e.stopPropagation()}>
                                <Mail className="w-3 h-3" /> {chat.customer_email}
                              </a>
                            )}
                            {chat.customer_location && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {chat.customer_location}
                              </span>
                            )}
                            {!chat.customer_phone && !chat.customer_email && (
                              <span className="text-sm text-gray-400">No contact info captured</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-purple-100 text-purple-700">Chatbase</Badge>
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedChat === idx ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {chat.message_count || chat.messages?.length || 0} messages
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {chat.created_at ? new Date(chat.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      
                      {/* Preview or Full Conversation */}
                      {expandedChat === idx ? (
                        <div className="bg-gray-50 rounded p-3 max-h-96 overflow-y-auto space-y-3">
                          <p className="text-xs text-gray-500 font-medium mb-2">Full Conversation:</p>
                          {chat.messages && chat.messages.map((msg, msgIdx) => {
                            const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                            return (
                              <div 
                                key={msgIdx} 
                                className={`p-2 rounded-lg text-sm ${
                                  msg.role === 'user' 
                                    ? 'bg-purple-100 text-purple-900 ml-4' 
                                    : 'bg-white border text-gray-700 mr-4'
                                }`}
                              >
                                <span className="text-xs font-medium text-gray-500 block mb-1">
                                  {msg.role === 'user' ? '👤 Customer' : '🤖 Mira'}
                                </span>
                                {content}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded p-2 text-sm text-gray-600 line-clamp-3">
                          {chat.message_preview || (chat.messages && chat.messages.length > 0 
                            ? chat.messages.find(m => m.role === 'user')?.content || 'No user messages'
                            : 'No messages')}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Legacy Mira Chats Filter */}
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-3">Legacy Mira Chats</h3>
              <div className="flex gap-4 flex-wrap">
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Gurgaon">Gurgaon</option>
                  <option value="Delhi">Delhi</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <Button variant="outline" onClick={fetchChats}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {chats.map((chat, idx) => (
                <Card 
                  key={idx} 
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{chat.pet_name || 'Unknown Pet'}</h4>
                      <p className="text-sm text-gray-500">{chat.pet_breed || 'Unknown'} • {chat.pet_age || 'Age unknown'}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(chat.updated_at || chat.created_at).toLocaleString()}</p>
                    </div>
                    <Badge variant={chat.status === 'active' ? 'default' : 'secondary'}>{chat.status}</Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{chat.city || 'N/A'}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" />{chat.messages?.length || 0} msgs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{chat.service_type || 'General'}</span>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); sendNotification(chat.session_id); }}>
                      <Send className="w-3 h-3 mr-1" />Notify
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Products Tab - Using ProductManager Component */}
        {activeTab === 'products' && (
          <ProductManager credentials={{ username, password }} />
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
              <h3 className="text-xl font-bold text-gray-900">Insights & Blog ({blogPosts.length})</h3>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => {
                setEditingPost({ id: `new-${Date.now()}`, title: '', excerpt: '', content: '', category: 'Tips', status: 'draft', is_featured: false });
                setShowPostModal(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />New Post
              </Button>
            </div>
            
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
                      <span>{post.category}</span>
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
                          <option value="Tips">Tips</option>
                          <option value="News">News</option>
                          <option value="Recipes">Recipes</option>
                          <option value="Stories">Stories</option>
                          <option value="Health">Health</option>
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
                      <Input value={editingFaq.category || 'General'} onChange={(e) => setEditingFaq({...editingFaq, category: e.target.value})} placeholder="e.g., Orders & Delivery" list="faq-categories" />
                      <datalist id="faq-categories">
                        {faqCategories.map(cat => <option key={cat} value={cat} />)}
                        <option value="Orders & Delivery" />
                        <option value="Products & Ingredients" />
                        <option value="Customization" />
                        <option value="Payments & Refunds" />
                        <option value="General" />
                      </datalist>
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
                ) : petProfiles.map((pet) => (
                  <div 
                    key={pet.id} 
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors border border-transparent hover:border-purple-200"
                    onClick={() => setSelectedPetProfile(pet)}
                  >
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <PawPrint className="w-8 h-8 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">{pet.name}</h4>
                        {pet.soul?.persona && <Badge variant="outline" className="text-xs">{pet.soul.persona}</Badge>}
                        {pet.source === 'shopify_embed' && (
                          <Badge className="bg-green-100 text-green-700 text-xs">Shopify</Badge>
                        )}
                        {pet.source === 'direct' && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Direct</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{pet.breed} • {pet.gender}</p>
                      <p className="text-xs text-gray-400">Owner: {pet.owner_name || pet.owner_email || 'Unknown'}</p>
                    </div>
                    <div className="text-right text-sm">
                      {pet.birth_date && <p className="text-gray-600">🎂 {new Date(pet.birth_date).toLocaleDateString()}</p>}
                      {pet.gotcha_date && <p className="text-gray-500">💝 Gotcha: {new Date(pet.gotcha_date).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
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
                <Button variant="outline" onClick={fetchAbandonedCarts}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={triggerAbandonedCartCheck}>
                  <Mail className="w-4 h-4 mr-2" />Send Reminders
                </Button>
              </div>
            </div>
            
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
              <div className="space-y-4">
                {abandonedCarts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No abandoned carts yet</p>
                ) : abandonedCarts.map((cart) => (
                  <div key={cart.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{cart.email || 'Unknown email'}</p>
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
      </div>

      {/* Pet Profile Detail Modal */}
      {selectedPetProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                  {selectedPetProfile.photo_url ? (
                    <img src={selectedPetProfile.photo_url} alt={selectedPetProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-10 h-10 text-purple-300" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPetProfile.name}</h2>
                  <p className="text-gray-600">{selectedPetProfile.breed} • {selectedPetProfile.species} • {selectedPetProfile.gender}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedPetProfile.soul?.persona && <Badge className="bg-purple-600">{selectedPetProfile.soul.persona}</Badge>}
                    <Badge variant="outline">Age: {selectedPetProfile.age_years || '?'}y {selectedPetProfile.age_months || '?'}m</Badge>
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
                        {pet.photo_url ? (
                          <img src={pet.photo_url} className="w-full h-full object-cover" />
                        ) : (
                          <PawPrint className="w-5 h-5 text-gray-400" />
                        )}
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

              {/* Items */}
              <div>
                <h4 className="font-semibold border-b pb-2 mb-2">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                      {item.customDetails?.referenceImage && (
                        <img src={item.customDetails.referenceImage} className="w-16 h-16 object-cover rounded" />
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
                            <p><strong>Custom Text:</strong> {item.customDetails.customText}</p>
                            <p><strong>Shape:</strong> {item.customDetails.shape} | <strong>Flavor:</strong> {item.customDetails.flavor}</p>
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
                  Sizes (JSON format: [{'{'}name: "500g", price: 600{'}'}, ...])
                </label>
                <textarea 
                  value={JSON.stringify(editingProduct.sizes || [], null, 2)}
                  onChange={(e) => {
                    try {
                      setEditingProduct({ ...editingProduct, sizes: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                  className="w-full border rounded-lg p-3 text-sm font-mono"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flavors (JSON format: [{'{'}name: "Chicken", price: 50{'}'}, ...])
                </label>
                <textarea 
                  value={JSON.stringify(editingProduct.flavors || [], null, 2)}
                  onChange={(e) => {
                    try {
                      setEditingProduct({ ...editingProduct, flavors: JSON.parse(e.target.value) });
                    } catch {}
                  }}
                  className="w-full border rounded-lg p-3 text-sm font-mono"
                  rows={4}
                />
              </div>
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
    </div>
  );
};

export default Admin;
