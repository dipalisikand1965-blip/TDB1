/**
 * ShareablePetCard - Instagram-worthy shareable pet card
 * Generate beautiful cards to share on social media
 */

import React, { useState, useRef } from 'react';
import { Share2, Download, Copy, Check, X, Sparkles, QrCode, Camera, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const TEMPLATES = [
  { id: 'classic', name: 'Classic Purple', gradient: 'from-purple-600 via-indigo-600 to-purple-700', text: 'text-white' },
  { id: 'sunset', name: 'Sunset Glow', gradient: 'from-orange-500 via-pink-500 to-purple-600', text: 'text-white' },
  { id: 'ocean', name: 'Ocean Breeze', gradient: 'from-cyan-500 via-blue-500 to-indigo-600', text: 'text-white' },
  { id: 'forest', name: 'Forest Green', gradient: 'from-emerald-500 via-teal-500 to-green-600', text: 'text-white' },
  { id: 'rose', name: 'Rose Gold', gradient: 'from-rose-400 via-pink-400 to-rose-500', text: 'text-white' },
  { id: 'minimal', name: 'Clean White', gradient: 'from-gray-50 to-gray-100', text: 'text-gray-900' },
];

const ShareablePetCard = ({ pet, isOpen, onClose }) => {
  const { token } = useAuth();
  const cardRef = useRef(null);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [showStats, setShowStats] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !pet) return null;

  const shareUrl = `${window.location.origin}/pet/${pet.id}/card`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `${pet.name}-pet-card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Card downloaded! 📸');
    } catch (error) {
      console.error('Error generating card:', error);
      toast.error('Failed to generate card');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meet ${pet.name}!`,
          text: `Check out ${pet.name}'s Pet Pass on The Doggy Company 🐾`,
          url: shareUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const getSoulLevel = (score) => {
    if (score >= 100) return { name: 'Soul Master', icon: '⭐' };
    if (score >= 75) return { name: 'Soul Guardian', icon: '🛡️' };
    if (score >= 50) return { name: 'Soul Explorer', icon: '🧭' };
    if (score >= 25) return { name: 'Soul Seeker', icon: '🔍' };
    return { name: 'Newcomer', icon: '🌱' };
  };

  const soulLevel = getSoulLevel(pet.overall_score || 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Share Pet Card</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-4">
          <div
            ref={cardRef}
            className={`relative bg-gradient-to-br ${selectedTemplate.gradient} rounded-2xl p-6 overflow-hidden shadow-xl`}
            style={{ aspectRatio: '1/1.2' }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col">
              {/* Pet Photo */}
              <div className="flex justify-center mb-4">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white/30 shadow-lg">
                  <img
                    src={pet.photo_url || ''}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Pet Name */}
              <div className="text-center mb-4">
                <h2 className={`text-2xl font-bold ${selectedTemplate.text}`}>{pet.name}</h2>
                <p className={`text-sm ${selectedTemplate.text} opacity-80`}>
                  {pet.breed || 'Adorable Furball'} • {pet.species === 'cat' ? '🐱' : '🐕'}
                </p>
              </div>

              {/* Stats */}
              {showStats && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center">
                    <p className={`text-lg font-bold ${selectedTemplate.text}`}>{Math.round(pet.overall_score || 0)}%</p>
                    <p className={`text-xs ${selectedTemplate.text} opacity-70`}>Pet Soul</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center">
                    <p className={`text-lg ${selectedTemplate.text}`}>{soulLevel.icon}</p>
                    <p className={`text-xs ${selectedTemplate.text} opacity-70`}>{soulLevel.name}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center">
                    <p className={`text-lg font-bold ${selectedTemplate.text}`}>
                      {pet.birth_date ? new Date().getFullYear() - new Date(pet.birth_date).getFullYear() : '?'}
                    </p>
                    <p className={`text-xs ${selectedTemplate.text} opacity-70`}>Years</p>
                  </div>
                </div>
              )}

              {/* Pet Pass Number */}
              {pet.pet_pass_number && (
                <div className="mt-auto">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className={`text-xs ${selectedTemplate.text} opacity-70`}>Pet Pass</p>
                      <p className={`font-mono font-bold ${selectedTemplate.text}`}>{pet.pet_pass_number}</p>
                    </div>
                    <div className={`w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center ${selectedTemplate.text}`}>
                      <QrCode className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              )}

              {/* Branding */}
              <div className="mt-4 text-center">
                <p className={`text-xs ${selectedTemplate.text} opacity-60`}>
                  🐾 The Doggy Company
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Template Selection */}
        <div className="px-4 pb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Choose Style</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${template.gradient} border-2 transition-all ${
                  selectedTemplate.id === template.id ? 'border-purple-600 scale-110' : 'border-transparent'
                }`}
                title={template.name}
              />
            ))}
          </div>

          {/* Toggle Stats */}
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-600">Show stats on card</span>
          </label>
        </div>

        {/* Actions */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center justify-center gap-1"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button
              onClick={handleShare}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center gap-1"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareablePetCard;
