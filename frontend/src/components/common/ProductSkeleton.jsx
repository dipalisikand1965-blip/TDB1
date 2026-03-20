/**
 * ProductSkeleton.jsx — Shimmer loading placeholder for product cards
 * The Doggy Company — use on every pillar page while products load
 *
 * Usage:
 *   import { ProductGridSkeleton } from "./ProductSkeleton";
 *   {loading ? <ProductGridSkeleton count={6}/> : <products grid...>}
 */

function ProductCardSkeleton() {
  return (
    <div style={{
      borderRadius: 14, overflow: "hidden",
      border: "1px solid rgba(0,0,0,0.06)",
      background: "#fff",
    }}>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .shimmer-bg {
          background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
      `}</style>
      {/* Image skeleton */}
      <div className="shimmer-bg" style={{ height: 130 }}/>
      <div style={{ padding: "10px 12px 14px" }}>
        {/* Name line */}
        <div className="shimmer-bg" style={{ height: 12, borderRadius: 6, marginBottom: 8, width: "82%" }}/>
        {/* Second name line */}
        <div className="shimmer-bg" style={{ height: 10, borderRadius: 6, marginBottom: 10, width: "55%" }}/>
        {/* Score bar */}
        <div className="shimmer-bg" style={{ height: 4, borderRadius: 4, marginBottom: 8, width: "100%" }}/>
        {/* Price */}
        <div className="shimmer-bg" style={{ height: 13, borderRadius: 6, width: "35%" }}/>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6, columns }) {
  const cols = columns || "repeat(auto-fill,minmax(min(180px,100%),1fr))";
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: cols,
      gap: 14,
      marginBottom: 24,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i}/>
      ))}
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: "1px solid rgba(0,0,0,0.06)",
      background: "#fff",
    }}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .shimmer-svc{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}
      `}</style>
      <div className="shimmer-svc" style={{ height: 110 }}/>
      <div style={{ padding: "12px 14px 16px" }}>
        <div className="shimmer-svc" style={{ height: 11, borderRadius: 6, marginBottom: 7, width: "70%" }}/>
        <div className="shimmer-svc" style={{ height: 14, borderRadius: 6, marginBottom: 9, width: "90%" }}/>
        <div className="shimmer-svc" style={{ height: 9, borderRadius: 5, marginBottom: 9, width: "100%" }}/>
        <div className="shimmer-svc" style={{ height: 9, borderRadius: 5, marginBottom: 14, width: "75%" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="shimmer-svc" style={{ height: 16, borderRadius: 6, width: "30%" }}/>
          <div className="shimmer-svc" style={{ height: 30, borderRadius: 20, width: "35%" }}/>
        </div>
      </div>
    </div>
  );
}

export function ServiceGridSkeleton({ count = 4 }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(min(240px,100%),1fr))",
      gap: 14,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={i}/>
      ))}
    </div>
  );
}

export function MiraPicksSkeleton() {
  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.shimmer-pick{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}`}</style>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ flexShrink: 0, width: 168, borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(0,0,0,0.06)", background: "#fff" }}>
          <div className="shimmer-pick" style={{ height: 130 }}/>
          <div style={{ padding: "10px 11px 12px" }}>
            <div className="shimmer-pick" style={{ height: 11, borderRadius: 5, marginBottom: 6, width: "85%" }}/>
            <div className="shimmer-pick" style={{ height: 9, borderRadius: 5, marginBottom: 6, width: "60%" }}/>
            <div className="shimmer-pick" style={{ height: 4, borderRadius: 4, width: "100%" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductCardSkeleton;
