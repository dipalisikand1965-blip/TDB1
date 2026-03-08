/**
 * CakeRevealSection.jsx
 * 
 * VISION: "Cake Reveal Moment"
 * - 48 hours before: "Your cake artist is creating magic..."
 * - Day before: Blurred sneak peek
 * - Delivery: THE BIG REVEAL with full photo
 * 
 * Creates anticipation and emotional connection for custom cake orders.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cake, Clock, Eye, EyeOff, Sparkles, Bell, 
  ChefHat, Camera, Gift, Heart, Star, Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { API_URL } from '../../utils/api';
import { toast } from 'sonner';

// Stages of cake reveal
const REVEAL_STAGES = {
  CREATING: 'creating',      // 48+ hours before
  SNEAK_PEEK: 'sneak_peek',  // 24-48 hours before - blurred image
  READY: 'ready',            // < 24 hours - preparing for delivery
  REVEALED: 'revealed'       // Delivered - full reveal!
};

const CakeRevealSection = ({ pet, token, userEmail, orders = [] }) => {
  const [cakeOrders, setCakeOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const petName = pet?.name || 'Your pet';

  // Find cake orders from recent orders
  useEffect(() => {
    const filterCakeOrders = () => {
      // Filter orders that contain cakes
      const cakeRelated = orders.filter(order => {
        const items = order.items || order.line_items || [];
        return items.some(item => {
          const name = (item.name || item.title || '').toLowerCase();
          return name.includes('cake') || name.includes('birthday') || name.includes('hamper');
        });
      });
      
      // Add reveal stage based on order date
      const processedOrders = cakeRelated.map(order => {
        const orderDate = new Date(order.created_at || order.order_date);
        const deliveryDate = order.delivery_date 
          ? new Date(order.delivery_date) 
          : new Date(orderDate.getTime() + (2 * 24 * 60 * 60 * 1000)); // Default 2 days
        
        const now = new Date();
        const hoursUntilDelivery = (deliveryDate - now) / (1000 * 60 * 60);
        
        let stage = REVEAL_STAGES.REVEALED;
        if (hoursUntilDelivery > 48) {
          stage = REVEAL_STAGES.CREATING;
        } else if (hoursUntilDelivery > 24) {
          stage = REVEAL_STAGES.SNEAK_PEEK;
        } else if (hoursUntilDelivery > 0) {
          stage = REVEAL_STAGES.READY;
        }
        
        return {
          ...order,
          revealStage: stage,
          deliveryDate,
          hoursUntilDelivery: Math.max(0, hoursUntilDelivery)
        };
      });
      
      setCakeOrders(processedOrders);
    };
    
    filterCakeOrders();
  }, [orders]);

  // Fetch cake orders from API if not passed as prop
  useEffect(() => {
    const fetchCakeOrders = async () => {
      if (orders.length > 0 || !token) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/orders/my-orders?limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter for cake orders
          const cakeRelated = (data.orders || data || []).filter(order => {
            const items = order.items || order.line_items || [];
            return items.some(item => {
              const name = (item.name || item.title || '').toLowerCase();
              return name.includes('cake') || name.includes('birthday');
            });
          });
          
          // Process with stages
          const processedOrders = cakeRelated.slice(0, 3).map(order => ({
            ...order,
            revealStage: REVEAL_STAGES.REVEALED, // Default for existing orders
            hoursUntilDelivery: 0
          }));
          
          setCakeOrders(processedOrders);
        }
      } catch (err) {
        console.log('[CakeReveal] Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCakeOrders();
  }, [token, orders]);

  const handleReveal = (order) => {
    setSelectedOrder(order);
    setShowRevealModal(true);
    
    // Fire confetti for big reveal!
    if (order.revealStage === REVEAL_STAGES.REVEALED) {
      import('canvas-confetti').then(confetti => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff69b4', '#ff1493', '#da70d6', '#ffd700']
        });
      });
    }
  };

  const getStageContent = (stage, hoursUntil) => {
    switch (stage) {
      case REVEAL_STAGES.CREATING:
        return {
          emoji: '👨‍🍳',
          title: 'Magic in Progress',
          subtitle: 'Your cake artist is creating something special...',
          badge: 'In Progress',
          badgeColor: 'bg-amber-500',
          blur: 0,
          showImage: false
        };
      case REVEAL_STAGES.SNEAK_PEEK:
        return {
          emoji: '👀',
          title: 'Sneak Peek Available!',
          subtitle: `${Math.round(hoursUntil)} hours until the big reveal`,
          badge: 'Sneak Peek',
          badgeColor: 'bg-purple-500',
          blur: 15,
          showImage: true
        };
      case REVEAL_STAGES.READY:
        return {
          emoji: '🎁',
          title: 'Almost There!',
          subtitle: 'Your cake is ready and on its way',
          badge: 'Out for Delivery',
          badgeColor: 'bg-blue-500',
          blur: 8,
          showImage: true
        };
      case REVEAL_STAGES.REVEALED:
      default:
        return {
          emoji: '🎂',
          title: 'The Big Reveal!',
          subtitle: 'Your celebration masterpiece',
          badge: 'Delivered',
          badgeColor: 'bg-green-500',
          blur: 0,
          showImage: true
        };
    }
  };

  // If no cake orders, show promo card
  if (cakeOrders.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-pink-50 via-purple-50 to-amber-50 p-5 rounded-2xl border border-pink-200/50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Cake className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              Cake Reveal Experience
              <Badge className="bg-pink-500 text-white text-[10px]">New</Badge>
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Order a custom cake and get exciting sneak peeks as your cake artist creates {petName}'s masterpiece!
            </p>
          </div>
          <Button 
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
            onClick={() => window.location.href = '/celebrate?category=cakes'}
          >
            Order Cake
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-2">
        <ChefHat className="w-5 h-5 text-pink-500" />
        <h3 className="font-bold text-gray-900">Your Cake Journey</h3>
        <Badge className="bg-purple-100 text-purple-700 text-xs">
          {cakeOrders.length} order{cakeOrders.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Cake Order Cards */}
      <div className="space-y-3">
        {cakeOrders.map((order, index) => {
          const stageContent = getStageContent(order.revealStage, order.hoursUntilDelivery);
          const cakeItem = (order.items || order.line_items || []).find(item => {
            const name = (item.name || item.title || '').toLowerCase();
            return name.includes('cake') || name.includes('birthday');
          });
          
          return (
            <motion.div
              key={order.id || order._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border border-gray-100"
                onClick={() => handleReveal(order)}
              >
                <div className="flex items-stretch">
                  {/* Image Section with Blur Effect */}
                  <div className="relative w-28 sm:w-36 flex-shrink-0 bg-gradient-to-br from-pink-100 to-purple-100">
                    {stageContent.showImage ? (
                      <>
                        <img
                          src={cakeItem?.image_url || cakeItem?.image || 'https://thedoggybakery.com/cdn/shop/files/Breed_Birthday_Cake_Hamper_Toy.png?v=1723637829&width=400'}
                          alt="Cake Preview"
                          className="w-full h-full object-cover"
                          style={{ filter: `blur(${stageContent.blur}px)` }}
                        />
                        {stageContent.blur > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/80 backdrop-blur-sm rounded-full p-2">
                              <EyeOff className="w-5 h-5 text-purple-500" />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center min-h-[100px]">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-4xl"
                        >
                          {stageContent.emoji}
                        </motion.div>
                      </div>
                    )}
                    
                    {/* Stage Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className={`${stageContent.badgeColor} text-white text-[10px]`}>
                        {stageContent.badge}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {cakeItem?.name || cakeItem?.title || 'Custom Cake Order'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Order #{(order.id || order.order_number || '').toString().slice(-6)}
                        </p>
                      </div>
                      <span className="text-2xl">{stageContent.emoji}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{stageContent.subtitle}</p>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: order.revealStage === REVEAL_STAGES.CREATING ? '25%' :
                                   order.revealStage === REVEAL_STAGES.SNEAK_PEEK ? '50%' :
                                   order.revealStage === REVEAL_STAGES.READY ? '75%' : '100%'
                          }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Creating</span>
                        <span>Sneak Peek</span>
                        <span>Ready</span>
                        <span>Revealed!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Reveal Modal */}
      <AnimatePresence>
        {showRevealModal && selectedOrder && (
          <Dialog open={showRevealModal} onOpenChange={() => setShowRevealModal(false)}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
              {(() => {
                const stageContent = getStageContent(selectedOrder.revealStage, selectedOrder.hoursUntilDelivery);
                const cakeItem = (selectedOrder.items || selectedOrder.line_items || []).find(item => {
                  const name = (item.name || item.title || '').toLowerCase();
                  return name.includes('cake') || name.includes('birthday');
                });
                
                return (
                  <>
                    {/* Header with gradient */}
                    <div className={`p-5 text-center ${
                      selectedOrder.revealStage === REVEAL_STAGES.REVEALED 
                        ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500' 
                        : 'bg-gradient-to-r from-amber-400 to-pink-500'
                    } text-white`}>
                      <motion.span 
                        className="text-5xl block mb-2"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      >
                        {stageContent.emoji}
                      </motion.span>
                      <h3 className="text-xl font-bold">{stageContent.title}</h3>
                      <p className="text-white/80 text-sm">{stageContent.subtitle}</p>
                    </div>
                    
                    {/* Cake Image */}
                    <div className="relative bg-gray-100">
                      <motion.img
                        src={cakeItem?.image_url || cakeItem?.image || 'https://thedoggybakery.com/cdn/shop/files/Breed_Birthday_Cake_Hamper_Toy.png?v=1723637829&width=800'}
                        alt="Your Cake"
                        className="w-full h-64 object-cover"
                        style={{ filter: `blur(${stageContent.blur}px)` }}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      
                      {stageContent.blur > 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                          <EyeOff className="w-12 h-12 text-white mb-2" />
                          <p className="text-white font-medium">
                            {selectedOrder.revealStage === REVEAL_STAGES.SNEAK_PEEK 
                              ? 'Sneak peek only - full reveal coming soon!'
                              : 'Your cake is being prepared...'}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="p-5">
                      <h4 className="font-bold text-gray-900 mb-2">
                        {cakeItem?.name || cakeItem?.title || 'Custom Cake'}
                      </h4>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={`${stageContent.badgeColor} text-white`}>
                          {stageContent.badge}
                        </Badge>
                        <Badge variant="outline">
                          For {petName}
                        </Badge>
                      </div>
                      
                      {selectedOrder.revealStage === REVEAL_STAGES.REVEALED && (
                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-2 text-purple-700">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Share this moment to earn 50 Paw Points!
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowRevealModal(false)}
                        >
                          Close
                        </Button>
                        {selectedOrder.revealStage === REVEAL_STAGES.REVEALED && (
                          <Button
                            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                            onClick={() => {
                              toast.success('Opening share options...');
                              // Could open share modal here
                            }}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Share Moment
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CakeRevealSection;
