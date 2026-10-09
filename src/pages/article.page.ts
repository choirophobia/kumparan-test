import type { Locator, Page } from '@playwright/test';

export class ArticlePage {
  readonly title: Locator;
  readonly author: Locator;
  readonly publishDate: Locator;
  readonly readingTime: Locator;
  readonly body: Locator;
  readonly paragraphs: Locator;
  readonly channelBreadcrumb: Locator;
  readonly likeButton: Locator;
  readonly commentButton: Locator;
  readonly shareWrapper: Locator;
  readonly shareWhatsApp: Locator;
  readonly copyLink: Locator;
  readonly zoomImage: Locator;
  readonly lightbox: Locator;
  readonly footer: Locator;
  readonly topicTags: Locator;
  readonly reportLink: Locator;
  readonly organisationInfo: Locator;
  readonly endOfArticle: Locator;
  readonly storyPages: Locator;
  readonly copiedAlert: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('story-title');
    this.author = page.getByTestId('story-author').getByTestId('author-name');
    this.publishDate = page.getByTestId('publish-date');
    this.readingTime = page.getByTestId('reading-time');
    this.body = page.getByTestId('article-main');
    this.paragraphs = page.getByTestId('story-paragraph');
    this.channelBreadcrumb = page.getByTestId('channel-name');
    this.likeButton = page.getByTestId('btn-like');
    this.commentButton = page.getByTestId('btn-comment');
    this.shareWrapper = page.getByTestId('share-wrapper');
    this.shareWhatsApp = this.shareWrapper.getByTestId('sosmed-whatsapp-white');
    this.copyLink = this.shareWrapper.getByTestId('copy-circle');
    this.zoomImage = page.getByTestId('zoom-in-white').first();
    this.lightbox = page.locator('[aria-label="Lightbox"]');
    this.footer = page.getByTestId('story-footer');
    this.topicTags = page.getByTestId('tag-topic');
    this.reportLink = this.footer.getByTestId('btn-report');
    this.organisationInfo = page.getByTestId('btn-organisation-info');
    this.endOfArticle = page.getByTestId('end_of_article');
    this.storyPages = page.locator('[data-qa-id^="story-page-"]');
    this.copiedAlert = page.getByTestId('alert-msg');
  }

  async goto(path: string) {
    const response = await this.page.goto(path);
    await this.title.waitFor();
    return response;
  }

  async likeCount() {
    return parseCount(await this.likeButton.innerText());
  }

  async isLiked() {
    // the like icon changes from "like" to "like-fill" when active
    return (await this.likeButton.getByTestId('like-fill').count()) > 0;
  }

  async scrollToFooter() {
    // The body and "Baca Lainnya" load in chunks while scrolling, which moves
    // the footer around. Scroll until the footer exists, then wait for it to
    // stop moving so a click does not land on a story card that slid in.
    for (let i = 0; i < 20 && (await this.footer.count()) === 0; i++) {
      await this.page.mouse.wheel(0, 1500);
      await this.page.waitForTimeout(300);
    }
    await this.footer.scrollIntoViewIfNeeded();
    await waitUntilStill(this.footer);
  }
}

async function waitUntilStill(locator: Locator, timeout = 10_000) {
  const end = Date.now() + timeout;
  let previous = -1;
  while (Date.now() < end) {
    const box = await locator.boundingBox();
    const y = box ? Math.round(box.y) : -1;
    if (y === previous) return;
    previous = y;
    await locator.page().waitForTimeout(400);
    await locator.scrollIntoViewIfNeeded();
  }
}

/** "12" -> 12, "1,2rb" -> 1200, "3jt" -> 3000000 */
export function parseCount(text: string): number {
  const value = text.trim().toLowerCase().replace(/\./g, '').replace(',', '.');
  if (value === '') return 0;
  const number = parseFloat(value);
  if (value.endsWith('rb')) return Math.round(number * 1_000);
  if (value.endsWith('jt')) return Math.round(number * 1_000_000);
  return number;
}
