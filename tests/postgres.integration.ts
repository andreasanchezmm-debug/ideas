// Integration check, explicitly run against a disposable *_test database only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { catalog, saveEntity, observations, audit } from "../lib/db";
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw new Error(
      "Requiere una base desechable con nombre terminado en _test",
    );
  const pool = new Pool({ connectionString: url });
  assert.equal((await catalog()).length, 40);
  await pool.query(readFileSync("db/postgis.sql", "utf8"));
  await pool.query(readFileSync("db/postgis.sql", "utf8"));
  const area = {
    id: "fixture-area",
    municipalityId: "03014",
    name: "FICTICIO — solo integración",
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
  };
  await saveEntity("territories", area);
  const geom = await pool.query(
    "SELECT ST_IsValid(geom) AS valid, ST_SRID(geom) AS srid FROM territories WHERE id=$1",
    [area.id],
  );
  assert.equal(geom.rows[0].valid, true);
  assert.equal(geom.rows[0].srid, 4326);
  const record = {
    id: "fixture-observation",
    indicatorId: "01",
    municipalityId: "03014",
    territoryId: area.id,
    period: "2024",
    value: 123,
    unit: "€/hogar/año",
    sourceName: "FICTICIO — prueba aislada",
    sourceUrl: "https://example.org/test-only",
    publishedAt: "2025-01-01",
    updatedAt: "2025-01-02",
    methodology: "No es un dato de Alicante. Solo prueba de integración.",
    methodologyVersion: "1.0",
    classification: "oficial",
    validation: "borrador",
    license: "Solo prueba",
    reuseAllowed: false,
    population: null,
    coverage: "Fixture",
    uncertainty: "Ficticio",
    housingContext: null,
  };
  await saveEntity("observations", record);
  assert.equal((await observations()).length, 0);
  await saveEntity("observations", { ...record, validation: "validado" });
  await saveEntity("observations", { ...record, validation: "publicado" });
  assert.equal((await observations()).length, 1);
  await assert.rejects(
    saveEntity("observations", { ...record, id: "duplicate" }),
    /Ya existe/,
  );
  assert.equal((await audit()).length, 4);
  console.log(
    "PostgreSQL/PostGIS: catálogo, geometría, SRID, migración repetible, revisión, publicación, unicidad y auditoría verificados en base aislada.",
  );
  await pool.end();
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
