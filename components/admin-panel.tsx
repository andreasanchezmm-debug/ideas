"use client";
import { useState, useEffect } from "react";
import {
  LockKeyhole,
  LogOut,
  Plus,
  Upload,
  Save,
  ShieldCheck,
} from "lucide-react";
import { dimensions, initialIndicators } from "@/lib/catalog";
import { parseCsv, normalizeRow } from "@/lib/import";
import { columns } from "@/lib/export";
const names = {
  indicators: "Indicadores",
  observations: "Observaciones",
  territories: "Territorios",
  municipalities: "Municipios",
  reports: "Informes",
  audit: "Historial",
};
type Entity = keyof typeof names;
type RecordData = Record<string, unknown>;
const labels: Record<string, string> = {
  id: "Identificador estable",
  name: "Nombre",
  dimension: "Dimensión",
  unit: "Unidad exacta",
  definition: "Definición",
  methodology: "Metodología",
  sourceName: "Nombre de la fuente",
  sourceUrl: "Enlace original (HTTPS)",
  direction: "Sentido del indicador",
  version: "Versión metodológica",
  threshold: "Umbral (vacío si no está justificado)",
  thresholdCitation: "Justificación y referencia del umbral",
  active: "Indicador activo",
  indicatorId: "Identificador del indicador",
  municipalityId: "Código de municipio",
  territoryId: "Código de territorio (vacío = municipal)",
  period: "Periodo (AAAA o AAAA-MM)",
  value: "Valor observado",
  publishedAt: "Fecha de publicación original",
  updatedAt: "Fecha de actualización",
  methodologyVersion: "Versión del indicador",
  classification: "Tipo de dato",
  validation: "Estado de revisión",
  license: "Licencia documentada",
  reuseAllowed: "Licencia comprobada: permite descarga",
  population: "Población de referencia (opcional)",
  coverage: "Cobertura y población estudiada",
  uncertainty: "Incertidumbre y limitaciones",
  housingContext: "Contexto agregado de vivienda (JSON opcional)",
  province: "Provincia",
  country: "País (código ISO de dos letras)",
  level: "Nivel territorial",
  boundarySource: "Fuente de la delimitación (HTTPS)",
  boundaryLicense: "Licencia del perímetro",
  boundaryVersion: "Versión / fecha del perímetro",
  geojson: "Geometría GeoJSON Polygon o MultiPolygon",
  title: "Título",
  summary: "Resumen",
  content: "Contenido del informe (texto)",
  status: "Estado de publicación",
};
const selectOptions: Record<string, string[]> = {
  dimension: dimensions.map((d) => d.id),
  direction: ["min", "max", "context"],
  classification: ["oficial", "estimacion", "simulacion"],
  validation: ["borrador", "validado", "publicado"],
  level: ["barrio", "seccion"],
  status: ["borrador", "publicado"],
};
function template(entity: Entity): RecordData {
  const date = new Date().toISOString().slice(0, 10);
  if (entity === "indicators")
    return {
      ...initialIndicators[0],
      id: "",
      name: "",
      definition: "",
      methodology: "",
      sourceName: "",
      sourceUrl: "",
    };
  if (entity === "observations")
    return {
      id: "",
      indicatorId: "01",
      municipalityId: "03014",
      territoryId: null,
      period: "",
      value: null,
      unit: "€/hogar/año",
      sourceName: "",
      sourceUrl: "",
      publishedAt: date,
      updatedAt: date,
      methodology: "",
      methodologyVersion: "1.0",
      classification: "oficial",
      validation: "borrador",
      license: "",
      reuseAllowed: false,
      population: null,
      coverage: "",
      uncertainty: "",
      housingContext: null,
    };
  if (entity === "municipalities")
    return { id: "", name: "", province: "", country: "ES" };
  if (entity === "territories")
    return {
      id: "",
      municipalityId: "03014",
      name: "",
      level: "barrio",
      boundarySource: "",
      boundaryLicense: "",
      boundaryVersion: "",
      geojson: null,
      population: null,
    };
  return {
    id: "",
    municipalityId: "03014",
    title: "",
    summary: "",
    content: "",
    sourceUrl: null,
    status: "borrador",
    publishedAt: date,
  };
}
export default function AdminPanel() {
  const [auth, setAuth] = useState(false),
    [configured, setConfigured] = useState(true),
    [password, setPassword] = useState(""),
    [entity, setEntity] = useState<Entity>("indicators"),
    [records, setRecords] = useState<RecordData[]>([]),
    [editing, setEditing] = useState<RecordData | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<RecordData[]>([]),
    [existing, setExisting] = useState(false);
  async function load(target = entity) {
    const response = await fetch(`/api/admin?entity=${target}`);
    const data = await response.json();
    if (response.status === 401) {
      setAuth(false);
      setConfigured(data.configured);
      return;
    }
    if (!response.ok) {
      setMessage("No se pudo cargar la administración");
      return;
    }
    setAuth(true);
    setRecords(Array.isArray(data) ? data : []);
  }
  useEffect(() => {
    void load(entity);
    setEditing(null);
    setPending([]); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [entity]);
  async function post(body: unknown) {
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "No se ha podido completar la operación");
    return result;
  }
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await post({ action: "login", password });
      setPassword("");
      setAuth(true);
      await load();
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = { ...editing };
      for (const key of ["geojson", "housingContext"])
        if (typeof data[key] === "string")
          data[key] = data[key] ? JSON.parse(data[key] as string) : null;
      await post({ action: "save", entity, data });
      setMessage("Registro guardado. Se conserva una entrada en el historial.");
      setEditing(null);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  async function readFile(file: File) {
    setBusy(true);
    setMessage("");
    try {
      if (file.size > 1_500_000)
        throw new Error("El archivo no puede superar 1,5 MB");
      let rows: RecordData[];
      if (file.name.toLowerCase().endsWith(".csv"))
        rows = parseCsv(await file.text());
      else if (file.name.toLowerCase().endsWith(".xlsx")) {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const sheet = workbook.worksheets[0];
        if (!sheet) throw new Error("Libro sin hojas");
        const headers = (sheet.getRow(1).values as unknown[])
          .slice(1)
          .map(String);
        for (const c of columns)
          if (!headers.includes(c)) throw new Error(`Falta la columna ${c}`);
        rows = [];
        sheet.eachRow((row, n) => {
          if (n === 1) return;
          const record: RecordData = {};
          headers.forEach((h, i) => {
            const v = row.getCell(i + 1).value;
            if (typeof v === "object" && v !== null)
              throw new Error("No se admiten fórmulas ni objetos de celda");
            record[h] = v ?? "";
          });
          rows.push(normalizeRow(record));
        });
      } else throw new Error("Utiliza CSV o XLSX");
      if (rows.length > 500) throw new Error("Máximo 500 filas");
      setPending(rows);
      setMessage(
        `${rows.length} filas preparadas. Revisa la vista previa antes de importar. Todas entrarán como borradores.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  if (!auth)
    return (
      <div className="login panel">
        <LockKeyhole size={30} />
        <h2>Acceso de administración</h2>
        <p>
          La consulta pública no requiere registro. Solo los administradores
          pueden incorporar y publicar información.
        </p>
        {!configured && (
          <div className="notice">
            <strong>Acceso pendiente de configuración</strong>
            <p>
              Define ADMIN_PASSWORD_HASH y SESSION_SECRET en el servidor.
              Consulta README.md para generar las credenciales de forma local.
              No existe una contraseña por defecto.
            </p>
          </div>
        )}
        <form onSubmit={login}>
          <label className="field">
            Contraseña
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="button primary" disabled={busy || !configured}>
            <LockKeyhole size={16} /> Entrar
          </button>
        </form>
        <p role="status">{message}</p>
      </div>
    );
  return (
    <>
      <div className="admin-toolbar">
        <div className="tabs">
          {Object.entries(names).map(([k, v]) => (
            <button
              key={k}
              className={k === entity ? "active" : ""}
              onClick={() => setEntity(k as Entity)}
            >
              {v}
            </button>
          ))}
        </div>
        <button
          className="text-link"
          onClick={async () => {
            await post({ action: "logout" });
            setAuth(false);
            setRecords([]);
          }}
        >
          <LogOut size={15} /> Salir
        </button>
      </div>
      <div className="notice">
        <ShieldCheck size={20} />
        <p>
          Solo información agregada. Comprueba fuente, licencia, precisión y
          anonimización antes de validar. Para publicar una observación,
          guárdala primero como validada.
        </p>
      </div>
      <p role="status" className="admin-status">
        {message}
      </p>
      {entity !== "audit" && (
        <button
          className="button primary"
          onClick={() => {
            setEditing(template(entity));
            setExisting(false);
            setMessage("");
          }}
        >
          <Plus size={17} /> Crear{" "}
          {entity === "observations"
            ? "observación"
            : entity === "indicators"
              ? "indicador"
              : "registro"}
        </button>
      )}
      {entity === "observations" && (
        <section className="panel import-panel">
          <h2>Importar CSV o Excel</h2>
          <p>
            Usa los nombres de columna de la plantilla. Fechas como texto
            AAAA-MM-DD, booleanos true/false. Máximo 500 filas. La importación
            devuelve el resultado de cada fila y puede ser parcial.
          </p>
          <a
            className="text-link"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(columns.join(",") + "\n")}`}
            download="plantilla-observaciones.csv"
          >
            Descargar plantilla CSV vacía ↓
          </a>
          <label className="field">
            <Upload size={18} /> Seleccionar archivo
            <input
              type="file"
              accept=".csv,.xlsx"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void readFile(file);
                e.target.value = "";
              }}
            />
          </label>
          {pending.length > 0 && (
            <>
              <details>
                <summary>Vista previa de {pending.length} filas</summary>
                <pre>{JSON.stringify(pending.slice(0, 5), null, 2)}</pre>
              </details>
              <button
                className="button primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const result = await post({
                      action: "import",
                      entity: "observations",
                      rows: pending,
                    });
                    const errors = result.results.filter(
                      (r: { ok: boolean }) => !r.ok,
                    );
                    setMessage(
                      `${result.results.length - errors.length} filas guardadas; ${errors.length} rechazadas. ${errors.map((r: { row: number; error: string }) => `Fila ${r.row}: ${r.error}`).join(" | ")}`,
                    );
                    setPending([]);
                    await load();
                  } catch (e) {
                    setMessage(e instanceof Error ? e.message : "Error");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirmar importación como borrador
              </button>
            </>
          )}
        </section>
      )}
      {editing && (
        <form className="panel admin-form" onSubmit={save}>
          <div className="section-heading">
            <h2>{existing ? "Editar registro" : "Nuevo registro"}</h2>
            <button
              type="button"
              className="text-link"
              onClick={() => setEditing(null)}
            >
              Cerrar ✕
            </button>
          </div>
          <div className="form-grid">
            {Object.entries(editing).map(([key, value]) => {
              const inputValue =
                value === null
                  ? ""
                  : typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value);
              const long = [
                "definition",
                "methodology",
                "thresholdCitation",
                "coverage",
                "uncertainty",
                "content",
                "summary",
                "geojson",
                "housingContext",
              ].includes(key);
              const numeric = ["value", "threshold", "population"].includes(
                key,
              );
              return (
                <label key={key} className={`field ${long ? "full" : ""}`}>
                  {labels[key] || key}
                  {typeof value === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setEditing({ ...editing, [key]: e.target.checked })
                      }
                    />
                  ) : selectOptions[key] ? (
                    <select
                      aria-label={labels[key] || key}
                      value={inputValue}
                      onChange={(e) =>
                        setEditing({ ...editing, [key]: e.target.value })
                      }
                    >
                      {selectOptions[key].map((v) => (
                        <option key={v} value={v}>
                          {dimensions.find((d) => d.id === v)?.name || v}
                        </option>
                      ))}
                    </select>
                  ) : long ? (
                    <textarea
                      rows={key === "geojson" ? 8 : 3}
                      value={inputValue}
                      onChange={(e) =>
                        setEditing({ ...editing, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      type={
                        numeric
                          ? "number"
                          : ["publishedAt", "updatedAt"].includes(key)
                            ? "date"
                            : "text"
                      }
                      step={numeric ? "any" : undefined}
                      value={inputValue}
                      disabled={key === "id" && existing}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          [key]: numeric
                            ? e.target.value === ""
                              ? null
                              : Number(e.target.value)
                            : ["territoryId", "sourceUrl"].includes(key) &&
                                e.target.value === ""
                              ? null
                              : e.target.value,
                        })
                      }
                    />
                  )}
                </label>
              );
            })}
          </div>
          <button className="button primary" disabled={busy}>
            <Save size={17} /> Guardar{" "}
            {editing.validation === "publicado" ? "y publicar" : "registro"}
          </button>
        </form>
      )}
      <div className="panel table-scroll">
        <table>
          <caption>
            {names[entity]} · {records.length} registros
          </caption>
          <thead>
            <tr>
              <th>ID</th>
              <th>{entity === "audit" ? "Cambio" : "Nombre / indicador"}</th>
              <th>Estado / municipio</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, index) => (
              <tr key={String(r.id || index)}>
                <td>{String(r.id)}</td>
                <td>
                  {String(r.name || r.title || r.indicatorId || r.entity || "")}
                </td>
                <td>
                  {String(
                    r.validation ||
                      r.status ||
                      r.municipalityId ||
                      r.changed_at ||
                      "Catálogo",
                  )}
                </td>
                <td>
                  {entity === "audit" ? (
                    <details>
                      <summary>Ver historial</summary>
                      <pre>{JSON.stringify(r, null, 2)}</pre>
                    </details>
                  ) : (
                    <button
                      className="text-link"
                      onClick={() => {
                        setEditing(r);
                        setExisting(true);
                        setMessage("");
                      }}
                    >
                      Editar ↗
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!records.length && <p>No hay registros en esta sección.</p>}
      </div>
    </>
  );
}
