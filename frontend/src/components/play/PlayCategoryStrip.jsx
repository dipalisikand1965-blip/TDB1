/**
 * PlayCategoryStrip.jsx — /play pillar
 * Mirrors DineCategoryStrip exactly: rounded-square icon tiles, scroll arrows,
 * labels below, includes Mira's Picks as last pill.
 * Clicking a play dim → onSelect(id) → opens inline DimExpanded
 * Clicking Mira's Picks → onMiraPicks() → opens MiraPicksSection modal
 */

import React, { useState, useRef, useEffect } from "react";

export const PLAY_CATEGORIES = [
  { id: "outings",   label: "Outings & Parks",  icon: "🌳", iconBg: "linear-gradient(135deg,#E8F5E9,#C8E6C9)" },
  { id: "playdates", label: "Playdates",         icon: "🐾", iconBg: "linear-gradient(135deg,#FCE4EC,#F8BBD0)" },
  { id: "walking",   label: "Dog Walking",       icon: "🦮", iconBg: "linear-gradient(135deg,#FFF3E0,#FFE0B2)" },
  { id: "fitness",   label: "Fitness",           icon: "💪", iconBg: "linear-gradient(135deg,#E3F2FD,#BBDEFB)" },
  { id: "swimming",  label: "Swimming",          icon: "🏊", iconBg: "linear-gradient(135deg,#E0F7FA,#B2EBF2)" },
  { id: "soul",      label: "Soul Picks",        icon: "✨", iconBg: "linear-gradient(135deg,#EDE7F6,#D1C4E9)" },
  { id: "bundles",   label: "Bundles",           icon: "🎁", iconBg: "linear-gradient(135deg,#FFF8E1,#FFECB3)" },
  { id: "miras-picks", label: "Mira's Picks",   icon: "💫", iconBg: "linear-gradient(135deg,#FCE4EC,#FF6B9D)" },
];

export default function PlayCategoryStrip({ pet, openDim, onSelect, onMiraPicks }) {
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef(null);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, []);

  const scrollBy = (amount) => scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });

  return (
    <div className="w-full bg-white relative" style={{ borderBottom: "1px solid #F0EBE5" }} data-testid="play-category-strip">
      {canScrollLeft && (
        <button
          onClick={() => scrollBy(-240)}
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-10 items-center justify-center"
          style={{ width: 32, background: "linear-gradient(to right, white 60%, transparent)", border: "none", cursor: "pointer" }}
        >
          <span style={{ fontSize: 14, color: "#888" }}>‹</span>
        </button>
      )}

      {/* Center when fits, scroll when overflows */}
      <div ref={scrollRef} style={{ overflowX:"auto", scrollbarWidth:"none", msOverflowStyle:"none", WebkitOverflowScrolling:"touch" }}>
        <style>{`[data-testid="play-category-strip"] ::-webkit-scrollbar{display:none}`}</style>
        <div style={{ display:"flex", minWidth:"max-content", margin:"0 auto", padding:"0 12px", justifyContent:"center" }}>
        {PLAY_CATEGORIES.map(cat => {
          const isMira   = cat.id === "miras-picks";
          const isActive = isMira ? false : openDim === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => isMira ? onMiraPicks?.() : onSelect?.(isActive ? null : cat.id)}
              className="flex flex-col items-center flex-shrink-0"
              style={{
                minWidth: 82, height: 72, padding: "10px 12px",
                cursor: "pointer", background: "transparent", border: "none",
                borderBottomWidth: 3, borderBottomStyle: "solid",
                borderBottomColor: isActive ? "#E76F51" : "transparent",
                transition: "border-color 150ms ease",
              }}
              data-testid={`play-strip-${cat.id}`}
            >
              <div
                className="flex items-center justify-center mb-1 flex-shrink-0"
                style={{ width: 34, height: 34, borderRadius: 10, background: cat.iconBg, fontSize: 18 }}
              >
                {cat.icon}
              </div>
              <span
                className="text-center leading-tight"
                style={{
                  fontSize: 11, fontWeight: 500,
                  color: isActive ? "#C44400" : isMira ? "#9B59B6" : "#555",
                  whiteSpace: "nowrap", maxWidth: 84, overflow: "hidden", textOverflow: "ellipsis",
                }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
        </div>
      </div>

      {canScrollRight && (
        <button
          onClick={() => scrollBy(240)}
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-10 items-center justify-center"
          style={{ width: 48, background: "linear-gradient(to left, white 50%, transparent)", border: "none", cursor: "pointer" }}
          data-testid="play-category-strip-scroll-right"
        >
          <span style={{ fontSize: 16, color: "#E76F51", fontWeight: 700 }}>›</span>
        </button>
      )}
    </div>
  );
}
