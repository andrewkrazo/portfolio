import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Geist, Geist_Mono } from "next/font/google";
import { FIRST_PAINT_SCRIPT } from "@/lib/sky";
import "./globals.css";

const display = Big_Shoulders({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-display" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Andrew Razo",
  description:
    "CS and Philosophy at Brown. Full-stack products built solo: Syllabuddy, Placivic, Rizdum and Loops.",
  openGraph: {
    title: "Andrew Razo",
    description: "CS and Philosophy at Brown. Full-stack products built solo.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2a1f3d", // follows the sky once the page loads
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: FIRST_PAINT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
