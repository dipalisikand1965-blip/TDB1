/**
 * QuotesTab.jsx - Dark Theme
 * Member dashboard tab for viewing and managing quotes from The Doggy Company concierge®
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

// Quote status display config - Dark theme colors
const QUOTE_STATUS = {
  draft: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: FileText },
  sent: { label: 'Awaiting Review', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  viewed: { label: 'Viewed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: CheckCircle },
  accepted: { label: 'Accepted', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle },
  paid: { label: 'Paid', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CreditCard },
  completed: { label: 'Completed', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle }
};

const QuotesTab = ({ user, token }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

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

  const viewQuote = async (quote) => {
    setSelectedQuote(quote);
    setShowQuoteModal(true);
    if (quote.status === 'sent') {
      try {
        await fetch(`${API_URL}/api/quotes/${quote.id}?token=${quote.access_token || ''}`);
        fetchQuotes();
      } catch (error) {
        console.error('Failed to mark quote as viewed:', error);
      }
    }
  };

  const acceptQuote = async (quoteId) => {
    try {
      const response = await fetch(`${API_URL}/api/quotes/${quoteId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast({ title: '✅ Quote Accepted!', description: 'You can now proceed to payment.' });
        fetchQuotes();
        setShowQuoteModal(false);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to accept quote', variant: 'destructive' });
    }
  };

  const isExpired = (quote) => {
    if (!quote.expires_at) return false;
    return new Date(quote.expires_at) < new Date();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-300" data-testid="quotes-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            My Quotes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View and manage quotes from our Concierge® team
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchQuotes}
          className="bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No Quotes Yet</h3>
          <p className="text-slate-400 mb-4 text-sm max-w-sm mx-auto">
            When you request a party or custom service, our Concierge® team will send you personalized quotes here.
          </p>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            onClick={() => window.location.href = '/celebrate'}
          >
            Plan a Party
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {quotes.map((quote) => {
            const status = QUOTE_STATUS[quote.status] || QUOTE_STATUS.sent;
            const StatusIcon = status.icon;
            const expired = isExpired(quote);
            
            return (
              <Card 
                key={quote.id}
                className={`p-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl hover:border-purple-500/30 transition-all cursor-pointer ${expired ? 'opacity-60' : ''}`}
                onClick={() => viewQuote(quote)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={`border ${status.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {expired ? 'Expired' : status.label}
                      </Badge>
                      <span className="text-xs text-slate-500 font-mono">#{quote.id}</span>
                    </div>
                    
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-1 truncate">
                      {quote.party_details?.pet_name ? `${quote.party_details.pet_name}'s ` : ''}
                      {quote.party_details?.occasion || 'Custom Quote'}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {quote.items?.length || 0} items
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(quote.created_at)}
                      </span>
                    </div>
                    
                    {quote.expires_at && !expired && (
                      <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Expires {formatDate(quote.expires_at)}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-xl sm:text-2xl font-bold text-white">
                      ₹{quote.pricing?.total?.toLocaleString('en-IN') || 0}
                    </p>
                    {quote.pricing?.discount_percent > 0 && (
                      <p className="text-xs text-emerald-400">
                        {quote.pricing.discount_percent}% discount applied
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50 text-xs sm:text-sm"
                    onClick={(e) => { e.stopPropagation(); viewQuote(quote); }}
                  >
                    View Details
                  </Button>
                  
                  {(quote.status === 'sent' || quote.status === 'viewed') && !expired && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs sm:text-sm"
                      onClick={(e) => { e.stopPropagation(); acceptQuote(quote.id); }}
                    >
                      Accept & Pay
                    </Button>
                  )}
                  
                  {quote.status === 'accepted' && quote.payment_link && (
                    <Button 
                      size="sm" 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-xs sm:text-sm"
                      onClick={(e) => { e.stopPropagation(); window.open(quote.payment_link, '_blank'); }}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-purple-400" />
              Quote Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedQuote && (
            <div className="space-y-4">
              {selectedQuote.party_details && (
                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-300 mb-2">
                    🎉 {selectedQuote.party_details.pet_name}&apos;s {selectedQuote.party_details.occasion}
                  </h4>
                  {selectedQuote.party_details.party_date && (
                    <p className="text-sm text-purple-400">📅 {formatDate(selectedQuote.party_details.party_date)}</p>
                  )}
                  {selectedQuote.party_details.guest_count && (
                    <p className="text-sm text-purple-400">👥 {selectedQuote.party_details.guest_count} guests</p>
                  )}
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-white mb-2">Items Included</h4>
                <div className="space-y-2">
                  {selectedQuote.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-white text-sm">{item.name}</p>
                        <p className="text-xs text-slate-400">Qty: {item.quantity} × ₹{item.unit_price?.toLocaleString('en-IN')}</p>
                      </div>
                      <p className="font-semibold text-white">₹{((item.quantity || 1) * (item.unit_price || 0)).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">₹{selectedQuote.pricing?.subtotal?.toLocaleString('en-IN') || 0}</span>
                </div>
                {selectedQuote.pricing?.discount_percent > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400 mb-1">
                    <span>Discount ({selectedQuote.pricing.discount_percent}%)</span>
                    <span>-₹{selectedQuote.pricing?.discount_amount?.toLocaleString('en-IN') || 0}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                  <span className="text-white">Total</span>
                  <span className="text-white">₹{selectedQuote.pricing?.total?.toLocaleString('en-IN') || 0}</span>
                </div>
              </div>
              
              {selectedQuote.notes && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                  <p className="text-sm text-amber-300"><strong>Note from Concierge®:</strong> {selectedQuote.notes}</p>
                </div>
              )}
              
              {selectedQuote.expires_at && !isExpired(selectedQuote) && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <p className="text-sm text-amber-300">This quote expires on <strong>{formatDate(selectedQuote.expires_at)}</strong></p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                {(selectedQuote.status === 'sent' || selectedQuote.status === 'viewed') && !isExpired(selectedQuote) && (
                  <>
                    <Button variant="outline" className="flex-1 border-white/10 text-white hover:bg-slate-800" onClick={() => setShowQuoteModal(false)}>
                      Review Later
                    </Button>
                    <Button className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600" onClick={() => acceptQuote(selectedQuote.id)}>
                      Accept Quote
                    </Button>
                  </>
                )}
                
                {selectedQuote.status === 'accepted' && selectedQuote.payment_link && (
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600" onClick={() => window.open(selectedQuote.payment_link, '_blank')}>
                    <CreditCard className="w-4 h-4 mr-2" />Proceed to Payment<ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
                
                {selectedQuote.status === 'paid' && (
                  <div className="w-full text-center py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-emerald-400 font-semibold">Payment Received!</p>
                    <p className="text-sm text-emerald-300">Our team will contact you shortly.</p>
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
