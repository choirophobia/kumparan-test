import { test, expect } from '../../../src/fixtures/test';

// Mobile only. kumparan serves phones from m.kumparan.com with a different
// layout, so these checks make sure the core features are still reachable.

test.describe('Mobile layout', { tag: '@mobile-only' }, () => {
  test('MOB-001 homepage has no sideways scroll', { tag: '@P1' }, async ({ page, header }) => {
    await page.goto('/');
    await expect(header.root).toBeVisible();
    await expect(page.getByTestId('headline-card').first()).toBeVisible();

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
  });

  test('MOB-002 like, comment, share and report are reachable on an article', { tag: '@P1' }, async ({ page, article, articlePage }) => {
    await articlePage.goto(article.path);

    for (const control of [articlePage.likeButton, articlePage.commentButton, articlePage.copyLink]) {
      await control.scrollIntoViewIfNeeded();
      await expect(control).toBeVisible();
      await control.click({ trial: true }); // nothing on top of it
    }

    await articlePage.commentButton.click();
    await expect(page).toHaveURL(/\/response\//);
    await page.goBack();

    await articlePage.scrollToFooter();
    await articlePage.reportLink.click();
    await expect(page).toHaveURL(/\/report\/story\//);
  });

  test('MOB-003 phones get the mobile site, not the desktop layout', { tag: '@P2' }, async ({ page, header }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/m\.kumparan\.com/);
    await expect(header.mobileMenuButton).toBeVisible();
    await expect(page.getByTestId('desktop-page-container')).toHaveCount(0);
    await expect(page.locator('[data-qa-id^="desktop-"]')).toHaveCount(0);
  });

  test('MOB-004 sticky header never covers the engagement buttons', { tag: '@P3' }, async ({ page, article, articlePage, header }) => {
    await articlePage.goto(article.path);
    await articlePage.likeButton.scrollIntoViewIfNeeded();

    for (let i = 0; i < 4; i++) {
      const button = await articlePage.likeButton.boundingBox();
      const bar = await header.root.boundingBox();
      if (button && bar && button.y < bar.y + bar.height) {
        expect(button.y + button.height, 'like button is under the header').toBeLessThanOrEqual(bar.y);
      }
      await page.mouse.wheel(0, 150);
    }
  });

  test('MOB-005 rotating to landscape keeps the content and no sideways scroll', { tag: '@P4' }, async ({ page, article, articlePage }) => {
    await articlePage.goto(article.path);
    await articlePage.paragraphs.nth(1).scrollIntoViewIfNeeded();
    const size = page.viewportSize()!;

    await page.setViewportSize({ width: size.height, height: size.width });

    await expect(articlePage.title).toBeAttached();
    await expect(articlePage.paragraphs.first()).not.toBeEmpty();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
