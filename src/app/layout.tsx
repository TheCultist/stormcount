import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "./theme-izzet.css";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";
import { BRAND } from "@/lib/constants";
import { BASE_URL, absoluteUrl, jsonLd } from "@/lib/seo";
import { isAdmin } from "@/lib/auth/admin";

const fontDisplay = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const defaultTitle = `${BRAND.name} — ${BRAND.tagline}`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: BRAND.themeColor,
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: BRAND.name,
  title: {
    default: defaultTitle,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  // Site-wide canonical. Per-page metadata overrides via alternates.canonical.
  alternates: {
    canonical: "/",
  },
  authors: [{ name: BRAND.publisher, url: BASE_URL }],
  creator: BRAND.publisher,
  publisher: BRAND.publisher,
  category: "games",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: defaultTitle,
    description: BRAND.description,
    url: BASE_URL,
    locale: BRAND.ogLocale,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: defaultTitle,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: BRAND.description,
    images: ["/opengraph-image.png"],
  },
  // NB: `metadata.icons` is intentionally omitted. Next.js gives file-based
  // conventions higher priority (`app/icon.png` → <link rel="icon" />) so
  // declaring it here would either be a dead override or fight the file
  // convention. See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// Site-wide JSON-LD: identifies the website, the publishing organisation,
// the underlying game (VideoGame), and the search action entry point.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: BRAND.name,
      description: BRAND.description,
      inLanguage: BRAND.htmlLang,
      publisher: { "@id": `${BASE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: BRAND.publisher,
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
        width: 512,
        height: 512,
      },
    },
    {
      "@type": "VideoGame",
      "@id": `${BASE_URL}/#videogame`,
      name: BRAND.name,
      url: BASE_URL,
      description: BRAND.description,
      genre: ["Trivia", "Card Game", "Puzzle"],
      gamePlatform: ["Web Browser"],
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      inLanguage: BRAND.htmlLang,
      publisher: { "@id": `${BASE_URL}/#organization` },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      isAccessibleForFree: true,
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const adminUser = await isAdmin(userId);

  return (
    <ClerkProvider>
      <html
        lang={BRAND.htmlLang}
        data-theme="izzet"
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      >
        <body className="relative flex min-h-full flex-col text-foreground">
          <Script
            id="schema-org"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd(siteJsonLd) }}
          />
          {/* Atmosphere layers */}
          <div className="atmosphere-root" aria-hidden />
          <div className="atmosphere-rays" aria-hidden />
          <div className="atmosphere-vignette" aria-hidden />

          <NavBar isAdmin={adminUser} />
          <main className="relative flex flex-1 flex-col">{children}</main>
          <Footer />
          <CookieBanner />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
