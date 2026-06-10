# Lessons

## Social "share" links can't carry the result in text — put it in the URL

**Date:** 2026-06-10

**Symptom:** First version of score sharing passed the score in the share-intent
text (`sharer.php?quote=…`). Facebook's composer dropped the text entirely and
rendered only the generic site OG card — the share showed no result at all.

**Root cause:** Several platforms (Facebook above all) ignore prefilled text and
render only the URL's Open Graph card. The OG card *is* the share.

**Rule for next time:** To share a dynamic result, encode it in a shareable URL
(`/share?mode=…&score=…`) whose page serves result-specific OG metadata and a
dynamic OG image (`next/og` ImageResponse). Treat the params as hostile input —
validate strictly. And keep the og:image route OUT of robots-disallowed paths
(`/api/` here): social crawlers respect robots.txt when fetching og:image and
will silently fall back to no image.

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
