import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Sparkles, Minimize2, Maximize2, Send, Loader2, User, Bot } from 'lucide-react';
import { Button } from './ui/button';
import ReactMarkdown from 'react-markdown';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Generate unique session ID
const generateSessionId = () => {
  const stored = sessionStorage.getItem('mira_session_id');
  if (stored) return stored;
  const newId = `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('mira_session_id', newId);
  return newId;
};

const MiraAI = () => {
  const location = useLocation();
  
  // Hide MiraAI on admin and agent pages
  const hiddenPaths = ['/admin', '/agent', '/login'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "🐾 **Hello, pet parent!** I'm Mira, your Super Concierge® at The Doggy Company.\n\nI can help you with:\n- 🎂 Ordering birthday cakes & treats\n- 🍽️ Dine reservations at pet-friendly restaurants\n- 🏨 Stay bookings at pet-friendly hotels\n- ✈️ Pet travel & relocation assistance\n- 💊 Pet care & nutrition advice\n\nHow can I assist you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Listen for custom event to open Mira
  useEffect(() => {
    const handleOpenMira = () => setIsOpen(true);
    window.addEventListener('openMiraAI', handleOpenMira);
    return () => window.removeEventListener('openMiraAI', handleOpenMira);
  }, []);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/mira/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId,
          source: 'web_widget'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that. Please try again."
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Mira chat error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "⚠️ I'm having trouble connecting right now. Please try again in a moment, or contact us directly at woof@thedoggycompany.in"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: '🎂 Order a Cake', message: 'I want to order a birthday cake for my dog' },
    { label: '🍽️ Book Dining', message: 'Help me find a pet-friendly restaurant' },
    { label: '🏨 Plan a Stay', message: 'I need a pet-friendly hotel recommendation' },
  ];

  const handleQuickAction = (message) => {
    setInputValue(message);
    setTimeout(() => sendMessage(), 100);
  };

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
      className={`fixed z-50 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
        isMinimized 
          ? 'bottom-6 right-6 w-80 h-16' 
          : 'bottom-6 right-6 w-[380px] h-[550px] max-h-[calc(100vh-100px)] md:w-[400px] md:h-[600px]'
      }`}
      data-testid="mira-chat-container"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Mira</h3>
            <p className="text-xs opacity-80">Super Concierge® • Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-white hover:bg-white/20 h-9 w-9 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
            data-testid="mira-minimize-btn"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            className="text-white bg-white/10 hover:bg-red-500 h-9 w-9 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setIsOpen(false)}
            title="Close Mira"
            data-testid="mira-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-md'
                    : 'bg-white shadow-sm border border-gray-100 rounded-bl-md'
                }`}>
                  <div className={`text-sm prose prose-sm max-w-none ${
                    message.role === 'user' ? 'prose-invert' : ''
                  }`}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Mira is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (show only at start) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap bg-gray-50">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.message)}
                  className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t bg-white flex-shrink-0">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
                data-testid="mira-input"
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center"
                data-testid="mira-send-btn"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-2">
              Powered by The Doggy Company AI
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MiraAI;
