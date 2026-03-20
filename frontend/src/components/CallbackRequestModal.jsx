/**
 * CallbackRequestModal.jsx
 * Modal for users to request a callback from the team
 * Creates a ticket in the Service Desk
 */

import React, { useState } from 'react';
import { bookViaConcierge } from '../utils/MiraCardActions';
import { tdc } from '../utils/tdc_intent';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Phone, Clock, CheckCircle, Loader2, Calendar, User, MessageCircle } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';

const CALLBACK_REASONS = [
  { value: 'general', label: 'General Inquiry', icon: '💬' },
  { value: 'order', label: 'Order Related', icon: '📦' },
  { value: 'booking', label: 'Service Booking', icon: '📅' },
  { value: 'complaint', label: 'Complaint', icon: '⚠️' },
  { value: 'partnership', label: 'Partnership Inquiry', icon: '🤝' },
  { value: 'celebration', label: 'Celebration Planning', icon: '🎂' },
  { value: 'emergency', label: 'Emergency', icon: '🚨' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const TIME_SLOTS = [
  { value: 'asap', label: 'As soon as possible' },
  { value: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 4 PM)' },
  { value: 'evening', label: 'Evening (4 PM - 7 PM)' },
];

const CallbackRequestModal = ({ isOpen, onClose, initialReason = '' }) => {
  const { user, token } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    reason: initialReason || 'general',
    preferredTime: 'asap',
    notes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ── tdc.book ──
    tdc.book({ service: formData.subject || "callback request", pillar: "platform", channel: "callback_request_modal" });

    
    if (!formData.name || !formData.phone) {
      toast({
        title: 'Missing Information',
        description: 'Please provide your name and phone number',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate phone number (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reasonInfo = CALLBACK_REASONS.find(r => r.value === formData.reason);
      const timeSlot = TIME_SLOTS.find(t => t.value === formData.preferredTime);
      
      // Create a ticket for callback request
      const ticketData = {
        member: {
          name: formData.name,
          phone: formData.phone,
          email: user?.email || ''
        },
        category: 'advisory',
        sub_category: 'callback_request',
        urgency: formData.reason === 'emergency' ? 'critical' : 'high',
        description: `📞 **CALLBACK REQUEST**

**Customer:** ${formData.name}
**Phone:** ${formData.phone}
**Reason:** ${reasonInfo?.icon} ${reasonInfo?.label}
**Preferred Time:** ${timeSlot?.label}

**Notes:**
${formData.notes || 'No additional notes'}

---
⚡ Action Required: Call back the customer at the earliest.`,
        source: 'callback_request',
        channel: 'web',
        tags: ['callback', formData.reason],
        priority: formData.reason === 'emergency' ? 1 : 2
      };
      
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(ticketData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setTicketId(result.ticket?.ticket_id || result.ticket_id || 'Submitted');
        setIsSuccess(true);
        
        toast({
          title: '✅ Callback Requested!',
          description: 'Our team will call you shortly.'
        });
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Callback request error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again or call us directly at +91 96631 85747',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      reason: 'general',
      preferredTime: 'asap',
      notes: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          // Success State
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Callback Requested! 🎉</DialogTitle>
            <DialogDescription className="mb-4">
              Our team will call you at <strong>{formData.phone}</strong> shortly.
            </DialogDescription>
            {ticketId && (
              <p className="text-sm text-gray-500 mb-4">
                Reference: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{ticketId}</span>
              </p>
            )}
            <div className="flex gap-2 justify-center">
              <Button onClick={handleClose}>Done</Button>
              <Button variant="outline" onClick={() => window.location.href = 'tel:+919663185747'}>
                <Phone className="w-4 h-4 mr-2" />
                Call Now Instead
              </Button>
            </div>
          </div>
        ) : (
          // Form State
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-500" />
                Request a Callback
              </DialogTitle>
              <DialogDescription>
                Leave your number and we'll call you back within 30 minutes during business hours.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Name */}
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Your Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              
              {/* Reason */}
              <div>
                <Label className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Reason for Call
                </Label>
                <Select 
                  value={formData.reason} 
                  onValueChange={(val) => setFormData({ ...formData, reason: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {CALLBACK_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.icon} {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Preferred Time */}
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Preferred Time
                </Label>
                <Select 
                  value={formData.preferredTime} 
                  onValueChange={(val) => setFormData({ ...formData, preferredTime: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <textarea
                  id="notes"
                  placeholder="Anything specific you'd like to discuss..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                />
              </div>
              
              {/* Submit */}
              <div className="flex gap-2 pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Request Callback
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
              
              {/* Direct call option */}
              <p className="text-center text-xs text-gray-500 pt-2">
                Or call us directly: <a href="tel:+919663185747" className="text-green-600 font-medium">+91 96631 85747</a>
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CallbackRequestModal;
