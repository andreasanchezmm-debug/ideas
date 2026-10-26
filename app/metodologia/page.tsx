import Link from "next/link";
import { catalog, observations } from "@/lib/db";
import Donut from "@/components/donut";
import { dimensions } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Page() {
  const indicators = await catalog();
  const data = (await observations()).filter(
    (x) => x.municipalityId === "03014",
  );
  return (
    <div className="page-container">
      <div className="page-title">
        <div className="eyebrow">EL MODELO Y SUS LÍMITES</div>
        <h1>Prosperar sin desbordar el planeta.</h1>
        <p>
          La Economía del Donut, propuesta por Kate Raworth, conecta una base
          social de vida digna con un techo ecológico que protege los sistemas
          de los que dependemos.
        </p>
      </div>
      <div className="method-intro">
        <Donut indicators={indicators} observations={data} />
        <div>
          <h2>Un marco para preguntar mejor.</h2>
          <p>
            El espacio entre la base social y el techo ecológico representa la
            aspiración a una vida segura y justa. Nuestro observatorio organiza
            preguntas sobre Alicante en cuatro perspectivas, sin reducirlas a
            una puntuación única.
          </p>
          <p>
            El anillo muestra el estado de evaluación de los indicadores. No
            representa una distancia proporcional a límites ni una puntuación
            agregada. Cada segmento permite consultar su estado.
          </p>
          <div className="legend-list">
            <span>
              <i className="legend-dot missing" /> Dato no disponible
            </span>
            <span>
              <i className="legend-dot unassessed" /> Dato publicado, sin umbral
              justificado
            </span>
            <span>
              <i className="legend-dot within" /> Cumple el umbral documentado
            </span>
            <span>
              <i className="legend-dot outside" /> Fuera del umbral documentado
            </span>
          </div>
          <a
            className="text-link"
            href="https://doughnuteconomics.org/"
            target="_blank"
            rel="noreferrer"
          >
            Doughnut Economics Action Lab ↗
          </a>
          <p className="muted">
            Proyecto independiente, sin afiliación institucional declarada.
          </p>
        </div>
      </div>
      <div className="two-columns">
        {dimensions.map((d) => (
          <article className="panel" key={d.id}>
            <div className="eyebrow" style={{ color: d.color }}>
              {d.short}
            </div>
            <h2>{d.name}</h2>
            <p>{d.description}</p>
            <Link className="text-link" href={`/indicadores?dimension=${d.id}`}>
              Explorar indicadores ↗
            </Link>
          </article>
        ))}
      </div>
      <section className="prose">
        <h2>Nuestro compromiso con la evidencia</h2>
        <h3>Fuentes antes que cifras</h3>
        <p>
          Cada observación necesita fuente original y enlace, periodo, fechas de
          publicación y actualización, metodología y versión, unidad, cobertura,
          clasificación y estado de validación. Las referencias del catálogo son
          fuentes candidatas: su acceso, licencia y disponibilidad deben
          comprobarse antes de importar datos. No hay consultas automáticas a
          organismos externos.
        </p>
        <h3>Validar antes de publicar</h3>
        <p>
          Los registros entran como borradores. Un administrador comprueba su
          trazabilidad y los marca como validados antes de publicarlos. Las
          correcciones conservan versiones en el historial. Las estimaciones se
          identifican por separado y las simulaciones de desarrollo nunca se
          publican.
        </p>
        <h3>Umbrales con justificación</h3>
        <p>
          No se asignan límites por defecto. Cada umbral exige una referencia
          documentada y se vincula a la versión del indicador. Antes de
          incorporarlo, debe justificarse su escala geográfica, población,
          periodo, unidad y aplicabilidad local. La existencia de un valor de
          referencia no demuestra por sí sola sostenibilidad.
        </p>
        <h3>Territorios y compatibilidad</h3>
        <p>
          Solo se incorporan geometrías con fuente, versión y licencia. Los
          datos municipales no se heredan a barrios. Una serie requiere la misma
          definición, unidad, metodología y cobertura. La base está preparada
          para municipios independientes; la comparación entre ciudades queda
          fuera de esta versión.
        </p>
        <h3>Privacidad y acceso</h3>
        <p>
          Solo se admiten datos agregados. La revisión debe comprobar
          anonimización y riesgo de reidentificación, especialmente en secciones
          censales pequeñas. No deben importarse microdatos personales. El sitio
          público no requiere registro; las sesiones administrativas usan
          cookies HTTP-only y caducan a las ocho horas. No se incorporan
          analítica de terceros ni mapas base externos.
        </p>
        <h3>Descargas responsables</h3>
        <p>
          Las descargas incluyen únicamente observaciones publicadas con
          reutilización autorizada. Cada fila conserva la licencia, metodología
          y origen. No se publican informes de diagnóstico hasta disponer de
          evidencia revisada.
        </p>
      </section>
    </div>
  );
}
