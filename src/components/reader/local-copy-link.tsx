"use client";

import Link from "next/link";
import { useLocalComics } from "@/components/reader/use-local-comics";
import { inkButton } from "@/components/ui/page-parts";

/** En la ficha de un cómic: «Leer» si lo tienes descargado en este dispositivo. */
export function LocalCopyLink({ comicId }: { comicId: string }) {
  const local = useLocalComics()?.find((c) => c.comicId === comicId);
  if (!local) return null;
  const label =
    local.lastPage === 0
      ? "Leer en el lector"
      : local.lastPage >= local.pages - 1
        ? "Volver a leer en el lector"
        : `Seguir leyendo (pág. ${local.lastPage + 1}/${local.pages})`;
  return (
    <Link href={`/reader/${local.id}`} className={`${inkButton} w-full justify-center`}>
      {label}
    </Link>
  );
}
