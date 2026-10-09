import { test as base, expect, type Page } from '@playwright/test';
import { AUTH_FILE, hasSavedSession } from '../utils/env';
import { ArticlePage } from '../pages/article.page';
import { CommentPage } from '../pages/comment.page';
import { Header } from '../pages/header';
import { LoginPage } from '../pages/login.page';
import { ReportPage } from '../pages/report.page';
import { SearchPage } from '../pages/search.page';
import { pickArticle, type ArticleRef } from './article-picker';

// Ad networks make the live site slow and sometimes cover the page with
// full-screen ads (mostly on mobile). We block them by default so tests check
// kumparan itself. Set `blockAds: false` in a test to load ads as normal.
const AD_HOSTS =
  /doubleclick|googlesyndication|googletagservices|adservice|amazon-adsystem|criteo|pubmatic|adnxs|rubiconproject|taboola|outbrain|teads|imasdk|securepubads/;

type Options = {
  blockAds: boolean;
};

type Fixtures = {
  header: Header;
  loginPage: LoginPage;
  articlePage: ArticlePage;
  commentPage: CommentPage;
  reportPage: ReportPage;
  searchPage: SearchPage;
  pageErrors: string[];
};

type WorkerFixtures = {
  article: ArticleRef;
};

export const test = base.extend<Options & Fixtures, WorkerFixtures>({
  blockAds: [true, { option: true }],

  context: async ({ context, blockAds }, use) => {
    if (blockAds) {
      await context.route(AD_HOSTS, (route) => route.abort());
    }
    await use(context);
  },

  // one article per worker, taken from the live homepage, so tests do not
  // depend on a hard-coded URL that may disappear from the news feed
  article: [
    async ({ browser }, use) => {
      await use(await pickArticle(browser));
    },
    { scope: 'worker' },
  ],

  // A "Video Story" promo pops up at random while scrolling and blocks clicks.
  // Close it whenever it shows up.
  page: async ({ page }, use) => {
    const promo = page.getByText('Jelajahi Sekarang');
    await page.addLocatorHandler(promo, async () => {
      await page
        .locator('[class*="ModalContent"]')
        .filter({ has: promo })
        .locator('button')
        .last()
        .click();
    });
    await use(page);
  },

  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await use(errors);
  },

  header: async ({ page }, use) => use(new Header(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  articlePage: async ({ page }, use) => use(new ArticlePage(page)),
  commentPage: async ({ page }, use) => use(new CommentPage(page)),
  reportPage: async ({ page }, use) => use(new ReportPage(page)),
  searchPage: async ({ page }, use) => use(new SearchPage(page)),
});

/**
 * Call inside a describe block to run it with the saved login session.
 * The block is skipped (not failed) when `npm run auth:save` was never run.
 */
export function useLoggedInUser() {
  test.skip(!hasSavedSession(), 'No saved session. Run `npm run auth:save` first.');
  test.use({ storageState: hasSavedSession() ? AUTH_FILE : undefined });
}

export function isMobile(page: Page) {
  return (page.viewportSize()?.width ?? 1440) < 768;
}

export { expect };
