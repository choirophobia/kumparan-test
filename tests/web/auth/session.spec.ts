import { test, expect, useLoggedInUser, isMobile } from '../../../src/fixtures/test';

// Uses the saved session from `npm run auth:save`. Logout is NOT tested here:
// logging out would end the shared session for every other test. Logout runs
// in the captcha project with its own fresh login (login-submit.spec.ts).

test.describe('Logged-in session', () => {
  useLoggedInUser();

  test('AUTH-015 session survives reload and a new tab', { tag: '@P2' }, async ({ page, context, header }) => {
    test.skip(isMobile(page), 'desktop header');
    await page.goto('/');
    await expect(header.loginButton).toBeHidden();

    await page.reload();
    await expect(header.loginButton).toBeHidden();

    const second = await context.newPage();
    await second.goto('/');
    await expect(second.getByTestId('hd-login')).toBeHidden();
    await second.close();
  });

  test('AUTH-016 logged-in user opening /login is sent to the homepage', { tag: '@P3' }, async ({ page, loginPage }) => {
    await page.goto('/login');

    await expect(page).not.toHaveURL(/\/login/);
    await expect(loginPage.email).toHaveCount(0);
  });

  test('PRF-001 profile menu lists account actions', { tag: ['@P3', '@desktop-only'] }, async ({ page, header }) => {
    await page.goto('/');
    await header.avatar.click();

    await expect(header.logoutButton).toBeVisible();
  });
});
