/**
 * InteractionFooter.jsx
 * =====================
 * Mode-based interaction footer for Mira OS.
 * 
 * OWNED BY: MiraAppShell (not individual tabs)
 * 
 * Renders:
 * - Quick replies row (when pending question exists)
 * - Composer bar
 * - New messages pill
 * 
 * Does NOT render:
 * - Site footer (that's in content flow)
 * 
 * Mode behavior:
 * 0 = Hidden
 * 1 = Light prompt bar only
 * 2 = Active guided response (quick replies + composer)
 * 3 = Full concierge thread (quick replies + composer + new messages pill)
 * 4 = Modal active (suppressed)
 */

import React, { forwardRef } from 'react';
import { Send, Camera, Mic, MicOff, ChevronDown } from 'lucide-react';
import './InteractionFooter.css';

// ═══════════════════════════════════════════════════════════════════════════
// QUICK REPLIES RAIL
// Single row, horizontal scroll, state-bound to active question
// ═══════════════════════════════════════════════════════════════════════════

const QuickRepliesRail = ({ 
  options = [], 
  questionId,
  onSelect, 
  disabled = false 
}) => {
  if (!options || options.length === 0) return null;

  return (
    <div 
      className="mira-quick-replies-rail"
      data-testid="quick-replies-rail"
      data-question-id={questionId}
    >
      <div className="mira-quick-replies-scroll">
        {options.map((option, idx) => (
          <button
            key={option.id || idx}
            className="mira-quick-reply-chip"
            onClick={() => !disabled && onSelect?.(option.id, option.value)}
            disabled={disabled}
            data-testid={`quick-reply-${option.id || idx}`}
          >
            {option.icon && <span className="chip-icon">{option.icon}</span>}
            <span className="chip-label">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSER BAR
// ═══════════════════════════════════════════════════════════════════════════

const ComposerBar = ({
  placeholder = 'Ask Mira anything...',
  value = '',
  onChange,
  onSend,
  onAttach,
  onVoice,
  isSending = false,
  isDisabled = false,
  attachmentsEnabled = true,
  voiceEnabled = true,
  voiceActive = false,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending && value.trim()) {
      e.preventDefault();
      onSend?.();
    }
  };

  return (
    <div className="mira-composer-bar" data-testid="composer-bar">
      {/* Attachment button */}
      {attachmentsEnabled && (
        <button
          className="mira-composer-btn mira-composer-attach"
          onClick={onAttach}
          disabled={isDisabled}
          aria-label="Attach"
          data-testid="composer-attach-btn"
        >
          <Camera size={20} />
        </button>
      )}

      {/* Input field */}
      <input
        type="text"
        className="mira-composer-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled || isSending}
        data-testid="composer-input"
      />

      {/* Voice button */}
      {voiceEnabled && (
        <button
          className={`mira-composer-btn mira-composer-voice ${voiceActive ? 'active' : ''}`}
          onClick={onVoice}
          disabled={isDisabled}
          aria-label={voiceActive ? 'Stop voice' : 'Start voice'}
          data-testid="composer-voice-btn"
        >
          {voiceActive ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      )}

      {/* Send button */}
      <button
        className={`mira-composer-btn mira-composer-send ${value.trim() ? 'active' : ''}`}
        onClick={onSend}
        disabled={isDisabled || isSending || !value.trim()}
        aria-label="Send"
        data-testid="composer-send-btn"
      >
        <Send size={20} />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// NEW MESSAGES PILL
// ═══════════════════════════════════════════════════════════════════════════

const NewMessagesPill = ({ count = 0, onClick }) => {
  if (count <= 0) return null;

  return (
    <button
      className="mira-new-messages-pill"
      onClick={onClick}
      data-testid="new-messages-pill"
    >
      <ChevronDown size={16} />
      <span>{count} new message{count > 1 ? 's' : ''}</span>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// INTERACTION FOOTER (Main Export)
// ═══════════════════════════════════════════════════════════════════════════

const InteractionFooter = forwardRef(({
  // Mode (0-4)
  mode = 1,
  
  // Quick replies
  showQuickReplies = false,
  quickReplies = null,
  onQuickReplySelect,
  
  // Composer
  showComposer = true,
  composerValue = '',
  composerPlaceholder = 'Ask Mira anything...',
  onComposerChange,
  onComposerSend,
  onComposerAttach,
  onComposerVoice,
  isSending = false,
  voiceActive = false,
  
  // New messages
  newMessagesCount = 0,
  onNewMessagesClick,
  
  // Suppression
  isSuppressed = false,
}, ref) => {
  // Mode 0 or Mode 4 (suppressed) = don't render
  if (mode === 0 || mode === 4 || isSuppressed) {
    return <div ref={ref} className="mira-interaction-footer hidden" />;
  }

  return (
    <div 
      ref={ref}
      className={`mira-interaction-footer mode-${mode}`}
      data-testid="interaction-footer"
      data-mode={mode}
    >
      {/* New messages pill - above quick replies */}
      {mode === 3 && newMessagesCount > 0 && (
        <NewMessagesPill 
          count={newMessagesCount} 
          onClick={onNewMessagesClick} 
        />
      )}

      {/* Quick replies rail - only in mode 2 and 3, when visible */}
      {(mode === 2 || mode === 3) && showQuickReplies && quickReplies?.options?.length > 0 && (
        <QuickRepliesRail
          options={quickReplies.options}
          questionId={quickReplies.activeQuestionId}
          onSelect={onQuickReplySelect}
          disabled={isSending}
        />
      )}

      {/* Composer bar - visible in mode 1, 2, 3 */}
      {showComposer && (
        <ComposerBar
          placeholder={composerPlaceholder}
          value={composerValue}
          onChange={onComposerChange}
          onSend={onComposerSend}
          onAttach={onComposerAttach}
          onVoice={onComposerVoice}
          isSending={isSending}
          voiceActive={voiceActive}
        />
      )}

      {/* Safe area spacer for mobile */}
      <div className="mira-safe-area-spacer" />
    </div>
  );
});

InteractionFooter.displayName = 'InteractionFooter';

export default InteractionFooter;
export { QuickRepliesRail, ComposerBar, NewMessagesPill };
