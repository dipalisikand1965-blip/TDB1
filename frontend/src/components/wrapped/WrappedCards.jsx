/**
 * Pet Wrapped Card Components
 * Beautiful vertical story cards for Instagram/WhatsApp sharing
 */
import React from 'react';

// Shared styles for all cards
const cardBaseStyle = {
  width: '390px',
  height: '844px',
  borderRadius: '32px',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
  fontFamily: "'DM Sans', sans-serif",
};

// Cover Card - Card 1
export const CoverCard = ({ data, petName, breed, year, rainbowBridge }) => {
  return (
    <div style={{ ...cardBaseStyle, background: '#120826' }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', width: '360px', height: '360px',
        background: '#4B2680', top: '-80px', left: '-80px',
        borderRadius: '50%', filter: 'blur(80px)', opacity: 0.5
      }} />
      <div style={{
        position: 'absolute', width: '300px', height: '300px',
        background: '#C4607A', bottom: '60px', right: '-60px',
        borderRadius: '50%', filter: 'blur(80px)', opacity: 0.35
      }} />
      <div style={{
        position: 'absolute', width: '200px', height: '200px',
        background: '#C9973A', top: '300px', left: '80px',
        borderRadius: '50%', filter: 'blur(80px)', opacity: 0.25
      }} />
      
      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2, height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '48px 36px 40px'
      }}>
        <div style={{
          fontSize: '10px', letterSpacing: '4px', color: '#C9973A',
          textTransform: 'uppercase', fontWeight: 500
        }}>
          Pet Wrapped · {year}
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '120px', fontWeight: 300, lineHeight: 1,
          color: 'rgba(255,255,255,0.06)',
          marginTop: '-8px', marginLeft: '-4px', letterSpacing: '-4px'
        }}>
          {year}
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>🐾</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '64px', fontWeight: 400, lineHeight: 1,
            color: 'white', letterSpacing: '1px'
          }}>
            <em style={{ fontStyle: 'italic', color: '#F0C060' }}>{petName}</em>
          </div>
          <div style={{
            fontSize: '13px', color: '#E8A0B0', letterSpacing: '2px',
            textTransform: 'uppercase', marginTop: '8px'
          }}>
            {breed}{rainbowBridge && ' · In Loving Memory'}
          </div>
          <div style={{
            width: '48px', height: '1px', background: '#C9973A',
            margin: '24px 0'
          }} />
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '18px', fontStyle: 'italic', fontWeight: 300,
            color: 'rgba(255,255,255,0.7)', lineHeight: 1.5
          }}>
            {data?.tagline || "Their eyes held a universe of love.\nAnd they left it behind."}
          </div>
        </div>
        
        <div style={{
          marginTop: '32px', fontSize: '10px', letterSpacing: '3px',
          color: '#8892A4', textTransform: 'uppercase'
        }}>
          thedoggycompany.com
        </div>
      </div>
    </div>
  );
};

// Soul Score Card - Card 2
export const SoulScoreCard = ({ data, petName }) => {
  const score = data?.current_score || 0;
  const journey = data?.journey || [];
  
  return (
    <div style={{
      ...cardBaseStyle,
      background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1250 50%, #1a0a2e 100%)'
    }}>
      {/* Gold bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, transparent, #C9973A, transparent)'
      }} />
      
      <div style={{
        position: 'relative', zIndex: 2, height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '48px 36px 40px'
      }}>
        <div style={{
          fontSize: '10px', letterSpacing: '4px', color: '#7B4DB5',
          textTransform: 'uppercase', fontWeight: 500
        }}>
          Soul Journey
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '40px', fontWeight: 400, color: 'white',
          lineHeight: 1.1, marginTop: '8px'
        }}>
          Their <em style={{ fontStyle: 'italic', color: '#F0C060' }}>Soul Score</em><br />this year
        </div>
        
        {/* Score Arc */}
        <div style={{
          margin: '36px auto 0', position: 'relative',
          width: '260px', height: '260px'
        }}>
          <svg viewBox="0 0 260 260" fill="none" style={{ width: '100%', height: '100%' }}>
            <circle cx="130" cy="130" r="100" stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="none"/>
            <circle 
              cx="130" cy="130" r="100"
              stroke="url(#goldGradient)" 
              strokeWidth="12" 
              fill="none"
              strokeLinecap="round"
              strokeDasharray="628"
              strokeDashoffset={628 - (628 * score / 100)}
              transform="rotate(-90 130 130)"
            />
            <circle cx="130" cy="130" r="82" stroke="rgba(201,151,58,0.12)" strokeWidth="1" fill="none"/>
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C9973A"/>
                <stop offset="100%" stopColor="#F0C060"/>
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '72px', fontWeight: 300, color: 'white', lineHeight: 1
            }}>
              {score}
            </div>
            <div style={{
              fontSize: '11px', letterSpacing: '2px', color: '#C9973A',
              textTransform: 'uppercase', marginTop: '4px'
            }}>
              Soul Score
            </div>
          </div>
        </div>
        
        {/* Journey */}
        {journey.length > 1 && (
          <div style={{
            marginTop: '32px', display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            {journey.map((step, i) => (
              <React.Fragment key={i}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '32px', fontWeight: 400,
                    color: i === journey.length - 1 ? '#F0C060' : '#8892A4'
                  }}>
                    {step.score}
                  </div>
                  <div style={{ fontSize: '10px', color: '#8892A4', marginTop: '2px' }}>
                    {step.label}
                  </div>
                </div>
                {i < journey.length - 1 && (
                  <div style={{ color: '#C9973A', fontSize: '20px' }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        
        {/* Quote */}
        <div style={{
          marginTop: 'auto',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '17px', fontStyle: 'italic', fontWeight: 300,
          color: 'rgba(255,255,255,0.65)', lineHeight: 1.6,
          borderLeft: '2px solid #C9973A', paddingLeft: '16px'
        }}>
          {data?.soul_quote || `"What has ${petName} forgiven you for? The times you were distracted. The times you forgot."`}
        </div>
        
        <div style={{
          marginTop: '20px', fontSize: '10px', letterSpacing: '3px',
          color: '#8892A4', textTransform: 'uppercase'
        }}>
          thedoggycompany.com
        </div>
      </div>
    </div>
  );
};

// Mira Moments Card - Card 3
export const MiraMomentsCard = ({ data, petName, memory }) => {
  return (
    <div style={{ ...cardBaseStyle, background: '#0d0520' }}>
      {/* Stars background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(2px 2px at 40px 80px, rgba(255,255,255,0.3), transparent),
                     radial-gradient(2px 2px at 120px 40px, rgba(255,255,255,0.2), transparent),
                     radial-gradient(2px 2px at 200px 150px, rgba(255,255,255,0.4), transparent),
                     radial-gradient(2px 2px at 280px 60px, rgba(255,255,255,0.2), transparent),
                     radial-gradient(2px 2px at 60px 200px, rgba(255,255,255,0.3), transparent)`
      }} />
      
      {/* Rose glow */}
      <div style={{
        position: 'absolute', bottom: '-100px', left: '50%',
        transform: 'translateX(-50%)',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(196,96,122,0.25) 0%, transparent 70%)',
        borderRadius: '50%'
      }} />
      
      <div style={{
        position: 'relative', zIndex: 2, height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '48px 36px 40px'
      }}>
        <div style={{
          fontSize: '10px', letterSpacing: '4px', color: '#C4607A',
          textTransform: 'uppercase', fontWeight: 500
        }}>
          Mira Moments
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '40px', fontWeight: 400, color: 'white',
          lineHeight: 1.1, marginTop: '8px'
        }}>
          What Mira<br /><em style={{ fontStyle: 'italic', color: '#F0C060' }}>remembers</em>
        </div>
        
        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '16px', marginTop: '36px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '20px 16px'
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '48px', fontWeight: 300, color: '#E8A0B0', lineHeight: 1
            }}>
              {data?.conversation_count || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#8892A4', marginTop: '2px' }}>conversations</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '20px 16px'
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '48px', fontWeight: 300, color: '#E8A0B0', lineHeight: 1
            }}>
              {data?.questions_answered || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#8892A4', marginTop: '2px' }}>questions</div>
          </div>
          <div style={{
            gridColumn: '1 / -1',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '20px 16px'
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '48px', fontWeight: 300, color: '#E8A0B0', lineHeight: 1
            }}>
              {data?.pillars_list?.length || 0}
            </div>
            <div style={{ fontSize: '14px', color: '#8892A4', marginTop: '2px' }}>pillars explored</div>
            <div style={{ fontSize: '11px', color: '#8892A4', marginTop: '8px', lineHeight: 1.4 }}>
              {data?.pillars_list?.join(' · ') || 'Celebrate · Dine · Care'}
            </div>
          </div>
        </div>
        
        {/* Memory Card */}
        <div style={{
          marginTop: '24px',
          background: 'linear-gradient(135deg, rgba(196,96,122,0.15), rgba(75,38,128,0.15))',
          border: '1px solid rgba(196,96,122,0.25)',
          borderRadius: '20px', padding: '24px'
        }}>
          <div style={{
            fontSize: '9px', letterSpacing: '3px', color: '#C4607A',
            textTransform: 'uppercase', marginBottom: '10px'
          }}>
            Mira's Favourite Memory
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '18px', fontStyle: 'italic', fontWeight: 300,
            color: 'white', lineHeight: 1.6
          }}>
            "{memory || `Every moment with ${petName} was a memory worth keeping.`}"
          </div>
        </div>
        
        <div style={{
          marginTop: 'auto', paddingTop: '24px',
          fontSize: '10px', letterSpacing: '3px',
          color: '#8892A4', textTransform: 'uppercase'
        }}>
          thedoggycompany.com
        </div>
      </div>
    </div>
  );
};

// Pillars Card - Card 5
export const PillarsCard = ({ data, petName }) => {
  const pillars = data?.top_pillars || [];
  const treatCount = data?.treat_count || 0;
  
  const pillarColors = {
    Celebrate:  { bg: 'rgba(201,151,58,0.15)',  bar: 'linear-gradient(90deg,#C9973A,#F0C060)',  text: '#F0C060' },
    Farewell:   { bg: 'rgba(196,96,122,0.15)',  bar: 'linear-gradient(90deg,#C4607A,#E8A0B0)',  text: '#E8A0B0' },
    Care:       { bg: 'rgba(75,38,128,0.2)',    bar: 'linear-gradient(90deg,#7B4DB5,#A87ADB)',  text: '#A87ADB' },
    Dine:       { bg: 'rgba(45,122,74,0.15)',   bar: 'linear-gradient(90deg,#2D7A4A,#6BCB8B)',  text: '#6BCB8B' },
    Learn:      { bg: 'rgba(201,151,58,0.1)',   bar: 'linear-gradient(90deg,#8892A4,#C0C8D8)',  text: '#C0C8D8' },
    Go:         { bg: 'rgba(30,90,180,0.15)',   bar: 'linear-gradient(90deg,#1E5AB4,#5A9AEA)',  text: '#5A9AEA' },
    Play:       { bg: 'rgba(231,111,81,0.15)',  bar: 'linear-gradient(90deg,#E76F51,#FF9878)',  text: '#FF9878' },
    Shop:       { bg: 'rgba(155,89,182,0.15)',  bar: 'linear-gradient(90deg,#9B59B6,#C984E8)',  text: '#C984E8' },
    Services:   { bg: 'rgba(52,152,219,0.15)',  bar: 'linear-gradient(90deg,#3498DB,#7FC4F0)',  text: '#7FC4F0' },
    Paperwork:  { bg: 'rgba(100,116,139,0.15)', bar: 'linear-gradient(90deg,#64748B,#94A3B8)',  text: '#94A3B8' },
    Emergency:  { bg: 'rgba(239,68,68,0.15)',   bar: 'linear-gradient(90deg,#EF4444,#FCA5A5)',  text: '#FCA5A5' },
    Adopt:      { bg: 'rgba(236,72,153,0.15)',  bar: 'linear-gradient(90deg,#EC4899,#F9A8D4)',  text: '#F9A8D4' },
  };
  
  return (
    <div style={{ ...cardBaseStyle, background: '#0c0818' }}>
      {/* Gold mesh */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 20% 20%, rgba(201,151,58,0.12) 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 80%, rgba(75,38,128,0.2) 0%, transparent 50%)`
      }} />
      
      <div style={{
        position: 'relative', zIndex: 2, height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '48px 36px 40px'
      }}>
        <div style={{
          fontSize: '10px', letterSpacing: '4px', color: '#C9973A',
          textTransform: 'uppercase', fontWeight: 500
        }}>
          Life Pillars
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '40px', fontWeight: 400, color: 'white',
          lineHeight: 1.1, marginTop: '8px'
        }}>
          A life<br /><em style={{ fontStyle: 'italic', color: '#F0C060' }}>fully lived</em>
        </div>
        
        {/* Pillar List */}
        <div style={{
          marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          {pillars.map((pillar, i) => {
            const colors = pillarColors[pillar.name] || pillarColors.Learn;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', background: colors.bg
                }}>
                  {pillar.icon}
                </div>
                <div style={{ flex: 1, fontSize: '14px', color: 'white', fontWeight: 400 }}>
                  {pillar.name}
                </div>
                <div style={{
                  flex: 2, height: '6px', background: 'rgba(255,255,255,0.08)',
                  borderRadius: '3px', overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', borderRadius: '3px',
                    width: `${pillar.percentage}%`, background: colors.bar
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: colors.text, width: '32px', textAlign: 'right' }}>
                  {pillar.percentage}%
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Treats */}
        {treatCount > 0 && (
          <div style={{
            marginTop: '28px',
            background: 'linear-gradient(135deg, rgba(201,151,58,0.12), rgba(75,38,128,0.1))',
            border: '1px solid rgba(201,151,58,0.2)',
            borderRadius: '20px', padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: '16px'
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '52px', fontWeight: 300, color: '#F0C060', lineHeight: 1
            }}>
              {treatCount}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
              <strong style={{ color: '#F0C060', display: 'block', fontWeight: 500 }}>
                Doggy Bakery treats
              </strong>
              {petName} enjoyed handcrafted celebrations this year
            </div>
          </div>
        )}
        
        <div style={{
          marginTop: 'auto', paddingTop: '20px',
          fontSize: '10px', letterSpacing: '3px',
          color: '#8892A4', textTransform: 'uppercase'
        }}>
          thedoggycompany.com
        </div>
      </div>
    </div>
  );
};

// Closing Card - Card 6
export const ClosingCard = ({ petName, parentName, rainbowBridge, onShare }) => {
  return (
    <div style={{ ...cardBaseStyle, background: '#120826', overflow: 'hidden' }}>
      {/* Background gradients */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 30% 60%, rgba(196,96,122,0.2) 0%, transparent 60%),
                     radial-gradient(ellipse at 70% 20%, rgba(75,38,128,0.3) 0%, transparent 60%)`
      }} />
      
      {/* Large "love" text */}
      <div style={{
        position: 'absolute',
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: '200px', fontWeight: 300, fontStyle: 'italic',
        color: 'rgba(255,255,255,0.025)',
        lineHeight: 1, letterSpacing: '-8px',
        bottom: '-20px', left: '-10px',
        whiteSpace: 'nowrap'
      }}>
        love
      </div>
      
      <div style={{
        position: 'relative', zIndex: 2, height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '48px 36px 40px',
        justifyContent: 'space-between'
      }}>
        <div style={{
          fontSize: '10px', letterSpacing: '4px', color: '#C9973A',
          textTransform: 'uppercase', fontWeight: 500
        }}>
          Pet Wrapped · 2025{rainbowBridge ? ' · In Memory' : ''}
        </div>
        
        <div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '36px', fontWeight: 300, fontStyle: 'italic',
            color: 'white', lineHeight: 1.35
          }}>
            "A dog is not in your life.<br />
            You are in theirs.<br /><br />
            <em style={{ color: '#F0C060' }}>{petName} knew that.</em><br />
            They lived it completely."
          </div>
          <div style={{
            fontSize: '12px', color: '#C4607A', letterSpacing: '1px',
            marginTop: '16px'
          }}>
            — {parentName} · The Doggy Company
          </div>
        </div>
        
        {/* Share Block */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px', padding: '24px'
        }}>
          <div style={{
            fontSize: '10px', letterSpacing: '3px', color: '#C9973A',
            textTransform: 'uppercase', marginBottom: '12px'
          }}>
            Give your dog a Soul Profile
          </div>
          <button
            onClick={onShare}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#C9973A', color: '#120826',
              fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px',
              padding: '12px 24px', borderRadius: '100px',
              cursor: 'pointer', border: 'none',
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            🐾 Create theirs now
          </button>
          <div style={{
            fontSize: '12px', color: '#8892A4', marginTop: '12px', lineHeight: 1.5
          }}>
            Every dog deserves to be truly known.<br />
            <a href="https://thedoggycompany.com" style={{ color: '#E8A0B0', textDecoration: 'none' }}>
              thedoggycompany.com
            </a>
          </div>
        </div>
        
        <div style={{
          fontSize: '10px', letterSpacing: '3px',
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase', textAlign: 'center'
        }}>
          The Doggy Company · Pet Wrapped · 2025
        </div>
      </div>
    </div>
  );
};

export default {
  CoverCard,
  SoulScoreCard,
  MiraMomentsCard,
  PillarsCard,
  ClosingCard
};
