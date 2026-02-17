/**
 * YouTubeCard - Conversation Contract Phase 5
 * 
 * Renders YouTube learning videos from the conversation_contract.youtube_results array.
 * Shows: title, channel, thumbnail, duration, link
 */

import React from 'react';
import { Play, ExternalLink, Clock, Youtube } from 'lucide-react';

export const YouTubeCard = ({ 
  video,
  onWatch,
  compact = false
}) => {
  if (!video) return null;

  const { id, title, channel, thumbnail, url, duration } = video;

  // Format duration (e.g., "PT10M30S" -> "10:30")
  const formatDuration = (dur) => {
    if (!dur) return null;
    // Handle ISO 8601 duration format
    const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = match[1] || 0;
      const minutes = match[2] || 0;
      const seconds = match[3] || 0;
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
    return dur; // Return as-is if not ISO format
  };

  return (
    <div 
      className={`
        bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden
        hover:border-red-500/30 transition-all duration-200
        ${compact ? '' : ''}
      `}
      data-testid={`youtube-card-${id || title}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-900 group cursor-pointer"
        onClick={() => window.open(url, '_blank')}
      >
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Youtube size={48} className="text-red-500/50" />
          </div>
        )}
        
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
            <Play size={24} className="text-white fill-white ml-1" />
          </div>
        </div>
        
        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`${compact ? 'p-3' : 'p-4'}`}>
        <h3 className="font-medium text-white line-clamp-2 text-sm leading-snug">
          {title}
        </h3>
        
        {channel && (
          <p className="text-xs text-slate-400 mt-1 truncate">
            {channel}
          </p>
        )}

        {/* Action */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            onWatch?.(video);
          }}
          className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg w-full
            bg-red-600/20 hover:bg-red-600/30 text-red-400
            text-sm font-medium transition-colors justify-center"
          data-testid="youtube-watch-btn"
        >
          <Play size={14} className="fill-current" />
          <span>Watch Video</span>
        </a>
      </div>
    </div>
  );
};

export const YouTubeGrid = ({ 
  videos = [],
  onWatch,
  title = "Learning Videos"
}) => {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="space-y-3" data-testid="youtube-grid">
      {title && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Youtube size={16} className="text-red-500" />
          <span>{title}</span>
          <span className="text-slate-500">({videos.length} videos)</span>
        </div>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, index) => (
          <YouTubeCard
            key={video.id || index}
            video={video}
            onWatch={onWatch}
          />
        ))}
      </div>
    </div>
  );
};

export default YouTubeCard;
