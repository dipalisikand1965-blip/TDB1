/**
 * QuickReplies - Contextual action suggestions after Mira's response
 * ==================================================================
 * Golden Standard: 3-4 contextual buttons after EVERY advisory response
 * Buttons should be relevant to the conversation context
 * 
 * Examples:
 * - After meal advice: [Get formal plan] [Adjust portions] [Add supplements]
 * - After travel advice: [Book stays] [Pack list] [Vet clearance]
 * - After product picks: [Send to Concierge] [See more] [Why these?]
 */

import React from 'react';
import { Send, RefreshCw, HelpCircle, ChevronRight, Gift, Calendar, MapPin, Heart } from 'lucide-react';

// Generate contextual quick replies based on conversation context
export const generateQuickReplies = (context) => {
  const { pillar, hasProducts, hasServices, intent, isAdvisory, petName = 'my pet' } = context;
  
  // Default quick replies
  const defaultReplies = [
    { text: 'Tell me more', icon: ChevronRight, action: 'Tell me more about this' },
    { text: 'Send to Concierge', icon: Send, action: 'Send this to my Pet Concierge®', primary: true }
  ];
  
  // Pillar-specific quick replies
  const pillarReplies = {
    celebrate: [
      { text: 'See party ideas', icon: Gift, action: `Show me birthday party ideas for ${petName}` },
      { text: 'Find cakes', icon: Gift, action: `Find birthday cakes for ${petName}` },
      { text: 'Send to Concierge', icon: Send, action: 'Send this to my Pet Concierge® to plan', primary: true }
    ],
    dine: [
      { text: 'Get meal plan', icon: Calendar, action: `Create a formal meal plan for ${petName}` },
      { text: 'Adjust portions', icon: RefreshCw, action: 'Adjust the portions for weight management' },
      { text: 'Send to Concierge', icon: Send, action: 'Send this meal plan to my Pet Concierge®', primary: true }
    ],
    travel: [
      { text: 'Find stays', icon: MapPin, action: `Find pet-friendly stays for ${petName}` },
      { text: 'Travel checklist', icon: ChevronRight, action: `What should I pack for traveling with ${petName}?` },
      { text: 'Book with Concierge', icon: Send, action: 'Help me book this trip', primary: true }
    ],
    care: [
      { text: 'Find vet nearby', icon: MapPin, action: 'Find a vet clinic near me' },
      { text: 'Schedule checkup', icon: Calendar, action: `Schedule a health checkup for ${petName}` },
      { text: 'Get care plan', icon: Send, action: 'Create a care plan with my Concierge®', primary: true }
    ],
    stay: [
      { text: 'See options', icon: ChevronRight, action: 'Show me more boarding options' },
      { text: 'Check availability', icon: Calendar, action: 'Check availability for these dates' },
      { text: 'Book with Concierge', icon: Send, action: 'Help me book boarding', primary: true }
    ],
    fit: [
      { text: 'Exercise plan', icon: Heart, action: `Create an exercise plan for ${petName}` },
      { text: 'Diet tips', icon: ChevronRight, action: 'Give me diet tips for weight management' },
      { text: 'Consult expert', icon: Send, action: 'Connect me with a pet fitness expert', primary: true }
    ],
    shop: [
      { text: 'See more options', icon: ChevronRight, action: 'Show me more options' },
      { text: 'Why these picks?', icon: HelpCircle, action: 'Why did you recommend these?' },
      { text: 'Send to Concierge', icon: Send, action: 'Send these picks to my Pet Concierge®', primary: true }
    ]
  };
  
  // If we have products/services, add product-specific replies
  if (hasProducts || hasServices) {
    return [
      { text: 'See more options', icon: ChevronRight, action: 'Show me more options like these' },
      { text: 'Why these?', icon: HelpCircle, action: 'Why did you recommend these for ' + petName + '?' },
      { text: 'Send to Concierge', icon: Send, action: 'Send these picks to my Pet Concierge®', primary: true }
    ];
  }
  
  // If it's advisory content (advice, not products)
  if (isAdvisory) {
    return [
      { text: 'Refine this', icon: RefreshCw, action: 'Can you adjust this advice?' },
      { text: 'More details', icon: ChevronRight, action: 'Tell me more about this' },
      { text: 'Send to Concierge', icon: Send, action: 'Send this to my Pet Concierge® for a formal plan', primary: true }
    ];
  }
  
  // Return pillar-specific or default
  return pillarReplies[pillar?.toLowerCase()] || defaultReplies;
};

const QuickReplies = ({ 
  replies = [], 
  onReply, 
  show = true,
  className = ''
}) => {
  if (!show || replies.length === 0) return null;
  
  return (
    <div className={`quick-replies ${className}`} data-testid="quick-replies">
      {replies.map((reply, index) => {
        const Icon = reply.icon || ChevronRight;
        return (
          <button
            key={index}
            className={`quick-reply-btn ${reply.primary ? 'primary' : ''}`}
            onClick={() => onReply(reply.action || reply.text)}
            data-testid={`quick-reply-${index}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{reply.text}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickReplies;
