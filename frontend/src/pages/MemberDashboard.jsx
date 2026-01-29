import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Textarea } from '../components/ui/textarea';
import { 
  ShoppingBag, PawPrint, Star, User, LogOut, Package, 
  MapPin, Settings, Lock, Bell, Shield, Phone, Mail, MessageCircle,
  RefreshCw, Calendar, Pause, Play, X, MessageSquare, Edit2, Trash2, Loader2,
  UtensilsCrossed, Users, Clock, Stethoscope, Sparkles, Home, Plane, Cake, Gift, Crown, Heart,
  ChevronRight, Trophy, Zap, Target, Flame, Award, Medal, CheckCircle2, ArrowRight, TrendingUp, Wallet,
  BellRing, Smartphone, HelpCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';
import { API_URL } from '../utils/api';
import { getPetPhotoUrl } from '../utils/petAvatar';
import PetAvatar, { PetAvatarMini } from '../components/PetAvatar';
import PawPointsRewards from '../components/PawPointsRewards';
import MiraConversationHistory from '../components/MiraConversationHistory';
import SoulExplainerVideo, { SoulExplainerButton } from '../components/SoulExplainerVideo';
import MiraPicksCard from '../components/MiraPicksCard';
import BreedHealthCard from '../components/BreedHealthCard';
import usePushNotifications from '../hooks/usePushNotifications';
// New membership & engagement components
import MembershipCardTiers from '../components/MembershipCardTiers';
import SocialShareReward from '../components/SocialShareReward';
import BreedTipsEngine from '../components/BreedTipsEngine';
import PawmoterScore from '../components/PawmoterScore';
// Extracted dashboard components
import { 
  QuickScoreBoost, 
  GamificationBanner, 
  ACHIEVEMENTS, 
  TIER_COLORS, 
  triggerCelebration 
} from '../components/dashboard';
// Mira Guidance System
import { MiraTip, getMiraGuidanceContext, ScoreBoostEncouragement } from '../components/MiraGuidance';
// Celebrations Widget
import MyCelebrations from '../components/MyCelebrations';
// First Visit Tour
import FirstVisitTour, { useTour } from '../components/FirstVisitTour';
// Daily Tips
import MiraDailyTip, { MiraDailyTipInline } from '../components/MiraDailyTip';
// Pulse Voice Assistant (Voice → Mira accelerator)
import Pulse, { PulseButton } from '../components/Pulse';
// Push Notification Banner
import PushNotificationBanner from '../components/PushNotificationBanner';
// Mobile Navigation Bar
import MobileNavBar from '../components/MobileNavBar';


// Extracted components: ACHIEVEMENTS, TIER_COLORS, triggerCelebration, QuickScoreBoost, GamificationBanner
// These are now imported from '../components/dashboard'

// ============================================
// 🏛️ PILLAR POPUP COMPONENT
// Shows usage history and stats for each pillar
// ============================================
const PillarPopup = ({ pillar, onClose, onExplore, data }) => {
  if (!pillar) return null;
  
  // Get pillar-specific data
  const getPillarStats = () => {
    switch (pillar.id) {
      case 'celebrate':
        return {
          items: data.celebrationOrders || [],
          stats: [
            { label: 'Total Orders', value: data.celebrationOrders?.length || 0 },
            { label: 'Cakes Ordered', value: data.celebrationOrders?.filter(o => o.items?.some(i => i.name?.toLowerCase().includes('cake'))).length || 0 }
          ],
          emptyText: 'No celebration orders yet. Make your pet\'s special day unforgettable!'
        };
      case 'dine':
        return {
          items: [...(data.diningHistory?.reservations?.items || []), ...(data.diningHistory?.visits?.items || [])],
          stats: [
            { label: 'Reservations', value: data.diningHistory?.reservations?.items?.length || 0 },
            { label: 'Visits', value: data.diningHistory?.visits?.items?.length || 0 },
            { label: 'Meetups', value: data.diningHistory?.meetups?.items?.length || 0 }
          ],
          emptyText: 'No dining history yet. Discover pet-friendly restaurants!'
        };
      case 'stay':
        return {
          items: data.stayHistory?.bookings || [],
          stats: [
            { label: 'Total Stays', value: data.stayHistory?.bookings?.length || 0 },
            { label: 'Upcoming', value: data.stayHistory?.upcoming?.length || 0 },
            { label: 'Past Stays', value: data.stayHistory?.past?.length || 0 }
          ],
          emptyText: 'No stays booked yet. Find the perfect boarding for your pet!'
        };
      case 'travel':
        return {
          items: data.travelHistory?.requests || [],
          stats: [
            { label: 'Total Trips', value: data.travelHistory?.requests?.length || 0 },
            { label: 'Upcoming', value: data.travelHistory?.upcoming?.length || 0 },
            { label: 'Completed', value: data.travelHistory?.past?.length || 0 }
          ],
          emptyText: 'No travel requests yet. Plan your next pet-friendly adventure!'
        };
      default:
        return {
          items: [],
          stats: [
            { label: 'Activities', value: 0 },
            { label: 'This Month', value: 0 }
          ],
          emptyText: `Start exploring ${pillar.name} services for your pet!`
        };
    }
  };
  
  const pillarData = getPillarStats();
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`p-6 bg-gradient-to-br ${pillar.color} text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl backdrop-blur-sm">
                {pillar.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold">{pillar.name}</h2>
                <p className="text-white/80 text-sm">Your activity & history</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-px bg-gray-100 border-b">
          {pillarData.stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
        
        {/* Recent Activity */}
        <div className="p-4 max-h-60 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Recent Activity</h3>
          {pillarData.items.length > 0 ? (
            <div className="space-y-2">
              {pillarData.items.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${pillar.color} flex items-center justify-center text-white text-lg`}>
                    {pillar.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.items?.[0]?.name || item.restaurant_name || item.property_name || item.destination || 'Activity'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 
                       item.date || item.check_in || 'Recent'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-3">
                {pillar.icon}
              </div>
              <p className="text-sm text-gray-500">{pillarData.emptyText}</p>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            className={`flex-1 bg-gradient-to-r ${pillar.color} text-white border-0`}
            onClick={() => {
              onClose();
              onExplore(pillar.path);
            }}
          >
            Explore {pillar.name}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

const MemberDashboard = () => {
  const { user, logout, token, loading: authLoading, refreshUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pets, setPets] = useState([]);
  const [autoships, setAutoships] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewableProducts, setReviewableProducts] = useState([]);
  const [diningHistory, setDiningHistory] = useState({ reservations: { items: [] }, visits: { items: [] }, meetups: { items: [] } });
  const [stayHistory, setStayHistory] = useState({ bookings: [], upcoming: [], past: [] });
  const [travelHistory, setTravelHistory] = useState({ requests: [], upcoming: [], past: [] });
  const [celebrationOrders, setCelebrationOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showSoulExplainer, setShowSoulExplainer] = useState(false);
  const navigate = useNavigate();
  
  // Push Notifications Hook
  const { 
    isPushSupported, 
    permission: pushPermission, 
    isSubscribed: isPushSubscribed,
    loading: pushLoading,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    sendTestNotification
  } = usePushNotifications(user?.id);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', name: '' });
  const [editingReview, setEditingReview] = useState(null);
  
  // Settings State - Communication Preferences
  const [settings, setSettings] = useState({
    // Communication Channels
    email: true,
    whatsapp: false,
    sms: false,
    push_notifications: false,
    // Notification Types
    order_updates: true,
    promotional: true,
    celebration_reminders: true,
    health_reminders: true,
    community_updates: false,
    // Soul Whisper - Daily pet soul questions via WhatsApp
    soul_whisper: true,
    soul_whisper_frequency: 'daily', // daily, weekly, twice_weekly
    soul_whisper_time: '10:00', // Preferred time
    // Privacy
    shareData: false
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  // Pillar Popup State - Shows usage history for each pillar
  const [pillarPopup, setPillarPopup] = useState({ open: false, pillar: null });
  
  // My Requests (Mira Tickets) State
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // First Visit Tour
  const { showTour, startTour, endTour } = useTour();
  
  // Voice Assistant
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  // Redirect to login if not authenticated (after auth check completes)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);
  
  // Listen for openSoulExplainer event from footer
  useEffect(() => {
    const handleOpenExplainer = () => setShowSoulExplainer(true);
    window.addEventListener('openSoulExplainer', handleOpenExplainer);
    return () => window.removeEventListener('openSoulExplainer', handleOpenExplainer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }
      
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [ordersRes, petsRes, autoshipRes, reviewsRes] = await Promise.all([
          axios.get(`${API_URL}/api/orders/my-orders`, config).catch(() => ({ data: { orders: [] } })),
          axios.get(`${API_URL}/api/pets/my-pets`, config).catch(() => ({ data: { pets: [] } })),
          axios.get(`${API_URL}/api/autoship/my-subscriptions`, config).catch(() => ({ data: { subscriptions: [] } })),
          axios.get(`${API_URL}/api/reviews/my-reviews`, config).catch(() => ({ data: { reviews: [] } }))
        ]);
        
        // Fetch dining history
        try {
          const diningRes = await axios.get(`${API_URL}/api/dine/my-dining-history?user_id=${user.id || ''}&email=${user.email || ''}`);
          setDiningHistory(diningRes.data || { reservations: { items: [] }, visits: { items: [] }, meetups: { items: [] } });
        } catch (e) {
          console.error('Failed to fetch dining history:', e);
        }
        
        // Fetch stay history
        try {
          const stayRes = await axios.get(`${API_URL}/api/stay/my-bookings?email=${user.email || ''}`, config);
          setStayHistory(stayRes.data || { bookings: [], upcoming: [], past: [] });
        } catch (e) {
          console.error('Failed to fetch stay history:', e);
        }
        
        // Fetch travel history
        try {
          const travelRes = await axios.get(`${API_URL}/api/travel/my-requests?user_email=${user.email || ''}`, config);
          const requests = travelRes.data.requests || [];
          const now = new Date();
          const upcoming = requests.filter(r => new Date(r.journey?.travel_date) >= now && r.status !== 'cancelled');
          const past = requests.filter(r => new Date(r.journey?.travel_date) < now || r.status === 'cancelled' || r.status === 'completed');
          setTravelHistory({ requests, upcoming, past });
        } catch (e) {
          console.error('Failed to fetch travel history:', e);
        }

        const userOrders = ordersRes.data.orders || [];
        setOrders(userOrders);
        
        // Filter celebration orders (cakes, treats, etc.)
        const celebrations = userOrders.filter(o => 
          o.items?.some(i => 
            i.category?.toLowerCase().includes('cake') || 
            i.category?.toLowerCase().includes('treat') ||
            i.category?.toLowerCase().includes('celebrate')
          )
        );
        setCelebrationOrders(celebrations);
        
        setPets(petsRes.data.pets || []);
        setAutoships(autoshipRes.data.subscriptions || []);
        setReviews(reviewsRes.data.reviews || []);
        
        // Check for achievement unlocks and trigger celebrations
        const loadedPets = petsRes.data.pets || [];
        if (loadedPets.length > 0) {
          const primaryPet = loadedPets[0];
          const score = Math.min(100, primaryPet.overall_score || 0);
          
          // Check localStorage for previously celebrated milestones
          const celebratedKey = `celebrated_milestones_${primaryPet.id}`;
          const celebrated = JSON.parse(localStorage.getItem(celebratedKey) || '[]');
          
          const milestones = [
            { threshold: 25, name: 'Soul Seeker', icon: '🔍' },
            { threshold: 50, name: 'Soul Explorer', icon: '🧭' },
            { threshold: 75, name: 'Soul Guardian', icon: '🛡️' },
            { threshold: 100, name: 'Soul Master', icon: '👑' }
          ];
          
          // Find newly unlocked milestones
          const newMilestones = milestones.filter(m => 
            score >= m.threshold && !celebrated.includes(m.threshold)
          );
          
          // Celebrate new milestones!
          if (newMilestones.length > 0) {
            const highest = newMilestones[newMilestones.length - 1];
            
            // Delay celebration slightly for visual impact
            setTimeout(() => {
              triggerCelebration(highest.threshold === 100 ? 'heavy' : 'medium');
              toast({
                title: `🎉 Achievement Unlocked!`,
                description: `${highest.icon} ${highest.name} - ${primaryPet.name} has reached ${highest.threshold}% Soul completion!`,
                duration: 6000
              });
            }, 1000);
            
            // Save celebrated milestones
            localStorage.setItem(celebratedKey, JSON.stringify([
              ...celebrated,
              ...newMilestones.map(m => m.threshold)
            ]));
          }
        }
        
        // Sync achievement points - credit any new achievements
        try {
          const syncRes = await fetch(`${API_URL}/api/paw-points/sync-achievements`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            if (syncData.points_earned > 0) {
              toast({
                title: `🎉 ${syncData.points_earned} Paw Points Earned!`,
                description: syncData.message,
                duration: 5000
              });
              triggerCelebration('light');
              // Refresh user data to update loyalty_points in UI
              await refreshUser();
            }
          }
        } catch (err) {
          console.error('Failed to sync achievements:', err);
        }
        
        // Extract products from orders that user can review
        const productIds = new Set((reviewsRes.data.reviews || []).map(r => r.product_id));
        const reviewableProds = [];
        for (const order of userOrders) {
          for (const item of (order.items || [])) {
            if (!productIds.has(item.id) && !reviewableProds.find(p => p.id === item.id)) {
              reviewableProds.push({
                id: item.id,
                name: item.name,
                image: item.image,
                orderId: order.id
              });
            }
          }
        }
        setReviewableProducts(reviewableProds);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [token, user, API_URL]);

  // Fetch My Requests (Mira Tickets)
  useEffect(() => {
    const fetchMyRequests = async () => {
      if (!token || !user) return;
      
      setRequestsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/api/mira/my-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyRequests(response.data.requests || []);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setRequestsLoading(false);
      }
    };
    
    fetchMyRequests();
  }, [token, user, API_URL]);

  // Extract unique addresses from orders
  const savedAddresses = orders
    .map(o => o.delivery)
    .filter((d, i, self) => 
      d && d.address && 
      self.findIndex(t => t.address === d.address) === i
    )
    .slice(0, 3);

  // Fetch communication preferences on load
  useEffect(() => {
    const fetchCommunicationPreferences = async () => {
      if (!user?.email || !token) return;
      
      try {
        const response = await axios.get(
          `${API_URL}/api/member/communication-preferences?user_email=${user.email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSettings(prev => ({ ...prev, ...response.data }));
      } catch (error) {
        console.error('Failed to fetch communication preferences:', error);
      }
    };
    
    fetchCommunicationPreferences();
  }, [user?.email, token, API_URL]);

  const handleSettingChange = async (key) => {
    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    setSettingsSaved(false);
    
    // Auto-save to backend
    try {
      setSettingsLoading(true);
      await axios.put(
        `${API_URL}/api/member/communication-preferences?user_email=${user.email}`,
        { ...settings, [key]: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSettingsSaved(true);
      toast({ title: '✓ Saved', description: 'Your preference has been updated.' });
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save preference:', error);
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !newValue }));
      toast({ title: 'Error', description: 'Failed to save preference. Please try again.', variant: 'destructive' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Review functions
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    setReviewLoading(true);
    try {
      const reviewData = {
        product_id: selectedProduct.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        reviewer_name: reviewForm.name || user.name,
        reviewer_email: user.email
      };
      
      if (editingReview) {
        // Update existing review
        await axios.put(`${API_URL}/api/reviews/${editingReview.id}`, reviewData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Review updated successfully!' });
      } else {
        // Create new review
        await axios.post(`${API_URL}/api/reviews`, reviewData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Thank you for your review!' });
      }
      
      // Refresh reviews
      const reviewsRes = await axios.get(`${API_URL}/api/reviews/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(reviewsRes.data.reviews || []);
      
      // Update reviewable products
      const productIds = new Set((reviewsRes.data.reviews || []).map(r => r.product_id));
      setReviewableProducts(prev => prev.filter(p => !productIds.has(p.id)));
      
      // Reset form
      setShowReviewForm(false);
      setSelectedProduct(null);
      setEditingReview(null);
      setReviewForm({ rating: 5, comment: '', name: '' });
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast({ title: 'Error', description: 'Failed to submit review. Please try again.', variant: 'destructive' });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setSelectedProduct({ id: review.product_id, name: review.product_name, image: review.product_image });
    setReviewForm({
      rating: review.rating,
      comment: review.comment,
      name: review.reviewer_name
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast({ title: 'Success', description: 'Review deleted successfully.' });
    } catch (error) {
      console.error('Failed to delete review:', error);
      toast({ title: 'Error', description: 'Failed to delete review.', variant: 'destructive' });
    }
  };

  const startNewReview = (product) => {
    setSelectedProduct(product);
    setEditingReview(null);
    setReviewForm({ rating: 5, comment: '', name: user.name || '' });
    setShowReviewForm(true);
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If not authenticated after loading, the useEffect will redirect
  if (!user) return null;

  // Show loading while fetching pet and account data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading your pet family...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching {user.name?.split(' ')[0]}'s personalized dashboard</p>
        </div>
      </div>
    );
  }

  // Get primary pet info with universal avatar (safe access)
  const primaryPet = Array.isArray(pets) && pets.length > 0 ? pets[0] : null;
  const petPhotoUrl = primaryPet ? getPetPhotoUrl(primaryPet) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* First Visit Tour - Shows for new members */}
      <FirstVisitTour 
        isOpen={showTour}
        onClose={endTour}
        onComplete={() => {
          toast({
            title: "Welcome to the family! 🎉",
            description: "Your pet's journey begins now!"
          });
        }}
        userName={user?.name?.split(' ')[0]}
        petName={primaryPet?.name}
      />
      
      {/* Tour Replay Button - Hidden in corner for returning users */}
      {!showTour && (
        <button
          onClick={startTour}
          className="fixed bottom-24 left-4 z-40 bg-white/90 hover:bg-white shadow-lg rounded-full p-3 transition-all hover:scale-110 group"
          title="Replay Tour"
        >
          <HelpCircle className="w-5 h-5 text-purple-600" />
          <span className="absolute left-full ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Take the tour again
          </span>
        </button>
      )}
      
      {/* ⚡ Pulse Voice Button */}
      <PulseButton 
        onClick={() => setShowVoiceAssistant(true)}
        petName={primaryPet?.name || 'your pet'}
      />
      
      {/* ⚡ Pulse Voice Assistant Modal */}
      <Pulse
        isOpen={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
        petName={primaryPet?.name || 'your pet'}
        petId={primaryPet?.id}
        petData={{
          overall_score: primaryPet?.overall_score || 0,
          breed: primaryPet?.breed,
          age: primaryPet?.age
        }}
        onNavigate={(path) => {
          setShowVoiceAssistant(false);
          navigate(path);
        }}
      />
      
      {/* Beautiful Hero Section - Pet-First Design */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-teal-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Top Bar - Member Status */}
          <div className="flex items-center justify-between mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">Pet Pass Member</span>
              <Badge className={`ml-2 ${user.membership_tier === 'pending' ? 'bg-amber-400 text-amber-900' : 'bg-green-400 text-green-900'} border-0`}>
                {user.membership_tier === 'pending' ? 'Setup Pending' : 'Active'}
              </Badge>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm">
                <span className="text-white/60">Points:</span> <span className="font-bold">{(user.loyalty_points || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="grid md:grid-cols-5 gap-8 items-center">
            {/* Left - Pet Photo Hero (larger) */}
            {primaryPet && (
              <div className="md:col-span-2 flex justify-center">
                <div className="relative">
                  {/* Large Pet Photo Circle */}
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl">
                    <img 
                      src={petPhotoUrl} 
                      alt={primaryPet.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop'; }}
                    />
                  </div>
                  
                  {/* Soul Score Badge */}
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full p-1">
                    <div className="bg-white rounded-full w-16 h-16 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-teal-700">{Math.min(100, Math.round(primaryPet.overall_score || 0))}%</span>
                      <span className="text-[10px] text-gray-500 font-medium">Soul</span>
                    </div>
                  </div>
                  
                  {/* Pet Pass Number Badge */}
                  {primaryPet.pet_pass_number && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-mono">
                      {primaryPet.pet_pass_number}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Right - Welcome Message & Quick Actions */}
            <div className={`${primaryPet ? 'md:col-span-3' : 'md:col-span-5'} text-white`}>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {primaryPet ? (
                  <>
                    Hello, <span className="text-yellow-300">{primaryPet.name}</span>! 
                    <span className="text-2xl ml-2">🐾</span>
                  </>
                ) : (
                  <>Welcome back, {user.name?.split(' ')[0]}!</>
                )}
              </h1>
              
              <p className="text-lg text-white/70 mb-4">
                {primaryPet ? (
                  <>
                    <span className="text-white/90">{user.name?.split(' ')[0]}</span>, we&apos;re here to take care of {primaryPet.name}.
                    {primaryPet.breed && <span className="text-teal-300"> Your beautiful {primaryPet.breed}.</span>}
                  </>
                ) : (
                  <>Start your pet parenting journey with personalized care & services.</>
                )}
              </p>
              
              {/* No Pet - Prominent Add Pet CTA */}
              {!primaryPet && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center">
                      <PawPrint className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold text-white mb-1">Add Your First Pet</h3>
                      <p className="text-white/70 text-sm">Tell us about your furry friend to unlock personalized recommendations, health tips, and exclusive services.</p>
                    </div>
                    <Button 
                      onClick={() => navigate('/my-pets')}
                      className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold px-6 py-3"
                    >
                      <PawPrint className="w-5 h-5 mr-2" />
                      Add Pet Now
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Pet Quick Info Cards */}
              {primaryPet && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <Sparkles className="w-5 h-5 mx-auto text-yellow-400 mb-1" />
                    <p className="text-white text-lg font-bold">{Math.min(100, Math.round(primaryPet.overall_score || 0))}%</p>
                    <p className="text-white/60 text-xs">Pet Soul</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <Gift className="w-5 h-5 mx-auto text-pink-400 mb-1" />
                    <p className="text-white text-lg font-bold">{user.loyalty_points || 0}</p>
                    <p className="text-white/60 text-xs">Paw Points</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <Calendar className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                    <p className="text-white text-lg font-bold">{primaryPet.birth_date ? new Date(primaryPet.birth_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '—'}</p>
                    <p className="text-white/60 text-xs">Birthday</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <Heart className="w-5 h-5 mx-auto text-red-400 mb-1" />
                    <p className="text-white text-lg font-bold">{pets.length}</p>
                    <p className="text-white/60 text-xs">{pets.length === 1 ? 'Pet' : 'Pets'}</p>
                  </div>
                </div>
              )}
              
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {primaryPet && primaryPet.id && (primaryPet.overall_score || 0) < 100 && (
                  <Button 
                    onClick={() => navigate(`/pet/${primaryPet.id}?tab=personality`)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Complete Pet Soul
                  </Button>
                )}
                {primaryPet && primaryPet.id ? (
                  <Button 
                    onClick={() => {
                      // Go directly to unified pet page for primary pet
                      if (pets.length > 0 && pets[0].id) {
                        navigate(`/pet/${pets[0].id}?tab=personality`);
                      } else {
                        navigate('/my-pets');
                      }
                    }}
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <PawPrint className="w-4 h-4 mr-2" />
                    {pets.length > 1 ? 'View All Pets' : 'My Pet Profile'}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/shop')}
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Browse Shop
                  </Button>
                )}
                <Button 
                  onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ask Mira
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Account Section Below Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">My Account</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="text-red-600 hover:bg-red-50 hover:text-red-700">
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
        
        {/* 🎮 GAMIFICATION BANNER - Complete Your Profile */}
        <GamificationBanner 
          pets={pets}
          orders={orders}
          user={user}
          onNavigateToPet={(petId) => navigate(`/pet/${petId}?tab=personality`)}
          onOpenExplainer={() => setShowSoulExplainer(true)}
        />
        
        {/* 🔔 PUSH NOTIFICATION BANNER - Encourage enabling notifications */}
        <PushNotificationBanner 
          userId={user?.id} 
          petName={pets?.[0]?.name || 'your pup'} 
        />
        
        {/* ⚡ QUICK SCORE BOOST - Show when score is low */}
        {Array.isArray(pets) && pets.length > 0 && pets[0]?.overall_score < 75 && (
          <QuickScoreBoost 
            pet={pets[0]} 
            onAnswerQuestion={() => {
              // Refresh pets data after answering a question
              window.location.reload();
            }}
          />
        )}
        
        {/* Soul Explainer Video Modal */}
        {showSoulExplainer && (
          <SoulExplainerVideo
            petName={pets[0]?.name || 'your pet'}
            onClose={() => setShowSoulExplainer(false)}
            onStartJourney={() => {
              setShowSoulExplainer(false);
              if (pets[0]?.id) {
                navigate(`/pet/${pets[0].id}?tab=personality`);
              }
            }}
          />
        )}
        
        <Tabs defaultValue="overview" className="space-y-6">
          {/* Mobile-First Navigation - Clean bottom bar style on mobile, horizontal scroll on desktop */}
          <div className="sticky top-0 z-20 bg-gradient-to-b from-white via-white to-transparent pb-2">
            {/* Desktop: Horizontal scroll tabs */}
            <TabsList className="hidden md:flex bg-white p-1 rounded-xl border shadow-sm w-full overflow-x-auto scrollbar-hide">
              <TabsTrigger value="overview" className="rounded-lg flex-shrink-0 whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="services" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <Crown className="w-4 h-4 mr-1" />
                All Services
              </TabsTrigger>
              <TabsTrigger value="rewards" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <Gift className="w-4 h-4 mr-1" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="mira" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <Sparkles className="w-4 h-4 mr-1" />
                Mira AI
              </TabsTrigger>
              <TabsTrigger value="requests" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <MessageCircle className="w-4 h-4 mr-1" />
                My Requests
                {myRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{myRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <Package className="w-4 h-4 mr-1" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="autoship" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <RefreshCw className="w-4 h-4 mr-1" />
                Autoship
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <MessageSquare className="w-4 h-4 mr-1" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="pets" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <PawPrint className="w-4 h-4 mr-1" />
                Pets
              </TabsTrigger>
              <TabsTrigger value="addresses" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <MapPin className="w-4 h-4 mr-1" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg flex-shrink-0 whitespace-nowrap">
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            {/* Mobile: Clean 2-row grid navigation */}
            <div className="md:hidden space-y-2">
              {/* Primary Row - Most used */}
              <TabsList className="bg-white p-1 rounded-xl border shadow-sm grid grid-cols-4 gap-1">
                <TabsTrigger value="overview" className="rounded-lg flex flex-col items-center py-2 px-1 text-xs">
                  <Home className="w-5 h-5 mb-1" />
                  Home
                </TabsTrigger>
                <TabsTrigger value="services" className="rounded-lg flex flex-col items-center py-2 px-1 text-xs">
                  <Crown className="w-5 h-5 mb-1" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="mira" className="rounded-lg flex flex-col items-center py-2 px-1 text-xs">
                  <Sparkles className="w-5 h-5 mb-1" />
                  Mira
                </TabsTrigger>
                <TabsTrigger value="orders" className="rounded-lg flex flex-col items-center py-2 px-1 text-xs">
                  <Package className="w-5 h-5 mb-1" />
                  Orders
                </TabsTrigger>
              </TabsList>
              
              {/* Secondary Row - Less frequent */}
              <TabsList className="bg-gray-50 p-1 rounded-xl border grid grid-cols-5 gap-1">
                <TabsTrigger value="rewards" className="rounded-lg flex flex-col items-center py-1.5 px-1 text-[10px]">
                  <Gift className="w-4 h-4 mb-0.5" />
                  Rewards
                </TabsTrigger>
                <TabsTrigger value="pets" className="rounded-lg flex flex-col items-center py-1.5 px-1 text-[10px]">
                  <PawPrint className="w-4 h-4 mb-0.5" />
                  Pets
                </TabsTrigger>
                <TabsTrigger value="autoship" className="rounded-lg flex flex-col items-center py-1.5 px-1 text-[10px]">
                  <RefreshCw className="w-4 h-4 mb-0.5" />
                  Autoship
                </TabsTrigger>
                <TabsTrigger value="addresses" className="rounded-lg flex flex-col items-center py-1.5 px-1 text-[10px]">
                  <MapPin className="w-4 h-4 mb-0.5" />
                  Addresses
                </TabsTrigger>
                <TabsTrigger value="settings" className="rounded-lg flex flex-col items-center py-1.5 px-1 text-[10px]">
                  <Settings className="w-4 h-4 mb-0.5" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Overview Content */}
          <TabsContent value="overview" className="animate-in fade-in-50 duration-300">
            {/* 🐕 MIRA'S PERSONALIZED GUIDANCE - Shows contextual tips */}
            <MiraTip 
              context={getMiraGuidanceContext(user, pets, orders)}
              petName={pets[0]?.name}
              petId={pets[0]?.id}
              parentName={user?.name?.split(' ')[0]}
              score={Math.min(100, pets[0]?.overall_score || 0)}
            />
            
            {/* 💡 MIRA'S DAILY TIP - Fun facts & pro tips that change daily */}
            <div className="mb-6">
              <MiraDailyTipInline petName={primaryPet?.name || 'your pup'} />
            </div>
            
            {/* 📋 MY ACTIVE REQUESTS - Quick view of Mira tickets */}
            {myRequests.length > 0 && (
              <div className="mb-6">
                <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-purple-600" />
                      Active Requests
                      <Badge variant="secondary" className="text-xs">{myRequests.length}</Badge>
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-purple-600 hover:text-purple-700"
                      onClick={() => document.querySelector('[value="requests"]')?.click()}
                    >
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {myRequests.slice(0, 2).map((req) => (
                      <div key={req.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500">#{req.id}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                req.status_display?.color === 'green' ? 'bg-green-50 text-green-700' :
                                req.status_display?.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' :
                                req.status_display?.color === 'blue' ? 'bg-blue-50 text-blue-700' :
                                'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {req.status_display?.icon} {req.status_display?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">{req.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
            
            {/* 📹 EXPLAINER VIDEO TAB - Quick access to Pet Soul explainer */}
            <div className="mb-6">
              <button
                onClick={() => setShowSoulExplainer(true)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:shadow-md transition-all group"
                data-testid="explainer-video-tab"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Play className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      TDC Insight
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">1 min</span>
                    </h4>
                    <p className="text-sm text-gray-500">Learn how Pet Soul™ works for {primaryPet?.name || 'your pet'}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </button>
            </div>
            
            {/* 🎉 MY CELEBRATIONS - Upcoming birthdays, gotcha days, etc */}
            {Array.isArray(pets) && pets.length > 0 && (
              <div className="mb-6">
                <MyCelebrations 
                  pets={pets} 
                  onNavigate={(path) => navigate(path)}
                />
              </div>
            )}
            
            {/* MIRA'S PICKS - Smart Recommendations */}
            {user?.id && (
              <div className="mb-8">
                <MiraPicksCard 
                  userId={user.id}
                  petId={pets[0]?.id}
                  title="Mira's Picks"
                  subtitle={pets[0] ? `Personalized for ${pets[0].name}` : "Discover products for your pet"}
                  maxItems={4}
                  showInsights={true}
                />
              </div>
            )}
            
            {/* ALL 14 LIFE PILLARS - PROMINENT AT TOP */}
            <Card className="p-6 bg-gradient-to-r from-teal-800 via-teal-700 to-teal-800 text-white border-none shadow-xl mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Crown className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Your Pet Life Pillars</h3>
                  <p className="text-xs text-white/70">14 pillars unlocked with Pet Pass • Click to view history</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 md:gap-3">
                {[
                  { id: 'celebrate', name: 'Celebrate', icon: '🎂', path: '/celebrate', color: 'from-pink-400 to-rose-400' },
                  { id: 'dine', name: 'Dine', icon: '🍽️', path: '/dine', color: 'from-amber-400 to-orange-400' },
                  { id: 'stay', name: 'Stay', icon: '🏨', path: '/stay', color: 'from-blue-400 to-indigo-400' },
                  { id: 'travel', name: 'Travel', icon: '✈️', path: '/travel', color: 'from-cyan-400 to-blue-400' },
                  { id: 'care', name: 'Care', icon: '💊', path: '/care', color: 'from-red-400 to-rose-400' },
                  { id: 'enjoy', name: 'Enjoy', icon: '🎾', path: '/enjoy', color: 'from-violet-400 to-purple-400' },
                  { id: 'fit', name: 'Fit', icon: '🏃', path: '/fit', color: 'from-green-400 to-emerald-400' },
                  { id: 'learn', name: 'Learn', icon: '🎓', path: '/learn', color: 'from-teal-400 to-cyan-400' },
                  { id: 'paperwork', name: 'Paperwork', icon: '📄', path: '/paperwork', color: 'from-slate-400 to-gray-500' },
                  { id: 'advisory', name: 'Advisory', icon: '📋', path: '/advisory', color: 'from-gray-400 to-slate-500' },
                  { id: 'emergency', name: 'Emergency', icon: '🚨', path: '/emergency', color: 'from-red-500 to-rose-500' },
                  { id: 'farewell', name: 'Farewell', icon: '🌈', path: '/farewell', color: 'from-rose-400 to-pink-400' },
                  { id: 'adopt', name: 'Adopt', icon: '🐾', path: '/adopt', color: 'from-purple-400 to-violet-400' },
                  { id: 'insure', name: 'Insure', icon: '🛡️', path: '/insure', color: 'from-blue-500 to-cyan-500' },
                  { id: 'community', name: 'Community', icon: '🤝', path: '/community', color: 'from-indigo-400 to-purple-400' },
                  { id: 'shop', name: 'Shop', icon: '🛒', path: '/shop', color: 'from-orange-400 to-amber-400' }
                ].map((pillar) => (
                  <button
                    key={pillar.id}
                    onClick={() => setPillarPopup({ open: true, pillar })}
                    className="group p-2 md:p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all text-center"
                  >
                    <div className={`w-9 h-9 md:w-11 md:h-11 mx-auto rounded-lg bg-gradient-to-br ${pillar.color} flex items-center justify-center text-lg md:text-xl mb-1.5 group-hover:scale-110 transition-transform shadow-lg`}>
                      {pillar.icon}
                    </div>
                    <p className="text-[10px] md:text-xs font-medium text-white/90 truncate">{pillar.name}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card 
                className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-200 bg-gradient-to-br from-purple-50 to-white"
                onClick={() => {
                  // Go directly to unified pet page for first pet
                  if (pets.length > 0) {
                    navigate(`/pet/${pets[0].id}?tab=personality`);
                  } else {
                    navigate('/my-pets');
                  }
                }}
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <PawPrint className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">My Pets</h3>
                <p className="text-sm text-gray-500">{pets.length} active</p>
              </Card>
              
              <Card 
                className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-pink-200 bg-gradient-to-br from-pink-50 to-white"
                onClick={() => window.location.href = '/celebrate'}
              >
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-3">
                  <Cake className="w-5 h-5 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Celebrate</h3>
                <p className="text-sm text-gray-500">Plan a party</p>
              </Card>
              
              <Card 
                className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-200 bg-gradient-to-br from-amber-50 to-white"
                onClick={() => window.location.href = '/products'}
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Shop</h3>
                <p className="text-sm text-gray-500">Browse treats</p>
              </Card>
              
              <Card 
                className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-200 bg-gradient-to-br from-blue-50 to-white"
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Ask Mira</h3>
                <p className="text-sm text-gray-500">AI concierge</p>
              </Card>
            </div>

            {/* 🎫 MEMBERSHIP CARD & STATS GRID */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Tiered Membership Card - Replaces basic loyalty points */}
              <MembershipCardTiers user={user} pet={pets[0]} />

              <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-600">Total Orders</h3>
                <p className="text-4xl font-bold text-gray-900 mt-1">{orders.length}</p>
                <p className="text-sm text-gray-500 mt-2">Last: {orders[0] ? new Date(orders[0].created_at).toLocaleDateString() : 'Never'}</p>
              </Card>

              <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <Button variant="outline" size="sm" className="h-8" onClick={() => {
                    if (pets.length > 0) {
                      navigate(`/pet/${pets[0].id}?tab=personality`);
                    } else {
                      navigate('/my-pets');
                    }
                  }}>
                    Manage
                  </Button>
                </div>
                <h3 className="text-lg font-medium text-gray-600">My Pets</h3>
                <p className="text-4xl font-bold text-gray-900 mt-1">{pets.length}</p>
                <p className="text-sm text-gray-500 mt-2">Active profiles</p>
              </Card>
            </div>
            
            {/* 🎯 ENGAGEMENT WIDGETS ROW */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {/* Pawmoter Score (NPS) */}
              <PawmoterScore user={user} onScoreSubmitted={() => window.location.reload()} />
              
              {/* Social Share Reward */}
              <SocialShareReward user={user} onRewardClaimed={() => window.location.reload()} />
            </div>
            
            {/* 🐕 BREED TIPS ENGINE */}
            {pets.length > 0 && pets[0]?.breed && (
              <div className="mt-6">
                <BreedTipsEngine pet={pets[0]} />
              </div>
            )}
            
            {/* Pet Soul Completion CTA - Show if score is below 80% */}
            {Array.isArray(pets) && pets.length > 0 && (() => {
              // Use the overall_score from the API for consistency
              // This score is calculated on the backend and should be the single source of truth
              const primaryPet = pets[0] || {};
              // Ensure score is capped at 100 to prevent display bugs
              const avgScore = Math.min(100, Math.round(primaryPet?.overall_score || 0));
              
              if (avgScore >= 80) return null;
              
              const remainingPercent = 100 - avgScore;
              
              return (
                <Card className="mt-6 p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-purple-200/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/30 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          Complete {primaryPet.name}&apos;s Pet Soul™
                          <Badge variant="outline" className="text-purple-600 border-purple-200 bg-white">
                            {avgScore}% done
                          </Badge>
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Answer {remainingPercent > 50 ? 'a few more' : 'just a few'} questions to unlock personalised recommendations, 
                          birthday alerts, and care reminders tailored for {primaryPet.name}.
                        </p>
                        
                        {/* Progress bar */}
                        <div className="mt-3 w-full md:w-80">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                              style={{ width: `${avgScore}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{remainingPercent}% remaining to complete</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                      onClick={() => window.location.href = `/pet/${primaryPet.id}`}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Continue Building Soul
                    </Button>
                  </div>
                </Card>
              );
            })()}

            {/* Smart Reorder Widget */}
            {orders.length > 0 && (() => {
              // Analyze past orders to suggest reorder
              const productFrequency = {};
              orders.forEach(order => {
                order.items?.forEach(item => {
                  if (!productFrequency[item.id]) {
                    productFrequency[item.id] = { 
                      ...item, 
                      count: 0, 
                      lastOrdered: order.created_at,
                      totalQuantity: 0
                    };
                  }
                  productFrequency[item.id].count += 1;
                  productFrequency[item.id].totalQuantity += item.quantity || 1;
                  if (new Date(order.created_at) > new Date(productFrequency[item.id].lastOrdered)) {
                    productFrequency[item.id].lastOrdered = order.created_at;
                  }
                });
              });
              
              // Get top 3 most ordered products
              const topProducts = Object.values(productFrequency)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
              
              if (topProducts.length === 0) return null;
              
              // Calculate days since last order
              const lastOrderDate = new Date(orders[0]?.created_at);
              const daysSinceLastOrder = Math.floor((new Date() - lastOrderDate) / (1000 * 60 * 60 * 24));
              
              return (
                <Card className="p-5 mt-6 bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 border-purple-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900">Quick Reorder</h3>
                      <p className="text-xs text-purple-600">
                        {daysSinceLastOrder > 14 
                          ? `It's been ${daysSinceLastOrder} days since your last order!`
                          : `Based on your favourites`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    {topProducts.map((product, idx) => (
                      <div 
                        key={product.id || idx}
                        className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              Ordered {product.count}x • ₹{product.price}
                            </p>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white h-8 px-3"
                          onClick={() => {
                            // Add to cart logic - navigate to product or add directly
                            toast({ 
                              title: '🛒 Added to Cart',
                              description: `${product.name} has been added to your cart!`
                            });
                            // In real implementation, would use cart context
                            navigate('/cakes');
                          }}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full mt-3 text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                    onClick={() => navigate('/cakes')}
                  >
                    Browse All Products
                  </Button>
                </Card>
              );
            })()}
            
            {/* Upcoming Events Widget */}
            {pets.length > 0 && (() => {
              const today = new Date();
              const upcomingEvents = [];
              
              pets.forEach(pet => {
                // Check for upcoming birthdays (within 30 days)
                if (pet.birth_date) {
                  const birthDate = new Date(pet.birth_date);
                  const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                  if (thisYearBirthday < today) {
                    thisYearBirthday.setFullYear(today.getFullYear() + 1);
                  }
                  const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
                  if (daysUntil <= 30) {
                    const age = thisYearBirthday.getFullYear() - birthDate.getFullYear();
                    upcomingEvents.push({
                      type: 'birthday',
                      pet: pet.name,
                      petId: pet.id,
                      date: thisYearBirthday,
                      daysUntil,
                      label: `${pet.name} turns ${age}!`,
                      icon: '🎂',
                      color: 'pink',
                      action: 'Order Birthday Cake',
                      actionUrl: '/celebrate/cakes'
                    });
                  }
                }
                
                // Check for gotcha day / adoption anniversary (within 30 days)
                if (pet.gotcha_date) {
                  const gotchaDate = new Date(pet.gotcha_date);
                  const thisYearGotcha = new Date(today.getFullYear(), gotchaDate.getMonth(), gotchaDate.getDate());
                  if (thisYearGotcha < today) {
                    thisYearGotcha.setFullYear(today.getFullYear() + 1);
                  }
                  const daysUntil = Math.ceil((thisYearGotcha - today) / (1000 * 60 * 60 * 24));
                  if (daysUntil <= 30 && daysUntil > 0) {
                    const years = thisYearGotcha.getFullYear() - gotchaDate.getFullYear();
                    upcomingEvents.push({
                      type: 'gotcha',
                      pet: pet.name,
                      petId: pet.id,
                      date: thisYearGotcha,
                      daysUntil,
                      label: `${years} year${years > 1 ? 's' : ''} with ${pet.name}!`,
                      icon: '🏠',
                      color: 'blue',
                      action: 'Celebrate',
                      actionUrl: '/celebrate'
                    });
                  }
                }
                
                // Check for vaccination due (from health records)
                if (pet.health?.vaccinations) {
                  pet.health.vaccinations.forEach(vax => {
                    if (vax.next_due) {
                      const dueDate = new Date(vax.next_due);
                      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                      if (daysUntil <= 14 && daysUntil >= -7) { // 2 weeks before to 1 week overdue
                        upcomingEvents.push({
                          type: 'vaccination',
                          pet: pet.name,
                          petId: pet.id,
                          date: dueDate,
                          daysUntil,
                          label: `${vax.name} ${daysUntil < 0 ? 'overdue' : 'due'}`,
                          icon: '💉',
                          color: daysUntil < 0 ? 'red' : 'amber',
                          action: 'Book Vet',
                          actionUrl: '/care'
                        });
                      }
                    }
                  });
                }
              });
              
              // Sort by date (soonest first)
              upcomingEvents.sort((a, b) => a.daysUntil - b.daysUntil);
              
              if (upcomingEvents.length === 0) return null;
              
              const colorMap = {
                pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', btn: 'bg-pink-600 hover:bg-pink-700' },
                blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', btn: 'bg-blue-600 hover:bg-blue-700' },
                amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700' },
                red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', btn: 'bg-red-600 hover:bg-red-700' }
              };
              
              return (
                <Card className="mt-6 p-5 border-none shadow-sm bg-gradient-to-r from-amber-50 via-pink-50 to-purple-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
                      <p className="text-xs text-gray-500">Don&apos;t miss these important dates!</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {upcomingEvents.slice(0, 3).map((event, idx) => {
                      const colors = colorMap[event.color] || colorMap.blue;
                      return (
                        <div 
                          key={`${event.type}-${event.pet}-${idx}`}
                          className={`flex items-center justify-between p-3 rounded-lg ${colors.bg} ${colors.border} border`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{event.icon}</span>
                            <div>
                              <p className={`font-medium ${colors.text}`}>{event.label}</p>
                              <p className="text-xs text-gray-500">
                                {event.daysUntil === 0 ? 'Today!' : 
                                 event.daysUntil === 1 ? 'Tomorrow' :
                                 event.daysUntil < 0 ? `${Math.abs(event.daysUntil)} days ago` :
                                 `In ${event.daysUntil} days`}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className={`${colors.btn} text-white text-xs`}
                            onClick={() => navigate(event.actionUrl)}
                          >
                            {event.action}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {upcomingEvents.length > 3 && (
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      +{upcomingEvents.length - 3} more events coming up
                    </p>
                  )}
                </Card>
              );
            })()}

            {/* Smart Reorder removed - pillars now at top */}

            <h3 className="text-xl font-bold mt-10 mb-4 text-gray-900">Recent Activity</h3>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 10).map(order => (
                  <Card 
                    key={order.orderId} 
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      // Navigate to order details or show order modal
                      toast({
                        title: `Order ${order.orderId}`,
                        description: `${order.items?.length || 1} items • ₹${order.total} • Status: ${order.status}`,
                      });
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.orderId}</p>
                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('en-GB')} • {order.items?.length || 1} items</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <p className="font-bold text-gray-900">₹{order.total}</p>
                      <Badge variant={order.status === 'delivered' ? 'success' : 'secondary'} className={order.status === 'delivered' ? 'bg-green-100 text-green-700' : ''}>
                        {order.status}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                ))}
                {orders.length > 10 && (
                  <Button variant="outline" className="w-full mt-4" onClick={() => {
                    // Switch to orders tab by clicking the tab trigger
                    const ordersTab = document.querySelector('[data-value="orders"]');
                    if (ordersTab) ordersTab.click();
                  }}>
                    View All {orders.length} Orders
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
                <p className="text-gray-500 mt-1 mb-4">Treat your furry friend to something special!</p>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href='/cakes'}>
                  Start Shopping
                </Button>
              </div>
            )}
          </TabsContent>

          {/* 🏛️ All Services Tab - All 14 Pillars */}
          <TabsContent value="services" className="animate-in fade-in-50 duration-300">
            <Card className="p-6 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">All Pet Life Services</h3>
                  <p className="text-sm text-gray-500">Access all 14 pillars of pet life with your Pet Pass</p>
                </div>
              </div>
              
              {/* Service Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[
                  { id: 'celebrate', name: 'Celebrate', icon: '🎂', path: '/celebrate', color: 'from-pink-400 to-rose-500', desc: 'Birthdays & parties' },
                  { id: 'dine', name: 'Dine', icon: '🍽️', path: '/dine', color: 'from-amber-400 to-orange-500', desc: 'Pet-friendly dining' },
                  { id: 'stay', name: 'Stay', icon: '🏨', path: '/stay', color: 'from-blue-400 to-indigo-500', desc: 'Boarding & daycare' },
                  { id: 'travel', name: 'Travel', icon: '✈️', path: '/travel', color: 'from-cyan-400 to-blue-500', desc: 'Pet travel services' },
                  { id: 'care', name: 'Care', icon: '💊', path: '/care', color: 'from-red-400 to-rose-500', desc: 'Health & wellness' },
                  { id: 'enjoy', name: 'Enjoy', icon: '🎾', path: '/enjoy', color: 'from-violet-400 to-purple-500', desc: 'Activities & fun' },
                  { id: 'fit', name: 'Fit', icon: '🏃', path: '/fit', color: 'from-green-400 to-emerald-500', desc: 'Fitness & exercise' },
                  { id: 'learn', name: 'Learn', icon: '🎓', path: '/learn', color: 'from-teal-400 to-cyan-500', desc: 'Training & courses' },
                  { id: 'paperwork', name: 'Paperwork', icon: '📄', path: '/paperwork', color: 'from-slate-400 to-gray-500', desc: 'Documents & KCI' },
                  { id: 'advisory', name: 'Advisory', icon: '📋', path: '/advisory', color: 'from-indigo-400 to-blue-500', desc: 'Expert consultations' },
                  { id: 'emergency', name: 'Emergency', icon: '🚨', path: '/emergency', color: 'from-red-500 to-rose-600', desc: '24/7 emergency help' },
                  { id: 'farewell', name: 'Farewell', icon: '🌈', path: '/farewell', color: 'from-purple-400 to-pink-500', desc: 'Memorial services' },
                  { id: 'adopt', name: 'Adopt', icon: '🐾', path: '/adopt', color: 'from-orange-400 to-amber-500', desc: 'Pet adoption' },
                  { id: 'shop', name: 'Shop', icon: '🛒', path: '/shop', color: 'from-emerald-400 to-teal-500', desc: 'Products & supplies' }
                ].map((pillar) => (
                  <button
                    key={pillar.id}
                    onClick={() => navigate(pillar.path)}
                    className="group p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-lg transition-all text-center"
                  >
                    <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                      {pillar.icon}
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">{pillar.name}</p>
                    <p className="text-xs text-gray-500">{pillar.desc}</p>
                  </button>
                ))}
              </div>
              
              {/* Quick Service Links */}
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" onClick={() => navigate('/care')} className="justify-start">
                    <Stethoscope className="w-4 h-4 mr-2" /> Book Vet Visit
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/stay')} className="justify-start">
                    <Home className="w-4 h-4 mr-2" /> Find Boarding
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/celebrate')} className="justify-start">
                    <Cake className="w-4 h-4 mr-2" /> Order Cake
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/emergency')} className="justify-start text-red-600 border-red-200 hover:bg-red-50">
                    🚨 Emergency Help
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 🎁 Rewards Tab - Paw Points Redemption */}
          <TabsContent value="rewards" className="animate-in fade-in-50 duration-300">
            <PawPointsRewards 
              token={token}
              onPointsChange={(newBalance) => {
                // Update local user state with new balance
                // This would ideally update the global user context
              }}
            />
          </TabsContent>

          {/* 🤖 Mira AI Conversations Tab */}
          <TabsContent value="mira" className="animate-in fade-in-50 duration-300">
            <MiraConversationHistory token={token} limit={20} />
          </TabsContent>

          {/* My Requests Content */}
          <TabsContent value="requests" className="animate-in fade-in-50 duration-300">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  My Requests
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setRequestsLoading(true);
                    axios.get(`${API_URL}/api/mira/my-requests`, {
                      headers: { Authorization: `Bearer ${token}` }
                    }).then(res => setMyRequests(res.data.requests || []))
                      .finally(() => setRequestsLoading(false));
                  }}
                  disabled={requestsLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${requestsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {requestsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : myRequests.length > 0 ? (
                <div className="space-y-4">
                  {myRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                request.status_display?.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                                request.status_display?.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                request.status_display?.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                request.status_display?.color === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                                request.status_display?.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {request.status_display?.icon} {request.status_display?.label || request.status}
                            </Badge>
                            <span className="text-xs text-gray-500 font-mono">#{request.id}</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{request.description}</p>
                          {(request.pet_name || request.pet_names?.length > 0) && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <PawPrint className="w-3 h-3" />
                              {request.pet_name || request.pet_names?.join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-500">{request.pillar}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(request.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No active requests</p>
                  <p className="text-sm text-gray-400">
                    Chat with Mira to create booking requests, grooming appointments, and more!
                  </p>
                  <Button 
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                    onClick={() => navigate('/care')}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Talk to Mira
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Orders Content */}
          <TabsContent value="orders">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6">Order History</h3>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.orderId} className="border rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex flex-wrap justify-between items-start gap-4 border-b pb-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Order ID</p>
                          <p className="font-semibold text-gray-900">{order.orderId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="font-medium text-gray-900">₹{order.total}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <Badge variant={order.status === 'delivered' ? 'success' : 'secondary'} className={order.status === 'delivered' ? 'bg-green-100 text-green-700' : ''}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700 flex items-center gap-2">
                              <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-xs font-medium">{item.quantity}</span>
                              {item.name}
                            </span>
                            <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      {order.delivery?.method === 'pickup' && (
                        <div className="mt-4 pt-3 border-t text-sm text-blue-600 bg-blue-50 p-2 rounded-lg flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Store Pickup: {order.delivery.city}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No orders found.</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Dining Tab */}
          <TabsContent value="dining">
            <div className="space-y-6">
              {/* Dining Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-orange-500 to-red-500 text-white">
                  <UtensilsCrossed className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{diningHistory.reservations?.items?.length || 0}</p>
                  <p className="text-sm opacity-90">Reservations</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Users className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{diningHistory.visits?.items?.length || 0}</p>
                  <p className="text-sm opacity-90">Pet Buddy Visits</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <MessageSquare className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{diningHistory.meetups?.items?.length || 0}</p>
                  <p className="text-sm opacity-90">Meetup Requests</p>
                </Card>
              </div>

              {/* Upcoming Reservations */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                    My Reservations
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dine')}>
                    Book New
                  </Button>
                </div>
                
                {diningHistory.reservations?.upcoming?.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500">Upcoming</h4>
                    {diningHistory.reservations.upcoming.map((res) => (
                      <div key={res.id} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{res.restaurant_name}</h4>
                            <p className="text-sm text-gray-500">{res.restaurant_area}, {res.restaurant_city}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {res.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" /> {res.time}
                              </span>
                            </div>
                          </div>
                          <Badge className={res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {res.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No upcoming reservations</p>
                    <Button className="mt-4 bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/dine')}>
                      Explore Restaurants
                    </Button>
                  </div>
                )}

                {/* Past Reservations */}
                {diningHistory.reservations?.past?.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Past Reservations</h4>
                    <div className="space-y-2">
                      {diningHistory.reservations.past.slice(0, 5).map((res) => (
                        <div key={res.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium">{res.restaurant_name}</p>
                            <p className="text-sm text-gray-500">{res.date}</p>
                          </div>
                          <Badge variant="outline" className="text-gray-500">{res.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Pet Buddy Visits */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Pet Buddy Visits
                  </h3>
                </div>
                
                {diningHistory.visits?.upcoming?.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500">Scheduled</h4>
                    {diningHistory.visits.upcoming.map((visit) => (
                      <div key={visit.id} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{visit.restaurant_name}</h4>
                            <p className="text-sm text-gray-500">{visit.restaurant_area}, {visit.restaurant_city}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {visit.date}
                              </span>
                              <Badge variant="outline" className="capitalize">{visit.time_slot}</Badge>
                            </div>
                            {visit.notes && <p className="text-sm text-purple-600 mt-2">&quot;{visit.notes}&quot;</p>}
                          </div>
                          {visit.looking_for_buddies && (
                            <Badge className="bg-purple-100 text-purple-700">Looking for Buddies</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No scheduled visits</p>
                    <p className="text-sm text-gray-400 mt-1">Schedule a visit and meet other pet parents!</p>
                  </div>
                )}
              </Card>

              {/* Meetup Requests */}
              {diningHistory.meetups?.pending?.length > 0 && (
                <Card className="p-6 border-purple-200 bg-purple-50">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-purple-500" />
                    Pending Meetup Requests
                  </h3>
                  <div className="space-y-3">
                    {diningHistory.meetups.pending.map((meetup) => (
                      <div key={meetup.id} className="p-4 bg-white rounded-lg border">
                        <p className="font-medium">Meetup at {meetup.restaurant_name}</p>
                        <p className="text-sm text-gray-500">{meetup.visit_date}</p>
                        {meetup.message && <p className="text-sm text-gray-600 mt-2">&quot;{meetup.message}&quot;</p>}
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">Accept</Button>
                          <Button size="sm" variant="outline" className="text-red-600">Decline</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Celebrations Tab */}
          <TabsContent value="celebrations">
            <div className="space-y-6">
              {/* Celebration Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-pink-500 to-purple-500 text-white">
                  <Cake className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{celebrationOrders.length}</p>
                  <p className="text-sm opacity-90">Total Orders</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <Gift className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{(Array.isArray(pets) ? pets : []).filter(p => p.birth_date).length}</p>
                  <p className="text-sm opacity-90">Pet Birthdays Set</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
                  <Star className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{user?.loyalty_points || 0}</p>
                  <p className="text-sm opacity-90">Loyalty Points</p>
                </Card>
              </div>

              {/* Recent Celebration Orders */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Cake className="w-5 h-5 text-pink-500" />
                    Celebration Orders
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => navigate('/cakes')}>
                    Order Cake
                  </Button>
                </div>

                {celebrationOrders.length > 0 ? (
                  <div className="space-y-3">
                    {celebrationOrders.slice(0, 5).map((order) => (
                      <div key={order.orderId} className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{order.orderId}</h4>
                            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                            <div className="mt-2 space-y-1">
                              {order.items?.slice(0, 2).map((item, idx) => (
                                <p key={idx} className="text-sm text-gray-600">{item.name} x{item.quantity}</p>
                              ))}
                              {order.items?.length > 2 && (
                                <p className="text-xs text-gray-400">+{order.items.length - 2} more items</p>
                              )}
                            </div>
                          </div>
                          <Badge className={order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Cake className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No celebration orders yet</p>
                    <Button className="mt-4 bg-pink-500 hover:bg-pink-600" onClick={() => navigate('/cakes')}>
                      Order Your First Cake
                    </Button>
                  </div>
                )}
              </Card>

              {/* Upcoming Pet Birthdays */}
              <Card className="p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Upcoming Pet Birthdays
                </h3>
                <div className="space-y-3">
                  {pets.filter(p => p.birth_date).map((pet) => {
                    const birthday = new Date(pet.birth_date);
                    const today = new Date();
                    const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
                    if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
                    const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={pet.id} className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PetAvatarMini pet={pet} />
                          <div>
                            <p className="font-medium text-gray-900">{pet.name}</p>
                            <p className="text-xs text-gray-500">{birthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <Badge className={daysUntil <= 7 ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}>
                          {daysUntil <= 7 ? '🎂 This Week!' : `${daysUntil} days`}
                        </Badge>
                      </div>
                    );
                  })}
                  {pets.filter(p => p.birth_date).length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Add your pet&apos;s birthday to get special offers!
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Stay Tab */}
          <TabsContent value="stay">
            <div className="space-y-6">
              {/* Stay Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-green-500 to-teal-500 text-white">
                  <Home className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{stayHistory.bookings?.length || 0}</p>
                  <p className="text-sm opacity-90">Total Bookings</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <Calendar className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{stayHistory.upcoming?.length || 0}</p>
                  <p className="text-sm opacity-90">Upcoming</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Star className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{stayHistory.past?.length || 0}</p>
                  <p className="text-sm opacity-90">Completed</p>
                </Card>
              </div>

              {/* Stay Bookings */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Home className="w-5 h-5 text-green-500" />
                    My Stay Bookings
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => navigate('/stay')}>
                    Book Stay
                  </Button>
                </div>

                {stayHistory.upcoming?.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-500">Upcoming Stays</h4>
                    {stayHistory.upcoming.map((booking) => (
                      <div key={booking.id || booking.booking_id} className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{booking.property_name || booking.hotel_name}</h4>
                            <p className="text-sm text-gray-500">{booking.location || booking.city}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {booking.check_in} - {booking.check_out}
                              </span>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">{booking.status || 'Confirmed'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Home className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No upcoming stays</p>
                    <Button className="mt-4 bg-green-500 hover:bg-green-600" onClick={() => navigate('/stay')}>
                      Explore Pet-Friendly Stays
                    </Button>
                  </div>
                )}

                {/* Past Stays */}
                {stayHistory.past?.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Past Stays</h4>
                    <div className="space-y-2">
                      {stayHistory.past.slice(0, 3).map((booking) => (
                        <div key={booking.id || booking.booking_id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium">{booking.property_name || booking.hotel_name}</p>
                            <p className="text-sm text-gray-500">{booking.check_in}</p>
                          </div>
                          <Badge variant="outline" className="text-gray-500">Completed</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Travel Tab */}
          <TabsContent value="travel">
            <div className="space-y-6">
              {/* Travel Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Plane className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{travelHistory.requests?.length || 0}</p>
                  <p className="text-sm opacity-90">Total Requests</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500 to-violet-500 text-white">
                  <Clock className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{travelHistory.upcoming?.length || 0}</p>
                  <p className="text-sm opacity-90">Upcoming</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <Star className="w-5 h-5 mb-2" />
                  <p className="text-2xl font-bold">{travelHistory.requests?.filter(r => r.status === 'completed').length || 0}</p>
                  <p className="text-sm opacity-90">Completed</p>
                </Card>
              </div>

              {/* Travel Requests */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Plane className="w-5 h-5 text-blue-500" />
                    My Travel Requests
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => navigate('/travel')}>
                    New Request
                  </Button>
                </div>

                {travelHistory.requests?.length > 0 ? (
                  <div className="space-y-3">
                    {travelHistory.requests.slice(0, 5).map((request) => (
                      <div key={request.request_id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{request.request_id}</h4>
                              <Badge variant="outline" className="text-xs">{request.travel_type_name}</Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {request.journey?.pickup_city} → {request.journey?.drop_city}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> {request.journey?.travel_date}
                              </span>
                              <span className="flex items-center gap-1">
                                <PawPrint className="w-4 h-4" /> {request.pet?.name}
                              </span>
                            </div>
                          </div>
                          <Badge className={
                            request.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            request.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Plane className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No travel requests yet</p>
                    <p className="text-sm text-gray-400 mt-1">Plan your pet&apos;s next adventure!</p>
                    <Button className="mt-4 bg-blue-500 hover:bg-blue-600" onClick={() => navigate('/travel')}>
                      Plan Travel
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Autoship Tab */}
          <TabsContent value="autoship">
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <RefreshCw className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">My Autoship</h3>
                    <p className="text-sm text-gray-500">Manage your subscriptions</p>
                  </div>
                </div>
                <a href="/autoship" className="text-sm text-purple-600 hover:underline">Learn about Autoship</a>
              </div>

              {autoships.length > 0 ? (
                <div className="space-y-4">
                  {autoships.map((sub) => (
                    <div key={sub.id} className="border rounded-xl p-4 hover:border-purple-200 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <img 
                            src={sub.product?.image || '/placeholder.jpg'} 
                            alt={sub.product?.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{sub.product?.name}</h4>
                            <p className="text-sm text-gray-500">{sub.variant || 'Standard'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={sub.status === 'active' ? 'bg-green-100 text-green-700' : sub.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}>
                                {sub.status}
                              </Badge>
                              <span className="text-sm text-gray-500">Every {sub.frequency} weeks</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{sub.price}</p>
                          <p className="text-xs text-gray-500 mt-1">Order #{sub.order_count || 1}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          Next shipment: {sub.next_shipment_date ? new Date(sub.next_shipment_date).toLocaleDateString() : 'Not scheduled'}
                        </div>
                        <div className="flex gap-2">
                          {sub.status === 'active' ? (
                            <Button size="sm" variant="outline" className="h-8">
                              <Pause className="w-3 h-3 mr-1" /> Pause
                            </Button>
                          ) : sub.status === 'paused' ? (
                            <Button size="sm" variant="outline" className="h-8">
                              <Play className="w-3 h-3 mr-1" /> Resume
                            </Button>
                          ) : null}
                          <Button size="sm" variant="outline" className="h-8 text-gray-600">
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Discount info */}
                      {sub.order_count && (
                        <div className="mt-3 bg-green-50 rounded-lg p-3 text-sm">
                          <span className="font-medium text-green-700">
                            🎁 {sub.order_count >= 6 ? '50% off' : sub.order_count >= 4 ? '40% off' : '25% off'} applied on this order!
                          </span>
                          {sub.order_count < 6 && (
                            <span className="text-green-600 ml-2">
                              ({6 - sub.order_count} more orders to unlock 50% off)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No active subscriptions</h4>
                  <p className="text-gray-500 mb-6">Subscribe to your dog&apos;s favourites and save up to 50%!</p>
                  <div className="bg-blue-50 rounded-xl p-4 max-w-md mx-auto text-left">
                    <p className="font-medium text-blue-900 mb-2">Autoship Benefits:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• 25% off your first order (max ₹300)</li>
                      <li>• 40% off on 4th & 5th orders</li>
                      <li>• 50% off on 6th & 7th orders</li>
                      <li>• Skip, pause or cancel anytime</li>
                    </ul>
                  </div>
                  <Button className="mt-6 bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href='/treats'}>
                    Browse Autoship Products
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Reviews Content */}
          <TabsContent value="reviews">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">My Reviews</h3>
                <Badge variant="outline">{reviews.length} Reviews</Badge>
              </div>

              {/* Review Form Modal */}
              {showReviewForm && selectedProduct && (
                <Card className="p-6 border-2 border-purple-200 bg-purple-50/50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {selectedProduct.image && (
                        <img src={selectedProduct.image} alt={selectedProduct.name} className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div>
                        <h4 className="font-semibold">{editingReview ? 'Edit Review' : 'Write a Review'}</h4>
                        <p className="text-sm text-gray-600">{selectedProduct.name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setShowReviewForm(false); setEditingReview(null); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Your Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Display Name</label>
                      <Input
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name (as shown on review)"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1 block">Your Review</label>
                      <Textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        rows={4}
                        required
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={reviewLoading} className="bg-purple-600 hover:bg-purple-700">
                        {reviewLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : editingReview ? 'Update Review' : 'Submit Review'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => { setShowReviewForm(false); setEditingReview(null); }}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Products to Review */}
              {reviewableProducts.length > 0 && !showReviewForm && (
                <Card className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Products You Can Review
                  </h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reviewableProducts.slice(0, 6).map((product) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <Button
                            size="sm"
                            variant="link"
                            className="p-0 h-auto text-purple-600"
                            onClick={() => startNewReview(product)}
                          >
                            Write Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Existing Reviews */}
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-semibold">Your Reviews</h4>
                  {reviews.map((review) => (
                    <Card key={review.id} className="p-4">
                      <div className="flex items-start gap-4">
                        {review.product_image && (
                          <img src={review.product_image} alt={review.product_name} className="w-16 h-16 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{review.product_name}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                                <span className="text-sm text-gray-500 ml-2">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditReview(review)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteReview(review.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-600 mt-2">{review.comment}</p>
                          {review.status === 'pending' && (
                            <Badge variant="outline" className="mt-2 text-yellow-600 border-yellow-300">Pending Approval</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : reviewableProducts.length === 0 && (
                <Card className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700">No Reviews Yet</h4>
                  <p className="text-gray-500 mt-1">
                    Place an order to leave reviews for products you&apos;ve purchased!
                  </p>
                  <Button onClick={() => navigate('/all')} className="mt-4 bg-purple-600 hover:bg-purple-700">
                    Start Shopping
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Pets Content */}
          <TabsContent value="pets">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">My Pets</h3>
              <Button onClick={() => window.location.href='/my-pets'}>Manage Pets</Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {pets.map(pet => (
                <Card key={pet.id} className="p-6 relative overflow-hidden group hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <PetAvatar pet={pet} size="lg" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                      <p className="text-gray-600">{pet.breed} • {pet.age_years || '?'} years</p>
                      {pet.soul?.persona && <Badge className="mt-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">{pet.soul.persona}</Badge>}
                    </div>
                  </div>
                  
                  {/* Soul Score Progress */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Soul Score</span>
                      <span className="text-xs font-bold text-purple-600">{Math.min(100, Math.round(pet.overall_score || 0))}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, pet.overall_score || 0)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Birthday</p>
                      <p className="font-medium text-gray-900 text-sm">{pet.birth_date || 'Not set'}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-semibold uppercase mb-1">Gotcha Day</p>
                      <p className="font-medium text-gray-900 text-sm">{pet.gotcha_date || 'Not set'}</p>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => window.location.href=`/pet-vault/${pet.id}`}
                    >
                      <Stethoscope className="w-4 h-4 mr-1" /> Health Vault
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      onClick={() => window.location.href=`/pet/${pet.id}`}
                    >
                      <Sparkles className="w-4 h-4 mr-1" /> Pet Soul
                    </Button>
                  </div>
                </Card>
              ))}
              
              <Card 
                className="p-6 flex flex-col items-center justify-center border-dashed border-2 cursor-pointer hover:bg-gray-50 transition-colors min-h-[200px]"
                onClick={() => window.location.href='/my-pets'}
              >
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                  <PawPrint className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900">Add New Pet</h3>
                <p className="text-gray-500 text-sm text-center mt-1">Create a profile for your furry friend</p>
              </Card>
            </div>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-6">Saved Addresses</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {savedAddresses.map((addr, idx) => (
                  <div key={idx} className="border p-4 rounded-xl hover:border-purple-200 transition-colors">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p className="font-medium text-gray-900">{addr.city}</p>
                        <p className="text-sm text-gray-600 mt-1">{addr.address}</p>
                        <p className="text-sm text-gray-500">{addr.pincode}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {savedAddresses.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No addresses saved yet. They will be added when you place an order.
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            {/* 🧠 MIRA CAN UNDERSTAND - Quick access to voice commands on mobile */}
            <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border border-purple-200 md:hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Mira Can Understand</h3>
                  <p className="text-xs text-gray-500">Hands-free voice commands</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Order treats', 'Book grooming', 'Next vaccination?', 'Soul score', 'Recommendations'].map((cmd) => (
                  <span 
                    key={cmd}
                    className="px-3 py-1.5 bg-white rounded-full text-xs font-medium text-purple-700 border border-purple-200"
                  >
                    🎤 "{cmd}"
                  </span>
                ))}
              </div>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraVoice'))}
                className="w-full mt-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Try Mira Voice Now
              </button>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" /> Profile Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Full Name</label>
                    <Input defaultValue={user.name} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                    <Input defaultValue={user.email} disabled className="bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
                    <Input defaultValue={user.phone} />
                  </div>
                  <Button className="mt-2 bg-purple-600 hover:bg-purple-700">Update Profile</Button>
                </div>
              </Card>

              <div className="space-y-6">
                {/* Communication Channels */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" /> Communication Channels
                    {settingsLoading && <span className="text-xs text-gray-400 ml-2">Saving...</span>}
                    {settingsSaved && <span className="text-xs text-green-500 ml-2">✓ Saved</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">Choose how you&apos;d like to hear from us</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500" /> Email
                        </label>
                        <p className="text-xs text-gray-500">Order confirmations & updates</p>
                      </div>
                      <Switch checked={settings.email} onCheckedChange={() => handleSettingChange('email')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
                        </label>
                        <p className="text-xs text-gray-500">Quick updates & reminders</p>
                      </div>
                      <Switch checked={settings.whatsapp} onCheckedChange={() => handleSettingChange('whatsapp')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-500" /> SMS
                        </label>
                        <p className="text-xs text-gray-500">Text message alerts</p>
                      </div>
                      <Switch checked={settings.sms} onCheckedChange={() => handleSettingChange('sms')} />
                    </div>
                  </div>
                </Card>

                {/* Notification Types */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-purple-600" /> Notification Preferences
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">What would you like to be notified about?</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">📦 Order Updates</label>
                        <p className="text-xs text-gray-500">Shipping, delivery & status changes</p>
                      </div>
                      <Switch checked={settings.order_updates} onCheckedChange={() => handleSettingChange('order_updates')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">🎁 Promotions & Offers</label>
                        <p className="text-xs text-gray-500">Exclusive deals & new launches</p>
                      </div>
                      <Switch checked={settings.promotional} onCheckedChange={() => handleSettingChange('promotional')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">🎂 Celebration Reminders</label>
                        <p className="text-xs text-gray-500">Pet birthdays & gotcha days</p>
                      </div>
                      <Switch checked={settings.celebration_reminders} onCheckedChange={() => handleSettingChange('celebration_reminders')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">💊 Health Reminders</label>
                        <p className="text-xs text-gray-500">Vaccination & vet appointment reminders</p>
                      </div>
                      <Switch checked={settings.health_reminders} onCheckedChange={() => handleSettingChange('health_reminders')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">🐾 Community Updates</label>
                        <p className="text-xs text-gray-500">Events, meetups & pawrent activities</p>
                      </div>
                      <Switch checked={settings.community_updates} onCheckedChange={() => handleSettingChange('community_updates')} />
                    </div>
                  </div>
                </Card>

                {/* PWA Push Notifications */}
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-blue-600" /> Push Notifications
                    <Badge className="bg-blue-100 text-blue-700 text-xs">PWA</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Get instant notifications on your device - even when the app is closed. Never miss an update!
                  </p>
                  
                  <div className="space-y-4">
                    {!isPushSupported ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <Smartphone className="w-4 h-4 inline mr-1" />
                          Push notifications require a modern browser. Try Chrome, Firefox, or Edge.
                        </p>
                      </div>
                    ) : pushPermission === 'denied' ? (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          🚫 Notifications are blocked. Please enable them in your browser settings.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="space-y-0.5">
                            <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              <Bell className="w-4 h-4 text-blue-500" />
                              Enable Push Notifications
                            </label>
                            <p className="text-xs text-gray-500">Receive instant alerts on your device</p>
                          </div>
                          <Switch 
                            checked={isPushSubscribed}
                            disabled={pushLoading}
                            onCheckedChange={async (checked) => {
                              if (checked) {
                                const success = await subscribeToPush({
                                  soul_whisper: settings.soul_whisper,
                                  order_updates: settings.order_updates,
                                  concierge_updates: true
                                });
                                if (success) {
                                  toast({ title: '🔔 Notifications enabled!', description: "You'll now receive instant updates" });
                                }
                              } else {
                                const success = await unsubscribeFromPush();
                                if (success) {
                                  toast({ title: 'Notifications disabled', description: 'You can re-enable anytime' });
                                }
                              }
                            }}
                          />
                        </div>
                        
                        {isPushSubscribed && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-green-800 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Notifications Active
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  You'll receive Soul Whispers™, order updates & concierge® replies
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-700 border-green-300 hover:bg-green-100"
                                onClick={async () => {
                                  const sent = await sendTestNotification();
                                  if (sent) {
                                    toast({ title: '📬 Test sent!', description: 'Check your notifications' });
                                  }
                                }}
                              >
                                Test 🔔
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Card>

                {/* Soul Whisper™ Settings - Premium Feature */}
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" /> Soul Whisper™
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Pet Pass</Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Receive gentle daily reminders to deepen your bond with your pet. One soul question at a time, delivered via WhatsApp.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Enable/Disable */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          Enable Soul Whisper
                        </label>
                        <p className="text-xs text-gray-500">Daily soul questions via WhatsApp</p>
                      </div>
                      <Switch 
                        checked={settings.soul_whisper} 
                        onCheckedChange={() => handleSettingChange('soul_whisper')} 
                      />
                    </div>
                    
                    {/* Frequency Selection */}
                    {settings.soul_whisper && (
                      <>
                        <div className="p-3 bg-white rounded-lg border">
                          <label className="text-sm font-medium text-gray-900 mb-2 block">Frequency</label>
                          <div className="flex gap-2">
                            {[
                              { value: 'daily', label: 'Daily', icon: '☀️' },
                              { value: 'twice_weekly', label: '2x Week', icon: '📅' },
                              { value: 'weekly', label: 'Weekly', icon: '📆' }
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setSettings(prev => ({ ...prev, soul_whisper_frequency: opt.value }));
                                  handleSettingChange('soul_whisper_frequency', opt.value);
                                }}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                  settings.soul_whisper_frequency === opt.value
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {opt.icon} {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Preferred Time */}
                        <div className="p-3 bg-white rounded-lg border">
                          <label className="text-sm font-medium text-gray-900 mb-2 block">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Preferred Time
                          </label>
                          <select 
                            className="w-full p-2 border rounded-lg text-sm"
                            value={settings.soul_whisper_time}
                            onChange={(e) => {
                              setSettings(prev => ({ ...prev, soul_whisper_time: e.target.value }));
                              handleSettingChange('soul_whisper_time', e.target.value);
                            }}
                          >
                            <option value="08:00">8:00 AM - Early Bird 🌅</option>
                            <option value="10:00">10:00 AM - Morning ☀️</option>
                            <option value="14:00">2:00 PM - Afternoon 🌤️</option>
                            <option value="18:00">6:00 PM - Evening 🌆</option>
                            <option value="20:00">8:00 PM - Night 🌙</option>
                          </select>
                        </div>
                        
                        {/* Preview */}
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700 font-medium mb-2">📱 Preview Message:</p>
                          <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-green-500">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Soul Whisper for {pets[0]?.name || 'your pet'} 💜</span>
                              <br />
                              <span className="text-gray-600 italic">&quot;What&apos;s {pets[0]?.name || 'your pet'}&apos;s favourite spot in the house?&quot;</span>
                              <br />
                              <span className="text-xs text-purple-600">Tap to answer →</span>
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* Privacy & Security */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" /> Privacy & Security
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <label className="text-sm font-medium text-gray-900">Share Pet Data</label>
                        <p className="text-xs text-gray-500">Allow Mira to personalize recommendations</p>
                      </div>
                      <Switch checked={settings.shareData} onCheckedChange={() => handleSettingChange('shareData')} />
                    </div>
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full justify-start text-left">
                        <Lock className="w-4 h-4 mr-2" /> Change Password
                      </Button>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-gray-400">
                        By using this account, you agree to our <a href="/terms-of-service" className="text-purple-600 hover:underline">Terms & Conditions</a>.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Pillar Popup Modal */}
        {pillarPopup.open && pillarPopup.pillar && (
          <PillarPopup 
            pillar={pillarPopup.pillar}
            onClose={() => setPillarPopup({ open: false, pillar: null })}
            onExplore={(path) => navigate(path)}
            data={{
              celebrationOrders,
              diningHistory,
              stayHistory,
              travelHistory,
              orders
            }}
          />
        )}
      </div>
      
      {/* Mobile Bottom Navigation - Pet Life OS */}
      <MobileNavBar 
        onPulseClick={() => setShowVoiceAssistant(true)}
      />
      
      {/* Extra bottom padding for mobile nav */}
      <div className="h-24 md:hidden" />
    </div>
  );
};

export default MemberDashboard;
