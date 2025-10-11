import type { Metadata } from "next";
import "./globals.css";
import { ConditionalLayout } from '@/components/layout/ConditionalLayout'
import { AuthProvider } from '@/contexts/AuthContext'

// Polyfill for Promise.withResolvers (for PDF.js compatibility)
if (!Promise.withResolvers) {
  Promise.withResolvers = function <T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

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
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
