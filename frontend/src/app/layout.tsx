import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AranyaPulse | NESFIC-D-15 Forest & Carbon MRV",
  description:
    "AI-Driven Multi-Temporal Geospatial & Field-Verified Forest Biomass and Carbon Assessment Platform for Assam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
