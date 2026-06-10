"use client";

import { useEffect, useState } from "react";
import { BRAND } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import { buildShareMessage, buildSharePath, type SharePayload } from "@/lib/share";
import type { GameMode } from "@/lib/types";

type ShareScoreProps = {
  mode: GameMode;
  score: number;
  /** Daily: total pairs played, renders the score as "x/y". */
  totalRounds?: number;
  /** Daily: the challenge date (YYYY-MM-DD) baked into the share text. */
  date?: string;
};

type ShareTarget = {
  name: string;
  /** Build the share-intent URL from the message and the page URL. */
  href: (text: string, url: string) => string;
  icon: React.ReactNode;
};

const enc = encodeURIComponent;

const SHARE_TARGETS: ShareTarget[] = [
  {
    name: "X",
    href: (text, url) => `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
    icon: (
      <SvgIcon>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </SvgIcon>
    ),
  },
  {
    name: "Bluesky",
    href: (text, url) => `https://bsky.app/intent/compose?text=${enc(`${text} ${url}`)}`,
    icon: (
      <SvgIcon>
        <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
      </SvgIcon>
    ),
  },
  {
    name: "Facebook",
    href: (text, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}&quote=${enc(text)}`,
    icon: (
      <SvgIcon>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </SvgIcon>
    ),
  },
  {
    name: "Reddit",
    href: (text, url) => `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}`,
    icon: (
      <SvgIcon>
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </SvgIcon>
    ),
  },
  {
    name: "WhatsApp",
    href: (text, url) => `https://wa.me/?text=${enc(`${text} ${url}`)}`,
    icon: (
      <SvgIcon>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </SvgIcon>
    ),
  },
  {
    name: "Telegram",
    href: (text, url) => `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
    icon: (
      <SvgIcon>
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </SvgIcon>
    ),
  },
];

function SvgIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="h-4 w-4 transition-colors duration-200"
    >
      {children}
    </svg>
  );
}

/**
 * Share-your-score row for the Daily and Survival end screens.
 * Pure share-intent links — no SDKs, no tracking scripts.
 */
export default function ShareScore(props: ShareScoreProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // navigator is unavailable during SSR — detect the Web Share API after mount.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // Share the score-bearing /share URL so platforms that drop the post text
  // (Facebook) still render the result via the dynamic OG card.
  const payload: SharePayload = {
    mode: props.mode,
    score: props.score,
    total: props.mode === "daily" ? props.totalRounds : undefined,
    date: props.mode === "daily" ? props.date : undefined,
  };
  const text = buildShareMessage(payload);
  const url = absoluteUrl(buildSharePath(payload));

  const nativeShare = async () => {
    try {
      await navigator.share({ title: BRAND.name, text, url });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions / insecure context) — leave the
      // intent links as the fallback.
    }
  };

  const stampClass =
    "flex h-9 w-9 items-center justify-center rounded-sm border border-rule/50 bg-background-deep/40 text-foreground/60 transition-colors duration-200 hover:border-brass/60 hover:text-brass-bright";

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="eyebrow text-[9px] text-muted">Share your storm count</p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {canNativeShare && (
          <button
            type="button"
            onClick={nativeShare}
            aria-label="Share via your device"
            title="Share…"
            className={stampClass}
          >
            <SvgIcon>
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
            </SvgIcon>
          </button>
        )}

        {SHARE_TARGETS.map(({ name, href, icon }) => (
          <a
            key={name}
            href={href(text, url)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${name}`}
            title={`Share on ${name}`}
            className={stampClass}
          >
            {icon}
          </a>
        ))}

        <button
          type="button"
          onClick={copy}
          aria-label="Copy score to clipboard"
          className="storm-mono flex h-9 items-center gap-1.5 rounded-sm border border-rule/50 bg-background-deep/40 px-3 text-[10px] uppercase tracking-[0.18em] text-foreground/60 transition-colors duration-200 hover:border-brass/60 hover:text-brass-bright"
        >
          {copied ? (
            <span className="text-brass-bright">Copied ✓</span>
          ) : (
            "Copy"
          )}
        </button>
      </div>
    </div>
  );
}
