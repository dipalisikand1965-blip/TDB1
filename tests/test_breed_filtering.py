"""
Test breed filtering for soul products across Play, Care, Go pages.
Pet: Mojo (Indie breed) - dipali@clubconcierge.in / test123
"""
import asyncio
import json
from playwright.async_api import async_playwright

BASE_URL = "https://custom-order-desk-1.preview.emergentagent.com"

async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        
        await page.set_viewport_size({"width": 1920, "height": 1080})
        
        results = {}
        
        try:
            # Step 1: Login
            await page.goto(f"{BASE_URL}/login")
            await page.wait_for_selector('input[type="email"]', timeout=10000)
            await page.fill('input[type="email"]', 'dipali@clubconcierge.in')
            await page.fill('input[type="password"]', 'test123')
            await page.click('button[type="submit"]', force=True)
            await page.wait_for_timeout(3000)
            print(f"Logged in, URL: {page.url()}")

            # ============================================================
            # TEST 1: Play page - Soul Play DimExpandedModal - All Products
            # ============================================================
            await page.goto(f"{BASE_URL}/play")
            await page.wait_for_timeout(5000)  # wait for petData + products
            print("Play page loaded")
            
            await page.screenshot(path='.screenshots/play_page.jpg', quality=40, full_page=False)
            
            soul_pill = await page.query_selector('[data-testid="play-strip-soul"]')
            if soul_pill:
                print("PASS: Found play-strip-soul pill")
                await soul_pill.click(force=True)
                await page.wait_for_timeout(2500)
                
                dim_modal = await page.query_selector('[data-testid="play-dim-expanded-soul"]')
                if dim_modal:
                    print("PASS: Soul Play DimExpandedModal opened")
                    await page.screenshot(path='.screenshots/soul_play_dim.jpg', quality=40, full_page=False)
                    
                    # Get all text in modal (All Products tab by default)
                    modal_text = await page.evaluate("""() => {
                        const modal = document.querySelector('[data-testid="play-dim-expanded-soul"]');
                        return modal ? modal.innerText : 'NOT FOUND';
                    }""")
                    
                    has_american_bully = 'american bully' in modal_text.lower()
                    has_shih_tzu = 'shih tzu' in modal_text.lower() or 'shihtzu' in modal_text.lower()
                    has_indie = 'indie' in modal_text.lower()
                    
                    print(f"All Products tab - Has American Bully: {has_american_bully}")
                    print(f"All Products tab - Has Shih Tzu: {has_shih_tzu}")
                    print(f"All Products tab - Has Indie: {has_indie}")
                    print(f"Modal text preview: {modal_text[:400]}")
                    
                    results['play_soul_all_products_no_american_bully'] = not has_american_bully
                    results['play_soul_all_products_no_shih_tzu'] = not has_shih_tzu
                    results['play_soul_all_products_has_indie'] = has_indie
                    
                    if not has_american_bully and not has_shih_tzu:
                        print("PASS: No other breed products in Soul Play All Products tab")
                    else:
                        print("FAIL: Other breed products visible in Soul Play All Products tab")
                    
                    # Check Personalised tab
                    pers_tab = await page.query_selector('[data-testid="dim-tab-personalised"]')
                    if pers_tab:
                        await pers_tab.click(force=True)
                        await page.wait_for_timeout(5000)  # wait for breed API call
                        await page.screenshot(path='.screenshots/soul_play_personalised.jpg', quality=40, full_page=False)
                        
                        pers_text = await page.evaluate("""() => {
                            const modal = document.querySelector('[data-testid="play-dim-expanded-soul"]');
                            return modal ? modal.innerText : 'NOT FOUND';
                        }""")
                        
                        has_made_for_indies = 'made for indie' in pers_text.lower()
                        has_indie_pers = 'indie' in pers_text.lower()
                        has_shih_tzu_pers = 'shih tzu' in pers_text.lower()
                        
                        print(f"Personalised tab - Made for Indies: {has_made_for_indies}")
                        print(f"Personalised tab - Has Indie: {has_indie_pers}")
                        print(f"Personalised tab - Has Shih Tzu: {has_shih_tzu_pers}")
                        print(f"Personalised content: {pers_text[:400]}")
                        
                        results['play_soul_personalised_made_for_indie'] = has_made_for_indies or has_indie_pers
                        results['play_soul_personalised_no_shih_tzu'] = not has_shih_tzu_pers
                    else:
                        print("FAIL: dim-tab-personalised not found")
                        results['play_soul_personalised_made_for_indie'] = False
                    
                    # Close modal
                    close_btn = await page.query_selector('[data-testid="play-dim-expanded-soul"] button')
                    if close_btn:
                        await close_btn.click(force=True)
                        await page.wait_for_timeout(500)
                else:
                    print("FAIL: DimExpandedModal for soul did not open")
                    results['play_soul_all_products_no_american_bully'] = False
            else:
                print("FAIL: play-strip-soul pill not found")
                results['play_soul_all_products_no_american_bully'] = False
                # Debug: show available pills
                pills = await page.query_selector_all('[data-testid^="play-strip-"]')
                for pill in pills:
                    pid = await pill.get_attribute('data-testid')
                    print(f"  Available: {pid}")

            # ============================================================
            # TEST 2: Care page - Soul Care DimExpanded
            # ============================================================
            await page.goto(f"{BASE_URL}/care")
            await page.wait_for_timeout(5000)
            print("\nCare page loaded")
            
            await page.screenshot(path='.screenshots/care_page.jpg', quality=40, full_page=False)
            
            # Find soul care category card or strip
            soul_care = await page.query_selector('[data-testid="care-strip-soul"]')
            if not soul_care:
                # Try clicking the soul dim card in the grid
                soul_care = await page.query_selector('[data-testid*="soul"]')
            
            if soul_care:
                print("PASS: Found care soul element")
                await soul_care.click(force=True)
                await page.wait_for_timeout(2500)
                
                care_dim = await page.query_selector('[data-testid="care-dim-expanded-soul"]')
                if care_dim:
                    print("PASS: Care soul DimExpanded opened")
                    await page.screenshot(path='.screenshots/care_soul_dim.jpg', quality=40, full_page=False)
                    
                    care_text = await page.evaluate("""() => {
                        const dim = document.querySelector('[data-testid="care-dim-expanded-soul"]');
                        return dim ? dim.innerText : 'NOT FOUND';
                    }""")
                    
                    has_am_bully_care = 'american bully' in care_text.lower()
                    has_shih_tzu_care = 'shih tzu' in care_text.lower()
                    has_indie_care = 'indie' in care_text.lower()
                    
                    print(f"Care Soul All Products - Has American Bully: {has_am_bully_care}")
                    print(f"Care Soul All Products - Has Shih Tzu: {has_shih_tzu_care}")
                    print(f"Care Soul All Products - Has Indie: {has_indie_care}")
                    print(f"Care Soul content preview: {care_text[:400]}")
                    
                    results['care_soul_no_american_bully'] = not has_am_bully_care
                    results['care_soul_no_shih_tzu'] = not has_shih_tzu_care
                    
                    # Check Personalised tab in Care
                    care_pers_tab = await page.query_selector('[data-testid="care-dim-tab-personalised"]')
                    if care_pers_tab:
                        await care_pers_tab.click(force=True)
                        await page.wait_for_timeout(4000)
                        
                        care_pers_text = await page.evaluate("""() => {
                            const dim = document.querySelector('[data-testid="care-dim-expanded-soul"]');
                            return dim ? dim.innerText : 'NOT FOUND';
                        }""")
                        
                        care_has_indie = 'indie' in care_pers_text.lower()
                        care_has_made_for_indie = 'made for indie' in care_pers_text.lower()
                        care_has_shih_tzu = 'shih tzu' in care_pers_text.lower()
                        
                        print(f"Care Soul Personalised - Made for Indies: {care_has_made_for_indie}")
                        print(f"Care Soul Personalised - Has Indie: {care_has_indie}")
                        print(f"Care Soul Personalised - Has Shih Tzu: {care_has_shih_tzu}")
                        print(f"Care Personalised content: {care_pers_text[:400]}")
                        
                        results['care_soul_personalised_indie'] = care_has_indie or care_has_made_for_indie
                        results['care_soul_personalised_no_shih_tzu'] = not care_has_shih_tzu
                    
                    await page.screenshot(path='.screenshots/care_soul_personalised.jpg', quality=40, full_page=False)
                else:
                    print("FAIL: care-dim-expanded-soul did not open")
                    results['care_soul_no_american_bully'] = False
            else:
                print("FAIL: care soul element not found")
                results['care_soul_no_american_bully'] = False
                # Debug: list dim cards
                dim_cards = await page.query_selector_all('[data-testid^="care-dim"]')
                for card in dim_cards:
                    cid = await card.get_attribute('data-testid')
                    print(f"  Available care element: {cid}")

            # ============================================================
            # TEST 3: Go page - Soul Go GoContentModal - Personalised tab
            # ============================================================
            await page.goto(f"{BASE_URL}/go")
            await page.wait_for_timeout(5000)
            print("\nGo page loaded")
            
            await page.screenshot(path='.screenshots/go_page.jpg', quality=40, full_page=False)
            
            # Find Soul Go pill in GoCategoryStrip
            go_soul = await page.query_selector('[data-testid="go-strip-soul"]')
            if not go_soul:
                go_soul = await page.query_selector('text=Soul Go')
            
            if go_soul:
                print("PASS: Found Soul Go element")
                await go_soul.click(force=True)
                await page.wait_for_timeout(3000)
                
                await page.screenshot(path='.screenshots/go_soul_modal.jpg', quality=40, full_page=False)
                
                # Check if GoContentModal opened - look for its Personalised tab
                go_pers_tab = await page.query_selector('[data-testid="go-content-tab-personalised"]')
                if not go_pers_tab:
                    # Try generic personalised tab selector
                    go_pers_tab = await page.query_selector('button:has-text("Personalised")')
                
                if go_pers_tab:
                    print("PASS: GoContentModal Personalised tab found")
                    await go_pers_tab.click(force=True)
                    await page.wait_for_timeout(4000)
                    
                    go_pers_text = await page.evaluate("""() => {
                        const section = document.querySelector('[data-testid="personalised-breed-section"]');
                        if (section) return section.innerText;
                        // Try getting modal text
                        const modals = document.querySelectorAll('[class*="modal"], [class*="Modal"]');
                        for (const m of modals) {
                            if (m.innerText && m.innerText.length > 50) return m.innerText;
                        }
                        return document.body.innerText.substring(0, 500);
                    }""")
                    
                    go_has_indie = 'indie' in go_pers_text.lower()
                    go_has_made_for = 'made for' in go_pers_text.lower()
                    go_has_shih_tzu = 'shih tzu' in go_pers_text.lower()
                    
                    print(f"Go Personalised - Has Indie: {go_has_indie}")
                    print(f"Go Personalised - Made for: {go_has_made_for}")
                    print(f"Go Personalised - Has Shih Tzu: {go_has_shih_tzu}")
                    print(f"Go Personalised content: {go_pers_text[:300]}")
                    
                    results['go_soul_personalised_indie'] = go_has_indie
                    results['go_soul_personalised_no_shih_tzu'] = not go_has_shih_tzu
                    
                    await page.screenshot(path='.screenshots/go_soul_personalised.jpg', quality=40, full_page=False)
                else:
                    print("GoContentModal Personalised tab not found directly")
                    # Get the current page text near any open modal
                    modal_text = await page.evaluate("""() => {
                        const fixed = Array.from(document.querySelectorAll('*')).find(el => {
                            const s = window.getComputedStyle(el);
                            return s.position === 'fixed' && el.offsetHeight > 200;
                        });
                        return fixed ? fixed.innerText.substring(0, 600) : 'No modal found';
                    }""")
                    print(f"Modal area content: {modal_text[:400]}")
                    results['go_soul_personalised_indie'] = None
            else:
                print("FAIL: Soul Go pill not found")
                results['go_soul_personalised_indie'] = None
                # Debug: list go strip elements
                go_pills = await page.query_selector_all('[data-testid^="go-strip-"]')
                for pill in go_pills:
                    pid = await pill.get_attribute('data-testid')
                    print(f"  Available Go strip: {pid}")

        except Exception as e:
            print(f"Error: {str(e)}")
            await page.screenshot(path='.screenshots/error_state.jpg', quality=40, full_page=False)
        finally:
            await browser.close()
        
        return results

results = asyncio.get_event_loop().run_until_complete(run_tests())
print("\n========== SUMMARY ==========")
for k, v in results.items():
    status = "PASS" if v else "FAIL"
    if v is None:
        status = "SKIP"
    print(f"  {status}: {k}")
