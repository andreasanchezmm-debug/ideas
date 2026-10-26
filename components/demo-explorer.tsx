"use client";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  Search,
  FlaskConical,
  MapPin,
} from "lucide-react";
import { initialIndicators, dimensions } from "../lib/catalog";
import { demoObservations } from "../lib/demo";
import { csv, columns, safeCell } from "../lib/export";
import Donut from "./donut";
import HistoryChart from "./history-chart";
export default function DemoExplorer() {
  const [query, setQuery] = useState(""),
    [dimension, setDimension] = useState(""),
    [period, setPeriod] = useState("2024"),
    [selected, setSelected] = useState("01"),
    [message, setMessage] = useState("");
  const filtered = initialIndicators.filter(
    (i) =>
      (!dimension || i.dimension === dimension) &&
      `${i.name} ${i.definition}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  const indicator = initialIndicators.find((i) => i.id === selected)!;
  const series = demoObservations.filter((o) => o.indicatorId === selected);
  const observation = series.find((o) => o.period === period);
  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function excel() {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const book = new ExcelJS.Workbook();
      const sheet = book.addWorksheet("FICTICIO — DEMO");
      sheet.addRow([...columns]);
      for (const o of demoObservations)
        sheet.addRow(
          columns.map((k) =>
            typeof o[k] === "number" ? o[k] : safeCell(o[k]),
          ),
        );
      download(
        new Blob([new Uint8Array(await book.xlsx.writeBuffer())]),
        "DEMO-FICTICIO-donut.xlsx",
      );
      setMessage("Excel ficticio descargado. No contiene estadísticas reales.");
    } catch {
      setMessage("No se pudo generar el Excel. Puedes descargar el CSV.");
    }
  }
  return (
    <>
      <aside className="demo-banner" role="note">
        <FlaskConical size={20} />
        <div>
          <strong>DEMO INTERACTIVA · DATOS FICTICIOS</strong>
          <span>
            Los valores son inventados para mostrar el funcionamiento. No
            describen Alicante ni permiten evaluar su sostenibilidad.
          </span>
        </div>
      </aside>
      <header className="header">
        <a className="brand" href="#inicio">
          <span className="brand-ring" />
          <span>
            donut<span className="brand-city">alicante · demo</span>
          </span>
        </a>
        <nav aria-label="Navegación de demostración">
          <a href="#catalogo">Indicadores</a>
          <a href="#ficha">Ficha e histórico</a>
          <a href="#territorio">Territorio</a>
          <a href="#descargas">Descargas</a>
        </nav>
        <a
          className="header-download"
          href="https://github.com/andreasanchezmm-debug/ideas"
          target="_blank"
          rel="noreferrer"
        >
          Ver proyecto <ArrowUpRight size={16} />
        </a>
      </header>
      <main id="contenido">
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <div className="eyebrow">
              VERSIÓN DEMOSTRATIVA · NO ES UN DIAGNÓSTICO
            </div>
            <h1>
              Una ciudad para vivir bien.
              <br />
              <em>Dentro de los límites</em>
              <br />
              del planeta.
            </h1>
            <p>
              Recorre el catálogo de 40 indicadores, cambia de periodo, consulta
              una ficha y descarga los ejemplos. Ocho indicadores tienen series
              ficticias para demostrar la interacción.
            </p>
            <a href="#catalogo" className="button primary">
              Probar los indicadores <ArrowRight size={17} />
            </a>
            <div className="trust-line">
              <FlaskConical size={16} /> Datos de ejemplo separados de la base
              del observatorio.
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-label">
              DONUT DEMOSTRATIVO · SIN EVALUACIÓN
            </div>
            <Donut
              indicators={initialIndicators}
              observations={demoObservations.filter((o) => o.period === period)}
            />
            <p className="visual-note">
              No hay umbrales ni resultados de sostenibilidad. Gris claro: sin
              datos; gris oscuro: ejemplo ficticio sin umbral.
            </p>
          </div>
        </section>
        <div className="stats-strip">
          <div>
            <strong>40</strong>
            <span>Definiciones de indicadores</span>
          </div>
          <div>
            <strong>8</strong>
            <span>Series ficticias de ejemplo</span>
          </div>
          <div>
            <strong>0</strong>
            <span>Datos reales publicados</span>
          </div>
          <div>
            <strong>3</strong>
            <span>Periodos simulados</span>
          </div>
        </div>
        <section className="page-container" id="catalogo">
          <div className="page-title">
            <div className="eyebrow">PRUEBA EL CATÁLOGO</div>
            <h2>Explorar, entender y comprobar.</h2>
            <p>
              Cada tarjeta permite abrir su ficha más abajo. Los valores con la
              etiqueta FICTICIO se han creado solo para esta demo.
            </p>
          </div>
          <div className="filters">
            <label className="search">
              <Search size={18} />
              <input
                aria-label="Buscar indicadores"
                placeholder="Buscar un indicador…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              Periodo de ejemplo
              <select
                aria-label="Periodo de ejemplo"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {["2024", "2023", "2022"].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>
            <label>
              Territorio
              <select aria-label="Territorio">
                <option>Alicante · escenario ficticio municipal</option>
              </select>
            </label>
          </div>
          <div className="tabs" aria-label="Filtrar dimensión">
            <button
              className={!dimension ? "active" : ""}
              onClick={() => setDimension("")}
            >
              Todos · 40
            </button>
            {dimensions.map((d) => (
              <button
                key={d.id}
                className={dimension === d.id ? "active" : ""}
                onClick={() => setDimension(d.id)}
              >
                {d.name}
              </button>
            ))}
          </div>
          <p className="results-line">
            {filtered.length} indicadores · Ninguna cifra de esta demo es un
            dato real.
          </p>
          <div className="indicator-grid">
            {filtered.map((i) => {
              const o = demoObservations.find(
                (o) => o.indicatorId === i.id && o.period === period,
              );
              const dim = dimensions.find((d) => d.id === i.dimension)!;
              return (
                <a
                  className="indicator-card"
                  href="#ficha"
                  key={i.id}
                  onClick={() => setSelected(i.id)}
                >
                  <div className="indicator-meta">
                    <span style={{ color: dim.color }}>{dim.name}</span>
                    <span>{i.id}</span>
                  </div>
                  <h2>{i.name}</h2>
                  <p>{i.definition}</p>
                  <div className="indicator-value">
                    {o ? (
                      <>
                        <strong>{o.value.toLocaleString("es-ES")}</strong>
                        <small>
                          {i.unit} · {period}
                        </small>
                      </>
                    ) : (
                      <span className="missing">Dato no disponible</span>
                    )}
                  </div>
                  <div className="card-bottom">
                    <span className="badge">
                      {o
                        ? "FICTICIO · SIMULACIÓN"
                        : "Sin datos, tampoco de ejemplo"}
                    </span>
                    <ArrowUpRight size={18} />
                  </div>
                </a>
              );
            })}
          </div>
          {!filtered.length && (
            <div className="empty">
              <h3>Sin coincidencias</h3>
              <button
                className="button"
                onClick={() => {
                  setDimension("");
                  setQuery("");
                }}
              >
                Restablecer filtros
              </button>
            </div>
          )}
        </section>
        <section className="page-container demo-detail" id="ficha">
          <div className="eyebrow">FICHA INTERACTIVA · EJEMPLO FICTICIO</div>
          <label className="field">
            Seleccionar indicador
            <select
              aria-label="Seleccionar indicador"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {initialIndicators.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          <h2>{indicator.name}</h2>
          <div className="detail-layout">
            <section>
              <div className="panel value-panel">
                <span>ESCENARIO FICTICIO · {period}</span>
                <h2>
                  {observation
                    ? `${observation.value.toLocaleString("es-ES")} ${observation.unit}`
                    : "Dato no disponible"}
                </h2>
                <span className="badge">
                  {observation
                    ? "FICTICIO · NO ES UN DATO DE ALICANTE"
                    : "Sin observaciones de ejemplo"}
                </span>
                <p>Sin umbral justificado. No se realiza evaluación.</p>
              </div>
              <div className="panel">
                <h2>Evolución ficticia</h2>
                <HistoryChart data={series} unit={indicator.unit} />
                <p className="notice">
                  Valores arbitrarios para probar los gráficos. La tendencia
                  dibujada no tiene significado estadístico.
                </p>
                {series.length > 0 && (
                  <div className="table-scroll">
                    <table>
                      <caption>SIMULACIÓN · Serie ficticia</caption>
                      <thead>
                        <tr>
                          <th>Periodo</th>
                          <th>Valor ficticio</th>
                          <th>Clasificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {series.map((o) => (
                          <tr key={o.id}>
                            <td>{o.period}</td>
                            <td>
                              {o.value} {o.unit}
                            </td>
                            <td>Simulación de interfaz</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
            <aside className="panel">
              <h2>Definición y método</h2>
              <dl>
                <dt>Definición</dt>
                <dd>{indicator.definition}</dd>
                <dt>Unidad</dt>
                <dd>{indicator.unit}</dd>
                <dt>Metodología propuesta</dt>
                <dd>{indicator.methodology}</dd>
                <dt>Origen de los valores de esta demo</dt>
                <dd>
                  Inventados en el archivo lib/demo.ts. Ningún organismo
                  estadístico los ha publicado.
                </dd>
                <dt>Fuente candidata para datos futuros</dt>
                <dd>
                  <a
                    href={indicator.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {indicator.sourceName} ↗
                  </a>
                  <small>
                    Solo referencia para buscar datos reales. No es la fuente de
                    las cifras ficticias.
                  </small>
                </dd>
              </dl>
            </aside>
          </div>
        </section>
        <section className="page-container" id="territorio">
          <div className="eyebrow">TERRITORIO</div>
          <h2>Los barrios necesitan datos propios.</h2>
          <div className="empty">
            <MapPin size={35} />
            <h3>Sin delimitaciones oficiales incorporadas</h3>
            <p>
              La aplicación principal tiene un explorador Leaflet para polígonos
              documentados. Esta demo no inventa barrios, geometrías ni valores
              territoriales.
            </p>
          </div>
        </section>
        <section className="page-container" id="descargas">
          <div className="eyebrow">DESCARGAS DE DEMOSTRACIÓN</div>
          <h2>Prueba los archivos de ejemplo.</h2>
          <div className="notice">
            <strong>Solo contienen datos ficticios.</strong>
            <p>
              Las 24 filas se identifican como simulación e incluyen su
              metodología, procedencia ficticia y limitaciones. No utilizarlas
              como estadísticas.
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="button primary"
              onClick={() =>
                download(
                  new Blob([csv(demoObservations)], {
                    type: "text/csv;charset=utf-8",
                  }),
                  "DEMO-FICTICIO-donut.csv",
                )
              }
            >
              <Download size={16} /> CSV ficticio
            </button>
            <button className="button" onClick={() => void excel()}>
              <Download size={16} /> Excel ficticio
            </button>
          </div>
          <p role="status">{message}</p>
        </section>
        <section className="page-container">
          <h2>Qué incluye el proyecto completo</h2>
          <p>
            La aplicación Next.js del repositorio añade administración con
            autenticación, revisión y publicación, importación CSV/Excel,
            auditoría, informes y persistencia SQLite o PostgreSQL/PostGIS. Esta
            demo estática no ofrece acceso administrativo ni escribe en una base
            de datos.
          </p>
          <a
            className="text-link"
            href="https://github.com/andreasanchezmm-debug/ideas/blob/main/docs/ARQUITECTURA.md"
            target="_blank"
            rel="noreferrer"
          >
            Arquitectura y fases del proyecto ↗
          </a>
        </section>
      </main>
      <footer>
        <div className="footer-bottom">
          <strong>DEMO · Todos los valores son ficticios</strong>
          <a href="https://github.com/andreasanchezmm-debug/ideas">
            Código y documentación ↗
          </a>
        </div>
      </footer>
    </>
  );
}
