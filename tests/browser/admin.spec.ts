import { test, expect } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import ExcelJS from "exceljs";
import { columns } from "../../lib/export";
const base = "http://localhost:3101";
let server: ChildProcess;
let directory: string;
const password = randomBytes(24).toString("hex");
test.beforeAll(async () => {
  directory = mkdtempSync(path.join(tmpdir(), "donut-admin-browser-"));
  const salt = randomBytes(16).toString("hex");
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "-p",
      "3101",
      "-H",
      "127.0.0.1",
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: "",
        SQLITE_PATH: path.join(directory, "test.sqlite"),
        ADMIN_PASSWORD_HASH: `${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
        SESSION_SECRET: randomBytes(48).toString("hex"),
      },
      stdio: "ignore",
    },
  );
  for (let n = 0; n < 100; n++) {
    try {
      if ((await fetch(base + "/api/data?type=catalog")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Servidor de prueba no disponible");
});
test.afterAll(async () => {
  server?.kill();
  if (server)
    await new Promise<void>((resolve) => {
      server.once("exit", () => resolve());
      setTimeout(resolve, 3000);
    });
  if (directory) rmSync(directory, { recursive: true, force: true });
});
test("administrador: borrador, revisión, publicación e importación Excel aislada", async ({
  page,
}) => {
  await page.goto(base + "/admin");
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Observaciones", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Observaciones", exact: true })
    .click();
  await page.getByRole("button", { name: "Crear observación" }).click();
  await page
    .getByLabel("Identificador estable", { exact: true })
    .fill("fixture-ui");
  await page
    .getByLabel("Periodo (AAAA o AAAA-MM)", { exact: true })
    .fill("2024");
  await page.getByLabel("Valor observado", { exact: true }).fill("123");
  await page
    .getByLabel("Nombre de la fuente", { exact: true })
    .fill("FICTICIO — prueba de navegador aislada");
  await page
    .getByLabel("Enlace original (HTTPS)", { exact: true })
    .fill("https://example.org/test-only");
  await page
    .getByLabel("Metodología", { exact: true })
    .fill(
      "Dato ficticio en una base temporal de pruebas. No representa Alicante.",
    );
  await page
    .getByLabel("Licencia documentada", { exact: true })
    .fill("Solo prueba");
  await page
    .getByLabel("Licencia comprobada: permite descarga", { exact: true })
    .check();
  await page
    .getByLabel("Cobertura y población estudiada", { exact: true })
    .fill("Fixture de prueba");
  await page
    .getByLabel("Incertidumbre y limitaciones", { exact: true })
    .fill("Ficticio");
  await page
    .getByLabel("Tipo de dato", { exact: true })
    .selectOption("estimacion");
  await page
    .getByRole("button", { name: "Guardar registro", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Registro guardado");
  expect(
    await (await page.request.get(base + "/api/data")).json(),
  ).toHaveLength(0);
  for (const state of ["validado", "publicado"]) {
    await page
      .getByRole("button", { name: "Editar ↗", exact: true })
      .first()
      .click();
    await page
      .getByLabel("Estado de revisión", { exact: true })
      .selectOption(state);
    await page
      .getByRole("button", {
        name: state === "publicado" ? "Guardar y publicar" : "Guardar registro",
        exact: true,
      })
      .click();
    await expect(page.locator(".admin-form")).toHaveCount(0);
  }
  const rows = await (await page.request.get(base + "/api/data")).json();
  expect(rows).toHaveLength(1);
  expect(rows[0].classification).toBe("estimacion");
  const exportResponse = await page.request.get(base + "/api/data?format=xlsx");
  const exported = new ExcelJS.Workbook();
  await exported.xlsx.load(Uint8Array.from(await exportResponse.body()).buffer);
  expect(exported.worksheets[0].rowCount).toBe(2);
  expect(exported.worksheets[0].getRow(2).getCell(6).value).toBe(123);
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Test");
  sheet.addRow([...columns]);
  sheet.addRow(
    columns.map((c) => {
      const row = {
        ...rows[0],
        id: "fixture-xlsx",
        period: "2023",
        classification: "simulacion",
        validation: "borrador",
      };
      return row[c] === null ? "" : row[c];
    }),
  );
  const bytes = await wb.xlsx.writeBuffer();
  await page.getByLabel("Seleccionar archivo").setInputFiles({
    name: "fixture.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(bytes),
  });
  await expect(
    page.getByRole("button", { name: "Confirmar importación como borrador" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar importación como borrador" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "1 filas guardadas; 0 rechazadas",
  );
  expect(
    await (await page.request.get(base + "/api/data")).json(),
  ).toHaveLength(1);
  await page.getByRole("button", { name: "Salir", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Acceso de administración" }),
  ).toBeVisible();
  expect(
    (await page.request.get(base + "/api/admin?entity=observations")).status(),
  ).toBe(401);
});

test("mapa con fixture documentada e informes públicos descargables en base aislada", async ({
  page,
}) => {
  await page.goto(base + "/admin");
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Salir", exact: true }),
  ).toBeVisible();
  async function save(entity: string, data: unknown) {
    const response = await page.request.post(base + "/api/admin", {
      headers: { origin: base },
      data: { action: "save", entity, data },
    });
    expect(response.status(), await response.text()).toBe(200);
  }
  await save("territories", {
    id: "fixture-map",
    municipalityId: "03014",
    name: "FICTICIO — solo prueba de mapa",
    level: "barrio",
    boundarySource: "https://example.org/test-only",
    boundaryLicense: "Solo prueba",
    boundaryVersion: "test",
    population: null,
    geojson: {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    },
  });
  await page.goto(base + "/territorio");
  await expect(page.locator(".leaflet-interactive")).toHaveCount(1);
  await page.getByLabel("Selección accesible").selectOption("fixture-map");
  await expect(
    page.getByRole("heading", {
      name: "FICTICIO — solo prueba de mapa",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Dato no disponible", { exact: true }),
  ).toBeVisible();
  const report = {
    id: "fixture-report",
    municipalityId: "03014",
    title: "FICTICIO — informe de prueba",
    summary: "Prueba aislada",
    content:
      "Contenido ficticio para verificar la publicación. No es un diagnóstico.",
    sourceUrl: null,
    status: "borrador",
    publishedAt: "2025-01-01",
  };
  await save("reports", report);
  expect(
    (
      await page.request.get(base + "/api/data?type=report&id=fixture-report")
    ).status(),
  ).toBe(404);
  await save("reports", { ...report, status: "publicado" });
  await page.goto(base + "/informes");
  await expect(page.getByRole("heading", { name: report.title })).toBeVisible();
  const download = await page.request.get(
    base + "/api/data?type=report&id=fixture-report",
  );
  expect(download.status()).toBe(200);
  expect(await download.text()).toContain(report.content);
  expect(download.headers()["content-disposition"]).toContain("attachment");
});
