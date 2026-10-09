# Test strategy (Task B)

## Isolation (fixtures and setup)
- Every test gets a fresh browser context. No cookies or storage carry over.
- Guest tests use an empty context. Logged-in tests use `useLoggedInUser()`,
  which loads `.auth/user.json` (saved once by `npm run auth:save`).
- `article` is a worker fixture: one live article is picked from the homepage
  per worker, so tests do not depend on a hard-coded URL.
- Page objects (`src/pages`) hold all locators. Tests only describe behaviour.

## Locators
- `testIdAttribute` is set to `data-qa-id`, so `page.getByTestId('btn-like')`
  works across the whole suite.
- When an element has no `data-qa-id` (the report "Konfirmasi" dialog, the
  Video Story promo, the image lightbox) we use, in order: ARIA label/role,
  visible text, and only then a partial class name, with a comment saying why.

## Parallel execution
- `fullyParallel: true`, **2 workers**. kumparan.com is production behind a
  firewall: with 4 workers we got `403 Forbidden` after a few minutes.
- Desktop and mobile are separate projects running the same specs.
  `@desktop-only` / `@mobile-only` tags skip what does not apply.
- API tests (GraphQLZero) have their own project and can run any time.

## Data cleanup
- The site does not let us create test data, so most tests are read-only.
- Likes are the only real writes. `like.spec.ts` checks the starting state in
  `beforeEach` and un-likes in `afterEach`, so the article ends up unchanged.
- Comments and reports are never sent. For "must log in first" checks we use
  `blockOutgoingWrites()`, which aborts every non-GET request inside the
  browser, so even an accidental submit cannot leave the machine.
- Logout is only tested with its own fresh login, because logging out would
  kill the shared saved session.

## Timeouts
- Test 60s, expect 10s, action 15s, navigation 30s. The live site with ads
  blocked loads in 2-5s, the extra room is for slow mornings and CI.
- Slow-3G test (ART-007) gets its own 30s/45s budget.
- No `waitForTimeout` in tests. The only fixed waits are inside
  `scrollToFooter()`, which waits for lazy content to stop moving.

## Retries and flaky tests
- `retries: 2` on CI, `0` locally (a local failure should be looked at).
- `trace: retain-on-failure`, screenshots and video on failure.
- Known causes of flakiness we already handle:
  - **Ads**: blocked by default in the `context` fixture (`blockAds` option).
  - **Video Story promo popup**: appears at random, closed by
    `page.addLocatorHandler` in the `page` fixture.
  - **Layout shift** while the article loads more content: `scrollToFooter()`
    waits until the footer stops moving before clicking.
  - **Headless user agent**: the desktop site returns an empty page to
    `HeadlessChrome`, so projects use the normal Chrome device profile.
- A test that fails, then passes on retry, shows as "flaky" in the report.
  Rule: fix it within the sprint or tag it `@quarantine` and track it. A
  quarantined test never hides a real defect: real bugs stay red.

## Captcha
- Login is protected by Cloudflare Turnstile. We do not bypass it.
- `npm run auth:save` and `npm run test:captcha` open real Chrome and wait for
  a person to tick the box. Everything else runs fully headless.
- In a real team, ask the backend team for a test-environment captcha key or
  an allow-listed test account so this can run in CI.
