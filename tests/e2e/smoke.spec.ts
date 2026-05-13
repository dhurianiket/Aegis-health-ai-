import { test, expect } from '@playwright/test';

test.describe('Aegis Smoke Test', () => {
  test('App loads, has correct title and sign-in button without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });
    
    // 1. App loads
    const response = await page.goto(process.env.TEST_TARGET_URL || 'http://localhost:3000');
    expect(response?.ok()).toBeTruthy(); // HTTP 200
    
    // 2. Page title contains "Aegis" or "Health"
    await expect(page).toHaveTitle(/Aegis|Health/i);
    
    // 3. Google Sign-In button is visible
    const signInBtn = page.getByRole('button', { name: /sign in|get started/i });
    await expect(signInBtn.first()).toBeVisible();
    
    // 4. No JavaScript console errors on load
    expect(errors).toHaveLength(0);
  });
});
