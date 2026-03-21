import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── LoginPage.jsx ────────────────────────────────────────────────────────────
// Path: /app/frontend/src/pages/LoginPage.jsx (or Login.jsx)
// Replaces the existing Login.jsx
// Preserves: POST /api/auth/login + POST /api/auth/register + Google OAuth
// Design: deep midnight + amber + Playfair Display — matches new design language

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const next = new URLSearchParams(location.search).get('next') || '/pet-home';
      navigate(next, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email, password }
        : { email, password, name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || (isLogin ? 'Login failed' : 'Registration failed'));
      }

      // Use auth context login
      await login(data.access_token, data.user || { email });

      const next = new URLSearchParams(location.search).get('next') || '/pet-home';
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    // Emergent-managed Google OAuth — preserve existing flow
    const next = new URLSearchParams(location.search).get('next') || '/pet-home';
    window.location.href = `/api/auth/google?next=${encodeURIComponent(next)}`;
  };

  const c = {
    midnight: '#0D0A1A', deep: '#130F24', surface: '#1C1630', surface2: '#251E40',
    amber: '#E8A045', amberSoft: '#F5C57A', amberGlow: 'rgba(232,160,69,0.1)',
    ivory: '#F4EFE6', ivoryDim: 'rgba(244,239,230,0.6)', ivoryFaint: 'rgba(244,239,230,0.1)',
    pink: '#C96D9E', border: 'rgba(244,239,230,0.08)', borderWarm: 'rgba(232,160,69,0.2)',
  };

  const serif = { fontFamily: "'Playfair Display', Georgia, serif" };

  return (
    <div style={{
      minHeight: '100vh',
      background: c.midnight,
      color: c.ivory,
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      fontWeight: 300,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      {/* Background glows */}
      <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(201,109,158,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(232,160,69,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Memorial header — Kouros & Mystique */}
      <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        {/* Dog portraits */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0px', marginBottom: '20px' }}>
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(232,160,69,0.3), rgba(139,92,246,0.2))',
            border: '3px solid rgba(232,160,69,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', position: 'relative', zIndex: 2,
            boxShadow: '0 0 24px rgba(232,160,69,0.15)',
          }}>🐕</div>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #C96D9E, #E8A045)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', position: 'relative', zIndex: 3, margin: '0 -8px',
            boxShadow: '0 2px 12px rgba(201,109,158,0.4)',
          }}>♡</div>
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(201,109,158,0.3), rgba(139,92,246,0.2))',
            border: '3px solid rgba(201,109,158,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', position: 'relative', zIndex: 2,
            boxShadow: '0 0 24px rgba(201,109,158,0.15)',
          }}>🐶</div>
        </div>

        <p style={{ fontSize: '13px', color: 'rgba(244,239,230,0.5)', letterSpacing: '0.06em', marginBottom: '6px' }}>
          In loving memory of
        </p>
        <h2 style={{ ...serif, fontSize: '22px', fontWeight: 600, marginBottom: '10px' }}>
          <span style={{ color: c.amberSoft }}>Kouros</span>
          <span style={{ color: c.ivoryDim }}> & </span>
          <span style={{ color: '#D4A8FF' }}>Mystique</span>
        </h2>
        <p style={{ ...serif, fontSize: '14px', fontStyle: 'italic', color: c.ivoryDim }}>
          "They taught us to know a pet is to know a soul"
        </p>
      </div>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #C96D9E, #9B3F7A)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🐾</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: c.ivory, lineHeight: 1 }}>thedoggycompany</div>
          <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: c.amber, marginTop: '2px' }}>Pet Concierge®</div>
        </div>
      </div>

      {/* Login / Register card */}
      <div style={{
        width: '100%', maxWidth: '440px',
        background: `linear-gradient(135deg, rgba(28,22,48,0.95) 0%, rgba(37,30,64,0.95) 100%)`,
        border: `1px solid ${c.borderWarm}`,
        borderRadius: '24px',
        padding: '40px 36px',
        position: 'relative', zIndex: 1,
        boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
      }}>
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to right, #C96D9E, #E8A045)', borderRadius: '24px 24px 0 0' }} />

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ ...serif, fontSize: '28px', fontWeight: 700, color: c.ivory, marginBottom: '6px' }}>
            {isLogin ? 'Welcome Back' : 'Join The Pack'}
          </h1>
          <p style={{ fontSize: '14px', color: c.ivoryDim }}>
            {isLogin ? 'Sign in to access your pet dashboard' : 'Create your account to get started'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#FCA5A5', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Name (register only) */}
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.5)', marginBottom: '7px' }}>
                Your Name
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(244,239,230,0.3)', fontSize: '15px' }}>👤</span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={{ width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.border}`, borderRadius: '12px', color: c.ivory, fontSize: '14px', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = c.borderWarm}
                  onBlur={e => e.target.style.borderColor = c.border}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.5)', marginBottom: '7px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(244,239,230,0.3)', fontSize: '15px' }}>✉</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ width: '100%', padding: '12px 14px 12px 40px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.border}`, borderRadius: '12px', color: c.ivory, fontSize: '14px', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = c.borderWarm}
                onBlur={e => e.target.style.borderColor = c.border}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: isLogin ? '8px' : '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.5)' }}>
                Password
              </label>
              {isLogin && (
                <button type="button" onClick={() => navigate('/forgot-password')}
                  style={{ fontSize: '12px', color: c.pink, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
                  Forgot password?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(244,239,230,0.3)', fontSize: '15px' }}>🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                style={{ width: '100%', padding: '12px 44px 12px 40px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${c.border}`, borderRadius: '12px', color: c.ivory, fontSize: '14px', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = c.borderWarm}
                onBlur={e => e.target.style.borderColor = c.border}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(244,239,230,0.35)', fontSize: '14px' }}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(201,109,158,0.5)' : 'linear-gradient(135deg, #C96D9E, #9B3F7A)',
              color: 'white', border: 'none', borderRadius: '50px',
              fontSize: '15px', fontWeight: 500, cursor: loading ? 'default' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s', marginTop: '8px',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,109,158,0.4)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {loading ? '...' : isLogin ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: c.border }} />
          <span style={{ fontSize: '12px', color: 'rgba(244,239,230,0.3)', letterSpacing: '0.06em' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: c.border }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleAuth}
          style={{
            width: '100%', padding: '13px',
            background: 'rgba(255,255,255,0.04)',
            color: c.ivoryDim, border: `1px solid ${c.border}`,
            borderRadius: '50px', fontSize: '14px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = c.ivory; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = c.ivoryDim; }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle login/register */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'rgba(244,239,230,0.4)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: c.amber, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: 500, padding: 0 }}
          >
            {isLogin ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>

      {/* Footer */}
      <p style={{ marginTop: '32px', fontSize: '12px', color: 'rgba(244,239,230,0.2)', textAlign: 'center', letterSpacing: '0.04em', position: 'relative', zIndex: 1 }}>
        © 2025 The Doggy Company® · Built in memory of Mystique
      </p>
    </div>
  );
}
