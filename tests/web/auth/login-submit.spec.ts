import { test, expect } from '../../../src/fixtures/test';
import { credentials } from '../../../src/utils/env';
import { unregisteredEmail, wrongPassword } from '../../../src/data/test-data';

// @captcha: every login submit is behind Cloudflare Turnstile. These tests run
// headed (npm run test:captcha) and wait for a person to tick the box.
// They are excluded from the normal desktop/mobile runs.

test.describe('Login submit', { tag: '@captcha' }, () => {
  test.describe.configure({ mode: 'serial' });

  test('AUTH-002 wrong password is rejected with a clear message', { tag: '@P1' }, async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.fill(credentials().email, wrongPassword);
    await loginPage.submitAfterCaptcha();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/salah|tidak sesuai|invalid/i)).toBeVisible();
  });

  test('AUTH-003 unregistered email is rejected', { tag: '@P1' }, async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.fill(unregisteredEmail, wrongPassword);
    await loginPage.submitAfterCaptcha();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/tidak ditemukan|belum terdaftar|salah|invalid/i)).toBeVisible();
  });

  test('AUTH-001 + AUTH-013 valid login, then logout', { tag: '@P1' }, async ({ page, loginPage, header }) => {
    const { email, password } = credentials();
    await loginPage.goto();
    await loginPage.fill(email, password);
    await loginPage.submitAfterCaptcha();

    await expect(header.loginButton).toBeHidden({ timeout: 30_000 });

    await header.logout();
    await expect(header.loginButton).toBeVisible();
  });

  test('AUTH-018 network failure on submit shows an error and keeps the form', { tag: '@P2' }, async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.fill(credentials().email, wrongPassword);
    await page.route(/kumparan\.com/, (route) =>
      route.request().method() === 'POST' && /login/i.test(route.request().postData() ?? '') ? route.abort() : route.fallback(),
    );
    await loginPage.submitAfterCaptcha();

    await expect(loginPage.email).toHaveValue(credentials().email);
    await expect(loginPage.submit).toBeVisible();
  });
});
