import Link from "next/link";
import { reports } from "@/lib/db";
import { BookOpen } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function Page() {
  const entries = (await reports()).filter((r) => r.municipalityId === "03014");
  return (
    <div className="page-container">
      <div className="page-title">
        <div className="eyebrow">CONOCIMIENTO COMPARTIDO</div>
        <h1>Informes para comprender y actuar.</h1>
        <p>
          Estudios, análisis y diagnósticos con sus fuentes y limitaciones a la
          vista.
        </p>
      </div>
      {entries.length ? (
        entries.map((r) => (
          <article className="panel report" key={r.id}>
            <span className="eyebrow">ALICANTE · {r.publishedAt}</span>
            <h2>{r.title}</h2>
            <p className="lead">{r.summary}</p>
            <div className="report-content">{r.content}</div>
            <p>
              <Link
                className="text-link"
                href={`/api/data?type=report&id=${r.id}`}
              >
                Descargar informe en texto ↓
              </Link>
            </p>
            {r.sourceUrl && (
              <a
                className="text-link"
                href={r.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                Documentación de referencia ↗
              </a>
            )}
          </article>
        ))
      ) : (
        <div className="empty">
          <BookOpen size={40} strokeWidth={1} />
          <h2>El primer informe empieza con buenos datos.</h2>
          <p>
            Aún no hay estudios publicados. Los futuros informes pasarán por
            revisión antes de aparecer aquí.
          </p>
        </div>
      )}
    </div>
  );
}
