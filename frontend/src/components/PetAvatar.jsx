/**
 * PetAvatar Component
 * Beautiful, consistent pet photo display with upload prompt
 * 
 * Usage:
 * <PetAvatar pet={pet} size="md" showUploadPrompt onUpload={handleUpload} />
 */

import React, { useState } from 'react';
import { Camera, Upload, PawPrint } from 'lucide-react';
import { resolvePetAvatar } from '../utils/petAvatar';
import { Button } from './ui/button';

const PetAvatar = ({ 
  pet, 
  size = 'md', 
  showUploadPrompt = false, 
  onUpload = null,
  className = '',
  onClick = null
}) => {
  const [imageError, setImageError] = useState(false);
  const { photoUrl, needsUpload, uploadPrompt, isBreedPhoto } = resolvePetAvatar(pet);
  
  // Size configurations
  const sizeConfig = {
    xs: { container: 'w-8 h-8', icon: 'w-4 h-4', badge: 'text-[8px] px-1', uploadIcon: 'w-3 h-3' },
    sm: { container: 'w-12 h-12', icon: 'w-6 h-6', badge: 'text-[9px] px-1.5', uploadIcon: 'w-4 h-4' },
    md: { container: 'w-16 h-16', icon: 'w-8 h-8', badge: 'text-[10px] px-2', uploadIcon: 'w-5 h-5' },
    lg: { container: 'w-24 h-24', icon: 'w-10 h-10', badge: 'text-xs px-2', uploadIcon: 'w-6 h-6' },
    xl: { container: 'w-32 h-32', icon: 'w-12 h-12', badge: 'text-sm px-2.5', uploadIcon: 'w-7 h-7' },
    '2xl': { container: 'w-40 h-40', icon: 'w-16 h-16', badge: 'text-sm px-3', uploadIcon: 'w-8 h-8' }
  };
  
  const config = sizeConfig[size] || sizeConfig.md;
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onUpload && needsUpload) {
      onUpload();
    }
  };

  return (
    <div 
      className={`relative group ${className}`}
      onClick={handleClick}
      style={{ cursor: (onClick || (onUpload && needsUpload)) ? 'pointer' : 'default' }}
    >
      {/* Main Avatar Container */}
      <div className={`${config.container} rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-white shadow-md relative`}>
        {!imageError ? (
          <img 
            src={photoUrl} 
            alt={pet?.name || 'Pet'} 
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PawPrint className={`${config.icon} text-purple-300`} />
          </div>
        )}
        
        {/* Upload overlay on hover (when photo upload is available) */}
        {onUpload && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className={`${config.uploadIcon} text-white`} />
          </div>
        )}
      </div>
      
      {/* Breed photo indicator badge */}
      {isBreedPhoto && showUploadPrompt && !imageError && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className={`${config.badge} py-0.5 bg-purple-600 text-white rounded-full font-medium shadow-sm flex items-center gap-1`}>
            <Upload className="w-2.5 h-2.5" />
            Add photo
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * PetAvatarWithUpload - Avatar with integrated file input
 */
export const PetAvatarWithUpload = ({ 
  pet, 
  size = 'lg', 
  onPhotoChange,
  uploading = false,
  className = '' 
}) => {
  const fileInputRef = React.useRef(null);
  const { photoUrl, needsUpload, uploadPrompt, isBreedPhoto } = resolvePetAvatar(pet);
  const [imageError, setImageError] = useState(false);
  
  const sizeConfig = {
    sm: { container: 'w-16 h-16', text: 'text-xs' },
    md: { container: 'w-24 h-24', text: 'text-sm' },
    lg: { container: 'w-32 h-32', text: 'text-sm' },
    xl: { container: 'w-40 h-40', text: 'text-base' }
  };
  
  const config = sizeConfig[size] || sizeConfig.lg;
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onPhotoChange) {
      onPhotoChange(file);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div 
        className={`${config.container} rounded-2xl overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-white shadow-lg relative cursor-pointer group`}
        onClick={handleClick}
      >
        {!imageError ? (
          <img 
            src={photoUrl} 
            alt={pet?.name || 'Pet'} 
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PawPrint className="w-12 h-12 text-purple-300" />
          </div>
        )}
        
        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Camera className="w-8 h-8 mb-1" />
              <span className="text-xs font-medium">
                {isBreedPhoto ? 'Add Photo' : 'Change'}
              </span>
            </>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      
      {/* Upload prompt text */}
      {needsUpload && uploadPrompt && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClick}
          className={`${config.text} text-purple-600 hover:text-purple-700 hover:bg-purple-50`}
        >
          <Upload className="w-3 h-3 mr-1" />
          {uploadPrompt}
        </Button>
      )}
    </div>
  );
};

/**
 * Mini avatar for lists and compact displays
 */
export const PetAvatarMini = ({ pet, className = '' }) => {
  const { photoUrl } = resolvePetAvatar(pet);
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className={`w-8 h-8 rounded-full overflow-hidden bg-purple-100 border border-white shadow-sm ${className}`}>
      {!imageError ? (
        <img 
          src={photoUrl} 
          alt={pet?.name || 'Pet'} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <PawPrint className="w-4 h-4 text-purple-300" />
        </div>
      )}
    </div>
  );
};

export default PetAvatar;
