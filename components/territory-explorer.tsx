"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Layers, Info } from "lucide-react";
import type { Indicator } from "@/lib/catalog";
import type { Territory, Observation } from "@/lib/validation";
import type { Map as LeafletMap } from "leaflet";
export default function TerritoryExplorer({
  areas,
  indicators,
  data,
}: {
  areas: Territory[];
  indicators: Indicator[];
  data: Observation[];
}) {
  const [level, setLevel] = useState("barrio");
  const [indicatorId, setIndicator] = useState(indicators[0]?.id || "01");
  const [period, setPeriod] = useState("");
  const [selected, setSelected] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const available = areas.filter((a) => a.level === level);
  const years = [
    ...new Set(
      data.filter((o) => o.indicatorId === indicatorId).map((o) => o.period),
    ),
  ]
    .sort()
    .reverse();
  const chosen = period || years[0] || "";
  const observations = data.filter(
    (o) => o.indicatorId === indicatorId && o.period === chosen,
  );
  const values = observations
    .filter((o) => available.some((a) => a.id === o.territoryId))
    .map((o) => o.value);
  const min = Math.min(...values),
    max = Math.max(...values);
  const indicator = indicators.find((i) => i.id === indicatorId);
  const obs = observations.find((o) => o.territoryId === selected);
  const area = areas.find((a) => a.id === selected);
  useEffect(() => {
    let cancelled = false;
    async function draw() {
      if (!ref.current || !available.length) return;
      const L = await import("leaflet");
      if (cancelled || !ref.current) return;
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      const instance = L.map(ref.current, { scrollWheelZoom: false }).setView(
        [38.345, -0.481],
        12,
      );
      map.current = instance;
      const layer = L.geoJSON(
        available.map((a) => ({
          type: "Feature",
          properties: { id: a.id, name: a.name },
          geometry: a.geojson,
        })) as GeoJSON.Feature[],
        {
          style: (f) => {
            const o = observations.find(
              (o) => o.territoryId === f?.properties.id,
            );
            return {
              color: "#fafbf7",
              weight: 2,
              fillColor: o
                ? max === min
                  ? "#639783"
                  : o.value < min + (max - min) / 3
                    ? "#c9dfd3"
                    : o.value < min + (2 * (max - min)) / 3
                      ? "#8eb5a2"
                      : "#3d7963"
                : "#dadfd9",
              fillOpacity: 0.85,
            };
          },
          onEachFeature: (f, l) => {
            const label = document.createElement("span");
            label.textContent = String(f.properties.name);
            l.bindTooltip(label);
            l.on("click", () => setSelected(f.properties.id));
          },
        },
      ).addTo(instance);
      if (layer.getBounds().isValid())
        instance.fitBounds(layer.getBounds(), { padding: [20, 20] });
    }
    void draw();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // redraw only when the selected metric, period or geography changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, indicatorId, period, areas, data]);
  return (
    <>
      <div className="filters">
        <label>
          Nivel territorial
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              setSelected("");
            }}
          >
            <option value="barrio">Barrios</option>
            <option value="seccion">Secciones censales</option>
          </select>
        </label>
        <label>
          Indicador
          <select
            value={indicatorId}
            onChange={(e) => {
              setIndicator(e.target.value);
              setPeriod("");
            }}
          >
            {indicators
              .filter((i) => i.active)
              .map((i) => (
                <option value={i.id} key={i.id}>
                  {i.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Periodo
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">Último periodo disponible</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="map-layout">
        <section className="map-panel">
          {available.length ? (
            <>
              <div
                ref={ref}
                className="leaflet-container-real"
                aria-label="Mapa de delimitaciones importadas de Alicante"
              />
              <div className="map-legend">
                <span>
                  <i style={{ background: "#dadfd9" }} /> Sin datos
                </span>
                {values.length > 0 && (
                  <span>
                    <i style={{ background: "#3d7963" }} /> Intensidad relativa:{" "}
                    {min.toLocaleString("es-ES")} –{" "}
                    {max.toLocaleString("es-ES")} {indicator?.unit}
                  </span>
                )}
                <small>Escala descriptiva, no evaluación del donut.</small>
              </div>
            </>
          ) : (
            <div className="empty map-empty">
              <div className="empty-map-icon">
                <Layers size={42} strokeWidth={1} />
              </div>
              <span className="eyebrow">
                ALICANTE ·{" "}
                {level === "barrio" ? "BARRIOS" : "SECCIONES CENSALES"}
              </span>
              <h2>Primero, un mapa con garantías.</h2>
              <p>
                Aún no se han incorporado delimitaciones oficiales o
                documentadas. No dibujamos territorios aproximados ni asignamos
                datos municipales a barrios.
              </p>
              <Link href="/metodologia" className="text-link">
                Consultar los criterios territoriales ↗
              </Link>
            </div>
          )}
        </section>
        <aside className="panel">
          <div className="eyebrow">CONSULTA TERRITORIAL</div>
          <h2>{area?.name || "Selecciona un territorio"}</h2>
          <label className="field">
            Selección accesible
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {available.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <p>{indicator?.name}</p>
          <h3>
            {obs
              ? `${obs.value.toLocaleString("es-ES")} ${obs.unit}`
              : "Dato no disponible"}
          </h3>
          {obs && (
            <p>
              {obs.period} · {obs.classification}
              <br />
              <a href={obs.sourceUrl} target="_blank" rel="noreferrer">
                {obs.sourceName} ↗
              </a>
            </p>
          )}
          {area && (
            <dl>
              <dt>Delimitación</dt>
              <dd>
                <a href={area.boundarySource} target="_blank" rel="noreferrer">
                  Fuente del perímetro ↗
                </a>
              </dd>
              <dt>Versión y licencia</dt>
              <dd>
                {area.boundaryVersion} · {area.boundaryLicense}
              </dd>
            </dl>
          )}
          <div className="notice">
            <Info size={18} />
            <p>
              El gris indica ausencia de datos, nunca un resultado favorable.
            </p>
          </div>
        </aside>
      </div>
      <div className="panel">
        <h2>Vivienda, consumo y condiciones de vida</h2>
        <p>
          El modelo admite contexto agregado de tipología, superficie,
          residentes, antigüedad, eficiencia energética, climatización y renta
          en cada observación. Estas variables deben tener la misma cobertura
          territorial y temporal antes de analizarlas juntas.
        </p>
        <p className="muted">
          No se admiten direcciones particulares ni registros de hogares
          identificables. El bajo consumo, por sí solo, no demuestra eficiencia
          ni bienestar.
        </p>
      </div>
    </>
  );
}
