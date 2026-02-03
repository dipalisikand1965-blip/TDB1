/**
 * QuoteBuilder.jsx
 * 
 * Admin component for creating custom quotes from party requests.
 * Features:
 * - View party request details
 * - Search and add products/services to quote
 * - Apply discounts
 * - Send quote with payment link to member
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Plus, Minus, Trash2, Send, Search, 
  CheckCircle, Clock, CreditCard, X, Gift, Cake,
  Scissors, Camera, FileText, DollarSign, Percent,
  ChevronDown, ChevronUp, Eye, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { toast } from '../../hooks/use-toast';
import { API_URL } from '../../utils/api';

const QuoteBuilder = ({ partyRequest, ticketId, onClose, onQuoteSent }) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [quoteItems, setQuoteItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [existingQuote, setExistingQuote] = useState(null);
  const [showProducts, setShowProducts] = useState(true);

  const getAuthHeader = () => {
    const creds = localStorage.getItem('adminCredentials');
    if (creds) {
      const { username, password } = JSON.parse(creds);
      return 'Basic ' + btoa(`${username}:${password}`);
    }
    return '';
  };

  // Load existing quote if any
  useEffect(() => {
    const fetchExistingQuote = async () => {
      if (!partyRequest?.id) return;
      try {
        const res = await fetch(`${API_URL}/api/quotes/party-request/${partyRequest.id}`, {
          headers: { 'Authorization': getAuthHeader() }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.quotes?.length > 0) {
            const quote = data.quotes[0];
            setExistingQuote(quote);
            setQuoteItems(quote.items || []);
            setDiscount(quote.pricing?.discount_percent || 0);
            setNotes(quote.notes || '');
          }
        }
      } catch (err) {
        console.error('Error fetching existing quote:', err);
      }
    };
    fetchExistingQuote();
  }, [partyRequest?.id]);

  // Search products
  const searchProducts = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/products?search=${encodeURIComponent(query)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products || []);
      }
    } catch (err) {
      console.error('Error searching products:', err);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  // Add item to quote
  const addItem = (product) => {
    const existing = quoteItems.find(i => i.item_id === product.id);
    if (existing) {
      setQuoteItems(quoteItems.map(i => 
        i.item_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setQuoteItems([...quoteItems, {
        item_id: product.id,
        item_type: 'product',
        name: product.name || product.title,
        description: product.description?.substring(0, 100),
        quantity: 1,
        unit_price: product.price || 0,
        image: product.image || product.images?.[0]
      }]);
    }
    toast({ title: 'Added to quote', description: product.name || product.title });
  };

  // Update item quantity
  const updateQuantity = (itemId, delta) => {
    setQuoteItems(quoteItems.map(item => {
      if (item.item_id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Remove item
  const removeItem = (itemId) => {
    setQuoteItems(quoteItems.filter(i => i.item_id !== itemId));
  };

  // Calculate totals
  const subtotal = quoteItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  // Create/Update quote
  const saveQuote = async () => {
    if (quoteItems.length === 0) {
      toast({ title: 'Error', description: 'Add at least one item to the quote', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const endpoint = existingQuote 
        ? `${API_URL}/api/quotes/${existingQuote.id}`
        : `${API_URL}/api/quotes/create`;
      
      const method = existingQuote ? 'PUT' : 'POST';
      
      const body = existingQuote ? {
        items: quoteItems,
        discount_percent: discount,
        notes: notes
      } : {
        party_request_id: partyRequest.id,
        ticket_id: ticketId,
        member_email: partyRequest.user_email,
        member_name: partyRequest.user_name,
        items: quoteItems,
        discount_percent: discount,
        notes: notes,
        validity_days: 7
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: 'Quote Saved!', description: `Total: ₹${total.toLocaleString()}` });
        if (!existingQuote) {
          setExistingQuote({ id: data.quote_id });
        }
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.detail || 'Failed to save quote', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error saving quote:', err);
      toast({ title: 'Error', description: 'Failed to save quote', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Send quote to member
  const sendQuote = async () => {
    if (!existingQuote?.id) {
      await saveQuote();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/quotes/${existingQuote.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        }
      });

      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: '📨 Quote Sent!', 
          description: `Payment link sent to ${partyRequest.user_email}` 
        });
        onQuoteSent?.(data);
        onClose?.();
      } else {
        const error = await res.json();
        toast({ title: 'Error', description: error.detail || 'Failed to send quote', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error sending quote:', err);
      toast({ title: 'Error', description: 'Failed to send quote', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Quick add services based on party add-ons
  const quickAddServices = () => {
    const services = [];
    
    if (partyRequest?.add_ons?.grooming) {
      services.push({
        item_id: 'svc-grooming',
        item_type: 'service',
        name: 'Pre-Party Grooming Session',
        description: 'Full grooming to look pawfect for the party',
        quantity: 1,
        unit_price: 1499,
        image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200'
      });
    }
    
    if (partyRequest?.add_ons?.photography) {
      services.push({
        item_id: 'svc-photography',
        item_type: 'service',
        name: 'Pet Party Photography',
        description: 'Professional photos of the celebration',
        quantity: 1,
        unit_price: 2999,
        image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200'
      });
    }
    
    if (services.length > 0) {
      setQuoteItems([...quoteItems, ...services]);
      toast({ title: 'Services Added', description: `Added ${services.length} requested services` });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-amber-500 to-orange-500 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-xl flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Quote Builder
              </h2>
              <p className="text-sm opacity-90">
                {partyRequest?.pet_name}&apos;s {partyRequest?.occasion?.replace('-', ' ')} Party
              </p>
            </div>
            <div className="flex items-center gap-2">
              {existingQuote && (
                <Badge className="bg-white/20 text-white">
                  {existingQuote.id}
                </Badge>
              )}
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Search & Add Products */}
            <div className="space-y-4">
              {/* Party Details Summary */}
              <Card className="p-3 bg-amber-50 border-amber-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">📅 Date:</span> <strong>{partyRequest?.date}</strong></div>
                  <div><span className="text-gray-500">🕐 Time:</span> <strong>{partyRequest?.time}</strong></div>
                  <div><span className="text-gray-500">👥 Guests:</span> <strong>{partyRequest?.guest_count}</strong></div>
                  <div><span className="text-gray-500">💰 Budget:</span> <strong className="capitalize">{partyRequest?.budget}</strong></div>
                </div>
                {(partyRequest?.add_ons?.grooming || partyRequest?.add_ons?.photography) && (
                  <div className="mt-2 pt-2 border-t border-amber-200 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Requested:</span>
                    {partyRequest?.add_ons?.grooming && <Badge variant="outline" className="text-xs">✂️ Grooming</Badge>}
                    {partyRequest?.add_ons?.photography && <Badge variant="outline" className="text-xs">📸 Photography</Badge>}
                    <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={quickAddServices}>
                      <Plus className="w-3 h-3 mr-1" /> Add Services
                    </Button>
                  </div>
                )}
              </Card>

              {/* Product Search */}
              <div>
                <div 
                  className="flex items-center justify-between cursor-pointer p-2 bg-gray-100 rounded-lg"
                  onClick={() => setShowProducts(!showProducts)}
                >
                  <span className="font-medium flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Search Products
                  </span>
                  {showProducts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                
                {showProducts && (
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search cakes, treats, decorations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {searching && (
                      <div className="flex justify-center py-4">
                        <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    )}
                    
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {searchResults.map(product => (
                        <div 
                          key={product.id}
                          className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => addItem(product)}
                        >
                          <img 
                            src={product.image || product.images?.[0] || 'https://via.placeholder.com/50'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name || product.title}</p>
                            <p className="text-amber-600 font-bold text-sm">₹{product.price?.toLocaleString()}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Notes for Member</label>
                <Textarea
                  placeholder="Add personalized message or special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Right: Quote Items & Summary */}
            <div className="space-y-4">
              {/* Quote Items */}
              <Card className="p-3">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  Quote Items ({quoteItems.length})
                </h3>
                
                {quoteItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Search and add products to build the quote</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {quoteItems.map(item => (
                      <div key={item.item_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <img 
                          src={item.image || 'https://via.placeholder.com/40'}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">₹{item.unit_price.toLocaleString()} each</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.item_id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.item_id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="font-bold text-sm w-20 text-right">
                          ₹{(item.unit_price * item.quantity).toLocaleString()}
                        </p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-red-500"
                          onClick={() => removeItem(item.item_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Pricing Summary */}
              <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Quote Summary
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Discount
                    </span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-16 h-8 text-center"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>You save</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-amber-600">₹{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Status */}
              {existingQuote && (
                <Card className="p-3 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span>Status: </span>
                    <Badge variant={existingQuote.status === 'sent' ? 'default' : 'outline'}>
                      {existingQuote.status?.toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={saveQuote} 
              disabled={loading || quoteItems.length === 0}
              variant="outline"
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {existingQuote ? 'Update Quote' : 'Save Draft'}
            </Button>
            <Button 
              onClick={sendQuote}
              disabled={loading || quoteItems.length === 0}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Sending...' : 'Send Quote & Payment Link'}
            </Button>
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">
            Quote will be sent to: <strong>{partyRequest?.user_email}</strong>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default QuoteBuilder;
