import { test, expect } from "@playwright/test";
test("navegación pública, filtros, ficha vacía y accesibilidad territorial", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Una ciudad para vivir bien/ }),
  ).toBeVisible();
  await expect(page.locator(".donut-svg path")).toHaveCount(40);
  await page.screenshot({
    path: "/tmp/donut-alicante-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Explorar indicadores", exact: true })
    .click();
  await expect(page.locator(".indicator-card")).toHaveCount(40);
  await page.getByLabel("Buscar indicadores").fill("renta mediana");
  await expect(page.locator(".indicator-card")).toHaveCount(1);
  await page.locator(".indicator-card").click();
  await expect(
    page.getByRole("heading", { name: "Renta mediana por hogar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Dato no disponible", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Aún no hay una serie histórica")).toBeVisible();
  await page.goto("/indicadores?dimension=global");
  await expect(page.locator(".indicator-card")).toHaveCount(5);
  await page.goto("/territorio");
  await expect(
    page.getByRole("heading", { name: "Primero, un mapa con garantías." }),
  ).toBeVisible();
  await page.getByLabel("Nivel territorial").selectOption("seccion");
  await expect(
    page.getByText("ALICANTE · SECCIONES CENSALES", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Acceso de administración" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("API y descargas no exponen observaciones inventadas ni administración", async ({
  request,
}) => {
  const catalog = await request.get("/api/data?type=catalog");
  expect(catalog.status()).toBe(200);
  expect((await catalog.json()).length).toBe(40);
  expect(await (await request.get("/api/data")).json()).toEqual([]);
  expect((await request.get("/api/admin?entity=observations")).status()).toBe(
    401,
  );
  const csv = await request.get("/api/data?format=csv");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect((await csv.text()).trim().split("\n")).toHaveLength(1);
  const excel = await request.get("/api/data?format=xlsx");
  expect(excel.status()).toBe(200);
  expect((await excel.body()).subarray(0, 2).toString()).toBe("PK");
  expect(
    (
      await request.post("/api/admin", {
        headers: { origin: "https://other.example" },
        data: { action: "save", entity: "reports" },
      })
    ).status(),
  ).toBe(403);
});
test("vista móvil sin desbordamiento horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/indicadores",
    "/indicadores/01",
    "/territorio",
    "/metodologia",
    "/descargas",
    "/admin",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/");
  await page.screenshot({
    path: "/tmp/donut-alicante-mobile.png",
    fullPage: true,
  });
});
