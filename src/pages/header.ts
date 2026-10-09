import type { Locator, Page } from '@playwright/test';

export class Header {
  readonly root: Locator;
  readonly logo: Locator;
  readonly loginButton: Locator;
  readonly avatar: Locator;
  readonly createStoryButton: Locator;
  readonly searchInput: Locator;
  readonly mobileSearchLink: Locator;
  readonly mobileMenuButton: Locator;
  readonly mobileMenuLogin: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.getByTestId('header-top');
    this.logo = page.getByTestId('hd-logo').locator('a').first();
    this.loginButton = page.getByTestId('hd-login');
    this.avatar = page.getByTestId('hd-pic-user');
    this.createStoryButton = page.getByTestId('create-story');
    this.searchInput = page.getByTestId('input-search');
    this.mobileSearchLink = page.getByTestId('hd-search');
    this.mobileMenuButton = page.getByTestId('burger-menu');
    this.mobileMenuLogin = page.getByTestId('label-list-item-masuk');
    this.logoutButton = page.getByTestId('log-out');
  }

  async search(term: string, mobile: boolean) {
    if (mobile) {
      await this.mobileSearchLink.click();
      await this.page.waitForURL(/\/search/);
    }
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
  }

  async logout() {
    await this.avatar.click();
    await this.logoutButton.click();
  }
}
