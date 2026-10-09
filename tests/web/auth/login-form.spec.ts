import { test, expect, isMobile } from '../../../src/fixtures/test';
import { injectionPayloads, longText, malformedEmails } from '../../../src/data/test-data';
import { watchLoginRequests } from '../../../src/utils/network';

// These checks never press the submit button with valid data, so they run
// without the Cloudflare captcha. Note: the "Masuk" button is disabled until
// the captcha is solved, so a disabled button alone does not prove that
// validation worked. We also check the inline message and that no login
// request was sent.

test.describe('Login form (guest)', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('AUTH-004 malformed email shows an inline format error', { tag: '@P2' }, async ({ page, loginPage }) => {
    const sent = watchLoginRequests(page);

    for (const email of malformedEmails) {
      await loginPage.fill(email, 'Password123!');
      await loginPage.password.press('Tab');

      await expect(loginPage.emailFormatError, `no error for "${email}"`).toBeVisible();
      await expect(loginPage.submit).toBeDisabled();
    }

    await loginPage.submit.click({ force: true });
    expect(sent).toEqual([]);
  });

  test('AUTH-005 empty email and password cannot be submitted', { tag: '@P2' }, async ({ page, loginPage, header }) => {
    const sent = watchLoginRequests(page);

    await expect(loginPage.email).toHaveValue('');
    await expect(loginPage.password).toHaveValue('');
    await expect(loginPage.submit).toBeDisabled();

    await loginPage.submit.click({ force: true });
    await expect(page).toHaveURL(/\/login/);
    expect(sent).toEqual([]);
    if (!isMobile(page)) await expect(header.loginButton).toBeVisible();
  });

  test('AUTH-008 password is masked and the eye icon toggles it', { tag: '@P3' }, async ({ loginPage }) => {
    await loginPage.password.fill('Secret123!');
    await expect(loginPage.password).toHaveAttribute('type', 'password');

    await loginPage.togglePassword.click();
    await expect(loginPage.password).toHaveAttribute('type', 'text');
    await expect(loginPage.password).toHaveValue('Secret123!');

    await loginPage.togglePassword.click();
    await expect(loginPage.password).toHaveAttribute('type', 'password');
  });

  test('AUTH-009 very long email and password do not break the page', { tag: '@P3' }, async ({ page, loginPage, pageErrors }) => {
    const serverErrors: number[] = [];
    page.on('response', (response) => {
      if (response.status() >= 500) serverErrors.push(response.status());
    });

    await loginPage.fill(`${longText(300)}@example.com`, longText(500));
    await loginPage.password.press('Tab');

    await expect(loginPage.email).toBeVisible();
    await expect(loginPage.submit).toBeDisabled();
    expect(serverErrors).toEqual([]);
    expect(pageErrors.filter((e) => !e.includes('Minified React error #418'))).toEqual([]);
  });

  test('AUTH-010 injection payloads are rejected and never executed', { tag: '@P2' }, async ({ page, loginPage }) => {
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });
    const sent = watchLoginRequests(page);

    for (const payload of [injectionPayloads.sql, injectionPayloads.xss]) {
      await loginPage.fill(payload, 'Password123!');
      await loginPage.password.press('Tab');
      await expect(loginPage.emailFormatError).toBeVisible();
      await expect(loginPage.submit).toBeDisabled();
    }

    expect(dialogs).toEqual([]);
    expect(sent).toEqual([]);
  });

  test('AUTH-017 login page is interactive after load', { tag: '@P3' }, async ({ loginPage }) => {
    await expect(loginPage.email).toBeEditable();
    await expect(loginPage.password).toBeEditable();
    await expect(loginPage.googleButton).toBeEnabled();
    await expect(loginPage.facebookButton).toBeEnabled();
    await expect(loginPage.phoneButton).toBeEnabled();
    await expect(loginPage.forgotPassword).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('AUTH-019 Google login opens the Google sign-in page', { tag: '@P3' }, async ({ page, loginPage }) => {
    const popupPromise = page.waitForEvent('popup');
    await loginPage.googleButton.click();
    const popup = await popupPromise;

    await expect(popup).toHaveURL(/accounts\.google\.com/);
    await popup.close();
  });
});

test.describe('Login entry points (guest)', () => {
  test('AUTH-017 Masuk button in the header opens the login page on first click', { tag: ['@P3', '@desktop-only'] }, async ({ page, header }) => {
    await page.goto('/');
    await expect(header.loginButton).toBeEnabled();
    await header.loginButton.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTH-017 Masuk in the mobile menu opens the login page', { tag: ['@P3', '@mobile-only'] }, async ({ page, header }) => {
    await page.goto('/');
    await header.mobileMenuButton.click();
    await header.mobileMenuLogin.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
