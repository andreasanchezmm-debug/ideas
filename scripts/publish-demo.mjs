import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
const gitDir = execFileSync("git", ["rev-parse", "--absolute-git-dir"], {
  encoding: "utf8",
}).trim();
const dist = path.join(root, "demo-dist");
if (!existsSync(path.join(dist, "index.html")))
  throw new Error("Ejecuta npm run demo:build antes de publicar");
const temporary = mkdtempSync(path.join(tmpdir(), "donut-demo-index-"));
const env = { ...process.env, GIT_INDEX_FILE: path.join(temporary, "index") };
function git(args, input) {
  return execFileSync("git", args, {
    cwd: root,
    env,
    encoding: "utf8",
    input,
  }).trim();
}
try {
  const remote = git(["ls-remote", "origin", "refs/heads/gh-pages"]);
  const parent = remote ? remote.split(/\s+/)[0] : null;
  if (parent) git(["fetch", "origin", "gh-pages"]);
  writeFileSync(path.join(dist, ".nojekyll"), "");
  const args = [`--git-dir=${gitDir}`, `--work-tree=${dist}`];
  execFileSync("git", [...args, "read-tree", "--empty"], { cwd: dist, env });
  execFileSync("git", [...args, "add", "--all"], { cwd: dist, env });
  const tree = execFileSync("git", [...args, "write-tree"], {
    cwd: dist,
    env,
    encoding: "utf8",
  }).trim();
  const commit = git([
    "commit-tree",
    tree,
    ...(parent ? ["-p", parent] : []),
    "-m",
    "Publicar demo interactiva con valores explícitamente ficticios",
  ]);
  execFileSync("git", ["push", "origin", `${commit}:refs/heads/gh-pages`], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  console.log(
    "Rama gh-pages actualizada. Esto no confirma que GitHub Pages esté activado.",
  );
  console.log(
    "Configuración: https://github.com/andreasanchezmm-debug/ideas/settings/pages",
  );
  console.log(
    "URL prevista tras activar Pages: https://andreasanchezmm-debug.github.io/ideas/",
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
