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

  // Compact card for mobile 2x2 grid
  if (compact) {
    return (
      <>
        <Card 
          className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:border-purple-200 rounded-2xl"
          onClick={() => setShowModal(true)}
          data-testid={`concierge-exp-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className={`p-3 sm:p-4 bg-gradient-to-br ${gradient}`}>
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="text-xl sm:text-2xl flex-shrink-0">{icon}</div>
              <div className="flex-1 text-white min-w-0">
                <h4 className="font-bold text-xs sm:text-sm leading-tight truncate">{title}</h4>
              </div>
              {badge && (
                <Badge className={`${badgeColor} text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 flex-shrink-0`}>
                  {badge}
                </Badge>
              )}
            </div>
          </div>
          <div className="p-2 sm:p-3 bg-white">
            <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2 mb-2">{description}</p>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-purple-600 font-medium group-hover:translate-x-1 transition-transform">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="truncate">{ctaText}</span>
              <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
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

  // Full card - Elegant design matching Fit page style
  return (
    <>
      <Card 
        className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-purple-200 rounded-2xl"
        onClick={() => setShowModal(true)}
        data-testid={`concierge-exp-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {/* Card Header with Gradient - More elegant, less boxy */}
        <div className={`h-24 sm:h-28 md:h-32 bg-gradient-to-br ${gradient} p-4 sm:p-5 relative overflow-hidden`}>
          {/* Background icon - subtle */}
          <div className="absolute -right-2 sm:-right-4 -bottom-2 sm:-bottom-4 opacity-15 text-5xl sm:text-7xl">
            {icon}
          </div>
          
          {/* Badge */}
          {badge && (
            <Badge className={`${badgeColor} text-white text-[10px] sm:text-xs absolute top-3 sm:top-4 right-3 sm:right-4`}>
              {badge}
            </Badge>
          )}
          
          {/* Icon and Title */}
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{icon}</div>
            <h3 className="text-white font-bold text-base sm:text-lg leading-tight">{title}</h3>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 bg-white">
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">{description}</p>
          
          {/* Highlights - Hidden on mobile for cleaner look */}
          {highlights.length > 0 && (
            <div className="hidden sm:block space-y-1.5 mb-4">
              {highlights.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-gray-500">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{item}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* CTA */}
          <Button 
            className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white group-hover:scale-[1.02] transition-transform text-xs sm:text-sm py-2 sm:py-2.5 rounded-xl`}
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {ctaText}
          </Button>
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
        userPets={userPets}
        selectedPetOption={selectedPetOption}
        setSelectedPetOption={setSelectedPetOption}
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
  userPets = [],
  selectedPetOption,
  setSelectedPetOption,
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

          {/* Pet Selection - For logged-in users with pets */}
          {userPets.length > 0 && (
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <Label className="flex items-center gap-2 mb-3">
                <PawPrint className="w-4 h-4 text-purple-600" />
                Which pet is this for?
              </Label>
              <Select value={selectedPetOption} onValueChange={setSelectedPetOption}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select pet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🐾 All my pets ({userPets.map(p => p.name).join(', ')})</SelectItem>
                  {userPets.map(pet => (
                    <SelectItem key={pet._id || pet.id} value={pet._id || pet.id}>
                      🐕 {pet.name} {pet.breed ? `(${pet.breed})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <Input
                      placeholder="WhatsApp Number"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
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

          {/* WhatsApp for logged-in users */}
          {user && (
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp Number
              </Label>
              <Input
                placeholder="Your WhatsApp number"
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              />
              <p className="text-xs text-gray-400 mt-1">We'll reach out via WhatsApp for faster communication</p>
            </div>
          )}

          {/* Pet Name for users without pets registered */}
          {userPets.length === 0 && (
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <PawPrint className="w-4 h-4 text-purple-600" />
                Your Pet&apos;s Name (optional)
              </Label>
              <Input
                placeholder="e.g., Luna, Mojo"
                value={formData.pet_name}
                onChange={(e) => setFormData({...formData, pet_name: e.target.value})}
              />
            </div>
          )}

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
