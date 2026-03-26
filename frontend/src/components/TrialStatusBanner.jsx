/**
 * TrialStatusBanner.jsx
 * Shows a persistent trial/account status banner at the top of the app.
 * States: trial | trial_ending | grace_period | paused
 * "paused" renders a full-screen overlay blocking all content.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

const STORAGE_KEY = 'tdc_trial_status_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function getStatusColor(tier) {
  switch (tier) {
    case 'trial':         return { bg: '#0D2137', border: '#1E5C8A', text: '#7FC8FF', accent: '#4CA8E0' };
    case 'trial_ending':  return { bg: '#2D1800', border: '#8A4A00', text: '#FFB84C', accent: '#FF8A00' };
    case 'grace_period':  return { bg: '#2D0800', border: '#8A2500', text: '#FF8C7A', accent: '#FF5A3A' };
    default:              return { bg: '#1A0028', border: '#6B21A8', text: '#D8B4FE', accent: '#A855F7' };
  }
}

export default function TrialStatusBanner() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    // Check cache first
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        setStatus(cached.data);
        return;
      }
    } catch {}

    try {
      const res = await fetch(`${API_URL}/api/auth/account-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, ts: Date.now() }));
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchStatus();
    // Refresh every 5 min
    const id = setInterval(fetchStatus, CACHE_TTL_MS);
    return () => clearInterval(id);
  }, [fetchStatus]);

  // Don't show for non-trial users
  if (!status) return null;
  const { tier, status_label, days_remaining, is_paused } = status;
  if (!tier || tier === 'active') return null;

  // ── Paused: Full-screen blocking overlay ────────────────────────────────
  if (is_paused || tier === 'paused') {
    return (
      <div
        data-testid="account-paused-overlay"
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'linear-gradient(160deg, #0A0015 0%, #1A0030 50%, #0D0020 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '24px',
        }}
      >
        <div style={{
          maxWidth: 400, width: '100%', textAlign: 'center',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: 24, padding: '40px 28px',
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8, fontFamily: 'inherit' }}>
            Account Paused
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 24 }}>
            Your free trial period has ended. Your pet's soul profile, health vault, and
            all memories are <strong style={{ color: '#A855F7' }}>safe and preserved</strong>.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              data-testid="reactivate-btn"
              onClick={() => navigate('/upgrade')}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #A855F7, #EC4899)',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reactivate Account →
            </button>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              Need help? Contact us at support@thedoggycompany.com
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Dismissible banner for trial / trial_ending / grace_period ──────────
  if (dismissed) return null;

  const colors = getStatusColor(tier);
  const icon = tier === 'grace_period' ? '⚠️' : tier === 'trial_ending' ? '⏳' : '✦';

  return (
    <div
      data-testid={`trial-banner-${tier}`}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000,
        background: colors.bg, borderBottom: `1px solid ${colors.border}`,
        padding: '8px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
        <span style={{
          fontSize: 12, color: colors.text, fontWeight: 600, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'inherit',
        }}>
          {status_label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          data-testid="trial-upgrade-btn"
          onClick={() => navigate('/upgrade')}
          style={{
            padding: '5px 14px', borderRadius: 999, border: 'none',
            background: colors.accent, color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          Upgrade
        </button>
        {tier !== 'grace_period' && (
          <button
            data-testid="trial-banner-dismiss"
            onClick={() => setDismissed(true)}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: 16, cursor: 'pointer', padding: '2px 4px', lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
