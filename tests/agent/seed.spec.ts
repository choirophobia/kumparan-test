import { test, expect } from '../../src/fixtures/test';

// Seed for Playwright Agents. The planner and generator start from this
// state: ads blocked, the Video Story promo auto-closed, homepage loaded.
test('seed', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('headline-card').first()).toBeVisible();
});
