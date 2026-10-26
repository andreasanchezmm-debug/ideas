import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scryptSync } from "node:crypto";
import { initialIndicators, dimensions } from "../lib/catalog";
import {
  evaluation,
  observationSchema,
  territorySchema,
  type Observation,
} from "../lib/validation";
import { parseCsv } from "../lib/import";
import { csv } from "../lib/export";
import {
  configured,
  passwordMatches,
  sessionToken,
  validSession,
  sameOrigin,
} from "../lib/auth";
const dir = mkdtempSync(join(tmpdir(), "donut-tests-"));
process.env.SQLITE_PATH = join(dir, "test.sqlite");
const fixture: Observation = {
  id: "test-data",
  indicatorId: "01",
  municipalityId: "03014",
  territoryId: null,
  period: "2024",
  value: 123,
  unit: "€/hogar/año",
  sourceName: "FICTICIO — prueba automatizada",
  sourceUrl: "https://example.org/test-only",
  publishedAt: "2025-01-01",
  updatedAt: "2025-01-02",
  methodology: "Fixture ficticia aislada, no es un dato de Alicante",
  methodologyVersion: "1.0",
  classification: "oficial",
  validation: "borrador",
  license: "Solo prueba",
  reuseAllowed: true,
  population: null,
  coverage: "Prueba aislada",
  uncertainty: "Ficticio",
  housingContext: null,
};
test("catálogo completo, cuatro dimensiones y ningún umbral inventado", () => {
  assert.equal(initialIndicators.length, 40);
  assert.equal(new Set(initialIndicators.map((x) => x.id)).size, 40);
  assert.deepEqual(
    dimensions.map(
      (d) => initialIndicators.filter((i) => i.dimension === d.id).length,
    ),
    [15, 15, 5, 5],
  );
  assert(
    initialIndicators.every(
      (x) => x.threshold === null && x.methodology && x.sourceUrl && x.unit,
    ),
  );
});
test("evaluación distingue ausencia, sin umbral y límites justificados", () => {
  assert.equal(evaluation(undefined, initialIndicators[0]).state, "missing");
  assert.equal(evaluation(fixture, initialIndicators[0]).state, "unassessed");
  assert.equal(
    evaluation(fixture, {
      threshold: 100,
      thresholdCitation: "Referencia de prueba",
      direction: "max",
    }).state,
    "within",
  );
  assert.equal(
    evaluation(fixture, {
      threshold: 100,
      thresholdCitation: "Referencia de prueba",
      direction: "min",
    }).state,
    "outside",
  );
});
test("no se publican simulaciones ni datos sin trazabilidad", () => {
  assert(
    !observationSchema.safeParse({
      ...fixture,
      classification: "simulacion",
      validation: "publicado",
    }).success,
  );
  assert(
    !observationSchema.safeParse({
      ...fixture,
      sourceUrl: "javascript:alert(1)",
    }).success,
  );
  assert(!observationSchema.safeParse({ ...fixture, sourceName: "" }).success);
  assert(
    !observationSchema.safeParse({ ...fixture, publishedAt: "2026-01-01" })
      .success,
  );
});
test("geometrías requieren anillos cerrados y coordenadas válidas", () => {
  const area = {
    id: "fixture",
    municipalityId: "03014",
    name: "FICTICIO",
    level: "barrio",
    boundarySource: "https://example.org",
    boundaryLicense: "Test",
    boundaryVersion: "1",
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
  };
  assert(territorySchema.safeParse(area).success);
  assert(
    !territorySchema.safeParse({
      ...area,
      geojson: {
        type: "Polygon",
        coordinates: [
          [
            [200, 0],
            [1, 0],
            [1, 1],
            [200, 0],
          ],
        ],
      },
    }).success,
  );
});
test("CSV conserva comillas, saltos y metadatos; neutraliza fórmulas", () => {
  const data = {
    ...fixture,
    methodology: 'Metodología, con "comillas"\ny salto',
    sourceName: "=SUM(1,2)",
  };
  const result = parseCsv(csv([data]));
  assert.equal(result[0].methodology, data.methodology);
  assert.equal(result[0].sourceName, "'=SUM(1,2)");
  assert.equal(result[0].value, 123);
  assert.equal(result[0].reuseAllowed, true);
  assert.equal(result[0].territoryId, null);
  assert.throws(() => parseCsv("id,value\n1,2"));
});
test("sesiones firmadas, sin contraseña por defecto y control de origen", () => {
  process.env.ADMIN_PASSWORD_HASH = "";
  process.env.SESSION_SECRET = "";
  assert(!configured());
  assert(!validSession("fake"));
  const salt = "fixture";
  process.env.ADMIN_PASSWORD_HASH = `${salt}:${scryptSync("test-password-only", salt, 64).toString("hex")}`;
  process.env.SESSION_SECRET = "test-only-secret-not-a-real-credential-12345";
  assert(passwordMatches("test-password-only"));
  assert(!passwordMatches("wrong"));
  const token = sessionToken();
  assert(validSession(token));
  assert(!validSession(token + "0"));
  assert(!validSession("0.invalid"));
  assert(
    sameOrigin(
      new Request("https://test.local/api/admin", {
        headers: { origin: "https://test.local" },
      }),
    ),
  );
  assert(
    !sameOrigin(
      new Request("https://test.local/api/admin", {
        headers: { origin: "https://evil.local" },
      }),
    ),
  );
});
test("persistencia: revisión, publicación, auditoría, corrección y aislamiento territorial", async () => {
  const { saveEntity, observations, list, audit, catalog } =
    await import("../lib/db");
  assert.equal((await catalog()).length, 40);
  await assert.rejects(
    saveEntity("observations", { ...fixture, validation: "publicado" }),
    /valida/,
  );
  await saveEntity("observations", fixture);
  assert.equal((await observations()).length, 0);
  await saveEntity("observations", { ...fixture, validation: "validado" });
  await saveEntity("observations", { ...fixture, validation: "publicado" });
  assert.equal((await observations()).length, 1);
  await assert.rejects(
    saveEntity("observations", {
      ...fixture,
      value: 456,
      validation: "publicado",
    }),
    /correcciones/,
  );
  await assert.rejects(
    saveEntity("observations", {
      ...fixture,
      id: "wrong-scale",
      territoryId: "no-existe",
    }),
    /territorio/,
  );
  await assert.rejects(
    saveEntity("observations", { ...fixture, id: "duplicate" }),
    /Ya existe/,
  );
  await assert.rejects(
    saveEntity("observations", { ...fixture, id: "unit", unit: "otra" }),
    /Unidad/,
  );
  await saveEntity("observations", {
    ...fixture,
    value: 456,
    validation: "borrador",
  });
  assert.equal((await observations()).length, 0);
  assert.equal((await list("observations")).length, 1);
  assert.equal((await audit()).length, 4);
  assert.equal((await catalog())[0].name, initialIndicators[0].name);
  rmSync(dir, { recursive: true, force: true });
});
