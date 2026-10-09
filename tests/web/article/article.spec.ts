import { test, expect } from '../../../src/fixtures/test';
import { parseIndonesianDate } from '../../../src/utils/date';

test.describe('Article page', () => {
  test.beforeEach(async ({ article, articlePage }) => {
    await articlePage.goto(article.path);
  });

  test('ART-001 article shows title, author, date, reading time, body and actions', { tag: '@P1' }, async ({ articlePage }) => {
    await expect(articlePage.title).not.toBeEmpty();
    await expect(articlePage.author).not.toBeEmpty();
    await expect(articlePage.publishDate).toBeVisible();
    await expect(articlePage.readingTime).toContainText('waktu baca');
    await expect(articlePage.body).toBeVisible();
    await expect(articlePage.paragraphs.first()).not.toBeEmpty();

    await expect(articlePage.likeButton).toBeVisible();
    await expect(articlePage.commentButton).toBeVisible();
    await expect(articlePage.shareWrapper).toBeVisible();
  });

  test('ART-002 page title and og:title match the story title', { tag: '@P2' }, async ({ page, articlePage }) => {
    const storyTitle = (await articlePage.title.innerText()).trim();

    await expect(page).toHaveTitle(`${storyTitle} | kumparan.com`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', storyTitle);
  });

  test('ART-003 topic tag opens its topic page', { tag: '@P3' }, async ({ page, articlePage }) => {
    await articlePage.scrollToFooter();
    const tag = articlePage.topicTags.first();
    const href = await tag.getAttribute('href');
    expect(href).toBeTruthy();

    await tag.click();

    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    await expect(page.getByTestId('news-item').or(page.getByTestId('news-card')).first()).toBeVisible();
  });

  test('ART-004 image zoom opens and closes', { tag: '@P3' }, async ({ page, articlePage }) => {
    const zoom = articlePage.zoomImage;
    test.skip((await zoom.count()) === 0, 'this article has no zoomable image');

    await zoom.click();
    await expect(articlePage.lightbox).toBeAttached();
    await expect(articlePage.lightbox.locator('img').first()).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(articlePage.lightbox).toHaveCount(0);
    await articlePage.likeButton.click({ trial: true }); // nothing left on top of the page
  });

  test('ART-005 long article renders to the end with footer and report link', { tag: '@P2' }, async ({ articlePage }) => {
    await articlePage.scrollToFooter();

    await expect(articlePage.endOfArticle).toBeAttached();
    expect(await articlePage.storyPages.count()).toBeGreaterThan(0);
    await expect(articlePage.footer).toBeVisible();
    await expect(articlePage.topicTags.first()).toBeVisible();
    await expect(articlePage.reportLink).toBeVisible();
  });

  test('ART-006 publish date is valid and not in the future', { tag: '@P3' }, async ({ articlePage }) => {
    const text = await articlePage.publishDate.innerText();
    const published = parseIndonesianDate(text);

    expect(published, `cannot read date "${text}"`).not.toBeNull();
    expect(published!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  test('ART-007 article is readable on a slow connection', { tag: ['@P3', '@desktop-only'] }, async ({ page, browserName, article, articlePage }) => {
    test.skip(browserName !== 'chromium', 'network throttling uses Chrome DevTools Protocol');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 400,
      downloadThroughput: (400 * 1024) / 8, // "Slow 3G"
      uploadThroughput: (400 * 1024) / 8,
    });

    await page.goto(article.path, { timeout: 45_000, waitUntil: 'commit' });

    await expect(articlePage.title).toBeVisible({ timeout: 30_000 });
    await expect(articlePage.paragraphs.first()).toBeVisible({ timeout: 30_000 });
  });

  test('ART-008 organisation info opens from the footer', { tag: '@P4' }, async ({ page, articlePage }) => {
    await articlePage.scrollToFooter();
    await articlePage.organisationInfo.click();

    await expect(page).toHaveURL(/organisation-info/);
    await expect(page.locator('main')).not.toBeEmpty();
  });
});
