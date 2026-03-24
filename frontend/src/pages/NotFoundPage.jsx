import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: 'radial-gradient(circle at top, rgba(120,35,160,0.35), transparent 40%), linear-gradient(180deg, #0B0A12 0%, #191133 100%)',
      }}
      data-testid="not-found-page"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 28,
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ fontSize: 54, marginBottom: 12 }}>🐾</div>
        <div style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C084FC', fontWeight: 800, marginBottom: 10 }}>
          Page not found
        </div>
        <h1 style={{ color: '#F8FAFC', fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.1, margin: '0 0 10px', fontFamily: 'Georgia, serif' }}>
          Mira lost this page,
          <br />
          but not the trail.
        </h1>
        <p style={{ color: 'rgba(248,250,252,0.72)', fontSize: 15, lineHeight: 1.7, margin: '0 0 24px' }}>
          The link you opened doesn&apos;t exist anymore, or it wandered off.
          Let&apos;s get you back to your dog&apos;s world.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/"
            data-testid="not-found-home-link"
            style={{
              padding: '12px 18px',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #C026D3, #EC4899)',
              color: '#fff',
            }}
          >
            Go Home
          </Link>
          <Link
            to="/join"
            data-testid="not-found-join-link"
            style={{
              padding: '12px 18px',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 700,
              background: 'rgba(255,255,255,0.06)',
              color: '#F8FAFC',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            Start Your Pet Soul Journey
          </Link>
        </div>
      </div>
    </div>
  );
}