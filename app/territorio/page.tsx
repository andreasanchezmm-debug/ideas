import { catalog, observations, territories } from "@/lib/db";
import TerritoryExplorer from "@/components/territory-explorer";
export const dynamic = "force-dynamic";
export default async function Page() {
  const [indicators, data, areas] = await Promise.all([
    catalog(),
    observations(),
    territories(),
  ]);
  return (
    <div className="page-container">
      <div className="page-title">
        <div className="eyebrow">LECTURAS DEL TERRITORIO</div>
        <h1>El bienestar tiene geografía.</h1>
        <p>
          Explora diferencias entre barrios y secciones censales, cuando existan
          datos a esa escala.
        </p>
      </div>
      <TerritoryExplorer
        indicators={indicators}
        data={data.filter((x) => x.municipalityId === "03014")}
        areas={areas.filter((x) => x.municipalityId === "03014")}
      />
    </div>
  );
}
