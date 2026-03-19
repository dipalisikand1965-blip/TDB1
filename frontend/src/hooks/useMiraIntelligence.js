/**
 * useMiraIntelligence.js
 * Fetches Mira's pet intelligence (memories, orders, tickets) and returns
 * a concise context string to surface in Mira Picks sections.
 *
 * Usage:
 *   const { note, orderCount, topInterest } = useMiraIntelligence(petId, token);
 */
import { useState, useEffect } from "react";
import { API_URL } from "../utils/api";

export function useMiraIntelligence(petId, token) {
  const [note,         setNote]         = useState(null);
  const [orderCount,   setOrderCount]   = useState(0);
  const [topInterest,  setTopInterest]  = useState(null);
  const [memories,     setMemories]     = useState([]);

  useEffect(() => {
    if (!petId) return;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch pet intelligence
    fetch(`${API_URL}/api/mira/pet-intelligence/${petId}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const learnings = d.recent_learnings || [];
        const mems = d.mira_memories || [];
        setMemories([...learnings.slice(0,3), ...mems.slice(0,2)]);

        // Build concise note from top memory
        const top = learnings[0] || mems[0];
        if (top) {
          const val = top.value || top.content || "";
          if (val) setNote(val.length > 60 ? val.slice(0,57)+"…" : val);
        }

        // Top interest by category
        const cats = {};
        learnings.forEach(m => { cats[m.category||"general"] = (cats[m.category||"general"]||0)+1; });
        const topCat = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
        if (topCat) setTopInterest(topCat[0]);
      })
      .catch(() => {});

    // Fetch order count for pet
    fetch(`${API_URL}/api/orders?pet_id=${petId}&limit=10`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const orders = d.orders || d.items || (Array.isArray(d) ? d : []);
        setOrderCount(orders.length);
      })
      .catch(() => {});
  }, [petId]);

  return { note, orderCount, topInterest, memories };
}

/**
 * getMiraIntelligenceSubtitle — returns a short subtitle string
 * to show under Mira Picks section heading.
 */
export function getMiraIntelligenceSubtitle(petName, note, orderCount, topInterest) {
  const parts = [];
  if (orderCount > 0) parts.push(`${orderCount} order${orderCount>1?"s":""} on record`);
  if (topInterest && topInterest !== "general") parts.push(`${topInterest} interest noted`);
  if (note) parts.push(`Mira noted: "${note}"`);
  if (parts.length === 0) return `AI scored picks matched to ${petName}'s soul profile.`;
  return `${petName}: ${parts.slice(0,2).join(" · ")}.`;
}
