/**
 * LoginPage.jsx — /login and /register
 * The Doggy Company
 *
 * Design: Deep midnight luxury.
 * Cormorant Garamond headlines. DM Sans body.
 * Amber gold accents.
 * Mystique dedication at the bottom.
 *
 * API:
 *   POST /api/auth/login    { email, password } → { access_token, user }
 *   POST /api/auth/register { email, password, name }
 *   Google OAuth via Emergent
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../utils/api";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const C = {
  night:  "#0A0A0F",
  deep:   "#0F0A1E",
  mid:    "#1A1040",
  amber:  "#C9973A",
  amberL: "#E8B84B",
  ivory:  "#F5F0E8",
  ivoryD: "#D4C9B0",
  muted:  "rgba(245,240,232,0.55)",
  border: "rgba(201,151,58,0.2)",
  purple: "#9B59B6",
  pink:   "#E91E8C",
};

const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const [isLogin,  setIsLogin]  = useState(true);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const redirectTo = location.state?.from || "/pet-home";

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin
        ? `${API_URL}/api/auth/login`
        : `${API_URL}/api/auth/membership/onboard`;

      const body = isLogin
        ? { email, password }
        : { email, password, name };

      const res = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || (isLogin
          ? "Invalid email or password."
          : "Could not create account. Please try again."));
        setLoading(false);
        return;
      }

      const data = await res.json();
      const token = data.access_token || data.token;
      const user  = data.user || data;

      localStorage.setItem("tdb_auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (login) await login(token, user);

      navigate(isLogin ? redirectTo : "/join");
    } catch {
      setError("Something went wrong. Please check your connection.");
    }
    setLoading(false);
  };

  const inputStyle = (filled) => ({
    width:        "100%",
    padding:      "14px 16px",
    borderRadius: 12,
    fontSize:     15,
    border:       `1.5px solid ${filled ? C.amber : "rgba(245,240,232,0.15)"}`,
    background:   "rgba(255,255,255,0.05)",
    color:        C.ivory,
    outline:      "none",
    boxSizing:    "border-box",
    fontFamily:   "DM Sans, sans-serif",
    transition:   "border-color 0.2s",
  });

  return (
    <div style={{
      minHeight:       "100vh",
      background:      `radial-gradient(ellipse at 30% 30%, #1A1040 0%, ${C.night} 65%)`,
      display:         "flex",
      flexDirection:   "column",
      alignItems:      "center",
      justifyContent:  "center",
      padding:         "24px 16px",
      fontFamily:      "DM Sans, sans-serif",
    }}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: rgba(245,240,232,0.3); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #1A1040 inset !important;
          -webkit-text-fill-color: #F5F0E8 !important;
        }
      `}</style>

      {/* Logo */}
      <div onClick={() => navigate("/")} style={{
        marginBottom: 32, cursor: "pointer", textAlign: "center",
      }}>
        <div style={{
          fontFamily:  "Cormorant Garamond, Georgia, serif",
          fontSize:    26, fontWeight: 600, color: C.ivory,
          letterSpacing: "0.02em",
        }}>
          The Doggy Company
          <span style={{ color: C.amber }}>®</span>
        </div>
        <div style={{
          fontSize: 11, color: C.muted,
          letterSpacing: "0.1em", marginTop: 4,
        }}>
          MIRA · PET LIFE OPERATING SYSTEM
        </div>
      </div>

      {/* Card */}
      <div style={{
        background:   "rgba(15,10,30,0.92)",
        border:       `1px solid ${C.border}`,
        borderRadius: 24,
        padding:      "36px 32px",
        width:        "100%",
        maxWidth:     420,
        backdropFilter: "blur(20px)",
      }}>

        {/* Mira orb */}
        <div style={{
          width:        48, height: 48, borderRadius: "50%",
          background:   MIRA_ORB,
          display:      "flex", alignItems: "center",
          justifyContent: "center",
          fontSize:     22, color: "#fff",
          margin:       "0 auto 20px",
          boxShadow:    "0 0 32px rgba(155,89,182,0.3)",
        }}>
          ✦
        </div>

        {/* Headline */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{
            fontFamily:  "Cormorant Garamond, Georgia, serif",
            fontSize:    "clamp(1.5rem,4vw,2rem)",
            fontWeight:  400, color: C.ivory,
            lineHeight:  1.2, marginBottom: 8,
          }}>
            {isLogin ? "Welcome back" : "Meet Mira"}
          </h1>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            {isLogin
              ? "Mira has been keeping an eye on your pack."
              : "Mira is ready to get to know your dog."}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background:   "rgba(220,38,38,0.12)",
            border:       "1px solid rgba(220,38,38,0.3)",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 13, color: "#FCA5A5",
            marginBottom: 20, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Name — register only */}
          {!isLogin && (
            <div>
              <label style={{
                fontSize: 11, fontWeight: 600, color: C.amber,
                letterSpacing: "0.08em", display: "block", marginBottom: 6,
              }}>
                YOUR NAME
              </label>
              <input
                type="text"
                placeholder="What should Mira call you?"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle(name)}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{
              fontSize: 11, fontWeight: 600, color: C.amber,
              letterSpacing: "0.08em", display: "block", marginBottom: 6,
            }}>
              EMAIL
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={inputStyle(email)}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              fontSize: 11, fontWeight: 600, color: C.amber,
              letterSpacing: "0.08em", display: "block", marginBottom: 6,
            }}>
              PASSWORD
            </label>
            <input
              type="password"
              placeholder={isLogin ? "Your password" : "Choose a password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={inputStyle(password)}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            style={{
              width:        "100%",
              padding:      "15px",
              borderRadius: 12,
              border:       "none",
              background:   loading || !email || !password
                ? "rgba(201,151,58,0.2)"
                : `linear-gradient(135deg,${C.amber},${C.amberL})`,
              color:        loading || !email || !password
                ? "rgba(201,151,58,0.5)"
                : C.night,
              fontSize:     15, fontWeight: 700,
              cursor:       loading || !email || !password ? "not-allowed" : "pointer",
              fontFamily:   "DM Sans, sans-serif",
              letterSpacing: "0.02em",
              marginTop:    4,
              transition:   "all 0.2s",
            }}
          >
            {loading
              ? "Please wait…"
              : isLogin
              ? "Sign in →"
              : "Create account →"}
          </button>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, margin: "4px 0",
          }}>
            <div style={{ flex: 1, height: 1, background: "rgba(245,240,232,0.08)" }}/>
            <span style={{ fontSize: 11, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(245,240,232,0.08)" }}/>
          </div>

          {/* Google */}
          <button
            onClick={() => window.location.href = `${API_URL}/auth/google`}
            style={{
              width:        "100%",
              padding:      "13px",
              borderRadius: 12,
              border:       "1.5px solid rgba(245,240,232,0.12)",
              background:   "rgba(255,255,255,0.04)",
              color:        C.ivory,
              fontSize:     14,
              cursor:       "pointer",
              fontFamily:   "DM Sans, sans-serif",
              display:      "flex", alignItems: "center",
              justifyContent: "center", gap: 10,
              transition:   "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Continue with Google
          </button>

        </div>

        {/* Toggle login/register */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <span style={{ fontSize: 13, color: C.muted }}>
            {isLogin ? "New to The Doggy Company? " : "Already have an account? "}
          </span>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={{
              background: "none", border: "none",
              color: C.amber, fontSize: 13,
              fontWeight: 600, cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              textDecoration: "underline",
            }}
          >
            {isLogin ? "Create account" : "Sign in"}
          </button>
        </div>

      </div>

      {/* Mystique dedication */}
      <div style={{
        textAlign: "center", marginTop: 28,
        maxWidth: 380,
      }}>
        <div style={{ fontSize: 20, marginBottom: 8 }}>🌷</div>
        <p style={{
          fontFamily:  "Cormorant Garamond, Georgia, serif",
          fontSize:    14, fontStyle: "italic",
          color:       "rgba(245,240,232,0.3)",
          lineHeight:  1.7,
        }}>
          "In loving memory of Kouros & Mystique —<br/>
          They taught us that to know a pet is to know a soul."
        </p>
      </div>

    </div>
  );
}
