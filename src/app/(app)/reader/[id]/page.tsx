import type { Metadata } from "next";
import { ComicViewer } from "@/components/reader/comic-viewer";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Leyendo · ComicVerse" };

export default async function ReaderViewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  // El id es local (del dispositivo): el visor lo busca en el navegador, no en el servidor.
  return <ComicViewer id={(await params).id} />;
}
