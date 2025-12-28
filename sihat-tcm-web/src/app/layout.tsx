import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import { getAdminSettings } from "@/lib/settings";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { JsonLd } from "@/components/seo/JsonLd";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// Inter as fallback (closest to SF Pro) - system fonts are used first via CSS
const inter = Inter({
  variable: "--font-inter-fallback",
  subsets: ["latin"],
  display: "swap",
  fallback: ["-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sihat-tcm.vercel.app"),
  alternates: {
    canonical: "./",
  },
  title: {
    default: "Sihat TCM - AI-Powered Traditional Chinese Medicine",
    template: "%s | Sihat TCM",
  },
  description:
    "Experience the wisdom of ancient healing combined with modern AI technology. Sihat TCM offers AI-powered Traditional Chinese Medicine diagnosis including tongue analysis, pulse diagnosis, and personalized herbal medicine recommendations.",
  keywords: [
    "TCM",
    "Traditional Chinese Medicine",
    "AI Diagnosis",
    "Health",
    "Wellness",
    "Tongue Diagnosis",
    "Pulse Diagnosis",
    "Chinese Herbal Medicine",
    "Malaysia Health App",
    "Sihat TCM",
    "中医诊断",
    "Perubatan Tradisional Cina",
  ],
  authors: [{ name: "Sihat TCM Team" }],
  creator: "Sihat TCM",
  publisher: "Prisma Technology Solution Sdn. Bhd.",
  applicationName: "Sihat TCM",
  category: "Health & Wellness",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["ms_MY", "zh_CN"],
    url: "./",
    title: "Sihat TCM - AI-Powered Traditional Chinese Medicine",
    description:
      "Experience the wisdom of ancient healing combined with modern AI technology. AI-powered TCM diagnosis with tongue analysis, pulse diagnosis, and personalized recommendations.",
    siteName: "Sihat TCM",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sihat TCM - AI-Powered Traditional Chinese Medicine",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sihat TCM - AI-Powered Traditional Chinese Medicine",
    description:
      "Experience the wisdom of ancient healing combined with modern AI technology. AI-powered TCM diagnosis with tongue analysis, pulse diagnosis, and personalized recommendations.",
    images: ["/og-image.png"],
    // Add your Twitter handle when available
    // site: "@SihatTCM",
    // creator: "@SihatTCM",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-verification-code',
  },
  other: {
    "geo.region": "MY-01", // Johor, Malaysia
    "geo.placename": "Skudai, Johor",
    "geo.position": "1.5355;103.6591",
    ICBM: "1.5355, 103.6591",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getAdminSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical external domains for faster resource loading */}
        <link rel="preconnect" href="https://qbvmcxfbwianojnxoouf.supabase.co" />
        <link rel="dns-prefetch" href="https://qbvmcxfbwianojnxoouf.supabase.co" />
        {/* Preconnect to Google Fonts (used by next/font) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <JsonLd />
        <Providers>
          <ErrorBoundary>
            <main className="flex-grow mb-16 md:mb-0">{children}</main>
          </ErrorBoundary>
          <Footer />
          <BottomNavigation />
          <BackgroundMusic
            enabled={settings.backgroundMusicEnabled}
            url={settings.backgroundMusicUrl}
            initialVolume={settings.backgroundMusicVolume}
          />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
