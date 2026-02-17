/**
 * ChatInputBar - Message Input Component
 * ======================================
 * The bottom input bar for typing/voice messages to Mira
 * Includes: Text input, Photo upload, Voice output toggle, Voice input button, Send button
 * Plus: Non-clickable status indicators for C° (Concierge) and PICKS
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React, { useRef, useState } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, X, Camera, ImagePlus, Loader2, MessageSquarePlus, Gift } from 'lucide-react';
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
 * @param {Function} props.onNewChat - Called when New Chat button is clicked
 * @param {boolean} props.hasConversation - Whether there's an active conversation (shows New Chat button)
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
  sessionId,
  onNewChat,
  hasConversation = false,
  // Status indicators (non-clickable)
  conciergeCount = 0,
  picksCount = 0,
  hasConciergeNew = false,
  hasPicksNew = false
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  
  const API_URL = process.env.REACT_APP_BACKEND_URL || '';
  
  const handlePhotoClick = () => {
    hapticFeedback.lightTap();
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select an image file (JPG, PNG, GIF, or WebP)');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image too large. Maximum size is 10MB');
      return;
    }
    
    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setUploadPreview({ url: previewUrl, name: file.name });
    hapticFeedback.success();
    
    // Upload to backend
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pet_id', petId || 'default');
      formData.append('session_id', sessionId || 'default');
      formData.append('context', 'chat_upload');
      
      const response = await fetch(`${API_URL}/api/mira/upload/file`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      console.log('[PHOTO UPLOAD] Success:', data);
      
      // Notify parent component
      if (onPhotoUpload) {
        onPhotoUpload(file, data);
      }
      
      // Auto-populate input with context
      if (onQueryChange && !query.trim()) {
        onQueryChange(`I've uploaded a photo: ${file.name}. Can you take a look?`);
      }
      
      hapticFeedback.success();
      
    } catch (error) {
      console.error('[PHOTO UPLOAD] Error:', error);
      hapticFeedback.error();
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const clearPreview = () => {
    if (uploadPreview?.url) {
      URL.revokeObjectURL(uploadPreview.url);
    }
    setUploadPreview(null);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    hapticFeedback.sendMessage(e);
    clearPreview();
    if (onSubmit) onSubmit(e);
  };
  
  const handleInputChange = (e) => {
    if (onQueryChange) onQueryChange(e.target.value);
  };
  
  return (
    <div className="mp-composer">
      {/* Status Indicators - Non-clickable, passive status display */}
      {(conciergeCount > 0 || picksCount > 0 || hasConciergeNew || hasPicksNew) && (
        <div 
          className="mp-status-indicators"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '8px 16px',
            pointerEvents: 'none', // NOT clickable
            userSelect: 'none'
          }}
          data-testid="chat-status-indicators"
        >
          {/* C° Indicator - Concierge status */}
          {(conciergeCount > 0 || hasConciergeNew) && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                position: 'relative'
              }}
            >
              <span style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#10b981',
                letterSpacing: '-0.5px'
              }}>
                C°
              </span>
              
              {/* Count badge or new dot */}
              {conciergeCount > 0 ? (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}>
                  {conciergeCount > 9 ? '9+' : conciergeCount}
                </span>
              ) : hasConciergeNew && (
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981'
                }} />
              )}
            </div>
          )}
          
          {/* PICKS Indicator */}
          {(picksCount > 0 || hasPicksNew) && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '40px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
                border: '2px solid rgba(236, 72, 153, 0.5)',
                position: 'relative'
              }}
            >
              <Gift size={18} style={{ color: 'white', opacity: 0.9 }} />
              
              {/* Count badge or new dot */}
              {picksCount > 0 ? (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9px',
                  background: '#ec4899',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }}>
                  {picksCount > 9 ? '9+' : picksCount}
                </span>
              ) : hasPicksNew && (
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ec4899'
                }} />
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Helper text - Mental model clarifier */}
      <div className="mp-helper-text" style={{
        padding: '4px 16px 8px',
        textAlign: 'center',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.5)',
        fontStyle: 'italic'
      }}>
        Ask for anything. If it needs action, we'll open a request and handle it in Services.
      </div>
      
      {/* Photo Preview Banner */}
      {uploadPreview && (
        <div className="mp-upload-preview">
          <img src={uploadPreview.url} alt="Upload preview" className="mp-preview-thumb" />
          <span className="mp-preview-name">{uploadPreview.name}</span>
          <button onClick={clearPreview} className="mp-preview-clear" type="button">
            <X size={14} />
          </button>
        </div>
      )}
      
      <div className="mp-composer-inner">
        {/* New Chat Button - shown when there's an active conversation */}
        {hasConversation && onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className="mp-btn-newchat"
            data-testid="new-chat-btn"
            title="Start a new conversation"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer',
              marginRight: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
            }}
          >
            <MessageSquarePlus size={18} />
          </button>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          data-testid="photo-input"
        />
        
        <form onSubmit={handleSubmit} className="mp-input-row">
          {/* Photo Upload Button */}
          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={isUploading || isProcessing}
            className={`mp-btn-photo ${isUploading ? 'uploading' : ''}`}
            data-testid="photo-upload-btn"
            title="Upload a photo for Mira to analyze"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Camera size={18} />
            )}
          </button>
          
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
