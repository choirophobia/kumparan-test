import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const isCI = !!process.env.CI;

const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } };
const mobile = { ...devices['Pixel 7'] };

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // kumparan.com is a live production site behind a firewall. With 4 workers
  // it answered "403 Forbidden" after a few minutes, so keep this low.
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'https://kumparan.com',
    testIdAttribute: 'data-qa-id',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'agent-desktop',
      testDir: './tests/agent',
      use: desktop,
      grepInvert: /@mobile-only/,
    },
    {
      name: 'agent-mobile',
      testDir: './tests/agent',
      use: mobile,
      grepInvert: /@desktop-only/,
    },
    {
      name: 'desktop',
      testDir: './tests/web',
      use: desktop,
      grepInvert: /@mobile-only|@captcha/,
    },
    {
      name: 'mobile',
      testDir: './tests/web',
      use: mobile,
      grepInvert: /@desktop-only|@captcha/,
    },
    // login form submit tests, need a human to tick the captcha
    {
      name: 'captcha',
      testDir: './tests/web',
      grep: /@captcha/,
      use: { ...desktop, channel: 'chrome', headless: false },
      timeout: 5 * 60_000,
      fullyParallel: false,
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: 'https://graphqlzero.almansi.me' },
    },
    // one-time manual login (Cloudflare captcha must be ticked by a human)
    {
      name: 'save-session',
      testMatch: /save-session\.setup\.ts/,
      use: { ...desktop, channel: 'chrome', headless: false },
      timeout: 5 * 60_000,
    },
  ],
});
