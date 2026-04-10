"""
email_templates.py — The Doggy Company · Branded Email Template
================================================================
ONE function. All 25 emails. Change here → updates everything.

Reference: "♦ Your Concierge® has your request" email (dark navy, gold, warm cream).
Colours:
  NAVY  = #1a1a3e  (dark navy header / detail boxes)
  GOLD  = #DAA520  (borders, button, accent text)
  CREAM = #F5F5DC  (outer background)
  WHITE = #ffffff  (content card)
"""

NAVY  = "#1a1a3e"
GOLD  = "#DAA520"
CREAM = "#F5F5DC"
WHITE = "#ffffff"
GREY  = "#f9f9f9"
MUTED = "#666666"
BODY  = "#333333"


def detail_row(label: str, value: str) -> str:
    """A single row inside a dark REQUEST DETAILS box."""
    return f"""
        <tr>
          <td style="padding:7px 12px;color:rgba(255,255,255,0.7);
                     font-size:13px;white-space:nowrap;">{label}</td>
          <td style="padding:7px 12px;color:#ffffff;
                     font-size:13px;font-weight:600;">{value}</td>
        </tr>"""


def detail_box(title: str, rows_html: str) -> str:
    """Dark navy box used for REQUEST DETAILS, ORDER SUMMARY, etc."""
    return f"""
    <div style="background:{NAVY};border-radius:10px;
                margin:20px 0;overflow:hidden;">
      <div style="padding:10px 16px;border-bottom:1px solid rgba(218,165,32,0.3);">
        <span style="color:{GOLD};font-size:11px;font-weight:700;
                     letter-spacing:0.12em;text-transform:uppercase;">{title}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        {rows_html}
      </table>
    </div>"""


def cta_button(text: str, url: str) -> str:
    """Gold-bordered button matching the reference template."""
    return f"""
    <div style="text-align:center;margin:28px 0;">
      <a href="{url}"
         style="display:inline-block;padding:13px 32px;
                border:2px solid {GOLD};border-radius:6px;
                color:{NAVY};font-weight:700;font-size:14px;
                text-decoration:none;font-family:'Segoe UI',sans-serif;
                background:{CREAM};">
        {text}
      </a>
    </div>"""


def get_email_template(
    title: str,
    tagline: str,
    body_html: str,
    cta_text: str = "View your request →",
    cta_url: str = "https://thedoggycompany.com/my-requests",
    show_cta: bool = True,
) -> str:
    """
    The ONE branded email wrapper used by every member-facing email.

    Parameters
    ----------
    title     : Large white heading inside the dark navy hero.
                e.g. "Pet Concierge®" / "Order Confirmed" / "Password Reset"
    tagline   : Smaller gold line beneath the title.
                e.g. "✦ Your Concierge® has your request"
    body_html : Raw HTML for the content area (paragraphs, detail_box(), etc.)
    cta_text  : Button label  (pass "" to suppress the button)
    cta_url   : Button href
    show_cta  : Set False to suppress the footer CTA entirely.

    Returns
    -------
    str  Complete HTML email string, ready for resend.Emails.send({"html": ...})
    """
    cta_block = cta_button(cta_text, cta_url) if (show_cta and cta_text) else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:{CREAM};
             font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:{CREAM};padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;">

          <!-- ── GOLD TOP BORDER ── -->
          <tr>
            <td style="height:2px;background:{GOLD};
                       border-radius:4px 4px 0 0;"></td>
          </tr>

          <!-- ── BRAND BAR ── -->
          <tr>
            <td style="background:{NAVY};padding:10px 24px;text-align:center;">
              <span style="color:{GOLD};font-size:11px;font-weight:700;
                           letter-spacing:0.14em;text-transform:uppercase;">
                THE DOGGY COMPANY
              </span>
            </td>
          </tr>

          <!-- ── GOLD SEPARATOR ── -->
          <tr>
            <td style="height:2px;background:{GOLD};"></td>
          </tr>

          <!-- ── HERO HEADER ── -->
          <tr>
            <td style="background:{NAVY};padding:28px 32px 24px;text-align:center;">
              <h1 style="margin:0 0 8px;color:#ffffff;font-size:28px;
                         font-weight:800;letter-spacing:-0.5px;">
                {title}
              </h1>
              <p style="margin:0;color:{GOLD};font-size:14px;font-weight:500;">
                {tagline}
              </p>
            </td>
          </tr>

          <!-- ── CONTENT CARD ── -->
          <tr>
            <td style="background:{WHITE};padding:32px 36px;
                       border-left:1px solid #e8e3d8;
                       border-right:1px solid #e8e3d8;">
              <div style="color:{BODY};font-size:15px;line-height:1.7;">
                {body_html}
              </div>
              {cta_block}
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:{NAVY};padding:20px 32px;
                       border-radius:0 0 4px 4px;text-align:center;">
              <p style="margin:0 0 6px;color:rgba(255,255,255,0.6);
                        font-size:12px;letter-spacing:0.05em;">
                The Doggy Company · Pet Concierge®
              </p>
              <p style="margin:0;color:rgba(255,255,255,0.4);font-size:11px;">
                📞 +91 96631 85747 &nbsp;·&nbsp;
                📧 woof@thedoggycompany.com
              </p>
            </td>
          </tr>

          <!-- ── GOLD BOTTOM BORDER ── -->
          <tr>
            <td style="height:2px;background:{GOLD};
                       border-radius:0 0 4px 4px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>"""
