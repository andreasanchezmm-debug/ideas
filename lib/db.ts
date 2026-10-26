import { mkdirSync } from "node:fs";
import path from "node:path";
import { initialIndicators, city } from "./catalog";
import { schemas, type Entity, type Observation } from "./validation";
import type { Indicator } from "./catalog";
import type { Territory, Report } from "./validation";
import type { Pool } from "pg";
import type { DatabaseSync } from "node:sqlite";
type Row = { id: string; data: string; revision: number };
type Conn = {
  query: (sql: string, args?: unknown[]) => Promise<Row[]>;
  transaction: <T>(fn: (db: Conn) => Promise<T>) => Promise<T>;
};
let init: Promise<Conn> | undefined;
async function connect(): Promise<Conn> {
  let conn: Conn;
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool: Pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 4,
    });
    const query = async (sql: string, args: unknown[] = []) => {
      let i = 0;
      return (
        await pool.query(
          sql.replace(/\?/g, () => `$${++i}`),
          args,
        )
      ).rows;
    };
    conn = {
      query,
      transaction: async (fn) => {
        const client = await pool.connect();
        const tx: Conn = {
          query: async (sql, args = []) => {
            let i = 0;
            return (
              await client.query(
                sql.replace(/\?/g, () => `$${++i}`),
                args,
              )
            ).rows;
          },
          transaction: async () => {
            throw new Error("Nested transaction");
          },
        };
        try {
          await client.query("BEGIN");
          await client.query("SELECT pg_advisory_xact_lock(304014)");
          const result = await fn(tx);
          await client.query("COMMIT");
          return result;
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      },
    };
  } else {
    const { DatabaseSync } = await import("node:sqlite");
    const file =
      process.env.SQLITE_PATH ||
      path.join(process.cwd(), ".data", "donut.sqlite");
    mkdirSync(path.dirname(file), { recursive: true });
    const db: DatabaseSync = new DatabaseSync(file);
    db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
    );
    const query = async (sql: string, args: unknown[] = []) => {
      const q = db.prepare(sql);
      if (/^\s*(SELECT|WITH)/i.test(sql))
        return q.all(...(args as (string | number | null)[])) as Row[];
      q.run(...(args as (string | number | null)[]));
      return [];
    };
    conn = {
      query,
      transaction: async (fn) => {
        db.exec("BEGIN IMMEDIATE");
        try {
          const result = await fn(conn);
          db.exec("COMMIT");
          return result;
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
      },
    };
  }
  for (const table of Object.keys(schemas))
    await conn.query(
      `CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1)`,
    );
  await conn.query(
    "CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, entity TEXT NOT NULL, record_id TEXT NOT NULL, changed_at TEXT NOT NULL, before_data TEXT, after_data TEXT NOT NULL, actor TEXT NOT NULL)",
  );
  for (const item of initialIndicators)
    await conn.query(
      "INSERT INTO indicators (id,data) VALUES (?,?) ON CONFLICT (id) DO NOTHING",
      [item.id, JSON.stringify(item)],
    );
  await conn.query(
    "INSERT INTO municipalities (id,data) VALUES (?,?) ON CONFLICT (id) DO NOTHING",
    [city.id, JSON.stringify(city)],
  );
  return conn;
}
export function database() {
  return (init ??= connect());
}
export async function list<T>(entity: Entity): Promise<T[]> {
  const db = await database();
  return (await db.query(`SELECT * FROM ${entity} ORDER BY id`)).map((r) =>
    JSON.parse(r.data),
  );
}
export async function catalog() {
  return list<Indicator>("indicators");
}
export async function observations() {
  const active = new Set(
    (await catalog()).filter((i) => i.active).map((i) => i.id),
  );
  return (await list<Observation>("observations")).filter(
    (x) =>
      active.has(x.indicatorId) &&
      x.validation === "publicado" &&
      x.classification !== "simulacion",
  );
}
export async function territories() {
  return list<Territory>("territories");
}
export async function reports() {
  return (await list<Report>("reports")).filter(
    (x) => x.status === "publicado",
  );
}
// All mutations use one write queue per application process, including audit/history.
let writes = Promise.resolve();
export async function saveEntity(entity: Entity, input: unknown) {
  const data = schemas[entity].parse(input);
  const task = writes.then(async () => {
    const connection = await database();
    return connection.transaction(async (db) => {
      const list = async <T>(table: Entity): Promise<T[]> =>
        (await db.query(`SELECT * FROM ${table} ORDER BY id`)).map((r) =>
          JSON.parse(r.data),
        );
      const catalog = () => list<Indicator>("indicators");
      const territories = () => list<Territory>("territories");
      if (entity === "observations") {
        const o = data as Observation;
        const indicators = await catalog();
        const indicator = indicators.find(
          (i) => i.id === o.indicatorId && i.active,
        );
        if (!indicator) throw new Error("Indicador inexistente o inactivo");
        if (
          o.unit !== indicator.unit ||
          o.methodologyVersion !== indicator.version
        )
          throw new Error(
            "Unidad o versión metodológica incompatible con el catálogo",
          );
        if (
          !(await list<{ id: string }>("municipalities")).some(
            (c) => c.id === o.municipalityId,
          )
        )
          throw new Error("Municipio inexistente");
        if (
          o.territoryId &&
          !(await territories()).some(
            (t) =>
              t.id === o.territoryId && t.municipalityId === o.municipalityId,
          )
        )
          throw new Error("El territorio no pertenece al municipio");
        if (o.validation === "publicado") {
          const existing = (
            await db.query("SELECT * FROM observations WHERE id=?", [o.id])
          )[0];
          if (
            !existing ||
            !["validado", "publicado"].includes(
              JSON.parse(existing.data).validation,
            )
          )
            throw new Error("Guarda y valida el dato antes de publicarlo");
          const previous = JSON.parse(existing.data);
          const current = { ...o };
          delete previous.validation;
          delete (current as Partial<Observation>).validation;
          if (JSON.stringify(previous) !== JSON.stringify(current))
            throw new Error(
              "Las correcciones deben guardarse y validarse antes de publicarlas",
            );
        }
        const duplicate = (await list<Observation>("observations")).some(
          (x) =>
            x.id !== o.id &&
            x.indicatorId === o.indicatorId &&
            x.municipalityId === o.municipalityId &&
            x.territoryId === o.territoryId &&
            x.period === o.period,
        );
        if (duplicate)
          throw new Error(
            "Ya existe una observación para ese indicador, periodo y territorio",
          );
      }
      if (entity === "territories" || entity === "reports") {
        const record = data as Territory | Report;
        if (
          !(await list<{ id: string }>("municipalities")).some(
            (c) => c.id === record.municipalityId,
          )
        )
          throw new Error("Municipio inexistente");
      }
      if (entity === "indicators") {
        const i = data as Indicator;
        const previous = (await catalog()).find((x) => x.id === i.id);
        if (
          previous &&
          (previous.unit !== i.unit ||
            previous.version !== i.version ||
            previous.methodology !== i.methodology ||
            previous.definition !== i.definition) &&
          (await list<Observation>("observations")).some(
            (x) => x.indicatorId === i.id,
          )
        )
          throw new Error(
            "Crea un nuevo indicador para preservar la compatibilidad de las series existentes",
          );
      }
      const old = (
        await db.query(`SELECT * FROM ${entity} WHERE id=?`, [data.id])
      )[0];
      const after = JSON.stringify(data),
        revision = (old?.revision || 0) + 1;
      // Data and immutable history commit atomically.
      await db.query(
        "INSERT INTO audit_log (id,entity,record_id,changed_at,before_data,after_data,actor) VALUES (?,?,?,?,?,?,?)",
        [
          crypto.randomUUID(),
          entity,
          data.id,
          new Date().toISOString(),
          old?.data ?? null,
          after,
          "administrador",
        ],
      );
      await db.query(
        `INSERT INTO ${entity} (id,data,revision) VALUES (?,?,?) ON CONFLICT (id) DO UPDATE SET data=excluded.data, revision=excluded.revision`,
        [data.id, after, revision],
      );
      return data;
    });
  });
  writes = task.then(
    () => {},
    () => {},
  );
  return task;
}
export async function audit() {
  return await (
    await database()
  ).query("SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 200");
}
