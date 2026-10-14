import { expect, test, type Page } from "@playwright/test";
import { SEED } from "./db";

const PASSWORD = "contrasena-de-prueba-123";

// Cada test es un lector nuevo con una IP distinta (el límite de intentos va por IP).
const randomIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;
test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": randomIp() });
});

const uniqueEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.local`;

/** Crea la cuenta por la API (más rápido que el formulario) y deja la sesión en el navegador. */
async function signUp(page: Page, baseURL: string, name = "Lectora E2E") {
  const response = await page.request.post("/api/auth/sign-up/email", {
    // Better Auth exige el Origin de la app en las peticiones que cambian algo.
    headers: { Origin: baseURL, "x-forwarded-for": randomIp() },
    data: { name, email: uniqueEmail(), password: PASSWORD },
  });
  expect(response.ok()).toBeTruthy();
}

/** El selector de editorial visible (barra lateral en escritorio, barra superior en el móvil). */
const zoneButton = (page: Page, label: "Marvel" | "DC") =>
  page.getByRole("button", { name: label, exact: true }).locator("visible=true").first();

test("sin sesión, las pantallas privadas llevan a iniciar sesión", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
});

test("crear cuenta desde el formulario lleva al inicio", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Nombre").fill("Ana Formulario");
  await page.getByLabel("Correo electrónico").fill(uniqueEmail());
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Hola, Ana Formulario/i })).toBeVisible();
});

test("leer un cómic desbloquea a sus personajes, y se puede puntuar y reseñar", async ({ page, baseURL }) => {
  await signUp(page, baseURL!);
  await page.goto("/catalog");
  await page.getByRole("link", { name: new RegExp(SEED.marvelComic) }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: SEED.marvelComic })).toBeVisible();

  // Sin spoilers: antes de leerlo, ni la página ni sus datos nombran a sus personajes.
  await expect(page.getByText("personajes por descubrir")).toBeVisible();
  const html = await page.content();
  for (const name of SEED.marvelCharacters) expect(html).not.toContain(name);

  await page.getByRole("button", { name: "Leído", exact: true }).click();
  await expect(page.getByText(/2 nuevos descubrimientos/)).toBeVisible();
  await expect(page.getByText("Leído el", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "4 de 5" }).click();
  await expect(page.getByRole("button", { name: "4 de 5" })).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("Tu reseña").fill("Una prueba de extremo a extremo que sale bien.");
  await page.getByRole("button", { name: "Publicar reseña" }).click();
  await expect(page.locator("blockquote")).toHaveText("Una prueba de extremo a extremo que sale bien.");

  // Todo queda guardado: al recargar sigue ahí.
  await page.reload();
  await expect(page.locator("blockquote")).toHaveText("Una prueba de extremo a extremo que sale bien.");
  await expect(page.getByRole("button", { name: "4 de 5" })).toHaveAttribute("aria-pressed", "true");

  // Y los personajes aparecen en la colección.
  await page.goto("/collection");
  await expect(page.getByText(SEED.marvelComic.replace(/ #1$/, ""))).toBeVisible();
});

test("cambiar de editorial desde la ficha de un cómic vuelve al catálogo de la otra", async ({ page, baseURL }) => {
  await signUp(page, baseURL!);
  await page.goto("/catalog");
  await page.getByRole("link", { name: new RegExp(SEED.marvelComic) }).first().click();
  await expect(page).toHaveURL(/\/comics\//);

  await zoneButton(page, "DC").click();
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByRole("heading", { level: 1, name: /Catálogo DC/i })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(SEED.dcComic) }).first()).toBeVisible();
  await expect(page.getByText(SEED.marvelComic)).toHaveCount(0);
});
