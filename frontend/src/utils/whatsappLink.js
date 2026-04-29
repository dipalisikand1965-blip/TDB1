// Generates a WhatsApp deep link that works on BOTH desktop and mobile.
// Why: `https://wa.me/<phone>` 301-redirects to `api.whatsapp.com/send/...`
// on desktop, and many corporate / ISP firewalls (and some browsers) block
// `api.whatsapp.com`, returning ERR_BLOCKED_BY_RESPONSE. Routing desktop
// users straight to `web.whatsapp.com/send` skips that broken redirect.
//
// Usage: <a href={waLink('919739908844', 'Hi!')}>Chat</a>
export function waLink(phone, text = "") {
  const cleaned = String(phone || "").replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(text || "");
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
  if (isMobile) {
    return `https://wa.me/${cleaned}${encoded ? `?text=${encoded}` : ""}`;
  }
  // Desktop / unknown — open WhatsApp Web directly, no api.whatsapp.com hop.
  return `https://web.whatsapp.com/send?phone=${cleaned}${
    encoded ? `&text=${encoded}` : ""
  }`;
}
