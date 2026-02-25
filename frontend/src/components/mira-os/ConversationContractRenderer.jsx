/**
 * ConversationContractRenderer - Phase 5: Deterministic UI Rendering
 * 
 * Bible Section 10.0: Chat output must be deterministic.
 * UI must never infer behavior from free text.
 * 
 * RENDER RULES (Frontend must follow exactly):
 * - mode="answer" → render assistant_text + quick_replies only
 * - mode="clarify" → render ONLY assistant_text + quick_replies, NO places/youtube/products
 * - mode="places" → render assistant_text + places_results + quick_replies
 * - mode="learn" → render assistant_text + youtube_results + quick_replies
 * - mode="ticket" or mode="handoff" → render assistant_text + CTA actions only
 * 
 * NEVER show "popular/featured" filler when mode is not catalogue/answer.
 */

import React from 'react';
import { QuickReplyChips } from './QuickReplyChips';
import { PlacesGrid } from './PlacesCard';
import { YouTubeGrid } from './YouTubeCard';
import { Send, Ticket, AlertCircle, MapPin, Youtube, HelpCircle } from 'lucide-react';

export const ConversationContractRenderer = ({
  contract,
  onQuickReplyClick,
  onActionClick,
  onPlaceCall,
  onPlaceDirections,
  onYouTubeWatch,
  isLoading = false
}) => {
  if (!contract) return null;

  const {
    mode,
    assistant_text,
    quick_replies = [],
    clarifying_questions = [],
    actions = [],
    places_results = [],
    youtube_results = [],
    spine = {},
    _debug = {}
  } = contract;

  // Debug info (only shown if URL has debug=1)
  const showDebug = typeof window !== 'undefined' && window.location.search.includes('debug=1');

  return (
    <div className="space-y-4" data-testid="conversation-contract-renderer">
      {/* Debug Panel */}
      {showDebug && (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-xs font-mono">
          <div className="text-purple-400 font-semibold mb-1">Conversation Contract Debug</div>
          <div className="grid grid-cols-2 gap-x-4 text-slate-400">
            <div>mode: <span className="text-amber-400">{mode}</span></div>
            <div>intent: <span className="text-blue-400">{_debug.detected_intent}</span></div>
            <div>places_allowed: <span className={_debug.places_call_allowed ? 'text-green-400' : 'text-red-400'}>
              {String(_debug.places_call_allowed)}
            </span></div>
            <div>youtube_allowed: <span className={_debug.youtube_call_allowed ? 'text-green-400' : 'text-red-400'}>
              {String(_debug.youtube_call_allowed)}
            </span></div>
            <div>location_source: <span className="text-cyan-400">{_debug.location_source}</span></div>
            <div>ticket_id: <span className="text-amber-400">{spine.ticket_id || 'none'}</span></div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODE: CLARIFY - Show clarifying questions
          RULE: NO places/youtube/products - only questions
      ═══════════════════════════════════════════════════════════════════════════ */}
      {mode === 'clarify' && clarifying_questions.length > 0 && (
        <div className="space-y-3" data-testid="clarify-mode-content">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <HelpCircle size={16} />
            <span>I need a few details</span>
          </div>
          
          {clarifying_questions.map((q) => (
            <div key={q.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
              <p className="text-white font-medium mb-2">{q.question}</p>
              {q.chips && q.chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {q.chips.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => onQuickReplyClick?.(chip.payload_text, chip)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium
                        bg-purple-600/20 hover:bg-purple-600/30 text-purple-300
                        border border-purple-500/30 transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODE: PLACES - Show Google Places results
          RULE: Render places_results + quick_replies
      ═══════════════════════════════════════════════════════════════════════════ */}
      {mode === 'places' && places_results.length > 0 && (
        <div data-testid="places-mode-content">
          <PlacesGrid
            places={places_results}
            onCall={onPlaceCall}
            onGetDirections={onPlaceDirections}
            title="Nearby Places"
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODE: LEARN - Show YouTube learning videos
          RULE: Render youtube_results + quick_replies
      ═══════════════════════════════════════════════════════════════════════════ */}
      {mode === 'learn' && youtube_results.length > 0 && (
        <div data-testid="learn-mode-content">
          <YouTubeGrid
            videos={youtube_results}
            onWatch={onYouTubeWatch}
            title="Training Videos"
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MODE: TICKET / HANDOFF - Show action buttons
          RULE: Render CTA actions only
      ═══════════════════════════════════════════════════════════════════════════ */}
      {(mode === 'ticket' || mode === 'handoff') && actions.length > 0 && (
        <div className="space-y-2" data-testid="ticket-mode-content">
          {spine.ticket_id && (
            <div className="flex items-center gap-2 text-xs text-amber-400/80">
              <Ticket size={14} />
              <span>Ticket: {spine.ticket_id}</span>
            </div>
          )}
          
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => onActionClick?.(action)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl
                bg-gradient-to-r from-purple-600 to-amber-600 
                hover:from-purple-500 hover:to-amber-500
                text-white font-medium transition-all
                disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={`action-${action.type}`}
            >
              {action.type === 'create_ticket' ? <Send size={18} /> : <Ticket size={18} />}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          QUICK REPLIES - Show for all modes (except ticket/handoff)
      ═══════════════════════════════════════════════════════════════════════════ */}
      {mode !== 'ticket' && mode !== 'handoff' && quick_replies.length > 0 && (
        <QuickReplyChips
          quickReplies={quick_replies}
          onChipClick={onQuickReplyClick}
          contractMode={mode}
          disabled={isLoading}
        />
      )}
    </div>
  );
};

export default ConversationContractRenderer;
