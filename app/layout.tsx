import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/layout/Navbar";
import BackendPing from "@/components/BackendPing";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INTI — Intercambia lo que cosechas",
  description: "Red de trueques para productores rurales. Publica tu cosecha, encuentra lo que necesitas y acuerda intercambios sin dinero.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50" suppressHydrationWarning>
        <Providers>
          <BackendPing />
          <Navbar />
          <main className="flex-1" suppressHydrationWarning>{children}</main>
          <footer className="border-t bg-white">
            <div className="container mx-auto flex flex-col gap-2 px-4 py-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} INTI</p>
              <div className="flex items-center gap-4">
                <Link href="/legal/terms" className="hover:text-green-700 hover:underline">
                  Términos y Condiciones
                </Link>
                <Link href="/legal/privacy" className="hover:text-green-700 hover:underline">
                  Política de Privacidad
                </Link>
                <Link href="/legal/cookies" className="hover:text-green-700 hover:underline">
                  Cookies
                </Link>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
