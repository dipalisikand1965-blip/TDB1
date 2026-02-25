/**
 * LearnModal - Pet Training Videos Modal
 * =======================================
 * Shows training videos categorized by topic
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { X, Play } from 'lucide-react';

// Video categories
const LEARN_CATEGORIES = [
  { id: 'recommended', label: '✨ For You', icon: '✨' },
  { id: 'barking', label: '🔊 Barking', icon: '🔊' },
  { id: 'potty', label: '🚽 Potty', icon: '🚽' },
  { id: 'leash', label: '🦮 Leash', icon: '🦮' },
  { id: 'tricks', label: '🎪 Tricks', icon: '🎪' },
  { id: 'anxiety', label: '😰 Anxiety', icon: '😰' },
  { id: 'puppy', label: '🐕 Puppy', icon: '🐕' },
];

/**
 * LearnModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Called when modal is closed
 * @param {Object} props.pet - Pet object { name, breed }
 * @param {string} props.activeCategory - Currently selected category ID
 * @param {Array} props.videos - List of videos to display
 * @param {boolean} props.isLoading - Whether videos are loading
 * @param {Function} props.onCategoryChange - Called when category is selected
 */
const LearnModal = ({ 
  isOpen, 
  onClose, 
  pet = { name: 'your pet', breed: '' },
  activeCategory = 'recommended',
  videos = [],
  isLoading = false,
  onCategoryChange
}) => {
  if (!isOpen) return null;
  
  const handleCategoryClick = (categoryId) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  };
  
  return (
    <div 
      className="learn-modal-overlay" 
      onClick={onClose} 
      data-testid="learn-modal"
    >
      <div className="learn-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="learn-modal-header">
          <div className="learn-modal-title">
            <span className="learn-icon">📺</span>
            <div>
              <h3>Learn with {pet.name}</h3>
              <p>Training videos tailored for {pet.breed || 'your pet'}</p>
            </div>
          </div>
          <button onClick={onClose} className="learn-close-btn">
            <X />
          </button>
        </div>
        
        {/* Category Tabs */}
        <div className="learn-categories">
          {LEARN_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`learn-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat.id)}
              data-testid={`learn-category-${cat.id}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        
        {/* Videos Grid */}
        <div className="learn-videos-container">
          {isLoading ? (
            <div className="learn-loading">
              <div className="learn-spinner"></div>
              <p>Finding videos for {pet.name}...</p>
            </div>
          ) : videos.length > 0 ? (
            <div className="learn-videos-grid">
              {videos.map((video, idx) => (
                <a
                  key={idx}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="learn-video-card"
                  data-testid={`learn-video-${idx}`}
                >
                  <div className="learn-video-thumbnail">
                    <img src={video.thumbnail} alt={video.title} />
                    <div className="learn-video-play">
                      <Play size={32} fill="white" />
                    </div>
                  </div>
                  <div className="learn-video-info">
                    <h4>{video.title?.substring(0, 50)}{video.title?.length > 50 ? '...' : ''}</h4>
                    <p>{video.channel}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="learn-empty">
              <p>No videos found for this category.</p>
              <button onClick={() => handleCategoryClick('recommended')}>
                View recommended videos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnModal;
export { LEARN_CATEGORIES };
