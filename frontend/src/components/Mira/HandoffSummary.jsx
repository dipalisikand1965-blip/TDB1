/**
 * HandoffSummary - Summary Card shown BEFORE sending to Concierge®
 * ================================================================
 * Shows what Mira is about to send to Concierge® for confirmation
 * User can EDIT the summary before sending
 * 
 * "Like when Emergent hands off to next agent with full context"
 */

import React, { useState, useEffect } from 'react';
import { Send, Edit3, X, Sparkles, Calendar, MapPin, Gift, Heart, Check, Scissors, Plane, Stethoscope, ShoppingBag } from 'lucide-react';

// Icon mapping for different pillars
const PILLAR_ICONS = {
  celebrate: Gift,
  dine: MapPin,
  travel: Plane,
  care: Stethoscope,
  groom: Scissors,
  grooming: Scissors,
  stay: MapPin,
  fit: Heart,
  shop: ShoppingBag,
  learn: Sparkles,
  paperwork: Calendar,
  emergency: Heart,
  advisory: Sparkles,
  default: Sparkles
};

const PILLAR_COLORS = {
  celebrate: 'from-pink-500/20 to-purple-500/20',
  dine: 'from-orange-500/20 to-amber-500/20',
  travel: 'from-blue-500/20 to-cyan-500/20',
  care: 'from-green-500/20 to-emerald-500/20',
  groom: 'from-purple-500/20 to-violet-500/20',
  grooming: 'from-purple-500/20 to-violet-500/20',
  stay: 'from-indigo-500/20 to-violet-500/20',
  fit: 'from-rose-500/20 to-pink-500/20',
  shop: 'from-amber-500/20 to-yellow-500/20',
  learn: 'from-purple-500/20 to-indigo-500/20',
  paperwork: 'from-slate-500/20 to-gray-500/20',
  emergency: 'from-red-500/20 to-orange-500/20',
  advisory: 'from-teal-500/20 to-cyan-500/20',
  default: 'from-purple-500/20 to-pink-500/20'
};

// Pillar options for dropdown
const PILLAR_OPTIONS = [
  { id: 'care', name: 'Care & Health' },
  { id: 'groom', name: 'Grooming' },
  { id: 'travel', name: 'Travel' },
  { id: 'stay', name: 'Boarding & Stay' },
  { id: 'dine', name: 'Dining Out' },
  { id: 'celebrate', name: 'Celebration' },
  { id: 'shop', name: 'Shopping' },
  { id: 'fit', name: 'Fitness' },
  { id: 'learn', name: 'Training' },
  { id: 'paperwork', name: 'Documents' },
  { id: 'emergency', name: 'Emergency' },
];

const HandoffSummary = ({
  isOpen,
  onClose,
  onConfirm,
  onEdit,
  petName = 'your pet',
  pillar = 'general',
  title = 'Request Summary',
  items = [],
  notes = '',
  ticketId = null
}) => {
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [editedPillar, setEditedPillar] = useState(pillar);
  const [editedTitle, setEditedTitle] = useState(title);
  
  // Reset editing state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEditedNotes(notes);
      setEditedPillar(pillar);
      setEditedTitle(title);
      setIsEditing(false);
    }
  }, [isOpen, notes, pillar, title]);
  
  if (!isOpen) return null;
  
  const currentPillar = isEditing ? editedPillar : pillar;
  const Icon = PILLAR_ICONS[currentPillar] || PILLAR_ICONS.default;
  const gradientClass = PILLAR_COLORS[currentPillar] || PILLAR_COLORS.default;
  
  const handleConfirm = () => {
    // Pass edited values to parent
    onConfirm({
      notes: editedNotes,
      pillar: editedPillar,
      title: editedTitle
    });
  };
  
  const handleStartEditing = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    // Reset to original values
    setEditedNotes(notes);
    setEditedPillar(pillar);
    setEditedTitle(title);
    setIsEditing(false);
  };
  
  return (
    <div className="handoff-overlay" data-testid="handoff-summary">
      <div className="handoff-backdrop" onClick={onClose} />
      
      <div className="handoff-card">
        {/* Header */}
        <div className={`handoff-header bg-gradient-to-r ${gradientClass}`}>
          <div className="handoff-icon">
            <Icon className="w-5 h-5" />
          </div>
          <div className="handoff-title-group">
            {isEditing ? (
              <input 
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="handoff-title-input"
                data-testid="handoff-title-input"
                placeholder="Request title..."
              />
            ) : (
              <h3 className="handoff-title">{title}</h3>
            )}
            <span className="handoff-subtitle">for {petName}</span>
          </div>
          <button onClick={onClose} className="handoff-close" data-testid="handoff-close">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Pillar Selector (shown in edit mode) */}
        {isEditing && (
          <div className="handoff-pillar-selector">
            <label className="handoff-pillar-label">Request Category:</label>
            <select 
              value={editedPillar}
              onChange={(e) => setEditedPillar(e.target.value)}
              className="handoff-pillar-dropdown"
              data-testid="handoff-pillar-select"
            >
              {PILLAR_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Summary Content */}
        <div className="handoff-content">
          {items.length > 0 && (
            <div className="handoff-items">
              {items.map((item, idx) => (
                <div key={idx} className="handoff-item">
                  <span className="handoff-item-label">{item.label}</span>
                  <span className="handoff-item-value">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Notes Section - Editable */}
          <div className="handoff-notes">
            <span className="handoff-notes-label">Notes for Concierge®</span>
            {isEditing ? (
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="handoff-notes-textarea"
                data-testid="handoff-notes-textarea"
                placeholder="Add any additional details for your request..."
                rows={4}
              />
            ) : (
              <p className="handoff-notes-text">{notes || 'No additional notes'}</p>
            )}
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="handoff-footer">
          <p className="handoff-footer-text">
            Your Pet Concierge® will review this and get back to you shortly.
          </p>
          
          <div className="handoff-actions">
            {isEditing ? (
              <>
                <button 
                  onClick={handleCancelEdit} 
                  className="handoff-btn-secondary"
                  data-testid="handoff-cancel-edit"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                
                <button 
                  onClick={handleConfirm} 
                  className="handoff-btn-primary"
                  data-testid="handoff-save-send"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Send</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleStartEditing} 
                  className="handoff-btn-secondary"
                  data-testid="handoff-edit"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                
                <button 
                  onClick={handleConfirm} 
                  className="handoff-btn-primary"
                  data-testid="handoff-confirm"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to Concierge®</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Additional CSS for editing states */}
      <style>{`
        .handoff-title-input {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          padding: 6px 10px;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          width: 100%;
        }
        .handoff-title-input:focus {
          outline: none;
          border-color: rgba(255,255,255,0.4);
        }
        .handoff-pillar-selector {
          padding: 12px 16px;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .handoff-pillar-label {
          display: block;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .handoff-pillar-dropdown {
          width: 100%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          padding: 8px 12px;
          color: white;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .handoff-pillar-dropdown:focus {
          outline: none;
          border-color: rgba(255,255,255,0.4);
        }
        .handoff-pillar-dropdown option {
          background: #1a1a2e;
          color: white;
        }
        .handoff-notes-textarea {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          padding: 12px;
          color: rgba(255,255,255,0.9);
          font-size: 0.9rem;
          line-height: 1.5;
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        .handoff-notes-textarea:focus {
          outline: none;
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.08);
        }
        .handoff-notes-textarea::placeholder {
          color: rgba(255,255,255,0.4);
        }
      `}</style>
    </div>
  );
};

export default HandoffSummary;
