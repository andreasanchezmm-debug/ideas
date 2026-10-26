"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { dimensions, type Indicator } from "@/lib/catalog";
import { evaluation, type Observation, type Territory } from "@/lib/validation";
export default function CatalogExplorer({
  indicators,
  data,
  areas,
  initialDimension,
}: {
  indicators: Indicator[];
  data: Observation[];
  areas: Territory[];
  initialDimension: string;
}) {
  const [dimension, setDimension] = useState(initialDimension);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [territory, setTerritory] = useState("municipal");
  const years = [...new Set(data.map((x) => x.period))].sort().reverse();
  const filtered = indicators.filter(
    (i) =>
      i.active &&
      (!dimension || i.dimension === dimension) &&
      `${i.name} ${i.definition}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  return (
    <>
      <div className="filters">
        <label className="search">
          <Search size={18} />
          <input
            placeholder="Buscar un indicador…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar indicadores"
          />
        </label>
        <label>
          Periodo
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Último disponible</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <label>
          Territorio
          <select
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
          >
            <option value="municipal">Alicante · Municipio</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.level}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="tabs" aria-label="Dimensiones">
        <button
          className={!dimension ? "active" : ""}
          onClick={() => setDimension("")}
        >
          Todos <span>{indicators.filter((x) => x.active).length}</span>
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
      <div className="results-line">
        <span>{filtered.length} indicadores</span>
        <span>
          <SlidersHorizontal size={14} /> Sin cifras ficticias. Sin datos
          heredados de otra escala.
        </span>
      </div>
      <div className="indicator-grid">
        {filtered.map((i) => {
          const obs = data
            .filter(
              (x) =>
                x.indicatorId === i.id &&
                (territory === "municipal"
                  ? x.territoryId === null
                  : x.territoryId === territory) &&
                (!year || x.period === year),
            )
            .sort((a, b) => b.period.localeCompare(a.period))[0];
          const state = evaluation(obs, i);
          const d = dimensions.find((d) => d.id === i.dimension)!;
          return (
            <Link
              className="indicator-card"
              href={`/indicadores/${i.id}?territory=${territory}${year ? `&period=${year}` : ""}`}
              key={i.id}
            >
              <div className="indicator-meta">
                <span style={{ color: d.color }}>{d.name}</span>
                <span>{i.id.padStart(2, "0")}</span>
              </div>
              <h2>{i.name}</h2>
              <p>{i.definition}</p>
              <div className="indicator-value">
                {obs ? (
                  <>
                    <strong>
                      {new Intl.NumberFormat("es-ES", {
                        maximumFractionDigits: 2,
                      }).format(obs.value)}
                    </strong>
                    <small>
                      {i.unit} · {obs.period}
                    </small>
                  </>
                ) : (
                  <span className="missing">Dato no disponible</span>
                )}
              </div>
              <div className="card-bottom">
                <span className={`badge ${state.state}`}>{state.label}</span>
                <ArrowUpRight size={18} />
              </div>
            </Link>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="empty">
          <Search />
          <h2>No hay indicadores que coincidan</h2>
          <p>Prueba con otro término o elimina el filtro de dimensión.</p>
          <button
            className="button"
            onClick={() => {
              setQuery("");
              setDimension("");
            }}
          >
            Restablecer filtros
          </button>
        </div>
      )}
    </>
  );
}
