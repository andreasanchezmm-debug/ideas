import { columns } from "./export";
export function parseCsv(text: string): Record<string, unknown>[] {
  text = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const s = text;
    const c = s[i];
    if (c === '"') {
      if (quoted && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted) quoted = false;
      else if (cell === "") quoted = true;
      else throw new Error("Comillas CSV no válidas");
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Comillas sin cerrar");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  if (!rows.length) throw new Error("Archivo vacío");
  const headers = rows.shift()!;
  if (new Set(headers).size !== headers.length)
    throw new Error("Columnas duplicadas");
  for (const key of columns)
    if (!headers.includes(key)) throw new Error(`Falta la columna ${key}`);
  return rows.map((r, index) => {
    if (r.length !== headers.length)
      throw new Error(`Número de columnas incorrecto en fila ${index + 2}`);
    return normalizeRow(Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  });
}
export function normalizeRow(row: Record<string, unknown>) {
  const result = { ...row };
  for (const key of ["value", "population"]) {
    const v = result[key];
    if (key === "population" && (v === "" || v === null || v === undefined))
      result[key] = null;
    else if (v === "" || v === null || v === undefined)
      throw new Error(`Falta ${key}`);
    else result[key] = Number(v);
  }
  result.territoryId = result.territoryId || null;
  if (result.reuseAllowed === "true" || result.reuseAllowed === true)
    result.reuseAllowed = true;
  else if (result.reuseAllowed === "false" || result.reuseAllowed === false)
    result.reuseAllowed = false;
  else throw new Error("reuseAllowed debe ser true o false");
  result.housingContext = result.housingContext
    ? typeof result.housingContext === "string"
      ? JSON.parse(result.housingContext)
      : result.housingContext
    : null;
  result.validation = "borrador";
  return result;
}
