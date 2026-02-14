/**
 * LearnReader.jsx
 * ===============
 * The detail/reader view for Learn items (guides & videos).
 * 
 * Features:
 * - Full content display (summary, checklist, watch for, escalate)
 * - "Mira Frame" for YouTube videos (before/after context)
 * - Sticky action bar: "Let Mira do it" | "Ask Mira" | "Save"
 * 
 * Per LEARN Bible: Every item must end in one of three outcomes.
 */

import React, { useState, memo } from 'react';
import { 
  ArrowLeft, Bookmark, BookmarkCheck, Play, Check, AlertTriangle, 
  ChevronRight, Clock, ExternalLink, Briefcase, MessageCircle,
  Heart, CheckCircle, AlertCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════════════════════
// YOUTUBE EMBED WITH MIRA FRAME
// ═══════════════════════════════════════════════════════════════════════════════

const MiraVideoFrame = memo(({ item, onComplete }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [watchedPercent, setWatchedPercent] = useState(0);
  
  const youtubeUrl = `https://www.youtube.com/embed/${item.youtube_id}?autoplay=1&rel=0`;
  
  return (
    <div className="mira-video-frame" data-testid="mira-video-frame">
      {!showVideo ? (
        // Before Video - Mira Frame
        <div className="video-before-frame">
          <div className="video-thumbnail" onClick={() => setShowVideo(true)}>
            <img 
              src={`https://img.youtube.com/vi/${item.youtube_id}/maxresdefault.jpg`} 
              alt={item.title}
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${item.youtube_id}/hqdefault.jpg`;
              }}
            />
            <div className="video-play-overlay">
              <Play size={48} className="text-white" fill="white" />
            </div>
            <div className="video-duration">
              <Clock size={14} />
              <span>{Math.floor((item.duration_sec || 180) / 60)} min</span>
            </div>
          </div>
          
          {/* What You'll Learn */}
          <div className="video-bullets-before">
            <h4>What you'll learn</h4>
            <ul>
              {item.bullets_before?.map((bullet, idx) => (
                <li key={idx}>
                  <Check size={14} className="text-green-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Safety Note */}
          {item.safety_note && (
            <div className="video-safety-note">
              <AlertTriangle size={16} className="text-amber-400" />
              <span>{item.safety_note}</span>
            </div>
          )}
          
          <button 
            className="video-play-btn"
            onClick={() => setShowVideo(true)}
            data-testid="video-play-btn"
          >
            <Play size={18} />
            <span>Watch Video</span>
          </button>
        </div>
      ) : (
        // Video Playing
        <div className="video-player-container">
          <iframe
            src={youtubeUrl}
            title={item.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-iframe"
          />
          
          {/* After Video Checklist */}
          <div className="video-after-frame">
            <h4>Do this today</h4>
            <ul>
              {item.after_checklist?.map((step, idx) => (
                <li key={idx}>
                  <CheckCircle size={14} className="text-purple-400" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            
            {/* Escalation */}
            {item.escalation?.length > 0 && (
              <div className="video-escalation">
                <h5>When to escalate</h5>
                <ul>
                  {item.escalation.map((esc, idx) => (
                    <li key={idx}>
                      <AlertCircle size={14} className="text-amber-400" />
                      <span>{esc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// GUIDE CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

const GuideContent = memo(({ item }) => {
  return (
    <div className="guide-content" data-testid="guide-content">
      {/* Summary */}
      <div className="guide-summary">
        <p>{item.summary}</p>
      </div>
      
      {/* Do This Now Checklist */}
      {item.steps?.length > 0 && (
        <div className="guide-section guide-steps">
          <h4>
            <CheckCircle size={18} className="text-green-400" />
            <span>Do this now</span>
          </h4>
          <ul>
            {item.steps.map((step, idx) => (
              <li key={idx}>
                <span className="step-number">{idx + 1}</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Watch For */}
      {item.watch_for?.length > 0 && (
        <div className="guide-section guide-watch-for">
          <h4>
            <AlertTriangle size={18} className="text-amber-400" />
            <span>Watch for</span>
          </h4>
          <ul>
            {item.watch_for.map((signal, idx) => (
              <li key={idx}>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* When to Escalate */}
      {item.when_to_escalate?.length > 0 && (
        <div className="guide-section guide-escalate">
          <h4>
            <AlertCircle size={18} className="text-rose-400" />
            <span>When to escalate</span>
          </h4>
          <ul>
            {item.when_to_escalate.map((threshold, idx) => (
              <li key={idx}>
                <span>{threshold}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Embedded Video (if guide has video_id) */}
      {item.video_id && (
        <div className="guide-video">
          <h4>
            <Play size={18} className="text-purple-400" />
            <span>Related video</span>
          </h4>
          <MiraVideoFrame item={{ youtube_id: item.video_id, ...item }} />
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// STICKY ACTION BAR
// ═══════════════════════════════════════════════════════════════════════════════

const StickyActionBar = memo(({ 
  item, 
  isSaved, 
  onSave, 
  onLetMiraDoIt, 
  onAskMira 
}) => {
  // Get primary CTA if available
  const primaryCta = item.service_cta?.[0] || item.cta?.[0];
  
  return (
    <div className="learn-action-bar" data-testid="learn-action-bar">
      {/* Primary: Let Mira do it */}
      {primaryCta ? (
        <button 
          className="action-btn action-primary"
          onClick={() => onLetMiraDoIt(primaryCta)}
          data-testid="action-let-mira"
        >
          <Briefcase size={18} />
          <span>{primaryCta.label || "Let Mira do it"}</span>
        </button>
      ) : (
        <button 
          className="action-btn action-primary"
          onClick={() => onLetMiraDoIt(null)}
          data-testid="action-let-mira"
        >
          <Briefcase size={18} />
          <span>Let Mira do it</span>
        </button>
      )}
      
      {/* Secondary: Ask Mira */}
      <button 
        className="action-btn action-secondary"
        onClick={onAskMira}
        data-testid="action-ask-mira"
      >
        <MessageCircle size={18} />
        <span>Ask Mira</span>
      </button>
      
      {/* Tertiary: Save */}
      <button 
        className={`action-btn action-tertiary ${isSaved ? 'saved' : ''}`}
        onClick={onSave}
        data-testid="action-save"
      >
        {isSaved ? (
          <BookmarkCheck size={18} className="text-purple-400" />
        ) : (
          <Bookmark size={18} />
        )}
      </button>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN LEARN READER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const LearnReader = ({ 
  item, 
  onBack, 
  onSave, 
  onOpenServices, 
  onOpenConcierge,
  pet,
  token 
}) => {
  const isVideo = item.item_type === 'video';
  
  // Handle "Let Mira do it" - opens ServiceRequestBuilder with prefill
  const handleLetMiraDoIt = (cta) => {
    if (onOpenServices) {
      onOpenServices({
        prefill: cta?.prefill || {},
        service_type: cta?.service_type || 'general',
        source: 'learn',
        context: {
          learn_item_id: item.id,
          learn_item_title: item.title,
          learn_topic: item.topic
        }
      });
    }
  };
  
  // Handle "Ask Mira" - opens Concierge with context
  const handleAskMira = () => {
    if (onOpenConcierge) {
      onOpenConcierge({
        context: {
          source: 'learn',
          item_id: item.id,
          item_title: item.title,
          item_topic: item.topic,
          pet_name: pet?.name
        },
        initialMessage: `I just read "${item.title}" and have a question about it.`
      });
    }
  };
  
  // Risk level badge
  const RiskBadge = () => {
    if (item.risk_level === 'high') {
      return (
        <span className="risk-badge risk-high">
          <AlertTriangle size={12} />
          High Risk
        </span>
      );
    }
    if (item.risk_level === 'medium') {
      return (
        <span className="risk-badge risk-medium">
          <AlertCircle size={12} />
          Needs Attention
        </span>
      );
    }
    return null;
  };
  
  return (
    <div className="learn-reader" data-testid="learn-reader">
      {/* Header */}
      <div className="learn-reader-header">
        <button 
          className="learn-back-btn" 
          onClick={onBack}
          data-testid="learn-reader-back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="learn-reader-meta">
          <span className="learn-reader-topic">{item.topic_label || item.topic}</span>
          <span className="learn-reader-time">{item.time_display}</span>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="learn-reader-content">
        {/* Title & Risk Badge */}
        <div className="learn-reader-title-section">
          <h1>{item.title}</h1>
          <RiskBadge />
        </div>
        
        {/* Content based on type */}
        {isVideo ? (
          <MiraVideoFrame item={item} />
        ) : (
          <GuideContent item={item} />
        )}
        
        {/* Channel info for videos */}
        {isVideo && item.channel_name && (
          <div className="learn-reader-source">
            <span>Source: {item.channel_name}</span>
            {item.channel_trust_level && (
              <span className="trust-badge">
                {item.channel_trust_level === 'vet' && '🩺 Verified Vet'}
                {item.channel_trust_level === 'trainer' && '🎓 Certified Trainer'}
                {item.channel_trust_level === 'org' && '🏛️ Trusted Organization'}
              </span>
            )}
          </div>
        )}
        
        {/* Spacer for action bar */}
        <div className="learn-reader-spacer" />
      </div>
      
      {/* Sticky Action Bar */}
      <StickyActionBar
        item={item}
        isSaved={item.is_saved}
        onSave={onSave}
        onLetMiraDoIt={handleLetMiraDoIt}
        onAskMira={handleAskMira}
      />
    </div>
  );
};

export default LearnReader;
