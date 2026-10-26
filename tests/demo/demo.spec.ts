import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
test("demo estática: catálogo, series ficticias, filtros y descargas sin API", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByText("DEMO INTERACTIVA · DATOS FICTICIOS", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".indicator-card")).toHaveCount(40);
  await expect(page.locator(".donut-svg path")).toHaveCount(40);
  await page.getByLabel("Buscar indicadores").fill("renta mediana");
  await expect(page.locator(".indicator-card")).toHaveCount(1);
  await page.locator(".indicator-card").click();
  await expect(page.locator("#ficha h2").first()).toHaveText(
    "Renta mediana por hogar",
  );
  await expect(page.locator("#ficha tbody tr")).toHaveCount(3);
  await page
    .getByLabel("Periodo de ejemplo", { exact: true })
    .selectOption("2023");
  await expect(page.locator("#ficha .value-panel h2")).toContainText("24.200");
  await page
    .getByLabel("Seleccionar indicador", { exact: true })
    .selectOption("02");
  await expect(page.locator("#ficha .value-panel h2")).toHaveText(
    "Dato no disponible",
  );
  await page.getByLabel("Buscar indicadores").fill("");
  await page
    .getByRole("button", { name: "Impacto ecológico global", exact: true })
    .click();
  await expect(page.locator(".indicator-card")).toHaveCount(5);
  const csvDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV ficticio", exact: true }).click();
  const csv = await csvDownload;
  const text = await readFile((await csv.path())!, "utf8");
  expect(text).toContain("simulacion");
  expect(text).toContain("FICTICIO");
  expect(text.trim().split("\n")).toHaveLength(25);
  const excelDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Excel ficticio", exact: true })
    .click();
  const excel = await excelDownload;
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(
    Uint8Array.from(await readFile((await excel.path())!)).buffer,
  );
  expect(book.worksheets[0].rowCount).toBe(25);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
