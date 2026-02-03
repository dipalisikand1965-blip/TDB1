/**
 * PetHero - Immersive Hero Section for Pet Profile
 * 
 * World-class design with:
 * - Full-bleed photo background with gradient overlay
 * - Animated Soul Score Ring
 * - Quick Actions Dock (glassmorphism)
 * - Responsive: Mobile stacked, Desktop split-screen
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, Share2, Heart, Edit, Sparkles, Stethoscope, 
  Calendar, CreditCard, Upload, Loader2, ArrowLeft,
  ChevronRight, Trophy, Gift, PawPrint
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import SoulScoreArc from './SoulScoreArc';

export const PetHero = ({ 
  pet, 
  soulScore = 0,
  onPhotoUpload,
  onShare,
  onEdit,
  uploadingPhoto = false,
  isOwner = false,
  achievements = []
}) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const petPhoto = pet?.photo_url || `https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop`;
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  return (
    <div className="relative">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Immersive Hero Image */}
        <div className="relative h-[55vh] min-h-[400px] overflow-hidden">
          {/* Background Image */}
          <img 
            src={petPhoto}
            alt={pet?.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse" />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {/* Soul Score - Top Right */}
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2">
              <SoulScoreArc 
                score={soulScore}
                petId={pet?.id}
                petName={pet?.name}
                size="sm"
                showLabel={false}
                showCTA={false}
                animated={true}
              />
            </div>
          </div>
          
          {/* Pet Info - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-1" style={{fontFamily: 'Manrope, sans-serif'}}>
                  {pet?.name || 'Pet'}
                </h1>
                <p className="text-white/80 text-lg">{pet?.breed || 'Your furry friend'}</p>
                
                {/* Quick Stats */}
                <div className="flex items-center gap-4 mt-3">
                  {pet?.birth_date && (
                    <div className="flex items-center gap-1.5 text-white/70 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(pet.birth_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                    </div>
                  )}
                  {pet?.gender && (
                    <Badge className="bg-white/20 text-white border-none text-xs">
                      {pet.gender}
                    </Badge>
                  )}
                </div>
                
                {/* Achievements Preview */}
                {unlockedAchievements.length > 0 && (
                  <div className="flex items-center gap-1 mt-3">
                    {unlockedAchievements.slice(0, 4).map((ach, i) => (
                      <span key={i} className="text-lg" title={ach.name}>{ach.icon}</span>
                    ))}
                    {unlockedAchievements.length > 4 && (
                      <span className="text-white/70 text-sm ml-1">+{unlockedAchievements.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Photo Upload Button */}
              {isOwner && (
                <button
                  onClick={onPhotoUpload}
                  disabled={uploadingPhoto}
                  className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating Quick Actions Dock - Mobile */}
        <div className="sticky top-0 z-30 px-4 -mt-6">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2">
            <div className="grid grid-cols-4 gap-1">
              <QuickActionButton 
                icon={<Sparkles className="w-5 h-5 text-amber-500" />}
                label="Soul"
                onClick={() => {}}
                active={true}
              />
              <QuickActionButton 
                icon={<Stethoscope className="w-5 h-5 text-emerald-500" />}
                label="Health"
                onClick={() => {}}
              />
              <QuickActionButton 
                icon={<Share2 className="w-5 h-5 text-blue-500" />}
                label="Share"
                onClick={onShare}
              />
              <QuickActionButton 
                icon={<Upload className="w-5 h-5 text-purple-500" />}
                label="Photos"
                onClick={onPhotoUpload}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Split Screen */}
      <div className="hidden md:flex min-h-screen">
        {/* Left Panel - Sticky Hero */}
        <div className="w-5/12 h-screen sticky top-0 relative overflow-hidden">
          {/* Background Image */}
          <img 
            src={petPhoto}
            alt={pet?.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse" />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 z-20 w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all hover:scale-105"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-between p-8">
            {/* Top - Soul Score */}
            <div className="flex justify-end">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-4 border border-white/20">
                <SoulScoreArc 
                  score={soulScore}
                  petId={pet?.id}
                  petName={pet?.name}
                  size="lg"
                  showLabel={false}
                  showCTA={false}
                  animated={true}
                />
                <p className="text-white/80 text-center text-sm mt-2">Soul Score</p>
              </div>
            </div>
            
            {/* Bottom - Pet Info */}
            <div>
              <h1 className="text-6xl font-bold text-white mb-2" style={{fontFamily: 'Manrope, sans-serif'}}>
                {pet?.name || 'Pet'}
              </h1>
              <p className="text-white/80 text-2xl mb-4">{pet?.breed || 'Your furry friend'}</p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {pet?.birth_date && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <Calendar className="w-5 h-5 text-white/70" />
                    <span className="text-white">
                      {new Date(pet.birth_date).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}
                    </span>
                  </div>
                )}
                {pet?.gender && (
                  <Badge className="bg-white/10 text-white border-none px-4 py-2 text-sm">
                    {pet.gender}
                  </Badge>
                )}
                {pet?.pet_pass_number && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <CreditCard className="w-5 h-5 text-white/70" />
                    <span className="text-white font-mono text-sm">{pet.pet_pass_number}</span>
                  </div>
                )}
              </div>
              
              {/* Achievements */}
              {unlockedAchievements.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <div className="flex items-center gap-1">
                    {unlockedAchievements.slice(0, 6).map((ach, i) => (
                      <span key={i} className="text-2xl" title={ach.name}>{ach.icon}</span>
                    ))}
                    {unlockedAchievements.length > 6 && (
                      <span className="text-white/70 ml-2">+{unlockedAchievements.length - 6} more</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {isOwner && (
                  <Button
                    onClick={onPhotoUpload}
                    disabled={uploadingPhoto}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-none rounded-full px-6"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Camera className="w-5 h-5 mr-2" />
                    )}
                    Update Photo
                  </Button>
                )}
                <Button
                  onClick={onShare}
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20 rounded-full px-6"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Scrollable Content (placeholder for main content) */}
        <div className="w-7/12 min-h-screen bg-[#FAF9F6]">
          {/* Content will be rendered by parent */}
        </div>
      </div>
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ icon, label, onClick, active = false }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center p-3 rounded-xl transition-all active:scale-95 ${
      active 
        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg' 
        : 'hover:bg-gray-100 text-gray-700'
    }`}
  >
    {icon}
    <span className={`text-[10px] font-medium mt-1 ${active ? 'text-white' : 'text-gray-600'}`}>{label}</span>
  </button>
);

export default PetHero;
