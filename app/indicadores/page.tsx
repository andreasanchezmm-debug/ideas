import { catalog, observations, territories } from "@/lib/db";
import CatalogExplorer from "@/components/catalog-explorer";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ dimension?: string }>;
}) {
  const p = await searchParams;
  const [indicators, data, areas] = await Promise.all([
    catalog(),
    observations(),
    territories(),
  ]);
  return (
    <div className="page-container">
      <div className="page-title">
        <div className="eyebrow">EXPLORA LA EVIDENCIA · ALICANTE</div>
        <h1>Indicadores para entender la ciudad.</h1>
        <p>
          Un catálogo compartido. Cada indicador, con su contexto, su fuente y
          sus límites.
        </p>
      </div>
      <CatalogExplorer
        indicators={indicators}
        data={data.filter((x) => x.municipalityId === "03014")}
        areas={areas.filter((x) => x.municipalityId === "03014")}
        initialDimension={p.dimension || ""}
      />
    </div>
  );
}
