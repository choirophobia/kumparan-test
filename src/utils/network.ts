import type { Page } from '@playwright/test';

/**
 * Aborts every non-GET request from this point on.
 *
 * The test rules say comments and reports must never be submitted. Some
 * checks (for example "does a guest get asked to log in when pressing send?")
 * still need the button to be clicked. With this in place the click happens
 * in the browser, but nothing leaves the machine.
 *
 * Note: kumparan also uses POST for GraphQL reads, so only call this after
 * the page has finished loading.
 */
export async function blockOutgoingWrites(page: Page) {
  const blocked: string[] = [];
  await page.route('**/*', (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.fallback();
    blocked.push(`${request.method()} ${request.url()}`);
    return route.abort();
  });
  return blocked;
}


/**
 * Records login attempts sent to kumparan. Analytics calls are ignored
 * (they also contain words like "login" in their payload).
 */
export function watchLoginRequests(page: Page) {
  const sent: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'GET') return;
    const url = new URL(request.url());
    if (!url.hostname.endsWith('kumparan.com') || url.hostname.startsWith('un.')) return;
    const body = request.postData() ?? '';
    if (/\/(login|auth)/i.test(url.pathname) || /mutation\s*\w*\s*(\(|\{)[^]*?\b(login|signIn)\b/i.test(body)) {
      sent.push(request.url());
    }
  });
  return sent;
}
