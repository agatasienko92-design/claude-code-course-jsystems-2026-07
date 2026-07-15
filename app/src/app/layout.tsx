import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import Image from "next/image";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// Play brand typeface (docs/design-guidelines.md): Manrope 500/600/700,
// 500 is the body default. latin-ext is required for Polish diacritics
// (ą ć ę ł ń ó ś ź ż).
const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Asystent Decyzji Serwisowych",
  description:
    "Wewnętrzne narzędzie wspierające pracowników serwisu w podejmowaniu decyzji reklamacyjnych i zwrotów sprzętu na podstawie zdjęcia oraz polityki firmy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>
          <header className="flex items-center gap-3 border-b border-border bg-background px-6 py-4">
            <Image
              src="/logo.svg"
              alt="Play"
              width={100}
              height={32}
              priority
            />
            <span className="text-lg font-semibold">
              Asystent Decyzji Serwisowych
            </span>
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
        </TooltipProvider>
      </body>
    </html>
  );
}
