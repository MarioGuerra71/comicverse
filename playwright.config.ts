import { defineConfig, devices } from "@playwright/test";
import { e2eDatabaseUrl } from "./tests/e2e/db";

// Tests de extremo a extremo: la app de verdad (build de producción) contra una BD propia
// con unos pocos cómics de prueba. Los cómics ya traen sus personajes: no se llama a Comic Vine.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  // Comparten la BD y cada test crea su propio usuario: pueden ir en paralelo.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    locale: "es-ES",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "movil", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Primero la BD de prueba (la app la consulta nada más arrancar); en CI el build ya está hecho.
    command: [
      "npx tsx tests/e2e/seed.ts",
      ...(process.env.CI ? [] : ["npm run build"]),
      `npx next start -p ${PORT}`,
    ].join(" && "),
    url: `${baseURL}/sign-in`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "e2e-secret-solo-para-pruebas-0123456789abcdef",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
