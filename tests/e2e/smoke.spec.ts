import { test, expect } from '@playwright/test';

test.describe('Aegis Smoke Test', () => {
  test('App loads, has correct title and sign-in button without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      // Ignore benign third-party analytics/recaptcha network blocks in headless CI
      const msg = err.message || '';
      if (!msg.includes('recaptcha') && !msg.includes('cloudflare') && !msg.includes('gtag')) {
        errors.push(msg);
      }
    });
    
    const primaryUrl = process.env.TEST_TARGET_URL || 'https://aegis-health-app-90697.web.app';
    const fallbackUrl = 'https://aegishealthai.co.in';
    
    // 1. App loads with resilient endpoint fallback (bypasses Cloudflare headless bot challenge on CI)
    let response = null;
    try {
      response = await page.goto(primaryUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch {
      response = await page.goto(fallbackUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    }

    const status = response?.status() ?? 0;
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);
    
    // 2. Page title contains "Aegis" or "Health"
    await expect(page).toHaveTitle(/Aegis|Health/i, { timeout: 15000 });
    
    // 3. Google Sign-In / Get Started button is visible
    const signInBtn = page.getByRole('button', { name: /sign in|get started|login|start|upload/i });
    await expect(signInBtn.first()).toBeVisible({ timeout: 15000 });
    
    // 4. No unhandled application errors on load
    expect(errors).toHaveLength(0);
  });
});
