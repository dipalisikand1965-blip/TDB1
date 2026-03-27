"""
Nav label font size check at 375px
"""
import asyncio
import json
from playwright.async_api import async_playwright

BASE_URL = "https://pet-soul-ranking.preview.emergentagent.com"


async def check_nav_fonts():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 375, "height": 667})
        page = await context.new_page()

        # Login
        await page.goto(BASE_URL + "/login", wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(2000)
        email_field = await page.query_selector('input[type="email"], input[name="email"]')
        pw_field = await page.query_selector('input[type="password"]')
        if email_field and pw_field:
            await email_field.fill("dipali@clubconcierge.in")
            await pw_field.fill("test123")
            submit = await page.query_selector('button[type="submit"]')
            if submit:
                await submit.click()
                await page.wait_for_timeout(3000)
                print(f"Logged in. URL: {page.url}")

        await page.goto(BASE_URL + "/dine", wait_until="domcontentloaded", timeout=25000)
        await page.wait_for_timeout(3000)

        # Check .nav-label elements
        nav_check = await page.evaluate("""() => {
            const results = {};
            
            // Check .nav-label class
            const navLabels = document.querySelectorAll('.nav-label');
            results.navLabelCount = navLabels.length;
            results.navLabelFonts = [];
            navLabels.forEach(function(el) {
                var cs = window.getComputedStyle(el);
                results.navLabelFonts.push({
                    text: (el.innerText || '').slice(0,20),
                    fontSize: cs.fontSize
                });
            });
            
            // Check bottom nav bar specifically
            var bottomNavs = document.querySelectorAll('nav, [class*="MobileNav"], [class*="mobile-nav"], [class*="bottomNav"]');
            results.bottomNavCount = bottomNavs.length;
            
            // Find all small text elements in nav contexts
            var smallItems = [];
            var allEls = document.querySelectorAll('span, p, div, a');
            for (var i = 0; i < allEls.length && smallItems.length < 10; i++) {
                var el = allEls[i];
                var cs = window.getComputedStyle(el);
                var fs = parseFloat(cs.fontSize);
                var text = (el.innerText || '').trim().slice(0,20);
                var cls = (el.className || '').toString();
                if (fs > 0 && text && el.children.length === 0 && cls.includes('nav')) {
                    smallItems.push({text: text, fontSize: cs.fontSize, class: cls.slice(0,40)});
                }
            }
            results.navTextItems = smallItems;
            
            return JSON.stringify(results);
        }""")
        
        print("Nav check result:", nav_check)
        data = json.loads(nav_check)
        
        print(f"navLabelCount: {data.get('navLabelCount')}")
        print(f"navLabelFonts: {data.get('navLabelFonts')}")
        print(f"bottomNavCount: {data.get('bottomNavCount')}")
        print(f"navTextItems: {data.get('navTextItems')}")
        
        # Phase 5A analysis
        nav_fonts = data.get('navLabelFonts', [])
        if nav_fonts:
            small = [f for f in nav_fonts if float(f['fontSize'].replace('px','')) < 14]
            if not small:
                print("PHASE5A [PASS] - All .nav-label elements >= 14px")
            else:
                print(f"PHASE5A [FAIL] - {len(small)} labels below 14px:", small)
        else:
            print("PHASE5A [UNKNOWN] - No .nav-label elements found at this viewport")
            print("  -> This may mean the nav bar uses inline styles instead of .nav-label class")
            
            # Check if the CSS rule is applied by checking if the class exists
            css_check = await page.evaluate("""() => {
                // Find any element that uses nav-label class to check CSS rule
                var testEl = document.createElement('span');
                testEl.className = 'nav-label';
                document.body.appendChild(testEl);
                var cs = window.getComputedStyle(testEl);
                var fs = cs.fontSize;
                document.body.removeChild(testEl);
                return fs;
            }""")
            print(f"  -> .nav-label CSS rule font-size: {css_check}")
            
            if css_check:
                fs_val = float(css_check.replace('px',''))
                if fs_val >= 14:
                    print(f"PHASE5A [PASS] - CSS rule sets .nav-label to {css_check} (>= 14px), but no elements use this class currently")
                else:
                    print(f"PHASE5A [FAIL] - CSS rule sets .nav-label to {css_check} (< 14px)")
        
        await page.screenshot(path=".screenshots/p5a_nav_375.jpg", quality=40, full_page=False)
        print("Screenshot saved: .screenshots/p5a_nav_375.jpg")
        
        await browser.close()


asyncio.run(check_nav_fonts())
