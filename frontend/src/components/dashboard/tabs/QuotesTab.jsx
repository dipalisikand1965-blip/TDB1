/**
 * QuotesTab.jsx
 * Member dashboard tab for viewing and managing quotes from The Doggy Company concierge
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { 
  FileText, CreditCard, Clock, CheckCircle, XCircle, 
  ChevronRight, Package, Sparkles, Calendar, RefreshCw,
  AlertCircle, ExternalLink, Loader2
} from 'lucide-react';
import { API_URL } from '../../../utils/api';
import { toast } from '../../../hooks/use-toast';

// Quote status display config
const QUOTE_STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  sent: { label: 'Awaiting Review', color: 'bg-blue-100 text-blue-700', icon: Clock },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CreditCard },
  completed: { label: 'Completed', color: 'bg-teal-100 text-teal-700', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700', icon: XCircle },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700', icon: XCircle }
};

const QuotesTab = ({ user, token }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  // Fetch user's quotes
  const fetchQuotes = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/quotes/member?email=${encodeURIComponent(user.email)}`);
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [user?.email]);

  // View quote details (marks as viewed)
  const viewQuote = async (quote) => {
    setSelectedQuote(quote);
    setShowQuoteModal(true);
    
    // Mark as viewed if not already
    if (quote.status === 'sent') {
      try {
        await fetch(`${API_URL}/api/quotes/${quote.id}?token=${quote.access_token || ''}`);
        fetchQuotes(); // Refresh to get updated status
      } catch (error) {
        console.error('Failed to mark quote as viewed:', error);
      }
    }
  };

  // Accept quote
  const acceptQuote = async (quoteId) => {
    try {
      const response = await fetch(`${API_URL}/api/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        toast({
          title: '✅ Quote Accepted!',
          description: 'You can now proceed to payment.'
        });
        fetchQuotes();
        setShowQuoteModal(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept quote',
        variant: 'destructive'
      });
    }
  };

  // Check if quote is expired
  const isExpired = (quote) => {
    if (!quote.expires_at) return false;
    return new Date(quote.expires_at) < new Date();
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            My Quotes
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            View and manage quotes from our concierge team
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchQuotes}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quotes Yet</h3>
          <p className="text-gray-600 mb-4">
            When you request a party or custom service, our concierge team will send you personalized quotes here.
          </p>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600"
            onClick={() => window.location.href = '/celebrate'}
          >
            Plan a Party
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => {
            const status = QUOTE_STATUS[quote.status] || QUOTE_STATUS.sent;
            const StatusIcon = status.icon;
            const expired = isExpired(quote);
            
            return (
              <Card 
                key={quote.id}
                className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${expired ? 'opacity-60' : ''}`}
                onClick={() => viewQuote(quote)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={status.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {expired ? 'Expired' : status.label}
                      </Badge>
                      <span className="text-xs text-gray-500">#{quote.id}</span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {quote.party_details?.pet_name ? `${quote.party_details.pet_name}'s ` : ''}
                      {quote.party_details?.occasion || 'Custom Quote'}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {quote.items?.length || 0} items
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(quote.created_at)}
                      </span>
                    </div>
                    
                    {quote.expires_at && !expired && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Expires {formatDate(quote.expires_at)}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      ₹{quote.pricing?.total?.toLocaleString('en-IN') || 0}
                    </p>
                    {quote.pricing?.discount_percent > 0 && (
                      <p className="text-xs text-green-600">
                        {quote.pricing.discount_percent}% discount applied
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); viewQuote(quote); }}
                  >
                    View Details
                  </Button>
                  
                  {(quote.status === 'sent' || quote.status === 'viewed') && !expired && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                      onClick={(e) => { e.stopPropagation(); acceptQuote(quote.id); }}
                    >
                      Accept & Pay
                    </Button>
                  )}
                  
                  {quote.status === 'accepted' && quote.payment_link && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        window.open(quote.payment_link, '_blank');
                      }}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pay Now
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quote Detail Modal */}
      <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Quote Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-4">
              {/* Party Info */}
              {selectedQuote.party_details && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    🎉 {selectedQuote.party_details.pet_name}'s {selectedQuote.party_details.occasion}
                  </h4>
                  {selectedQuote.party_details.party_date && (
                    <p className="text-sm text-purple-700">
                      📅 {formatDate(selectedQuote.party_details.party_date)}
                    </p>
                  )}
                  {selectedQuote.party_details.guest_count && (
                    <p className="text-sm text-purple-700">
                      👥 {selectedQuote.party_details.guest_count} guests
                    </p>
                  )}
                </div>
              )}
              
              {/* Items */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Items Included</h4>
                <div className="space-y-2">
                  {selectedQuote.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × ₹{item.unit_price?.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ₹{((item.quantity || 1) * (item.unit_price || 0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pricing Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{selectedQuote.pricing?.subtotal?.toLocaleString('en-IN') || 0}</span>
                </div>
                {selectedQuote.pricing?.discount_percent > 0 && (
                  <div className="flex justify-between text-sm text-green-600 mb-1">
                    <span>Discount ({selectedQuote.pricing.discount_percent}%)</span>
                    <span>-₹{selectedQuote.pricing?.discount_amount?.toLocaleString('en-IN') || 0}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>₹{selectedQuote.pricing?.total?.toLocaleString('en-IN') || 0}</span>
                </div>
              </div>
              
              {/* Notes */}
              {selectedQuote.notes && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note from concierge:</strong> {selectedQuote.notes}
                  </p>
                </div>
              )}
              
              {/* Expiry Warning */}
              {selectedQuote.expires_at && !isExpired(selectedQuote) && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    This quote expires on <strong>{formatDate(selectedQuote.expires_at)}</strong>
                  </p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {(selectedQuote.status === 'sent' || selectedQuote.status === 'viewed') && !isExpired(selectedQuote) && (
                  <>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowQuoteModal(false)}
                    >
                      Review Later
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                      onClick={() => acceptQuote(selectedQuote.id)}
                    >
                      Accept Quote
                    </Button>
                  </>
                )}
                
                {selectedQuote.status === 'accepted' && selectedQuote.payment_link && (
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    onClick={() => window.open(selectedQuote.payment_link, '_blank')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Proceed to Payment
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
                
                {selectedQuote.status === 'paid' && (
                  <div className="w-full text-center py-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-700 font-semibold">Payment Received!</p>
                    <p className="text-sm text-green-600">Our team will contact you shortly.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotesTab;
