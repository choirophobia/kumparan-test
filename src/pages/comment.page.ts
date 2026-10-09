import type { Locator, Page } from '@playwright/test';
import type { ArticleRef } from '../fixtures/article-picker';

/** The /<channel>/response/<slug> page where comments are written. */
export class CommentPage {
  readonly selectedArticle: Locator;
  readonly section: Locator;
  readonly input: Locator;
  readonly sendButton: Locator;
  readonly noComment: Locator;
  readonly items: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('comment-item');
    this.selectedArticle = page.getByTestId('selected-commented-card');
    this.section = page.getByTestId('comment-section').first();
    this.input = page.locator('#comment-editor');
    this.sendButton = page.getByTestId('btn-send-comment').first();
    this.noComment = page.getByTestId('no-comment');
  }

  async goto(article: ArticleRef) {
    await this.page.goto(`/${article.channel}/response/${article.slug}`);
    await this.section.waitFor();
  }
}
