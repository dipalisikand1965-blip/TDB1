/**
 * Insights.jsx — /insights
 * TDC Insights: Stories from the soul of dog parenting
 *
 * Design: Deep midnight #1A0A2E · Cormorant Garamond · DM Sans · Amber gold
 * Data:   Fetches from /api/blog-posts
 * SEO:    react-helmet-async via SEO component
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Clock, Eye, X, Loader2, ChevronRight } from 'lucide-react';
import { API_URL } from '../utils/api';
import SEO from '../components/SEO';

// ─── Design tokens ─────────────────────────────────────────────────────
const C = {
  bg:      '#1A0A2E',
  bgDeep:  '#12071F',
  bgCard:  'rgba(255,255,255,0.035)',
  bgCardH: 'rgba(255,255,255,0.06)',
  amber:   '#C9973A',
  amberL:  '#E8B84B',
  ivory:   '#F5F0E8',
  ivoryD:  '#D4C9B0',
  muted:   'rgba(245,240,232,0.52)',
  mutedD:  'rgba(245,240,232,0.30)',
  border:  'rgba(201,151,58,0.18)',
  borderS: 'rgba(255,255,255,0.07)',
};

// Category → colour mapping
const CAT_COLORS = {
  Travel:    '#1D9E75',
  Care:      '#40916C',
  Dine:      '#C9973A',
  Celebrate: '#9B59B6',
  Health:    '#E76F51',
  Default:   '#7C3AED',
};
const catColor = (cat) => CAT_COLORS[cat] || CAT_COLORS.Default;

// ─── Helpers ────────────────────────────────────────────────────────────
const formatDate = (ds) => {
  if (!ds) return '';
  return new Date(ds).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

const readTime = (post) => {
  const words = ((post.content || '') + (post.excerpt || '')).split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
};

// Safe image — if null/empty, returns null so we render a gradient fallback
const safeImg = (post) => (post.image_url || post.featured_image) || null;

// ─── Fade-in on scroll ──────────────────────────────────────────────────
function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.06 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Category pill ──────────────────────────────────────────────────────
function CatPill({ label, active, onClick }) {
  const colour = catColor(label);
  return (
    <button
      onClick={onClick}
      data-testid={`insights-cat-${label.toLowerCase()}`}
      style={{
        padding: '7px 18px',
        borderRadius: 999,
        border: `1px solid ${active ? colour : C.borderS}`,
        background: active ? `${colour}20` : 'transparent',
        color: active ? colour : C.muted,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.05em',
        cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = `${colour}60`;
          e.currentTarget.style.color = colour;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.borderColor = C.borderS;
          e.currentTarget.style.color = C.muted;
        }
      }}
    >
      {label}
    </button>
  );
}

// ─── Gradient image fallback ────────────────────────────────────────────
function PostImage({ post, style = {}, className = '' }) {
  const [err, setErr] = useState(false);
  const img = safeImg(post);
  const colour = catColor(post.category);

  if (!img || err) {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${colour}22, ${colour}08)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }} className={className}>
        <span style={{ fontSize: 48, opacity: 0.4 }}>
          { post.category === 'Travel' ? '✈️'
          : post.category === 'Care' ? '🌿'
          : post.category === 'Dine' ? '🍽️'
          : post.category === 'Celebrate' ? '🎂'
          : post.category === 'Health' ? '🌱'
          : '✦' }
        </span>
      </div>
    );
  }

  return (
    <img
      src={img}
      alt={post.title}
      onError={() => setErr(true)}
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
      className={className}
    />
  );
}

// ─── Article Reading Modal ──────────────────────────────────────────────
function ArticleModal({ article, onClose }) {
  const colour = catColor(article.category);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      data-testid="article-modal"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,4,20,0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        data-testid="article-modal-content"
        style={{
          background: '#1E0D36',
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          width: '100%',
          maxWidth: 780,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Image header */}
        <div style={{ position: 'relative', height: 260, flexShrink: 0 }}>
          <PostImage post={article} style={{ height: 260 }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,4,20,0.95) 0%, rgba(10,4,20,0.3) 60%, transparent 100%)',
          }} />
          <button
            onClick={onClose}
            data-testid="close-article-modal"
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(30,13,54,0.8)',
              border: `1px solid ${C.borderS}`,
              color: C.ivory, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
          <div style={{ position: 'absolute', bottom: 20, left: 28, right: 28 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              color: colour, fontFamily: 'DM Sans, sans-serif',
              textTransform: 'uppercase',
            }}>
              {article.category}
            </span>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(1.3rem,3vw,2rem)',
              fontWeight: 600, color: C.ivory,
              marginTop: 6, lineHeight: 1.2,
            }}>
              {article.title}
            </h2>
          </div>
        </div>

        {/* Meta */}
        <div style={{
          padding: '16px 28px',
          borderBottom: `1px solid ${C.borderS}`,
          display: 'flex', gap: 20, flexWrap: 'wrap', flexShrink: 0,
        }}>
          {[
            { icon: <User size={13} />, text: article.author || 'TDC Team' },
            { icon: <Calendar size={13} />, text: formatDate(article.published_at || article.created_at) },
            { icon: <Clock size={13} />, text: `${readTime(article)} min read` },
            { icon: <Eye size={13} />, text: `${article.views || 0} views` },
          ].map((m, i) => (
            <span key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: C.mutedD,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {m.icon} {m.text}
            </span>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flexGrow: 1 }}>
          {article.excerpt && (
            <p style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 18, fontStyle: 'italic',
              color: C.ivoryD, lineHeight: 1.7,
              borderLeft: `3px solid ${colour}`,
              paddingLeft: 16, marginBottom: 20,
            }}>
              {article.excerpt}
            </p>
          )}
          <div style={{ color: C.muted, lineHeight: 1.85, fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
            {article.content
              ? article.content.split('\n').map((p, i) =>
                  p.trim() ? <p key={i} style={{ marginBottom: 14 }}>{p}</p> : null
                )
              : <p style={{ fontStyle: 'italic', color: C.mutedD }}>Full article coming soon.</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Featured card (large) ──────────────────────────────────────────────
function FeaturedCard({ post, onClick }) {
  const [hov, setHov] = useState(false);
  const colour = catColor(post.category);

  return (
    <div
      data-testid="featured-post"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        borderRadius: 20,
        overflow: 'hidden',
        border: `1px solid ${hov ? colour + '40' : C.borderS}`,
        background: C.bgCard,
        cursor: 'pointer',
        transition: 'all 0.3s',
        boxShadow: hov ? `0 12px 48px rgba(0,0,0,0.35)` : 'none',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', minHeight: 280, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          transform: hov ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 0.5s ease',
        }}>
          <PostImage post={post} style={{ height: '100%', width: '100%' }} />
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, transparent 60%, rgba(26,10,46,0.8) 100%)',
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
          color: colour, marginBottom: 12,
          fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase',
        }}>
          Featured · {post.category}
        </div>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(1.4rem,2.5vw,2rem)',
          fontWeight: 600, color: C.ivory,
          lineHeight: 1.25, marginBottom: 14,
        }}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p style={{
            fontSize: 14, color: C.muted,
            fontFamily: 'DM Sans, sans-serif',
            lineHeight: 1.7, marginBottom: 20,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {post.excerpt}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: C.mutedD, fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
            <User size={12} /> {post.author || 'TDC Team'}
          </span>
          <span style={{ fontSize: 12, color: C.mutedD, fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {readTime(post)} min read
          </span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 600, color: colour,
          fontFamily: 'DM Sans, sans-serif',
          transition: 'gap 0.2s',
          gap: hov ? 10 : 6,
        }}>
          Read story <ArrowRight size={14} />
        </div>
      </div>
    </div>
  );
}

// ─── Post card (grid) ───────────────────────────────────────────────────
function PostCard({ post, onClick, index }) {
  const [hov, setHov] = useState(false);
  const colour = catColor(post.category);

  return (
    <FadeIn delay={index * 0.06}>
      <div
        data-testid={`insight-card-${post.id}`}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onClick}
        style={{
          background: hov ? C.bgCardH : C.bgCard,
          border: `1px solid ${hov ? colour + '35' : C.borderS}`,
          borderRadius: 18,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.25s',
          transform: hov ? 'translateY(-4px)' : 'none',
          boxShadow: hov ? `0 12px 40px rgba(0,0,0,0.3)` : 'none',
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', height: 196, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            transform: hov ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.45s ease',
          }}>
            <PostImage post={post} style={{ height: '100%', width: '100%' }} />
          </div>
          {/* Category badge */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: `${colour}22`,
            border: `1px solid ${colour}50`,
            borderRadius: 999, padding: '4px 10px',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.08em', color: colour,
            fontFamily: 'DM Sans, sans-serif',
            textTransform: 'uppercase',
            backdropFilter: 'blur(8px)',
          }}>
            {post.category}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 22px' }}>
          <h3 style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: 18, fontWeight: 600, color: C.ivory,
            lineHeight: 1.3, marginBottom: 10,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {post.title}
          </h3>
          {post.excerpt && (
            <p style={{
              fontSize: 13, color: C.muted,
              fontFamily: 'DM Sans, sans-serif',
              lineHeight: 1.65, marginBottom: 14,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {post.excerpt}
            </p>
          )}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11, color: C.mutedD,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> {formatDate(post.published_at || post.created_at)}
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 3,
              color: hov ? colour : C.mutedD,
              fontWeight: hov ? 600 : 400,
              transition: 'color 0.2s',
            }}>
              {readTime(post)} min <ChevronRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

// ─── Main export ────────────────────────────────────────────────────────
const Insights = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/blog-posts`);
        if (res.ok) {
          const data = await res.json();
          const rawPosts = data.posts || (Array.isArray(data) ? data : []);
          setPosts(rawPosts.filter(p => p.status === 'published' || !p.status));
        } else {
          setError('Could not load stories.');
        }
      } catch {
        setError('Could not load stories.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Derived state
  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];
  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory);
  const featured = filtered.filter(p => p.is_featured);
  const rest = filtered.filter(p => !p.is_featured);

  return (
    <>
      <SEO
        title="TDC Insights — Stories from the soul of dog parenting"
        description="Expert guides, heartfelt stories, and soul-first advice for dog parents across India. From celebration planning to nutrition, care, and travel."
        url="/insights"
        keywords="dog care tips, pet parenting india, dog birthday, dog nutrition, pet travel india, the doggy company blog"
      />

      <div style={{
        background: C.bg, color: C.ivory,
        fontFamily: 'DM Sans, sans-serif',
        minHeight: '100vh',
      }}>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section style={{
          padding: 'clamp(60px,10vw,100px) clamp(20px,6vw,80px) 60px',
          background: `radial-gradient(ellipse at 30% 60%, rgba(155,89,182,0.14) 0%, transparent 55%),
                       radial-gradient(ellipse at 80% 20%, rgba(201,151,58,0.08) 0%, transparent 50%),
                       ${C.bg}`,
          textAlign: 'center',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <FadeIn>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.2em',
              color: C.amber, marginBottom: 20,
              fontFamily: 'DM Sans, sans-serif',
              border: `1px solid ${C.border}`,
              padding: '5px 16px', borderRadius: 999,
              display: 'inline-block',
            }}>
              TDC INSIGHTS
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(2.4rem,6vw,4.5rem)',
              fontWeight: 400, lineHeight: 1.1,
              color: C.ivory, marginBottom: 14,
              letterSpacing: '-0.01em',
            }}>
              Stories from the soul<br />
              <span style={{ fontStyle: 'italic', color: C.ivoryD }}>of dog parenting.</span>
            </h1>
            <p style={{
              fontSize: 'clamp(14px,2vw,16px)', color: C.muted,
              maxWidth: 460, margin: '0 auto 36px',
              lineHeight: 1.75, fontFamily: 'DM Sans, sans-serif',
            }}>
              Expert guides, heartfelt stories, and soul-first advice —
              for dogs who deserve nothing less.
            </p>

            {/* Category pills */}
            <div
              data-testid="insights-category-filters"
              style={{
                display: 'flex', gap: 8, flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {categories.map(cat => (
                <CatPill
                  key={cat}
                  label={cat}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                />
              ))}
            </div>
          </FadeIn>
        </section>

        {/* ── CONTENT ──────────────────────────────────────────────────── */}
        <section style={{ padding: '56px clamp(20px,6vw,80px) 80px', maxWidth: 1140, margin: '0 auto' }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: `2px solid ${C.borderS}`,
                borderTopColor: C.amber,
                margin: '0 auto 16px',
                animation: 'insights-spin 0.8s linear infinite',
              }} />
              <p style={{ color: C.muted, fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                Fetching stories…
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              background: C.bgCard,
              border: `1px solid ${C.borderS}`,
              borderRadius: 18,
            }}>
              <p style={{ color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>{error}</p>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '80px 0',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.4 }}>✦</div>
              <p style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 22, color: C.ivoryD, marginBottom: 8,
              }}>
                No stories in {activeCategory} yet.
              </p>
              <button
                onClick={() => setActiveCategory('All')}
                style={{
                  background: 'none', border: 'none',
                  color: C.amber, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14,
                  textDecoration: 'underline',
                }}
              >
                See all stories
              </button>
            </div>
          )}

          {/* Featured posts */}
          {!loading && !error && featured.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <FadeIn>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
                  color: C.amber, marginBottom: 20,
                  fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase',
                }}>
                  Featured
                </div>
              </FadeIn>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {featured.map(post => (
                  <FadeIn key={post.id} delay={0.05}>
                    <FeaturedCard post={post} onClick={() => setSelectedArticle(post)} />
                  </FadeIn>
                ))}
              </div>
            </div>
          )}

          {/* All / remaining posts grid */}
          {!loading && !error && rest.length > 0 && (
            <div>
              {featured.length > 0 && (
                <FadeIn>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
                    color: C.amber, marginBottom: 20,
                    fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase',
                  }}>
                    More stories
                  </div>
                </FadeIn>
              )}
              <div
                data-testid="insights-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 20,
                }}
              >
                {rest.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={i}
                    onClick={() => setSelectedArticle(post)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* If no featured, show all in grid */}
          {!loading && !error && featured.length === 0 && rest.length === 0 && filtered.length > 0 && (
            <div
              data-testid="insights-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
              }}
            >
              {filtered.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={i}
                  onClick={() => setSelectedArticle(post)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── NEWSLETTER STRIP ─────────────────────────────────────────── */}
        {!loading && !error && (
          <section style={{
            background: C.bgDeep,
            borderTop: `1px solid ${C.border}`,
            padding: '60px clamp(20px,6vw,80px)',
            textAlign: 'center',
          }}>
            <FadeIn>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'linear-gradient(135deg,#9B59B6,#E91E8C)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#fff',
                margin: '0 auto 20px',
              }}>
                ✦
              </div>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                fontSize: 'clamp(1.5rem,3vw,2.2rem)',
                fontWeight: 400, color: C.ivory, marginBottom: 10,
              }}>
                Never miss a story.
              </h2>
              <p style={{
                fontSize: 14, color: C.muted,
                fontFamily: 'DM Sans, sans-serif',
                marginBottom: 28, maxWidth: 380, margin: '0 auto 28px',
              }}>
                Soul-first advice for dog parents — straight to your inbox.
              </p>
              <div
                data-testid="newsletter-form"
                style={{
                  display: 'flex', gap: 10, flexWrap: 'wrap',
                  justifyContent: 'center', maxWidth: 440, margin: '0 auto',
                }}
              >
                <input
                  type="email"
                  placeholder="your@email.com"
                  data-testid="newsletter-email"
                  style={{
                    flex: '1 1 220px', padding: '13px 18px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${C.borderS}`,
                    color: C.ivory, fontSize: 14,
                    fontFamily: 'DM Sans, sans-serif',
                    outline: 'none',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = `${C.amber}60`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.borderS; }}
                />
                <button
                  data-testid="newsletter-subscribe"
                  style={{
                    padding: '13px 26px', borderRadius: 999,
                    background: C.amber, border: 'none',
                    color: '#12071F', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.amberL; }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.amber; }}
                >
                  Subscribe
                </button>
              </div>
            </FadeIn>
          </section>
        )}
      </div>

      {/* Article modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </>
  );
};

export default Insights;
