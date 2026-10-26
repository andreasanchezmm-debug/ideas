import { createHmac, timingSafeEqual, scryptSync } from "node:crypto";
export function configured() {
  return (
    !!process.env.ADMIN_PASSWORD_HASH &&
    (process.env.SESSION_SECRET?.length || 0) >= 32
  );
}
export function passwordMatches(password: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH || "";
  const [salt, key] = hash.split(":");
  if (!salt || !key || !password || password.length > 1024) return false;
  try {
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(key, "hex");
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}
function sign(value: string) {
  return createHmac("sha256", process.env.SESSION_SECRET!)
    .update(value)
    .digest("hex");
}
export function sessionToken() {
  if (!configured()) throw new Error("Administración sin configurar");
  const value = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${value}.${sign(value)}`;
}
export function validSession(token?: string) {
  if (!configured() || !token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) <= Date.now()) return false;
  const expected = Buffer.from(sign(expires));
  const actual = Buffer.from(sig);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}
const attempts = new Map<string, { count: number; until: number }>();
export function allowLogin(ip: string) {
  const now = Date.now();
  if (attempts.size > 10000)
    for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const v = attempts.get(ip);
  if (!v || v.until < now) {
    attempts.set(ip, { count: 1, until: now + 15 * 60 * 1000 });
    return true;
  }
  v.count++;
  return v.count <= 8;
}
