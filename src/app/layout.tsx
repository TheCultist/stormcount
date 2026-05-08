import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Script from "next/script";
import "./globals.css";
import "./theme-izzet.css";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";
import { BRAND } from "@/lib/constants";
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

const BASE_URL = `https://${BRAND.domain}`;
const defaultTitle = `${BRAND.name} — ${BRAND.tagline}`;
const defaultDescription =
  "Storm Count is a free Magic: The Gathering guessing game. Each round shows two MTG cards — guess whether the mystery card's mana value is higher or lower. Daily challenges, survival mode, and global leaderboards.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: defaultTitle,
    template: `%s | ${BRAND.name}`,
  },
  description: defaultDescription,
  keywords: [
    "Magic the Gathering game",
    "MTG guessing game",
    "MTG higher lower",
    "mana value game",
    "Magic the Gathering daily challenge",
    "Storm Count",
    "MTG trivia",
    "Magic card game",
  ],
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: defaultTitle,
    description: defaultDescription,
    url: BASE_URL,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: `${BRAND.name} — ${BRAND.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const adminUser = isAdmin(userId);

  return (
    <ClerkProvider>
      <html
        lang="en"
        data-theme="izzet"
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
      >
        <body className="relative flex min-h-full flex-col text-foreground">
          <Script
            id="schema-org"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "WebSite",
                    "@id": `${BASE_URL}/#website`,
                    name: BRAND.name,
                    url: BASE_URL,
                    description: defaultDescription,
                    publisher: { "@id": `${BASE_URL}/#organization` },
                  },
                  {
                    "@type": "Organization",
                    "@id": `${BASE_URL}/#organization`,
                    name: BRAND.name,
                    url: BASE_URL,
                    logo: `${BASE_URL}/logo.png`,
                  },
                  {
                    "@type": "SoftwareApplication",
                    "@id": `${BASE_URL}/#app`,
                    name: BRAND.name,
                    url: BASE_URL,
                    applicationCategory: "GameApplication",
                    operatingSystem: "Any",
                    description: defaultDescription,
                    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                  },
                ],
              }),
            }}
          />
          {/* Atmosphere layers */}
          <div className="atmosphere-root" aria-hidden />
          <div className="atmosphere-rays" aria-hidden />
          <div className="atmosphere-vignette" aria-hidden />

          <NavBar isAdmin={adminUser} />
          <main className="relative flex flex-1 flex-col">{children}</main>
          <Footer />
          <CookieBanner />
        </body>
      </html>
    </ClerkProvider>
  );
}
