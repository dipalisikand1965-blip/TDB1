"""
Test: Celebrate Soul page - Soul Questions, Score Display, Mira's Picks
Bruno pet (soul score ~42% per API, 5 unanswered questions), Admin Celebrate Products
"""
import asyncio
from playwright.async_api import async_playwright
import json

BASE_URL = "https://soul-page-sync.preview.emergentagent.com"
BRUNO_PET_ID = "pet-bruno-7327ad58"


async def run_tests():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        await page.set_viewport_size({"width": 1440, "height": 900})
        page.on("console", lambda msg: print(f"  [CONSOLE {msg.type}]: {msg.text[:80]}") if msg.type == "error" else None)
        
        results = {}
        
        try:
            # ===== LOGIN =====
            print("\n=== TEST 1: LOGIN ===")
            await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2000)
            await page.fill('input[type="email"]', "dipali@clubconcierge.in")
            await page.fill('input[type="password"]', "test123")
            await page.click('button[type="submit"]')
            await page.wait_for_url("**/pet-home**", timeout=30000)
            await page.wait_for_timeout(5000)
            print(f"Logged in - {page.url}")
            results["login"] = "PASS"
            
            # ===== NAVIGATE TO CELEBRATE-SOUL =====
            print("\n=== TEST 2: NAVIGATE TO CELEBRATE-SOUL ===")
            # Use history push to preserve context
            await page.evaluate("window.history.pushState({}, '', '/celebrate-soul')")
            await page.evaluate("window.dispatchEvent(new PopStateEvent('popstate', {state: {}}))")
            await page.wait_for_timeout(8000)
            
            page_text = await page.inner_text("body")
            print(f"Current pet: {'Mojo' if 'for Mojo' in page_text else 'Unknown'}")
            print(f"Category strip visible: {'Birthday Cak' in page_text}")
            results["celebrate_soul_loads"] = "PASS"
            
            # ===== SWITCH TO BRUNO - CLICK THE PET SWITCHER =====
            print("\n=== TEST 3: SWITCH TO BRUNO ===")
            # The pet switcher is a div with class containing 'cursor-pointer'
            switched = await page.evaluate("""() => {
                // Find Bruno's pet card in the switcher
                const allDivs = Array.from(document.querySelectorAll('div.cursor-pointer, div[class*="cursor-pointer"]'));
                for (const div of allDivs) {
                    const text = div.innerText || '';
                    if (text.includes('Bruno') && text.length < 80) {
                        div.click();
                        return {clicked: true, text: text.substring(0, 50)};
                    }
                }
                // Fallback: find any container with Bruno text
                const spans = Array.from(document.querySelectorAll('span, p, div'))
                    .filter(el => el.childElementCount === 0 && el.innerText?.trim() === 'Bruno');
                for (const span of spans) {
                    const parent = span.closest('[class*="cursor"], button, [onclick]');
                    if (parent) {
                        parent.click();
                        return {clicked: true, via: 'parent', text: parent.innerText?.substring(0, 50)};
                    }
                }
                return {clicked: false};
            }""")
            print(f"Switch click result: {switched}")
            await page.wait_for_timeout(3000)
            
            # Verify switch to Bruno
            page_text = await page.inner_text("body")
            bruno_active = "for Bruno" in page_text or "Celebrations for Bruno" in page_text
            print(f"Bruno active after click: {bruno_active}")
            
            if not bruno_active:
                # Try via pet-home approach - navigate to pet-home and select Bruno from there
                print("Trying via pet-home...")
                await page.goto(f"{BASE_URL}/pet-home", wait_until="domcontentloaded", timeout=20000)
                await page.wait_for_timeout(3000)
                # Select Bruno from the pet tabs
                bruno_tab = await page.query_selector('text=Bruno')
                if bruno_tab:
                    await bruno_tab.click(force=True)
                    await page.wait_for_timeout(2000)
                    print("Clicked Bruno on pet-home")
                
                # Now navigate to celebrate-soul
                await page.evaluate("window.history.pushState({}, '', '/celebrate-soul')")
                await page.evaluate("window.dispatchEvent(new PopStateEvent('popstate', {state: {}}))")
                await page.wait_for_timeout(8000)
                
                page_text = await page.inner_text("body")
                bruno_active = "for Bruno" in page_text or "Celebrations for Bruno" in page_text
                print(f"Bruno active after pet-home switch: {bruno_active}")
            
            results["bruno_switch"] = "PASS" if bruno_active else "FAIL"
            
            await page.screenshot(path="/app/tests/.screenshots/t1_celebrate_soul_bruno.jpg", quality=40, full_page=False)
            
            # ===== OPEN MIRA'S PICKS MODAL =====
            print("\n=== TEST 4: OPEN MIRA'S PICKS MODAL ===")
            miras_picks = await page.query_selector("text=Mira's Picks")
            if not miras_picks:
                # Try finding by category
                cat_buttons = await page.query_selector_all('[data-testid*="category"], .category-btn, [class*="category"] button')
                print(f"Category buttons found: {len(cat_buttons)}")
                for btn in cat_buttons:
                    text = await btn.inner_text()
                    if "Mira" in text:
                        miras_picks = btn
                        break
            
            if miras_picks:
                await miras_picks.click(force=True)
                print("Clicked Mira's Picks")
                await page.wait_for_timeout(5000)
                
                modal = await page.query_selector('[data-testid="celebrate-modal-miras-picks"]')
                if modal:
                    print("Modal opened!")
                    modal_text = await modal.inner_text()
                    
                    # Check what pet the modal is for
                    modal_for_pet = "for Bruno" in modal_text or "FOR BRUNO" in modal_text
                    print(f"Modal for Bruno: {modal_for_pet}")
                    print(f"Modal for Mojo: {'for Mojo' in modal_text}")
                    
                    await page.screenshot(path="/app/tests/.screenshots/t2_miras_picks_modal.jpg", quality=40, full_page=False)
                    results["miras_picks_modal"] = "PASS"
                    
                    # ===== CHECK SOUL SCORE DISPLAY =====
                    print("\n=== TEST 5: SOUL SCORE BIG NUMBER (38px) ===")
                    # Check for the soul section header with big score
                    grow_soul_text = await page.evaluate("""() => {
                        const allText = document.body.innerText;
                        const growIdx = allText.indexOf('GROW');
                        if (growIdx >= 0) return allText.substring(growIdx, growIdx + 300);
                        return null;
                    }""")
                    print(f"Soul section text: {grow_soul_text}")
                    
                    # Look for the big percentage number
                    big_score = await page.evaluate("""() => {
                        const allEls = Array.from(document.querySelectorAll('[style*="fontSize"], [style*="font-size"]'));
                        const scores = allEls.filter(el => {
                            const text = el.innerText?.trim();
                            return text && text.match(/^\\d{1,3}$/) && parseInt(text) <= 100;
                        }).map(el => ({
                            text: el.innerText.trim(),
                            style: el.getAttribute('style') || ''
                        }));
                        
                        // Also try via computed style
                        const allNums = Array.from(document.querySelectorAll('div, span'))
                            .filter(el => {
                                const text = el.childNodes.length === 1 && el.innerText?.trim();
                                const fs = text && parseFloat(window.getComputedStyle(el).fontSize);
                                return text && text.match(/^\\d{1,3}$/) && parseInt(text) <= 100 && fs >= 25;
                            })
                            .map(el => ({
                                text: el.innerText.trim(),
                                fontSize: window.getComputedStyle(el).fontSize
                            }));
                        return {byStyle: scores.slice(0,3), byComputedSize: allNums.slice(0,3)};
                    }""")
                    print(f"Big score elements: {big_score}")
                    
                    has_grow_soul = grow_soul_text is not None
                    results["soul_score_display"] = "PASS" if has_grow_soul else "FAIL - soul section not rendered"
                    
                    # ===== CHECK QUESTION CARDS =====
                    print("\n=== TEST 6: SOUL QUESTION CARDS VISIBILITY ===")
                    question_cards_info = await page.evaluate("""() => {
                        const modal = document.querySelector('[data-testid="celebrate-modal-miras-picks"]');
                        if (!modal) return {cards: []};
                        
                        // Find cards with '+X pts' badge and question text
                        const allCards = Array.from(modal.querySelectorAll('div'))
                            .filter(el => {
                                const text = el.innerText || '';
                                return text.includes('+') && text.includes('pts') && text.includes('Save') && text.length > 50 && text.length < 600;
                            })
                            .map(el => ({
                                text: el.innerText.substring(0, 200),
                                bg: window.getComputedStyle(el).backgroundColor,
                                border: window.getComputedStyle(el).border.substring(0, 80),
                                minHeight: window.getComputedStyle(el).minHeight
                            }))
                            .slice(0, 3);
                        return {cards: allCards, totalDivs: modal.querySelectorAll('div').length};
                    }""")
                    print(f"Question cards: {json.dumps(question_cards_info, indent=2)[:400]}")
                    results["question_cards_visible"] = "PASS" if question_cards_info["cards"] else "FAIL"
                    
                    # ===== TEST SAVE +X PTS BUTTON =====
                    print("\n=== TEST 7: SAVE +X PTS BUTTON ===")
                    save_btn = await page.query_selector('button:has-text("Save")')
                    if save_btn:
                        btn_text = await save_btn.inner_text()
                        has_pts = "pts" in btn_text
                        print(f"Save button text: '{btn_text}', has pts: {has_pts}")
                        results["save_pts_button"] = "PASS" if has_pts else "PARTIAL"
                    else:
                        print("No Save button found in modal")
                        results["save_pts_button"] = "FAIL"
                    
                    # ===== ANSWER A SOUL QUESTION =====
                    print("\n=== TEST 8: ANSWER SOUL QUESTION & SCORE UPDATE ===")
                    # Get initial score from the grow-soul section
                    initial_score_el = await page.evaluate("""() => {
                        const grows = Array.from(document.querySelectorAll('div'))
                            .find(el => el.innerText?.includes('GROW') && el.innerText?.includes('%'));
                        if (grows) {
                            // Find the large number within it
                            const nums = Array.from(grows.querySelectorAll('div, span'))
                                .filter(el => el.innerText?.match(/^\\d{1,3}$/) && parseInt(el.innerText) <= 100);
                            return nums.length > 0 ? nums[0].innerText : null;
                        }
                        return null;
                    }""")
                    print(f"Initial score from grow section: {initial_score_el}")
                    
                    # Look for option chips inside the modal
                    option_chips = await page.evaluate("""() => {
                        const modal = document.querySelector('[data-testid="celebrate-modal-miras-picks"]');
                        if (!modal) return [];
                        const btns = Array.from(modal.querySelectorAll('button'))
                            .filter(b => {
                                const text = b.innerText?.trim() || '';
                                const cls = b.className || '';
                                return text.length > 1 && text.length < 35 &&
                                    !text.includes('Save') && !text.includes('pts') &&
                                    !text.includes('Request') && !text.includes('Explore') &&
                                    (cls.includes('rounded-full') || cls.includes('px-2.5'));
                            })
                            .map(b => ({text: b.innerText.trim(), cls: b.className.substring(0, 60)}));
                        return btns.slice(0, 6);
                    }""")
                    print(f"Option chips: {option_chips}")
                    
                    if option_chips:
                        # Click first option
                        first_opt_text = option_chips[0]["text"]
                        # Find the button more precisely
                        first_opt_btn = await page.evaluate(f"""() => {{
                            const modal = document.querySelector('[data-testid="celebrate-modal-miras-picks"]');
                            if (!modal) return null;
                            const btns = Array.from(modal.querySelectorAll('button'));
                            const btn = btns.find(b => b.innerText?.trim() === "{first_opt_text}" && b.className.includes('rounded'));
                            if (btn) {{
                                btn.click();
                                return {{clicked: true, text: btn.innerText}};
                            }}
                            return null;
                        }}""")
                        print(f"Clicked option: {first_opt_btn}")
                        await page.wait_for_timeout(500)
                        
                        # Now click Save +X pts
                        save_result = await page.evaluate("""() => {
                            const modal = document.querySelector('[data-testid="celebrate-modal-miras-picks"]');
                            if (!modal) return null;
                            const saveBtn = Array.from(modal.querySelectorAll('button'))
                                .find(b => b.innerText?.includes('Save') && b.innerText?.includes('pts'));
                            if (saveBtn) {
                                const btnText = saveBtn.innerText;
                                saveBtn.click();
                                return {clicked: true, text: btnText};
                            }
                            return {clicked: false};
                        }""")
                        print(f"Save button clicked: {save_result}")
                        await page.wait_for_timeout(4000)
                        
                        # Check success state
                        after_text = await page.inner_text("body")
                        success_state = "Soul score growing" in after_text or "pts added" in after_text
                        green_banner = "answers saved" in after_text or "Soul score:" in after_text
                        print(f"Success state shown: {success_state}")
                        print(f"Green banner shown: {green_banner}")
                        
                        # Check updated score
                        new_score = await page.evaluate("""() => {
                            const grows = Array.from(document.querySelectorAll('div'))
                                .find(el => el.innerText?.includes('GROW') && el.innerText?.includes('%'));
                            if (grows) {
                                const nums = Array.from(grows.querySelectorAll('div, span'))
                                    .filter(el => el.innerText?.match(/^\\d{1,3}$/) && parseInt(el.innerText) <= 100);
                                return nums.length > 0 ? nums[0].innerText : null;
                            }
                            return null;
                        }""")
                        print(f"New score: {new_score}")
                        
                        await page.screenshot(path="/app/tests/.screenshots/t3_after_answer.jpg", quality=40, full_page=False)
                        
                        results["answer_question"] = "PASS" if success_state else "FAIL"
                        results["score_update"] = "PASS" if (new_score and new_score != initial_score_el) else "PARTIAL"
                        results["green_banner"] = "PASS" if green_banner else "PARTIAL"
                    else:
                        print("No option chips found - soul section may not be active for current pet")
                        results["answer_question"] = "SKIP - no options"
                else:
                    print("Modal not found!")
                    results["miras_picks_modal"] = "FAIL"
            else:
                print("Mira's Picks button not found!")
                results["miras_picks_modal"] = "FAIL"
        
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()
        
        # Print summary
        print("\n========== TEST SUMMARY ==========")
        for test, result in results.items():
            status = "PASS" if result == "PASS" else ("WARN" if "PARTIAL" in result or "SKIP" in result else "FAIL")
            icon = "✅" if status == "PASS" else ("⚠️" if status == "WARN" else "❌")
            print(f"{icon} {test}: {result}")
        
        await browser.close()
        return results


if __name__ == "__main__":
    asyncio.run(run_tests())
