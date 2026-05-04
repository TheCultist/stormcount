import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Privacy Policy — ${BRAND.name}`,
  description:
    "Storm Count privacy policy. What data we collect, how we use it, and your rights under GDPR. Covers Clerk authentication, game scores, cookies, and third-party services.",
  openGraph: {
    title: `Privacy Policy | ${BRAND.name}`,
    description:
      "How Storm Count handles your data, authentication, and cookies.",
    url: `https://${BRAND.domain}/privacy`,
  },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="storm-display text-xl font-semibold text-foreground/90 sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      {/* Header */}
      <header className="anim-fade-in flex flex-col gap-3">
        <Link
          href={ROUTES.home}
          className="storm-mono text-[11px] uppercase tracking-[0.2em] text-muted/60 transition-colors hover:text-brass-bright"
        >
          ← Back to game
        </Link>
        <p className="eyebrow">Legal</p>
        <h1
          className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          Privacy{" "}
          <span className="storm-display-italic text-brass-bright">Policy</span>
        </h1>
        <p
          className="storm-mono text-[11px] text-muted/60"
          suppressHydrationWarning
        >
          Last updated:{" "}
          {new Date().toLocaleDateString("en-CA", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      {/* Content card */}
      <div className="codex rim-brass anim-rise-in flex flex-col gap-8 rounded-md p-8">
        <Section title="Overview">
          <p className="text-sm leading-relaxed text-foreground/75">
            Storm Count (&quot;we&quot;, &quot;the site&quot;) is a free Magic:
            The Gathering guessing game available at{" "}
            <span className="storm-mono text-foreground/85">
              {BRAND.domain}
            </span>
            . This policy explains what data we collect, why, and your rights
            over it. We collect the minimum data needed to run the game.
          </p>
        </Section>

        <span aria-hidden className="rule-brass" />

        <Section title="Data We Collect">
          <div className="space-y-4 text-sm leading-relaxed text-foreground/75">
            <div>
              <p className="mb-2 font-semibold text-foreground/85">
                Account data (optional)
              </p>
              <p>
                Account creation is optional. If you sign up, we collect the
                information you provide through Clerk (our authentication
                provider): email address and display name. This data is stored
                by Clerk and used solely to identify your scores and display
                them on leaderboards.
              </p>
            </div>
            <div>
              <p className="mb-2 font-semibold text-foreground/85">
                Game scores
              </p>
              <p>
                When you complete a Daily Challenge or Survival run (whether
                signed in or not), your score and the date are stored in our
                database. If signed in, your score is linked to your account so
                it appears on your profile and the public leaderboard.
                Anonymous scores are recorded without any user identifier.
              </p>
            </div>
            <div>
              <p className="mb-2 font-semibold text-foreground/85">
                Technical logs
              </p>
              <p>
                Our hosting provider (Vercel) may log standard HTTP request
                metadata (IP address, user-agent, timestamp) for security and
                abuse prevention. These logs are retained per Vercel&apos;s own
                data retention policy and are not used for advertising.
              </p>
            </div>
          </div>
        </Section>

        <span aria-hidden className="rule-brass" />

        <Section title="Cookies & Local Storage">
          <div className="space-y-3 text-sm leading-relaxed text-foreground/75">
            <p>We use the following browser storage:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-brass">▸</span>
                <span>
                  <strong className="text-foreground/85">
                    Cookie consent (localStorage)
                  </strong>{" "}
                  — records your accept/reject choice so the banner doesn&apos;t
                  reappear. Key:{" "}
                  <code className="storm-mono text-[10px] text-foreground/70">
                    sc-cookie-consent
                  </code>
                  . Never sent to our servers.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-brass">▸</span>
                <span>
                  <strong className="text-foreground/85">
                    Clerk session cookies
                  </strong>{" "}
                  — if you sign in, Clerk sets encrypted session cookies to keep
                  you authenticated. These are essential and cannot be rejected
                  without logging out.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-brass">▸</span>
                <span>
                  <strong className="text-foreground/85">
                    Theme preference (localStorage)
                  </strong>{" "}
                  — stores your light/dark/system preference locally so your
                  chosen theme persists across visits.
                </span>
              </li>
            </ul>
            <p>
              We do{" "}
              <strong className="text-foreground/85">not</strong> use
              advertising cookies, cross-site tracking cookies, or third-party
              analytics cookies.
            </p>
          </div>
        </Section>

        <span aria-hidden className="rule-brass" />

        <Section title="Third-Party Services">
          <ul className="space-y-4 text-sm leading-relaxed text-foreground/75">
            <li className="flex flex-col gap-1">
              <strong className="text-foreground/85">Clerk</strong>
              <p>
                Handles user authentication. When you create an account, your
                email and name are stored by Clerk under their{" "}
                <a
                  href="https://clerk.com/privacy"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brass/80 underline underline-offset-2 transition-colors hover:text-brass-bright"
                >
                  privacy policy
                </a>
                . We receive only your Clerk user ID and display name to
                associate scores with your profile.
              </p>
            </li>
            <li className="flex flex-col gap-1">
              <strong className="text-foreground/85">Neon / Vercel Postgres</strong>
              <p>
                Our database provider. Game scores, leaderboard entries, and
                daily seeds are stored here. Data is hosted in the EU (or the
                region closest to you) and encrypted at rest.
              </p>
            </li>
            <li className="flex flex-col gap-1">
              <strong className="text-foreground/85">Scryfall</strong>
              <p>
                Card names, mana values, and artwork are fetched from the{" "}
                <a
                  href="https://scryfall.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brass/80 underline underline-offset-2 transition-colors hover:text-brass-bright"
                >
                  Scryfall
                </a>{" "}
                public API. Your browser may make direct requests to Scryfall
                image CDN endpoints to load card art. Scryfall has their own
                privacy policy.
              </p>
            </li>
            <li className="flex flex-col gap-1">
              <strong className="text-foreground/85">Vercel</strong>
              <p>
                Storm Count is hosted on Vercel. Vercel may process request
                logs and edge telemetry per their{" "}
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-brass/80 underline underline-offset-2 transition-colors hover:text-brass-bright"
                >
                  privacy policy
                </a>
                .
              </p>
            </li>
          </ul>
        </Section>

        <span aria-hidden className="rule-brass" />

        <Section title="Data Retention">
          <ul className="space-y-2 text-sm leading-relaxed text-foreground/75">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-brass">▸</span>
              <span>
                Game scores are retained indefinitely to power leaderboards.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-brass">▸</span>
              <span>
                Account data is retained until you delete your account via
                Clerk.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-brass">▸</span>
              <span>
                localStorage entries are cleared when you clear your
                browser&apos;s site data.
              </span>
            </li>
          </ul>
        </Section>

        <span aria-hidden className="rule-brass" />

        <Section title="Your Rights (GDPR)">
          <p className="text-sm leading-relaxed text-foreground/75">
            If you are in the European Economic Area or UK, you have the right
            to:
          </p>
          <ul className="space-y-2 text-sm leading-relaxed text-foreground/75">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-brass">▸</span>
              <span>
                <strong className="text-foreground/85">Access</strong> — request
                a copy of data we hold about you.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-brass">▸</span>
              <span>
                <strong className="text-foreground/85">Rectification</strong> —
                correct inaccurate data (e.g., display name via Clerk profile).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-brass">▸</span>
              <span>
                <strong className="text-foreground/85">Erasure</strong> —
                request deletion of your account and associated scores. Contact
                us below.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-brass">▸</span>
              <span>
                <strong className="text-foreground/85">
                  Withdraw cookie consent
                </strong>{" "}
                — clear{" "}
                <code className="storm-mono text-[10px] text-foreground/70">
                  sc-cookie-consent
                </code>{" "}
                from localStorage in your browser developer tools at any time.
              </span>
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-foreground/75">
            Anonymous game scores cannot be attributed to you and therefore
            cannot be deleted individually. If you played while signed in, your
            scores can be removed on request.
          </p>
        </Section>

        <span aria-hidden className="rule-brass" />

        <Section title="Contact">
          <p className="text-sm leading-relaxed text-foreground/75">
            Privacy questions or data requests — use the{" "}
            <Link
              href={ROUTES.contact}
              className="text-brass/80 underline underline-offset-2 transition-colors hover:text-brass-bright"
            >
              contact page
            </Link>
            . We will respond within 30 days.
          </p>
        </Section>
      </div>

      {/* Footer links */}
      <nav
        aria-label="Related pages"
        className="anim-fade-in flex items-center gap-6"
      >
        <Link
          href={ROUTES.about}
          className="storm-mono text-[11px] uppercase tracking-[0.2em] text-muted/60 transition-colors hover:text-brass-bright"
        >
          About
        </Link>
        <Link
          href={ROUTES.contact}
          className="storm-mono text-[11px] uppercase tracking-[0.2em] text-muted/60 transition-colors hover:text-brass-bright"
        >
          Contact
        </Link>
      </nav>
    </div>
  );
}
