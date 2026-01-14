import React, { useState, useEffect } from 'react';
import { X, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';

const MiraAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Listen for custom event to open Mira
  useEffect(() => {
    const handleOpenMira = () => setIsOpen(true);
    window.addEventListener('openMiraAI', handleOpenMira);
    return () => window.removeEventListener('openMiraAI', handleOpenMira);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group"
        data-testid="mira-fab-button"
      >
        <Sparkles className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          Chat with Mira
        </span>
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-50 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
        isMinimized 
          ? 'bottom-6 right-6 w-80 h-16' 
          : 'bottom-6 right-6 w-[400px] max-h-[calc(100vh-100px)] h-[600px] md:w-[420px] md:h-[600px]'
      }`}
      data-testid="mira-chat-container"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Mira</h3>
            <p className="text-xs opacity-80">Super Concierge®</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="text-white hover:bg-white/20 h-8 w-8 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            className="text-white hover:bg-red-500 h-8 w-8 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setIsOpen(false)}
            title="Close"
            data-testid="mira-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chatbase iframe */}
      {!isMinimized && (
        <div className="h-[calc(100%-72px)]">
          <iframe
            src={process.env.REACT_APP_CHATBASE_IFRAME_URL || "https://www.chatbase.co/chatbot-iframe/zb13EoKHT4pXMmueUNG1M"}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="Mira AI Concierge"
          />
        </div>
      )}
    </div>
  );
};

export default MiraAI;
