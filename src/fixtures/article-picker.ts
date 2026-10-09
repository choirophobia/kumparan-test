import { devices, type Browser, type Page } from '@playwright/test';

export type ArticleRef = {
  path: string; // e.g. /kumparannews/some-title-28L9De0JfgY
  slug: string; // e.g. some-title-28L9De0JfgY
  channel: string; // e.g. kumparannews
  title: string;
};

export function toArticleRef(path: string, title = ''): ArticleRef {
  const [, channel, slug] = path.split('/');
  return { path, slug, channel, title };
}

/**
 * Opens the homepage once and returns the first trending article.
 * Trending stories are regular news articles (no paywall, comments enabled).
 */
export async function pickArticle(browser: Browser): Promise<ArticleRef> {
  if (process.env.ARTICLE_PATH) {
    return toArticleRef(process.env.ARTICLE_PATH);
  }

  const context = await browser.newContext({ ...devices['Desktop Chrome'] });
  const page = await context.newPage();
  try {
    await page.goto('https://kumparan.com/', { waitUntil: 'domcontentloaded' });
    const first = page.locator('[data-qa-id="trending-story-item"]').first();
    await first.waitFor({ timeout: 30_000 });
    const href = await first.evaluate(
      (el) => (el.closest('a') ?? el.querySelector('a'))?.getAttribute('href') ?? null,
    );
    const title = (await first.locator('[data-qa-id="title"]').first().innerText()).trim();
    if (!href) throw new Error('Could not find a trending article on the homepage');
    return toArticleRef(new URL(href, 'https://kumparan.com').pathname, title);
  } finally {
    await context.close();
  }
}

/**
 * Walks the homepage stories and returns the first one whose comment count
 * matches `wanted`. Used by comment tests that need an empty or a busy thread.
 */
export async function findArticleByComments(
  page: Page,
  wanted: 'none' | 'some',
  maxArticles = 12,
): Promise<ArticleRef | null> {
  await page.goto('/');
  // trending is lazy-loaded on mobile, headline cards are on top for both
  await page.getByTestId('headline-card').first().waitFor();
  const hrefs = await page
    .locator('[data-qa-id="headline-card"], [data-qa-id="trending-story-item"], [data-qa-id="news-item"]')
    .locator('a[aria-label="news-card-label-link"]')
    .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute('href') ?? ''))]);

  for (const href of hrefs.filter(Boolean).slice(0, maxArticles)) {
    await page.goto(href);
    const button = page.getByTestId('btn-comment');
    await button.waitFor();
    const count = parseInt((await button.innerText()).trim() || '0', 10);
    if ((wanted === 'none' && count === 0) || (wanted === 'some' && count > 0)) {
      return toArticleRef(new URL(href, 'https://kumparan.com').pathname);
    }
  }
  return null;
}
