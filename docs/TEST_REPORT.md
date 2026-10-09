# Test report – kumparan.com (desktop + mobile)

Run date: 9 Oct 2026, Playwright 1.64, Chrome (desktop 1440x900, Pixel 7).
Test cases: `test-cases/kumparan-testcases.csv` (89 cases, including the new RPT-009).

## Summary (last full guest run, before the 403 block)

| | Result |
|---|---|
| Web guest tests (desktop + mobile) | 73 passed, 20 failed on the first run; failures sorted into real bugs and test fixes (below) |
| Logged-in tests | Skipped: needs `npm run auth:save` (captcha) |
| GraphQL API (Task D) | **16 / 16 passed** |

Some failures in the second run were caused by kumparan answering `403 Forbidden`
after too many parallel requests. Workers were lowered from 4 to 2.

## Defects found

| ID | Severity | Test case | What happens | Expected |
|---|---|---|---|---|
| BUG-01 | High | AUTHZ-002 | Guest types a comment and presses send: **nothing happens**. No login prompt, no message, no request. | Login prompt or a "log in to comment" message |
| BUG-02 | Medium | AUTHZ-003/004 | Guest can open the report form, pick a reason and reach the final "Konfirmasi" dialog without being asked to log in. ("Ya" was not pressed, per the rules.) | Ask for login before the report form or before the final confirm |
| BUG-03 | Medium | RPT-006 | "Lainnya" reason made of only spaces enables the Laporkan button. | Input trimmed, button stays disabled |
| BUG-04 | Low | ERR-002 | React error #418 (hydration mismatch) logged on homepage, article, search and channel pages. | No uncaught errors |
| BUG-05 | Low | (exploratory) | Comment response page `/<channel>/response/<slug>` uses the generic site title, not the article title. | Page title names the article |
| BUG-06 | Low | (exploratory) | "Video Story" promo modal appears at random while reading and covers the "Laporkan tulisan" link. Content also shifts while loading, so taps can land on the wrong story. | No blocking popup mid-article, stable layout |

To confirm with a logged-in session: CMT-004 (send button looks enabled even
when the comment box is empty).

## Things that work well
- 404 pages return a real HTTP 404 with a friendly page (no 500s for fake slugs).
- Search: empty state is clear, XSS payload is shown as text, 300-char query is fine.
- Login form: inline "Harus diisi dengan format email", password mask toggle works.
- Report reason limit is 80 characters with an "80/80" counter.
- WhatsApp share opens `api.whatsapp.com` with the article link (+ utm params only).

## Environment notes
- Desktop site returns an empty page to the default headless user agent.
- Login requires Cloudflare Turnstile, which blocks fully automated login.
- Ads cover the mobile article (full-screen interstitial); ads are blocked in tests.
- Mobile users are redirected to `m.kumparan.com`.

## Not executed yet
- Logged-in cases (AUTH-012/014/015/016, LIKE-*, CMT-003..005, PRF-001): need one
  captcha tick (`npm run auth:save`), then `npm run test:web`.
- Captcha cases (AUTH-001/002/003/013/018): `npm run test:captcha`.
- AUTH-011 (5 failed logins): manual only, it can lock the test account.
- Task C agent-generated specs: see `docs/agent-prompts.md`.
