import type { Observation } from "./validation";
export const columns = [
  "id",
  "indicatorId",
  "municipalityId",
  "territoryId",
  "period",
  "value",
  "unit",
  "sourceName",
  "sourceUrl",
  "publishedAt",
  "updatedAt",
  "methodology",
  "methodologyVersion",
  "classification",
  "validation",
  "license",
  "reuseAllowed",
  "population",
  "coverage",
  "uncertainty",
  "housingContext",
] as const;
export function safeCell(value: unknown) {
  if (typeof value === "number") return String(value);
  const s =
    value == null
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return /^[\s]*[=+@-]/.test(s) ? `'${s}` : s;
}
export function csv(rows: Observation[]) {
  return (
    "\uFEFF" +
    [
      columns.join(","),
      ...rows.map((r) =>
        columns
          .map((k) => '"' + safeCell(r[k]).replaceAll('"', '""') + '"')
          .join(","),
      ),
    ].join("\r\n")
  );
}
