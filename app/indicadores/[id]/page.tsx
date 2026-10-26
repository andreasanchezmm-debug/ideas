import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Download } from "lucide-react";
import { catalog, observations, territories } from "@/lib/db";
import { dimensions } from "@/lib/catalog";
import { evaluation } from "@/lib/validation";
import HistoryChart from "@/components/history-chart";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ territory?: string; period?: string }>;
}) {
  const { id } = await params;
  const filter = await searchParams;
  const indicator = (await catalog()).find((x) => x.id === id && x.active);
  if (!indicator) notFound();
  const area =
    filter.territory && filter.territory !== "municipal"
      ? (await territories()).find(
          (t) => t.id === filter.territory && t.municipalityId === "03014",
        )
      : null;
  if (filter.territory && filter.territory !== "municipal" && !area) notFound();
  const series = (await observations())
    .filter(
      (x) =>
        x.indicatorId === id &&
        x.municipalityId === "03014" &&
        x.territoryId === (area?.id ?? null),
    )
    .sort((a, b) => a.period.localeCompare(b.period));
  const latest = filter.period
    ? series.find((x) => x.period === filter.period)
    : series.at(-1);
  const result = evaluation(latest, indicator);
  const dim = dimensions.find((x) => x.id === indicator.dimension)!;
  return (
    <div className="page-container detail">
      <Link className="text-link" href="/indicadores">
        <ArrowLeft size={16} /> Volver a indicadores
      </Link>
      <div className="page-title">
        <div className="eyebrow">
          {dim.name.toUpperCase()} · INDICADOR {id}
        </div>
        <h1>{indicator.name}</h1>
        <p>{indicator.definition}</p>
      </div>
      <div className="detail-layout">
        <section>
          <div className="panel value-panel">
            <span>
              {area?.name || "Alicante · Municipio"}
              {latest ? ` · ${latest.period}` : ""}
            </span>
            <h2>
              {latest
                ? `${latest.value.toLocaleString("es-ES")} ${indicator.unit}`
                : "Dato no disponible"}
            </h2>
            <span className={`badge ${result.state}`}>{result.label}</span>
            <p>
              {latest
                ? `${latest.classification === "oficial" ? "Dato oficial" : "Estimación"} · Validado y publicado`
                : "No se ha publicado ninguna observación para esta selección."}
            </p>
          </div>
          <div className="panel">
            <h2>Evolución en el tiempo</h2>
            <HistoryChart data={series} unit={indicator.unit} />
          </div>
          <div className="panel">
            <h2>Datos y trazabilidad</h2>
            {series.length ? (
              <div className="table-scroll">
                <table>
                  <caption>
                    Serie publicada · {area?.name || "Municipio"}
                  </caption>
                  <thead>
                    <tr>
                      <th>Periodo</th>
                      <th>Valor</th>
                      <th>Tipo</th>
                      <th>Fuente</th>
                      <th>Actualización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((o) => (
                      <tr key={o.id}>
                        <td>{o.period}</td>
                        <td>
                          {o.value} {o.unit}
                        </td>
                        <td>{o.classification}</td>
                        <td>
                          <a
                            href={o.sourceUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {o.sourceName} ↗
                          </a>
                        </td>
                        <td>{o.updatedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>
                No hay datos publicados. Nunca se completan los vacíos con
                estimaciones no documentadas.
              </p>
            )}
            <Link
              className="text-link"
              href={`/api/data?format=csv&indicator=${id}&territory=${area?.id || "municipal"}${filter.period ? `&period=${filter.period}` : ""}`}
            >
              <Download size={16} /> Descargar CSV de esta selección
            </Link>
          </div>
          {latest && (
            <div className="panel">
              <h2>Contexto del dato seleccionado</h2>
              <dl>
                <dt>Metodología aplicada</dt>
                <dd>
                  {latest.methodology} · v{latest.methodologyVersion}
                </dd>
                <dt>Cobertura e incertidumbre</dt>
                <dd>
                  {latest.coverage} · {latest.uncertainty}
                </dd>
                <dt>Publicación original</dt>
                <dd>{latest.publishedAt}</dd>
                <dt>Reutilización</dt>
                <dd>
                  {latest.license} ·{" "}
                  {latest.reuseAllowed
                    ? "Descarga autorizada"
                    : "Descarga no autorizada"}
                </dd>
                <dt>Contexto de vivienda</dt>
                <dd>
                  {latest.housingContext
                    ? Object.entries(latest.housingContext)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")
                    : "No disponible. No inferir pobreza energética a partir de bajo consumo."}
                </dd>
              </dl>
            </div>
          )}
        </section>
        <aside>
          <div className="panel">
            <h2>Cómo se mide</h2>
            <dl>
              <dt>Unidad</dt>
              <dd>{indicator.unit}</dd>
              <dt>Definición metodológica · v{indicator.version}</dt>
              <dd>{indicator.methodology}</dd>
              <dt>Fuente candidata</dt>
              <dd>
                <a href={indicator.sourceUrl} target="_blank" rel="noreferrer">
                  {indicator.sourceName} <ExternalLink size={12} />
                </a>
                <small>
                  Referencia para localizar datos. No implica disponibilidad
                  municipal ni licencia comprobada.
                </small>
              </dd>
              <dt>Umbral de evaluación</dt>
              <dd>
                {indicator.threshold === null
                  ? "Sin umbral definido"
                  : `${indicator.threshold} ${indicator.unit} · ${indicator.thresholdCitation}`}
              </dd>
            </dl>
          </div>
          <div className="notice">
            <strong>La escala importa</strong>
            <p>
              Un dato municipal no describe cada barrio. Solo se muestran
              observaciones del territorio seleccionado.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
