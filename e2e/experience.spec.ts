import { test, expect } from '@playwright/test';

test.describe('Maa Sita Int Udhyog E2E Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Intercept Turnstile API loading to avoid external network request in test
    await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.turnstile = { render: () => "mock-widget-id", reset: () => {} };',
      });
    });

    // Intercept form submissions
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Message sent successfully.' }),
      });
    });

    await page.route('/api/quote', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Quote processed.' }),
      });
    });
  });

  test('User can land on entrance screen and enter experience', async ({ page }) => {
    await page.goto('/');
    // Let dynamic device tier capability checks resolve and settle layout state
    await page.waitForTimeout(1000);

    // Check title and entrance screen elements based on rendering tier
    await expect(page).toHaveTitle(/Maa Sita/);

    const skipBtn = page.locator('button:has-text("SKIP TO WEBSITE")');
    const continueBtn = page.locator('button:has-text("CONTINUE TO FULL SITE")');

    if (await skipBtn.isVisible()) {
      const entryTitle = page.locator('h1:has-text("MAA SITA")');
      await expect(entryTitle).toBeVisible();
      const enterBtn = page.locator('button:has-text("ENTER EXPERIENCE")');
      await expect(enterBtn).toBeVisible();
      await skipBtn.click();
    } else {
      await expect(continueBtn).toBeVisible();
      await continueBtn.click();
    }
    await expect(page.locator('text=Architectural clay products built from Earth')).toBeVisible();
  });

  test('User can navigate between conventional pages', async ({ page }) => {
    await page.goto('/');
    // Let dynamic device tier capability checks resolve and settle layout state
    await page.waitForTimeout(1000);
    
    // Skip to home page dynamically based on layout tier
    const skipBtn = page.locator('button:has-text("SKIP TO WEBSITE")');
    const continueBtn = page.locator('button:has-text("CONTINUE TO FULL SITE")');

    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    } else if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }

    // Verify navigation links are present and active (use footer fallback on mobile screens)
    let manufacturingLink = page.locator('header nav[aria-label="Main Navigation"] a[href="/manufacturing"]');
    if (!(await manufacturingLink.isVisible())) {
      manufacturingLink = page.locator('footer a[href="/manufacturing"]');
    }
    await expect(manufacturingLink).toBeVisible();
    await manufacturingLink.click();
    await expect(page).toHaveURL(/\/manufacturing$/);
    await expect(page.locator('h1:has-text("FIRED BY PRECISION")')).toBeVisible();

    let qualityLink = page.locator('header nav[aria-label="Main Navigation"] a[href="/quality"]');
    if (!(await qualityLink.isVisible())) {
      qualityLink = page.locator('footer a[href="/quality"]');
    }
    await expect(qualityLink).toBeVisible();
    await qualityLink.click();
    await expect(page).toHaveURL(/\/quality$/);
    await expect(page.locator('h1:has-text("STANDARDS WE UPHOLD")')).toBeVisible();
  });

  test('Contact Form validation and successful submit flow', async ({ page }) => {
    await page.goto('/contact');

    // Attempt submit with empty values to check validation
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Check accessibility-live validation warnings
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Phone number is required')).toBeVisible();
    
    // Fill values
    await page.fill('input[name="name"]', 'Akhilesh Bhai');
    await page.fill('input[name="phone"]', '+919999999999');
    await page.fill('input[name="email"]', 'akhilesh@maasitaudhyog.com');
    await page.fill('textarea[name="message"]', 'E2E Testing of Maa Sita Bricks');

    // Consent DPDP checkbox is required
    await submitBtn.click();
    await expect(page.locator('text=You must grant consent to process your business data')).toBeVisible();

    // Check consent box
    await page.check('input#contact-consent');

    // Submit form (API is mocked)
    await submitBtn.click();
    await expect(page.locator('text=MESSAGE PERSISTED SECURELY')).toBeVisible();
  });

  test('Quote Request validation and submit flow', async ({ page }) => {
    await page.goto('/request-quote');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Confirm field validation
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Phone number is required')).toBeVisible();
    await expect(page.locator('text=Project delivery location coordinates are required')).toBeVisible();

    // Fill form
    await page.fill('input[name="name"]', 'Dev Sec Ops');
    await page.fill('input[name="phone"]', '+918888888888');
    await page.fill('input[name="email"]', 'devsecops@maasitaudhyog.com');
    await page.fill('input[name="projectLocation"]', 'Kiln Road, Varanasi, UP');
    await page.fill('input[name="estimatedQty"]', '10000');
    await page.selectOption('select[name="qtyUnit"]', 'pieces');
    
    await page.check('input#quote-consent');

    await submitBtn.click();
    await expect(page.locator('text=ESTIMATE DATA LOGGED SECURELY')).toBeVisible();
  });
});
