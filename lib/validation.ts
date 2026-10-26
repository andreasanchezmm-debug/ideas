import { z } from "zod";
const url = z
  .url()
  .refine((v) => new URL(v).protocol === "https:", "Se requiere HTTPS");
const text = z.string().trim().min(1).max(8000);
export const indicatorSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
    name: text,
    dimension: z.enum(["social", "ecologia", "global", "justicia"]),
    unit: text,
    definition: text,
    methodology: text,
    sourceName: text,
    sourceUrl: url,
    direction: z.enum(["min", "max", "context"]),
    version: text,
    threshold: z.number().finite().nullable(),
    thresholdCitation: z.string().nullable(),
    active: z.boolean(),
  })
  .refine(
    (x) => x.threshold === null || !!x.thresholdCitation?.trim(),
    "Un umbral requiere justificación y referencia",
  );
export const municipalitySchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  name: text,
  province: text,
  country: z.string().length(2),
});
const position = z
  .array(z.number().finite())
  .min(2)
  .max(3)
  .refine(
    (p) => p[0] >= -180 && p[0] <= 180 && p[1] >= -90 && p[1] <= 90,
    "Coordenadas WGS84 fuera de rango",
  );
const ring = z
  .array(position)
  .min(4)
  .refine(
    (r) => r[0][0] === r.at(-1)![0] && r[0][1] === r.at(-1)![1],
    "El anillo debe estar cerrado",
  );
const polygon = z.array(ring).min(1);
const geometry = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Polygon"), coordinates: polygon }),
  z.object({
    type: z.literal("MultiPolygon"),
    coordinates: z.array(polygon).min(1),
  }),
]);
export const territorySchema = z.object({
  id: text,
  municipalityId: text,
  name: text,
  level: z.enum(["barrio", "seccion"]),
  boundarySource: url,
  boundaryLicense: text,
  boundaryVersion: text,
  geojson: geometry,
  population: z.number().int().positive().nullable(),
});
const date = z.iso.date();
export const observationSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
    indicatorId: text,
    municipalityId: text,
    territoryId: z.string().nullable(),
    period: z.string().regex(/^\d{4}(-\d{2})?$/),
    value: z.number().finite(),
    unit: text,
    sourceName: text,
    sourceUrl: url,
    publishedAt: date,
    updatedAt: date,
    methodology: text,
    methodologyVersion: text,
    classification: z.enum(["oficial", "estimacion", "simulacion"]),
    validation: z.enum(["borrador", "validado", "publicado"]),
    license: text,
    reuseAllowed: z.boolean(),
    population: z.number().int().positive().nullable(),
    coverage: text,
    uncertainty: text,
    housingContext: z
      .object({
        typology: z.enum([
          "unifamiliar",
          "colectiva",
          "mixta",
          "no-disponible",
        ]),
        surfaceDefinition: text,
        residents: text,
        buildingAge: text,
        energyEfficiency: text,
        heatingCooling: text,
        incomeContext: text,
      })
      .nullable(),
  })
  .refine(
    (x) => x.classification !== "simulacion" || x.validation !== "publicado",
    "Las simulaciones no se publican en esta versión",
  )
  .refine(
    (x) => x.publishedAt <= x.updatedAt,
    "La actualización no puede ser anterior a la publicación",
  );
export const reportSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  municipalityId: text,
  title: text,
  summary: text,
  content: text,
  sourceUrl: url.nullable(),
  status: z.enum(["borrador", "publicado"]),
  publishedAt: date,
});
export type Observation = z.infer<typeof observationSchema>;
export type Territory = z.infer<typeof territorySchema>;
export type Report = z.infer<typeof reportSchema>;
export const schemas = {
  indicators: indicatorSchema,
  municipalities: municipalitySchema,
  territories: territorySchema,
  observations: observationSchema,
  reports: reportSchema,
};
export type Entity = keyof typeof schemas;
export function evaluation(
  observation: Observation | undefined,
  indicator: {
    threshold: number | null;
    thresholdCitation: string | null;
    direction: string;
  },
) {
  if (!observation) return { state: "missing", label: "Dato no disponible" };
  if (
    indicator.threshold === null ||
    !indicator.thresholdCitation ||
    indicator.direction === "context"
  )
    return { state: "unassessed", label: "Sin umbral definido" };
  const meets =
    indicator.direction === "min"
      ? observation.value <= indicator.threshold
      : observation.value >= indicator.threshold;
  return {
    state: meets ? "within" : "outside",
    label: meets
      ? "Cumple el umbral documentado"
      : "Fuera del umbral documentado",
  };
}
