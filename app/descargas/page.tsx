import Link from "next/link";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { observations } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function Page() {
  const count = (await observations()).filter(
    (x) => x.municipalityId === "03014" && x.reuseAllowed,
  ).length;
  return (
    <div className="page-container">
      <div className="page-title">
        <div className="eyebrow">DATOS ABIERTOS · ALICANTE</div>
        <h1>La evidencia, en tus manos.</h1>
        <p>
          Descarga los datos publicados y continúa investigando. Cada registro
          conserva su origen, periodo y metodología.
        </p>
      </div>
      <div className="notice">
        <strong>{count} observaciones disponibles para descargar</strong>
        <p>
          {count
            ? "Solo se incluyen datos publicados cuya licencia permite la reutilización."
            : "Todavía no hay observaciones verificadas publicadas. Puedes descargar la estructura vacía, con sus columnas, sin cifras de demostración."}
        </p>
      </div>
      <div className="two-columns">
        <article className="panel">
          <FileText size={30} />
          <h2>CSV · Formato abierto</h2>
          <p>
            UTF-8, separado por comas. Adecuado para herramientas estadísticas y
            análisis reproducible.
          </p>
          <Link className="button primary" href="/api/data?format=csv">
            <Download size={17} /> Descargar CSV{count ? "" : " vacío"}
          </Link>
        </article>
        <article className="panel">
          <FileSpreadsheet size={30} />
          <h2>Excel · Hoja de cálculo</h2>
          <p>
            Archivo XLSX con las mismas observaciones y campos de trazabilidad
            que el CSV.
          </p>
          <Link className="button primary" href="/api/data?format=xlsx">
            <Download size={17} /> Descargar Excel{count ? "" : " vacío"}
          </Link>
        </article>
      </div>
      <div className="panel">
        <h2>Antes de reutilizar los datos</h2>
        <p>
          Consulta la licencia de cada fila y cita su fuente original. No todas
          las fuentes tienen las mismas condiciones. Las observaciones sin
          permiso de reutilización quedan excluidas de los archivos.
        </p>
        <p>
          Campos incluidos: indicador, municipio, territorio, periodo, valor,
          unidad, fuente y enlace, fechas, metodología y versión, clasificación,
          validación, licencia, cobertura, incertidumbre y contexto de vivienda.
        </p>
        <Link href="/api/data?type=catalog" className="text-link">
          Consultar catálogo de definiciones en JSON ↗
        </Link>
      </div>
    </div>
  );
}
