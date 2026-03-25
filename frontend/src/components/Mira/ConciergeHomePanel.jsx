/**
 * ConciergeHomePanel - CONCIERGE OS Layer Home Screen
 * =====================================================
 * The main Concierge® tab showing:
 * - Pet selector dropdown
 * - Live/offline status indicator
 * - "Tell Mira what you need" input
 * - Suggestion chips (Grooming, Boarding, Travel, Lost Pet)
 * - Active requests (Awaiting you / Options ready)
 * - Recent threads (last 5 conversations)
 * 
 * Based on CONCIERGE Bible v1.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, Send, ChevronDown, Bell, Scissors, Home, Plane, AlertTriangle,
  Clock, CheckCircle, MessageCircle, ChevronRight, User, PawPrint,
  Upload, FileText, Image, Paperclip, Check, Loader2
} from 'lucide-react';
import { API_URL } from '../../utils/api';

/**
 * Status Badge Component
 */
const StatusBadge = ({ isLive, statusText }) => (
  <div 
    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
      isLive 
        ? 'bg-green-500/20 text-green-400' 
        : 'bg-amber-500/20 text-amber-400'
    }`}
    data-testid="concierge-status-badge"
  >
    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
    {statusText}
  </div>
);

/**
 * Suggestion Chip Component
 */
const SuggestionChip = ({ chip, onClick, isUrgent }) => {
  const iconMap = {
    scissors: Scissors,
    home: Home,
    plane: Plane,
    'alert-triangle': AlertTriangle
  };
  const Icon = iconMap[chip.icon] || MessageCircle;
  
  return (
    <button
      onClick={() => onClick(chip)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
        isUrgent
          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
          : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
      data-testid={`suggestion-chip-${chip.id}`}
    >
      <Icon size={16} />
      {chip.label}
    </button>
  );
};

/**
 * Active Request Card Component
 */
const ActiveRequestCard = ({ request, onClick }) => {
  const statusColors = {
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    gray: 'bg-white/5 text-white/60 border-white/10'
  };
  
  const colorClass = statusColors[request.status_display?.color] || statusColors.gray;
  
  return (
    <button
      onClick={() => onClick(request)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
        request.has_unread_reply 
          ? 'bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
      data-testid={`active-request-${request.ticket_id}`}
    >
      <div className="flex-shrink-0 relative">
        <PawPrint size={20} className="text-purple-400" />
        {request.has_unread_reply && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-pulse" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{request.title}</span>
          <span className="text-xs text-white/50">for {request.pet_name}</span>
          {request.has_unread_reply && (
            <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-xs font-bold">
              NEW
            </span>
          )}
        </div>
        <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs ${colorClass}`}>
          {request.status_display?.text}
        </div>
      </div>
      <div className="flex-shrink-0">
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
          request.has_unread_reply 
            ? 'bg-pink-500/30 text-pink-300' 
            : 'bg-purple-500/20 text-purple-400'
        }`}>
          {request.has_unread_reply ? 'View Reply' : request.action_required}
        </span>
      </div>
    </button>
  );
};

/**
 * Recent Thread Card Component
 */
const RecentThreadCard = ({ thread, onClick }) => (
  <button
    onClick={() => onClick(thread)}
    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
    data-testid={`thread-${thread.id}`}
  >
    <div className="flex-shrink-0">
      <MessageCircle size={18} className="text-white/50" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white truncate">{thread.title}</span>
        {thread.unread_count > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-xs">
            {thread.unread_count}
          </span>
        )}
      </div>
      <p className="text-xs text-white/50 truncate mt-0.5">{thread.last_message_preview}</p>
    </div>
    <ChevronRight size={16} className="text-white/30 flex-shrink-0" />
  </button>
);

/**
 * Pet Selector Dropdown
 */
const PetSelector = ({ pets, selectedPetId, onSelect, isOpen, onToggle }) => {
  const selectedPet = pets.find(p => p.id === selectedPetId) || null;
  
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        data-testid="pet-selector-button"
      >
        {selectedPet ? (
          <>
            {selectedPet.photo_url ? (
              <img src={selectedPet.photo_url} alt={selectedPet.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <PawPrint size={16} className="text-purple-400" />
            )}
            <span className="text-sm text-white">{selectedPet.name}</span>
          </>
        ) : (
          <>
            <PawPrint size={16} className="text-white/50" />
            <span className="text-sm text-white/70">All pets</span>
          </>
        )}
        <ChevronDown size={14} className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          <button
            onClick={() => { onSelect(null); onToggle(); }}
            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-all ${
              !selectedPetId ? 'bg-purple-500/20' : ''
            }`}
          >
            <PawPrint size={16} className="text-white/50" />
            <span className="text-sm text-white">All pets</span>
          </button>
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => { onSelect(pet.id); onToggle(); }}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-all ${
                selectedPetId === pet.id ? 'bg-purple-500/20' : ''
              }`}
            >
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <PawPrint size={16} className="text-purple-400" />
              )}
              <span className="text-sm text-white">{pet.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Document Upload Component
 */
const DocumentUploadSection = ({ petId, userId, onUploadComplete }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files) => {
    if (!petId) {
      alert('Please select a pet first');
      return;
    }

    setUploading(true);
    const newUploads = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pet_id', petId);
      formData.append('context', 'concierge_upload');

      try {
        const response = await fetch(`${API_URL}/api/mira/upload/file`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          newUploads.push({
            ...data,
            originalName: file.name,
            success: true
          });
        } else {
          newUploads.push({
            originalName: file.name,
            success: false,
            error: 'Upload failed'
          });
        }
      } catch (err) {
        newUploads.push({
          originalName: file.name,
          success: false,
          error: err.message
        });
      }
    }

    setUploadedFiles(prev => [...prev, ...newUploads]);
    setUploading(false);
    
    if (onUploadComplete) {
      onUploadComplete(newUploads);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const getFileIcon = (file) => {
    if (file.file_type === 'image') return <Image size={16} className="text-purple-400" />;
    return <FileText size={16} className="text-blue-400" />;
  };

  return (
    <div className="mb-6" data-testid="document-upload-section">
      <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
        <Paperclip size={14} className="text-purple-400" />
        Upload Documents
      </h3>
      <p className="text-xs text-white/40 mb-3">
        Share vaccination records, prescriptions, or any pet documents
      </p>
      
      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
          dragActive 
            ? 'border-purple-500 bg-purple-500/10' 
            : 'border-white/10 hover:border-white/30 hover:bg-white/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid="upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleInputChange}
          className="hidden"
          data-testid="file-input"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center py-2">
            <Loader2 size={24} className="text-purple-400 animate-spin mb-2" />
            <span className="text-sm text-white/60">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2">
            <Upload size={24} className="text-white/40 mb-2" />
            <span className="text-sm text-white/60">
              Drop files here or <span className="text-purple-400">browse</span>
            </span>
            <span className="text-xs text-white/30 mt-1">
              Images, PDFs, Documents (max 10MB)
            </span>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {uploadedFiles.map((file, idx) => (
            <div 
              key={idx}
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                file.success 
                  ? 'bg-green-500/10 border border-green-500/20' 
                  : 'bg-red-500/10 border border-red-500/20'
              }`}
              data-testid={`uploaded-file-${idx}`}
            >
              {file.success ? getFileIcon(file) : <X size={16} className="text-red-400" />}
              <span className={`flex-1 truncate ${file.success ? 'text-white/80' : 'text-red-400'}`}>
                {file.originalName}
              </span>
              {file.success ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <span className="text-xs text-red-400">{file.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ConciergeHomePanel Main Component
 */
const ConciergeHomePanel = ({ 
  isOpen, 
  onClose, 
  userId,
  initialPetId = null,
  onOpenThread,
  onOpenTicket,
  initialContext = null
}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [homeData, setHomeData] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(initialPetId);
  const [petSelectorOpen, setPetSelectorOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);
  
  // Fetch home data
  const fetchHomeData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const petParam = selectedPetId || 'all';
      const response = await fetch(`${API_URL}/api/os/concierge/home?user_id=${userId}&pet_id=${petParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to load concierge data');
      }
      
      const data = await response.json();
      setHomeData(data);
    } catch (err) {
      console.error('[ConciergeHome] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedPetId]);
  
  // Load data when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchHomeData();
    }
  }, [isOpen, fetchHomeData]);
  
  // Handle initial context (coming from Learn/Today/etc)
  useEffect(() => {
    if (initialContext?.initialMessage) {
      setInputValue(initialContext.initialMessage);
    }
  }, [initialContext]);
  
  // Handle chip click
  const handleChipClick = useCallback((chip) => {
    setInputValue(chip.prefill);
  }, []);
  
  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || submitting) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/os/concierge/thread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: selectedPetId || homeData?.pets?.[0]?.id || 'unknown',
          user_id: userId,
          intent: inputValue.trim(),
          source: initialContext?.source || 'concierge_home',
          source_context: initialContext,
          suggestion_chip: null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create thread');
      }
      
      const data = await response.json();
      
      // Clear input
      setInputValue('');
      
      // Open the thread
      if (onOpenThread && data.thread) {
        onOpenThread(data.thread, data.messages);
      }
      
    } catch (err) {
      console.error('[ConciergeHome] Submit error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [inputValue, submitting, selectedPetId, userId, homeData, initialContext, onOpenThread]);
  
  // Handle active request click
  const handleRequestClick = useCallback(async (request) => {
    // Mark as read if there's an unread reply
    if (request.has_unread_reply && userId) {
      try {
        await fetch(`${API_URL}/api/os/concierge/ticket/${request.ticket_id}/mark-read?user_id=${userId}`, {
          method: 'POST'
        });
        // Update local state to remove the badge immediately
        setHomeData(prev => ({
          ...prev,
          active_requests: prev.active_requests?.map(r => 
            r.ticket_id === request.ticket_id ? { ...r, has_unread_reply: false } : r
          )
        }));
      } catch (err) {
        console.error('Error marking ticket as read:', err);
      }
    }
    
    if (onOpenTicket) {
      onOpenTicket(request.ticket_id);
    }
  }, [onOpenTicket, userId]);
  
  // Handle thread click
  const handleThreadClick = useCallback((thread) => {
    if (onOpenThread) {
      onOpenThread(thread);
    }
  }, [onOpenThread]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-end justify-center md:items-center"
      data-testid="concierge-home-panel"
    >
      <div 
        className="w-full max-w-lg h-[90vh] md:h-[85vh] bg-gray-900 rounded-t-3xl md:rounded-2xl flex flex-col overflow-hidden border border-white/10"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-lg font-semibold text-white">C</span>
              <span className="text-purple-400 text-sm">°</span>
              <span className="text-lg font-semibold text-white ml-1">Concierge®</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {homeData?.status && (
              <StatusBadge 
                isLive={homeData.status.is_live} 
                statusText={homeData.status.status_text} 
              />
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              data-testid="concierge-home-close"
            >
              <X size={20} className="text-white/70" />
            </button>
          </div>
        </div>
        
        {/* Pet Selector Row */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <PetSelector
            pets={homeData?.pets || []}
            selectedPetId={selectedPetId}
            onSelect={setSelectedPetId}
            isOpen={petSelectorOpen}
            onToggle={() => setPetSelectorOpen(!petSelectorOpen)}
          />
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
            <Bell size={18} className="text-white/50" />
            {homeData?.active_requests?.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-purple-500 rounded-full" />
            )}
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400">{error}</p>
              <button 
                onClick={fetchHomeData}
                className="mt-4 px-4 py-2 rounded-lg bg-white/10 text-white text-sm"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {/* Input Section */}
              <div className="mb-6">
                <label className="block text-sm text-white/60 mb-2">
                  Anything. Anytime. Anywhere.
                </label>
                <p className="text-xs text-white/40 mb-3">
                  From grooming to travel, vet visits to birthday parties — your Concierge® handles it all.
                </p>
                <div className="relative">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="What can we help with today?"
                    className="w-full p-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
                    rows={3}
                    data-testid="concierge-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || submitting}
                    className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all ${
                      inputValue.trim() && !submitting
                        ? 'bg-purple-500 text-white hover:bg-purple-600'
                        : 'bg-white/10 text-white/30'
                    }`}
                    data-testid="concierge-submit"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
                
                {/* Suggestion Chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {homeData?.suggestion_chips?.slice(0, 4).map(chip => (
                    <SuggestionChip
                      key={chip.id}
                      chip={chip}
                      onClick={handleChipClick}
                      isUrgent={chip.priority === 'urgent'}
                    />
                  ))}
                  {/* Upload Document Chip */}
                  <button
                    onClick={() => setShowUploadSection(!showUploadSection)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      showUploadSection
                        ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                        : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    data-testid="upload-document-chip"
                  >
                    <Paperclip size={16} />
                    Upload Docs
                  </button>
                </div>
              </div>
              
              {/* Document Upload Section - Conditionally shown */}
              {showUploadSection && (
                <DocumentUploadSection
                  petId={selectedPetId || homeData?.pets?.[0]?.id}
                  userId={userId}
                  onUploadComplete={(files) => {
                    console.log('Documents uploaded:', files);
                    // Could trigger a notification or update UI
                  }}
                />
              )}
              
              {/* Active Requests Section */}
              {homeData?.active_requests?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-amber-400" />
                    Active Requests
                  </h3>
                  <div className="space-y-2">
                    {homeData.active_requests.map(request => (
                      <ActiveRequestCard
                        key={request.ticket_id}
                        request={request}
                        onClick={handleRequestClick}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recent Threads Section */}
              {homeData?.recent_threads?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                    <MessageCircle size={14} className="text-white/50" />
                    Recent Conversations
                  </h3>
                  <div className="space-y-2">
                    {homeData.recent_threads.map(thread => (
                      <RecentThreadCard
                        key={thread.id}
                        thread={thread}
                        onClick={handleThreadClick}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {!homeData?.active_requests?.length && !homeData?.recent_threads?.length && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <MessageCircle size={28} className="text-purple-400" />
                  </div>
                  <p className="text-white/70 text-sm">
                    No active requests or conversations yet.
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    Start by telling Mira what you need!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer - Concierge® Status Message */}
        {homeData?.status && !homeData.status.is_live && (
          <div className="px-4 py-3 border-t border-white/10 bg-amber-500/10">
            <p className="text-xs text-amber-400 text-center">
              {homeData.status.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConciergeHomePanel;
