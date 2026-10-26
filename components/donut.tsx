"use client";
import { useState } from "react";
import { dimensions, type Indicator } from "@/lib/catalog";
import { evaluation, type Observation } from "@/lib/validation";
export default function Donut({
  indicators,
  observations = [],
}: {
  indicators: Indicator[];
  observations?: Observation[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = indicators.filter((x) => x.active);
  const slice = 360 / active.length;
  const point = (r: number, a: number) => [
    220 + r * Math.cos((a * Math.PI) / 180),
    220 + r * Math.sin((a * Math.PI) / 180),
  ];
  const selectedIndicator = active.find((x) => x.id === selected);
  return (
    <div className="donut-wrap">
      <svg
        viewBox="0 0 440 440"
        className="donut-svg"
        role="group"
        aria-label="Donut de indicadores de Alicante. Selecciona un segmento para conocer su estado."
      >
        <circle
          cx="220"
          cy="220"
          r="173"
          fill="none"
          stroke="#e9ede4"
          strokeWidth="1"
          strokeDasharray="3 5"
        />
        <circle
          cx="220"
          cy="220"
          r="106"
          fill="none"
          stroke="#c9d7c0"
          strokeWidth="1"
        />
        {active.map((item, index) => {
          const start = index * slice - 90 + 0.8,
            end = (index + 1) * slice - 90 - 0.8;
          const [a, b] = point(158, start),
            [c, d] = point(158, end),
            [e, f] = point(115, end),
            [g, h] = point(115, start);
          const obs = observations
            .filter((o) => o.indicatorId === item.id && o.territoryId === null)
            .sort((x, y) => y.period.localeCompare(x.period))[0];
          const result = evaluation(obs, item);
          const dim = dimensions.find((x) => x.id === item.dimension)!;
          const fill =
            result.state === "missing"
              ? "#e1e7dc"
              : result.state === "unassessed"
                ? "#bdc7bd"
                : result.state === "within"
                  ? "#598269"
                  : "#bb704d";
          return (
            <path
              key={item.id}
              d={`M ${a} ${b} A 158 158 0 0 1 ${c} ${d} L ${e} ${f} A 115 115 0 0 0 ${g} ${h} Z`}
              fill={selected === item.id ? dim.color : fill}
              stroke={selected === item.id ? dim.color : "none"}
              strokeWidth="2"
              tabIndex={0}
              role="button"
              aria-label={`${item.name}: ${result.label}`}
              onFocus={() => setSelected(item.id)}
              onMouseEnter={() => setSelected(item.id)}
              onClick={() => setSelected(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(item.id);
                }
              }}
            >
              <title>{`${item.name}: ${result.label}`}</title>
            </path>
          );
        })}
        <text
          x="220"
          y="201"
          textAnchor="middle"
          fill="#52634a"
          fontSize="10"
          letterSpacing="2"
        >
          ESPACIO SEGURO
        </text>
        <text
          x="220"
          y="231"
          textAnchor="middle"
          fill="#233c2d"
          fontFamily="Georgia,serif"
          fontSize="27"
        >
          y justo para
        </text>
        <text
          x="220"
          y="261"
          textAnchor="middle"
          fill="#233c2d"
          fontFamily="Georgia,serif"
          fontSize="27"
        >
          las personas
        </text>
        <text
          x="220"
          y="32"
          textAnchor="middle"
          fill="#71806c"
          fontSize="9"
          letterSpacing="2"
        >
          TECHO ECOLÓGICO
        </text>
        <text
          x="220"
          y="415"
          textAnchor="middle"
          fill="#71806c"
          fontSize="9"
          letterSpacing="2"
        >
          BASE SOCIAL
        </text>
      </svg>
      <div className="donut-tooltip" aria-live="polite">
        {selectedIndicator ? (
          <>
            <strong>{selectedIndicator.name}</strong>
            <span>
              {
                evaluation(
                  observations
                    .filter(
                      (o) =>
                        o.indicatorId === selected && o.territoryId === null,
                    )
                    .sort((a, b) => b.period.localeCompare(a.period))[0],
                  selectedIndicator,
                ).label
              }
            </span>
          </>
        ) : (
          <span>Explora los segmentos del donut</span>
        )}
      </div>
    </div>
  );
}
