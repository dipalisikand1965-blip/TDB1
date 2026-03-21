/**
 * AboutPage.jsx — /about
 * The Doggy Company
 *
 * The story. Mystique. Kouros. Dipali. Aditya.
 * "We built this from grief, fuelled by love."
 */

import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const C = {
  night:"#0A0A0F",deep:"#0F0A1E",
  amber:"#C9973A",amberL:"#E8B84B",
  ivory:"#F5F0E8",ivoryD:"#D4C9B0",
  muted:"rgba(245,240,232,0.55)",
  border:"rgba(201,151,58,0.2)",
  sage:"#40916C",
};

const DOGS = [
  "Meister","Mercury","Mynx","Mahi","Miracle",
  "Mojo","Max","Mars","Moon","Mia","Magica","Maya",
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      background:C.night,color:C.ivory,
      fontFamily:"DM Sans,sans-serif",minHeight:"100vh",
    }}>
      <style>{`${FONTS} *{box-sizing:border-box;margin:0;padding:0;}`}</style>

      {/* Standard Navbar */}
      <Navbar />

      {/* Hero */}
      <section style={{
        padding:"100px clamp(20px,6vw,80px) 80px",
        textAlign:"center",
        background:`radial-gradient(ellipse at 50% 0%,#1A1040 0%,${C.night} 70%)`,
      }}>
        <div style={{
          fontSize:11,fontWeight:600,color:C.amber,
          letterSpacing:"0.14em",marginBottom:20,
        }}>
          OUR STORY
        </div>
        <h1 style={{
          fontFamily:"Cormorant Garamond,Georgia,serif",
          fontSize:"clamp(2.5rem,7vw,5.5rem)",
          fontWeight:300,color:C.ivory,lineHeight:1.1,
          marginBottom:24,
        }}>
          Built from grief.
          <br/>
          <em style={{color:C.amber}}>Fuelled by love.</em>
        </h1>
        <p style={{
          fontSize:"clamp(15px,2.5vw,18px)",color:C.muted,
          lineHeight:1.8,maxWidth:580,margin:"0 auto",fontWeight:300,
        }}>
          Every other pet company is built around human convenience.
          We built around your dog's inner life.
        </p>
      </section>

      {/* Mystique */}
      <section style={{
        padding:"80px clamp(20px,6vw,80px)",
        borderTop:`1px solid ${C.border}`,
        background:C.deep,
      }}>
        <div style={{maxWidth:780,margin:"0 auto"}}>
          <div style={{
            fontSize:11,fontWeight:600,color:C.amber,
            letterSpacing:"0.14em",marginBottom:24,
          }}>
            IN LOVING MEMORY
          </div>
          <div style={{
            display:"flex",gap:32,alignItems:"flex-start",
            flexWrap:"wrap",
          }}>
            <div style={{
              width:80,height:80,borderRadius:"50%",
              background:"linear-gradient(135deg,#2D1B69,#4A2C8F)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:36,flexShrink:0,
            }}>
              🌷
            </div>
            <div style={{flex:1,minWidth:260}}>
              <h2 style={{
                fontFamily:"Cormorant Garamond,Georgia,serif",
                fontSize:"clamp(1.8rem,4vw,2.8rem)",
                fontWeight:400,color:C.ivory,marginBottom:16,lineHeight:1.2,
              }}>
                Mystique
              </h2>
              <p style={{
                fontSize:16,color:C.muted,lineHeight:1.8,
                fontWeight:300,marginBottom:16,
              }}>
                She was a Shih Tzu. She was family. She left too soon.
                And in leaving, she taught us what it truly means to know a dog —
                not their breed, not their age, but their soul.
              </p>
              <p style={{
                fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,
              }}>
                The Doggy Company was built in her memory.
                Her birthday — May 15th — lives in every order we process.
                Every cake from The Doggy Bakery on her birthday
                feeds a street animal through Streaties.
              </p>
              <div style={{
                marginTop:20,padding:"14px 18px",
                background:"rgba(201,151,58,0.08)",
                border:`1px solid ${C.border}`,borderRadius:12,
                fontSize:13,color:C.ivoryD,fontStyle:"italic",lineHeight:1.6,
              }}>
                "In loving memory of Kouros & Mystique —
                They taught us that to know a pet is to know a soul."
                <div style={{
                  fontSize:11,color:C.amber,marginTop:8,fontStyle:"normal",
                  fontWeight:600,letterSpacing:"0.08em",
                }}>
                  — THE LOGIN PAGE · EVERY PERSON SEES THIS FIRST
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kouros */}
      <section style={{padding:"80px clamp(20px,6vw,80px)",maxWidth:780,margin:"0 auto"}}>
        <div style={{
          fontSize:11,fontWeight:600,color:C.amber,
          letterSpacing:"0.14em",marginBottom:24,
        }}>
          THE BEGINNING
        </div>
        <div style={{
          display:"flex",gap:32,alignItems:"flex-start",flexWrap:"wrap",
        }}>
          <div style={{
            width:80,height:80,borderRadius:"50%",
            background:"linear-gradient(135deg,#1B4332,#2D6A4F)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:36,flexShrink:0,
          }}>
            🐾
          </div>
          <div style={{flex:1,minWidth:260}}>
            <h2 style={{
              fontFamily:"Cormorant Garamond,Georgia,serif",
              fontSize:"clamp(1.8rem,4vw,2.8rem)",
              fontWeight:400,color:C.ivory,marginBottom:16,lineHeight:1.2,
            }}>
              Kouros
            </h2>
            <p style={{
              fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,marginBottom:12,
            }}>
              A Newfoundland. Dipali's first own dog. The one who came home
              the day she started working — and never left her side.
              He raised Aditya with her.
            </p>
            <p style={{
              fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,
            }}>
              Kouros taught us that a dog isn't a pet.
              A dog is a life lived alongside yours.
              That's the philosophy behind everything we've built.
            </p>
          </div>
        </div>
      </section>

      {/* Dipali */}
      <section style={{
        padding:"80px clamp(20px,6vw,80px)",
        background:C.deep,
        borderTop:`1px solid ${C.border}`,
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{maxWidth:780,margin:"0 auto"}}>
          <div style={{
            fontSize:11,fontWeight:600,color:C.amber,
            letterSpacing:"0.14em",marginBottom:24,
          }}>
            THE FOUNDER
          </div>
          <h2 style={{
            fontFamily:"Cormorant Garamond,Georgia,serif",
            fontSize:"clamp(1.8rem,4vw,2.8rem)",
            fontWeight:400,color:C.ivory,marginBottom:20,lineHeight:1.2,
          }}>
            Dipali Sikand
          </h2>
          <p style={{
            fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,marginBottom:16,
          }}>
            Thirty years running Les Concierges® and Club Concierge® —
            a luxury concierge service trusted by the world's most discerning clients.
            Over 1,000 trained professionals. A philosophy built on knowing what
            someone needs before they ask.
          </p>
          <p style={{
            fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,marginBottom:16,
          }}>
            She applied that same philosophy to dogs.
            Because dogs deserve to be known the way the best hotels know their guests.
            Not by breed. Not by age. By soul.
          </p>
          <p style={{
            fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,marginBottom:28,
          }}>
            Today she has twelve dogs — all starting with M.
          </p>
          <div style={{
            display:"flex",flexWrap:"wrap",gap:8,
          }}>
            {DOGS.map(name => (
              <span key={name} style={{
                background:"rgba(201,151,58,0.1)",
                border:`1px solid ${C.border}`,
                borderRadius:999,padding:"4px 14px",
                fontSize:13,fontWeight:500,color:C.amber,
              }}>
                {name}
              </span>
            ))}
          </div>
          <p style={{
            fontSize:13,color:C.muted,marginTop:12,fontStyle:"italic",
          }}>
            Twelve reasons The Doggy Company exists.
          </p>
        </div>
      </section>

      {/* Aditya */}
      <section style={{padding:"80px clamp(20px,6vw,80px)",maxWidth:780,margin:"0 auto"}}>
        <div style={{
          fontSize:11,fontWeight:600,color:C.amber,
          letterSpacing:"0.14em",marginBottom:24,
        }}>
          THE CO-FOUNDER
        </div>
        <h2 style={{
          fontFamily:"Cormorant Garamond,Georgia,serif",
          fontSize:"clamp(1.8rem,4vw,2.8rem)",
          fontWeight:400,color:C.ivory,marginBottom:16,lineHeight:1.2,
        }}>
          Aditya
        </h2>
        <p style={{
          fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,marginBottom:16,
        }}>
          Raised by Kouros. Grew up with dogs as family.
          Built the technology that makes Mira possible — every API,
          every soul question, every pillar page, every Concierge® connection.
        </p>
        <p style={{
          fontSize:16,color:C.muted,lineHeight:1.8,fontWeight:300,
        }}>
          He also runs The Doggy Bakery — where his grandmother Mira's
          handcrafted treat philosophy lives on in every peanut butter cake
          and birthday hamper.
        </p>
      </section>

      {/* Mira AI */}
      <section style={{
        padding:"60px clamp(20px,6vw,80px)",
        background:C.deep,
        borderTop:`1px solid ${C.border}`,
        borderBottom:`1px solid ${C.border}`,
        textAlign:"center",
      }}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{
            width:56,height:56,borderRadius:"50%",
            background:"linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:24,color:"#fff",margin:"0 auto 20px",
          }}>✦</div>
          <h3 style={{
            fontFamily:"Cormorant Garamond,Georgia,serif",
            fontSize:"clamp(1.5rem,3vw,2.2rem)",
            fontWeight:400,color:C.ivory,marginBottom:12,
          }}>
            Mira
          </h3>
          <p style={{
            fontSize:15,color:C.muted,lineHeight:1.7,fontWeight:300,
          }}>
            Named after Aditya's grandmother — the woman whose hands made
            the first treats, whose care philosophy lives in every recommendation
            Mira makes today. The AI. The memory. The soul-keeper.
          </p>
        </div>
      </section>

      {/* Streaties + Hill of Flowers */}
      <section style={{padding:"80px clamp(20px,6vw,80px)",maxWidth:780,margin:"0 auto"}}>
        <div style={{
          fontSize:11,fontWeight:600,color:C.sage,
          letterSpacing:"0.14em",marginBottom:24,
        }}>
          GIVING BACK
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:24}}>
          <div style={{
            background:"rgba(64,145,108,0.08)",
            border:"1px solid rgba(64,145,108,0.2)",
            borderRadius:16,padding:"24px 20px",
          }}>
            <div style={{
              fontSize:16,fontWeight:600,color:C.ivory,marginBottom:8,
            }}>
              🐾 Streaties
            </div>
            <p style={{fontSize:14,color:C.muted,lineHeight:1.7}}>
              10% of every The Doggy Bakery purchase feeds a street animal.
              Your dog's joy feeds another dog's survival.
            </p>
          </div>
          <div style={{
            background:"rgba(64,145,108,0.08)",
            border:"1px solid rgba(64,145,108,0.2)",
            borderRadius:16,padding:"24px 20px",
          }}>
            <div style={{
              fontSize:16,fontWeight:600,color:C.ivory,marginBottom:8,
            }}>
              🌸 Hill of Flowers · Nilgiris
            </div>
            <p style={{fontSize:14,color:C.muted,lineHeight:1.7}}>
              ₹100 plants one flower. Employs women as Flower Guardians in
              Arakadu village, Nilgiris. Every purchase here helps build
              a rabies-free district — one of India's most meaningful
              animal welfare initiatives.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
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
          Let Mira meet your dog.
        </h2>
        <p style={{
          fontSize:15,color:C.muted,marginBottom:36,lineHeight:1.7,fontWeight:300,
        }}>
          This is what we built Mystique and Kouros for.
        </p>
        <button onClick={()=>navigate("/join")} style={{
          padding:"16px 48px",borderRadius:999,border:"none",
          background:`linear-gradient(135deg,${C.amber},${C.amberL})`,
          color:C.night,fontSize:16,fontWeight:600,
          cursor:"pointer",fontFamily:"DM Sans,sans-serif",
          boxShadow:`0 8px 40px ${C.amber}40`,
        }}>
          I want to be part of this →
        </button>
      </section>

    </div>
  );
}
