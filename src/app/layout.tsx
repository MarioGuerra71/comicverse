import type { Metadata } from "next";
import { Geist, Geist_Mono, Marcellus } from "next/font/google";
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

// Romana grabada de las cartas celestes (OFL). next/font la sirve desde el propio
// dominio, así que la CSP (font-src 'self') no cambia.
const marcellus = Marcellus({
  variable: "--font-marcellus",
  weight: "400",
  subsets: ["latin", "latin-ext"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${marcellus.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
