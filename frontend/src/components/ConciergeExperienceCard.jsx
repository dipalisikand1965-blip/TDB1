/**
 * ConciergeExperienceCard.jsx
 * 
 * A card representing an elevated concierge experience - NOT a service.
 * These are curated experiences that evolve through conversation, judgment, and care.
 * 
 * If something can be booked without asking questions, it is NOT Concierge®.
 */

import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Sparkles, MessageCircle, Send, Loader2, CheckCircle, 
  ChevronRight, User, Phone, Mail, PawPrint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';

/**
 * ConciergeExperienceCard
 * 
 * @param {Object} props
 * @param {string} props.pillar - The pillar this experience belongs to (travel, stay, care, enjoy, learn)
 * @param {string} props.title - Experience title
 * @param {string} props.description - Brief description of the experience
 * @param {string} props.icon - Icon/emoji for the experience
 * @param {string} props.gradient - Tailwind gradient classes (e.g., "from-violet-500 to-purple-600")
 * @param {string} props.ctaText - CTA button text (default: "Ask Concierge®")
 * @param {string} props.badge - Optional badge text (e.g., "Most Popular", "New")
 * @param {string} props.badgeColor - Badge color (e.g., "bg-amber-500")
 * @param {string[]} props.highlights - Optional list of highlights/what's included
 * @param {boolean} props.compact - If true, renders a smaller card
 */
const ConciergeExperienceCard = ({
  pillar,
  title,
  description,
  icon,
  gradient = "from-violet-500 to-purple-600",
  ctaText = "Ask Concierge®",
  badge,
  badgeColor = "bg-amber-500",
  highlights = [],
  compact = false
}) => {
  const { user, token } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [selectedPetOption, setSelectedPetOption] = useState('all'); // 'all' or pet id
  const [formData, setFormData] = useState({
    message: '',
    name: user?.name || '',
    email: user?.email || '',
    whatsapp: user?.phone || user?.whatsapp || '',
    pet_name: ''
  });

  // Fetch user's pets when modal opens
  useEffect(() => {
    if (showModal && user && token) {
      fetchUserPets();
    }
  }, [showModal, user, token]);

  const fetchUserPets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPets(data.pets || data || []);
        // Auto-select first pet if available
        if (data.pets?.length > 0 || data?.length > 0) {
          const pets = data.pets || data;
          setSelectedPetOption(pets[0]?._id || pets[0]?.id || 'all');
        }
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  // Get selected pet name based on selection
  const getSelectedPetName = () => {
    if (selectedPetOption === 'all') {
      return userPets.length > 0 
        ? userPets.map(p => p.name).join(', ')
        : formData.pet_name;
    }
    const pet = userPets.find(p => (p._id || p.id) === selectedPetOption);
    return pet?.name || formData.pet_name;
  };

  const handleSubmit = async () => {
    if (!formData.message.trim()) {
      toast({ 
        title: "Please tell us more", 
        description: "Share your needs so we can help you better",
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    try {
      const petName = getSelectedPetName();
      const payload = {
        pillar,
        experience_type: title.toLowerCase().replace(/\s+/g, '_'),
        experience_title: title,
        message: formData.message,
        user_name: formData.name || user?.name || 'Guest',
        user_email: formData.email || user?.email,
        user_whatsapp: formData.whatsapp || user?.phone || user?.whatsapp,
        pet_name: petName,
        pet_selection: selectedPetOption, // 'all' or specific pet id
        source: 'concierge_experience_card'
      };

      const response = await fetch(`${API_URL}/api/concierge/experience-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitted(true);
        toast({
          title: "Request Received! 🐾",
          description: "Our concierge will reach out within 24 hours."
        });
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting concierge request:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or call us directly.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setShowModal(false);
    setSubmitted(false);
    setFormData({
      message: '',
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      pet_name: ''
    });
  };

  if (compact) {
    return (
      <>
        <Card 
          className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-200"
          onClick={() => setShowModal(true)}
          data-testid={`concierge-exp-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className={`p-4 bg-gradient-to-br ${gradient}`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">{icon}</div>
              <div className="flex-1 text-white">
                <h4 className="font-bold text-sm leading-tight">{title}</h4>
              </div>
              {badge && (
                <Badge className={`${badgeColor} text-white text-[10px] px-1.5 py-0.5`}>
                  {badge}
                </Badge>
              )}
            </div>
          </div>
          <div className="p-3 bg-white">
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">{description}</p>
            <div className="flex items-center gap-1 text-xs text-purple-600 font-medium group-hover:translate-x-1 transition-transform">
              <Sparkles className="w-3 h-3" />
              <span>{ctaText}</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </Card>

        <ConciergeModal 
          open={showModal}
          onClose={resetAndClose}
          title={title}
          description={description}
          pillar={pillar}
          icon={icon}
          gradient={gradient}
          formData={formData}
          setFormData={setFormData}
          user={user}
          submitting={submitting}
          submitted={submitted}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  return (
    <>
      <Card 
        className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200"
        onClick={() => setShowModal(true)}
        data-testid={`concierge-exp-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {/* Card Header with Gradient */}
        <div className={`h-32 bg-gradient-to-br ${gradient} p-5 relative overflow-hidden`}>
          {/* Background icon */}
          <div className="absolute -right-4 -bottom-4 opacity-20 text-7xl">
            {icon}
          </div>
          
          {/* Badge */}
          {badge && (
            <Badge className={`${badgeColor} text-white text-xs absolute top-4 right-4`}>
              {badge}
            </Badge>
          )}
          
          {/* Icon and Title */}
          <div className="relative z-10">
            <div className="text-3xl mb-2">{icon}</div>
            <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 bg-white">
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{description}</p>
          
          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="space-y-1.5 mb-4">
              {highlights.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* CTA */}
          <Button 
            className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white group-hover:scale-[1.02] transition-transform`}
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {ctaText}
          </Button>
          
          {/* Concierge Notice */}
          <p className="text-center text-[10px] text-gray-400 mt-2">
            Not a booking — starts a conversation
          </p>
        </div>
      </Card>

      <ConciergeModal 
        open={showModal}
        onClose={resetAndClose}
        title={title}
        description={description}
        pillar={pillar}
        icon={icon}
        gradient={gradient}
        formData={formData}
        setFormData={setFormData}
        user={user}
        submitting={submitting}
        submitted={submitted}
        onSubmit={handleSubmit}
      />
    </>
  );
};

/**
 * ConciergeModal - The conversation starter modal
 */
const ConciergeModal = ({
  open,
  onClose,
  title,
  description,
  pillar,
  icon,
  gradient,
  formData,
  setFormData,
  user,
  submitting,
  submitted,
  onSubmit
}) => {
  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">You're All Set!</h3>
            <p className="text-gray-600 mb-6">
              Our concierge team will review your request and reach out within 24 hours.
            </p>
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl`}>
              {icon}
            </div>
            <div>
              <span className="block">{title}</span>
              <span className="text-xs font-normal text-gray-500 capitalize">{pillar} Concierge®</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Experience Context */}
          <div className={`p-4 rounded-xl bg-gradient-to-r ${gradient} bg-opacity-10`}>
            <p className="text-sm text-gray-700">{description}</p>
          </div>

          {/* Conversation Prompt */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-purple-600" />
              Tell us what you're looking for
            </Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder={`Share your vision, preferences, dates, or any specific needs. Our concierge will take it from here...`}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              The more details you share, the better we can help.
            </p>
          </div>

          {/* Contact Info */}
          {!user && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
              <Label className="text-sm font-medium text-gray-700">Your Contact Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Pet Name (Optional) */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <PawPrint className="w-4 h-4 text-purple-600" />
              Your Pet's Name (optional)
            </Label>
            <Input
              placeholder="e.g., Luna, Mojo"
              value={formData.pet_name}
              onChange={(e) => setFormData({...formData, pet_name: e.target.value})}
            />
          </div>

          {/* What Happens Next */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="text-xs font-medium text-purple-800 mb-2">What happens next?</p>
            <ul className="text-xs text-purple-700 space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Our concierge reviews your request
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                We reach out within 24 hours to understand more
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Together, we craft the perfect experience
              </li>
            </ul>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !formData.message.trim()}
            className={`flex-1 bg-gradient-to-r ${gradient}`}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Start Conversation</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConciergeExperienceCard;
