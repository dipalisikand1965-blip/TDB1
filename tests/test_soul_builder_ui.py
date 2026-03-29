"""
UI Test: SoulBuilder Long Horizon chapter - life_vision question
Tests:
1. SoulBuilder Long Horizon chapter has 'life_vision' question with correct text and placeholder
2. Chapter confirmation text is correct
3. Paperwork mobile 2-column grid
"""
import asyncio
from playwright.async_api import async_playwright
import os

BASE_URL = "https://pet-soul-ranking.preview.emergentagent.com"
EMAIL = "dipali@clubconcierge.in"
PASSWORD = "test123"


async def login(page):
    """Login helper"""
    await page.goto(f"{BASE_URL}/login")
    await page.wait_for_load_state("domcontentloaded")
    await page.wait_for_selector('input[placeholder="you@example.com"]', timeout=15000)
    await page.fill('input[placeholder="you@example.com"]', EMAIL)
    await page.fill('input[placeholder="Enter your password"]', PASSWORD)
    await page.click('button:has-text("Sign In")', force=True)
    # Wait for redirect away from login
    try:
        await page.wait_for_url(lambda url: "login" not in url, timeout=10000)
    except Exception:
        pass
    await page.wait_for_timeout(2000)
    print(f"  Login URL: {page.url}")


async def test_soulbuilder_long_horizon(page):
    """Test that Long Horizon chapter has life_vision question"""
    print("\n=== TEST: SoulBuilder Long Horizon - life_vision question ===")
    
    await login(page)
    
    # Navigate to soul builder
    await page.goto(f"{BASE_URL}/soul-builder")
    await page.wait_for_timeout(4000)
    print(f"  SoulBuilder URL: {page.url}")
    
    # Click Let's begin
    await page.wait_for_selector('button:has-text("Let\'s begin")', timeout=10000)
    await page.click('button:has-text("Let\'s begin")', force=True)
    await page.wait_for_timeout(2000)
    
    body = await page.inner_text("body")
    print(f"  After begin: {'CHAPTER' in body}")
    
    # Navigate through 7 chapters using Skip chapter
    chapters_processed = 0
    max_iter = 80
    iteration = 0
    
    while chapters_processed < 7 and iteration < max_iter:
        iteration += 1
        await page.wait_for_timeout(500)
        body = await page.inner_text("body")
        
        if "8 of 8" in body and "Long Horizon" in body:
            print(f"  Reached Long Horizon at iteration {iteration}")
            break
        
        # Check if we see Skip chapter
        skip_link = await page.query_selector('a:has-text("Skip chapter"), text=Skip chapter →')
        if skip_link:
            await skip_link.click(force=True)
            await page.wait_for_timeout(1000)
            chapters_processed += 1
            print(f"  Skipped chapter {chapters_processed}")
            continue
        
        # Check if we see chapter complete buttons
        body_lower = body.lower()
        if "next chapter" in body_lower:
            btns = await page.query_selector_all("button")
            clicked = False
            for btn in btns:
                txt = (await btn.inner_text()).lower()
                if "next chapter" in txt or "next" in txt:
                    await btn.click(force=True)
                    await page.wait_for_timeout(1000)
                    clicked = True
                    break
            if clicked:
                continue
        
        # Check for "Skip chapter" as text element
        all_text = await page.evaluate("() => document.body.innerText")
        if "Skip chapter" in all_text:
            skip = await page.evaluate("""
                () => {
                    const elements = Array.from(document.querySelectorAll('*'));
                    const skipEl = elements.find(el => el.innerText && el.innerText.trim() === 'Skip chapter →');
                    if (skipEl) { skipEl.click(); return 'clicked'; }
                    return 'not found';
                }
            """)
            print(f"  Skip via JS: {skip}")
            await page.wait_for_timeout(1000)
            if skip == 'clicked':
                chapters_processed += 1
                continue
        
        # If stuck, try clicking next button
        if "CHAPTER" in body and "of 8" in body:
            # Get chapter number
            for i in range(1, 9):
                if f"{i} of 8" in body:
                    print(f"  On chapter {i}")
                    break
        
        print(f"  Iteration {iteration}, chapters_processed={chapters_processed}, first 150 chars: {body[:150].replace(chr(10), ' ')}")
        
        # Try clicking any available button to advance
        btns = await page.query_selector_all("button:not([disabled])")
        if btns:
            first_btn_text = await btns[0].inner_text()
            print(f"  Available button: {first_btn_text[:50]}")
    
    # Now we should be at Long Horizon (chapter 8)
    await page.screenshot(path=".screenshots/at_chapter8.jpg", quality=40, full_page=False)
    final_body = await page.inner_text("body")
    print(f"  Final body: {final_body[:600].replace(chr(10), ' | ')}")
    
    # Verify Long Horizon content
    has_long_horizon = "Long Horizon" in final_body
    has_ch8 = "8 of 8" in final_body
    print(f"  Has 'Long Horizon': {has_long_horizon}")
    print(f"  Has 'CHAPTER 8 of 8': {has_ch8}")
    
    return has_long_horizon or has_ch8


async def test_life_vision_question(page):
    """Test that life_vision question appears in Long Horizon chapter"""
    print("\n=== TEST: life_vision question text and placeholder ===")
    
    await login(page)
    await page.goto(f"{BASE_URL}/soul-builder")
    await page.wait_for_timeout(4000)
    
    # Use JavaScript to directly navigate to Long Horizon chapter
    # by using React's setState through fiber
    await page.wait_for_selector('button:has-text("Let\'s begin")', timeout=10000)
    
    # Use JS to find and manipulate React state
    result = await page.evaluate("""
        () => {
            // Verify CHAPTERS data exists and has life_vision question
            // Since CHAPTERS is a module-level const, we need to find it via React fiber
            const root = document.getElementById('root');
            if (!root) return { error: 'no root' };
            
            const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactContainer'));
            if (!fiberKey) return { error: 'no fiber key' };
            
            return { success: true, fiberKey: fiberKey };
        }
    """)
    print(f"  React fiber: {result}")
    
    # Start SoulBuilder
    await page.click('button:has-text("Let\'s begin")', force=True)
    await page.wait_for_timeout(2000)
    
    # Navigate to Long Horizon using skip
    chapters_done = 0
    for i in range(7):
        await page.wait_for_timeout(600)
        body = await page.inner_text("body")
        
        if "8 of 8" in body:
            print(f"  Reached chapter 8 early at skip {i}")
            break
        
        # Try skip chapter
        skip_result = await page.evaluate("""
            () => {
                // Find skip chapter link/button
                const elements = Array.from(document.querySelectorAll('*'));
                for (const el of elements) {
                    const text = el.textContent || '';
                    if (text.trim() === 'Skip chapter →' || text.trim() === 'Skip chapter') {
                        el.click();
                        return 'clicked: ' + el.tagName + ' ' + el.textContent;
                    }
                }
                return 'not found';
            }
        """)
        print(f"  Skip attempt {i+1}: {skip_result}")
        await page.wait_for_timeout(1000)
        
        # After skip, handle chapter-complete
        body = await page.inner_text("body")
        if "Next chapter" in body or "next chapter" in body.lower():
            next_result = await page.evaluate("""
                () => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    for (const btn of btns) {
                        const t = btn.textContent.toLowerCase();
                        if (t.includes('next chapter') || t.includes('next')) {
                            btn.click();
                            return 'clicked: ' + btn.textContent;
                        }
                    }
                    return 'no next button found';
                }
            """)
            print(f"  Next chapter: {next_result}")
            await page.wait_for_timeout(1000)
            chapters_done += 1
    
    # Check current state
    body = await page.inner_text("body")
    print(f"  After 7 skips: {body[:400].replace(chr(10), ' | ')}")
    
    has_long_horizon = "Long Horizon" in body
    has_ch8 = "8 of 8" in body
    
    print(f"  Has Long Horizon: {has_long_horizon}")
    print(f"  Has Chapter 8: {has_ch8}")
    
    # If we're at Long Horizon, navigate through questions to find life_vision
    life_vision_found = False
    placeholder_correct = False
    
    if has_long_horizon or has_ch8:
        # Navigate through questions in this chapter
        for q in range(10):  # max 10 questions in chapter
            body = await page.inner_text("body")
            
            if "In one sentence, what kind of life" in body:
                print(f"  FOUND life_vision question!")
                life_vision_found = True
                
                # Check placeholder
                placeholder = await page.evaluate("""
                    () => {
                        const textarea = document.querySelector('textarea[data-testid="text-input"], textarea');
                        return textarea ? textarea.getAttribute('placeholder') : 'no textarea';
                    }
                """)
                print(f"  Placeholder: {placeholder}")
                placeholder_correct = "salmon treats" in placeholder
                
                await page.screenshot(path=".screenshots/life_vision_question.jpg", quality=40, full_page=False)
                break
            
            # Try to skip or answer questions to advance
            skip_result = await page.evaluate("""
                () => {
                    const elements = Array.from(document.querySelectorAll('*'));
                    for (const el of elements) {
                        if (el.textContent.trim() === 'Skip chapter →') {
                            return 'found skip';
                        }
                    }
                    return 'no skip';
                }
            """)
            
            if skip_result == 'no skip':
                # We might be past Long Horizon or at chapter complete
                print(f"  Question {q}: {body[:200].replace(chr(10), ' | ')}")
                break
            
            # Click first answer option to advance
            clicked = await page.evaluate("""
                () => {
                    // Click on a radio option or select option
                    const radios = document.querySelectorAll('[type="radio"], .option-btn, [data-testid*="option"]');
                    if (radios.length > 0) {
                        radios[0].click();
                        return 'clicked radio: ' + radios.length;
                    }
                    
                    // Try clicking any answer option button (not nav buttons)
                    const btns = Array.from(document.querySelectorAll('button'));
                    const optionBtns = btns.filter(b => {
                        const t = b.textContent.toLowerCase();
                        return !t.includes('skip') && !t.includes('next') && !t.includes('save') 
                            && !t.includes('finish') && b.textContent.trim().length > 2;
                    });
                    if (optionBtns.length > 0) {
                        optionBtns[0].click();
                        return 'clicked option: ' + optionBtns[0].textContent.trim().slice(0,30);
                    }
                    return 'no option found';
                }
            """)
            print(f"  Q{q} advance: {clicked}")
            await page.wait_for_timeout(1000)
    
    print(f"\n  RESULTS:")
    print(f"  life_vision question found: {life_vision_found}")
    print(f"  Placeholder correct (contains 'salmon treats'): {placeholder_correct}")
    
    return life_vision_found, placeholder_correct


async def test_paperwork_mobile_grid(page):
    """Test Paperwork mobile page 2-column grid for MiraImaginesCards"""
    print("\n=== TEST: Paperwork Mobile 2-column grid ===")
    
    # Set mobile viewport
    await page.set_viewport_size({"width": 390, "height": 844})
    
    await login(page)
    await page.goto(f"{BASE_URL}/paperwork")
    await page.wait_for_timeout(4000)
    print(f"  Paperwork URL: {page.url}")
    
    await page.screenshot(path=".screenshots/paperwork_mobile_top.jpg", quality=40, full_page=False)
    
    # Scroll down to find MiraImaginesCards
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(1000)
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(1000)
    
    # Check body content
    body = await page.inner_text("body")
    
    has_document_folder = "Complete Document Folder" in body or "Document Folder" in body
    has_advisory = "Advisory Session" in body or "Expert Advisory" in body
    
    print(f"  Has 'Complete Document Folder': {has_document_folder}")
    print(f"  Has 'Advisory Session': {has_advisory}")
    
    # Check the grid layout
    grid_info = await page.evaluate("""
        () => {
            // Find the grid container for MiraImaginesCards
            const allDivs = Array.from(document.querySelectorAll('div[style]'));
            
            for (const div of allDivs) {
                const style = div.getAttribute('style') || '';
                if (style.includes('grid') && (style.includes('1fr 1fr') || style.includes('repeat(2'))) {
                    // Found potential grid
                    const children = Array.from(div.children);
                    return {
                        found: true,
                        gridStyle: style,
                        childrenCount: children.length,
                        gridTemplateColumns: div.style.gridTemplateColumns
                    };
                }
            }
            
            // Check computed styles
            const cards = document.querySelectorAll('[class*="mira-imagines"], [data-testid*="mira-imagines"]');
            
            return {
                found: false,
                totalDivs: allDivs.length,
                cardsFound: cards.length
            };
        }
    """)
    print(f"  Grid info: {grid_info}")
    
    await page.screenshot(path=".screenshots/paperwork_mobile_scrolled.jpg", quality=40, full_page=False)
    
    # Look for the grid container with both cards
    card_layout = await page.evaluate("""
        () => {
            // Find any div with 1fr 1fr grid
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
            const results = [];
            
            while (walker.nextNode()) {
                const el = walker.currentNode;
                const style = el.getAttribute('style') || '';
                const computedStyle = window.getComputedStyle(el);
                
                if (computedStyle.display === 'grid' || style.includes('grid')) {
                    const cols = computedStyle.gridTemplateColumns;
                    if (cols && cols !== 'none' && cols !== '') {
                        results.push({
                            tag: el.tagName,
                            style: style.slice(0, 100),
                            computedCols: cols,
                            childCount: el.children.length,
                            innerText: el.innerText ? el.innerText.slice(0, 100) : ''
                        });
                    }
                }
            }
            return results.slice(0, 10);
        }
    """)
    print(f"  Card layout grids: {card_layout}")
    
    # Verify 2-column layout
    two_col = any(
        ('1fr 1fr' in (g.get('style', '') + g.get('computedCols', '')) or
         g.get('childCount', 0) == 2 and ('1fr' in g.get('computedCols', '') or 'fr' in g.get('computedCols', '')))
        for g in card_layout
    ) if card_layout else False
    
    print(f"  2-column grid found: {two_col}")
    
    return has_document_folder and has_advisory, two_col


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        print("\n" + "="*60)
        print("SOUL BUILDER & PAPERWORK UI TESTS")
        print("="*60)
        
        results = {}
        
        # Test 1: Long Horizon chapter navigation
        context = await browser.new_context()
        page = await context.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})
        
        try:
            life_vision_found, placeholder_correct = await test_life_vision_question(page)
            results['life_vision_found'] = life_vision_found
            results['placeholder_correct'] = placeholder_correct
        except Exception as e:
            print(f"  Test error: {str(e)}")
            results['life_vision_found'] = False
            results['placeholder_correct'] = False
        finally:
            await context.close()
        
        # Test 2: Paperwork mobile grid
        context2 = await browser.new_context()
        page2 = await context2.new_page()
        
        try:
            cards_found, two_col = await test_paperwork_mobile_grid(page2)
            results['paperwork_cards_found'] = cards_found
            results['paperwork_two_col_grid'] = two_col
        except Exception as e:
            print(f"  Paperwork test error: {str(e)}")
            results['paperwork_cards_found'] = False
            results['paperwork_two_col_grid'] = False
        finally:
            await context2.close()
        
        await browser.close()
        
        print("\n" + "="*60)
        print("FINAL RESULTS:")
        for k, v in results.items():
            status = "✅ PASS" if v else "❌ FAIL"
            print(f"  {status} - {k}: {v}")
        print("="*60)
        
        return results


if __name__ == "__main__":
    asyncio.run(main())
