import { NextResponse } from "next/server";
import { catalog, observations, territories, reports } from "@/lib/db";
import { csv, columns, safeCell } from "@/lib/export";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  if (type === "catalog") return NextResponse.json(await catalog());
  if (type === "territories") return NextResponse.json(await territories());
  if (type === "reports") return NextResponse.json(await reports());
  if (type === "report") {
    const report = (await reports()).find(
      (r) =>
        r.id === params.get("id") &&
        r.municipalityId === (params.get("city") || "03014"),
    );
    if (!report)
      return NextResponse.json(
        { error: "Informe no disponible" },
        { status: 404 },
      );
    const content = [
      report.title,
      report.publishedAt,
      "",
      report.summary,
      "",
      report.content,
      "",
      report.sourceUrl || "",
    ].join("\n");
    return new Response(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="informe-${report.id}.txt"`,
        "Cache-Control": "no-store",
      },
    });
  }
  let rows = (await observations()).filter(
    (r) => r.municipalityId === (params.get("city") || "03014"),
  );
  for (const [param, key] of [
    ["indicator", "indicatorId"],
    ["period", "period"],
    ["territory", "territoryId"],
  ] as const) {
    const v = params.get(param);
    if (v)
      rows = rows.filter((r) =>
        key === "territoryId" && v === "municipal"
          ? r[key] === null
          : r[key] === v,
      );
  }
  const format = params.get("format");
  if (format) {
    rows = rows.filter((r) => r.reuseAllowed);
    if (format === "csv")
      return new Response(csv(rows), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="alicante-datos.csv"',
          "Cache-Control": "no-store",
        },
      });
    if (format === "xlsx") {
      const ExcelJS = (await import("exceljs")).default;
      const book = new ExcelJS.Workbook();
      const sheet = book.addWorksheet("Datos publicados");
      sheet.addRow([...columns]);
      rows.forEach((r) =>
        sheet.addRow(
          columns.map((k) =>
            typeof r[k] === "number" ? r[k] : safeCell(r[k]),
          ),
        ),
      );
      sheet.getRow(1).font = { bold: true };
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      return new Response(new Uint8Array(await book.xlsx.writeBuffer()), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="alicante-datos.xlsx"',
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json(
      { error: "Formato no compatible" },
      { status: 400 },
    );
  }
  return NextResponse.json(rows);
}
