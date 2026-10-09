# kumparan QA skill test – Playwright + TypeScript

One repo for all three coding tasks:

| Task | What | Where | Run |
|---|---|---|---|
| B | Hand-written web tests, desktop + mobile | `tests/web` | `npm run test:web` |
| C | Playwright Agent tests (HOME, NAV, SHR) | `tests/agent`, `specs/` | `npm run test:agent` |
| D | GraphQL API tests (GraphQLZero) | `tests/api` | `npm run test:api` |

Test cases (Task A) live in `test-cases/kumparan-testcases.csv`.
Results and bugs are in `docs/TEST_REPORT.md`.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # fill in the kumparan test account
```

## Logged-in tests

kumparan's login has a Cloudflare "Verify you are human" check, so a person
has to tick it once:

```bash
npm run auth:save      # Chrome opens, tick the box, session saved to .auth/
```

Logged-in tests are skipped (not failed) until this has been done.
Login submit tests (wrong password, logout, ...) need a tick each time:

```bash
npm run test:captcha
```

## Other commands

```bash
npm test               # web + agent + api
npm run test:desktop
npm run test:mobile
npx playwright test --grep @P1      # only priority 1
npm run report         # open the HTML report
npm run typecheck
```

## Layout

```
src/
  fixtures/   test fixtures (ad blocking, promo popup, article picker, login session)
  pages/      page objects, all locators live here
  api/        GraphQL client and queries
  data/       test data (bad emails, payloads, search terms)
  utils/      env, dates, network helpers
tests/
  web/        Task B
  agent/      Task C (seed + generated specs)
  api/        Task D
docs/
  STRATEGY.md       parallel runs, cleanup, timeouts, retries, flaky tests
  TEST_REPORT.md    results and defects
  agent-prompts.md  prompts used with Playwright Agent
```

## Rules followed
- Comments and reports are never submitted. Report tests stop at the
  "Konfirmasi" dialog and press Batal.
- Likes are undone after each test.
- `data-qa-id` is the default locator (`getByTestId`).
