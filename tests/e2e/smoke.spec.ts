import { test, expect } from '@playwright/test';

test.describe('Aegis Smoke Test', () => {
  test('App loads, has correct title and sign-in button without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });
    
    const targetUrl = process.env.TEST_TARGET_URL;
    expect(targetUrl, 'TEST_TARGET_URL must be set in CI').toBeTruthy();
    
    // 1. App loads
    const response = await page.goto(targetUrl!);
    const status = response?.status() ?? 0;
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);
    
    // 2. Page title contains "Aegis" or "Health"
    await expect(page).toHaveTitle(/Aegis|Health/i);
    
    // 3. Google Sign-In button is visible
    const signInBtn = page.getByRole('button', { name: /sign in|get started|login|start/i });
    await expect(signInBtn.first()).toBeVisible({ timeout: 10000 });
    
    // 4. No JavaScript console errors on load
    expect(errors).toHaveLength(0);
  });
});
