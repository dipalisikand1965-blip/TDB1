import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  ShoppingBag, PawPrint, Star, User, LogOut, Package, 
  MapPin, Settings, Lock, Bell, Shield, Phone, Mail, MessageCircle,
  RefreshCw, Calendar, Pause, Play, X, MessageSquare, Edit2, Trash2, Loader2,
  UtensilsCrossed, Users, Clock, Stethoscope, Sparkles, Home, Plane, Cake, Gift, Crown, Heart,
  ChevronRight, Trophy, Zap, Target, Flame, Award, Medal, CheckCircle2, ArrowRight, TrendingUp, Wallet,
  BellRing, Smartphone, HelpCircle, Plus, Minus, History
} from 'lucide-react';
import axios from 'axios';
import { toast } from '../hooks/use-toast';
import { API_URL } from '../utils/api';
import PetAvatar from '../components/PetAvatar';

// Lazy load heavy components to improve initial render
const PawPointsRewards = lazy(() => import('../components/PawPointsRewards'));
const MiraConversationHistory = lazy(() => import('../components/MiraConversationHistory'));
const SoulExplainerVideo = lazy(() => import('../components/SoulExplainerVideo').then(m => ({ default: m.default })));

// Push notifications hook
import usePushNotifications from '../hooks/usePushNotifications';

// Extracted dashboard components
import { 
  QuickScoreBoost, 
  GamificationBanner, 
  ACHIEVEMENTS, 
  TIER_COLORS, 
  triggerCelebration 
} from '../components/dashboard';

// First Visit Tour
import { useTour } from '../components/FirstVisitTour';

// Push Notification Banner - lazy loaded
const PushNotificationBanner = lazy(() => import('../components/PushNotificationBanner'));

// Loading fallback for lazy components
const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
  </div>
);

import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import usePullToRefresh from '../hooks/usePullToRefresh';

// Voice Quick Actions
import VoiceQuickActions from '../components/VoiceQuickActions';

// ============================================
// LAZY-LOADED TAB COMPONENTS
// These are now in separate files for better performance
// ============================================
const OverviewTab = lazy(() => import('../components/dashboard/tabs/OverviewTab'));
const ServicesTab = lazy(() => import('../components/dashboard/tabs/ServicesTab'));
const OrdersTab = lazy(() => import('../components/dashboard/tabs/OrdersTab'));
const PetsTab = lazy(() => import('../components/dashboard/tabs/PetsTab'));
const RequestsTab = lazy(() => import('../components/dashboard/tabs/RequestsTab'));
const SettingsTab = lazy(() => import('../components/dashboard/tabs/SettingsTab'));
const DiningTab = lazy(() => import('../components/dashboard/tabs/DiningTab'));
const CelebrationsTab = lazy(() => import('../components/dashboard/tabs/CelebrationsTab'));
const StayTab = lazy(() => import('../components/dashboard/tabs/StayTab'));
const TravelTab = lazy(() => import('../components/dashboard/tabs/TravelTab'));
const AutoshipTab = lazy(() => import('../components/dashboard/tabs/AutoshipTab'));
const ReviewsTab = lazy(() => import('../components/dashboard/tabs/ReviewsTab'));
const AddressesTab = lazy(() => import('../components/dashboard/tabs/AddressesTab'));
const RewardsTab = lazy(() => import('../components/dashboard/tabs/RewardsTab'));
const MiraTab = lazy(() => import('../components/dashboard/tabs/MiraTab'));
const DocumentsTab = lazy(() => import('../components/dashboard/tabs/DocumentsTab'));

// ============================================
// 🏛️ PILLAR POPUP COMPONENT
// Shows usage history and stats for each pillar
// ============================================
const PillarPopup = ({ pillar, onClose, onExplore, data }) => {
  if (!pillar) return null;
  
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
        
        <div className="grid grid-cols-3 gap-px bg-gray-100 border-b">
          {pillarData.stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
        
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
        
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
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

// ============================================
// 📊 PAW POINTS BREAKDOWN MODAL
// ============================================
const PawPointsBreakdownModal = ({ open, onClose, history, loading, totalPoints }) => {
  if (!open) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Paw Points History
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white mb-4">
          <p className="text-sm opacity-90">Current Balance</p>
          <p className="text-3xl font-bold">{totalPoints?.toLocaleString() || 0} points</p>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : history.length > 0 ? (
            history.map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {tx.type === 'earn' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-semibold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.points}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// 🎯 MAIN DASHBOARD COMPONENT
// ============================================
const MemberDashboard = () => {
  const { user, logout, token, loading: authLoading, refreshUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  // Core State
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
  const [showSoulExplainer, setShowSoulExplainer] = useState(false);
  
  // Tab and Pet Selection State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPetId, setSelectedPetId] = useState(null);
  
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
  
  // Settings State
  const [settings, setSettings] = useState({
    email: true,
    whatsapp: false,
    sms: false,
    push_notifications: false,
    order_updates: true,
    promotional: true,
    celebration_reminders: true,
    health_reminders: true,
    community_updates: false,
    soul_whisper: true,
    soul_whisper_frequency: 'daily',
    soul_whisper_time: '10:00',
    shareData: false
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  
  // Pillar Popup State
  const [pillarPopup, setPillarPopup] = useState({ open: false, pillar: null });
  
  // My Requests (Mira Tickets) State
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // Paw Points State
  const [showPawPointsBreakdown, setShowPawPointsBreakdown] = useState(false);
  const [pawPointsHistory, setPawPointsHistory] = useState([]);
  const [pawPointsLoading, setPawPointsLoading] = useState(false);
  
  // Voice Quick Actions
  const [showVoiceActions, setShowVoiceActions] = useState(false);
  
  // Tour
  const { showTour, startTour, endTour } = useTour();
  
  // Achievements for rewards tab
  const [achievements, setAchievements] = useState([]);

  // Pull-to-Refresh Handler
  const handlePullToRefresh = useCallback(async () => {
    if (!token || !user?.id) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/engagement/sync/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        if (response.data.pets) setPets(response.data.pets);
        if (response.data.recent_orders) setOrders(response.data.recent_orders);
        
        try {
          await axios.post(`${API_URL}/api/engagement/streak/${user.id}/action?action_type=pet_update`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {
          // Silent fail for streak tracking
        }
      }
      
      toast({ title: 'Refreshed! ✨', description: 'Your data is up to date' });
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [token, user?.id]);

  // Pull-to-Refresh Hook
  const { isPulling, pullProgress, isRefreshing } = usePullToRefresh(handlePullToRefresh, {
    enabled: typeof window !== 'undefined' && window.innerWidth < 768
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);
  
  // Listen for openSoulExplainer event
  useEffect(() => {
    const handleOpenExplainer = () => setShowSoulExplainer(true);
    window.addEventListener('openSoulExplainer', handleOpenExplainer);
    return () => window.removeEventListener('openSoulExplainer', handleOpenExplainer);
  }, []);

  // Main data fetching effect
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
        
        // Filter celebration orders
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
        
        // Check for achievement unlocks
        const loadedPets = petsRes.data.pets || [];
        if (loadedPets.length > 0) {
          const primaryPet = loadedPets[0];
          const score = Math.min(100, primaryPet.overall_score || 0);
          
          const celebratedKey = `celebrated_milestones_${primaryPet.id}`;
          const celebrated = JSON.parse(localStorage.getItem(celebratedKey) || '[]');
          
          const milestones = [
            { threshold: 25, name: 'Soul Seeker', icon: '🔍' },
            { threshold: 50, name: 'Soul Explorer', icon: '🧭' },
            { threshold: 75, name: 'Soul Guardian', icon: '🛡️' },
            { threshold: 100, name: 'Soul Master', icon: '👑' }
          ];
          
          const newMilestones = milestones.filter(m => 
            score >= m.threshold && !celebrated.includes(m.threshold)
          );
          
          if (newMilestones.length > 0) {
            const highest = newMilestones[newMilestones.length - 1];
            setTimeout(() => {
              triggerCelebration(highest.threshold === 100 ? 'heavy' : 'medium');
              toast({
                title: `🎉 Achievement Unlocked!`,
                description: `${highest.icon} ${highest.name} - ${primaryPet.name} has reached ${highest.threshold}% Soul completion!`,
                duration: 6000
              });
            }, 1000);
            
            localStorage.setItem(celebratedKey, JSON.stringify([
              ...celebrated,
              ...newMilestones.map(m => m.threshold)
            ]));
          }
          
          // Set achievements for rewards tab
          setAchievements(milestones.map(m => ({
            ...m,
            id: m.name.toLowerCase().replace(' ', '_'),
            name: m.name,
            description: `Reach ${m.threshold}% Pet Soul completion`,
            unlocked_at: score >= m.threshold ? new Date().toISOString() : null
          })));
        }
        
        // Sync achievement points
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
              await refreshUser();
            }
          }
        } catch (err) {
          console.error('Failed to sync achievements:', err);
        }
        
        // Extract reviewable products
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
  }, [token, user, refreshUser]);

  // Fetch My Requests
  useEffect(() => {
    const fetchMyRequests = async () => {
      if (!token || !user) return;
      
      setRequestsLoading(true);
      try {
        const [requestsRes, bookingsRes] = await Promise.all([
          axios.get(`${API_URL}/api/mira/my-requests`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { requests: [] } })),
          axios.get(`${API_URL}/api/user/bookings?email=${encodeURIComponent(user.email)}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { bookings: [] } }))
        ]);
        
        const requests = requestsRes.data.requests || [];
        const bookings = (bookingsRes.data.bookings || []).map(b => ({
          id: b.ticket_id || b.id,
          description: `${b.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service'} booking${b.date ? ` for ${b.date}` : ''}${b.time ? ` at ${b.time}` : ''}`,
          status: b.status,
          status_display: {
            label: b.status === 'pending' ? 'Pending Confirmation' : 
                   b.status === 'confirmed' ? 'Confirmed' :
                   b.status === 'completed' ? 'Completed' : 
                   b.status === 'cancelled' ? 'Cancelled' : b.status,
            color: b.status === 'pending' ? 'yellow' : 
                   b.status === 'confirmed' ? 'green' : 
                   b.status === 'completed' ? 'blue' : 
                   b.status === 'cancelled' ? 'red' : 'gray',
            icon: b.status === 'pending' ? '⏳' : 
                  b.status === 'confirmed' ? '✅' : 
                  b.status === 'completed' ? '🎉' : 
                  b.status === 'cancelled' ? '❌' : '📋'
          },
          pet_name: b.pet_name,
          pillar: 'Booking',
          created_at: b.created_at,
          type: 'booking'
        }));
        
        const allRequests = [...requests, ...bookings]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setMyRequests(allRequests);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setRequestsLoading(false);
      }
    };
    
    fetchMyRequests();
  }, [token, user]);

  // Paw Points History
  const fetchPawPointsHistory = async () => {
    if (!token || !user) return;
    
    setPawPointsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/paw-points/history?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPawPointsHistory(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch paw points history:', error);
    } finally {
      setPawPointsLoading(false);
    }
  };
  
  useEffect(() => {
    if (showPawPointsBreakdown) {
      fetchPawPointsHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPawPointsBreakdown]);

  // Handle setting change
  const handleSettingChange = useCallback(async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value !== undefined ? value : !prev[key] }));
    setSettingsLoading(true);
    setSettingsSaved(false);
    
    try {
      await axios.put(`${API_URL}/api/user/settings`, {
        [key]: value !== undefined ? value : !settings[key]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save setting:', error);
    } finally {
      setSettingsLoading(false);
    }
  }, [token, settings]);

  // Refresh requests handler
  const refreshRequests = useCallback(async () => {
    if (!token || !user) return;
    
    setRequestsLoading(true);
    try {
      const [requestsRes, bookingsRes] = await Promise.all([
        axios.get(`${API_URL}/api/mira/my-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { requests: [] } })),
        axios.get(`${API_URL}/api/user/bookings?email=${encodeURIComponent(user.email)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { bookings: [] } }))
      ]);
      
      const requests = requestsRes.data.requests || [];
      const bookings = (bookingsRes.data.bookings || []).map(b => ({
        id: b.ticket_id || b.id,
        description: `${b.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Service'} booking${b.date ? ` for ${b.date}` : ''}${b.time ? ` at ${b.time}` : ''}`,
        status: b.status,
        status_display: {
          label: b.status === 'pending' ? 'Pending Confirmation' : 
                 b.status === 'confirmed' ? 'Confirmed' :
                 b.status === 'completed' ? 'Completed' : 
                 b.status === 'cancelled' ? 'Cancelled' : b.status,
          color: b.status === 'pending' ? 'yellow' : 
                 b.status === 'confirmed' ? 'green' : 
                 b.status === 'completed' ? 'blue' : 
                 b.status === 'cancelled' ? 'red' : 'gray',
          icon: b.status === 'pending' ? '⏳' : 
                b.status === 'confirmed' ? '✅' : 
                b.status === 'completed' ? '🎉' : 
                b.status === 'cancelled' ? '❌' : '📋'
        },
        pet_name: b.pet_name,
        pillar: 'Booking',
        created_at: b.created_at,
        type: 'booking'
      }));
      
      setMyRequests([...requests, ...bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } finally {
      setRequestsLoading(false);
    }
  }, [token, user]);

  // Refresh reviews handler
  const refreshReviews = useCallback(async () => {
    if (!token) return;
    try {
      const reviewsRes = await axios.get(`${API_URL}/api/reviews/my-reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Failed to refresh reviews:', error);
    }
  }, [token]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Get primary pet
  const primaryPet = pets[0];
  
  // Get saved addresses from orders
  const savedAddresses = orders
    .filter(o => o.delivery?.address)
    .map(o => ({
      address: o.delivery.address,
      city: o.delivery.city,
      pincode: o.delivery.pincode
    }))
    .filter((addr, idx, self) => 
      idx === self.findIndex(a => a.address === addr.address && a.city === addr.city)
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator isPulling={isPulling} pullProgress={pullProgress} isRefreshing={isRefreshing} />
      
      {/* Push Notification Banner */}
      <Suspense fallback={null}>
        <PushNotificationBanner />
      </Suspense>
      
      {/* Soul Explainer Video Dialog */}
      <Suspense fallback={null}>
        {showSoulExplainer && (
          <SoulExplainerVideo 
            open={showSoulExplainer} 
            onClose={() => setShowSoulExplainer(false)} 
            petName={primaryPet?.name}
          />
        )}
      </Suspense>
      
      {/* Voice Quick Actions */}
      {showVoiceActions && (
        <VoiceQuickActions 
          open={showVoiceActions}
          onClose={() => setShowVoiceActions(false)}
          pets={pets}
        />
      )}
      
      {/* Pillar Popup */}
      {pillarPopup.open && (
        <PillarPopup 
          pillar={pillarPopup.pillar}
          onClose={() => setPillarPopup({ open: false, pillar: null })}
          onExplore={(path) => navigate(path)}
          data={{
            celebrationOrders,
            diningHistory,
            stayHistory,
            travelHistory
          }}
        />
      )}
      
      {/* Paw Points Breakdown Modal */}
      <PawPointsBreakdownModal
        open={showPawPointsBreakdown}
        onClose={() => setShowPawPointsBreakdown(false)}
        history={pawPointsHistory}
        loading={pawPointsLoading}
        totalPoints={user?.loyalty_points}
      />
      
      <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              {primaryPet ? (
                <PetAvatar pet={primaryPet} size="md" />
              ) : (
                <User className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Welcome back, {user.name?.split(' ')[0] || 'Pet Parent'}!
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-purple-100 text-purple-700 text-xs">Pet Pass Active</Badge>
                {user.loyalty_points > 0 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-purple-50"
                    onClick={() => setShowPawPointsBreakdown(true)}
                  >
                    <Gift className="w-3 h-3 mr-1" />
                    {user.loyalty_points} Paw Points
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => { logout(); navigate('/'); }}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop Tab Navigation */}
          <TabsList className="hidden md:flex bg-white/80 backdrop-blur-sm p-1.5 rounded-xl border shadow-sm mb-6 flex-wrap gap-1">
            <TabsTrigger value="overview" className="rounded-lg flex-shrink-0">
              <Home className="w-4 h-4 mr-1" /> Home
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg flex-shrink-0">
              <Crown className="w-4 h-4 mr-1" /> Services
            </TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-lg flex-shrink-0">
              <Gift className="w-4 h-4 mr-1" /> Paw Points
            </TabsTrigger>
            <TabsTrigger value="mira" className="rounded-lg flex-shrink-0">
              <Sparkles className="w-4 h-4 mr-1" /> Mira AI
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 mr-1" /> Bookings
              {myRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{myRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg flex-shrink-0">
              <Package className="w-4 h-4 mr-1" /> Orders
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg flex-shrink-0">
              <Shield className="w-4 h-4 mr-1" /> Documents
            </TabsTrigger>
            <TabsTrigger value="autoship" className="rounded-lg flex-shrink-0">
              <RefreshCw className="w-4 h-4 mr-1" /> Autoship
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg flex-shrink-0">
              <MessageSquare className="w-4 h-4 mr-1" /> Reviews
            </TabsTrigger>
            <TabsTrigger value="pets" className="rounded-lg flex-shrink-0">
              <PawPrint className="w-4 h-4 mr-1" /> Pets
            </TabsTrigger>
            <TabsTrigger value="addresses" className="rounded-lg flex-shrink-0">
              <MapPin className="w-4 h-4 mr-1" /> Addresses
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg flex-shrink-0">
              <Settings className="w-4 h-4 mr-1" /> Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Mobile Tab Navigation */}
          <div className="md:hidden mb-6">
            <TabsList className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200/50 shadow-lg flex overflow-x-auto gap-1 scrollbar-hide">
              <TabsTrigger value="overview" className="rounded-xl flex items-center gap-1.5 py-2.5 px-4 text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all">
                <Home className="w-4 h-4" /> Home
              </TabsTrigger>
              <TabsTrigger value="requests" className="rounded-xl flex items-center gap-1.5 py-2.5 px-4 text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all">
                <Calendar className="w-4 h-4" /> Requests
                {myRequests.length > 0 && <span className="ml-1 text-xs">({myRequests.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="pets" className="rounded-xl flex items-center gap-1.5 py-2.5 px-4 text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all">
                <PawPrint className="w-4 h-4" /> Pets
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-xl flex items-center gap-1.5 py-2.5 px-4 text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all">
                <Shield className="w-4 h-4" /> Docs
              </TabsTrigger>
              <TabsTrigger value="orders" className="rounded-xl flex items-center gap-1.5 py-2.5 px-4 text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all">
                <Package className="w-4 h-4" /> Orders
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-xl flex items-center gap-1.5 py-2.5 px-4 text-sm font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all">
                <Settings className="w-4 h-4" /> More
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents - All Lazy Loaded */}
          <TabsContent value="overview">
            <Suspense fallback={<TabLoader />}>
              <OverviewTab 
                user={user}
                pets={pets}
                orders={orders}
                myRequests={myRequests}
                primaryPet={primaryPet}
                setShowSoulExplainer={setShowSoulExplainer}
                setShowPawPointsBreakdown={setShowPawPointsBreakdown}
                addToCart={addToCart}
                onTabChange={setActiveTab}
                selectedPetId={selectedPetId}
                onPetChange={setSelectedPetId}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="services">
            <Suspense fallback={<TabLoader />}>
              <ServicesTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="rewards">
            <Suspense fallback={<TabLoader />}>
              <RewardsTab 
                user={user}
                pets={pets}
                orders={orders}
                achievements={achievements}
                setShowPawPointsBreakdown={setShowPawPointsBreakdown}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="mira">
            <Suspense fallback={<TabLoader />}>
              <MiraTab user={user} pets={pets} />
            </Suspense>
          </TabsContent>

          <TabsContent value="requests">
            <Suspense fallback={<TabLoader />}>
              <RequestsTab 
                myRequests={myRequests}
                requestsLoading={requestsLoading}
                onRefresh={refreshRequests}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="orders">
            <Suspense fallback={<TabLoader />}>
              <OrdersTab orders={orders} />
            </Suspense>
          </TabsContent>

          <TabsContent value="dining">
            <Suspense fallback={<TabLoader />}>
              <DiningTab diningHistory={diningHistory} />
            </Suspense>
          </TabsContent>

          <TabsContent value="celebrations">
            <Suspense fallback={<TabLoader />}>
              <CelebrationsTab 
                pets={pets}
                celebrationOrders={celebrationOrders}
                user={user}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="stay">
            <Suspense fallback={<TabLoader />}>
              <StayTab stayHistory={stayHistory} />
            </Suspense>
          </TabsContent>

          <TabsContent value="travel">
            <Suspense fallback={<TabLoader />}>
              <TravelTab travelHistory={travelHistory} />
            </Suspense>
          </TabsContent>

          <TabsContent value="autoship">
            <Suspense fallback={<TabLoader />}>
              <AutoshipTab autoships={autoships} />
            </Suspense>
          </TabsContent>

          <TabsContent value="reviews">
            <Suspense fallback={<TabLoader />}>
              <ReviewsTab 
                reviews={reviews}
                reviewableProducts={reviewableProducts}
                user={user}
                token={token}
                API_URL={API_URL}
                onReviewsUpdate={refreshReviews}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="pets">
            <Suspense fallback={<TabLoader />}>
              <PetsTab pets={pets} />
            </Suspense>
          </TabsContent>

          <TabsContent value="addresses">
            <Suspense fallback={<TabLoader />}>
              <AddressesTab savedAddresses={savedAddresses} />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings">
            <Suspense fallback={<TabLoader />}>
              <SettingsTab 
                user={user}
                pets={pets}
                settings={settings}
                settingsLoading={settingsLoading}
                settingsSaved={settingsSaved}
                isPushSupported={isPushSupported}
                pushPermission={pushPermission}
                isPushSubscribed={isPushSubscribed}
                pushLoading={pushLoading}
                handleSettingChange={handleSettingChange}
                subscribeToPush={subscribeToPush}
                unsubscribeFromPush={unsubscribeFromPush}
                sendTestNotification={sendTestNotification}
                setSettings={setSettings}
                setShowVoiceActions={setShowVoiceActions}
                toast={toast}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MemberDashboard;
