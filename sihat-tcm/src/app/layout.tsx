import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { Providers } from "./providers";
import { Toaster } from 'sonner'
import { getAdminSettings } from "@/lib/settings";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { JsonLd } from "@/components/seo/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
  ],
  authors: [{ name: "Sihat TCM Team" }],
  creator: "Sihat TCM",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sihat-tcm.vercel.app",
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
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <JsonLd />
        <Providers>
          <main className="flex-grow mb-16 md:mb-0">{children}</main>
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
