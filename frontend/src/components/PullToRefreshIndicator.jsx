/**
 * PullToRefreshIndicator - Visual indicator for pull-to-refresh
 */

import React from 'react';
import { RefreshCw, ArrowDown, Sparkles } from 'lucide-react';

const PullToRefreshIndicator = ({ progress, isRefreshing, show }) => {
  if (!show && !isRefreshing) return null;

  const progressPercent = Math.min(progress, 100);
  const shouldTrigger = progressPercent >= 100;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-200"
      style={{ 
        transform: `translateY(${Math.min(progress * 0.8, 60)}px)`,
        opacity: Math.min(progress / 50, 1)
      }}
    >
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all ${
        isRefreshing 
          ? 'bg-purple-600 text-white' 
          : shouldTrigger 
            ? 'bg-green-500 text-white' 
            : 'bg-white text-gray-600'
      }`}>
        {isRefreshing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Refreshing...</span>
          </>
        ) : shouldTrigger ? (
          <>
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Release to refresh</span>
          </>
        ) : (
          <>
            <ArrowDown 
              className="w-4 h-4 transition-transform"
              style={{ transform: `rotate(${progressPercent * 1.8}deg)` }}
            />
            <span className="text-sm font-medium">Pull to refresh</span>
          </>
        )}
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
