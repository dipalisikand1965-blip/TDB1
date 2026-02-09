/**
 * ChatInputBar - Message Input Component
 * ======================================
 * The bottom input bar for typing/voice messages to Mira
 * Includes: Text input, Photo upload, Voice output toggle, Voice input button, Send button
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React, { useRef, useState } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, X, Camera, ImagePlus, Loader2 } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

/**
 * ChatInputBar Component
 * 
 * @param {Object} props
 * @param {React.Ref} props.inputRef - Ref for the text input
 * @param {string} props.query - Current input value
 * @param {Function} props.onQueryChange - Called when input changes
 * @param {Function} props.onSubmit - Called when form is submitted
 * @param {boolean} props.isProcessing - Whether a message is being processed
 * @param {boolean} props.voiceEnabled - Whether voice output is enabled
 * @param {boolean} props.isSpeaking - Whether Mira is currently speaking
 * @param {Function} props.onToggleVoiceOutput - Toggle voice output
 * @param {boolean} props.voiceSupported - Whether voice input is supported
 * @param {boolean} props.isListening - Whether voice input is active
 * @param {Function} props.onToggleVoiceInput - Toggle voice input
 * @param {string} props.voiceError - Voice error message
 * @param {Function} props.onClearVoiceError - Clear voice error
 * @param {string} props.placeholder - Input placeholder text
 * @param {Function} props.onPhotoUpload - Called when photo is uploaded (receives file, uploadResponse)
 * @param {string} props.petId - Pet ID for photo uploads
 * @param {string} props.sessionId - Session ID for photo uploads
 */
const ChatInputBar = ({
  inputRef,
  query = '',
  onQueryChange,
  onSubmit,
  isProcessing = false,
  voiceEnabled = false,
  isSpeaking = false,
  onToggleVoiceOutput,
  voiceSupported = false,
  isListening = false,
  onToggleVoiceInput,
  voiceError = null,
  onClearVoiceError,
  placeholder = 'Ask Mira anything...',
  onPhotoUpload,
  petId,
  sessionId
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    hapticFeedback.sendMessage(e);
    if (onSubmit) onSubmit(e);
  };
  
  const handleInputChange = (e) => {
    if (onQueryChange) onQueryChange(e.target.value);
  };
  
  return (
    <div className="mp-composer">
      <div className="mp-composer-inner">
        <form onSubmit={handleSubmit} className="mp-input-row">
          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="mp-input"
            disabled={isProcessing}
            data-testid="mira-input"
          />
          
          {/* Voice Output Toggle */}
          <button
            type="button"
            onClick={(e) => { hapticFeedback.toggle(e); onToggleVoiceOutput?.(); }}
            className={`mp-btn-voice ${voiceEnabled ? 'active' : ''} ${isSpeaking ? 'speaking' : ''}`}
            data-testid="voice-output-btn"
            title={voiceEnabled ? 'Mira voice ON' : 'Mira voice OFF'}
          >
            {voiceEnabled ? <Volume2 /> : <VolumeX />}
          </button>
          
          {/* Voice Input Button */}
          {voiceSupported && (
            <button
              type="button"
              onClick={(e) => { 
                isListening ? hapticFeedback.voiceStop(e) : hapticFeedback.voiceStart(e); 
                onToggleVoiceInput?.(); 
              }}
              className={`mp-btn-mic ${isListening ? 'recording' : ''} ${voiceError ? 'error' : ''}`}
              data-testid="mic-btn"
              title={voiceError || (isListening ? 'Listening... Tap to stop' : 'Tap to speak')}
            >
              {isListening ? (
                <div className="mp-mic-recording">
                  <MicOff />
                  <span className="mp-mic-pulse"></span>
                </div>
              ) : (
                <Mic />
              )}
            </button>
          )}
          
          {/* Voice Error Toast */}
          {voiceError && (
            <div className="mp-voice-error" onClick={onClearVoiceError}>
              <span>{voiceError}</span>
              <X size={14} />
            </div>
          )}
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={isProcessing || !query.trim()}
            className="mp-btn-send"
            data-testid="send-btn"
          >
            <Send />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInputBar;
