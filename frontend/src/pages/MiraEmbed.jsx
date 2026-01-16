import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, PawPrint } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { API_URL } from '../utils/api';


const MiraEmbed = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Woof! 🐾 I'm Mira, your Concierge® at The Doggy Bakery! I can help you find the perfect treats, cakes, and gifts for your furry friend. What can I help you with today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [sessionId] = useState(() => `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/mira/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId,
          source: 'shopify_embed'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Oops! I'm having a little trouble right now. Please try again or visit thedoggybakery.com for help! 🐕" 
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Woof! Something went wrong. Please refresh and try again! 🐾" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: '🎂 Birthday Cakes', message: 'Show me birthday cakes for my dog' },
    { label: '🍪 Treats', message: 'What treats do you recommend?' },
    { label: '🎁 Gift Ideas', message: 'I need a gift for a dog lover' },
    { label: '📍 Delivery', message: 'Do you deliver to my area?' },
  ];

  const handleQuickAction = (message) => {
    setInput(message);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center gap-3 shadow-lg">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Mira</h1>
          <p className="text-xs text-purple-100">Your Concierge® 🐾</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-white shadow-md border border-gray-100 rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <PawPrint className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-semibold text-purple-600">Mira</span>
                </div>
              )}
              <p className={`text-sm whitespace-pre-wrap ${msg.role === 'user' ? '' : 'text-gray-700'}`}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-md border border-gray-100 p-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-gray-500">Mira is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.message)}
                className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-full transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Mira anything..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-gray-400 text-center mt-2">
          Powered by The Doggy Bakery 🐕
        </p>
      </div>
    </div>
  );
};

export default MiraEmbed;
