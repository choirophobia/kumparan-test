import type { Locator, Page } from '@playwright/test';

export class SearchPage {
  readonly results: Locator;
  readonly resultTitles: Locator;
  readonly emptyState: Locator;
  readonly storyTab: Locator;

  constructor(private readonly page: Page) {
    this.results = page.getByTestId('story-result-card');
    this.resultTitles = this.results.getByTestId('title');
    this.emptyState = page.getByTestId('story-not-found');
    this.storyTab = page.getByTestId('tab-story');
  }

  async goto(term: string) {
    await this.page.goto(`/search/${encodeURIComponent(term)}`);
    // the result tabs exist on both desktop and mobile, with or without results
    await this.storyTab.waitFor();
  }
}
