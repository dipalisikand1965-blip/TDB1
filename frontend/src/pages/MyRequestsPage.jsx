/**
 * MyRequestsPage.jsx — /my-requests
 * The Doggy Company
 *
 * The member-facing inbox. Every ticket, order, Mira conversation,
 * and service request in one place. Mobile and desktop.
 *
 * Tabs:
 *   All · Bookings · Orders · Mira Chats · Browse History
 *
 * Each ticket shows:
 *   - Pillar colour + icon
 *   - What was asked / what happened
 *   - Status (open / in_progress / resolved)
 *   - Last message from Concierge
 *   - Timestamp
 *   - Tap to expand full thread
 *
 * API:
 *   GET /api/service_desk/tickets?parent_id={user.id}&limit=50
 *   GET /api/service_desk/tickets/{ticket_id}  — full thread
 *
 * ROUTE: /my-requests (ProtectedRoute)
 */

import { useState, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../utils/api";

// ── Pillar colours ────────────────────────────────────────────────────
const PILLAR_META = {
  care:       { colour:"#40916C", icon:"🌿", label:"Care" },
  dine:       { colour:"#C9973A", icon:"🍽️", label:"Dine" },
  celebrate:  { colour:"#9B59B6", icon:"🎂", label:"Celebrate" },
  go:         { colour:"#1D9E75", icon:"✈️", label:"Go" },
  play:       { colour:"#E76F51", icon:"🎾", label:"Play" },
  learn:      { colour:"#7C3AED", icon:"🎓", label:"Learn" },
  shop:       { colour:"#C9973A", icon:"🛍️", label:"Shop" },
  paperwork:  { colour:"#0F6E56", icon:"📄", label:"Paperwork" },
  emergency:  { colour:"#DC2626", icon:"🚨", label:"Emergency" },
  adopt:      { colour:"#7B3FA0", icon:"🐾", label:"Adopt" },
  farewell:   { colour:"#334155", icon:"🌷", label:"Farewell" },
  services:   { colour:"#334155", icon:"✦",  label:"Services" },
  fit:        { colour:"#E76F51", icon:"🏃", label:"Fitness" },
  advisory:   { colour:"#0F6E56", icon:"💡", label:"Advisory" },
  mira_os:    { colour:"#9B59B6", icon:"✦",  label:"Mira" },
  default:    { colour:"#64748B", icon:"✦",  label:"Request" },
};

const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ── Intent labels ─────────────────────────────────────────────────────
const INTENT_LABELS = {
  service_booking:    "Booking request",
  product_inquiry:    "Product enquiry",
  browse_intent:      "Browsed",
  search_intent:      "Searched",
  nearme_search:      "Searched nearby",
  product_interest:   "Viewed product",
  mira_chat_intent:   "Mira chat",
  onboarding_progress:"Onboarding",
  mira_imagines_request:"Mira imagines",
};

// ── Status badge ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const configs = {
    open:               { bg:"#EFF6FF", color:"#1D4ED8", label:"Open" },
    awaiting_concierge: { bg:"#FEF3C7", color:"#92400E", label:"With Concierge" },
    in_progress:        { bg:"#F0FDF4", color:"#166534", label:"In Progress" },
    resolved:           { bg:"#F0FDF4", color:"#15803D", label:"✓ Resolved" },
    closed:             { bg:"#F1F5F9", color:"#475569", label:"Closed" },
  };
  const c = configs[status] || configs.open;
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: 10, fontWeight: 700,
      borderRadius: 20, padding: "2px 8px",
    }}>
      {c.label}
    </span>
  );
}

// ── Thread message ────────────────────────────────────────────────────
function ThreadMessage({ msg, pillarColour }) {
  const isConcierge = msg.sender === "concierge";
  const isMira      = msg.sender === "mira";
  const isSystem    = msg.sender === "system";

  if (isSystem) return (
    <div style={{
      textAlign: "center", fontSize: 11,
      color: "var(--color-text-tertiary)",
      padding: "4px 0",
    }}>
      {msg.text}
    </div>
  );

  return (
    <div style={{
      display: "flex",
      justifyContent: isConcierge || isMira ? "flex-start" : "flex-end",
      marginBottom: 8,
    }}>
      {(isConcierge || isMira) && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: isMira ? MIRA_ORB : pillarColour,
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 12,
          color: "#fff", flexShrink: 0, marginRight: 8, marginTop: 2,
        }}>
          {isMira ? "✦" : "C"}
        </div>
      )}
      <div style={{
        maxWidth: "75%",
        background: isConcierge || isMira
          ? "var(--color-background-secondary)"
          : pillarColour,
        color: isConcierge || isMira ? "var(--color-text-primary)" : "#fff",
        borderRadius: isConcierge || isMira ? "4px 14px 14px 14px" : "14px 14px 4px 14px",
        padding: "10px 14px",
        fontSize: 13, lineHeight: 1.5,
      }}>
        {msg.text}
        {msg.timestamp && (
          <div style={{
            fontSize: 10, opacity: 0.6, marginTop: 4,
            textAlign: isConcierge || isMira ? "left" : "right",
          }}>
            {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ticket card ───────────────────────────────────────────────────────
function TicketCard({ ticket, onExpand, expanded }) {
  const meta    = PILLAR_META[ticket.pillar] || PILLAR_META.default;
  const intent  = INTENT_LABELS[ticket.intent_primary] || ticket.intent_primary || "Request";
  const lastMsg = ticket.thread?.[ticket.thread.length - 1];
  const isBrowse = ["browse_intent","search_intent","nearme_search","product_interest"].includes(ticket.intent_primary);

  const timeAgo = (ts) => {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: `1px solid ${expanded ? meta.colour + "40" : "var(--color-border-tertiary)"}`,
      borderLeft: `3px solid ${meta.colour}`,
      borderRadius: 12, overflow: "hidden",
      marginBottom: 10,
      transition: "border-color 0.15s",
    }}>
      {/* Card header */}
      <div
        onClick={onExpand}
        style={{
          padding: "14px 16px",
          cursor: "pointer",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: meta.colour + "18",
          display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 16, flexShrink: 0,
        }}>
          {meta.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex", alignItems: "center",
            gap: 8, marginBottom: 4, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: meta.colour }}>
              {meta.label}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {intent}
            </span>
            <StatusBadge status={ticket.status}/>
          </div>
          <div style={{
            fontSize: 13, color: "var(--color-text-primary)",
            lineHeight: 1.4, marginBottom: 4,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {ticket.thread?.[0]?.text || ticket.initial_message?.text || ticket.subject || "Mira is on it →"}
          </div>
          {lastMsg && lastMsg !== ticket.thread?.[0] && !isBrowse && (
            <div style={{
              fontSize: 12, color: "var(--color-text-secondary)",
              fontStyle: "italic",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {lastMsg.sender === "concierge" ? "Concierge: " : ""}
              {lastMsg.text?.slice(0, 80)}
            </div>
          )}
        </div>

        <div style={{
          fontSize: 11, color: "var(--color-text-tertiary)",
          flexShrink: 0, textAlign: "right",
        }}>
          <div>{timeAgo(ticket.created_at)}</div>
          <div style={{ marginTop: 4, fontSize: 16, color: "var(--color-text-tertiary)" }}>
            {expanded ? "▾" : "▸"}
          </div>
        </div>
      </div>

      {/* Expanded thread — shows thread messages OR initial_message fallback */}
      {expanded && (
        <div style={{
          borderTop: "1px solid var(--color-border-tertiary)",
          padding: "14px 16px",
          background: "var(--color-background-secondary)",
          maxHeight: 400, overflowY: "auto",
        }}>
          {ticket.thread && ticket.thread.length > 0
            ? ticket.thread.map((msg, i) => (
                <ThreadMessage key={i} msg={msg} pillarColour={meta.colour}/>
              ))
            : ticket.initial_message
              ? <ThreadMessage msg={ticket.initial_message} pillarColour={meta.colour}/>
              : <p style={{ fontSize:13, color:"var(--color-text-muted)", margin:0 }}>
                  Mira has noted your {meta.label} request. Your concierge will follow up shortly.
                </p>
          }

          {/* Mira briefing — show if present */}
          {ticket.mira_briefing && (
            <div style={{ marginTop:12, background:`${meta.colour}08`, borderRadius:10, padding:"10px 12px",
                          border:`1px solid ${meta.colour}20` }}>
              <p style={{ fontSize:11, fontWeight:700, color:meta.colour, margin:"0 0 6px", textTransform:"uppercase", letterSpacing:1 }}>
                Mira's Briefing
              </p>
              <p style={{ fontSize:12, color:"var(--color-text-secondary)", margin:0, lineHeight:1.6 }}>
                {ticket.mira_briefing}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────
const TABS = [
  { id:"all",     label:"All" },
  { id:"booking", label:"Bookings" },
  { id:"browse",  label:"Browse" },
  { id:"mira",    label:"Mira" },
  { id:"resolved",label:"Resolved" },
];

// ── Main page ─────────────────────────────────────────────────────────
export default function MyRequestsPage() {
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useAuth();

  const [tickets,     setTickets]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [activeTab,   setActiveTab]   = useState("all");
  const [expandedId,  setExpandedId]  = useState(null);
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login?redirect=/my-requests"); return; }
    fetchTickets();
  }, [isAuthenticated]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      // Use user email or ID as parent_id — matches service_desk_tickets collection
      const parentId = user?.id || user?.email || user?._id;
      if (!parentId) { setError("Please log in to view your requests."); setLoading(false); return; }

      const res = await fetch(
        `${API_URL}/api/service_desk/tickets/by_parent/${encodeURIComponent(parentId)}?limit=100`,
        { headers: { "Authorization": `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || data.items || (Array.isArray(data) ? data : []) || []);
      } else {
        setError("Could not load your requests.");
      }
    } catch {
      setError("Could not load your requests.");
    }
    setLoading(false);
  }, [token, user]);

  const handleExpand = (ticketId) => {
    setExpandedId(prev => prev === ticketId ? null : ticketId);
  };

  // Filter by tab
  const BROWSE_INTENTS   = ["browse_intent","search_intent","nearme_search","product_interest","onboarding_progress"];
  const BOOKING_INTENTS  = ["booking_intent","service_booking","service_request","product_order","guided_path_booking","imagine_intent","cart_intent","order_placed","farewell","farewell_detected"];
  const MIRA_INTENTS     = ["mira_chat_intent","mira_os","mira_imagines"];

  const filtered = tickets.filter(t => {
    if (search) {
      const q = search.toLowerCase();
      const text = (t.thread?.[0]?.text || t.initial_message?.text || t.subject || "").toLowerCase();
      if (!text.includes(q) && !(t.pillar||"").toLowerCase().includes(q) && !(t.pet_name||"").toLowerCase().includes(q)) return false;
    }
    if (activeTab === "booking")  return BOOKING_INTENTS.includes(t.intent_primary);
    if (activeTab === "browse")   return BROWSE_INTENTS.includes(t.intent_primary);
    if (activeTab === "mira")     return MIRA_INTENTS.includes(t.intent_primary) || t.channel?.includes("mira");
    if (activeTab === "resolved") return t.status === "resolved" || t.status === "closed";
    return true;
  });

  const counts = {
    all:      tickets.length,
    booking:  tickets.filter(t => BOOKING_INTENTS.includes(t.intent_primary)).length,
    browse:   tickets.filter(t => BROWSE_INTENTS.includes(t.intent_primary)).length,
    mira:     tickets.filter(t => t.channel === "mira_os" || t.intent_primary === "mira_chat_intent").length,
    resolved: tickets.filter(t => t.status === "resolved" || t.status === "closed").length,
  };

  const openCount = tickets.filter(t => t.status === "open" || t.status === "awaiting_concierge").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-background-tertiary)",
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <Helmet>
        <title>My Requests · The Doggy Company</title>
      </Helmet>

      {/* Header */}
      <div style={{
        background: "var(--color-background-primary)",
        borderBottom: "1px solid var(--color-border-tertiary)",
        padding: "16px 20px",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "none", border: "none",
                fontSize: 20, cursor: "pointer",
                color: "var(--color-text-secondary)", padding: "0 4px",
              }}
            >←</button>
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontSize: 18, fontWeight: 700,
                color: "var(--color-text-primary)", margin: 0,
                fontFamily: "Georgia, serif",
              }}>
                My Requests
              </h1>
              {openCount > 0 && (
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                  {openCount} open · Concierge® is on it
                </div>
              )}
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: MIRA_ORB,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 16, color: "#fff",
            }}>✦</div>
          </div>

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your requests…"
            style={{
              width: "100%", padding: "10px 14px",
              borderRadius: 10, fontSize: 13,
              border: "1px solid var(--color-border-tertiary)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        background: "var(--color-background-primary)",
        borderBottom: "1px solid var(--color-border-tertiary)",
        padding: "0 20px",
      }}>
        <div style={{
          maxWidth: 640, margin: "0 auto",
          display: "flex", gap: 0, overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none", border: "none",
                borderBottom: activeTab === tab.id
                  ? "2.5px solid #9B59B6"
                  : "2.5px solid transparent",
                padding: "12px 16px",
                fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? "#9B59B6" : "var(--color-text-secondary)",
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 10,
                  background: activeTab === tab.id ? "#9B59B616" : "var(--color-background-secondary)",
                  borderRadius: 20, padding: "1px 6px",
                  color: activeTab === tab.id ? "#9B59B6" : "var(--color-text-tertiary)",
                }}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 20px" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: MIRA_ORB,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18,
              color: "#fff", margin: "0 auto 12px",
            }}>✦</div>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              Loading your requests…
            </div>
          </div>
        ) : error ? (
          <div style={{
            background: "var(--color-background-danger)",
            border: "1px solid var(--color-border-danger)",
            borderRadius: 10, padding: "14px 16px",
            fontSize: 13, color: "var(--color-text-danger)",
          }}>
            {error}
            <button onClick={fetchTickets} style={{
              marginLeft: 12, fontSize: 12, fontWeight: 600,
              background: "none", border: "none",
              color: "var(--color-text-info)", cursor: "pointer",
            }}>
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
            <div style={{
              fontSize: 16, fontWeight: 600,
              color: "var(--color-text-primary)", marginBottom: 8,
              fontFamily: "Georgia, serif",
            }}>
              {activeTab === "all" ? "No requests yet" : `No ${TABS.find(t=>t.id===activeTab)?.label.toLowerCase()} yet`}
            </div>
            <div style={{
              fontSize: 13, color: "var(--color-text-secondary)",
              lineHeight: 1.6,
            }}>
              {activeTab === "all"
                ? "Every booking, search and Mira conversation will appear here."
                : "When you book or ask Mira, it'll show up here."}
            </div>
            <button
              onClick={() => navigate("/pet-home")}
              style={{
                marginTop: 20, padding: "10px 24px",
                borderRadius: 20, border: "none",
                background: MIRA_ORB, color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Explore the platform →
            </button>
          </div>
        ) : (
          <>
            <div style={{
              fontSize: 12, color: "var(--color-text-tertiary)",
              marginBottom: 12,
            }}>
              {filtered.length} {activeTab === "all" ? "total" : TABS.find(t=>t.id===activeTab)?.label.toLowerCase()}
            </div>
            {filtered.map(ticket => (
              <TicketCard
                key={ticket.ticket_id || ticket.id || ticket._id}
                ticket={ticket}
                expanded={expandedId === (ticket.ticket_id || ticket.id || ticket._id)}
                onExpand={() => handleExpand(ticket.ticket_id || ticket.id || ticket._id)}
              />
            ))}
            <div style={{
              textAlign: "center", padding: "24px 0",
              fontSize: 12, color: "var(--color-text-tertiary)",
            }}>
              ✦ Mira is the Brain · Concierge® is the Hands
            </div>
          </>
        )}
      </div>
    </div>
  );
}
