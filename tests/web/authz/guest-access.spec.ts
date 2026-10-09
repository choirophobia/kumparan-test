import { test, expect, isMobile } from '../../../src/fixtures/test';
import { comments } from '../../../src/data/test-data';
import { blockOutgoingWrites } from '../../../src/utils/network';

// Guest = no session. These tests make sure actions that need an account
// send the user to the login page, while reading and sharing stay open.

test.describe('Guest access rules', () => {
  test('AUTHZ-001 guest pressing Like is sent to login and the count does not change', { tag: '@P1' }, async ({ page, article, articlePage }) => {
    await articlePage.goto(article.path);
    const before = await articlePage.likeCount();

    await articlePage.likeButton.click();
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();
    await expect(articlePage.likeButton).toBeVisible();
    expect(await articlePage.likeCount()).toBe(before);
    expect(await articlePage.isLiked()).toBe(false);
  });

  test('AUTHZ-002 guest cannot send a comment', { tag: '@P1' }, async ({ page, article, commentPage }) => {
    await commentPage.goto(article);
    await commentPage.input.fill(comments.normal);

    // the click stays inside the browser, nothing is posted
    const blocked = await blockOutgoingWrites(page);
    await commentPage.sendButton.click();

    // expected: a login page or prompt. Today nothing happens at all.
    await expect(page, 'guest pressed send and was not asked to log in').toHaveURL(/\/login/);
    expect(blocked, 'a comment request left the browser before login').toEqual([]);
  });

  // Pressing "Laporkan" opens a final "Konfirmasi" dialog (Batal / Ya).
  // A guest should be asked to log in before reaching that dialog. We stop
  // at the dialog and press Batal, "Ya" is never pressed.
  test('AUTHZ-003 guest pressing Laporkan tulisan must log in before the final confirm', { tag: '@P2' }, async ({ page, article, articlePage, reportPage }) => {
    await articlePage.goto(article.path);
    await articlePage.scrollToFooter();
    await articlePage.reportLink.click();
    if (/\/login/.test(page.url())) return; // asked to log in straight away

    await expect(page).toHaveURL(new RegExp(`/report/story/${article.slug}`));
    await reportPage.reason(0).click();
    await reportPage.submit.click();

    const reachedConfirm = await reportPage.confirmDialog.isVisible();
    if (reachedConfirm) await reportPage.confirmCancel.click();
    expect(reachedConfirm, 'guest reached the final report confirmation without logging in').toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTHZ-004 guest opening the report URL directly must log in before the final confirm', { tag: '@P2' }, async ({ page, article, reportPage }) => {
    await reportPage.goto(article);
    await reportPage.reason(0).click();
    await reportPage.submit.click();

    const reachedConfirm = await reportPage.confirmDialog.isVisible();
    if (reachedConfirm) await reportPage.confirmCancel.click();
    expect(reachedConfirm, 'guest reached the final report confirmation without logging in').toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTHZ-005 guest can read and copy the article link without logging in', { tag: '@P1' }, async ({ page, context, browserName, article, articlePage }) => {
    test.skip(browserName !== 'chromium', 'clipboard permission is Chromium only');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await articlePage.goto(article.path);
    await expect(articlePage.title).not.toBeEmpty();
    await expect(articlePage.paragraphs.first()).not.toBeEmpty();

    await articlePage.copyLink.click();
    await expect(articlePage.copiedAlert).toHaveText('URL berhasil disalin');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('AUTHZ-006 guest header shows Masuk and Buat Tulisan asks for login', { tag: ['@P2', '@desktop-only'] }, async ({ page, header }) => {
    await page.goto('/');
    await expect(header.loginButton).toBeVisible();
    await expect(header.avatar).toHaveCount(0);

    await header.createStoryButton.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTHZ-006 guest mobile menu shows Masuk', { tag: ['@P2', '@mobile-only'] }, async ({ page, header }) => {
    await page.goto('/');
    await header.mobileMenuButton.click();
    await expect(header.mobileMenuLogin).toBeVisible();
    await expect(header.avatar).toHaveCount(0);
    expect(isMobile(page)).toBe(true);
  });
});
