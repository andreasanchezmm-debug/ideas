import { initialIndicators } from "./catalog";
import type { Observation } from "./validation";
// Fixtures for the explicitly labelled, standalone demo only. Never seed the database.
const examples: Record<string, number[]> = {
  "01": [23000, 24200, 25100],
  "04": [15.5, 14.2, 13.8],
  "16": [3100, 3020, 2960],
  "20": [134, 129, 126],
  "31": [9.2, 8.9, 8.7],
  "32": [17.8, 17.4, 16.9],
  "36": [24, 22, 21],
  "39": [18, 23, 29],
};
export const demoObservations: Observation[] = Object.entries(examples).flatMap(
  ([id, values]) =>
    values.map((value, index) => ({
      id: `DEMO-${id}-${2022 + index}`,
      indicatorId: id,
      municipalityId: "03014",
      territoryId: null,
      period: String(2022 + index),
      value,
      unit: initialIndicators.find((i) => i.id === id)!.unit,
      sourceName: "FICTICIO — creado exclusivamente para demostrar la interfaz",
      sourceUrl:
        "https://github.com/andreasanchezmm-debug/ideas/blob/main/lib/demo.ts",
      publishedAt: "2026-10-26",
      updatedAt: "2026-10-26",
      methodology:
        "Valores arbitrarios de demostración. No proceden de una fuente estadística y no describen Alicante. No usar para investigación, decisiones o diagnósticos.",
      methodologyVersion: "1.0",
      classification: "simulacion",
      validation: "borrador",
      license: "CC0 — exclusivamente valores ficticios de demostración",
      reuseAllowed: true,
      population: null,
      coverage: "Escenario ficticio; no representa población real",
      uncertainty: "No aplicable: datos inventados para probar la interfaz",
      housingContext: null,
    })),
);
