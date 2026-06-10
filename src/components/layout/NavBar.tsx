"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { ROUTES, BRAND } from "@/lib/constants";

const NAV_LINKS = [
  { href: ROUTES.daily, label: "Daily" },
  { href: ROUTES.survival, label: "Survival" },
  { href: ROUTES.leaderboard, label: "Leaderboard" },
  { href: ROUTES.profile, label: "Profile" },
  { href: ROUTES.about, label: "Other Projects" },
] as const;

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive =
    href === ROUTES.home ? pathname === href : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={`relative inline-flex items-center whitespace-nowrap px-1 py-2 text-[13px] tracking-wide transition-colors duration-200 ${
        isActive
          ? "storm-display-italic font-semibold text-brass-bright"
          : "text-foreground/65 hover:text-foreground"
      }`}
    >
      {label}
      {isActive ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rotate-45 bg-brass-bright"
        />
      ) : null}
    </Link>
  );
}

export default function NavBar({ isAdmin = false }: { isAdmin?: boolean }) {
  const { isSignedIn, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <header className="relative w-full border-b border-rule/60 pt-[env(safe-area-inset-top)]">
      {/* Top hairline highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "var(--grad-rule)" }}
      />

      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-8">
        {/* Wordmark */}
        <Link
          href={ROUTES.home}
          className="group flex items-center gap-3"
        >
          {/* Mark — logo image */}
          <span className="relative flex h-9 w-9 shrink-0">
            <Image
              src="/logo.png"
              alt={`${BRAND.name} logo`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-contain"
              priority
            />
            <span
              aria-hidden
              className="absolute -inset-1 rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60"
              style={{ background: "var(--grad-logo-glow)" }}
            />
          </span>

          <div className="flex flex-col leading-none">
            <span className="storm-display text-[18px] font-extrabold tracking-[-0.01em] text-foreground sm:text-[20px]">
              {BRAND.name}
            </span>
            <span className="storm-mono mt-0.5 text-[9px] uppercase tracking-[0.32em] text-muted">
              MTG · higher / lower
            </span>
          </div>
        </Link>

        {/* Center nav */}
        <ul className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <NavLink href={link.href} label={link.label} />
            </li>
          ))}
          {isAdmin && (
            <li>
              <NavLink href="/admin/themed-days" label="Admin" />
            </li>
          )}
        </ul>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {mounted && isLoaded && (
            isSignedIn ? (
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-8 w-8" },
                }}
              />
            ) : (
              <SignInButton mode="redirect">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 border-y border-brass/30 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-brass/70 transition-colors hover:border-brass/60 hover:text-brass sm:px-4"
                >
                  <span className="h-1 w-1 rotate-45 bg-brass/60" />
                  Sign in
                </button>
              </SignInButton>
            )
          )}
        </div>
      </nav>

      {/* Bottom hairline + tiny center sigil */}
      <span aria-hidden className="rule-brass" />

      {/* Mobile nav — centered when it fits, horizontally scrollable when it doesn't */}
      <div className="overflow-x-auto md:hidden" style={{ scrollbarWidth: "none" }}>
        <ul className="mx-auto flex w-max items-center gap-6 px-5 py-1.5">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <NavLink href={link.href} label={link.label} />
            </li>
          ))}
          {isAdmin && (
            <li>
              <NavLink href="/admin/themed-days" label="Admin" />
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}
