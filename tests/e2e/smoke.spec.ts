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
    
    const targetUrl = process.env.TEST_TARGET_URL || 'https://aegishealthai.co.in';
    expect(targetUrl, 'TEST_TARGET_URL must be set').toBeTruthy();
    
    // 1. App loads with networkidle timeout
    const response = await page.goto(targetUrl!, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const status = response?.status() ?? 0;
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);
    
    // 2. Page title contains "Aegis" or "Health"
    await expect(page).toHaveTitle(/Aegis|Health/i, { timeout: 20000 });
    
    // 3. Google Sign-In / Get Started button is visible
    const signInBtn = page.getByRole('button', { name: /sign in|get started|login|start|upload/i });
    await expect(signInBtn.first()).toBeVisible({ timeout: 25000 });
    
    // 4. No unhandled application errors on load
    expect(errors).toHaveLength(0);
  });
});
