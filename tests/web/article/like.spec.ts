import { test, expect, useLoggedInUser } from '../../../src/fixtures/test';

// Likes change real data on kumparan.com. Every test puts the like back to
// how it was (afterEach), so the account and the article end up unchanged.

test.describe('Like (logged in)', () => {
  useLoggedInUser();

  test.beforeEach(async ({ article, articlePage }) => {
    await articlePage.goto(article.path);
    if (await articlePage.isLiked()) {
      await articlePage.likeButton.click();
      await expect.poll(() => articlePage.isLiked()).toBe(false);
    }
  });

  test.afterEach(async ({ articlePage }) => {
    if (await articlePage.isLiked()) {
      await articlePage.likeButton.click();
      await expect.poll(() => articlePage.isLiked()).toBe(false);
    }
  });

  test('LIKE-001 liking an article adds one to the count', { tag: '@P1' }, async ({ articlePage }) => {
    const before = await articlePage.likeCount();
    await articlePage.likeButton.click();

    await expect.poll(() => articlePage.isLiked()).toBe(true);
    await expect.poll(() => articlePage.likeCount()).toBe(before + 1);
  });

  test('LIKE-002 unlike puts the count back', { tag: '@P1' }, async ({ articlePage }) => {
    const before = await articlePage.likeCount();
    await articlePage.likeButton.click();
    await expect.poll(() => articlePage.isLiked()).toBe(true);

    await articlePage.likeButton.click();

    await expect.poll(() => articlePage.isLiked()).toBe(false);
    await expect.poll(() => articlePage.likeCount()).toBe(before);
  });

  test('LIKE-003 like is still there after reload', { tag: '@P2' }, async ({ page, articlePage }) => {
    const before = await articlePage.likeCount();
    await articlePage.likeButton.click();
    await expect.poll(() => articlePage.isLiked()).toBe(true);

    await page.reload();

    await expect.poll(() => articlePage.isLiked()).toBe(true);
    expect(await articlePage.likeCount()).toBe(before + 1);
  });

  test('LIKE-004 fast double click never counts twice', { tag: '@P2' }, async ({ page, articlePage }) => {
    const before = await articlePage.likeCount();
    await articlePage.likeButton.dblclick();
    await page.waitForLoadState('networkidle');
    await page.reload();

    const after = await articlePage.likeCount();
    const liked = await articlePage.isLiked();
    expect(after).toBe(liked ? before + 1 : before);
  });

  test('LIKE-005 failed like request does not show a fake like', { tag: '@P3' }, async ({ page, articlePage }) => {
    const before = await articlePage.likeCount();
    await page.route(/graphql.*kumparan\.com/, (route) =>
      /like/i.test(route.request().postData() ?? '') ? route.fulfill({ status: 500, body: '{}' }) : route.fallback(),
    );

    await articlePage.likeButton.click();

    await expect.poll(() => articlePage.likeCount()).toBe(before);
    await expect.poll(() => articlePage.isLiked()).toBe(false);
  });

  test('LIKE-006 like count is a valid number', { tag: '@P3' }, async ({ articlePage }) => {
    const text = (await articlePage.likeButton.innerText()).trim();
    expect(text).toMatch(/^(\d+|\d+(,\d)?(rb|jt))$/);
    expect(await articlePage.likeCount()).toBeGreaterThanOrEqual(0);
  });
});
