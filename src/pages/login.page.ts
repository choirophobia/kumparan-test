import type { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly togglePassword: Locator;
  readonly submit: Locator;
  readonly forgotPassword: Locator;
  readonly googleButton: Locator;
  readonly facebookButton: Locator;
  readonly phoneButton: Locator;
  readonly registerLink: Locator;
  readonly emailFormatError: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByTestId('input-email');
    this.password = page.getByTestId('input-password');
    // the icon inside swaps between eye / eye-off, so click its wrapper
    this.togglePassword = page.getByTestId('right-add-on');
    this.submit = page.getByTestId('btn-save');
    this.forgotPassword = page.getByTestId('btn-forgot-password');
    this.googleButton = page.getByTestId('btn-login-google');
    this.facebookButton = page.getByTestId('btn-login-fb');
    this.phoneButton = page.getByTestId('btn-login-phone');
    this.registerLink = page.getByTestId('btn-register');
    this.emailFormatError = page.getByText('Harus diisi dengan format email');
  }

  async goto() {
    await this.page.goto('/login');
    await this.email.waitFor();
  }

  async fill(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  /** Waits until a human ticks the Cloudflare captcha, then submits. */
  async submitAfterCaptcha(timeout = 3 * 60_000) {
    await this.submit.waitFor();
    await this.page.waitForFunction(
      () => !document.querySelector<HTMLButtonElement>('[data-qa-id="btn-save"]')?.disabled,
      null,
      { timeout },
    );
    await this.submit.click();
  }
}
