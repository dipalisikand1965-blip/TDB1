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
  
  // Handle different field names: youtube_id, video_id, or id
  const videoId = item.youtube_id || item.video_id || item.id;
  const youtubeUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  
  return (
    <div className="mira-video-frame" data-testid="mira-video-frame">
      {!showVideo ? (
        // Before Video - Mira Frame
        <div className="video-before-frame">
          <div className="video-thumbnail" onClick={() => setShowVideo(true)}>
            <img 
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
              alt={item.title}
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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
  
  const actionBarStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    zIndex: 10001
  };
  
  const primaryBtnStyle = {
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: '#8b5cf6',
    color: 'white'
  };
  
  const secondaryBtnStyle = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: 'white'
  };
  
  const tertiaryBtnStyle = {
    width: '48px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px',
    borderRadius: '12px',
    cursor: 'pointer',
    background: isSaved ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    border: isSaved ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.2)',
    color: isSaved ? '#a78bfa' : 'rgba(255, 255, 255, 0.7)'
  };
  
  return (
    <div className="learn-action-bar" data-testid="learn-action-bar" style={actionBarStyle}>
      {/* Primary: Let Mira do it */}
      <button 
        onClick={() => onLetMiraDoIt(primaryCta)}
        data-testid="action-let-mira"
        style={primaryBtnStyle}
      >
        <Briefcase size={18} />
        <span>{primaryCta?.label || "Let Mira do it"}</span>
      </button>
      
      {/* Secondary: Ask Mira */}
      <button 
        onClick={onAskMira}
        data-testid="action-ask-mira"
        style={secondaryBtnStyle}
      >
        <MessageCircle size={18} />
        <span>Ask Mira</span>
      </button>
      
      {/* Tertiary: Save */}
      <button 
        onClick={onSave}
        data-testid="action-save"
        style={tertiaryBtnStyle}
      >
        {isSaved ? (
          <BookmarkCheck size={18} />
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
  
  // Record a learn event (saved, completed, helpful, not_helpful)
  // This feeds LEARN → TODAY nudge system
  const recordLearnEvent = async (eventType) => {
    if (!item?.id) return;
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      await fetch(
        `${API_BASE}/api/os/learn/event?item_id=${item.id}&item_type=${item.item_type || 'guide'}&event_type=${eventType}&pet_id=${pet?.id || ''}`,
        { method: 'POST', headers }
      );
      console.log(`[LEARN] Recorded event: ${eventType} for ${item.id}`);
    } catch (err) {
      console.log('[LEARN] Could not record event:', err.message);
    }
  };
  
  // Handle "Let Mira do it" - opens ServiceRequestBuilder with prefill
  // Per LEARN Bible: One tap from Learn → ServiceRequestBuilder prefilled
  const handleLetMiraDoIt = (cta) => {
    // Record "completed" event - they're taking action based on this guide
    recordLearnEvent('completed');
    
    // Get primary CTA service info
    const serviceType = cta?.service_type || cta?.service_id || item.service_cta?.[0]?.service_type || 'general';
    
    // Build prefill from MOJO (pet profile) + CTA mapping
    const prefill = {
      ...(cta?.prefill || {}),
      // Add handling notes from pet profile if available
      handling_notes: pet?.doggy_soul_answers?.handling_notes || pet?.preferences?.handling_notes || '',
      // Add preferred time if available
      preferred_time: pet?.preferences?.preferred_time || '',
    };
    
    // Build context note (1-2 lines: what they read + what they're trying to do)
    const contextNote = `User viewed: ${item.title}. ${item.summary ? `Guide focus: ${item.summary.slice(0, 100)}...` : ''}`;
    
    if (onOpenServices) {
      onOpenServices({
        // Source layer identification
        source_layer: 'learn',
        source_item: {
          type: item.item_type || (isVideo ? 'video' : 'guide'),
          id: item.id,
          title: item.title
        },
        // Pet context
        pet_id: pet?.id,
        // Service type from CTA
        service_type: serviceType,
        // Prefill object from MOJO + CTA
        prefill: prefill,
        // Context for the ticket
        context_note: contextNote,
        // Legacy fields for backward compatibility
        context: {
          learn_item_id: item.id,
          learn_item_title: item.title,
          learn_topic: item.topic,
          risk_level: item.risk_level
        }
      });
    } else {
      // Fallback: If no service handler, open concierge instead
      console.log('[LEARN] No service handler, falling back to concierge');
      handleAskMira();
    }
  };
  
  // Handle "Ask Mira" - opens Concierge® with context (zero re-asking)
  // Per LEARN Bible: Concierge® opener shows "I've read X. Help me with Y."
  const handleAskMira = () => {
    // Record "completed" event - they're seeking help based on this guide
    recordLearnEvent('completed');
    
    // Build derived tags (pet_tags only for now; breed tags only if non-health topic)
    const derivedTags = [];
    if (pet?.doggy_soul_answers?.noise_sensitivity) derivedTags.push('noise_sensitive');
    if (pet?.doggy_soul_answers?.separation_anxiety) derivedTags.push('anxious');
    if (pet?.preferences?.allergies) derivedTags.push('food_sensitive');
    
    // Determine suggested next action
    const primaryCta = item.service_cta?.[0] || item.cta?.[0];
    const suggestedAction = primaryCta?.service_type || primaryCta?.service_id || 'needs_judgment';
    
    // Build initial message (auto-filled, user can edit)
    const initialMessage = `I've read "${item.title}". Help me understand this better for ${pet?.name || 'my pet'}.`;
    
    if (onOpenConcierge) {
      onOpenConcierge({
        // Source identification
        source_layer: 'learn',
        pet_id: pet?.id,
        // Learn item context
        learn_item: {
          title: item.title,
          type: item.item_type || (isVideo ? 'video' : 'guide'),
          id: item.id
        },
        // User stuck step (optional - could be added if tracking step progress)
        user_stuck_step: null,
        // Derived tags for context
        derived_tags_used: derivedTags,
        // Suggested next action
        suggested_next_action: suggestedAction,
        // Pre-populated message
        initialMessage: initialMessage,
        // Legacy context field
        context: {
          source: 'learn',
          item_id: item.id,
          item_title: item.title,
          item_topic: item.topic,
          pet_name: pet?.name,
          risk_level: item.risk_level
        }
      });
    } else {
      console.log('[LEARN] No concierge handler available');
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
    <div className="learn-reader" data-testid="learn-reader" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(180deg, #1a1625 0%, #0f0d15 50%, #0a0810 100%)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div className="learn-reader-header" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        minHeight: '56px'
      }}>
        <button 
          className="learn-back-btn" 
          onClick={onBack}
          data-testid="learn-reader-back"
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="learn-reader-meta" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#a78bfa',
            background: 'rgba(139, 92, 246, 0.2)',
            padding: '4px 10px',
            borderRadius: '8px'
          }}>{item.topic_label || item.topic}</span>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>{item.time_display}</span>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="learn-reader-content" style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '24px 16px'
      }}>
        {/* Title & Risk Badge */}
        <div className="learn-reader-title-section" style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'white',
            margin: '0 0 8px 0',
            lineHeight: 1.3
          }}>{item.title}</h1>
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
          <div className="learn-reader-source" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <span>Source: {item.channel_name}</span>
            {item.channel_trust_level && (
              <span className="trust-badge" style={{
                fontSize: '11px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
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
