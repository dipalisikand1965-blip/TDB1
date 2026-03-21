"""
Mobile Audit Test — The Doggy Company
Tests: MOBILE-1 through MOBILE-10
Viewport: 375x812 (iPhone SE / standard mobile)
"""

import asyncio
import os

BASE_URL = "https://intent-ticket-flow.preview.emergentagent.com"
USER_EMAIL = "dipali@clubconcierge.in"
USER_PASS = "test123"
ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"

results = {}

async def run_mobile_tests(page):
    # Set mobile viewport - 375x812
    await page.set_viewport_size({"width": 375, "height": 812})
    page.on("console", lambda msg: print(f"  [CONSOLE] {msg.type}: {msg.text[:120]}") if msg.type in ["error", "warn"] else None)

    # ─────────────────────────────────────────────────────────────
    # MOBILE-1: Login page on mobile
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-1: Login page on mobile ===")
    try:
        await page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # Check mobile portraits visible
        kouros_mobile = await page.query_selector('[data-testid="kouros-portrait-mobile"]')
        mystique_mobile = await page.query_selector('[data-testid="mystique-portrait-mobile"]')

        kouros_visible = False
        mystique_visible = False
        if kouros_mobile:
            kouros_visible = await kouros_mobile.is_visible()
        if mystique_mobile:
            mystique_visible = await mystique_mobile.is_visible()

        # Check form elements
        email_input = await page.query_selector('[data-testid="login-email-input"]')
        pass_input = await page.query_selector('[data-testid="login-password-input"]')
        submit_btn = await page.query_selector('[data-testid="login-submit-btn"]')

        form_ok = email_input and pass_input and submit_btn
        email_visible = await email_input.is_visible() if email_input else False
        pass_visible = await pass_input.is_visible() if pass_input else False
        btn_visible = await submit_btn.is_visible() if submit_btn else False

        # Check form doesn't overflow - check bounding box
        if email_input:
            bbox = await email_input.bounding_box()
            form_width_ok = bbox and bbox['width'] > 0 and (bbox['x'] + bbox['width']) <= 375
        else:
            form_width_ok = False

        # Take screenshot
        await page.screenshot(path=".screenshots/mobile_1_login.jpg", quality=40, full_page=False)

        pass1 = kouros_visible and mystique_visible and email_visible and pass_visible and btn_visible and form_width_ok
        results["MOBILE-1"] = {
            "status": "PASS" if pass1 else "FAIL",
            "kouros_portrait_visible": kouros_visible,
            "mystique_portrait_visible": mystique_visible,
            "email_input_visible": email_visible,
            "pass_input_visible": pass_visible,
            "submit_btn_visible": btn_visible,
            "form_not_overflow": form_width_ok,
        }
        print(f"  Result: {'PASS' if pass1 else 'FAIL'}")
        print(f"  Kouros: {kouros_visible}, Mystique: {mystique_visible}, Form: {form_ok}")

        # Now do login for subsequent tests
        await page.fill('[data-testid="login-email-input"]', USER_EMAIL)
        await page.fill('[data-testid="login-password-input"]', USER_PASS)
        await page.click('[data-testid="login-submit-btn"]')
        await page.wait_for_url("**/pet-home**", timeout=15000)
        print("  Login successful, redirected to /pet-home")

    except Exception as e:
        results["MOBILE-1"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # MOBILE-2: Pet Home soul score on mobile
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-2: Pet Home soul score on mobile ===")
    try:
        await page.wait_for_timeout(2000)

        # Check pet hero section is visible
        pet_hero = await page.query_selector('[data-testid="pet-hero"]')
        hero_visible = await pet_hero.is_visible() if pet_hero else False

        # Check soul ring - look for a canvas or SVG arc or specific element
        # Soul score display might be in the pet-hero
        soul_score_els = await page.query_selector_all('[data-testid*="soul"], [data-testid*="soul-score"], .soul-ring, canvas')
        soul_ring_present = len(soul_score_els) > 0

        # More specifically, check for soul chapter pills
        chapter_ids = ["identity", "behaviour", "health", "social", "nutrition", "learning"]
        pills_found = []
        for ch in chapter_ids:
            pill = await page.query_selector(f'[data-testid="soul-chapter-pill-{ch}"]')
            if pill:
                visible = await pill.is_visible()
                pills_found.append({"id": ch, "visible": visible})
        
        visible_pills = sum(1 for p in pills_found if p["visible"])

        # Check soul score text visible
        soul_score_text = await page.evaluate("""() => {
            const els = Array.from(document.querySelectorAll('[data-testid="pet-hero"] *'));
            const scoreEl = els.find(el => el.textContent.match(/\\d+%|soul/i));
            return scoreEl ? scoreEl.textContent.trim().slice(0, 30) : null;
        }""")

        # Check pills don't overflow horizontally
        overflow_ok = True
        for ch in chapter_ids:
            pill = await page.query_selector(f'[data-testid="soul-chapter-pill-{ch}"]')
            if pill:
                bbox = await pill.bounding_box()
                if bbox and (bbox['x'] + bbox['width']) > 380:
                    overflow_ok = False
                    print(f"  WARNING: Chapter pill {ch} overflows: x={bbox['x']}, w={bbox['width']}")

        await page.screenshot(path=".screenshots/mobile_2_pet_home.jpg", quality=40, full_page=False)

        pass2 = hero_visible and visible_pills >= 6 and overflow_ok
        results["MOBILE-2"] = {
            "status": "PASS" if pass2 else "FAIL",
            "pet_hero_visible": hero_visible,
            "soul_score_text": soul_score_text,
            "soul_ring_present": soul_ring_present,
            "chapter_pills_visible": visible_pills,
            "pills_no_overflow": overflow_ok,
            "pills_detail": pills_found,
        }
        print(f"  Result: {'PASS' if pass2 else 'FAIL'}")
        print(f"  Hero: {hero_visible}, Visible pills: {visible_pills}/6, No overflow: {overflow_ok}")
        print(f"  Soul score text: {soul_score_text}")

    except Exception as e:
        results["MOBILE-2"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # MOBILE-3: Care pillar — Book via Concierge → modal scrollable → Send → toast
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-3: Care pillar booking modal on mobile ===")
    try:
        await page.goto(f"{BASE_URL}/care", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2500)

        # Find a "Book via Concierge" button
        book_btn = await page.query_selector('button:has-text("Book via Concierge"), a:has-text("Book via Concierge")')

        if not book_btn:
            # Try text-based approach
            book_btn = await page.evaluate("""() => {
                const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
                const btn = buttons.find(b => b.textContent.includes('Book via Concierge') || b.textContent.includes('Book →'));
                return btn ? true : false;
            }""")
            if book_btn:
                print("  Found 'Book via Concierge' via text search")
                await page.evaluate("""() => {
                    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
                    const btn = buttons.find(b => b.textContent.includes('Book via Concierge') || b.textContent.includes('Book →'));
                    if (btn) btn.click();
                }""")
            else:
                # Try service card
                await page.evaluate("""() => {
                    const els = Array.from(document.querySelectorAll('[data-testid*="care-service-"]'));
                    if (els.length > 0) els[0].click();
                }""")
        else:
            await page.scroll_into_view_if_needed('[data-testid*="care-service-"]:first-child') if await page.query_selector('[data-testid*="care-service-"]') else None
            await book_btn.scroll_into_view_if_needed()
            await book_btn.click(force=True)

        await page.wait_for_timeout(1500)

        # Check for modal opening - look for ServiceBookingModal or ConciergeModal
        modal_el = await page.query_selector('[role="dialog"], .modal, [data-testid*="modal"], [data-testid*="concierge"]')
        modal_visible = await modal_el.is_visible() if modal_el else False

        if not modal_visible:
            # Try another approach - click on a service card directly
            service_cards = await page.query_selector_all('[data-testid*="care-service-"]')
            if service_cards:
                await service_cards[0].scroll_into_view_if_needed()
                await service_cards[0].click(force=True)
                await page.wait_for_timeout(1500)
                modal_el = await page.query_selector('[role="dialog"], .modal, [data-testid*="modal"]')
                modal_visible = await modal_el.is_visible() if modal_el else False

        print(f"  Modal visible: {modal_visible}")

        # Check modal scrollability
        modal_scrollable = False
        if modal_visible and modal_el:
            scroll_height = await modal_el.evaluate("el => el.scrollHeight")
            client_height = await modal_el.evaluate("el => el.clientHeight")
            modal_scrollable = scroll_height > client_height
            print(f"  Modal scroll: scrollHeight={scroll_height}, clientHeight={client_height}")

        # Try to scroll modal
        if modal_visible and modal_el:
            await modal_el.evaluate("el => el.scrollTop = 100")

        # Look for send/submit button in modal
        send_btn = await page.query_selector('[data-testid="submit-care-request-btn"], button:has-text("Send to Concierge"), button:has-text("Send →"), button:has-text("Book"), button:has-text("Send")')

        modal_has_send = send_btn is not None
        if send_btn:
            btn_visible_in_modal = await send_btn.is_visible()
            # Check button size (min 44px touch target)
            bbox = await send_btn.bounding_box()
            btn_size_ok = bbox and bbox['height'] >= 40
            print(f"  Send button height: {bbox['height'] if bbox else 'N/A'}px (min 44px)")
        else:
            btn_visible_in_modal = False
            btn_size_ok = False

        await page.screenshot(path=".screenshots/mobile_3_care_modal.jpg", quality=40, full_page=False)

        # Try clicking send to test toast
        toast_appeared = False
        if send_btn and btn_visible_in_modal:
            try:
                await send_btn.click(force=True)
                await page.wait_for_timeout(2000)
                # Check for toast
                toast = await page.query_selector('[data-state="open"][role="status"], .toast, [class*="toast"], [data-testid*="toast"]')
                toast_appeared = toast is not None and await toast.is_visible()
                if not toast_appeared:
                    # Check for success message text
                    success_text = await page.evaluate("""() => {
                        const body = document.body.innerText;
                        return body.includes('Concierge') && (body.includes('sent') || body.includes('request') || body.includes('✓')) ? true : false;
                    }""")
                    toast_appeared = success_text
                print(f"  Toast/success appeared: {toast_appeared}")
            except Exception as te:
                print(f"  Send click failed: {te}")

        pass3 = modal_visible
        results["MOBILE-3"] = {
            "status": "PASS" if pass3 else "FAIL",
            "modal_opened": modal_visible,
            "modal_scrollable": modal_scrollable,
            "modal_has_send_btn": modal_has_send,
            "send_btn_visible": btn_visible_in_modal,
            "send_btn_size_ok_40px": btn_size_ok,
            "toast_or_success_shown": toast_appeared,
        }
        print(f"  Result: {'PASS' if pass3 else 'FAIL'}")

    except Exception as e:
        results["MOBILE-3"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # MOBILE-4: Verify ticket created in admin inbox after mobile booking
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-4: Verify ticket in admin inbox ===")
    try:
        # First create a booking ticket via API directly to test admin inbox
        import requests
        import json

        # Login as user to get token
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": USER_EMAIL, "password": USER_PASS})
        if login_res.status_code == 200:
            token = login_res.json().get("token") or login_res.json().get("access_token")
            print(f"  Got user token: {bool(token)}")

            # Create a test booking ticket
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            ticket_res = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", headers=headers, json={
                "parent_id": USER_EMAIL,
                "pet_id": "",
                "pillar": "care",
                "intent_primary": "booking_intent",
                "channel": "mobile_test",
                "urgency": "high",
                "life_state": "PLAN",
                "status": "open",
                "initial_message": {
                    "sender": "system",
                    "text": "MOBILE TEST: Mojo's parent wants to book: Full Grooming via mobile_test (keepalive:true test)",
                    "metadata": {"auto_tracked": True, "channel": "mobile_test", "keepalive_test": True}
                }
            }, timeout=10)

            ticket_created = ticket_res.status_code == 200
            ticket_id = None
            if ticket_created:
                ticket_id = ticket_res.json().get("ticket_id") or ticket_res.json().get("id")
                print(f"  Ticket created: {ticket_id}")

            # Now check if admin can see it - login as admin
            admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_USER, "password": ADMIN_PASS})
            admin_visible_in_inbox = False
            admin_service_desk_visible = False

            if admin_login.status_code == 200:
                admin_token = admin_login.json().get("token") or admin_login.json().get("access_token")
                admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}

                # Check admin service desk tickets (the correct endpoint)
                sd_res = requests.get(f"{BASE_URL}/api/service_desk/tickets?limit=20", headers=admin_headers, timeout=10)
                if sd_res.status_code == 200:
                    sd_data = sd_res.json()
                    sd_tickets = sd_data if isinstance(sd_data, list) else sd_data.get("tickets", [])
                    admin_service_desk_visible = any(t.get("ticket_id") == ticket_id for t in sd_tickets) if ticket_id else len(sd_tickets) > 0
                    print(f"  service_desk/tickets returned {len(sd_tickets)} tickets, our ticket visible: {admin_service_desk_visible}")

                # Check old admin tickets endpoint
                old_res = requests.get(f"{BASE_URL}/api/tickets/", headers=admin_headers, timeout=10)
                if old_res.status_code == 200:
                    old_data = old_res.json()
                    old_tickets = old_data if isinstance(old_data, list) else old_data.get("tickets", [])
                    admin_visible_in_inbox = any(t.get("ticket_id") == ticket_id for t in old_tickets) if ticket_id else False
                    print(f"  /api/tickets/ returned {len(old_tickets)} tickets, our ticket visible: {admin_visible_in_inbox}")
            else:
                print(f"  Admin login failed: {admin_login.status_code}")

            pass4 = ticket_created and admin_service_desk_visible
            results["MOBILE-4"] = {
                "status": "PASS" if pass4 else "FAIL",
                "ticket_created_via_api": ticket_created,
                "ticket_id": ticket_id,
                "ticket_visible_in_service_desk_endpoint": admin_service_desk_visible,
                "ticket_visible_in_old_admin_inbox_endpoint": admin_visible_in_inbox,
                "note": "Admin DoggyServiceDesk.jsx uses /api/tickets/ (OLD endpoint). Tickets from tdc.book go to service_desk_tickets via /api/service_desk/attach_or_create_ticket. These are different collections, so admin inbox DOES NOT show mobile booking tickets." if ticket_created and not admin_visible_in_inbox else ""
            }
            print(f"  Result: {'PASS' if pass4 else 'FAIL'}")
        else:
            results["MOBILE-4"] = {"status": "FAIL", "error": f"User login failed: {login_res.status_code}"}

    except Exception as e:
        results["MOBILE-4"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # MOBILE-5: /my-requests on mobile
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-5: /my-requests on mobile ===")
    try:
        await page.goto(f"{BASE_URL}/my-requests", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # Check page loaded
        title_el = await page.query_selector('div:has-text("My Requests")')
        page_loaded = title_el is not None

        # Check ticket cards exist
        ticket_cards = await page.evaluate("""() => {
            // Look for ticket-like cards
            const cards = Array.from(document.querySelectorAll('[style*="border-radius: 14px"], [style*="borderRadius"]'));
            return cards.filter(c => c.style.cursor === 'pointer' || c.onclick !== null).length;
        }""")
        print(f"  Ticket-like tappable cards found: {ticket_cards}")

        # Check if loading spinner or real content
        loading_text = await page.evaluate("""() => {
            const body = document.body.innerText;
            return body.includes('Loading your requests') ? 'loading' : body.includes('No requests yet') ? 'empty' : 'has_tickets';
        }""")
        print(f"  Page state: {loading_text}")

        # Wait for content
        if loading_text == "loading":
            await page.wait_for_timeout(3000)

        # Check for pink unread dot (has_unread_concierge_reply) 
        unread_dots = await page.evaluate("""() => {
            // Pink dot: background #C96D9E, width 7px, height 7px, border-radius 50%
            const els = Array.from(document.querySelectorAll('*'));
            return els.filter(el => {
                const s = el.style;
                return s.background === 'rgb(201, 109, 158)' || s.backgroundColor === 'rgb(201, 109, 158)' || 
                       (s.width === '7px' && s.height === '7px' && s.borderRadius === '50%');
            }).length;
        }""")
        print(f"  Pink unread dots found: {unread_dots}")

        # Try clicking a ticket card
        clicked_ticket = False
        try:
            await page.evaluate("""() => {
                const cards = Array.from(document.querySelectorAll('[style*="cursor: pointer"]'));
                if (cards.length > 0) cards[0].click();
            }""")
            await page.wait_for_timeout(1000)
            # Check if thread view appeared (should show ← Back button)
            back_btn = await page.query_selector('button:has-text("← Back"), button:has-text("Back")')
            clicked_ticket = back_btn is not None
            print(f"  Ticket tap → thread view opened: {clicked_ticket}")
        except Exception as te:
            print(f"  Ticket click failed: {te}")

        # Check cards are not overflowing on mobile
        overflow_check = await page.evaluate("""() => {
            const viewportW = window.innerWidth;
            const cards = Array.from(document.querySelectorAll('[style*="borderRadius: 14px"], [style*="border-radius: 14px"]'));
            return cards.filter(c => {
                const rect = c.getBoundingClientRect();
                return rect.right > viewportW + 5;
            }).length;
        }""")
        no_overflow = overflow_check == 0

        await page.screenshot(path=".screenshots/mobile_5_my_requests.jpg", quality=40, full_page=False)

        pass5 = page_loaded and loading_text != "loading"
        results["MOBILE-5"] = {
            "status": "PASS" if pass5 else "FAIL",
            "page_loaded": page_loaded,
            "content_state": loading_text,
            "tappable_ticket_cards": ticket_cards,
            "pink_unread_dots": unread_dots,
            "ticket_tap_opens_thread": clicked_ticket,
            "no_card_overflow": no_overflow,
        }
        print(f"  Result: {'PASS' if pass5 else 'FAIL'}")

    except Exception as e:
        results["MOBILE-5"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # MOBILE-6: Celebrate NearMe on mobile — NearMeConciergeModal
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-6: Celebrate NearMe modal on mobile ===")
    try:
        await page.goto(f"{BASE_URL}/celebrate", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2500)

        # Look for NearMe section or "Book via Concierge" button in celebrate page
        book_btn = await page.evaluate("""() => {
            const els = Array.from(document.querySelectorAll('button, a, [role="button"]'));
            const btn = els.find(e => e.textContent.includes('Book via Concierge'));
            return btn ? btn.textContent.trim().slice(0,50) : null;
        }""")
        print(f"  'Book via Concierge' text found: {book_btn}")

        if book_btn:
            # Click it
            await page.evaluate("""() => {
                const els = Array.from(document.querySelectorAll('button, a, [role="button"]'));
                const btn = els.find(e => e.textContent.includes('Book via Concierge'));
                if (btn) btn.click();
            }""")
            await page.wait_for_timeout(1500)

            # Check modal opened
            modal = await page.query_selector('[data-testid="nearme-concierge-send-btn"]')
            modal_visible = await modal.is_visible() if modal else False

            if modal_visible:
                print("  NearMeConciergeModal opened with Send button!")
                # Check venue name pre-filled in header
                venue_name_filled = await page.evaluate("""() => {
                    const header = document.querySelector('h2');
                    return header ? header.textContent.trim() : null;
                }""")
                print(f"  Venue name in header: {venue_name_filled}")

                # Check modal is within viewport (scrollable)
                modal_container = await page.query_selector('[style*="position: fixed"][style*="top: 50%"], [style*="position:fixed"][style*="top:50%"]')
                if not modal_container:
                    modal_container = await page.query_selector('[style*="translate(-50%,-50%)"]')
                
                modal_fits = True
                if modal_container:
                    bbox = await modal_container.bounding_box()
                    if bbox:
                        modal_fits = bbox['height'] <= 812 and bbox['width'] <= 375
                        print(f"  Modal size: {bbox['width']}x{bbox['height']} (viewport 375x812)")
                        if not modal_fits:
                            print("  WARNING: Modal exceeds viewport - needs scrolling")

                # Check date input and textarea accessible
                date_input = await page.query_selector('input[type="date"]')
                textarea = await page.query_selector('textarea')
                date_visible = await date_input.is_visible() if date_input else False
                textarea_visible = await textarea.is_visible() if textarea else False

                # Check send button size
                send_btn = await page.query_selector('[data-testid="nearme-concierge-send-btn"]')
                if send_btn:
                    bbox = await send_btn.bounding_box()
                    btn_h = bbox['height'] if bbox else 0
                    print(f"  Send button height: {btn_h}px")

                await page.screenshot(path=".screenshots/mobile_6_nearme_modal.jpg", quality=40, full_page=False)

                pass6 = modal_visible
                results["MOBILE-6"] = {
                    "status": "PASS" if pass6 else "FAIL",
                    "modal_opened": modal_visible,
                    "venue_pre_filled": bool(venue_name_filled),
                    "venue_name": venue_name_filled,
                    "modal_fits_viewport": modal_fits,
                    "date_input_visible": date_visible,
                    "textarea_visible": textarea_visible,
                }
            else:
                # Try from CelebrateNearMe component - scroll down to find venue cards
                await page.evaluate("window.scrollTo(0, 600)")
                await page.wait_for_timeout(500)
                near_me_btns = await page.query_selector_all('button:has-text("Book via Concierge")')
                print(f"  NearMe Book buttons after scroll: {len(near_me_btns)}")
                results["MOBILE-6"] = {
                    "status": "FAIL",
                    "modal_opened": False,
                    "note": "No NearMeConciergeModal found — possibly needs venue to be selected first from NearMe section"
                }
        else:
            results["MOBILE-6"] = {
                "status": "FAIL",
                "note": "No 'Book via Concierge' button found on /celebrate page"
            }

        print(f"  Result: {results['MOBILE-6']['status']}")

    except Exception as e:
        results["MOBILE-6"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # MOBILE-7: Mira chat widget on mobile
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-7: Mira chat widget on mobile ===")
    try:
        await page.goto(f"{BASE_URL}/pet-home", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # Find Mira floating button
        mira_float_btn = await page.query_selector('[data-testid="mira-floating-btn"]')
        btn_visible = await mira_float_btn.is_visible() if mira_float_btn else False
        print(f"  Mira floating button visible: {btn_visible}")

        # Check button size (min 44px for mobile)
        if mira_float_btn and btn_visible:
            bbox = await mira_float_btn.bounding_box()
            btn_size_ok = bbox and bbox['height'] >= 40 and bbox['width'] >= 40
            print(f"  Mira button size: {bbox['width'] if bbox else 'N/A'}x{bbox['height'] if bbox else 'N/A'}px")
        else:
            btn_size_ok = False

        # Open Mira widget
        if mira_float_btn and btn_visible:
            await mira_float_btn.click(force=True)
            await page.wait_for_timeout(1500)

        # Check widget opened
        widget = await page.query_selector('[data-testid="mira-chat-widget"]')
        widget_visible = await widget.is_visible() if widget else False
        print(f"  Mira chat widget opened: {widget_visible}")

        # Try via event dispatch if not opened
        if not widget_visible:
            await page.evaluate("window.dispatchEvent(new CustomEvent('openMiraAI'))")
            await page.wait_for_timeout(1500)
            widget = await page.query_selector('[data-testid="mira-chat-widget"]')
            widget_visible = await widget.is_visible() if widget else False

        # Send a message
        msg_sent = False
        response_received = False
        if widget_visible:
            # Find input in widget
            widget_input = await page.query_selector('[data-testid="mira-chat-widget"] textarea, [data-testid="mira-chat-widget"] input[type="text"]')
            if not widget_input:
                widget_input = await page.query_selector('textarea[placeholder*="Ask"], textarea[placeholder*="Mira"], input[placeholder*="Ask"]')
            
            if widget_input:
                input_visible = await widget_input.is_visible()
                if input_visible:
                    await widget_input.click(force=True)
                    await widget_input.fill("What food is best for my dog?")
                    await page.wait_for_timeout(300)

                    # Send
                    send_btn = await page.query_selector('[data-testid="mira-widget-send"]')
                    if send_btn:
                        await send_btn.click(force=True)
                    else:
                        await widget_input.press("Enter")
                    
                    msg_sent = True
                    print("  Message sent, waiting for response...")
                    await page.wait_for_timeout(5000)  # Wait for AI response

                    # Check for response (streaming)
                    response_text = await page.evaluate("""() => {
                        const msgs = Array.from(document.querySelectorAll('[data-testid="mira-chat-widget"] [class*="message"], [data-testid="mira-chat-widget"] p, [data-testid="mira-chat-widget"] div'));
                        const content = msgs.map(m => m.textContent.trim()).filter(t => t.length > 10 && !t.includes('Ask Mira'));
                        return content.slice(0, 3);
                    }""")
                    response_received = len(response_text) > 0
                    print(f"  Response received: {response_received}")
                    if response_text:
                        print(f"  Response preview: {str(response_text[0])[:100]}")

        await page.screenshot(path=".screenshots/mobile_7_mira_widget.jpg", quality=40, full_page=False)

        # Check widget doesn't overflow
        widget_fits = True
        if widget and widget_visible:
            bbox = await widget.bounding_box()
            if bbox:
                widget_fits = bbox['width'] <= 380
                print(f"  Widget width: {bbox['width']}px (should be ≤375px)")

        pass7 = btn_visible and widget_visible
        results["MOBILE-7"] = {
            "status": "PASS" if pass7 else "FAIL",
            "mira_floating_btn_visible": btn_visible,
            "btn_size_ok_40px": btn_size_ok,
            "widget_opened": widget_visible,
            "widget_fits_mobile": widget_fits,
            "message_sent": msg_sent,
            "response_received": response_received,
        }
        print(f"  Result: {'PASS' if pass7 else 'FAIL'}")

    except Exception as e:
        results["MOBILE-7"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # MOBILE-8: Shop Browse on mobile — all tabs load products
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-8: Shop browse on mobile ===")
    try:
        await page.goto(f"{BASE_URL}/shop", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2500)

        # Check for shop page
        shop_loaded = await page.evaluate("""() => document.body.innerText.includes('Shop') || document.title.toLowerCase().includes('shop')""")
        print(f"  Shop page loaded: {shop_loaded}")

        # Find tabs - Everything / Celebrate / Care
        tabs_found = {}
        for tab_name in ["Everything", "Celebrate", "Care", "All"]:
            tab = await page.query_selector(f'button:has-text("{tab_name}"), [role="tab"]:has-text("{tab_name}")')
            if tab:
                tabs_found[tab_name] = await tab.is_visible()

        print(f"  Tabs found: {tabs_found}")

        # Check products visible
        products = await page.evaluate("""() => {
            const cards = Array.from(document.querySelectorAll('[class*="product"], [data-testid*="product"], [class*="card"]'));
            return cards.filter(c => c.offsetHeight > 50).length;
        }""")
        print(f"  Product cards visible: {products}")

        # Click tabs and verify each loads
        tab_results = {}
        for tab_name in list(tabs_found.keys())[:3]:
            try:
                tab = await page.query_selector(f'button:has-text("{tab_name}"), [role="tab"]:has-text("{tab_name}")')
                if tab and tabs_found.get(tab_name):
                    await tab.click(force=True)
                    await page.wait_for_timeout(1500)
                    # Check products visible after tab switch
                    products_after = await page.evaluate("""() => {
                        const cards = Array.from(document.querySelectorAll('[class*="product"], [data-testid*="product"]'));
                        return cards.filter(c => c.offsetHeight > 50).length;
                    }""")
                    tab_results[tab_name] = {"products": products_after, "ok": products_after > 0}
                    print(f"  Tab '{tab_name}': {products_after} products")
            except Exception as te:
                tab_results[tab_name] = {"error": str(te)}

        await page.screenshot(path=".screenshots/mobile_8_shop.jpg", quality=40, full_page=False)

        pass8 = shop_loaded and products > 0
        results["MOBILE-8"] = {
            "status": "PASS" if pass8 else "FAIL",
            "shop_page_loaded": shop_loaded,
            "tabs_found": tabs_found,
            "initial_products": products,
            "tab_results": tab_results,
        }
        print(f"  Result: {'PASS' if pass8 else 'FAIL'}")

    except Exception as e:
        results["MOBILE-8"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # MOBILE-9: Navbar hamburger menu on mobile
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-9: Navbar hamburger menu on mobile ===")
    try:
        await page.goto(f"{BASE_URL}/pet-home", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(2000)

        # Find hamburger button
        hamburger = await page.query_selector('[data-testid="navbar-mobile-menu-btn"]')
        hamburger_visible = await hamburger.is_visible() if hamburger else False
        print(f"  Hamburger button visible: {hamburger_visible}")

        # Check hamburger size (min 44px)
        if hamburger:
            bbox = await hamburger.bounding_box()
            hamburger_size_ok = bbox and bbox['height'] >= 40 and bbox['width'] >= 40
            print(f"  Hamburger size: {bbox['width'] if bbox else 'N/A'}x{bbox['height'] if bbox else 'N/A'}px")
        else:
            hamburger_size_ok = False

        # Click hamburger to open menu
        sidebar_opened = False
        if hamburger and hamburger_visible:
            await hamburger.click(force=True)
            await page.wait_for_timeout(1000)
            
            # Check sidebar or menu opened
            sidebar = await page.query_selector('[data-testid="mobile-dashboard-link"], [data-testid="mobile-my-requests-link"], [data-testid="mobile-logout-btn"]')
            sidebar_opened = sidebar is not None and await sidebar.is_visible()
            print(f"  Sidebar opened: {sidebar_opened}")

        # Count accessible pillar links in sidebar
        pillar_links_accessible = 0
        if sidebar_opened:
            # Check for pillar links
            pillar_ids = ["celebrate", "care", "dine", "go", "play", "learn", "shop", "paperwork", "emergency", "adopt", "farewell", "services"]
            for p in pillar_ids:
                link = await page.query_selector(f'[data-testid="nav-{p}"], a[href="/{p}"], a[href*="{p}"]')
                if link and await link.is_visible():
                    pillar_links_accessible += 1

            # Also check within expanded sidebar
            all_links = await page.evaluate("""() => {
                const links = Array.from(document.querySelectorAll('a[href]'));
                const pillars = ['celebrate', 'care', 'dine', 'go', 'play', 'learn', 'shop', 'paperwork', 'emergency', 'adopt', 'farewell', 'services'];
                return pillars.filter(p => links.some(l => l.href.includes('/'+p) && l.offsetParent !== null)).length;
            }""")
            pillar_links_accessible = max(pillar_links_accessible, all_links)
            print(f"  Pillar links accessible in mobile menu: {pillar_links_accessible}/12")

        await page.screenshot(path=".screenshots/mobile_9_navbar.jpg", quality=40, full_page=False)

        pass9 = hamburger_visible and sidebar_opened
        results["MOBILE-9"] = {
            "status": "PASS" if pass9 else "FAIL",
            "hamburger_visible": hamburger_visible,
            "hamburger_size_ok_40px": hamburger_size_ok,
            "sidebar_opened": sidebar_opened,
            "pillar_links_accessible": pillar_links_accessible,
        }
        print(f"  Result: {'PASS' if pass9 else 'FAIL'}")

    except Exception as e:
        results["MOBILE-9"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # MOBILE-10: Footer on mobile
    # ─────────────────────────────────────────────────────────────
    print("\n=== MOBILE-10: Footer on mobile ===")
    try:
        await page.goto(f"{BASE_URL}/pet-home", wait_until="networkidle", timeout=30000)
        await page.wait_for_timeout(1500)

        # Scroll to footer
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1000)

        # Check phone number
        phone_visible = await page.evaluate("""() => {
            return document.body.innerText.includes('+91 97399 08844');
        }""")
        print(f"  Phone +91 97399 08844 visible: {phone_visible}")

        # Check email
        email_visible = await page.evaluate("""() => {
            return document.body.innerText.includes('woof@thedoggycompany.com');
        }""")
        print(f"  Email woof@thedoggycompany.com visible: {email_visible}")

        # Check footer sections collapse/expand
        footer = await page.query_selector('footer')
        footer_visible = await footer.is_visible() if footer else False

        # Check mobile footer sections (collapsible)
        footer_sections = await page.query_selector_all('footer button:has-text("Pet Life Pillars"), footer button:has-text("Services"), footer button:has-text("Contact")')
        mobile_footer_sections = len(footer_sections)
        print(f"  Mobile footer collapsible sections: {mobile_footer_sections}")

        # Click Contact to expand
        contact_section = await page.query_selector('footer button:has-text("Contact")')
        phone_in_contact = False
        if contact_section and await contact_section.is_visible():
            await contact_section.click(force=True)
            await page.wait_for_timeout(500)
            # Check phone visible after expanding
            phone_el = await page.query_selector('footer a[href*="97399"]')
            phone_in_contact = phone_el is not None and await phone_el.is_visible()
            print(f"  Phone visible in expanded contact section: {phone_in_contact}")

        # Check links don't overflow
        overflow_count = await page.evaluate("""() => {
            const footer = document.querySelector('footer');
            if (!footer) return -1;
            const links = Array.from(footer.querySelectorAll('a, button'));
            return links.filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.right > window.innerWidth + 5;
            }).length;
        }""")
        no_overflow = overflow_count == 0
        print(f"  Footer links overflow count: {overflow_count}")

        await page.screenshot(path=".screenshots/mobile_10_footer.jpg", quality=40, full_page=False)

        pass10 = phone_visible and email_visible and footer_visible
        results["MOBILE-10"] = {
            "status": "PASS" if pass10 else "FAIL",
            "footer_visible": footer_visible,
            "phone_number_visible": phone_visible,
            "email_visible": email_visible,
            "collapsible_sections_count": mobile_footer_sections,
            "phone_in_contact_section": phone_in_contact,
            "links_no_overflow": no_overflow,
        }
        print(f"  Result: {'PASS' if pass10 else 'FAIL'}")

    except Exception as e:
        results["MOBILE-10"] = {"status": "FAIL", "error": str(e)}
        print(f"  FAIL: {e}")

    # ─────────────────────────────────────────────────────────────
    # SUMMARY
    # ─────────────────────────────────────────────────────────────
    print("\n" + "="*60)
    print("MOBILE AUDIT SUMMARY")
    print("="*60)
    pass_count = sum(1 for r in results.values() if r.get("status") == "PASS")
    fail_count = sum(1 for r in results.values() if r.get("status") == "FAIL")
    print(f"PASS: {pass_count}/10  FAIL: {fail_count}/10")
    for test_id, result in results.items():
        status = result.get("status", "UNKNOWN")
        emoji = "✅" if status == "PASS" else "❌"
        print(f"  {emoji} {test_id}: {status}")
        if status == "FAIL" and "error" in result:
            print(f"      Error: {result['error']}")
        if status == "FAIL" and "note" in result:
            print(f"      Note: {result['note']}")
    
    return results


# Main entry point
page.on("console", lambda msg: None)  # prevent double-binding
results_data = await run_mobile_tests(page)

# Export for test report
import json
print("\n\nFINAL_RESULTS_JSON:", json.dumps(results_data, indent=2))
