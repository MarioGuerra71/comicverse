import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ComicVerse",
  description: "Descubre el universo de los cómics mientras lo lees.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Todas las páginas se generan en cada petición: así llevan el nonce de la CSP
  // (una página estática, como la 404, se quedaría sin JavaScript).
  await connection();
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
