/**
 * useBookConcierge.js
 * The Doggy Company — CANONICAL booking hook
 *
 * RULE: Every "Book →", "Tap → Concierge", "Source this for me →", 
 *       "Reach out →" button MUST call this hook.
 *
 * Flow: User Intent → Service Desk Ticket → Admin Notification → Member Notification
 *
 * Usage:
 *   const { book, booked, booking } = useBookConcierge(pet, pillar, token);
 *   <button onClick={() => book(serviceName, channel)}>Book →</button>
 */
import { useState, useCallback } from "react";
import { API_URL } from "../utils/api";

export default function useBookConcierge(pet, pillar, token) {
  const [booking, setBooking] = useState(false);
  const [booked,  setBooked]  = useState(false);
  const [ticketId, setTicketId] = useState(null);

  const book = useCallback(async (
    serviceName = "Service Request",
    channel = null,
    extraMessage = null,
    intentSecondary = null
  ) => {
    if (booking) return;
    setBooking(true);
    try {
      // Try multiple sources for user identity
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const session = JSON.parse(localStorage.getItem("tdb_user_session") || "{}");
      const parentId = user?.id || user?.email || user?.user_id || 
                       session?.id || session?.email || 
                       pet?.owner_id || pet?.owner_email || "guest";
      const petId    = pet?.id || "unknown";
      const petName  = pet?.name || "your dog";
      const ch       = channel || `${pillar}_booking`;

      const body = {
        parent_id:     parentId,
        pet_id:        petId,
        pillar,
        intent_primary:   "service_booking",
        intent_secondary: intentSecondary || [serviceName],
        life_state:    pillar,
        channel:       ch,
        initial_message: {
          sender: "parent",
          text: extraMessage || `I'd like to book ${serviceName} for ${petName}. Please arrange.`,
        },
      };

      const res = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setTicketId(data.ticket_id || data.session_id);
      }
      setBooked(true);
    } catch (err) {
      console.error("[useBookConcierge] Error:", err);
      setBooked(true); // still show success to user
    } finally {
      setBooking(false);
    }
  }, [pet, pillar, token, booking]);

  const reset = useCallback(() => {
    setBooked(false);
    setTicketId(null);
  }, []);

  return { book, booking, booked, ticketId, reset };
}
