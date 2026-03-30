import { useState, useCallback } from "react";
import { API_URL } from "../utils/api";
import { getAllergiesFromPet, buildMasterBriefing, buildMasterMetadata } from "../utils/masterBriefing";

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
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const session = JSON.parse(localStorage.getItem("tdb_user_session") || "{}");
      const parentId = user?.id || user?.email || user?.user_id ||
                       session?.id || session?.email ||
                       pet?.owner_id || pet?.owner_email || "guest";
      const petName  = pet?.name || "your dog";
      const ch       = channel || `${pillar}_booking`;

      const details = {
        service_name: serviceName,
        pillar,
        channel: ch,
        notes: extraMessage,
        urgency: 'normal',
      };

      const briefing = buildMasterBriefing(pet, user, 'service_booking', details);
      const metadata = buildMasterMetadata(pet, user, details, {
        intent_secondary: intentSecondary || [serviceName],
        parent_id: parentId,
      });

      const body = {
        parent_id:     parentId,
        pet_id:        pet?.id || pet?._id || "unknown",
        pet_name:      petName,
        pet_breed:     pet?.breed,
        pet_allergies: getAllergiesFromPet(pet),
        parent_email:  user?.email || '',
        parent_name:   user?.name || user?.full_name || '',
        parent_phone:  user?.phone || user?.whatsapp || '',
        pillar,
        intent_primary:   "service_booking",
        intent_secondary: intentSecondary || [serviceName],
        life_state:    "PLAN",
        channel:       ch,
        urgency:       'normal',
        force_new:     true,
        subject:       `Booking Request: ${serviceName} for ${petName}`,
        initial_message: {
          sender: "parent",
          text:   briefing,
          source: ch,
        },
        product_name: serviceName,
        metadata,
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
      setBooked(true);
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
