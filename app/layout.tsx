import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Template CSS (loaded once)
import "./templates/tech-clean.css";
import "./templates/dj-dark.css";
import "./templates/dancer-light.css";

import CookieBanner from "@/components/tracking/CookieBanner";

import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SQRZ",
  description: "The LinkInBio that gets you booked",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_ID = process.env.NEXT_PUBLIC_SQRZ_GA_ID;

  return (
    <html lang="en">
      <head>
    
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
