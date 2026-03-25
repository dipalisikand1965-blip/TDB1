/**
 * PetSoulPublicPage.jsx — /pet-soul (public version)
 * The Doggy Company
 *
 * Shows what Pet Soul™ is to someone who hasn't joined yet.
 * Uses Mojo as the demo profile.
 * CTA: "Let Mira meet your dog →"
 *
 * NOTE: The authenticated /pet-soul/:petId shows the real profile.
 * This is the public marketing version.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const C = {
  night:"#0A0A0F",deep:"#0F0A1E",mid:"#1A1040",
  amber:"#C9973A",amberL:"#E8B84B",
  ivory:"#F5F0E8",ivoryD:"#D4C9B0",
  muted:"rgba(245,240,232,0.55)",
  border:"rgba(201,151,58,0.2)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

const CHAPTERS = [
  { label:"Identity",  score:92, colour:"#9B59B6" },
  { label:"Health",    score:85, colour:"#DC2626" },
  { label:"Behaviour", score:88, colour:"#E76F51" },
  { label:"Nutrition", score:95, colour:"#C9973A" },
  { label:"Social",    score:70, colour:"#1D9E75" },
  { label:"Learning",  score:75, colour:"#7C3AED" },
  { label:"Travel",    score:60, colour:"#0F6E56" },
];

const MILESTONES = [
  { icon:"🎂", title:"Birthday celebrated",  sub:"Peanut butter cake from The Doggy Bakery · Oct 2025" },
  { icon:"🍽️", title:"First dine out",       sub:"Cafe Pawsome, Bandra · Sep 2025" },
  { icon:"🏨", title:"First stay",            sub:"Pet-friendly resort, Goa · Aug 2025" },
  { icon:"✈️", title:"First travel",          sub:"Road trip to Coorg · Jul 2025" },
  { icon:"🎓", title:"Training milestone",    sub:"Completed basic obedience · Jun 2025" },
];

export default function PetSoulPublicPage() {
  const navigate = useNavigate();
  const [activeChapter, setActiveChapter] = useState(null);

  const overallScore = Math.round(
    CHAPTERS.reduce((s,c) => s + c.score, 0) / CHAPTERS.length
  );

  const circumference = 2 * Math.PI * 52;
  const dash = (overallScore / 100) * circumference;

  return (
    <div style={{
      background:C.night,color:C.ivory,
      fontFamily:"DM Sans,sans-serif",minHeight:"100vh",
    }}>
      <style>{`${FONTS} *{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* Navbar */}
      <nav style={{
        padding:"16px clamp(20px,5vw,60px)",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        borderBottom:`1px solid ${C.border}`,
      }}>
        <button onClick={()=>navigate("/")} style={{
          background:"none",border:"none",cursor:"pointer",
          fontFamily:"Cormorant Garamond,Georgia,serif",
          fontSize:20,fontWeight:600,color:C.ivory,
        }}>
          The Doggy Company<span style={{color:C.amber}}>®</span>
        </button>
        <button onClick={()=>navigate("/join")} style={{
          padding:"9px 22px",borderRadius:999,
          border:`1px solid ${C.amber}`,background:"transparent",
          color:C.amber,fontSize:13,fontWeight:600,cursor:"pointer",
        }}>
          Join Now
        </button>
      </nav>

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
          PET SOUL™ · WHAT MIRA BUILDS FOR YOUR DOG
        </div>
        <h1 style={{
          fontFamily:"Cormorant Garamond,Georgia,serif",
          fontSize:"clamp(2.5rem,7vw,5rem)",
          fontWeight:300,color:C.ivory,lineHeight:1.1,marginBottom:20,
        }}>
          A soul profile that grows<br/>
          <em style={{color:C.amber}}>smarter every visit.</em>
        </h1>
        <p style={{
          fontSize:16,color:C.muted,lineHeight:1.8,
          maxWidth:520,margin:"0 auto",fontWeight:300,
        }}>
          This is what Mira builds for every dog on the platform.
          Not a database record. A living portrait of who your dog is.
        </p>
      </section>

      {/* Live profile demo */}
      <section style={{
        padding:"80px clamp(20px,6vw,80px)",
        borderTop:`1px solid ${C.border}`,
      }}>
        <div style={{maxWidth:840,margin:"0 auto"}}>
          <div style={{
            fontSize:11,fontWeight:600,color:C.amber,
            letterSpacing:"0.14em",marginBottom:32,textAlign:"center",
          }}>
            DEMO · MOJO'S PET SOUL™ PROFILE
          </div>

          {/* Profile card */}
          <div style={{
            background:"rgba(255,255,255,0.02)",
            border:`1px solid ${C.border}`,
            borderRadius:24,overflow:"hidden",
          }}>

            {/* Header */}
            <div style={{
              background:"linear-gradient(135deg,#0F0A1E,#1A1040)",
              padding:"28px 28px 24px",
              display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",
              borderBottom:`1px solid ${C.border}`,
            }}>
              <div style={{
                width:72,height:72,borderRadius:"50%",
                background:MIRA_ORB,
                display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:30,flexShrink:0,
              }}>
                🐾
              </div>
              <div style={{flex:1}}>
                <div style={{
                  fontFamily:"Cormorant Garamond,Georgia,serif",
                  fontSize:28,fontWeight:600,color:C.ivory,marginBottom:4,
                }}>
                  Mojo
                </div>
                <div style={{fontSize:13,color:C.muted,marginBottom:10}}>
                  Indie · Senior · Mumbai
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["Playful","Food-lover","Brave","Loyal"].map(t=>(
                    <span key={t} style={{
                      background:"rgba(201,151,58,0.12)",
                      border:`1px solid ${C.border}`,
                      borderRadius:999,padding:"2px 10px",
                      fontSize:11,fontWeight:600,color:C.amber,
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Soul score ring */}
              <div style={{textAlign:"center",flexShrink:0}}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52"
                    fill="none" stroke="rgba(201,151,58,0.1)" strokeWidth="8"/>
                  <circle cx="60" cy="60" r="52"
                    fill="none"
                    stroke={C.amber}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference}`}
                    transform="rotate(-90 60 60)"
                    style={{transition:"stroke-dasharray 1s ease"}}
                  />
                  <text x="60" y="55" textAnchor="middle"
                    fill={C.amber}
                    fontSize="22" fontWeight="300"
                    fontFamily="Cormorant Garamond,serif">
                    {overallScore}%
                  </text>
                  <text x="60" y="72" textAnchor="middle"
                    fill="rgba(245,240,232,0.4)"
                    fontSize="10"
                    fontFamily="DM Sans,sans-serif">
                    soul score
                  </text>
                </svg>
              </div>
            </div>

            {/* Chapter scores */}
            <div style={{padding:"24px 28px",borderBottom:`1px solid rgba(255,255,255,0.05)`}}>
              <div style={{
                fontSize:10,fontWeight:700,color:C.amber,
                letterSpacing:"0.1em",marginBottom:16,
              }}>
                SOUL CHAPTERS
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {CHAPTERS.map(ch=>(
                  <div key={ch.label}
                    onClick={()=>setActiveChapter(activeChapter===ch.label?null:ch.label)}
                    style={{cursor:"pointer"}}
                  >
                    <div style={{
                      display:"flex",alignItems:"center",
                      justifyContent:"space-between",marginBottom:5,
                    }}>
                      <span style={{fontSize:13,color:C.ivoryD}}>{ch.label}</span>
                      <span style={{fontSize:13,fontWeight:600,color:ch.colour}}>
                        {ch.score}%
                      </span>
                    </div>
                    <div style={{
                      height:4,borderRadius:999,
                      background:"rgba(255,255,255,0.06)",overflow:"hidden",
                    }}>
                      <div style={{
                        height:"100%",borderRadius:999,
                        width:`${ch.score}%`,background:ch.colour,
                        transition:"width 1s ease",
                      }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What Mira knows */}
            <div style={{padding:"24px 28px",borderBottom:`1px solid rgba(255,255,255,0.05)`}}>
              <div style={{
                fontSize:10,fontWeight:700,color:C.amber,
                letterSpacing:"0.1em",marginBottom:16,
              }}>
                WHAT MIRA KNOWS ABOUT MOJO
              </div>
              <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",
                gap:10,
              }}>
                {[
                  {label:"ALLERGY",value:"No chicken — ever",alert:true},
                  {label:"DIET",   value:"Grain-free meals"},
                  {label:"HEALTH", value:"On treatment"},
                  {label:"ENERGY", value:"Very high"},
                  {label:"LOVES",  value:"Peanut butter cake"},
                  {label:"FEARS",  value:"Loud sounds"},
                  {label:"TRAINING",value:"Well trained"},
                  {label:"HOME",   value:"Apartment, Mumbai"},
                ].map(item=>(
                  <div key={item.label} style={{
                    background:item.alert?"rgba(220,38,38,0.08)":"rgba(255,255,255,0.03)",
                    border:`1px solid ${item.alert?"rgba(220,38,38,0.2)":"rgba(255,255,255,0.06)"}`,
                    borderRadius:10,padding:"10px 12px",
                  }}>
                    <div style={{
                      fontSize:9,fontWeight:700,letterSpacing:"0.1em",
                      color:item.alert?"#F87171":C.amber,marginBottom:4,
                    }}>
                      {item.label}
                    </div>
                    <div style={{fontSize:12,color:C.ivory,fontWeight:500}}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div style={{padding:"24px 28px",borderBottom:`1px solid rgba(255,255,255,0.05)`}}>
              <div style={{
                fontSize:10,fontWeight:700,color:C.amber,
                letterSpacing:"0.1em",marginBottom:16,
              }}>
                LIFE MILESTONES · MIRA REMEMBERS EVERY ONE
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {MILESTONES.map((m,i)=>(
                  <div key={i} style={{
                    display:"flex",alignItems:"flex-start",gap:14,
                    padding:"14px 0",
                    borderBottom:i<MILESTONES.length-1?"1px solid rgba(255,255,255,0.05)":"none",
                  }}>
                    <div style={{
                      width:36,height:36,borderRadius:10,
                      background:"rgba(255,255,255,0.04)",
                      display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:16,flexShrink:0,
                    }}>
                      {m.icon}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.ivory,marginBottom:2}}>
                        {m.title}
                      </div>
                      <div style={{fontSize:11,color:C.muted}}>
                        {m.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mira speaks */}
            <div style={{
              padding:"20px 28px",
              background:"rgba(155,89,182,0.05)",
              display:"flex",gap:12,alignItems:"flex-start",
            }}>
              <div style={{
                width:28,height:28,borderRadius:"50%",
                background:MIRA_ORB,
                display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:12,
                color:"#fff",flexShrink:0,
              }}>✦</div>
              <div style={{
                fontSize:13,color:C.muted,
                fontStyle:"italic",lineHeight:1.7,
              }}>
                "Mojo cannot have chicken — I'll never suggest it.
                He's on treatment so I keep everything gentle and warm.
                His birthday is in October and he loves peanut butter cake.
                I'll remind you when it's coming. 🌷"
              </div>
            </div>
          </div>

          <p style={{
            textAlign:"center",marginTop:20,
            fontSize:13,color:C.muted,fontStyle:"italic",
          }}>
            Mojo's profile after one session.
            Imagine what Mira knows after a year of living alongside your dog.
          </p>
        </div>
      </section>

      {/* How the profile builds */}
      <section style={{
        padding:"80px clamp(20px,6vw,80px)",
        background:C.deep,
        borderTop:`1px solid ${C.border}`,
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{maxWidth:800,margin:"0 auto",textAlign:"center"}}>
          <div style={{
            fontSize:11,fontWeight:600,color:C.amber,
            letterSpacing:"0.14em",marginBottom:20,
          }}>
            HOW IT BUILDS
          </div>
          <h2 style={{
            fontFamily:"Cormorant Garamond,Georgia,serif",
            fontSize:"clamp(1.8rem,4vw,2.8rem)",
            fontWeight:400,color:C.ivory,marginBottom:16,
          }}>
            Every interaction enriches the profile.
          </h2>
          <p style={{
            fontSize:15,color:C.muted,lineHeight:1.8,
            maxWidth:560,margin:"0 auto 48px",fontWeight:300,
          }}>
            Mira learns from your answers, your orders, your conversations,
            and your dog's behaviour patterns. She never starts from zero.
          </p>
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
            gap:16,
          }}>
            {[
              {icon:"📝",label:"Soul Profile answers",pts:"+105 pts at onboarding"},
              {icon:"💬",label:"Every Mira conversation",pts:"Memory updated"},
              {icon:"🛍️",label:"Every order placed",pts:"Preferences learned"},
              {icon:"🤝",label:"Every Concierge® request",pts:"Behaviour tracked"},
              {icon:"📅",label:"Reminders & milestones",pts:"Life events remembered"},
              {icon:"🎂",label:"Birthdays & celebrations",pts:"Traditions built"},
            ].map((item,i)=>(
              <div key={i} style={{
                background:"rgba(255,255,255,0.03)",
                border:"1px solid rgba(255,255,255,0.06)",
                borderRadius:14,padding:"20px 16px",textAlign:"center",
              }}>
                <div style={{fontSize:24,marginBottom:10}}>{item.icon}</div>
                <div style={{fontSize:13,fontWeight:600,color:C.ivory,marginBottom:4}}>
                  {item.label}
                </div>
                <div style={{fontSize:11,color:C.amber}}>{item.pts}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding:"100px clamp(20px,6vw,80px)",
        textAlign:"center",
      }}>
        <div style={{
          width:60,height:60,borderRadius:"50%",
          background:MIRA_ORB,
          display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:24,
          color:"#fff",margin:"0 auto 24px",
          boxShadow:"0 0 60px rgba(155,89,182,0.25)",
        }}>✦</div>
        <h2 style={{
          fontFamily:"Cormorant Garamond,Georgia,serif",
          fontSize:"clamp(2rem,5vw,3.5rem)",
          fontWeight:300,color:C.ivory,marginBottom:16,
        }}>
          Let Mira build this<br/>
          <em style={{color:C.amber}}>for your dog.</em>
        </h2>
        <p style={{
          fontSize:15,color:C.muted,marginBottom:36,
          lineHeight:1.7,fontWeight:300,
        }}>
          It starts with one question: What's their name?
        </p>
        <button onClick={()=>navigate("/join")} style={{
          padding:"16px 48px",borderRadius:999,border:"none",
          background:`linear-gradient(135deg,${C.amber},${C.amberL})`,
          color:C.night,fontSize:16,fontWeight:600,
          cursor:"pointer",fontFamily:"DM Sans,sans-serif",
          boxShadow:`0 8px 40px ${C.amber}40`,
        }}>
          Mira, meet my dog →
        </button>
      </section>

    </div>
  );
}
