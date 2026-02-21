/**
 * Text Rendering Components - FormattedText & TypedText
 * ======================================================
 * Reusable components for rendering markdown and streaming text
 * 
 * Extracted from MiraDemoPage.jsx - P1 Refactoring
 */

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * FormattedText - Renders markdown with proper styling
 * Uses wrapper div for className (react-markdown v8+ compatible)
 * Pre-processes text to ensure proper markdown formatting
 */
export const FormattedText = ({ children, className = '' }) => {
  if (!children) return null;
  
  // Pre-process text to convert inline dashes to proper markdown bullet points
  const processText = (text) => {
    if (typeof text !== 'string') return text;
    
    // Convert inline formatting to proper markdown
    let processed = text
      // Convert inline numbered items to proper list format (e.g., "1. Text" → "\n1. Text")
      .replace(/([.:]\s*)(\d+)\.\s+/g, '$1\n\n$2. ')
      // Handle dashes at start of sentences (after period or colon)
      .replace(/([.:])(\s*)- /g, '$1\n\n- ')
      // Handle remaining inline dashes that look like list items
      .replace(/ - ([A-Z])/g, '\n\n- $1')
      // Convert ### headers to proper format
      .replace(/\s*###\s*/g, '\n\n### ')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n');
    
    return processed.trim();
  };
  
  return (
    <div className={`formatted-text ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-purple-200">{children}</em>,
          ul: ({ children }) => <ul className="formatted-list my-3">{children}</ul>,
          ol: ({ children }) => <ol className="formatted-list formatted-list-numbered my-3">{children}</ol>,
          li: ({ children }) => <li className="formatted-list-item">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-4 text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-3 text-purple-200">{children}</h3>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-300 underline hover:text-purple-200">
              {children}
            </a>
          ),
          code: ({ children }) => <code className="bg-purple-900/50 px-1.5 py-0.5 rounded text-xs">{children}</code>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-purple-400 pl-3 my-3 italic text-purple-200">
              {children}
            </blockquote>
          ),
        }}
      >
        {processText(children)}
      </ReactMarkdown>
    </div>
  );
};

/**
 * TypedText - Streaming text animation like ChatGPT
 * Displays text character by character for a premium feel
 */
export const TypedText = ({ text, speed = 40, onComplete, isLatest = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(!isLatest);
  
  useEffect(() => {
    // Only animate the latest message
    if (!isLatest || !text) {
      setDisplayedText(text || '');
      setIsComplete(true);
      return;
    }
    
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, 1000 / speed);
    
    return () => clearInterval(interval);
  }, [text, speed, isLatest, onComplete]);
  
  return (
    <span className={`typed-text ${isComplete ? 'complete' : 'typing'}`}>
      {displayedText}
      {!isComplete && <span className="typing-cursor">|</span>}
    </span>
  );
};

export default FormattedText;
