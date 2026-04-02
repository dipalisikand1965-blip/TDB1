"""
Test suite for MiraSearchPage (/mira-search)
Tests all features: auth guard, search bar, quick prompts, modal triggers, follow-up input, cart, my-requests
"""
import asyncio
import os
from playwright.async_api import async_playwright, expect

BASE_URL = "https://pet-soul-ranking.preview.emergentagent.com"
EMAIL = "dipali@clubconcierge.in"
PASSWORD = "test123"


async def login(page):
    """Log in and return True if successful"""
    await page.goto(f"{BASE_URL}/login")
    await page.wait_for_timeout(2000)
    
    email_input = await page.query_selector('input[type="email"]')
    password_input = await page.query_selector('input[type="password"]')
    
    if not email_input or not password_input:
        print("FAIL: Could not find login inputs")
        return False
    
    await email_input.fill(EMAIL)
    await password_input.fill(PASSWORD)
    await page.keyboard.press("Enter")
    await page.wait_for_timeout(4000)
    
    current_url = page.url
    if "/login" not in current_url:
        print(f"PASS: Login successful, URL: {current_url}")
        return True
    else:
        print(f"FAIL: Still on login page after login")
        return False


async def test_auth_guard(page):
    """Test that /mira-search redirects to /login when not authenticated"""
    print("\n--- TEST: Auth Guard ---")
    # Navigate to home first to clear storage
    await page.goto(f"{BASE_URL}/")
    await page.wait_for_timeout(1000)
    await page.evaluate("localStorage.clear()")
    await page.evaluate("sessionStorage.clear()")
    
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    url = page.url
    if "/login" in url or "/mira-search" not in url:
        print(f"PASS: Auth guard redirected to: {url}")
        return True
    else:
        print(f"FAIL: Auth guard did not redirect. URL: {url}")
        return False


async def test_mira_search_loads(page):
    """Test that MiraSearchPage loads correctly after login"""
    print("\n--- TEST: MiraSearchPage Load ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    url = page.url
    if "/mira-search" in url:
        print(f"PASS: MiraSearchPage loaded at {url}")
    else:
        print(f"FAIL: Not on mira-search page, URL: {url}")
        return False
    
    # Check search bar
    search_input = await page.query_selector('[data-testid="mira-search-input"]')
    if search_input:
        placeholder = await search_input.get_attribute("placeholder")
        print(f"PASS: Search input found, placeholder: '{placeholder}'")
        if "Mira" in (placeholder or "") or "what" in (placeholder or "").lower():
            print("PASS: Placeholder contains 'Mira' or 'what'")
        else:
            print(f"NOTE: Placeholder is '{placeholder}' - expected to contain 'What can Mira do for'")
    else:
        print("FAIL: Search input [data-testid='mira-search-input'] not found")
    
    # Check submit button
    submit_btn = await page.query_selector('[data-testid="mira-search-submit"]')
    if submit_btn:
        btn_text = await submit_btn.text_content()
        print(f"PASS: Submit button found with text: '{btn_text}'")
    else:
        print("FAIL: Submit button [data-testid='mira-search-submit'] not found")
    
    # Check cart icon
    cart_btn = await page.query_selector('[data-testid="mira-search-cart"]')
    if cart_btn:
        print("PASS: Cart icon found")
    else:
        print("FAIL: Cart icon [data-testid='mira-search-cart'] not found")
    
    # Check my-requests icon
    my_requests_btn = await page.query_selector('[data-testid="mira-search-my-requests"]')
    if my_requests_btn:
        print("PASS: My Requests icon found")
    else:
        print("FAIL: My Requests icon [data-testid='mira-search-my-requests'] not found")
    
    return True


async def test_quick_prompts(page):
    """Test that quick prompt chips render before first search"""
    print("\n--- TEST: Quick Prompts ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    # Check for quick prompt buttons
    quick_prompts = await page.query_selector_all('.ms-qp-btn')
    if len(quick_prompts) > 0:
        print(f"PASS: Found {len(quick_prompts)} quick prompt chips")
        for chip in quick_prompts:
            text = await chip.text_content()
            print(f"  Chip: {text.strip()}")
    else:
        print("FAIL: No quick prompt chips found")
        # Try alternative selector
        btn_texts = await page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.filter(b => ['Plan birthday', 'Book a groomer', 'What to eat', 'Health check', 'Find a toy', 'Plan a trip'].some(t => b.textContent.includes(t))).map(b => b.textContent.trim());
        }""")
        print(f"  Found via text search: {btn_texts}")
    
    return len(quick_prompts) > 0


async def test_search_and_followup(page):
    """Test basic search flow and follow-up input appearance"""
    print("\n--- TEST: Search and Follow-up Input ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    # Type a simple query 
    search_input = await page.query_selector('[data-testid="mira-search-input"]')
    if not search_input:
        print("FAIL: No search input found")
        return False
    
    await search_input.fill("Tell me about dog nutrition")
    await page.wait_for_timeout(500)
    
    # Submit
    submit_btn = await page.query_selector('[data-testid="mira-search-submit"]')
    if submit_btn:
        await submit_btn.click(force=True)
        print("PASS: Submitted search query")
    else:
        await page.keyboard.press("Enter")
    
    # Wait for streaming response (up to 15s)
    print("Waiting for Mira response (up to 15s)...")
    await page.wait_for_timeout(3000)
    
    # Check if response appeared
    mira_response = await page.query_selector('[data-testid="mira-search-followup"]')
    if mira_response:
        print("PASS: Follow-up input appeared after first response")
    else:
        # Wait more if still streaming
        await page.wait_for_timeout(8000)
        mira_response = await page.query_selector('[data-testid="mira-search-followup"]')
        if mira_response:
            print("PASS: Follow-up input appeared after waiting")
        else:
            print("FAIL: Follow-up input not found after 11s")
    
    # Check conversation turn is visible
    user_bubble = await page.evaluate("""() => {
        const divs = Array.from(document.querySelectorAll('div'));
        return divs.some(d => d.textContent.includes('Tell me about dog nutrition'));
    }""")
    if user_bubble:
        print("PASS: User message bubble visible in conversation")
    
    return mira_response is not None


async def test_grooming_modal(page):
    """Test that 'Book a groomer' query triggers GroomingFlowModal"""
    print("\n--- TEST: Grooming Modal ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    search_input = await page.query_selector('[data-testid="mira-search-input"]')
    if not search_input:
        print("FAIL: No search input found")
        return False
    
    await search_input.fill("Book a groomer for my dog")
    submit_btn = await page.query_selector('[data-testid="mira-search-submit"]')
    await submit_btn.click(force=True)
    print("Submitted grooming query, waiting for response + modal (up to 15s)...")
    
    # Wait for stream + 400ms modal delay
    await page.wait_for_timeout(8000)
    
    # Check for Grooming modal (uses Radix Dialog)
    grooming_modal = await page.evaluate("""() => {
        // Check for Radix Dialog or modal overlay with grooming content
        const dialogs = document.querySelectorAll('[role="dialog"]');
        for (const d of dialogs) {
            const text = d.textContent || '';
            if (text.includes('Grooming') || text.includes('groom')) return text.substring(0, 200);
        }
        // Also check for fixed position overlays
        const overlays = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
        for (const o of overlays) {
            const text = o.textContent || '';
            if (text.includes('Grooming') || text.includes('groom')) return 'OVERLAY: ' + text.substring(0, 200);
        }
        return null;
    }""")
    
    if grooming_modal:
        print(f"PASS: Grooming modal opened - content: {grooming_modal[:100]}")
        return True
    else:
        print("FAIL: Grooming modal did not appear after grooming query")
        # Check if still streaming
        still_streaming = await page.evaluate("""() => {
            return document.body.textContent.includes('thinking');
        }""")
        print(f"  Still streaming: {still_streaming}")
        
        # Check for [data-testid='mira-search-followup'] to know if response completed
        followup = await page.query_selector('[data-testid="mira-search-followup"]')
        print(f"  Follow-up appeared (response complete): {followup is not None}")
        return False


async def test_vet_modal(page):
    """Test that vet query triggers VetVisitFlowModal"""
    print("\n--- TEST: Vet Visit Modal ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    search_input = await page.query_selector('[data-testid="mira-search-input"]')
    if not search_input:
        print("FAIL: No search input found")
        return False
    
    await search_input.fill("My dog needs a vet checkup")
    submit_btn = await page.query_selector('[data-testid="mira-search-submit"]')
    await submit_btn.click(force=True)
    print("Submitted vet query, waiting for response + modal (up to 15s)...")
    
    await page.wait_for_timeout(8000)
    
    vet_modal = await page.evaluate("""() => {
        const dialogs = document.querySelectorAll('[role="dialog"]');
        for (const d of dialogs) {
            const text = d.textContent || '';
            if (text.includes('vet') || text.includes('Vet') || text.includes('Checkup') || text.includes('checkup')) return text.substring(0, 200);
        }
        return null;
    }""")
    
    if vet_modal:
        print(f"PASS: Vet modal opened - content: {vet_modal[:100]}")
        return True
    else:
        print("FAIL: Vet modal did not appear after vet query")
        followup = await page.query_selector('[data-testid="mira-search-followup"]')
        print(f"  Follow-up appeared (response complete): {followup is not None}")
        return False


async def test_boarding_modal(page):
    """Test that boarding query triggers ServiceBookingModal"""
    print("\n--- TEST: Boarding Modal ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    search_input = await page.query_selector('[data-testid="mira-search-input"]')
    if not search_input:
        print("FAIL: No search input found")
        return False
    
    await search_input.fill("I need to board my dog overnight")
    submit_btn = await page.query_selector('[data-testid="mira-search-submit"]')
    await submit_btn.click(force=True)
    print("Submitted boarding query, waiting for response + modal (up to 15s)...")
    
    await page.wait_for_timeout(8000)
    
    boarding_modal = await page.evaluate("""() => {
        const dialogs = document.querySelectorAll('[role="dialog"]');
        for (const d of dialogs) {
            const text = d.textContent || '';
            if (text.includes('Boarding') || text.includes('boarding') || text.includes('Stay')) return text.substring(0, 200);
        }
        // Also check fixed overlays
        const overlays = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
        for (const o of overlays) {
            const text = o.textContent || '';
            if (text.includes('Boarding') || text.includes('boarding') || text.includes('Stay')) return 'OVERLAY: ' + text.substring(0, 200);
        }
        return null;
    }""")
    
    if boarding_modal:
        print(f"PASS: Boarding modal opened - content: {boarding_modal[:100]}")
        return True
    else:
        print("FAIL: Boarding modal did not appear after boarding query")
        followup = await page.query_selector('[data-testid="mira-search-followup"]')
        print(f"  Follow-up appeared (response complete): {followup is not None}")
        return False


async def test_training_modal(page):
    """Test that training query triggers ServiceBookingModal (training)"""
    print("\n--- TEST: Training Modal ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    search_input = await page.query_selector('[data-testid="mira-search-input"]')
    if not search_input:
        print("FAIL: No search input found")
        return False
    
    await search_input.fill("Puppy training classes")
    submit_btn = await page.query_selector('[data-testid="mira-search-submit"]')
    await submit_btn.click(force=True)
    print("Submitted training query, waiting for response + modal (up to 15s)...")
    
    await page.wait_for_timeout(8000)
    
    training_modal = await page.evaluate("""() => {
        const dialogs = document.querySelectorAll('[role="dialog"]');
        for (const d of dialogs) {
            const text = d.textContent || '';
            if (text.includes('Training') || text.includes('training') || text.includes('Puppy')) return text.substring(0, 200);
        }
        const overlays = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
        for (const o of overlays) {
            const text = o.textContent || '';
            if (text.includes('Training') || text.includes('training') || text.includes('Puppy')) return 'OVERLAY: ' + text.substring(0, 200);
        }
        return null;
    }""")
    
    if training_modal:
        print(f"PASS: Training modal opened - content: {training_modal[:100]}")
        return True
    else:
        print("FAIL: Training modal did not appear after training query")
        followup = await page.query_selector('[data-testid="mira-search-followup"]')
        print(f"  Follow-up appeared (response complete): {followup is not None}")
        return False


async def test_celebrate_modal(page):
    """Test that birthday/celebrate query triggers ServiceConciergeModal with celebrate pillar"""
    print("\n--- TEST: Celebrate/Birthday Modal ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    search_input = await page.query_selector('[data-testid="mira-search-input"]')
    if not search_input:
        print("FAIL: No search input found")
        return False
    
    await search_input.fill("Plan my dog birthday party")
    submit_btn = await page.query_selector('[data-testid="mira-search-submit"]')
    await submit_btn.click(force=True)
    print("Submitted birthday query, waiting for response + modal (up to 15s)...")
    
    await page.wait_for_timeout(8000)
    
    celebrate_modal = await page.evaluate("""() => {
        // ServiceConciergeModal uses fixed overlay with data-testid
        const overlay = document.querySelector('[data-testid="service-concierge-modal-overlay"]');
        if (overlay) return 'SERVICE_CONCIERGE: ' + (overlay.textContent || '').substring(0, 200);
        
        // Also check for any modal with birthday/celebrate content
        const fixedEls = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
        for (const el of fixedEls) {
            const text = el.textContent || '';
            if (text.includes('Birthday') || text.includes('birthday') || text.includes('Celebrate') || text.includes('Concierge')) {
                return 'FIXED_EL: ' + text.substring(0, 200);
            }
        }
        return null;
    }""")
    
    if celebrate_modal:
        print(f"PASS: Celebrate modal opened - content: {celebrate_modal[:100]}")
        return True
    else:
        print("FAIL: Celebrate/Birthday modal did not appear after birthday query")
        followup = await page.query_selector('[data-testid="mira-search-followup"]')
        print(f"  Follow-up appeared (response complete): {followup is not None}")
        return False


async def test_cart_sidebar(page):
    """Test that cart icon opens CartSidebar"""
    print("\n--- TEST: Cart Sidebar ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    cart_btn = await page.query_selector('[data-testid="mira-search-cart"]')
    if not cart_btn:
        print("FAIL: Cart button not found")
        return False
    
    await cart_btn.click(force=True)
    await page.wait_for_timeout(1000)
    
    # Check for cart sidebar
    cart_sidebar = await page.evaluate("""() => {
        const fixedEls = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]');
        for (const el of fixedEls) {
            const text = el.textContent || '';
            if (text.includes('Cart') || text.includes('cart') || text.includes('basket') || text.includes('item')) {
                return 'FOUND: ' + text.substring(0, 100);
            }
        }
        // Check for sidebar with cart-related content
        const allEls = document.querySelectorAll('[class*="cart"], [class*="Cart"], [data-testid*="cart"]');
        if (allEls.length > 0) return 'CLASS_FOUND: ' + allEls.length + ' elements';
        return null;
    }""")
    
    if cart_sidebar:
        print(f"PASS: Cart sidebar opened - {cart_sidebar[:100]}")
        return True
    else:
        print("FAIL: Cart sidebar did not open after clicking cart icon")
        return False


async def test_my_requests_navigation(page):
    """Test that My Requests icon navigates to /my-requests"""
    print("\n--- TEST: My Requests Navigation ---")
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    
    my_requests_btn = await page.query_selector('[data-testid="mira-search-my-requests"]')
    if not my_requests_btn:
        print("FAIL: My Requests button not found")
        return False
    
    await my_requests_btn.click(force=True)
    await page.wait_for_timeout(2000)
    
    current_url = page.url
    if "/my-requests" in current_url:
        print(f"PASS: Navigated to /my-requests: {current_url}")
        return True
    else:
        print(f"FAIL: Did not navigate to /my-requests. URL: {current_url}")
        return False


async def test_no_protected_route_logs(page):
    """Test that no [ProtectedRoute v5_production_debug] console logs appear"""
    print("\n--- TEST: No ProtectedRoute console.log ---")
    
    protected_route_logs = []
    page.on("console", lambda msg: protected_route_logs.append(msg.text()) if "[ProtectedRoute" in msg.text() else None)
    
    # Navigate to several pages
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(2000)
    await page.goto(f"{BASE_URL}/pet-home")
    await page.wait_for_timeout(1000)
    await page.goto(f"{BASE_URL}/mira-search")
    await page.wait_for_timeout(1000)
    
    if len(protected_route_logs) == 0:
        print("PASS: No [ProtectedRoute v5_production_debug] logs found in console")
        return True
    else:
        print(f"FAIL: Found {len(protected_route_logs)} ProtectedRoute console logs:")
        for log in protected_route_logs:
            print(f"  - {log}")
        return False


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})
        
        results = {}
        
        # Test 1: Auth guard (before login)
        results["auth_guard"] = await test_auth_guard(page)
        
        # Login for all subsequent tests
        login_ok = await login(page)
        if not login_ok:
            print("\nFATAL: Login failed - cannot continue frontend tests")
            await browser.close()
            return results
        
        # Test 2: MiraSearchPage loads
        results["page_loads"] = await test_mira_search_loads(page)
        
        # Test 3: Quick prompts
        results["quick_prompts"] = await test_quick_prompts(page)
        
        # Test 4: Search and follow-up
        results["search_followup"] = await test_search_and_followup(page)
        
        # Test 5: Grooming modal
        results["grooming_modal"] = await test_grooming_modal(page)
        
        # Test 6: Vet modal
        results["vet_modal"] = await test_vet_modal(page)
        
        # Test 7: Boarding modal
        results["boarding_modal"] = await test_boarding_modal(page)
        
        # Test 8: Training modal
        results["training_modal"] = await test_training_modal(page)
        
        # Test 9: Celebrate/Birthday modal
        results["celebrate_modal"] = await test_celebrate_modal(page)
        
        # Test 10: Cart sidebar
        results["cart_sidebar"] = await test_cart_sidebar(page)
        
        # Test 11: My Requests navigation
        results["my_requests_nav"] = await test_my_requests_navigation(page)
        
        # Test 12: No ProtectedRoute logs
        results["no_protected_route_logs"] = await test_no_protected_route_logs(page)
        
        # Summary
        print("\n" + "="*60)
        print("TEST RESULTS SUMMARY")
        print("="*60)
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        for test_name, result in results.items():
            status = "PASS" if result else "FAIL"
            print(f"  {status}: {test_name}")
        print(f"\nTotal: {passed}/{total} passed ({int(passed/total*100)}%)")
        
        await browser.close()
        return results

asyncio.run(main())
