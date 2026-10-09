import { test, expect, isMobile } from '../../../src/fixtures/test';
import { injectionPayloads, search } from '../../../src/data/test-data';

test.describe('Search', () => {
  test('SRCH-001 existing keyword returns relevant results', { tag: '@P1' }, async ({ page, header, searchPage }) => {
    await page.goto('/');
    await header.search(search.keyword, isMobile(page));

    await expect(page).toHaveURL(new RegExp(`/search/${search.keyword}`));
    await expect(searchPage.results.first()).toBeVisible();
    const titles = await searchPage.results.allInnerTexts();
    expect(titles.some((t) => t.toLowerCase().includes(search.keyword.toLowerCase()))).toBe(true);
  });

  test('SRCH-002 keyword with no match shows an empty state', { tag: '@P2' }, async ({ searchPage }) => {
    await searchPage.goto(search.noResults);

    await expect(searchPage.emptyState).toBeVisible();
    await expect(searchPage.results).toHaveCount(0);
  });

  test('SRCH-003 empty search does not run a search', { tag: ['@P3', '@desktop-only'] }, async ({ page, header, searchPage }) => {
    await page.goto('/');
    await header.searchInput.press('Enter');

    // kumparan opens the plain /search page (popular searches), no results list
    await expect(page).toHaveURL(/\/search\/?$/);
    await expect(searchPage.results).toHaveCount(0);
  });

  test('SRCH-004 one character and 300 character queries are handled', { tag: '@P3' }, async ({ page, searchPage }) => {
    await searchPage.goto(search.single);
    await expect(searchPage.results.first()).toBeVisible();

    const response = await page.goto(`/search/${search.long}`);
    expect(response?.status()).toBeLessThan(500);
    await expect(searchPage.storyTab).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(width, 'page scrolls sideways').toBeLessThanOrEqual(0);
  });

  test('SRCH-005 script in the search box is shown as text, not run', { tag: '@P2' }, async ({ page, searchPage }) => {
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    await searchPage.goto(injectionPayloads.xss);

    await expect(searchPage.emptyState).toBeVisible();
    expect(dialogs).toEqual([]);
    expect(await page.locator('main script:not([src])').evaluateAll((s) => s.filter((x) => x.textContent?.includes('alert(1)')).length)).toBe(0);
  });

  test('SRCH-006 search works from the mobile header', { tag: ['@P1', '@mobile-only'] }, async ({ page, header, searchPage }) => {
    await page.goto('/');
    await header.mobileSearchLink.click();
    await expect(header.searchInput).toBeVisible();

    await header.searchInput.fill(search.keyword);
    await header.searchInput.press('Enter');

    await expect(searchPage.results.first()).toBeVisible();
    await expect(searchPage.results.first()).toBeInViewport();
  });

  test('SRCH-007 clicking a result opens that article', { tag: '@P2' }, async ({ page, searchPage, articlePage }) => {
    await searchPage.goto(search.keyword);
    const first = searchPage.results.first();
    const title = (await first.getByTestId('title').innerText()).trim();

    await first.getByTestId('title').click();

    await expect(articlePage.title).toHaveText(title);
    await expect(page).not.toHaveURL(/\/search/);
  });
});
