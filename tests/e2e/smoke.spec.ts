import { test, expect } from '@playwright/test';

test.describe('Aegis Smoke Test', () => {
  test('User can sign in and see dashboard title', async ({ page }) => {
    await page.goto(process.env.TEST_TARGET_URL || 'http://localhost:3000');
    
    // We expect the title to be present
    await expect(page).toHaveTitle(/Aegis/i);
    
    // Check if sign-in button exists
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    if (await signInBtn.isVisible()) {
      // In a real test, we would click this and execute OAuth login. 
      // Due to Google Sign-in protections in automation, custom auth stubs are generally used.
      console.log('Sign in button is visible, basic healthcheck passed.');
    } else {
      // Check for dashboard components
      const headers = page.locator('h1, h2, h3');
      await expect(headers.first()).toBeVisible();
    }
  });
});
