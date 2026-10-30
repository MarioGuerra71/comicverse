import type { MetadataRoute } from "next";

// Lo que usa el móvil al «Añadir a pantalla de inicio»: nombre e icono de la app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ComicVerse",
    short_name: "ComicVerse",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0c0a10",
    theme_color: "#0c0a10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
