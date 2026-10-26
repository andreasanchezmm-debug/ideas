import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  configured,
  passwordMatches,
  validSession,
  sessionToken,
  sameOrigin,
  allowLogin,
} from "@/lib/auth";
import { schemas, type Entity } from "@/lib/validation";
import { list, saveEntity, audit } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function authenticated() {
  return validSession((await cookies()).get("donut-session")?.value);
}
export async function GET(request: Request) {
  if (!(await authenticated()))
    return NextResponse.json(
      { authenticated: false, configured: configured() },
      { status: 401 },
    );
  const entity = new URL(request.url).searchParams.get("entity");
  if (entity === "audit") return NextResponse.json(await audit());
  if (entity && Object.hasOwn(schemas, entity))
    return NextResponse.json(await list(entity as Entity));
  return NextResponse.json({ authenticated: true, configured: true });
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 2_000_000)
    return NextResponse.json({ error: "Máximo 2 MB" }, { status: 413 });
  try {
    const bodyText = await request.text();
    if (bodyText.length > 2_000_000)
      return NextResponse.json({ error: "Máximo 2 MB" }, { status: 413 });
    const body = JSON.parse(bodyText);
    if (body.action === "login") {
      if (!configured())
        return NextResponse.json(
          {
            error:
              "Configura ADMIN_PASSWORD_HASH y SESSION_SECRET en el servidor.",
          },
          { status: 503 },
        );
      if (!allowLogin("admin"))
        return NextResponse.json(
          { error: "Demasiados intentos. Espera 15 minutos." },
          { status: 429 },
        );
      if (typeof body.password !== "string" || !passwordMatches(body.password))
        return NextResponse.json(
          { error: "Credenciales incorrectas" },
          { status: 401 },
        );
      const response = NextResponse.json({ ok: true });
      response.cookies.set("donut-session", sessionToken(), {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production" ||
          new URL(request.url).protocol === "https:",
        sameSite: "strict",
        path: "/",
        maxAge: 28800,
      });
      return response;
    }
    if (!(await authenticated()))
      return NextResponse.json(
        { error: "Autenticación requerida" },
        { status: 401 },
      );
    if (body.action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.delete("donut-session");
      return response;
    }
    if (!Object.hasOwn(schemas, body.entity))
      throw new Error("Entidad desconocida");
    if (body.action === "save")
      return NextResponse.json({
        ok: true,
        data: await saveEntity(body.entity, body.data),
      });
    if (body.action === "import") {
      if (
        body.entity !== "observations" ||
        !Array.isArray(body.rows) ||
        body.rows.length > 500
      )
        throw new Error("Importa un máximo de 500 observaciones");
      const results = [];
      for (const [index, row] of body.rows.entries())
        try {
          await saveEntity("observations", { ...row, validation: "borrador" });
          results.push({ row: index + 2, ok: true });
        } catch (error) {
          results.push({
            row: index + 2,
            ok: false,
            error:
              error instanceof Error ? error.message : "Registro no válido",
          });
        }
      return NextResponse.json({ results });
    }
    throw new Error("Acción desconocida");
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Solicitud no válida" },
      { status: 400 },
    );
  }
}
