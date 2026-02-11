/**
 * SendToConciergeChatCard.jsx
 * 
 * In-chat confirmation card before sending picks to Concierge®
 * Shows selected items, allows adding notes, Cancel/Confirm buttons
 * 
 * Appears directly in the chat conversation flow
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Check, Send, X } from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

const SendToConciergeChatCard = ({
  items = [],
  petName = 'your pet',
  onConfirm,
  onCancel
}) => {
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleConfirm = async () => {
    hapticFeedback.success();
    setIsSubmitting(true);
    await onConfirm?.(additionalNotes);
    setIsSubmitting(false);
  };
  
  const handleCancel = () => {
    hapticFeedback.buttonTap();
    onCancel?.();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-purple-500/30 shadow-xl"
      data-testid="send-to-concierge-card"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-900/60 to-pink-900/40 border-b border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Send to Concierge</h3>
            <p className="text-sm text-purple-300">For {petName}</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Description */}
        <p className="text-gray-300 text-sm">
          Your concierge will receive {items.length === 1 ? 'this' : 'these'} {items.length} pick{items.length > 1 ? 's' : ''} and reach out to help you:
        </p>
        
        {/* Items List */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {items.map((item, index) => (
            <div 
              key={item.id || index}
              className="flex items-center gap-2 text-gray-200"
            >
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-sm truncate">{item.name}</span>
            </div>
          ))}
        </div>
        
        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Anything else? (optional)
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Add any specific requests or details..."
            className="w-full bg-gray-800/80 border border-gray-700 rounded-xl p-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
            rows={3}
          />
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 pt-0 flex gap-3">
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="flex-1 py-3.5 bg-gray-700/80 text-gray-300 rounded-full font-semibold text-sm hover:bg-gray-600 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Sending...' : 'Confirm'}
        </button>
      </div>
    </motion.div>
  );
};

export default SendToConciergeChatCard;
