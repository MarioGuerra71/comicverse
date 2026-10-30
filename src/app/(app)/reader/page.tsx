import type { Metadata } from "next";
import { z } from "zod";
import { normalizeParams, type SearchParams } from "@/lib/search-params";
import { PageHeader } from "@/components/ui/page-parts";
import { ReaderShelf } from "@/components/reader/reader-shelf";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Lector · ComicVerse" };

// La carpeta abierta («DC UNIVERSO ABSOLUTE/Absolute Batman»); solo filtra lo que hay en el dispositivo.
const readerSearchSchema = z.object({ carpeta: z.string().max(500).default("") });

export default async function ReaderPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireUser();
  const parsed = readerSearchSchema.safeParse(normalizeParams(await searchParams));
  const folder = parsed.success ? parsed.data.carpeta : "";
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Lector" />
      {/* key: al cambiar de carpeta, avisos y diálogos empiezan de cero. */}
      <ReaderShelf key={folder} folder={folder} />
    </main>
  );
}
