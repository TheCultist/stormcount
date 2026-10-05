"use client";

import { useEffect, useEffectEvent } from "react";

/**
 * Guard an in-progress run against accidental navigation.
 *
 * While `active`:
 *  - tab close / refresh / external navigation → the browser's native
 *    "Leave site?" dialog (`beforeunload`);
 *  - same-origin link clicks (Next.js `<Link>` SPA transitions, which never
 *    fire `beforeunload`) → `window.confirm(message)`, intercepted in the
 *    capture phase so cancelling stops the router from seeing the click.
 *
 * `onLeave` runs once the user has actually committed to leaving: after a
 * confirmed link click, or on `pagehide` (fires only on a real unload — not
 * when the user clicks "Stay"). Use `fetch(..., { keepalive: true })` in it.
 */
export function useLeaveGuard(
  active: boolean,
  message: string,
  onLeave?: () => void,
) {
  const leave = useEffectEvent(() => onLeave?.());

  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onLinkClick = (e: MouseEvent) => {
      // Modified / non-primary clicks open a new tab — the run continues.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || !anchor.href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return; // beforeunload covers it
      if (url.pathname === window.location.pathname && url.hash) return; // in-page anchor

      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      leave();
    };

    const onPageHide = () => leave();

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("click", onLinkClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("click", onLinkClick, true);
    };
  }, [active, message]);
}
