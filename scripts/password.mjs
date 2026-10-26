import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
const rl = createInterface({ input: process.stdin, output: process.stdout });
console.log(
  "Generador local. No compartas la contraseña ni los valores generados.",
);
const password = await rl.question(
  "Contraseña de administrador (mínimo 14 caracteres; entrada visible en esta terminal): ",
);
rl.close();
if (password.length < 14)
  throw new Error("Se requieren al menos 14 caracteres");
const salt = randomBytes(16).toString("hex");
console.log(
  `ADMIN_PASSWORD_HASH=${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
);
console.log(`SESSION_SECRET=${randomBytes(48).toString("hex")}`);
