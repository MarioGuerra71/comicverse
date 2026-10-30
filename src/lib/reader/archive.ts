// Abre un .cbz (ZIP) o .cbr (RAR) en el navegador y devuelve sus páginas en orden.
// Se mira la firma del archivo, no la extensión: hay muchos .cbr que en realidad son ZIP.
import { IMAGE_FILE, naturalCompare } from "@/lib/reader/filename";

export interface ArchivePage {
  name: string;
  data: Uint8Array;
}

const isZip = (b: Uint8Array) => b[0] === 0x50 && b[1] === 0x4b; // «PK»
const isRar = (b: Uint8Array) => b[0] === 0x52 && b[1] === 0x61 && b[2] === 0x72 && b[3] === 0x21; // «Rar!»

async function unzipPages(data: Uint8Array): Promise<ArchivePage[]> {
  const { unzip } = await import("fflate");
  const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) =>
    unzip(data, { filter: (f) => IMAGE_FILE.test(f.name) }, (error, result) => (error ? reject(error) : resolve(result))),
  );
  return Object.entries(files).map(([name, bytes]) => ({ name, data: bytes }));
}

async function unrarPages(data: Uint8Array): Promise<ArchivePage[]> {
  const [{ createExtractorFromData }, wasmBinary] = await Promise.all([
    import("node-unrar-js"),
    fetch("/vendor/unrar.wasm").then((r) => r.arrayBuffer()),
  ]);
  const extractor = await createExtractorFromData({ wasmBinary, data: data.buffer as ArrayBuffer });
  const { files } = extractor.extract({ files: (h) => !h.flags.directory && IMAGE_FILE.test(h.name) });
  const pages: ArchivePage[] = [];
  for (const file of files) if (file.extraction) pages.push({ name: file.fileHeader.name, data: file.extraction });
  return pages;
}

/** Las páginas (solo imágenes) en orden natural de nombre: «2.jpg» antes que «10.jpg». */
export async function readArchivePages(file: File): Promise<ArchivePage[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pages = isZip(data) ? await unzipPages(data) : isRar(data) ? await unrarPages(data) : null;
  if (!pages) throw new Error("UNSUPPORTED_FORMAT");
  if (pages.length === 0) throw new Error("NO_PAGES");
  return pages.sort((a, b) => naturalCompare(a.name, b.name));
}
