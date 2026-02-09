/**
 * ChatMessage - Individual Message Bubble Component
 * ==================================================
 * Renders a single message in the conversation
 * Supports: user messages, Mira messages, system messages, topic shifts
 * 
 * Extracted from MiraDemoPage.jsx - Stage 5 Refactoring
 */

import React from 'react';
import { 
  Sparkles, ChevronRight, PawPrint, Gift, Heart,
  RefreshCw, ExternalLink, ShoppingBag
} from 'lucide-react';
import FormattedText from '../../utils/FormattedText';

/**
 * Split message to extract question for highlighting
 */
const splitMessageWithQuestion = (content) => {
  if (!content) return { mainText: '', questionText: '' };
  
  // Find the last question in the content
  const questionPatterns = [
    /\?[^?]*$/,  // Last sentence with ?
    /Would you like[^?]*\?/i,
    /Should I[^?]*\?/i,
    /Do you want[^?]*\?/i,
    /Can I[^?]*\?/i,
    /What would you[^?]*\?/i,
    /How about[^?]*\?/i
  ];
  
  for (const pattern of questionPatterns) {
    const match = content.match(pattern);
    if (match) {
      const questionStart = content.lastIndexOf(match[0]);
      return {
        mainText: content.substring(0, questionStart).trim(),
        questionText: match[0].trim()
      };
    }
  }
  
  return { mainText: content, questionText: '' };
};

/**
 * Get pillar icon
 */
const getPillarIcon = (pillar) => {
  const icons = {
    celebrate: '🎂',
    dine: '🍽️',
    stay: '🏨',
    travel: '✈️',
    care: '💊',
    enjoy: '🎾',
    fit: '🏃',
    learn: '🎓',
    shop: '🛒'
  };
  return icons[pillar] || '✨';
};

/**
 * UserMessage Component
 */
const UserMessage = ({ content, isOld = false }) => (
  <div className="mp-msg-user">
    <div 
      className="mp-bubble-user" 
      style={isOld ? { fontSize: '13px' } : {}}
    >
      {content}
    </div>
  </div>
);

/**
 * SystemMessage Component
 */
const SystemMessage = ({ content }) => (
  <div style={{ textAlign: 'center', padding: '8px' }}>
    <span style={{ 
      fontSize: '12px', 
      color: 'rgba(255,255,255,0.5)', 
      background: 'rgba(255,255,255,0.1)', 
      padding: '4px 12px', 
      borderRadius: '12px' 
    }}>
      {content}
    </span>
  </div>
);

/**
 * TopicShiftIndicator Component
 */
const TopicShiftIndicator = () => (
  <div className="mp-topic-shift">
    <div className="mp-topic-shift-line"></div>
    <span className="mp-topic-shift-label">
      <RefreshCw size={12} /> New Topic
    </span>
    <div className="mp-topic-shift-line"></div>
  </div>
);

/**
 * ProductCard Component - Displays a single product
 */
const ProductCard = ({ product, onBuy, onDetails }) => (
  <div className="mp-product-item" data-testid={`product-${product.id || product.name}`}>
    {product.image && (
      <div className="mp-product-image-container">
        <img 
          src={product.image} 
          alt={product.name}
          className="mp-product-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/120x120?text=Product';
          }}
        />
      </div>
    )}
    <div className="mp-product-info">
      <p className="mp-product-name">{product.name}</p>
      {product.brand && <p className="mp-product-brand">{product.brand}</p>}
      {product.price && (
        <p className="mp-product-price">₹{product.price}</p>
      )}
    </div>
    <div className="mp-product-actions">
      {product.buy_link && (
        <a 
          href={product.buy_link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mp-product-buy-btn"
          onClick={onBuy}
        >
          <ShoppingBag size={14} />
          <span>Buy</span>
        </a>
      )}
      {product.details_link && (
        <a 
          href={product.details_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mp-product-details-btn"
          onClick={onDetails}
        >
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  </div>
);

/**
 * MiraMessageHeader Component
 */
const MiraMessageHeader = ({ 
  msg, 
  pet, 
  miraPicks,
  onShowConcierge,
  onShowInsights,
  onShowPicks,
  onQuickReply
}) => (
  <div className="mp-card-header">
    <div className="mp-mira-avatar"><Sparkles /></div>
    <span className="mp-mira-name">Mira</span>
    
    {/* Quick Reply Tiles */}
    {msg.quickReplies && msg.quickReplies.length > 0 && (
      <div className="mp-header-tiles">
        {msg.quickReplies.map((chip, cIdx) => (
          <button 
            key={cIdx} 
            onClick={() => onQuickReply(chip.value)} 
            className="mp-header-tile"
            data-testid={`header-tile-${cIdx}`}
          >
            {chip.text}
          </button>
        ))}
      </div>
    )}
    
    {/* Concierge Help Button */}
    <button 
      className="mp-header-help"
      onClick={onShowConcierge}
    >
      C° <span>Need help? Tap here</span> <ChevronRight size={12} />
    </button>
    
    {/* Insight Icon */}
    {(msg.data?.response?.tips?.length > 0 || msg.data?.insights?.length > 0) && (
      <button 
        className="mp-header-insight-icon"
        onClick={onShowInsights}
        title="View insights"
      >
        <PawPrint size={16} />
        <span className="mp-insight-count">
          {(msg.data?.response?.tips?.length || 0) + (msg.data?.insights?.length || 0)}
        </span>
      </button>
    )}
    
    {/* Picks Icon */}
    <button 
      className="mp-header-picks-icon"
      onClick={onShowPicks}
      title={`${pet.name}'s Picks`}
    >
      <div className="mp-picks-gift">
        <Gift size={18} />
      </div>
      {pet.photo ? (
        <img 
          src={pet.photo} 
          alt={pet.name}
          className="mp-picks-pet-face"
        />
      ) : (
        <div className="mp-picks-paw">
          <PawPrint size={12} />
        </div>
      )}
      {(miraPicks.products.length + miraPicks.services.length) > 0 && (
        <span className="mp-picks-count">
          {miraPicks.products.length + miraPicks.services.length}
        </span>
      )}
    </button>
  </div>
);

/**
 * MiraMessageBody Component
 */
const MiraMessageBody = ({ msg, miraMode = 'ready' }) => {
  const { mainText, questionText } = splitMessageWithQuestion(msg.content);
  
  return (
    <div className="mp-card-body">
      {mainText && (
        <div className="mp-card-text">
          <FormattedText>{mainText}</FormattedText>
        </div>
      )}
      {questionText && (
        <div className="mp-question">
          <div className="mp-question-text">
            <FormattedText>{questionText}</FormattedText>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * MiraMessage Component - Full Mira response card
 */
const MiraMessage = ({ 
  msg, 
  pet, 
  miraPicks,
  miraMode,
  isOld = false,
  onShowConcierge,
  onShowInsights,
  onShowPicks,
  onQuickReply
}) => {
  if (isOld) {
    // Simplified view for older messages
    return (
      <div className="mp-msg-mira">
        <div className="mp-card" style={{ padding: '12px' }}>
          <div className="mp-card-header" style={{ marginBottom: '8px' }}>
            <div className="mp-mira-avatar" style={{ width: '24px', height: '24px' }}>
              <Sparkles size={12} />
            </div>
            <span className="mp-mira-name" style={{ fontSize: '12px' }}>Mira</span>
          </div>
          <div className="mp-card-body" style={{ fontSize: '13px' }}>
            {msg.content?.substring(0, 200)}{msg.content?.length > 200 ? '...' : ''}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mp-msg-mira">
      <div className="mp-card">
        <MiraMessageHeader 
          msg={msg}
          pet={pet}
          miraPicks={miraPicks}
          onShowConcierge={onShowConcierge}
          onShowInsights={onShowInsights}
          onShowPicks={onShowPicks}
          onQuickReply={onQuickReply}
        />
        <MiraMessageBody msg={msg} miraMode={miraMode} />
      </div>
    </div>
  );
};

/**
 * ChatMessage - Main Export Component
 */
const ChatMessage = ({ 
  msg, 
  index,
  pet, 
  miraPicks = { products: [], services: [] },
  miraMode = 'ready',
  isOld = false,
  onShowConcierge,
  onShowInsights,
  onShowPicks,
  onQuickReply
}) => {
  // Topic shift indicator
  if (msg.type === 'topic_shift') {
    return <TopicShiftIndicator />;
  }
  
  // User message
  if (msg.type === 'user') {
    return <UserMessage content={msg.content} isOld={isOld} />;
  }
  
  // System message
  if (msg.type === 'system') {
    return <SystemMessage content={msg.content} />;
  }
  
  // Mira message (default)
  return (
    <MiraMessage 
      msg={msg}
      pet={pet}
      miraPicks={miraPicks}
      miraMode={miraMode}
      isOld={isOld}
      onShowConcierge={onShowConcierge}
      onShowInsights={onShowInsights}
      onShowPicks={onShowPicks}
      onQuickReply={onQuickReply}
    />
  );
};

export default ChatMessage;
export { UserMessage, SystemMessage, MiraMessage, TopicShiftIndicator, ProductCard };
