import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Routes that require an authenticated session.
 * All others are public by default.
 *
 * NOTE: The score-submission API routes are intentionally NOT listed here.
 * They each guard themselves with `auth()` and return a clean JSON 401 when
 * signed out. If we let middleware `auth.protect()` handle them, an
 * unauthenticated `fetch` (not a page request) resolves to `notFound()` → a
 * 404, which the client can't distinguish from a real error. Letting the
 * handlers respond with 401 is what lets the game defer the score and show
 * the "sign in to record your result" prompt.
 */
const isProtected = createRouteMatcher([
  "/profile(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
