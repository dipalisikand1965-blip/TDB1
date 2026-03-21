/**
 * MembershipPage.jsx — /membership
 * The Doggy Company
 *
 * One membership. One price. Everything included.
 * Skip payment for first 100 invited members.
 * Razorpay ready — flip SKIP_PAYMENT = false when going live.
 *
 * ₹2,999/year · ₹250/month equivalent
 * Anything · Anytime · Anywhere
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

// ── CHANGE THIS ONE LINE WHEN GOING LIVE ──────────────────────────────
const SKIP_PAYMENT = true;   // ← set to false when launching to public
const PRICE_YEAR   = 2999;   // ← annual price (excl GST)
const GST_RATE     = 0.18;
const PRICE_GST    = Math.round(PRICE_YEAR * (1 + GST_RATE));
const PRICE_MONTH  = Math.round(PRICE_YEAR / 12);
// ──────────────────────────────────────────────────────────────────────

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
  sage:   "#40916C",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

const EVERYTHING = [
  { icon:"✦", label:"Mira AI",             desc:"Unlimited conversations. She knows your dog completely." },
  { icon:"🤝", label:"Concierge® access",   desc:"Real humans. 24/7. Anything, Anytime, Anywhere." },
  { icon:"🌿", label:"All 13 life pillars", desc:"Care, Dine, Go, Play, Learn, Celebrate and more." },
  { icon:"🧠", label:"Soul Profile™",       desc:"A living profile that grows smarter every visit." },
  { icon:"🏥", label:"Health Vault",        desc:"Secure medical records, vaccine reminders, vet history." },
  { icon:"🎂", label:"Birthday alerts",     desc:"Mira reminds you. The Doggy Bakery bakes for you." },
  { icon:"🐾", label:"Paw Points",          desc:"Earn on every interaction. Bronze → Silver → Gold → Platinum." },
  { icon:"📱", label:"WhatsApp updates",    desc:"Mira keeps you informed. Concierge® responds there." },
];

export default function MembershipPage() {
  const navigate  = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (SKIP_PAYMENT) {
      navigate("/join");
    } else {
      navigate("/join"); // Razorpay flow — Aditya wires when ready
    }
  };

  return (
    <div style={{
      background: C.night, color: C.ivory,
      fontFamily: "DM Sans, sans-serif",
      minHeight: "100vh",
    }}>
      <style>{`${FONTS} *{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* Standard Navbar */}
      <Navbar />

      {/* Hero */}
      <section style={{
        padding:"80px clamp(20px,6vw,80px) 60px",
        textAlign:"center",
        background:`radial-gradient(ellipse at 50% 0%,#1A1040 0%,${C.night} 70%)`,
      }}>
        <div style={{
          fontSize:11,fontWeight:600,color:C.amber,
          letterSpacing:"0.14em",marginBottom:20,
        }}>
          PET PASS™ · ONE MEMBERSHIP · EVERYTHING
        </div>
        <h1 style={{
          fontFamily:"Cormorant Garamond,Georgia,serif",
          fontSize:"clamp(2.5rem,7vw,5rem)",
          fontWeight:300,color:C.ivory,lineHeight:1.15,
          marginBottom:16,
        }}>
          Anything. Anytime.<br/>
          <em style={{color:C.amber}}>Anywhere.</em>
        </h1>
        <p style={{
          fontSize:16,color:C.muted,lineHeight:1.8,
          maxWidth:500,margin:"0 auto 48px",fontWeight:300,
        }}>
          For your dog. One membership. Everything included.
          No tiers. No unlocking. No limits.
          Mira knows your dog. Concierge® handles everything.
        </p>

        {/* Pricing card */}
        <div style={{
          display:"inline-block",
          background:"rgba(201,151,58,0.08)",
          border:`2px solid ${C.amber}`,
          borderRadius:24,padding:"40px 48px",
          marginBottom:32,
        }}>
          <div style={{
            fontFamily:"Cormorant Garamond,Georgia,serif",
            fontSize:"clamp(3rem,8vw,6rem)",
            fontWeight:300,color:C.amber,lineHeight:1,
          }}>
            ₹{PRICE_YEAR.toLocaleString()}
          </div>
          <div style={{fontSize:14,color:C.muted,marginTop:8}}>
            per year · ₹{PRICE_MONTH}/month equivalent
          </div>
          <div style={{fontSize:12,color:"rgba(245,240,232,0.3)",marginTop:4}}>
            ₹{PRICE_GST.toLocaleString()} incl. 18% GST
          </div>
          <button onClick={handleJoin} disabled={loading} style={{
            marginTop:28,padding:"15px 48px",
            borderRadius:999,border:"none",
            background:`linear-gradient(135deg,${C.amber},${C.amberL})`,
            color:C.night,fontSize:16,fontWeight:600,
            cursor:"pointer",fontFamily:"DM Sans,sans-serif",
            width:"100%",letterSpacing:"0.02em",
          }}>
            {SKIP_PAYMENT ? "Join the founding circle →" : "Join now →"}
          </button>
          {SKIP_PAYMENT && (
            <div style={{
              marginTop:12,fontSize:12,color:C.muted,fontStyle:"italic",
            }}>
              Free for founding members · Membership activates at launch
            </div>
          )}
        </div>
      </section>

      {/* Everything included */}
      <section style={{
        padding:"80px clamp(20px,6vw,80px)",
        borderTop:`1px solid ${C.border}`,
        background:C.deep,
      }}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{
              fontSize:11,fontWeight:600,color:C.amber,
              letterSpacing:"0.14em",marginBottom:16,
            }}>
              WHAT'S INCLUDED
            </div>
            <h2 style={{
              fontFamily:"Cormorant Garamond,Georgia,serif",
              fontSize:"clamp(1.8rem,4vw,2.8rem)",
              fontWeight:400,color:C.ivory,
            }}>
              Everything. No asterisks.
            </h2>
          </div>
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
            gap:16,
          }}>
            {EVERYTHING.map((item,i) => (
              <div key={i} style={{
                background:"rgba(255,255,255,0.03)",
                border:`1px solid rgba(255,255,255,0.07)`,
                borderRadius:16,padding:"24px 20px",
                display:"flex",gap:16,alignItems:"flex-start",
                transition:"border-color 0.2s",
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.border}
                onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"}
              >
                <div style={{
                  width:40,height:40,borderRadius:10,
                  background:`${C.amber}15`,
                  display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:18,flexShrink:0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{
                    fontSize:15,fontWeight:600,color:C.ivory,marginBottom:4,
                  }}>
                    {item.label}
                  </div>
                  <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The concierge promise */}
      <section style={{
        padding:"80px clamp(20px,6vw,80px)",
        maxWidth:700,margin:"0 auto",textAlign:"center",
      }}>
        <div style={{
          width:64,height:64,borderRadius:"50%",
          background:MIRA_ORB,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:28,color:"#fff",margin:"0 auto 24px",
          boxShadow:"0 0 60px rgba(155,89,182,0.25)",
        }}>✦</div>
        <h2 style={{
          fontFamily:"Cormorant Garamond,Georgia,serif",
          fontSize:"clamp(1.8rem,4vw,2.8rem)",
          fontWeight:400,color:C.ivory,marginBottom:20,lineHeight:1.3,
        }}>
          Mira is the Brain.<br/>
          <em style={{color:C.amber}}>Concierge® is the Hands.</em>
        </h2>
        <p style={{
          fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,
          marginBottom:16,
        }}>
          Behind Mira is a team of over 1,000 trained concierge professionals.
          When you need something done — a booking, an arrangement, a recommendation
          acted upon — real human hands make it happen.
        </p>
        <p style={{
          fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,
        }}>
          This is not a chatbot service. This is Les Concierges® —
          30 years of luxury service — extended to your dog.
        </p>
      </section>

      {/* Final CTA */}
      <section style={{
        background:`linear-gradient(135deg,${C.deep},#0A1A12)`,
        borderTop:`1px solid ${C.border}`,
        padding:"80px clamp(20px,6vw,80px)",
        textAlign:"center",
      }}>
        <h2 style={{
          fontFamily:"Cormorant Garamond,Georgia,serif",
          fontSize:"clamp(2rem,5vw,3.5rem)",
          fontWeight:300,color:C.ivory,marginBottom:16,
        }}>
          Your dog deserves this.
        </h2>
        <p style={{
          fontSize:15,color:C.muted,marginBottom:36,lineHeight:1.7,
          fontWeight:300,
        }}>
          ₹{PRICE_MONTH}/month. Less than one vet visit.
          For Mira knowing your dog's soul and Concierge® handling everything else.
        </p>
        <button onClick={handleJoin} style={{
          padding:"16px 48px",borderRadius:999,border:"none",
          background:`linear-gradient(135deg,${C.amber},${C.amberL})`,
          color:C.night,fontSize:16,fontWeight:600,
          cursor:"pointer",fontFamily:"DM Sans,sans-serif",
          letterSpacing:"0.02em",
          boxShadow:`0 8px 40px ${C.amber}40`,
        }}>
          {SKIP_PAYMENT ? "Join the founding circle →" : "Join now — ₹" + PRICE_YEAR.toLocaleString() + "/year"}
        </button>
      </section>

    </div>
  );
}
