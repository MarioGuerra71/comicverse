// Mientras el servidor prepara la página: una nota a lápiz, sin esqueletos que salten al llegar los datos.
export default function Loading() {
  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4">
      <p role="status" className="font-hand text-2xl font-bold text-ink-soft motion-safe:animate-pulse">
        entintando…
      </p>
    </main>
  );
}
