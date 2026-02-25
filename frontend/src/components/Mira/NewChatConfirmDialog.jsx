/**
 * NewChatConfirmDialog - Confirmation dialog for starting a new chat
 * ===================================================================
 * Shows when user tries to start a new chat while having unfinished work.
 * 
 * Title: Start a new chat?
 * Body: Your requests stay safe in Services. This just starts a fresh chat thread.
 * Buttons: Start new chat | Cancel
 */

import React from 'react';
import { MessageSquarePlus, X } from 'lucide-react';

/**
 * NewChatConfirmDialog Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether dialog is visible
 * @param {Function} props.onConfirm - Called when user confirms
 * @param {Function} props.onCancel - Called when user cancels
 * @param {boolean} props.hasDraft - Whether there's draft text in the input
 * @param {boolean} props.hasAwaitingTicket - Whether there's a ticket awaiting user action
 */
const NewChatConfirmDialog = ({
  isOpen = false,
  onConfirm,
  onCancel,
  hasDraft = false,
  hasAwaitingTicket = false
}) => {
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div 
        className="fixed left-4 right-4 bottom-24 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[380px] z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-200"
        data-testid="new-chat-confirm-dialog"
      >
        <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <MessageSquarePlus className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-base">Start a new chat?</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Body */}
          <div className="p-4">
            <p className="text-slate-300 text-sm leading-relaxed">
              Your requests stay safe in <span className="text-purple-400 font-medium">Services</span>. 
              This just starts a fresh chat thread.
            </p>
            
            {hasDraft && (
              <p className="text-amber-400/80 text-xs mt-2">
                Your draft message will be cleared.
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 p-4 pt-0">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
              data-testid="cancel-new-chat"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 transition-colors"
              data-testid="confirm-new-chat"
            >
              Start new chat
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewChatConfirmDialog;
