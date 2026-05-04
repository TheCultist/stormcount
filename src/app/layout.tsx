import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "./theme-izzet.css";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import { ThemeProvider, themeScript } from "@/components/theme/ThemeProvider";
import { BRAND } from "@/lib/constants";

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

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    "Storm Count: a Magic: The Gathering higher/lower mana value guessing game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        data-theme="izzet"
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          {/* Runs before paint — prevents flash of wrong theme */}
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body className="relative flex min-h-full flex-col text-foreground">
          <ThemeProvider>
            {/* Atmosphere layers */}
            <div className="atmosphere-root" aria-hidden />
            <div className="atmosphere-rays" aria-hidden />
            <div className="atmosphere-vignette" aria-hidden />

            <NavBar />
            <main className="relative flex flex-1 flex-col">{children}</main>
            <Footer />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
