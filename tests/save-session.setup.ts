import { test as setup, expect } from '@playwright/test';
import { AUTH_FILE, credentials } from '../src/utils/env';

// kumparan login is protected by Cloudflare Turnstile ("Verify you are human").
// We do not try to bypass it. This setup fills the form, then waits for a
// person to tick the captcha in the opened browser. The session is saved to
// .auth/user.json and reused by every logged-in test until it expires.
setup('save logged-in session', async ({ page }) => {
  const { email, password } = credentials();

  await page.goto('/login');
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-password').fill(password);

  console.log('\n>>> Tick "Verify you are human" in the browser window (you have 3 minutes).\n');
  const submit = page.getByTestId('btn-save');
  await expect(submit).toBeEnabled({ timeout: 3 * 60_000 });
  await submit.click();

  await expect(page.getByTestId('hd-login')).toBeHidden({ timeout: 30_000 });
  await page.context().storageState({ path: AUTH_FILE });
});
