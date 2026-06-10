/**
 * Shared-score landing page — the URL players post on social media.
 *
 * The score lives in the query string, so the OG card (title, description,
 * dynamic /share/og image) shows the actual result instead of the generic
 * site card. Visitors get the score and a CTA to play the same mode.
 *
 * Always noindex: infinite param-driven variants, no search value.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BRAND, ROUTES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import {
  buildShareDescription,
  buildSharePath,
  parseShareParams,
  shareScoreLabel,
  type SharePayload,
} from "@/lib/share";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const payload = parseShareParams(await searchParams);
  if (!payload) {
    return buildMetadata({
      path: "/share",
      title: "Shared score",
      noindex: true,
    });
  }

  const title =
    payload.mode === "daily"
      ? `Daily Challenge — ${shareScoreLabel(payload)}`
      : `Survival — ${payload.score} spells deep`;

  return buildMetadata({
    path: buildSharePath(payload),
    title,
    description: buildShareDescription(payload),
    noindex: true,
    images: [
      {
        url: buildSharePath(payload).replace("/share?", "/share/og?"),
        width: 1200,
        height: 630,
        type: "image/png",
        alt: `${BRAND.name} — ${title}`,
      },
    ],
  });
}

export default async function SharePage({ searchParams }: PageProps) {
  const payload = parseShareParams(await searchParams);
  if (!payload) redirect(ROUTES.home);

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <ShareCard payload={payload} />
    </div>
  );
}

function ShareCard({ payload }: { payload: SharePayload }) {
  const isDaily = payload.mode === "daily";

  return (
    <section className="relative w-full max-w-md">
      {/* Warm halo — mirrors the game-over screens */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-md opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(232,193,129,0.18), transparent 65%)",
          filter: "blur(28px)",
        }}
      />

      <div className="codex rim-brass anim-rise-in flex flex-col items-center gap-6 rounded-md p-10 text-center">
        <p className="eyebrow text-brass-bright">Gauntlet thrown</p>

        <h1
          className="storm-display text-4xl font-extrabold leading-none tracking-[-0.02em] text-foreground"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          {isDaily ? "Beat this storm count" : "Outlast this run"}
        </h1>

        <span aria-hidden className="rule-brass max-w-[8rem]" />

        {/* The shared score */}
        <div className="flex flex-col items-center gap-2">
          <span className="eyebrow text-[10px] text-muted">
            {isDaily ? "Their storm count" : "Spells deep"}
          </span>
          <span
            className="storm-mono text-7xl font-extrabold tabular-nums text-brass-bright anim-ink-bleed"
            style={{
              textShadow:
                "0 0 32px rgba(232,193,129,0.5), 0 0 64px rgba(232,193,129,0.22)",
            }}
          >
            {payload.score}
          </span>
          {isDaily && payload.total != null && (
            <span className="storm-mono text-[11px] text-foreground/60">/ {payload.total}</span>
          )}
        </div>

        {/* Metadata stamps */}
        <div className="storm-mono flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.22em] text-muted">
          <span className="border border-rule/50 bg-background-deep/30 px-2.5 py-1">
            mode · {payload.mode}
          </span>
          {isDaily && payload.date && (
            <span className="border border-rule/50 bg-background-deep/30 px-2.5 py-1">
              {payload.date}
            </span>
          )}
        </div>

        <p className="storm-display-italic text-[15px] leading-relaxed text-foreground/75">
          {isDaily
            ? "A fellow mage threw down this score. Same 50 cards, same order — think you can read the storm better?"
            : "A fellow mage went this deep before the storm broke. One wrong answer ends the run — how long can you last?"}
        </p>

        {/* CTAs */}
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link href={isDaily ? ROUTES.daily : ROUTES.survival} className="btn-primary">
            {isDaily ? "Play today's Daily" : "Start a Survival run"}
          </Link>
          <Link href={isDaily ? ROUTES.survival : ROUTES.daily} className="btn-ghost">
            {isDaily ? "Try Survival" : "Try the Daily"}
          </Link>
        </div>
      </div>
    </section>
  );
}
