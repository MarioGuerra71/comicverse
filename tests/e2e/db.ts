// BD propia de los tests E2E (mismo PostgreSQL que en desarrollo, otra base de datos).
export const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ??
  "postgresql://comicverse:comicverse_dev@localhost:5432/comicverse_e2e_test?schema=public";

// Se vacía entera antes de cada ejecución: nos negamos a tocar una BD que no sea de pruebas.
if (!new URL(e2eDatabaseUrl).pathname.endsWith("_test")) {
  throw new Error("La BD de los tests E2E debe terminar en _test");
}

/** Datos fijos que los tests conocen por su nombre. */
export const SEED = {
  marvelComic: "Prueba Marvel #1",
  dcComic: "Prueba DC #1",
  // Personajes del cómic de Marvel: no pueden salir en la página antes de leerlo.
  marvelCharacters: ["Peter Prueba", "Mary Prueba"],
};
