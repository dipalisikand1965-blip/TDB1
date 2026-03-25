/**
 * MobileMenu.jsx — Left slide-in menu for mobile
 * The Doggy Company
 *
 * Features:
 * - Glass Mira orb in header + Ask Mira button
 * - My Dogs section with soul score + active dot
 * - 13 pillar pills in 4-column grid
 * - Nav links: Pet Home, My Requests (unread badge), Pet Soul, Paw Points, Cart
 * - Bell notifications separate from My Requests
 * - Sign Out
 *
 * Usage:
 *   <MobileMenu
 *     isOpen={menuOpen}
 *     onClose={() => setMenuOpen(false)}
 *     currentPet={currentPet}
 *     pets={pets}
 *     onPetSwitch={(pet) => handlePetSwitch(pet)}
 *   />
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PILLARS = [
  { emoji: "🌿", label: "Care",      route: "/care"      },
  { emoji: "🍽️", label: "Dine",      route: "/dine"      },
  { emoji: "✈️",  label: "Go",        route: "/go"        },
  { emoji: "🎾", label: "Play",      route: "/play"      },
  { emoji: "🎓", label: "Learn",     route: "/learn"     },
  { emoji: "🎂", label: "Celebrate", route: "/celebrate" },
  { emoji: "🛍️", label: "Shop",      route: "/shop"      },
  { emoji: "📄", label: "Paperwork", route: "/paperwork" },
  { emoji: "🚨", label: "Emergency", route: "/emergency" },
  { emoji: "🐾", label: "Adopt",     route: "/adopt"     },
  { emoji: "🌷", label: "Farewell",  route: "/farewell"  },
  { emoji: "🤝", label: "Services",  route: "/services"  },
];

// Glass orb CSS — injected once
const GLASS_ORB_CSS = `
  .tdc-glass-orb {
    border-radius: 50%;
    background: radial-gradient(
      circle at 35% 35%,
      rgba(255,255,255,0.55) 0%,
      rgba(200,150,255,0.35) 35%,
      rgba(155,89,182,0.6) 65%,
      rgba(100,40,140,0.8) 100%
    );
    box-shadow:
      inset 0 -3px 8px rgba(0,0,0,0.25),
      inset 0 2px 4px rgba(255,255,255,0.6),
      0 4px 16px rgba(155,89,182,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.95);
    position: relative;
    flex-shrink: 0;
  }
  .tdc-glass-orb::after {
    content: '';
    position: absolute;
    top: 22%;
    left: 26%;
    width: 28%;
    height: 18%;
    background: rgba(255,255,255,0.7);
    border-radius: 50%;
    transform: rotate(-30deg);
  }
  .tdc-menu-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 6px;
    border-radius: 12px;
    border: 1px solid rgba(201,151,58,0.2);
    background: #FFFBF5;
    cursor: pointer;
    transition: all 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .tdc-menu-pill:active {
    background: #FEF3C7;
    border-color: #C9973A;
    transform: scale(0.96);
  }
  .tdc-nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 20px;
    font-size: 14px;
    font-weight: 500;
    color: #1A1A2E;
    cursor: pointer;
    border-bottom: 0.5px solid rgba(0,0,0,0.06);
    transition: background 0.1s;
    -webkit-tap-highlight-color: transparent;
  }
  .tdc-nav-link:active { background: #FFFBF5; }
  .tdc-menu-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 99999;
    animation: tdc-fade-in 0.2s ease;
  }
  .tdc-menu-panel {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(85vw, 320px);
    background: #fff;
    z-index: 100000;
    overflow-y: auto;
    animation: tdc-slide-in 0.25s cubic-bezier(0.16,1,0.3,1);
    -webkit-overflow-scrolling: touch;
  }
  .tdc-menu-panel::-webkit-scrollbar { display: none; }
  @keyframes tdc-fade-in  { from { opacity:0; } to { opacity:1; } }
  @keyframes tdc-slide-in { from { transform:translateX(-100%); } to { transform:translateX(0); } }
`;

// ── Collapsible My Dogs section ───────────────────────────────────────────
function PetAvatar({ pet, active, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: active ? "linear-gradient(135deg,#9B59B6,#E91E8C)" : "rgba(155,89,182,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45, border: active ? "2px solid #9B59B6" : "1.5px solid rgba(155,89,182,0.2)",
      overflow: "hidden",
    }}>
      {pet.photo_url
        ? <img src={pet.photo_url} alt={pet.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        : "🐾"}
    </div>
  );
}

function MobileMenuDogs({ pets = [], currentPet, onPetSwitch, onAddDog }) {
  const [expanded, setExpanded] = useState(false);

  const activePet = pets.find(p => p.id === currentPet?.id) || pets[0];
  const otherPets = pets.filter(p => p.id !== activePet?.id);

  return (
    <div style={{ background: "#FAFAFA", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      <div style={{ padding: "12px 20px 8px", fontSize: 10, fontWeight: 700, color: "#9B59B6", letterSpacing: "0.1em" }}>
        MY DOGS
      </div>

      {/* Active pet — always visible */}
      {activePet && (
        <div onClick={() => onPetSwitch?.(activePet)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", cursor:"pointer" }}>
          <div style={{ position:"relative" }}>
            <PetAvatar pet={activePet} active={true} size={38}/>
            <div style={{ position:"absolute", bottom:1, right:1, width:9, height:9, borderRadius:"50%", background:"#16A34A", border:"1.5px solid #fff" }}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#1A1A2E" }}>{activePet.name}</div>
            <div style={{ fontSize:11, color:"#64748B" }}>{activePet.breed || "Mixed"} · Soul {Math.round(activePet.overall_score || 0)}%</div>
          </div>
          {/* Chevron + stacked avatars when collapsed */}
          {!expanded && otherPets.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6 }} onClick={(e)=>{ e.stopPropagation(); setExpanded(true); }}>
              <div style={{ display:"flex" }}>
                {otherPets.slice(0,3).map((p,i) => (
                  <div key={p.id} style={{ marginLeft: i > 0 ? -10 : 0, zIndex: 3-i }}>
                    <PetAvatar pet={p} active={false} size={26}/>
                  </div>
                ))}
                {otherPets.length > 3 && <div style={{ marginLeft:-10, width:26, height:26, borderRadius:"50%", background:"rgba(155,89,182,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#9B59B6" }}>+{otherPets.length-3}</div>}
              </div>
              <span style={{ fontSize:14, color:"#9B59B6", transition:"transform 0.2s" }}>›</span>
            </div>
          )}
          {expanded && <span style={{ fontSize:14, color:"#9B59B6", transform:"rotate(90deg)", display:"inline-block", transition:"transform 0.2s" }}>›</span>}
        </div>
      )}

      {/* Other pets — only when expanded */}
      {expanded && otherPets.map(p => (
        <div key={p.id} onClick={() => onPetSwitch?.(p)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 20px 9px 28px", cursor:"pointer", background:"#F5F3FF" }}>
          <PetAvatar pet={p} active={false} size={32}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"#1A1A2E" }}>{p.name}</div>
            <div style={{ fontSize:10, color:"#64748B" }}>{p.breed || "Mixed"} · {Math.round(p.overall_score || 0)}%</div>
          </div>
        </div>
      ))}

      {/* Add dog */}
      <div onClick={onAddDog} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", cursor:"pointer" }}>
        <div style={{ width:34, height:34, borderRadius:"50%", border:"1.5px dashed rgba(201,151,58,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#C9973A", flexShrink:0 }}>+</div>
        <div style={{ fontSize:13, color:"#C9973A", fontWeight:600 }}>Add another dog</div>
      </div>
      <div style={{ height:6 }}/>
    </div>
  );
}

export default function MobileMenu({
  isOpen,
  onClose,
  currentPet,
  pets = [],
  onPetSwitch,
  unreadRequests  = 0,
  unreadBell      = 0,
  pawPoints       = 0,
  userName        = null,
}) {
  const navigate  = useNavigate();
  const { logout } = useAuth();
  const isLoggedIn = !!userName;

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const go = (route) => { onClose(); navigate(route); };

  const handleLogout = () => {
    onClose();
    logout?.();
    navigate("/");
  };

  const firstName = userName?.split(" ")[0] || "Welcome";

  return createPortal(
    <>
      <style>{GLASS_ORB_CSS}</style>

      {/* Overlay */}
      <div className="tdc-menu-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="tdc-menu-panel">

        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg,#0F0A1E,#1A1040)",
          padding: "20px 20px 16px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: "rgba(201,151,58,0.8)",
              letterSpacing: "0.1em", marginBottom: 2,
            }}>
              THE DOGGY COMPANY
            </div>
            <div style={{
              fontSize: 17, fontWeight: 600,
              color: "#F5F0E8",
              fontFamily: "Georgia, serif",
            }}>
              {isLoggedIn ? `Hi, ${firstName} 🌷` : "Hello, dog lover 🐾"}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            data-testid="mobile-menu-close-btn"
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#F5F0E8", fontSize: 20, fontWeight: 300,
              WebkitTapHighlightColor: "transparent",
            }}
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>

        {/* ── My Dogs (collapsible) ── */}
        <MobileMenuDogs
          pets={pets}
          currentPet={currentPet}
          onPetSwitch={(p) => { onPetSwitch?.(p); onClose(); }}
          onAddDog={() => go("/join")}
        />

        {/* ── 12 Pillars ── */}
        <div style={{ padding: "16px 16px 8px" }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#64748B",
            letterSpacing: "0.1em", marginBottom: 12, paddingLeft: 4,
          }}>
            12 LIFE PILLARS
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
          }}>
            {PILLARS.map(p => (
              <div
                key={p.route}
                className="tdc-menu-pill"
                onClick={() => go(p.route)}
              >
                <span style={{ fontSize: 20 }}>{p.emoji}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: "#92400E", textAlign: "center", lineHeight: 1.2,
                }}>
                  {p.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ask Mira ── */}
        <div style={{ padding: "12px 16px" }}>
          <button
            onClick={() => go("/mira-os")}
            style={{
              width: "100%", padding: "13px",
              borderRadius: 14, border: "none",
              background: "linear-gradient(135deg,#9B59B6,#E91E8C)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10,
              fontFamily: "inherit",
            }}
          >
            <div
              className="tdc-glass-orb"
              style={{
                width: 24, height: 24, fontSize: 11,
                boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.2),inset 0 1px 3px rgba(255,255,255,0.5),0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              ✦
            </div>
            Ask Mira anything
          </button>
        </div>

        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 0" }}/>

        {/* ── Nav links — only for logged-in users ── */}
        {isLoggedIn ? (
          <>
            <div className="tdc-nav-link" onClick={() => go("/pet-home")}>
              <div style={{ width:32, height:32, borderRadius:10, background:"#FEF3C7", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🏠</div>
              <span>Pet Home</span>
            </div>

            <div className="tdc-nav-link" onClick={() => go("/my-requests")}>
              <div style={{ width:32, height:32, borderRadius:10, background:"#F0FFF4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>📋</div>
              <span>My Requests</span>
              {unreadRequests > 0 && (
                <div style={{ marginLeft: "auto", background: "#E91E8C", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                  {unreadRequests > 9 ? "9+" : unreadRequests}
                </div>
              )}
            </div>

            <div className="tdc-nav-link" onClick={() => go("/pet-home")}>
              <div style={{ width:32, height:32, borderRadius:10, background:"#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🐾</div>
              <span>Pet Soul™</span>
            </div>

            <div className="tdc-nav-link" onClick={() => go("/paw-points")}>
              <div style={{ width:32, height:32, borderRadius:10, background:"#FFFBF5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🏆</div>
              <span>Paw Points</span>
              {pawPoints > 0 && <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#C9973A" }}>{pawPoints.toLocaleString()} pts</div>}
            </div>

            <div className="tdc-nav-link" onClick={() => go("/cart")}>
              <div style={{ width:32, height:32, borderRadius:10, background:"#F0FFF4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🛒</div>
              <span>My Cart</span>
            </div>

            <div className="tdc-nav-link" onClick={() => go("/notifications")}>
              <div style={{ width:32, height:32, borderRadius:10, background:"#FFFBF5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🔔</div>
              <span>Notifications</span>
              {unreadBell > 0 && <div style={{ marginLeft: "auto", background: "#C9973A", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{unreadBell > 9 ? "9+" : unreadBell}</div>}
            </div>

            <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "4px 0" }}/>

            <div className="tdc-nav-link" onClick={() => go("/account")}>
              <div style={{ width:32, height:32, borderRadius:10, background:"#F8FAFC", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>👤</div>
              <span style={{ color: "#64748B" }}>Account Settings</span>
            </div>

            <div className="tdc-nav-link" onClick={handleLogout}>
              <div style={{ width:32, height:32, borderRadius:10, background:"#FFF5F5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>🚪</div>
              <span style={{ color: "#DC2626" }}>Sign Out</span>
            </div>
          </>
        ) : (
          /* Not logged in — show sign-in / join CTA */
          <div style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>Sign in to access your pet profile, requests, and personalised picks.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => go("/login")}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #0F172A", background: "#0F172A", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                data-testid="menu-signin-btn">Sign In</button>
              <button onClick={() => go("/membership")}
                style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#9333EA,#EC4899)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                data-testid="menu-join-btn">Join Now</button>
            </div>
          </div>
        )}

        {/* Mystique dedication */}
        <div style={{
          padding: "20px 20px 32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>🌷</div>
          <div style={{
            fontSize: 11,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            color: "rgba(0,0,0,0.25)",
            lineHeight: 1.6,
          }}>
            In memory of Mystique & Kouros
          </div>
        </div>

      </div>
    </>,
    document.body
  );
}
