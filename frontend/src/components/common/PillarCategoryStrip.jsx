/**
 * PillarCategoryStrip — Generic horizontally-scrollable category icon strip.
 * Used by Learn, Paperwork, Emergency, Farewell, Adopt, Shop, Services mobile pages.
 * Props:
 *   categories  — [{id, icon, label, iconBg?}]
 *   activeId    — currently selected category id
 *   onSelect    — (id) => void
 *   accentColor — active underline / border colour (default: pillar orange)
 */
import React, { useRef } from 'react';

export default function PillarCategoryStrip({
  categories = [],
  activeId,
  onSelect,
  accentColor = '#E76F51',
  bgColor = '#fff',
}) {
  const scrollRef = useRef(null);

  return (
    <div style={{
      background: bgColor,
      borderBottom: '1px solid #F0E8E0',
      position: 'relative',
    }}>
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          padding: '0 8px',
        }}
      >
        {categories.map(cat => {
          const isActive = activeId === cat.id;
          return (
            <button
              key={cat.id}
              data-testid={`strip-cat-${cat.id}`}
              onClick={() => onSelect?.(isActive ? null : cat.id)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 12px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
                transition: 'border-color 0.15s',
                minWidth: 64,
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: cat.iconBg || (isActive ? `${accentColor}22` : '#F5F5F0'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                transition: 'background 0.15s',
              }}>
                {cat.icon}
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? accentColor : '#555',
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: 60,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
