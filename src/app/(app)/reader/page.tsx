import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-parts";
import { ReaderShelf } from "@/components/reader/reader-shelf";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Lector · ComicVerse" };

export default async function ReaderPage() {
  await requireUser();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader title="Lector" />
      <ReaderShelf />
    </main>
  );
}
