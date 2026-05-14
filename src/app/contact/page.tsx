import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { BRAND, ROUTES } from "@/lib/constants";
import ContactFormClient from "@/components/forms/ContactFormClient";
import {
  absoluteUrl,
  buildMetadata,
  buildBreadcrumbList,
  jsonLd,
} from "@/lib/seo";

const TITLE = "Contact Storm Count";
const DESCRIPTION =
  "Get in touch with the Storm Count team. Questions, feedback, partnership ideas, or anything else about the Magic: The Gathering guessing game.";

export const metadata: Metadata = buildMetadata({
  path: "/contact",
  title: TITLE,
  description: DESCRIPTION,
});

const contactJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: TITLE,
    url: absoluteUrl("/contact"),
    description: DESCRIPTION,
    inLanguage: BRAND.htmlLang,
    isPartOf: {
      "@type": "WebSite",
      name: BRAND.name,
      url: absoluteUrl("/"),
    },
  },
  buildBreadcrumbList([
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ]),
];

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <Script
        id="schema-contact"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(...contactJsonLd) }}
      />
      <header className="anim-fade-in flex flex-col gap-3">
        <p className="eyebrow">Contact</p>
        <h1
          className="storm-display text-4xl font-extrabold leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1' }}
        >
          Get in{" "}
          <span className="storm-display-italic text-brass-bright">touch</span>
        </h1>
        <p className="storm-display-italic max-w-md text-base leading-relaxed text-foreground/65">
          Questions, feedback, or just want to say hi?
        </p>
      </header>

      <ContactFormClient
        action="/api/contact"
        messagePlaceholder="What's on your mind?"
      />

      <p className="anim-fade-in storm-mono text-[11px] text-muted/50">
        Found a bug?{" "}
        <Link
          href={ROUTES.bugReport}
          className="text-brass/70 underline underline-offset-2 transition-colors hover:text-brass-bright"
        >
          Use the bug report form instead
        </Link>
        .
      </p>
    </div>
  );
}
