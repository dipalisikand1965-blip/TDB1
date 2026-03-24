import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  ShoppingBag, PawPrint, Star, Package, Calendar, Sparkles, Crown,
  ChevronRight, Gift, Cake, MessageCircle, Play, RefreshCw
} from 'lucide-react';
import { toast } from '../../../hooks/use-toast';

// Lazy-loaded components
const MiraPicksCard = React.lazy(() => import('../../MiraPicksCard'));
const SmartRecommendationsCard = React.lazy(() => import('../../SmartRecommendationsCard'));
const MembershipCardTiers = React.lazy(() => import('../../MembershipCardTiers'));
const SocialShareReward = React.lazy(() => import('../../SocialShareReward'));
const BreedTipsEngine = React.lazy(() => import('../../BreedTipsEngine'));
const PawmoterScore = React.lazy(() => import('../../PawmoterScore'));
const PillarWisePicks = React.lazy(() => import('../../PillarWisePicks'));

// Components from dashboard folder
import { GamificationBanner } from '../GamificationBanner';
import { QuickScoreBoost } from '../QuickScoreBoost';

// Other imports
import { MiraTip, getMiraGuidanceContext } from '../../MiraGuidance';
import { MiraDailyTipInline } from '../../MiraDailyTip';
import MyCelebrations from '../../MyCelebrations';

const OverviewTab = ({ 
  user, 
  pets, 
  orders, 
  myRequests,
  primaryPet,
  setShowSoulExplainer,
  setShowPawPointsBreakdown,
  addToCart,
  onTabChange,
  selectedPetId,
  onPetChange
}) => {
  const navigate = useNavigate();
  
  // Get current pet (either selected or first)
  const currentPet = pets.find(p => p.id === selectedPetId) || pets[0];

  return (
    <div className="animate-in fade-in-50 duration-300">
      {/* PET SELECTOR - Show if multiple pets */}
      {pets.length > 1 && (
        <div className="mb-6 p-4 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-purple-400 font-medium">VIEWING DASHBOARD FOR</p>
            {currentPet && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/pet/${currentPet.id}`)}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs h-7"
                data-testid="go-to-pet-soul-btn"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Go to {currentPet.name}&apos;s Soul Journey →
              </Button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500/30" style={{ WebkitOverflowScrolling: 'touch' }}>
            {pets.map((pet) => (
              <button
                key={pet.id}
                onClick={() => onPetChange?.(pet.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${
                  currentPet?.id === pet.id 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30' 
                    : 'bg-slate-800/50 border border-white/10 text-slate-300 hover:border-purple-500/50'
                }`}
                data-testid={`pet-selector-${pet.name?.toLowerCase()}`}
              >
                <span className="text-lg flex-shrink-0" style={{ lineHeight: 1 }}>{pet.species === 'cat' ? '🐱' : '🐕'}</span>
                <span className="font-medium">{pet.name}</span>
                {pet.overall_score >= 80 && <span className="text-xs flex-shrink-0" style={{ lineHeight: 1 }}>⭐</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* SINGLE PET - Show pet soul journey link */}
      {pets.length === 1 && currentPet && (
        <div className="mb-6 p-4 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentPet.species === 'cat' ? '🐱' : '🐕'}</span>
              <div>
                <p className="font-semibold text-white">{currentPet.name}&apos;s Dashboard</p>
                <p className="text-xs text-slate-400">{currentPet.breed || 'Your beloved pet'}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/pet/${currentPet.id}`)}
              className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
              data-testid="single-pet-soul-btn"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Open Soul Journey
            </Button>
          </div>
        </div>
      )}

      {/* MIRA'S PERSONALIZED GUIDANCE */}
      <MiraTip 
        context={getMiraGuidanceContext(user, pets, orders)}
        petName={currentPet?.name}
        petId={currentPet?.id}
        parentName={user?.name?.split(' ')[0]}
        score={Math.min(100, currentPet?.overall_score || 0)}
      />
      
      {/* MIRA'S DAILY TIP */}
      <div className="mb-6">
        <MiraDailyTipInline petName={currentPet?.name || 'your pup'} />
      </div>
      
      {/* MY CELEBRATIONS */}
      {Array.isArray(pets) && pets.length > 0 && (
        <div className="mb-6">
          <MyCelebrations 
            pets={pets} 
            onNavigate={(path) => navigate(path)}
            onAddToCart={(items) => {
              items.forEach(item => {
                addToCart({
                  id: item.id,
                  title: item.title || item.name,
                  price: item.price,
                  image: item.image_url || item.images?.[0],
                  quantity: 1
                });
              });
            }}
          />
        </div>
      )}
      
      {/* MY ACTIVE REQUESTS */}
      {myRequests.length > 0 && (
        <div className="mb-6">
          <Card className="p-4 bg-slate-900/60 backdrop-blur-xl border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                Active Requests
                <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">{myRequests.length}</Badge>
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                onClick={() => onTabChange?.('requests')}
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {myRequests.slice(0, 3).map((req) => (
                <div 
                  key={req.id} 
                  className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-white/5 cursor-pointer hover:bg-slate-800 hover:border-purple-500/30 transition-all active:scale-[0.99]"
                  onClick={() => onTabChange?.('requests')}
                  data-testid={`request-${req.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">#{req.id?.slice(-8) || 'N/A'}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          req.status_display?.color === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                          req.status_display?.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          req.status_display?.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {req.status_display?.icon} {req.status_display?.label || req.status || 'Pending'}
                      </Badge>
                      {req.pillar && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                          {req.pillar}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 font-medium truncate mt-1">{req.description || req.service_type || 'Service Request'}</p>
                    {req.pet_name && (
                      <p className="text-xs text-gray-500 mt-0.5">🐾 {req.pet_name}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      
      {/* EXPLAINER VIDEO TAB */}
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
              <p className="text-sm text-gray-500">Learn how Pet Soul™ works for {currentPet?.name || 'your pet'}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
        </button>
      </div>
      
      {/* PILLAR-WISE PICKS FOR PET */}
      {user?.id && currentPet && (
        <div className="mb-8">
          <React.Suspense fallback={<div className="h-40 bg-gray-100 animate-pulse rounded-xl" />}>
            <PillarWisePicks 
              petId={currentPet.id}
              petName={currentPet.name}
              petBreed={currentPet.breed}
              maxItemsPerPillar={4}
            />
          </React.Suspense>
        </div>
      )}
      
      {/* SMART RECOMMENDATIONS */}
      {user?.id && pets.length > 0 && (
        <div className="mb-8">
          <React.Suspense fallback={<div className="h-40 bg-gray-100 animate-pulse rounded-xl" />}>
            <SmartRecommendationsCard 
              userId={user.id}
              petId={currentPet?.id}
              limit={4}
              showTitle={true}
            />
          </React.Suspense>
        </div>
      )}
      
      {/* ALL 12 LIFE PILLARS */}
      <Card className="p-6 bg-gradient-to-r from-teal-800 via-teal-700 to-teal-800 text-white border-none shadow-xl mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Crown className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Your Pet Life Pillars</h3>
            <p className="text-xs text-white/70">12 pillars unlocked with Pet Pass • Click to view history</p>
          </div>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 md:gap-3">
          {[
            { id: 'celebrate', name: 'Celebrate', icon: '🎂', path: '/celebrate', color: 'from-pink-400 to-rose-400' },
            { id: 'dine', name: 'Dine', icon: '🍽️', path: '/dine', color: 'from-amber-400 to-orange-400' },
            { id: 'go', name: 'Go', icon: '✈️', path: '/go', color: 'from-cyan-400 to-blue-400' },
            { id: 'care', name: 'Care', icon: '💊', path: '/care', color: 'from-red-400 to-rose-400' },
            { id: 'play', name: 'Play', icon: '🎾', path: '/play', color: 'from-green-400 to-emerald-400' },
            { id: 'learn', name: 'Learn', icon: '🎓', path: '/learn', color: 'from-teal-400 to-cyan-400' },
            { id: 'paperwork', name: 'Paperwork', icon: '📄', path: '/paperwork', color: 'from-slate-400 to-gray-500' },
            { id: 'emergency', name: 'Emergency', icon: '🚨', path: '/emergency', color: 'from-red-500 to-rose-500' },
            { id: 'farewell', name: 'Farewell', icon: '🌈', path: '/farewell', color: 'from-rose-400 to-pink-400' },
            { id: 'adopt', name: 'Adopt', icon: '🐾', path: '/adopt', color: 'from-purple-400 to-violet-400' },
            { id: 'services', name: 'Services', icon: '🤝', path: '/services', color: 'from-indigo-400 to-purple-400' },
            { id: 'shop', name: 'Shop', icon: '🛒', path: '/shop', color: 'from-orange-400 to-amber-400' }
          ].map((pillar) => (
            <button
              key={pillar.id}
              onClick={() => navigate(pillar.path)}
              className="group p-2 md:p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all text-center active:scale-95"
              data-testid={`pillar-${pillar.id}`}
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
            if (currentPet) {
              navigate(`/pet/${currentPet.id}?tab=personality`);
            } else if (pets.length > 0) {
              navigate(`/pet/${pets[0].id}?tab=personality`);
            } else {
              navigate('/my-pets');
            }
          }}
        >
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <PawPrint className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900">{currentPet?.name || 'My Pets'}</h3>
          <p className="text-sm text-gray-500">{currentPet ? `View ${currentPet.name}'s profile` : `${pets.length} active`}</p>
        </Card>
        
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-pink-200 bg-gradient-to-br from-pink-50 to-white"
          onClick={() => navigate('/celebrate')}
        >
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mb-3">
            <Cake className="w-5 h-5 text-pink-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Celebrate</h3>
          <p className="text-sm text-gray-500">Plan a party</p>
        </Card>
        
        <Card 
          className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-amber-200 bg-gradient-to-br from-amber-50 to-white"
          onClick={() => navigate('/shop')}
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

      {/* MEMBERSHIP CARD & STATS GRID */}
      <div className="grid md:grid-cols-3 gap-6">
        <React.Suspense fallback={<div className="h-40 bg-gray-100 animate-pulse rounded-xl" />}>
          <MembershipCardTiers user={user} pet={currentPet || pets[0]} />
        </React.Suspense>

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
              if (currentPet) {
                navigate(`/pet/${currentPet.id}?tab=personality`);
              } else if (pets.length > 0) {
                navigate(`/pet/${pets[0].id}?tab=personality`);
              } else {
                navigate('/my-pets');
              }
            }}>
              Manage
            </Button>
          </div>
          <h3 className="text-lg font-medium text-gray-600">{currentPet?.name || 'My Pets'}</h3>
          <p className="text-4xl font-bold text-gray-900 mt-1">{currentPet ? (currentPet.overall_score || 0) + '%' : pets.length}</p>
          <p className="text-sm text-gray-500 mt-2">{currentPet ? 'Soul completion' : 'Active profiles'}</p>
        </Card>
      </div>
      
      {/* ENGAGEMENT WIDGETS ROW */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <React.Suspense fallback={<div className="h-40 bg-gray-100 animate-pulse rounded-xl" />}>
          <PawmoterScore user={user} onScoreSubmitted={() => window.location.reload()} />
        </React.Suspense>
        
        <React.Suspense fallback={<div className="h-40 bg-gray-100 animate-pulse rounded-xl" />}>
          <SocialShareReward user={user} onRewardClaimed={() => window.location.reload()} />
        </React.Suspense>
      </div>
      
      {/* BREED TIPS ENGINE */}
      {currentPet?.breed && (
        <div className="mt-6">
          <React.Suspense fallback={<div className="h-40 bg-gray-100 animate-pulse rounded-xl" />}>
            <BreedTipsEngine pet={currentPet} />
          </React.Suspense>
        </div>
      )}
      
      {/* Pet Soul Completion CTA */}
      {currentPet && (() => {
        const pet = currentPet;
        const avgScore = Math.min(100, Math.round(pet?.overall_score || 0));
        
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
                    Complete {pet.name}&apos;s Pet Soul™
                    <Badge variant="outline" className="text-purple-600 border-purple-200 bg-white">
                      {avgScore}% done
                    </Badge>
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Answer {remainingPercent > 50 ? 'a few more' : 'just a few'} questions to unlock personalised recommendations, 
                    birthday alerts, and care reminders tailored for {pet.name}.
                  </p>
                  
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
                onClick={() => {
                  if (pet?.id) {
                    navigate(`/soul-builder?pet=${pet.id}&continue=true`);
                  } else {
                    toast({
                      title: "Unable to load pet profile",
                      description: "Please try refreshing the page or select a pet first.",
                      variant: "destructive"
                    });
                  }
                }}
                data-testid="continue-pet-journey-btn"
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
        
        const topProducts = Object.values(productFrequency)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        
        if (topProducts.length === 0) return null;
        
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
                      {product.image_url || product.image ? (
                        <img src={product.image_url || product.image} alt={product.name} className="w-full h-full object-cover" />
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
                      toast({ 
                        title: '🛒 Added to Cart',
                        description: `${product.name} has been added to your cart!`
                      });
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
          
          if (pet.health?.vaccinations) {
            pet.health.vaccinations.forEach(vax => {
              if (vax.next_due) {
                const dueDate = new Date(vax.next_due);
                const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                if (daysUntil <= 14 && daysUntil >= -7) {
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

      <h3 className="text-xl font-bold mt-10 mb-4 text-gray-900">Recent Activity</h3>
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.slice(0, 10).map(order => (
            <Card 
              key={order.orderId} 
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
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
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/cakes')}>
            Start Shopping
          </Button>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
