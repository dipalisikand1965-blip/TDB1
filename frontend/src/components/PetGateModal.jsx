/**
 * PetGateModal - The "Add Your Pet First" Modal
 * 
 * THE DOCTRINE: "No member without a pet."
 * 
 * This modal appears when a user tries to:
 * - Checkout without a pet
 * - Chat with Mira without a pet
 * - Make a booking without a pet
 * 
 * It's designed to be warm and inviting, not blocking.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { PawPrint, Heart, Sparkles, ArrowRight, Calendar, ShoppingBag } from 'lucide-react';

const PetGateModal = ({ 
  isOpen, 
  onClose, 
  gateMessage,
  onPetAdded 
}) => {
  const navigate = useNavigate();

  const handleAddPet = () => {
    onClose();
    navigate('/pet-soul-onboard');
  };

  const benefits = [
    { icon: Heart, text: 'Personalized health tracking', color: 'text-rose-500' },
    { icon: Sparkles, text: 'AI-powered recommendations', color: 'text-purple-500' },
    { icon: Calendar, text: 'Birthday & vaccine reminders', color: 'text-blue-500' },
    { icon: ShoppingBag, text: 'Tailored product suggestions', color: 'text-emerald-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          {/* Paw Icon Animation */}
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center animate-pulse">
            <PawPrint className="w-8 h-8 text-purple-600" />
          </div>
          
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {gateMessage?.title || "Let's Meet Your Pet!"}
          </DialogTitle>
          
          <DialogDescription className="text-gray-600 mt-2">
            {gateMessage?.message || "Add your pet to unlock personalized experiences."}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits Section */}
        <div className="my-6 space-y-3">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            What you'll unlock:
          </p>
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                <benefit.icon className={`w-4 h-4 ${benefit.color}`} />
              </div>
              <span className="text-sm text-gray-700">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* Benefit Message */}
        {gateMessage?.benefit && (
          <div className="bg-purple-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-purple-700">
              <Sparkles className="w-4 h-4 inline mr-1" />
              {gateMessage.benefit}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleAddPet}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            data-testid="pet-gate-add-pet-btn"
          >
            <PawPrint className="w-4 h-4 mr-2" />
            Add Your Pet
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="text-gray-500"
          >
            I'll do this later
          </Button>
        </div>

        {/* Trust Message */}
        <p className="text-xs text-center text-gray-400 mt-4">
          Your pet's information helps us serve you better. 
          We never share your data.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PetGateModal;
