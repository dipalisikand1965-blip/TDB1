"""
Resize/Rotation Tests for BirthdayBoxBuilder, BirthdayBoxBrowseDrawer, MiraChatWidget
Tests viewport-driven layout switching via ResizeObserver (150ms debounce).
Iteration 126 - Follow-up to iteration_125.
"""

import asyncio

BASE_URL = "https://celebrate-products.preview.emergentagent.com"

# ── helpers ──────────────────────────────────────────────────────────────────

async def login(page):
    await page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(1000)
    email_sel = 'input[type="email"], input[name="email"], [data-testid="email-input"]'
    pwd_sel   = 'input[type="password"], [data-testid="password-input"]'
    await page.fill(email_sel, "dipali@clubconcierge.in")
    await page.fill(pwd_sel, "test123")
    await page.click('button[type="submit"], [data-testid*="submit"], [data-testid*="login"]')
    await page.wait_for_timeout(3000)
    print(f"[login] current URL: {page.url}")


async def navigate_celebrate(page):
    await page.goto(f"{BASE_URL}/celebrate-soul", wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)
    print(f"[nav] at /celebrate-soul")


async def open_builder(page, pet_name="Mojo"):
    """Fire the custom event that opens BirthdayBoxBuilder"""
    await page.evaluate(f"""
        const preset = {{
          petId: 'test-pet-id',
          petName: '{pet_name}',
          visibleSlots: [
            {{slotNumber:1, emoji:'🎂', chipLabel:'Birthday Cake', itemName:'Custom Cake', description:'Yummy cake'}},
            {{slotNumber:2, emoji:'🎁', chipLabel:'Toy', itemName:'Squeaky Toy', description:'Fun toy'}},
            {{slotNumber:3, emoji:'🎀', chipLabel:'Bandana', itemName:'Birthday Bandana', description:'Style'}},
            {{slotNumber:4, emoji:'💌', chipLabel:'Memory Book', itemName:'Memory Album', description:'Memories'}},
          ],
          hiddenSlots: [
            {{slotNumber:5, emoji:'🌿', chipLabel:'Health Treat', itemName:'Organic Treat', description:'Healthy', isAllergySafe:true}},
            {{slotNumber:6, emoji:'🎉', chipLabel:'Surprise', itemName:'Surprise Item', description:'Surprise!', hiddenUntilDelivery:true}},
          ],
          hasAllergies: false,
        }};
        window.dispatchEvent(new CustomEvent('openOccasionBoxBuilder', {{
          detail: {{ preset, petName: '{pet_name}', petId: 'test-pet-id', userEmail: 'dipali@clubconcierge.in', userName: 'Dipali' }}
        }}));
    """)
    await page.wait_for_timeout(600)


async def open_browse_drawer(page, pet_name="Mojo"):
    """Fire the custom event that opens BirthdayBoxBrowseDrawer"""
    await page.evaluate(f"""
        const boxPreview = {{
          petName: '{pet_name}',
          petId: 'test-pet-id',
          visibleSlots: [
            {{slotNumber:1, emoji:'🎂', chipLabel:'Birthday Cake', itemName:'Custom Cake'}},
            {{slotNumber:2, emoji:'🎁', chipLabel:'Toy', itemName:'Squeaky Toy'}},
          ],
          hiddenSlots: [],
          hasAllergies: false,
          allergies: []
        }};
        window.dispatchEvent(new CustomEvent('openBirthdayBoxBrowse', {{
          detail: {{ boxPreview, petName: '{pet_name}' }}
        }}));
    """)
    await page.wait_for_timeout(600)


async def get_modal_align(page, testid):
    """Returns alignItems of the outer wrapper identified by data-testid"""
    return await page.evaluate(f"""() => {{
        const el = document.querySelector('[data-testid="{testid}"]');
        if (!el) return null;
        return window.getComputedStyle(el).alignItems;
    }}""")


async def get_modal_padding(page, testid):
    """Returns paddingTop (px) of outer wrapper"""
    return await page.evaluate(f"""() => {{
        const el = document.querySelector('[data-testid="{testid}"]');
        if (!el) return null;
        return window.getComputedStyle(el).paddingTop;
    }}""")


async def get_modal_zindex(page, testid):
    """Returns zIndex of element"""
    return await page.evaluate(f"""() => {{
        const el = document.querySelector('[data-testid="{testid}"]');
        if (!el) return null;
        return window.getComputedStyle(el).zIndex;
    }}""")


async def console_errors(page):
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    return errors


# ── MAIN TEST ─────────────────────────────────────────────────────────────────

page.on("console", lambda msg: print(f"[BROWSER {msg.type}] {msg.text}") if msg.type in ("error", "warn") else None)
unmounted_errors = []
page.on("console", lambda msg: unmounted_errors.append(msg.text) if "unmounted" in msg.text.lower() or "setState" in msg.text else None)

# ─── 0. Login ─────────────────────────────────────────────────────────────────
try:
    await login(page)
    print("✅ Login step complete")
except Exception as e:
    print(f"❌ Login failed: {e}")

# ─── Navigate to /celebrate-soul ─────────────────────────────────────────────
try:
    await navigate_celebrate(page)
    print("✅ Navigated to /celebrate-soul")
except Exception as e:
    print(f"❌ Navigation failed: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# RESIZE TEST 1 — BirthdayBoxBuilder at 1024px (desktop, should be CENTERED)
# ═══════════════════════════════════════════════════════════════════════════════
print("\n--- RESIZE TEST 1: BirthdayBoxBuilder at 1024px (iPad landscape) ---")
try:
    await page.set_viewport_size({"width": 1024, "height": 768})
    await page.wait_for_timeout(300)  # Allow debounce + re-render

    await open_builder(page)
    await page.wait_for_selector('[data-testid="birthday-box-builder"]', timeout=5000)

    align = await get_modal_align(page, "birthday-box-builder")
    padding_top = await get_modal_padding(page, "birthday-box-builder")

    # Close btn accessible check
    close_btn_box = await page.evaluate("""() => {
        const btn = document.querySelector('[data-testid="builder-close-btn"]');
        if (!btn) return null;
        return btn.getBoundingClientRect();
    }""")

    print(f"  alignItems: {align} (expected: center)")
    print(f"  paddingTop: {padding_top} (expected: 16px)")
    print(f"  Close btn position: {close_btn_box}")

    if align == "center":
        print("  ✅ RESIZE TEST 1 PASS: Desktop layout (centered) at 1024px")
    else:
        print(f"  ❌ RESIZE TEST 1 FAIL: Expected center, got {align}")

    if close_btn_box and close_btn_box.get('top', -1) >= 0:
        print("  ✅ Close btn accessible (positive top position)")
    else:
        print("  ❌ Close btn not accessible")

    # Screenshot at 1024px
    await page.screenshot(path=".screenshots/resize_test1_1024px.png", quality=40, full_page=False)
    print("  📸 Screenshot saved: resize_test1_1024px.png")
except Exception as e:
    print(f"  ❌ RESIZE TEST 1 ERROR: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# RESIZE TEST 2 — Resize to 375px while builder OPEN (should switch to MOBILE)
# ═══════════════════════════════════════════════════════════════════════════════
print("\n--- RESIZE TEST 2: Resize to 375px while BirthdayBoxBuilder open ---")
try:
    await page.set_viewport_size({"width": 375, "height": 844})
    await page.wait_for_timeout(400)  # 150ms debounce + 250ms re-render

    align = await get_modal_align(page, "birthday-box-builder")
    padding_top = await get_modal_padding(page, "birthday-box-builder")

    close_btn_box = await page.evaluate("""() => {
        const btn = document.querySelector('[data-testid="builder-close-btn"]');
        if (!btn) return null;
        return btn.getBoundingClientRect();
    }""")

    print(f"  alignItems: {align} (expected: flex-start)")
    print(f"  paddingTop: {padding_top} (expected: ~110px)")
    print(f"  Close btn top: {close_btn_box.get('top', 'N/A') if close_btn_box else 'N/A'}")

    if align == "flex-start":
        print("  ✅ RESIZE TEST 2 PASS: Mobile layout (flex-start) after resize to 375px")
    else:
        print(f"  ❌ RESIZE TEST 2 FAIL: Expected flex-start, got {align}")

    if close_btn_box and close_btn_box.get('top', -1) > 90:  # Should be ~120px from top
        print(f"  ✅ Close btn accessible at ~{close_btn_box.get('top')}px from top")
    elif close_btn_box:
        print(f"  ⚠ Close btn at {close_btn_box.get('top')}px (might be under sticky header)")
    else:
        print("  ❌ Close btn not found")

    await page.screenshot(path=".screenshots/resize_test2_375px.png", quality=40, full_page=False)
    print("  📸 Screenshot saved: resize_test2_375px.png")
except Exception as e:
    print(f"  ❌ RESIZE TEST 2 ERROR: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# RESIZE TEST 3 — Resize back to 768px (should return to CENTRED)
# ═══════════════════════════════════════════════════════════════════════════════
print("\n--- RESIZE TEST 3: Resize back to 768px (iPad portrait) ---")
try:
    await page.set_viewport_size({"width": 768, "height": 1024})
    await page.wait_for_timeout(400)

    align = await get_modal_align(page, "birthday-box-builder")
    padding_top = await get_modal_padding(page, "birthday-box-builder")

    print(f"  alignItems: {align} (expected: center)")
    print(f"  paddingTop: {padding_top} (expected: 16px)")

    if align == "center":
        print("  ✅ RESIZE TEST 3 PASS: Desktop layout (centered) at 768px")
    else:
        print(f"  ❌ RESIZE TEST 3 FAIL: Expected center, got {align}")

    # Close modal
    close_btn = await page.query_selector('[data-testid="builder-close-btn"]')
    if close_btn:
        await close_btn.click(force=True)
        await page.wait_for_timeout(500)
        print("  ✅ Closed modal via X button")

    # Re-open and check
    await open_builder(page)
    await page.wait_for_selector('[data-testid="birthday-box-builder"]', timeout=5000)
    align_reopen = await get_modal_align(page, "birthday-box-builder")
    print(f"  Re-opened at 768px — alignItems: {align_reopen} (expected: center)")
    if align_reopen == "center":
        print("  ✅ RESIZE TEST 3b PASS: Re-opened modal still centered at 768px")
    else:
        print(f"  ❌ RESIZE TEST 3b FAIL: Expected center, got {align_reopen}")

    # Close again
    close_btn = await page.query_selector('[data-testid="builder-close-btn"]')
    if close_btn:
        await close_btn.click(force=True)
        await page.wait_for_timeout(400)
except Exception as e:
    print(f"  ❌ RESIZE TEST 3 ERROR: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# RESIZE TEST 4 — BirthdayBoxBrowseDrawer at 1024px, then resize to 390px
# ═══════════════════════════════════════════════════════════════════════════════
print("\n--- RESIZE TEST 4: BirthdayBoxBrowseDrawer resize test ---")
try:
    await page.set_viewport_size({"width": 1024, "height": 768})
    await page.wait_for_timeout(300)

    await open_browse_drawer(page)
    await page.wait_for_selector('[data-testid="birthday-box-browse-drawer"]', timeout=5000)

    # Check at 1024px
    align_1024 = await get_modal_align(page, "birthday-box-browse-drawer")
    zindex_1024 = await get_modal_zindex(page, "birthday-box-browse-drawer")
    print(f"  [1024px] alignItems: {align_1024} (expected: center)")
    print(f"  [1024px] zIndex: {zindex_1024} (expected: 9199)")

    if align_1024 == "center":
        print("  ✅ RESIZE TEST 4a PASS: Drawer centred at 1024px")
    else:
        print(f"  ❌ RESIZE TEST 4a FAIL: Expected center, got {align_1024}")

    if str(zindex_1024) == "9199":
        print("  ✅ zIndex 9199 confirmed for browse drawer")
    else:
        print(f"  ⚠ zIndex: {zindex_1024} (expected 9199)")

    # Resize to 390px
    await page.set_viewport_size({"width": 390, "height": 844})
    await page.wait_for_timeout(400)

    align_390 = await get_modal_align(page, "birthday-box-browse-drawer")
    padding_390 = await get_modal_padding(page, "birthday-box-browse-drawer")
    print(f"  [390px] alignItems: {align_390} (expected: flex-start)")
    print(f"  [390px] paddingTop: {padding_390} (expected: ~110px)")

    if align_390 == "flex-start":
        print("  ✅ RESIZE TEST 4b PASS: Drawer switched to mobile layout at 390px")
    else:
        print(f"  ❌ RESIZE TEST 4b FAIL: Expected flex-start, got {align_390}")

    # Check close btn accessible
    close_btn_box = await page.evaluate("""() => {
        const btn = document.querySelector('[data-testid="browse-drawer-close-btn"]');
        if (!btn) return null;
        return btn.getBoundingClientRect();
    }""")
    if close_btn_box:
        print(f"  Close btn top: {close_btn_box.get('top', 'N/A')}px")
        if close_btn_box.get('top', -1) > 90:
            print("  ✅ Close btn accessible on mobile")
        else:
            print("  ⚠ Close btn may be under sticky header")

    # Close
    close_btn = await page.query_selector('[data-testid="browse-drawer-close-btn"]')
    if close_btn:
        await close_btn.click(force=True)
        await page.wait_for_timeout(400)
        print("  ✅ Drawer closed")
except Exception as e:
    print(f"  ❌ RESIZE TEST 4 ERROR: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# ZINDEX TEST — Verify BirthdayBoxBuilder z-indexes (9200 backdrop, 9201 modal)
# ═══════════════════════════════════════════════════════════════════════════════
print("\n--- ZINDEX TEST: Verify z-indexes ---")
try:
    await page.set_viewport_size({"width": 1024, "height": 768})
    await page.wait_for_timeout(200)
    await open_builder(page)
    await page.wait_for_selector('[data-testid="birthday-box-builder"]', timeout=5000)

    builder_z = await get_modal_zindex(page, "birthday-box-builder")
    backdrop_z = await get_modal_zindex(page, "builder-backdrop")
    print(f"  BirthdayBoxBuilder modal zIndex: {builder_z} (expected: 9201)")
    print(f"  BirthdayBoxBuilder backdrop zIndex: {backdrop_z} (expected: 9200)")

    if str(builder_z) == "9201":
        print("  ✅ Builder modal zIndex=9201 ✓")
    else:
        print(f"  ❌ Builder modal zIndex={builder_z} (expected 9201)")

    if str(backdrop_z) == "9200":
        print("  ✅ Builder backdrop zIndex=9200 ✓")
    else:
        print(f"  ❌ Builder backdrop zIndex={backdrop_z} (expected 9200)")

    # Close
    close_btn = await page.query_selector('[data-testid="builder-close-btn"]')
    if close_btn:
        await close_btn.click(force=True)
        await page.wait_for_timeout(400)
except Exception as e:
    print(f"  ❌ ZINDEX TEST ERROR: {e}")

# Also check browse drawer z-indexes
try:
    await page.set_viewport_size({"width": 1024, "height": 768})
    await page.wait_for_timeout(200)
    await open_browse_drawer(page)
    await page.wait_for_selector('[data-testid="birthday-box-browse-drawer"]', timeout=5000)

    drawer_z = await get_modal_zindex(page, "birthday-box-browse-drawer")
    drawer_backdrop_z = await get_modal_zindex(page, "browse-drawer-backdrop")
    print(f"  BirthdayBoxBrowseDrawer modal zIndex: {drawer_z} (expected: 9199)")
    print(f"  BirthdayBoxBrowseDrawer backdrop zIndex: {drawer_backdrop_z} (expected: 9198)")

    if str(drawer_z) == "9199":
        print("  ✅ Browse drawer modal zIndex=9199 ✓")
    else:
        print(f"  ❌ Browse drawer modal zIndex={drawer_z} (expected 9199)")

    if str(drawer_backdrop_z) == "9198":
        print("  ✅ Browse drawer backdrop zIndex=9198 ✓")
    else:
        print(f"  ❌ Browse drawer backdrop zIndex={drawer_backdrop_z} (expected 9198)")

    close_btn = await page.query_selector('[data-testid="browse-drawer-close-btn"]')
    if close_btn:
        await close_btn.click(force=True)
        await page.wait_for_timeout(400)
except Exception as e:
    print(f"  ❌ ZINDEX BROWSE TEST ERROR: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# MIRA WIDGET RESIZE TEST — Desktop (1024px) to Mobile (375px)
# ═══════════════════════════════════════════════════════════════════════════════
print("\n--- MIRA WIDGET RESIZE TEST ---")
try:
    await page.set_viewport_size({"width": 1024, "height": 768})
    await page.wait_for_timeout(300)

    # Look for the MiraOrb button to open widget at desktop
    mira_orb = await page.query_selector('.hidden.md\\:flex, [data-testid="mira-chat-widget"]')
    if not mira_orb:
        # Try clicking the floating button via JS
        orb_clicked = await page.evaluate("""() => {
            // Look for fixed bottom-right button (MiraOrb)
            const btns = Array.from(document.querySelectorAll('button'));
            // Look for Mira/orb text or bottom-right positioned element
            const orbBtn = btns.find(b => b.closest('[class*="bottom-4"][class*="right-4"]') ||
                                          b.closest('[class*="bottom-6"][class*="right-6"]'));
            if (orbBtn) { orbBtn.click(); return true; }
            return false;
        }""")
        print(f"  Orb click via JS: {orb_clicked}")

    # Try using MiraOrb visible on md screens at 1024px
    orb_container = await page.query_selector('.md\\:flex')
    if orb_container:
        await orb_container.click(force=True)
        await page.wait_for_timeout(600)
    else:
        # Dispatch event to open Mira
        await page.evaluate("""
            window.dispatchEvent(new CustomEvent('openMiraAI', {
                detail: { pillar: 'celebrate', source: 'test' }
            }));
        """)
        await page.wait_for_timeout(600)

    widget = await page.query_selector('[data-testid="mira-chat-widget"]')
    if widget:
        print("  ✅ Mira widget opened at 1024px")

        # Check desktop layout via computed bounds
        widget_box = await widget.bounding_box()
        vp_width = 1024
        print(f"  Widget bounding box: {widget_box}")
        if widget_box:
            widget_left = widget_box['x']
            widget_right = widget_box['x'] + widget_box['width']
            print(f"  Widget left: {widget_left}, right: {widget_right}, width: {widget_box['width']}")
            # On desktop, widget should be on right side, NOT full-width
            if widget_box['width'] < 500 and widget_right >= vp_width - 10:
                print("  ✅ MIRA DESKTOP: Right-side panel layout (width<500px, right edge)")
            elif widget_box['width'] >= vp_width - 50:
                print(f"  ⚠ MIRA DESKTOP: Full-width layout (might be mobile CSS at 1024px)")
            else:
                print(f"  ℹ MIRA DESKTOP: width={widget_box['width']}, x={widget_left}")

        await page.screenshot(path=".screenshots/mira_widget_1024px.png", quality=40, full_page=False)
        print("  📸 Screenshot: mira_widget_1024px.png")

        # Now resize to 375px (mobile)
        print("\n  Resizing to 375px...")
        await page.set_viewport_size({"width": 375, "height": 844})
        await page.wait_for_timeout(400)

        widget_mobile = await page.query_selector('[data-testid="mira-chat-widget"]')
        if widget_mobile:
            widget_box_mobile = await widget_mobile.bounding_box()
            print(f"  Widget bounding box at 375px: {widget_box_mobile}")
            if widget_box_mobile:
                if widget_box_mobile['width'] >= 360:  # Full-width on mobile
                    print("  ✅ MIRA MOBILE: Full-width layout at 375px")
                else:
                    print(f"  ⚠ MIRA MOBILE: width={widget_box_mobile['width']} (expected ~375px full-width)")
                # Check top offset
                top = widget_box_mobile['y']
                print(f"  Widget top at 375px: {top}px (expected ~105px)")
                if 95 <= top <= 115:
                    print(f"  ✅ MIRA MOBILE: top={top}px ≈ 105px ✓")
                else:
                    print(f"  ⚠ MIRA MOBILE: top={top}px (expected ~105px)")
        else:
            print("  ⚠ Mira widget not visible at 375px")

        await page.screenshot(path=".screenshots/mira_widget_375px.png", quality=40, full_page=False)
        print("  📸 Screenshot: mira_widget_375px.png")

        # Resize back to 1024px
        print("\n  Resizing back to 1024px...")
        await page.set_viewport_size({"width": 1024, "height": 768})
        await page.wait_for_timeout(400)

        widget_back = await page.query_selector('[data-testid="mira-chat-widget"]')
        if widget_back:
            widget_box_back = await widget_back.bounding_box()
            print(f"  Widget bounding box back at 1024px: {widget_box_back}")
            if widget_box_back:
                if widget_box_back['width'] < 500 and widget_box_back['x'] > 500:
                    print("  ✅ MIRA RESIZE BACK: Desktop side panel restored at 1024px")
                else:
                    print(f"  ⚠ MIRA RESIZE BACK: width={widget_box_back['width']}, x={widget_box_back['x']}")

        # Close Mira widget
        close_btn = await page.query_selector('[data-testid="mira-widget-close"]')
        if close_btn:
            await close_btn.click(force=True)
            await page.wait_for_timeout(400)
            print("  ✅ Mira widget closed")
    else:
        print("  ⚠ Mira widget not visible at 1024px — orb may be hidden or already open")
except Exception as e:
    print(f"  ❌ MIRA WIDGET RESIZE TEST ERROR: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# CLEANUP TEST — Rapid open/close x5, check no setState-on-unmounted errors
# ═══════════════════════════════════════════════════════════════════════════════
print("\n--- CLEANUP TEST: Rapid open/close BirthdayBoxBuilder x5 ---")
try:
    await page.set_viewport_size({"width": 1024, "height": 768})
    await page.wait_for_timeout(200)

    cleanup_errors = []
    page.on("console", lambda msg: cleanup_errors.append(msg.text)
            if msg.type in ("error", "warn") and any(kw in msg.text.lower() for kw in
               ["unmounted", "setstate", "memory leak", "cannot update", "warning: can't perform"])
            else None)

    for i in range(5):
        await open_builder(page)
        await page.wait_for_timeout(200)
        modal = await page.query_selector('[data-testid="birthday-box-builder"]')
        if modal:
            close_btn = await page.query_selector('[data-testid="builder-close-btn"]')
            if close_btn:
                await close_btn.click(force=True)
                await page.wait_for_timeout(150)
        print(f"  Cycle {i+1}/5 done")

    await page.wait_for_timeout(500)  # Wait for any delayed errors

    if cleanup_errors:
        print(f"  ❌ CLEANUP TEST FAIL: setState errors found: {cleanup_errors}")
    else:
        print("  ✅ CLEANUP TEST PASS: No setState-on-unmounted errors in rapid open/close x5")

    if unmounted_errors:
        print(f"  ⚠ Unmount-related errors during full test: {unmounted_errors}")
    else:
        print("  ✅ No unmount errors throughout entire test run")
except Exception as e:
    print(f"  ❌ CLEANUP TEST ERROR: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# IPAD ROTATION TEST — 768px → 1024px with modal open
# ═══════════════════════════════════════════════════════════════════════════════
print("\n--- IPAD ROTATION TEST: 768px → 1024px with modal open ---")
try:
    await page.set_viewport_size({"width": 768, "height": 1024})
    await page.wait_for_timeout(300)
    await open_builder(page)
    await page.wait_for_selector('[data-testid="birthday-box-builder"]', timeout=5000)

    align_768 = await get_modal_align(page, "birthday-box-builder")
    print(f"  [768px portrait] alignItems: {align_768} (expected: center)")

    # Rotate to landscape (1024px)
    await page.set_viewport_size({"width": 1024, "height": 768})
    await page.wait_for_timeout(400)

    align_1024 = await get_modal_align(page, "birthday-box-builder")
    print(f"  [1024px landscape] alignItems: {align_1024} (expected: center)")

    # Verify modal is visible and not frozen
    modal_visible = await page.is_visible('[data-testid="birthday-box-builder"]')
    close_visible = await page.is_visible('[data-testid="builder-close-btn"]')

    if modal_visible and close_visible:
        print("  ✅ IPAD ROTATION PASS: Modal visible and not frozen after rotation")
    else:
        print(f"  ❌ IPAD ROTATION FAIL: modal_visible={modal_visible}, close_visible={close_visible}")

    if align_768 == "center" and align_1024 == "center":
        print("  ✅ Layout stays centered through iPad portrait→landscape rotation")
    else:
        print(f"  ⚠ Layout: 768={align_768}, 1024={align_1024}")

    # Final screenshot
    await page.screenshot(path=".screenshots/ipad_rotation_test.png", quality=40, full_page=False)
    print("  📸 Screenshot: ipad_rotation_test.png")

    close_btn = await page.query_selector('[data-testid="builder-close-btn"]')
    if close_btn:
        await close_btn.click(force=True)
        await page.wait_for_timeout(400)
except Exception as e:
    print(f"  ❌ IPAD ROTATION TEST ERROR: {e}")

print("\n===== ALL RESIZE TESTS COMPLETE =====")
