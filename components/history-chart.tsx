"use client";
import { useState } from "react";
import type { Observation } from "@/lib/validation";
export default function HistoryChart({
  data,
  unit,
}: {
  data: Observation[];
  unit: string;
}) {
  const [selected, setSelected] = useState<Observation | undefined>(
    data.at(-1),
  );
  if (!data.length)
    return (
      <div className="empty chart-empty">
        <span className="empty-chart" aria-hidden="true">
          ▁ ▂ ▃ ▄ ▅
        </span>
        <h3>Aún no hay una serie histórica</h3>
        <p>
          El gráfico aparecerá cuando existan observaciones publicadas para este
          territorio.
        </p>
      </div>
    );
  const min = Math.min(...data.map((d) => d.value)),
    max = Math.max(...data.map((d) => d.value));
  const pad = (max - min) * 0.15 || Math.abs(max) * 0.1 || 1;
  const low = min - pad,
    high = max + pad;
  const x = (index: number) =>
    60 + (data.length === 1 ? 270 : (index * 540) / (data.length - 1));
  const y = (value: number) => 210 - ((value - low) / (high - low)) * 170;
  return (
    <div className="history-chart">
      <p aria-live="polite">
        <strong>
          {selected?.period}: {selected?.value.toLocaleString("es-ES")} {unit}
        </strong>
      </p>
      <svg
        viewBox="0 0 660 260"
        role="group"
        aria-label="Evolución histórica. Tabla de datos disponible a continuación."
      >
        <line x1="60" y1="210" x2="600" y2="210" stroke="#d1d7cb" />
        <text x="4" y="45" fontSize="12">
          {high.toFixed(1)}
        </text>
        <text x="4" y="210" fontSize="12">
          {low.toFixed(1)}
        </text>
        {data.length > 1 && (
          <polyline
            points={data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ")}
            fill="none"
            stroke="#3b7966"
            strokeWidth="2"
          />
        )}
        {data.map((d, i) => (
          <g key={d.id}>
            <circle
              cx={x(i)}
              cy={y(d.value)}
              r="6"
              fill="#3b7966"
              tabIndex={0}
              role="button"
              aria-label={`${d.period}: ${d.value} ${unit}`}
              onMouseEnter={() => setSelected(d)}
              onFocus={() => setSelected(d)}
              onClick={() => setSelected(d)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setSelected(d);
              }}
            />
            <text x={x(i)} y="240" textAnchor="middle" fontSize="12">
              {d.period}
            </text>
          </g>
        ))}
      </svg>
      <p className="muted">
        {data.length === 1
          ? "Una observación no permite describir una tendencia."
          : "Línea entre periodos observados; no se interpolan valores en la tabla."}
      </p>
    </div>
  );
}
