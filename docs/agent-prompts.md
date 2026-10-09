# Task C – Playwright Agent prompts

Playwright Test Agents (planner, generator, healer) were set up with:

```
npx playwright init-agents --loop=claude
```

This created `.claude/agents/playwright-test-*.md` and `.mcp.json`
(the `playwright-test` MCP server). Open Claude Code **inside this repo** so
it loads the MCP server, then run the prompts below in order.

Scope for the agent: **HOME, NAV and SHR** test cases from
`test-cases/kumparan-testcases.csv`. Task B (hand-written) covers the other
areas, so the two parts do not overlap.

Seed file: `tests/agent/seed.spec.ts` (uses our fixtures, so ads are blocked
and the Video Story promo is closed automatically).

---

## 1. Planner

```
Use the playwright-test-planner agent.
Seed: tests/agent/seed.spec.ts
Site: https://kumparan.com (desktop 1440x900) and the mobile site (Pixel 7).

Explore the homepage, main menu, "Lainnya" menu, channel pages, 404 pages and
the share buttons on an article. Write a test plan to specs/home-nav-share.md
that covers these test case IDs from test-cases/kumparan-testcases.csv:
HOME-001..HOME-008, NAV-001..NAV-006, SHR-001..SHR-005.

Rules:
- Prefer data-qa-id locators (page.getByTestId, testIdAttribute is data-qa-id).
  Only use role/text locators when no data-qa-id exists.
- Do not log in. Do not post, like, comment or report anything.
- For WhatsApp share, do not open WhatsApp. Stub window.open and check the URL.
- Every step needs an expected result that can be asserted.
```

## 2. Generator

```
Use the playwright-test-generator agent.
Plan: specs/home-nav-share.md
Seed: tests/agent/seed.spec.ts
Output folder: tests/agent/

Generate one spec file per area: home.spec.ts, navigation.spec.ts, share.spec.ts.
- Import test/expect from '../../src/fixtures/test' (not from @playwright/test).
- Put the CSV ID at the start of each test title, e.g. "HOME-003 ...".
- Tag desktop-only tests with @desktop-only and mobile-only tests with @mobile-only.
- Every test must end with at least one expect(); no action-only tests.
- No page.waitForTimeout. Use web-first assertions.
```

## 3. Healer

```
Use the playwright-test-healer agent.
Run: npx playwright test --project=agent-desktop --project=agent-mobile
Fix failing tests in tests/agent/ only. If a failure is a real bug on the
site (not a test problem), do not hide it: mark the test with test.fail()
and a comment that names the bug, and list it in docs/TEST_REPORT.md.
```

## 4. Human review after generation

Generated code is reviewed before commit:
- locators: replace any CSS class selectors with data-qa-id where possible
- assertions: each test checks a result, not only clicks
- no duplicated setup, shared steps moved to page objects in `src/pages`
