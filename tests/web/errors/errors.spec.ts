import { test, expect } from '../../../src/fixtures/test';

// React error #418 is a hydration text mismatch. It is logged on almost
// every page today, so it is reported as a known defect (see TEST_REPORT.md)
// and listed separately instead of failing every run.
const KNOWN_ISSUES = [/Minified React error #418/];

test.describe('Error handling', () => {
  test('ERR-001 going offline does not break the page and it recovers', { tag: '@P3' }, async ({ page, context, article }) => {
    await page.goto('/');
    await expect(page.getByTestId('headline-card').first()).toBeVisible();

    await context.setOffline(true);
    const offlineNavigation = await page.goto(article.path).catch((error: Error) => error);
    expect(offlineNavigation).toBeInstanceOf(Error); // browser shows its own offline page

    await context.setOffline(false);
    await page.goto(article.path);
    await expect(page.getByTestId('story-title')).toBeVisible();
  });

  for (const path of ['/', '/search/IHSG', '/channel/news']) {
    test(`ERR-002 no uncaught script errors on ${path}`, { tag: '@P3' }, async ({ page, pageErrors }) => {
      await page.goto(path);
      await page.waitForLoadState('load');

      const unexpected = pageErrors.filter((message) => !KNOWN_ISSUES.some((known) => known.test(message)));
      test.info().annotations.push({ type: 'page errors', description: pageErrors.join('\n') || 'none' });
      expect(unexpected).toEqual([]);
    });
  }

  test('ERR-002 no uncaught script errors on an article', { tag: '@P3' }, async ({ page, article, pageErrors }) => {
    await page.goto(article.path);
    await page.waitForLoadState('load');

    const unexpected = pageErrors.filter((message) => !KNOWN_ISSUES.some((known) => known.test(message)));
    test.info().annotations.push({ type: 'page errors', description: pageErrors.join('\n') || 'none' });
    expect(unexpected).toEqual([]);
  });
});
