import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3, DM_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MEWIRE — Middle East Live News Aggregator",
  description:
    "Real-time news aggregation from 13+ trusted sources covering the Middle East conflict. UAE priority. EN/JPN bilingual.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${sourceSans.variable} ${dmMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
