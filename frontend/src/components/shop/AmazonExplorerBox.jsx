/**
 * AmazonExplorerBox.jsx
 * The Doggy Company
 *
 * A standalone "browse beyond" box with a search input that opens Amazon
 * with TDC's affiliate tag. Intentionally separate from the Concierge CTA.
 *
 * Used in: ShopMobilePage, ShopSoulPage
 */

import { useState } from 'react';

const AFFILIATE_TAG = 'thedoggyco-21';

function buildQuery(raw, petName = '') {
  let q = (raw || '').trim();
  // Strip pet name so we don't double-append
  if (petName) q = q.replace(new RegExp(petName, 'gi'), '').trim();
  // Ensure "dog" prefix
  if (q && !/^dog\b/i.test(q)) q = 'dog ' + q;
  if (!q) q = 'dog supplies';
  return q;
}

export default function AmazonExplorerBox({ pet, isDesktop = false }) {
  const [query, setQuery] = useState('');
  const petName = pet?.name || 'your dog';

  const handleExplore = () => {
    const q = buildQuery(query, petName);
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(q)}&tag=${AFFILIATE_TAG}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleExplore();
  };

  return (
    <div
      data-testid="amazon-explorer-box"
      style={{
        background: 'linear-gradient(135deg, #1c1530 0%, #261b3a 100%)',
        border: '1px solid rgba(255,153,0,0.3)',
        borderRadius: isDesktop ? 20 : 20,
        padding: isDesktop ? '28px 32px' : '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle glow top-right */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 120, height: 120,
        background: 'radial-gradient(circle, rgba(255,153,0,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,153,0,0.15)',
        border: '1px solid rgba(255,153,0,0.35)',
        borderRadius: 999, padding: '4px 12px',
        color: '#FF9900', fontSize: 12, fontWeight: 700,
        marginBottom: 12, letterSpacing: '0.03em',
      }}>
        Browse Beyond
      </div>

      {/* Heading */}
      <div style={{
        fontSize: isDesktop ? 22 : 19,
        fontWeight: 700, color: '#fff',
        lineHeight: 1.25, marginBottom: 8,
        fontFamily: 'Georgia, serif',
      }}>
        Not finding it in our store?
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: 13, color: 'rgba(255,255,255,0.55)',
        lineHeight: 1.6, marginBottom: 16,
      }}>
        Type what {petName} needs — your Concierge points you to the right place on Amazon.
      </div>

      {/* Search input row */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 14,
        flexDirection: isDesktop ? 'row' : 'column',
      }}>
        <input
          data-testid="amazon-explorer-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`e.g. rope toy, waterproof harness, calming treats…`}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,153,0,0.35)',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 14,
            color: '#fff',
            outline: 'none',
            fontFamily: 'DM Sans, sans-serif',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(255,153,0,0.7)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,153,0,0.35)'; }}
        />
        {isDesktop && (
          <button
            data-testid="amazon-explorer-search-btn"
            onClick={handleExplore}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: 'none',
              background: '#FF9900',
              color: '#1a1019',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Search →
          </button>
        )}
      </div>

      {/* Amazon link */}
      <button
        data-testid="amazon-explorer-link"
        onClick={handleExplore}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: '#FF9900',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          letterSpacing: '0.01em',
          opacity: 0.9,
          transition: 'opacity 0.15s',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.9'}
      >
        Your Concierge recommends exploring here →
      </button>

      {/* Disclaimer */}
      <div style={{
        fontSize: 10,
        color: 'rgba(255,255,255,0.25)',
        marginTop: 10,
        lineHeight: 1.5,
      }}>
        Links may include TDC affiliate tags. Purchases support The Doggy Company.
      </div>
    </div>
  );
}
