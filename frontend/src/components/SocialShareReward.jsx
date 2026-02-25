/**
 * SocialShareReward Component
 * Allows members to share their TD membership on social media for points
 * Features:
 * - Screenshot upload for validation
 * - Admin approval workflow
 * - 20 points reward
 * - Privacy protection (no pet profile shared)
 */

import React, { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Instagram, Share2, Upload, Gift, Check, Clock, 
  Image, X, Sparkles, Camera, AlertCircle 
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';

const REWARD_POINTS = 20;

const SocialShareReward = ({ user, onRewardClaimed }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [socialHandle, setSocialHandle] = useState('');
  const [postUrl, setPostUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingClaims, setPendingClaims] = useState([]);
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please upload an image under 5MB', variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };
  
  // Submit share claim
  const handleSubmitClaim = async () => {
    if (!selectedFile || !socialHandle) {
      toast({ title: 'Missing info', description: 'Please upload a screenshot and enter your Instagram handle', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Upload screenshot
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('social_platform', 'instagram');
      formData.append('social_handle', socialHandle);
      formData.append('post_url', postUrl);
      formData.append('user_email', user?.email);
      formData.append('reward_type', 'social_share');
      formData.append('points_amount', REWARD_POINTS);
      
      const res = await fetch(`${API_URL}/api/rewards/social-share-claim`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ 
          title: '🎉 Claim Submitted!', 
          description: `Your ${REWARD_POINTS} points reward is pending admin approval` 
        });
        setShowShareModal(false);
        resetForm();
        if (onRewardClaimed) onRewardClaimed();
      } else {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to submit claim');
      }
    } catch (err) {
      toast({ title: 'Submission failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setSocialHandle('');
    setPostUrl('');
  };
  
  // Share instructions text (without pet profile for privacy)
  const shareText = `I'm a proud member of @thedoggycompany Pet Life Pass! 🐾✨ The best pet services in India! #TheDoggyCompany #PetLifePass #PetParent`;
  
  const copyShareText = () => {
    navigator.clipboard.writeText(shareText);
    toast({ title: 'Copied!', description: 'Share text copied to clipboard' });
  };
  
  return (
    <>
      {/* Share CTA Card */}
      <Card className="p-4 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border border-purple-200" data-testid="social-share-reward">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                Share & Earn <Badge className="bg-amber-100 text-amber-700">{REWARD_POINTS} pts</Badge>
              </h4>
              <p className="text-sm text-gray-500">Share your membership on Instagram</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowShareModal(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Share2 className="w-4 h-4 mr-2" /> Share Now
          </Button>
        </div>
      </Card>
      
      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="w-5 h-5 text-pink-500" />
              Share & Earn {REWARD_POINTS} Points
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Step 1: Share on Instagram */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">1</span>
                Share on Instagram
              </h4>
              <div className="bg-white p-3 rounded-lg border text-sm text-gray-600 mb-3">
                {shareText}
              </div>
              <Button variant="outline" size="sm" onClick={copyShareText}>
                <Copy className="w-4 h-4 mr-1" /> Copy Text
              </Button>
            </div>
            
            {/* Step 2: Upload Screenshot */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">2</span>
                Upload Screenshot
              </h4>
              
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Screenshot preview" className="w-full h-48 object-cover rounded-lg" />
                  <button 
                    onClick={() => { setSelectedFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors"
                >
                  <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload screenshot</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {/* Step 3: Enter Instagram Handle */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">3</span>
                Your Details
              </h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Instagram Handle *</Label>
                  <Input 
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value.replace('@', ''))}
                    placeholder="your_username"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Post URL (optional)</Label>
                  <Input 
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    placeholder="https://instagram.com/p/..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            {/* Privacy Notice */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Your pet's profile information is kept private and won't be shared publicly.
              </p>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowShareModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitClaim}
              disabled={isSubmitting || !selectedFile || !socialHandle}
              className="bg-gradient-to-r from-pink-500 to-purple-600"
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : (
                <><Gift className="w-4 h-4 mr-2" /> Claim {REWARD_POINTS} Points</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Copy icon component
const Copy = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

export default SocialShareReward;
