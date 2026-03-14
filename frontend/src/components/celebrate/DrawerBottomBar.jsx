/**
 * DrawerBottomBar.jsx
 * Celebrate Pillars Master Build — exact spec from Celebrate_Pillars_MASTER.docx
 *
 * Props:
 *   itemCount    — number of items added in this session
 *   drawerCategory — pillar id string (food, play, social, adventure, grooming, learning, health, memory)
 *   petName      — string
 *   onAction     — callback for right button click
 *
 * States:
 *   State 1 (0 items): neutral whisper + "Explore More →"
 *   State 2 (1 item):  pillar-specific whisper + "Build {petName}'s Birthday Plan →"
 *   State 3 (2+ items): count badge + "Keep Building →"
 *
 * NEVER use: Continue Shopping, Back, Close, Done, Checkout
 */

import React from 'react';

const PILLAR_WHISPERS = {
  food:      "🍰 Birthday feast chosen — {petName}'s table is set",
  play:      "🎾 Toy chosen — {petName}'s tail is already wagging",
  social:    "🦋 Pawty item chosen — Bruno and Cookie are going to love this",
  adventure: "🌅 Adventure chosen — {petName}'s birthday starts in motion",
  grooming:  "✨ Pamper session chosen — {petName} is going to look beautiful",
  learning:  "🧠 Mind gift chosen — {petName} has something to solve",
  health:    "💚 Wellness gift chosen — the most loving thing you can give",
  memory:    "📸 Memory chosen — this birthday will last forever",
};

const getWhisper = (itemCount, drawerCategory, petName) => {
  if (itemCount === 0) {
    return `✦ Everything here is personalised for ${petName}`;
  }
  if (itemCount === 1) {
    const template = PILLAR_WHISPERS[drawerCategory] || `✦ Soul pick chosen — Mira chose this one for ${petName}`;
    return template.replace('{petName}', petName);
  }
  return `🎂 + ${itemCount - 1} more things — ${petName}'s plan is growing`;
};

const getButtonLabel = (itemCount, petName) => {
  if (itemCount === 0) return `Explore More for ${petName}`;
  if (itemCount === 1) return `Build ${petName}'s Birthday Plan`;
  return `Keep Building`;
};

const DrawerBottomBar = ({ itemCount = 0, drawerCategory = '', petName = 'your pet', onAction }) => {
  const whisper = getWhisper(itemCount, drawerCategory, petName);
  const buttonLabel = getButtonLabel(itemCount, petName);
  const hasItems = itemCount > 0;

  return (
    <div
      className="flex items-center justify-between gap-4 px-5 border-t"
      style={{
        height: 72,
        flexShrink: 0,
        background: 'linear-gradient(135deg, #2D0050, #6B0099, #C44DFF)',
        borderColor: 'rgba(255,255,255,0.12)',
        boxShadow: '0 -4px 20px rgba(196,77,255,0.20)',
      }}
      data-testid="drawer-bottom-bar"
    >
      {/* LEFT — Mira pulse dot + whisper */}
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        <div
          className="relative flex-shrink-0 rounded-full mira-pulse"
          style={{
            width: 20,
            height: 20,
            background: 'linear-gradient(135deg, #FF6B9D, #C44DFF)',
          }}
        >
          {itemCount >= 2 && (
            <span
              className="absolute flex items-center justify-center rounded-full badge-pop"
              style={{
                top: -4, right: -4,
                width: 16, height: 16,
                fontSize: 9, fontWeight: 800,
                background: 'linear-gradient(135deg, #FFD080, #FF8C42)',
                color: '#1A0A00',
              }}
            >
              {itemCount}
            </span>
          )}
        </div>
        <span
          className="font-medium text-white overflow-hidden text-ellipsis whitespace-nowrap transition-opacity duration-150"
          style={{ fontSize: 13, maxWidth: 300 }}
        >
          {whisper}
        </span>
      </div>

      {/* RIGHT — Action button */}
      <button
        onClick={onAction}
        className="flex-shrink-0 flex items-center gap-1.5 rounded-full font-bold text-white whitespace-nowrap transition-all duration-150 hover:scale-[1.02] active:scale-[0.97]"
        style={{
          padding: '10px 18px',
          fontSize: 13,
          background: hasItems ? 'rgba(255,208,128,0.20)' : 'rgba(255,255,255,0.15)',
          border: hasItems
            ? '1.5px solid rgba(255,208,128,0.60)'
            : '1.5px solid rgba(255,255,255,0.40)',
          boxShadow: hasItems ? '0 0 16px rgba(255,208,128,0.25)' : 'none',
        }}
        data-testid="drawer-action-btn"
      >
        {buttonLabel}
        <span style={{ color: '#FFD080', marginLeft: 4, transition: 'transform 150ms ease' }}>→</span>
      </button>
    </div>
  );
};

export default DrawerBottomBar;
