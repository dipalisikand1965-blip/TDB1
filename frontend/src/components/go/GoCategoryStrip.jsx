/**
 * GoCategoryStrip.jsx — /go pillar category pills
 * Mirrors CareCategoryStrip.jsx exactly — 6 go dimensions
 * Each pill opens GoContentModal with pet-personalised products.
 *
 * Props: pet — pet object
 */
import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import GoContentModal from "./GoContentModal";

const G = { deep:"#0D3349", teal:"#1ABC9C", light:"#76D7C4", pale:"#D1F2EB", cream:"#E8F8F5", deepMid:"#1A5276", mutedText:"#5D6D7E", border:"rgba(26,188,156,0.18)" };

const GO_STRIPS = [
  { id:"soul",     icon:"✨", label:"Soul Go",        iconBg:"linear-gradient(135deg,#EDE7F6,#B39DDB)", special:true },
  { id:"mira",     icon:"🪄", label:"Mira's Picks",  iconBg:"linear-gradient(135deg,#FCE4EC,#F48FB1)", special:true },
  { id:"safety",   icon:"🛡️", label:"Safety",        iconBg:"linear-gradient(135deg,#E3F2FD,#BBDEFB)" },
  { id:"calming",  icon:"😌", label:"Calming",        iconBg:"linear-gradient(135deg,#E8F5E9,#A5D6A7)" },
  { id:"carriers", icon:"🎒", label:"Carriers",       iconBg:"linear-gradient(135deg,#E0F7FA,#80DEEA)" },
  { id:"feeding",  icon:"🥣", label:"Feeding",        iconBg:"linear-gradient(135deg,#FFF9C4,#FFF176)" },
  { id:"health",   icon:"💊", label:"Health & Docs",  iconBg:"linear-gradient(135deg,#FCE4EC,#F48FB1)" },
  { id:"stay",     icon:"🏡", label:"Stay & Board",   iconBg:"linear-gradient(135deg,#EDE7F6,#B39DDB)" },
];

export default function GoCategoryStrip({ pet }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const scrollRef = useRef(null);

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setShowModal(true);
  };

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
    <>
      <div
        data-testid="go-category-strip"
        style={{ width:"100%", background:"#fff", position:"relative", borderBottom:`1px solid ${G.border}` }}
      >
        {canScrollLeft && (
          <button onClick={() => scrollBy(-240)}
            style={{ position:"absolute", left:0, top:0, bottom:0, zIndex:10, width:32, background:"linear-gradient(to right, white 60%, transparent)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
            aria-label="Scroll left">
            <span style={{ fontSize:14, color:"#888" }}>‹</span>
          </button>
        )}

        <div ref={scrollRef}
          style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none", msOverflowStyle:"none", WebkitOverflowScrolling:"touch", paddingLeft:canScrollLeft?32:0, paddingRight:canScrollRight?40:12, justifyContent:"center" }}
          className="go-strip-inner">
          <style>{`.go-strip-inner::-webkit-scrollbar{display:none}`}</style>

          {GO_STRIPS.map(s => {
            const isActive = activeCategory?.id === s.id && showModal;
            return (
              <button key={s.id}
                onClick={() => handleCategoryClick(s)}
                data-testid={`go-category-${s.id}`}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, minWidth:80, padding:"12px 10px", cursor:"pointer", background:"transparent", border:"none", borderBottomWidth:3, borderBottomStyle:"solid", borderBottomColor:isActive?G.teal:"transparent", transition:"border-color 150ms ease" }}>
                <div style={{ width:34, height:34, borderRadius:10, background:s.iconBg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:4, flexShrink:0, fontSize:18 }}>
                  {s.icon}
                </div>
                <span style={{ fontSize:11, fontWeight:isActive?700:500, color:isActive?G.deepMid:"#555", whiteSpace:"nowrap", maxWidth:84, overflow:"hidden", textOverflow:"ellipsis", textAlign:"center", lineHeight:"tight" }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <button onClick={() => scrollBy(240)}
            style={{ position:"absolute", right:0, top:0, bottom:0, zIndex:10, width:48, background:"linear-gradient(to left, white 50%, transparent)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
            aria-label="Scroll right"
            data-testid="go-category-strip-scroll-right">
            <span style={{ fontSize:16, color:G.teal, fontWeight:700 }}>›</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {showModal && activeCategory && (
          <GoContentModal
            isOpen={showModal}
            onClose={() => { setShowModal(false); setActiveCategory(null); }}
            category={activeCategory.id}
            pet={pet}
          />
        )}
      </AnimatePresence>
    </>
  );
}
