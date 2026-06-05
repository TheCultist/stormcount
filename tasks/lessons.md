# Lessons

## Clerk `auth.protect()` returns 404 (not 401) for `fetch` requests

**Date:** 2026-06-05

**Symptom:** Completing a Daily/Survival run while signed out did NOT show the
"sign in to record your result" prompt. The end screen rendered as if the score
was saved.

**Root cause:** `src/proxy.ts` listed the score-submission API routes in the
`createRouteMatcher` passed to `auth.protect()`. For an unauthenticated request,
Clerk's `protect()` only returns a redirect for *page* requests and
`unauthorized()` (401) for *server actions* — for everything else (a plain
`fetch` POST) it calls **`notFound()` → 404**. The client deferred-score logic
only triggers on `res.status === 401 || 403`, so a 404 silently fell through to
the "saved" path.

**Fix:** Don't protect self-guarding API routes via middleware. Both
`/api/scores/submit` and `/api/scores/survival` already call `auth()` and return
a clean JSON `401` when `!userId`. Removed them from the protected matcher in
`proxy.ts`; kept page routes like `/profile` protected (redirect-to-sign-in is
the right UX there).

**Rule for next time:** Middleware `auth.protect()` is for *page* routes you want
redirected to sign-in. For JSON API routes consumed by `fetch`, guard inside the
handler and return the exact status the client expects — middleware `protect()`
will 404 instead of 401.
