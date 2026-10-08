import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Tests de integración: usan la BD de pruebas real (ver tests/integration/test-db.ts).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    // Todos los archivos comparten la misma BD: se ejecutan de uno en uno.
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
