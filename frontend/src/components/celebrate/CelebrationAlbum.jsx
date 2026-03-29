/**
 * CelebrationAlbum.jsx
 * 
 * VISION: "Post-Party Celebration Album"
 * - Prompt to upload party photos after celebration
 * - Mira creates a mini Pet Wrapped of the celebration
 * - Shareable "Party Recap" card for Instagram/social media
 * 
 * Creates emotional keepsakes and drives sharing/virality.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, Image as ImageIcon, X, Check, Sparkles,
  Heart, Share2, Download, Star, Gift, Cake, PartyPopper,
  Music, Users, Loader2, ChevronLeft, ChevronRight, Play
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { API_URL } from '../../utils/api';

// Album themes based on occasion
const ALBUM_THEMES = {
  birthday: {
    gradient: 'from-pink-500 via-purple-500 to-indigo-500',
    emoji: '🎂',
    title: 'Birthday Pawty',
    confettiColors: ['#ff69b4', '#ff1493', '#da70d6', '#ffd700']
  },
  gotcha: {
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    emoji: '💕',
    title: 'Gotcha Day Love',
    confettiColors: ['#a855f7', '#ec4899', '#f43f5e', '#fb7185']
  },
  milestone: {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    emoji: '🏆',
    title: 'Milestone Moment',
    confettiColors: ['#f59e0b', '#f97316', '#ef4444', '#fbbf24']
  },
  recovery: {
    gradient: 'from-green-500 via-teal-500 to-cyan-500',
    emoji: '💪',
    title: 'Victory Celebration',
    confettiColors: ['#22c55e', '#14b8a6', '#06b6d4', '#10b981']
  }
};

const CelebrationAlbum = ({ pet, token, userEmail, onClose, celebration }) => {
  const [step, setStep] = useState('upload'); // upload, preview, share
  const [photos, setPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [albumData, setAlbumData] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('birthday');
  const [albumCaption, setAlbumCaption] = useState('');
  
  const fileInputRef = useRef(null);
  const petName = pet?.name || 'Your pet';

  // Auto-detect theme from celebration data
  useEffect(() => {
    if (celebration?.occasion) {
      const theme = celebration.occasion.toLowerCase();
      if (ALBUM_THEMES[theme]) {
        setSelectedTheme(theme);
      }
    }
  }, [celebration]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate and process files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    }).slice(0, 10); // Max 10 photos

    // Create previews
    const newPhotos = await Promise.all(
      validFiles.map(file => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: e.target.result,
            caption: ''
          });
        };
        reader.readAsDataURL(file);
      }))
    );

    setPhotos(prev => [...prev, ...newPhotos].slice(0, 10));
    toast.success(`Added ${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''}`);
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    if (currentPhotoIndex >= photos.length - 1) {
      setCurrentPhotoIndex(Math.max(0, photos.length - 2));
    }
  };

  const generateAlbum = async () => {
    if (photos.length === 0) {
      toast.error('Please add at least one photo');
      return;
    }

    setGenerating(true);

    try {
      // Simulate AI album generation
      await new Promise(resolve => setTimeout(resolve, 2500));

      const theme = ALBUM_THEMES[selectedTheme];
      
      // Generate album data
      const album = {
        id: Math.random().toString(36).substr(2, 9),
        petName,
        theme: selectedTheme,
        title: `${petName}'s ${theme.title}`,
        photos: photos.map((p, i) => ({
          ...p,
          highlight: i === 0 // First photo is the highlight
        })),
        stats: {
          photosCount: photos.length,
          cakeFlavor: celebration?.cakeFlavor || 'Peanut Butter',
          guestsCount: celebration?.guestsCount || Math.floor(Math.random() * 8) + 2,
          smileScore: Math.floor(Math.random() * 20) + 80, // 80-100%
        },
        generatedAt: new Date().toISOString(),
        shareCaption: `${petName} had the most amazing ${theme.title.toLowerCase()}! 🎉 Check out these pawsome moments! #${petName.replace(/\s+/g, '')}sBirthday #PetParty #DoggyCelebration`
      };

      setAlbumData(album);
      setStep('preview');

      // Trigger confetti
      import('canvas-confetti').then(confetti => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: theme.confettiColors
        });
      });

    } catch (error) {
      toast.error('Failed to generate album');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async (platform) => {
    toast.success(`Sharing to ${platform}...`);
    // In production, would integrate with social sharing APIs
    setStep('share');
  };

  const handleDownload = () => {
    toast.success('Downloading album...');
    // In production, would generate and download a PDF or image collage
  };

  // Render upload step
  const renderUploadStep = () => (
    <div className="p-5 space-y-5">
      {/* Theme Selection */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Choose your album theme
        </label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ALBUM_THEMES).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => setSelectedTheme(key)}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                selectedTheme === key
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <span className="text-2xl block mb-1">{theme.emoji}</span>
              <span className="text-xs font-medium text-gray-700">{theme.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Photo Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-pink-300 rounded-2xl p-6 text-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/50 transition-all"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <Camera className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="font-bold text-gray-800 mb-1">
          Add your celebration photos
        </h3>
        <p className="text-sm text-gray-500">
          Upload up to 10 photos from {petName}'s special day
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {photos.length} photo{photos.length > 1 ? 's' : ''} added
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-purple-600"
            >
              <Upload className="w-4 h-4 mr-1" />
              Add More
            </Button>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {photos.map((photo, idx) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                <img
                  src={photo.preview}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                {idx === 0 && (
                  <div className="absolute bottom-1 left-1">
                    <Badge className="bg-amber-500 text-white text-[8px]">
                      <Star className="w-2 h-2 mr-0.5" />
                      Cover
                    </Badge>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={generateAlbum}
        disabled={photos.length === 0 || generating}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating your album...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Create Celebration Album
          </>
        )}
      </Button>
    </div>
  );

  // Render preview step (album view)
  const renderPreviewStep = () => {
    const theme = ALBUM_THEMES[selectedTheme];
    
    return (
      <div className="overflow-hidden">
        {/* Album Cover */}
        <div className={`bg-gradient-to-r ${theme.gradient} p-6 text-center text-white`}>
          <motion.span
            className="text-5xl block mb-2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {theme.emoji}
          </motion.span>
          <h2 className="text-2xl font-bold mb-1">{albumData?.title}</h2>
          <p className="text-white/80">A celebration to remember</p>
        </div>

        {/* Photo Slideshow */}
        <div className="relative bg-gray-900">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentPhotoIndex}
              src={photos[currentPhotoIndex]?.preview}
              alt={`Moment ${currentPhotoIndex + 1}`}
              className="w-full h-64 object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
          
          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setCurrentPhotoIndex(prev => (prev + 1) % photos.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
          
          {/* Photo Counter */}
          <div className="tdc-chip absolute bottom-2 left-1/2 -translate-x-1/2" style={{ background:'rgba(0,0,0,0.5)', color:'#fff', borderColor:'rgba(255,255,255,0.15)' }}>
            {currentPhotoIndex + 1} / {photos.length}
          </div>
        </div>

        {/* Album Stats */}
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="text-center p-3 bg-pink-50 rounded-xl">
              <Camera className="w-5 h-5 text-pink-500 mx-auto mb-1" />
              <span className="text-lg font-bold text-gray-900">{albumData?.stats.photosCount}</span>
              <span className="text-xs text-gray-500 block">Memories</span>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <span className="text-lg font-bold text-gray-900">{albumData?.stats.guestsCount}</span>
              <span className="text-xs text-gray-500 block">Friends</span>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <Heart className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <span className="text-lg font-bold text-gray-900">{albumData?.stats.smileScore}%</span>
              <span className="text-xs text-gray-500 block">Joy Score</span>
            </div>
          </div>

          {/* Share Caption Preview */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-sm text-gray-700">{albumData?.shareCaption}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={() => handleShare('Instagram')}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Paw Points Reward */}
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium text-amber-800">
                  Share to earn 100 Paw Points!
                </span>
              </div>
              <Badge className="bg-amber-500 text-white">Bonus</Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render share success step
  const renderShareStep = () => (
    <div className="p-8 text-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <Check className="w-10 h-10 text-white" />
      </motion.div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        Album Shared! 🎉
      </h3>
      <p className="text-gray-600 mb-6">
        {petName}'s celebration album is now live!
      </p>
      
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-center gap-2 text-purple-700">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <span className="font-semibold">You earned 100 Paw Points!</span>
        </div>
      </div>
      
      <Button onClick={onClose} className="bg-gray-900 hover:bg-gray-800">
        Done
      </Button>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-pink-500" />
            Create Celebration Album
          </DialogTitle>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderUploadStep()}
            </motion.div>
          )}
          
          {step === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderPreviewStep()}
            </motion.div>
          )}
          
          {step === 'share' && (
            <motion.div
              key="share"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {renderShareStep()}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default CelebrationAlbum;
