/**
 * ReplySheet - Bottom sheet composer for ticket replies
 * 
 * Native-feeling reply experience:
 * - Composer bar always visible at bottom
 * - Tap expands to full bottom sheet
 * - Sheet sits above keyboard
 * - Attachments: camera + gallery + file
 * - Message states: sending → sent → failed (tap to retry)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Camera, Image, FileText, X, Loader2, AlertCircle } from 'lucide-react';

const ReplySheet = ({ 
  ticketId,
  onSend,
  isExpanded = false,
  onExpandChange,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sendState, setSendState] = useState('idle'); // idle | sending | sent | failed
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Handle send
  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (sendState === 'sending') return;

    const messageToSend = message.trim();
    const attachmentsToSend = [...attachments];
    
    setMessage('');
    setAttachments([]);
    setSendState('sending');
    
    try {
      await onSend({
        content: messageToSend,
        attachments: attachmentsToSend
      });
      setSendState('sent');
      setTimeout(() => setSendState('idle'), 1500);
      onExpandChange?.(false);
    } catch (err) {
      console.error('Send failed:', err);
      setSendState('failed');
      setMessage(messageToSend);
      setAttachments(attachmentsToSend);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setSendState('idle');
    handleSend();
  };

  // Handle file selection
  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: type,
      file: file,
      preview: type === 'image' ? URL.createObjectURL(file) : null
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
    setShowAttachMenu(false);
  };

  // Remove attachment
  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Collapsed composer bar
  if (!isExpanded) {
    return (
      <div 
        className="px-4 py-3 border-t border-gray-800/50 bg-[#0d0d1a]"
        onClick={() => onExpandChange?.(true)}
      >
        <div className="flex items-center gap-2">
          <div 
            className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-full px-4 py-2.5 text-sm text-gray-400 cursor-text"
          >
            Reply to this ticket...
          </div>
          <button
            className="p-2.5 text-gray-400"
            onClick={(e) => {
              e.stopPropagation();
              setShowAttachMenu(!showAttachMenu);
            }}
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded bottom sheet
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0d0d1a] border-t border-gray-800/50 rounded-t-2xl shadow-2xl">
      {/* Handle bar */}
      <div className="flex justify-center pt-2 pb-1">
        <div 
          className="w-10 h-1 bg-gray-700 rounded-full cursor-pointer"
          onClick={() => onExpandChange?.(false)}
        />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800/30">
        <span className="text-sm font-medium text-gray-300">Reply</span>
        <button
          onClick={() => onExpandChange?.(false)}
          className="p-1 rounded-full hover:bg-gray-800"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto">
          {attachments.map(att => (
            <div 
              key={att.id}
              className="relative flex-shrink-0 bg-gray-800/50 rounded-lg overflow-hidden"
            >
              {att.preview ? (
                <img src={att.preview} alt="" className="w-16 h-16 object-cover" />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <button
                onClick={() => removeAttachment(att.id)}
                className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 rounded-full"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Composer */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* Attach button */}
          <div className="relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2.5 rounded-full hover:bg-gray-800 text-gray-400"
              disabled={disabled}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* Attachment menu */}
            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700/50 overflow-hidden">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 w-full text-left"
                >
                  <Image className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-200">Photo & Video</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 w-full text-left"
                >
                  <FileText className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-200">File</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Text input */}
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none min-h-[44px] max-h-32"
            rows={1}
            disabled={disabled || sendState === 'sending'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          
          {/* Send button */}
          <button
            onClick={sendState === 'failed' ? handleRetry : handleSend}
            disabled={disabled || sendState === 'sending' || (!message.trim() && attachments.length === 0)}
            className={`
              p-2.5 rounded-full transition-all
              ${sendState === 'failed' 
                ? 'bg-red-500 hover:bg-red-400' 
                : 'bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400'
              }
              text-white disabled:opacity-50 disabled:cursor-not-allowed
            `}
            data-testid="send-reply-btn"
          >
            {sendState === 'sending' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : sendState === 'failed' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Send state indicator */}
        {sendState === 'failed' && (
          <p className="text-xs text-red-400 mt-2 text-center">
            Failed to send. Tap to retry.
          </p>
        )}
      </div>
      
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'file')}
      />
    </div>
  );
};

export default ReplySheet;
