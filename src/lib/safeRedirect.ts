/**
 * Returns `url` only if it is a same-origin path. `startsWith("/")` alone lets
 * protocol-relative `//evil.com` and `/\evil.com` (browsers treat `\` as `/`)
 * through as open redirects.
 */
export function safeRedirectPath(url: string | undefined): string | undefined {
  return url && /^\/(?![/\\])/.test(url) ? url : undefined;
}
