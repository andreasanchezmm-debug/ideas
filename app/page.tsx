import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  ShieldCheck,
  Download,
  BookOpen,
  MoveUpRight,
  CircleHelp,
} from "lucide-react";
import { catalog, observations } from "@/lib/db";
import { dimensions } from "@/lib/catalog";
import Donut from "@/components/donut";
export const dynamic = "force-dynamic";
export default async function Home() {
  const indicators = (await catalog()).filter((i) => i.active);
  const data = (await observations()).filter(
    (x) => x.municipalityId === "03014",
  );
  const municipal = data.filter(
    (x) => x.municipalityId === "03014" && !x.territoryId,
  );
  const available = new Set(municipal.map((x) => x.indicatorId)).size;
  const latest = [...data]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);
  return (
    <>
      <div className="location-bar">
        <span>
          <MapPin size={14} /> Alicante, España{" "}
          <span className="location-code">03014</span>
        </span>
        <span className="phase">
          <i /> Observatorio en construcción
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> BIENESTAR LOCAL. RESPONSABILIDAD GLOBAL.
          </div>
          <h1>
            Una ciudad para vivir bien.
            <br />
            <em>Dentro de los límites</em>
            <br />
            del planeta.
          </h1>
          <p>
            ¿Cómo vive Alicante? Exploramos el bienestar de las personas y la
            salud de nuestro entorno a través de la Economía del Donut.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/indicadores">
              Explorar indicadores <ArrowRight size={17} />
            </Link>
            <Link className="text-link" href="/metodologia">
              Conoce el modelo <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="trust-line">
            <ShieldCheck size={16} />
            <span>
              Datos verificables · Metodología transparente · Acceso abierto
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-label">
            <span className="tiny-dot" /> EL DONUT DE ALICANTE{" "}
            <span>01 / VISIÓN GENERAL</span>
          </div>
          <Donut indicators={indicators} observations={municipal} />
          <div className="visual-note">
            <CircleHelp size={15} />
            <span>
              Primero, la evidencia. Solo evaluamos cuando hay datos y umbrales
              justificados.
            </span>
          </div>
        </div>
      </section>
      <section className="stats-strip" aria-label="Estado del observatorio">
        <div>
          <strong>{indicators.length}</strong>
          <span>Indicadores en el catálogo</span>
        </div>
        <div>
          <strong>4</strong>
          <span>Dimensiones conectadas</span>
        </div>
        <div>
          <strong>
            {available}
            <small> / {indicators.length}</small>
          </strong>
          <span>Indicadores con datos municipales</span>
        </div>
        <div>
          <strong className="stat-word">
            Abierto <ArrowUpRight size={19} />
          </strong>
          <span>El conocimiento es de todos</span>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">UNA MIRADA COMPLETA</div>
            <h2>La ciudad, desde cuatro perspectivas.</h2>
          </div>
          <p>
            Lo que sucede aquí y lo que nuestro
            <br className="desktop" /> modo de vida provoca en otros lugares.
          </p>
        </div>
        <div className="dimension-grid">
          {dimensions.map((d, i) => {
            const count = indicators.filter((x) => x.dimension === d.id).length;
            const available = new Set(
              municipal
                .filter((o) =>
                  indicators.some(
                    (x) => x.id === o.indicatorId && x.dimension === d.id,
                  ),
                )
                .map((x) => x.indicatorId),
            ).size;
            return (
              <Link
                href={`/indicadores?dimension=${d.id}`}
                className={`dimension-card dim-${d.id}`}
                key={d.id}
              >
                <div className="card-top">
                  <span className="dimension-icon" style={{ color: d.color }}>
                    {d.icon}
                  </span>
                  <span className="card-number">0{i + 1}</span>
                </div>
                <h3>{d.name}</h3>
                <p>{d.description}</p>
                <div className="card-bottom">
                  <span>
                    {count} indicadores{" "}
                    <span className="muted">· {available} disponibles</span>
                  </span>
                  <ArrowUpRight size={19} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="territory-teaser">
        <div className="teaser-art" aria-hidden="true">
          <div className="abstract-map">
            <span>ALICANTE</span>
            <MapPin size={32} />
          </div>
          <div className="map-caption">
            ILUSTRACIÓN CONCEPTUAL · NO CARTOGRÁFICA
          </div>
        </div>
        <div className="teaser-copy">
          <div className="eyebrow">DE LA CIUDAD AL BARRIO</div>
          <h2>
            Una ciudad.
            <br />
            <em>Muchas realidades.</em>
          </h2>
          <p>
            El bienestar no se distribuye por igual. Una mirada territorial nos
            ayuda a comprender las diferencias sin perder el contexto.
          </p>
          <div className="territory-pills">
            <span>Municipio</span>
            <span>Barrios</span>
            <span>Secciones censales</span>
          </div>
          <Link className="text-link" href="/territorio">
            Explorar el territorio <ArrowRight size={17} />
          </Link>
          <small>Delimitaciones oficiales pendientes de incorporación.</small>
        </div>
      </section>
      <section className="section evidence">
        <div>
          <div className="eyebrow">TRANSPARENCIA POR DISEÑO</div>
          <h2>Sin datos, no hay diagnóstico.</h2>
          <p>
            Un espacio en blanco también cuenta una historia. No rellenamos las
            lagunas con cifras inventadas: las hacemos visibles.
          </p>
          <Link className="text-link" href="/metodologia">
            Cómo trabajamos <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="evidence-items">
          <article>
            <ShieldCheck />
            <div>
              <h3>Cada cifra tiene un origen</h3>
              <p>Fuente, periodo, metodología y estado de validación.</p>
            </div>
          </article>
          <article>
            <BookOpen />
            <div>
              <h3>Sin puntuaciones artificiales</h3>
              <p>Los umbrales necesitan una justificación publicada.</p>
            </div>
          </article>
          <article>
            <Download />
            <div>
              <h3>Datos para seguir investigando</h3>
              <p>Descargas en CSV y Excel cuando la licencia lo permita.</p>
            </div>
          </article>
        </div>
      </section>
      <section className="updates">
        <div className="section-heading">
          <div>
            <div className="eyebrow">UN OBSERVATORIO QUE CRECE</div>
            <h2>Últimas actualizaciones</h2>
          </div>
          <Link className="text-link" href="/informes">
            Ver informes <MoveUpRight size={16} />
          </Link>
        </div>
        {latest.length ? (
          latest.map((o) => (
            <div className="update-row" key={o.id}>
              <span>{o.updatedAt}</span>
              <Link href={`/indicadores/${o.indicatorId}`}>
                {indicators.find((i) => i.id === o.indicatorId)?.name}
              </Link>
              <span className="badge">{o.classification}</span>
            </div>
          ))
        ) : (
          <div className="update-row">
            <span className="badge">Puesta en marcha</span>
            <div>
              <strong>El catálogo inicial ya está disponible</strong>
              <p>
                40 definiciones para construir un diagnóstico con evidencia. Aún
                no hay observaciones publicadas.
              </p>
            </div>
            <Link href="/indicadores" aria-label="Consultar catálogo">
              <ArrowUpRight size={22} />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
