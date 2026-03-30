/**
 * CelebrationWallManager.jsx
 * 
 * Admin component to manage celebration wall photos.
 * Features:
 * - View/Add/Edit/Delete celebration photos
 * - Reorder photos (drag & drop or manual order)
 * - Seed default TheDoggyBakery photos
 * - Manage Cake Reveal stages for orders
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Image, Plus, Trash2, Edit2, Eye, EyeOff, RefreshCw, 
  Upload, Save, X, ChevronUp, ChevronDown, Cake, Bell,
  Send, Mail, MessageSquare, Inbox, Loader2, Check
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { API_URL } from '../../utils/api';

const CelebrationWallManager = () => {
  // Celebration Photos State
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [formData, setFormData] = useState({
    image_url: '',
    pet_name: '',
    occasion: 'Birthday',
    caption: '',
    location: '',
    likes: 0,
    is_featured: true
  });

  // Cake Reveal State
  const [cakeOrders, setCakeOrders] = useState([]);
  const [loadingCakeOrders, setLoadingCakeOrders] = useState(false);
  const [selectedCakeOrder, setSelectedCakeOrder] = useState(null);
  const [showCakeRevealModal, setShowCakeRevealModal] = useState(false);
  const [revealStage, setRevealStage] = useState('creating');
  const [sneakPeekImage, setSneakPeekImage] = useState('');
  const [finalImage, setFinalImage] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  // Fetch celebration photos
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/celebration-wall/photos?featured_only=false&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('[Admin] Error fetching celebration photos:', err);
      toast.error('Failed to load celebration photos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cake orders
  const fetchCakeOrders = useCallback(async () => {
    setLoadingCakeOrders(true);
    try {
      const response = await fetch(`${API_URL}/api/cake-reveal/cake-orders?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setCakeOrders(data.orders || []);
      }
    } catch (err) {
      console.error('[Admin] Error fetching cake orders:', err);
    } finally {
      setLoadingCakeOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
    fetchCakeOrders();
  }, [fetchPhotos, fetchCakeOrders]);

  // Add/Edit photo
  const handleSavePhoto = async () => {
    try {
      const url = editingPhoto 
        ? `${API_URL}/api/celebration-wall/photos/${editingPhoto.id}`
        : `${API_URL}/api/celebration-wall/photos`;
      
      const method = editingPhoto ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingPhoto ? 'Photo updated!' : 'Photo added!');
        setShowAddModal(false);
        setEditingPhoto(null);
        setFormData({
          image_url: '',
          pet_name: '',
          occasion: 'Birthday',
          caption: '',
          location: '',
          likes: 0,
          is_featured: true
        });
        fetchPhotos();
      } else {
        toast.error('Failed to save photo');
      }
    } catch (err) {
      toast.error('Error saving photo');
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this celebration photo?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/celebration-wall/photos/${photoId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Photo deleted');
        fetchPhotos();
      } else {
        toast.error('Failed to delete photo');
      }
    } catch (err) {
      toast.error('Error deleting photo');
    }
  };

  // Seed default photos
  const handleSeedDefaults = async () => {
    if (!window.confirm('This will add default TheDoggyBakery photos. Continue?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/celebration-wall/seed-defaults`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        fetchPhotos();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Error seeding photos');
    }
  };

  // Toggle featured status
  const toggleFeatured = async (photo) => {
    try {
      const response = await fetch(`${API_URL}/api/celebration-wall/photos/${photo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !photo.is_featured })
      });
      
      if (response.ok) {
        toast.success(photo.is_featured ? 'Hidden from wall' : 'Now featured on wall');
        fetchPhotos();
      }
    } catch (err) {
      toast.error('Error updating photo');
    }
  };

  // Edit photo click
  const handleEditClick = (photo) => {
    setEditingPhoto(photo);
    setFormData({
      image_url: photo.image_url || photo.imageUrl || '',
      pet_name: photo.pet_name || photo.petName || '',
      occasion: photo.occasion || 'Birthday',
      caption: photo.caption || '',
      location: photo.location || '',
      likes: photo.likes || 0,
      is_featured: photo.is_featured !== false
    });
    setShowAddModal(true);
  };

  // Send cake reveal notification
  const handleSendCakeRevealNotification = async () => {
    if (!selectedCakeOrder) return;
    
    setSendingNotification(true);
    try {
      const response = await fetch(`${API_URL}/api/cake-reveal/update-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedCakeOrder.id,
          stage: revealStage,
          sneak_peek_image: sneakPeekImage || null,
          final_image: finalImage || null
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Notifications sent: ${data.notifications_sent.join(', ')}`);
        setShowCakeRevealModal(false);
        fetchCakeOrders();
      } else {
        toast.error('Failed to send notifications');
      }
    } catch (err) {
      toast.error('Error sending notifications');
    } finally {
      setSendingNotification(false);
    }
  };

  const OCCASION_OPTIONS = ['Birthday', 'First Birthday', 'Gotcha Day', 'Recovery Party', 'Milestone', 'Just Because'];
  const STAGE_OPTIONS = [
    { value: 'creating', label: '🎨 Creating', description: 'Cake artist is working on it' },
    { value: 'sneak_peek', label: '👀 Sneak Peek', description: 'Send blurred preview' },
    { value: 'ready', label: '🎁 Ready', description: 'Out for delivery' },
    { value: 'revealed', label: '🎂 Revealed', description: 'The big reveal!' }
  ];

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CELEBRATION WALL PHOTOS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-pink-500" />
              Celebration Wall Photos
              <Badge className="bg-purple-100 text-purple-700">{photos.length}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDefaults}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Seed Defaults
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingPhoto(null);
                  setFormData({
                    image_url: '',
                    pet_name: '',
                    occasion: 'Birthday',
                    caption: '',
                    location: '',
                    likes: 0,
                    is_featured: true
                  });
                  setShowAddModal(true);
                }}
                className="bg-pink-500 hover:bg-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" />
              <p className="text-gray-500 mt-2">Loading photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No celebration photos yet.</p>
              <p className="text-sm">Click "Seed Defaults" to add TheDoggyBakery photos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo, idx) => (
                <div 
                  key={photo.id || idx}
                  className={`relative group rounded-lg overflow-hidden border-2 ${
                    photo.is_featured ? 'border-green-400' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <img
                    src={photo.image_url || photo.imageUrl}
                    alt={photo.pet_name || photo.petName}
                    className="w-full h-32 object-cover"
                    onError={(e) => { e.target.src = ''; }}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEditClick(photo)}
                      className="p-2 bg-white rounded-full hover:bg-blue-100"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => toggleFeatured(photo)}
                      className="p-2 bg-white rounded-full hover:bg-yellow-100"
                    >
                      {photo.is_featured ? (
                        <EyeOff className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="p-2 bg-white rounded-full hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                  
                  {/* Info Badge */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2">
                    <p className="text-white text-xs font-medium truncate">
                      {photo.pet_name || photo.petName}
                    </p>
                    <p className="text-white/70 text-[10px]">{photo.location}</p>
                  </div>
                  
                  {/* Featured Badge */}
                  {photo.is_featured && (
                    <div className="absolute top-1 right-1">
                      <Badge className="bg-green-500 text-white text-[8px]">Live</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CAKE REVEAL MANAGEMENT */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Cake className="w-5 h-5 text-amber-500" />
              Cake Reveal Notifications
              <Badge className="bg-amber-100 text-amber-700">{cakeOrders.length} orders</Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCakeOrders}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCakeOrders ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              <p className="text-gray-500 mt-2">Loading cake orders...</p>
            </div>
          ) : cakeOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Cake className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No cake orders found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cakeOrders.map((order) => (
                <div 
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.customer_name}</span>
                      <Badge variant="outline" className="text-xs">
                        #{order.order_number}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{order.cake_items?.join(', ')}</p>
                    <p className="text-xs text-gray-400">{order.customer_email}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={
                      order.cake_reveal_stage === 'revealed' ? 'bg-green-500' :
                      order.cake_reveal_stage === 'ready' ? 'bg-blue-500' :
                      order.cake_reveal_stage === 'sneak_peek' ? 'bg-purple-500' :
                      'bg-amber-500'
                    }>
                      {order.cake_reveal_stage || 'creating'}
                    </Badge>
                    
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedCakeOrder(order);
                        setRevealStage(order.cake_reveal_stage || 'creating');
                        setSneakPeekImage('');
                        setFinalImage('');
                        setShowCakeRevealModal(true);
                      }}
                      className="bg-gradient-to-r from-pink-500 to-purple-500"
                    >
                      <Bell className="w-4 h-4 mr-1" />
                      Update & Notify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ADD/EDIT PHOTO MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingPhoto ? 'Edit Celebration Photo' : 'Add Celebration Photo'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Image URL */}
            <div>
              <label className="text-sm font-medium text-gray-700">Image URL *</label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
              {formData.image_url && (
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="mt-2 h-24 w-24 object-cover rounded-lg"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
            
            {/* Pet Name & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Pet Name *</label>
                <input
                  type="text"
                  value={formData.pet_name}
                  onChange={(e) => setFormData({ ...formData, pet_name: e.target.value })}
                  placeholder="e.g., Bruno"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Mumbai"
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
            
            {/* Occasion */}
            <div>
              <label className="text-sm font-medium text-gray-700">Occasion</label>
              <select
                value={formData.occasion}
                onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              >
                {OCCASION_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            
            {/* Caption */}
            <div>
              <label className="text-sm font-medium text-gray-700">Caption</label>
              <textarea
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="The best birthday ever! 🎂"
                rows={2}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            {/* Featured Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 text-pink-500 rounded"
              />
              <label htmlFor="is_featured" className="text-sm text-gray-700">
                Show on Celebration Wall (Featured)
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePhoto}
              disabled={!formData.image_url || !formData.pet_name}
              className="bg-pink-500 hover:bg-pink-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingPhoto ? 'Update' : 'Add'} Photo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CAKE REVEAL NOTIFICATION MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCakeRevealModal} onOpenChange={setShowCakeRevealModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cake className="w-5 h-5 text-amber-500" />
              Cake Reveal Notification
            </DialogTitle>
          </DialogHeader>
          
          {selectedCakeOrder && (
            <div className="space-y-4 py-4">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium">{selectedCakeOrder.customer_name}</p>
                <p className="text-sm text-gray-600">{selectedCakeOrder.cake_items?.join(', ')}</p>
                <p className="text-xs text-gray-400">Order #{selectedCakeOrder.order_number}</p>
              </div>
              
              {/* Stage Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Update Stage
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STAGE_OPTIONS.map(stage => (
                    <button
                      key={stage.value}
                      onClick={() => setRevealStage(stage.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        revealStage === stage.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{stage.label}</p>
                      <p className="text-xs text-gray-500">{stage.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Sneak Peek Image (for sneak_peek stage) */}
              {revealStage === 'sneak_peek' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Sneak Peek Image URL</label>
                  <input
                    type="url"
                    value={sneakPeekImage}
                    onChange={(e) => setSneakPeekImage(e.target.value)}
                    placeholder="https://... (will be shown blurred)"
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
              
              {/* Final Image (for revealed stage) */}
              {revealStage === 'revealed' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Final Reveal Image URL</label>
                  <input
                    type="url"
                    value={finalImage}
                    onChange={(e) => setFinalImage(e.target.value)}
                    placeholder="https://... (the big reveal!)"
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
              
              {/* Notification Channels */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Will notify via:</p>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1 text-green-600">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs">WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">Email</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-600">
                    <Inbox className="w-4 h-4" />
                    <span className="text-xs">In-App</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCakeRevealModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendCakeRevealNotification}
              disabled={sendingNotification}
              className="bg-gradient-to-r from-pink-500 to-purple-500"
            >
              {sendingNotification ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Update & Send Notifications
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CelebrationWallManager;
