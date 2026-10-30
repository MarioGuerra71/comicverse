import type { Metadata } from "next";
import { Big_Shoulders, Caveat, Geist } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


// Letra a mano del editor (OFL): notas al margen y números de catálogo. next/font la
// sirve desde el propio dominio, así que la CSP (font-src 'self') no cambia.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin", "latin-ext"],
});

// Rotulación de letrero nocturno (OFL), servida desde el propio dominio por next/font.
const display = Big_Shoulders({
  variable: "--font-display-face",
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "ComicVerse",
  description: "Descubre el universo de los cómics mientras lo lees.",
  icons: { icon: "/icon-192.png", apple: "/apple-icon.png" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Todas las páginas se generan en cada petición: así llevan el nonce de la CSP
  // (una página estática, como la 404, se quedaría sin JavaScript).
  await connection();
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${caveat.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
