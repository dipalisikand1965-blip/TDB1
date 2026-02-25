/**
 * UniversalServiceButton.jsx
 * 
 * UNIVERSAL SERVICE COMMAND - BUTTON COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * A single button that provides the complete service request lifecycle:
 * 1. Opens intake modal (if needed) or submits directly
 * 2. Creates service desk ticket
 * 3. Triggers admin notification
 * 4. Shows member notification (toast)
 * 5. Navigates to inbox thread
 * 
 * VARIANTS:
 * - floating: Fixed position floating button (like C® button)
 * - inline: Inline button for cards/sections
 * - minimal: Icon-only button
 * - header: For header/navbar usage
 * 
 * WORKS ON BOTH MOBILE AND DESKTOP
 */

import React, { useState } from 'react';
import { 
  Sparkles, Send, Loader2, MessageSquare, 
  HelpCircle, Phone, Mail, ChevronRight, X 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import useUniversalServiceCommand, { ENTRY_POINTS, REQUEST_TYPES } from '../hooks/useUniversalServiceCommand';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK INTAKE MODAL - Simple form for capturing user intent
// ═══════════════════════════════════════════════════════════════════════════════

const QuickIntakeModal = ({ 
  isOpen, 
  onClose, 
  pillar, 
  pet, 
  onSubmit, 
  isSubmitting,
  presetMessage = ''
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState(presetMessage);
  const [contactPreference, setContactPreference] = useState('inbox'); // inbox, whatsapp, call
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    await onSubmit({
      message,
      contactPreference
    });
    
    setMessage('');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            How can we help?
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pet context */}
          {pet && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500">About:</span>
              <Badge variant="outline">{pet.name}</Badge>
            </div>
          )}
          
          {/* Message input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tell us what you need
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`e.g., "I need help setting up a meal plan for ${pet?.name || 'my pet'}..."`}
              className="min-h-[100px]"
              required
            />
          </div>
          
          {/* Contact preference */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              How should we respond?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContactPreference('inbox')}
                className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                  contactPreference === 'inbox' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="w-4 h-4 mx-auto mb-1" />
                In-App Inbox
              </button>
              <button
                type="button"
                onClick={() => setContactPreference('whatsapp')}
                className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                  contactPreference === 'whatsapp' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Phone className="w-4 h-4 mx-auto mb-1" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setContactPreference('call')}
                className={`flex-1 p-3 rounded-lg border text-sm transition-all ${
                  contactPreference === 'call' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Phone className="w-4 h-4 mx-auto mb-1" />
                Call Me
              </button>
            </div>
          </div>
          
          {/* User info display */}
          {user && (
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Mail className="w-3 h-3" />
              We'll also email you at {user.email}
            </div>
          )}
          
          {/* Submit button */}
          <Button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send to Concierge®
                <Send className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const UniversalServiceButton = ({
  // Required
  pillar = 'general',
  
  // Optional context
  pet = null,
  entryPoint = ENTRY_POINTS.QUICK_ACTION,
  
  // Appearance
  variant = 'floating', // floating, inline, minimal, header
  position = 'bottom-right', // bottom-right, bottom-left, inline
  size = 'default', // small, default, large
  label = 'Ask Concierge®',
  showLabel = true,
  className = '',
  
  // Behavior
  requireIntakeModal = true, // If false, shows instant submit button
  presetMessage = '',
  navigateToInbox = true,
  
  // Callbacks
  onSubmitSuccess = null,
  onSubmitError = null
}) => {
  const { user } = useAuth();
  const { submitRequest, isSubmitting } = useUniversalServiceCommand();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Handle button click
  const handleClick = () => {
    if (!user) {
      // Could redirect to login
      return;
    }
    
    if (requireIntakeModal) {
      setIsModalOpen(true);
    } else {
      // Direct submit with preset message
      handleDirectSubmit();
    }
  };
  
  // Direct submit (no modal)
  const handleDirectSubmit = async () => {
    const result = await submitRequest({
      type: REQUEST_TYPES.HELP_REQUEST,
      pillar,
      source: variant,
      details: {
        message: presetMessage || `Quick help request from ${pillar} page`,
        contact_preference: 'inbox'
      },
      pet,
      entryPoint,
      navigateToInbox
    });
    
    if (result.success && onSubmitSuccess) {
      onSubmitSuccess(result);
    } else if (!result.success && onSubmitError) {
      onSubmitError(result.error);
    }
  };
  
  // Modal submit
  const handleModalSubmit = async ({ message, contactPreference }) => {
    const result = await submitRequest({
      type: REQUEST_TYPES.HELP_REQUEST,
      pillar,
      source: variant,
      details: {
        message,
        contact_preference: contactPreference,
        preferred_channel: contactPreference
      },
      pet,
      entryPoint,
      navigateToInbox
    });
    
    if (result.success && onSubmitSuccess) {
      onSubmitSuccess(result);
    } else if (!result.success && onSubmitError) {
      onSubmitError(result.error);
    }
  };
  
  // Don't render if no user
  if (!user) {
    return null;
  }
  
  // Size configs
  const sizeConfig = {
    small: { button: 'h-10 px-3 text-sm', icon: 'w-4 h-4' },
    default: { button: 'h-12 px-4', icon: 'w-5 h-5' },
    large: { button: 'h-14 px-6 text-lg', icon: 'w-6 h-6' }
  };
  
  // Position configs (for floating variant)
  // Mobile: above the mobile nav bar (bottom-24)
  // Desktop: positioned above Mira orb (bottom-24)
  const positionConfig = {
    'bottom-right': 'fixed bottom-20 right-4 z-[9990] sm:bottom-24 sm:right-6',
    'bottom-left': 'fixed bottom-20 left-4 z-[9990] sm:bottom-24 sm:left-6',
    'inline': ''
  };
  
  const config = sizeConfig[size] || sizeConfig.default;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER VARIANTS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Floating variant - Fixed position button
  if (variant === 'floating') {
    return (
      <>
        <div className={positionConfig[position] || positionConfig['bottom-right']}>
          <button
            onClick={handleClick}
            disabled={isSubmitting}
            className={`flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 
              text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 
              px-4 py-3 ${className}`}
            data-testid="universal-service-button"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {showLabel && <span className="font-medium">{label}</span>}
          </button>
        </div>
        
        <QuickIntakeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pillar={pillar}
          pet={pet}
          onSubmit={handleModalSubmit}
          isSubmitting={isSubmitting}
          presetMessage={presetMessage}
        />
      </>
    );
  }
  
  // Inline variant - Standard button
  if (variant === 'inline') {
    return (
      <>
        <Button
          onClick={handleClick}
          disabled={isSubmitting}
          className={`bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 ${config.button} ${className}`}
          data-testid="universal-service-button-inline"
        >
          {isSubmitting ? (
            <Loader2 className={`${config.icon} mr-2 animate-spin`} />
          ) : (
            <Sparkles className={`${config.icon} mr-2`} />
          )}
          {label}
          <ChevronRight className={`${config.icon} ml-1`} />
        </Button>
        
        <QuickIntakeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pillar={pillar}
          pet={pet}
          onSubmit={handleModalSubmit}
          isSubmitting={isSubmitting}
          presetMessage={presetMessage}
        />
      </>
    );
  }
  
  // Minimal variant - Icon only
  if (variant === 'minimal') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isSubmitting}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
          data-testid="universal-service-button-minimal"
          title={label}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
          ) : (
            <HelpCircle className="w-5 h-5 text-orange-500" />
          )}
        </button>
        
        <QuickIntakeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pillar={pillar}
          pet={pet}
          onSubmit={handleModalSubmit}
          isSubmitting={isSubmitting}
          presetMessage={presetMessage}
        />
      </>
    );
  }
  
  // Header variant
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleClick}
          disabled={isSubmitting}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 
            text-white text-sm transition-colors ${className}`}
          data-testid="universal-service-button-header"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {showLabel && <span>{label}</span>}
        </button>
        
        <QuickIntakeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          pillar={pillar}
          pet={pet}
          onSubmit={handleModalSubmit}
          isSubmitting={isSubmitting}
          presetMessage={presetMessage}
        />
      </>
    );
  }
  
  // Default fallback
  return null;
};

export default UniversalServiceButton;
