import type { Metadata } from "next";
import "./globals.css";
import { SideNavigation } from '@/components/layout/SideNavigation'

export const metadata: Metadata = {
  title: "LegalKaki - Legal Information for Every Rakyat",
  description: "Making legal information accessible, understandable, and actionable for every rakyat",
  keywords: ["legal", "law", "malaysia", "advice", "documents", "AI"],
  authors: [{ name: "LegalKaki Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-sans text-text-primary bg-background antialiased">
        <div className="flex h-full">
          <SideNavigation />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
