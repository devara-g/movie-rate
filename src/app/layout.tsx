import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CineHearth — An Intimate Cinema Sanctuary & Journal",
  description:
    "A warm, tactile, and editorial cinephile sanctuary. Explore curated 35mm repertory collections, thoughtful film essays, ratings, and intimate member discussions.",
  keywords: ["cinema", "film review", "letterboxd alternative", "criterion", "35mm", "film journal", "cinephile"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#14181c" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
