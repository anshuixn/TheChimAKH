import { test, expect } from '@playwright/test';

test.describe('Responsive Navigation & Mobile Drawer (Workstream B & H1)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept Turnstile API loading to avoid external request issues
    await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.turnstile = { render: () => "mock-widget-id", reset: () => {} };',
      });
    });
  });

  const VIEWPORTS = [320, 360, 375, 390, 768];

  for (const width of VIEWPORTS) {
    test(`Viewport ${width}px - scrollWidth and overflow invariant check`, async ({ page }) => {
      await page.setViewportSize({ width, height: 600 });
      await page.goto('/');
      await page.waitForTimeout(500);

      // Verify the document-level horizontal overflow invariant holds (0.5px rounding tolerance)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 0.5);
    });

    test(`Viewport ${width}px - mobile navigation drawer interactions`, async ({ page }) => {
      await page.setViewportSize({ width, height: 600 });
      await page.goto('/');
      await page.waitForTimeout(500);

      // Mobile viewports immediately direct to STATIC_FALLBACK page (since < 1024px)
      await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'static-fallback-ready');

      // Click "CONTINUE TO FULL SITE" to get to main home page
      const continueBtn = page.locator('button:has-text("CONTINUE TO FULL SITE")');
      await expect(continueBtn).toBeVisible();
      await continueBtn.click();
      await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'idle');

      // 1. Hamburger button should be visible
      const hamburger = page.locator('button[aria-label="Open navigation menu"]');
      await expect(hamburger).toBeVisible();
      await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

      // 2. Open drawer
      await hamburger.click();
      await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('body')).toHaveAttribute('data-mobile-nav-state', 'open');

      const drawer = page.locator('#mobile-nav-drawer');
      await expect(drawer).toBeVisible();
      await expect(drawer).toHaveClass(/drawerOpen/);

      // Verify body scroll lock is active
      const bodyOverflow = await page.evaluate(() => getComputedStyle(document.body).overflow);
      expect(bodyOverflow).toBe('hidden');

      // 3. Close drawer via Escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('body')).toHaveAttribute('data-mobile-nav-state', 'closed');
      await expect(drawer).not.toHaveClass(/drawerOpen/);

      // Verify body scroll lock is restored
      const bodyOverflowAfterClose = await page.evaluate(() => getComputedStyle(document.body).overflow);
      expect(bodyOverflowAfterClose).not.toBe('hidden');

      // Focus should be returned to hamburger button
      const isHamburgerFocused = await hamburger.evaluate((el) => document.activeElement === el);
      expect(isHamburgerFocused).toBe(true);

      // 4. Open again and close via close button
      await hamburger.click();
      await expect(page.locator('body')).toHaveAttribute('data-mobile-nav-state', 'open');
      
      const closeBtn = page.locator('button[aria-label="Close navigation menu"]');
      await closeBtn.click();
      await expect(page.locator('body')).toHaveAttribute('data-mobile-nav-state', 'closed');

      // 5. Open and click link to navigate (should close drawer auto-actively)
      await hamburger.click();
      const manufacturingLink = page.locator('#mobile-nav-drawer a[href="/manufacturing"]');
      await manufacturingLink.click();
      await expect(page).toHaveURL(/\/manufacturing$/);
      await expect(page.locator('body')).toHaveAttribute('data-mobile-nav-state', 'closed');
    });
  }

  test('Desktop viewports hide mobile drawer controls', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForTimeout(500);

    const hamburger = page.locator('button[aria-label="Open navigation menu"]');
    await expect(hamburger).not.toBeVisible();
  });
});

test.describe('Hero Transition Geometry & Animations (Workstream D & H2)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('Hero transition state flow and DOM scaling transformations', async ({ page, isMobile }) => {
    // Cinematic transition is skipped in mobile emulation profiles
    test.skip(isMobile, 'Cinematic transitions are disabled on mobile devices');

    await page.goto('/');
    
    // Desktop starts on ENTRY page
    await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'entry-idle');

    const enterBtn = page.locator('button:has-text("ENTER EXPERIENCE")');
    await expect(enterBtn).toBeVisible();

    // Trigger transition zoom
    await enterBtn.click();
    
    // Instantly check entering status attribute on body
    await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'transition-entering');

    // Bounding box of the zoom targets must have transform calculations applied
    const posterImg = page.locator('img[src="/experience/posters/poster-entrance.png"]');
    await expect(posterImg).toHaveClass(/posterImageZoomed/);

    // After scale finishes, it progresses into cinematic rendering states (loading / ready)
    // We use standard regex checks to automatically await the status change cleanly
    // A 10s timeout is used to cover the 1.5s idle pre-delay and sequential local frame loading
    await expect(page.locator('body')).toHaveAttribute('data-experience-state', /cinematic-loading|cinematic-ready/, { timeout: 10000 });
  });
});
