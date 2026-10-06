import { execSync } from "node:child_process";
import { testDatabaseUrl } from "./test-db";

// Se ejecuta una vez antes de todos los tests: crea la BD si no existe y aplica las migraciones.
export default function setup() {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: "inherit",
  });
}
