import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative } from "node:path";

const dist = resolve("dist");
const files = await readdir(dist, { recursive: true, withFileTypes: true });
const assets = files
  .filter((f) => f.isFile() && f.name !== "sw.js")
  .map(
    (f) =>
      "/" + relative(dist, resolve(f.parentPath, f.name)).replaceAll("\\", "/"),
  );
const digest = createHash("sha256");
for (const path of assets)
  digest.update(await readFile(resolve(dist, "." + path)));
const version = digest.digest("hex").slice(0, 12);
const source = await readFile("public/sw.js", "utf8");
await writeFile(
  resolve(dist, "sw.js"),
  source
    .replace(/const CACHE = .*?;/, `const CACHE = "florida-${version}";`)
    .replace(
      /const PRECACHE = .*?;/,
      `const PRECACHE = ${JSON.stringify(["/", ...assets.filter((x) => x !== "/index.html")])};`,
    ),
);
console.log(
  `PWA: ${assets.length} recursos preparados para consulta sin conexión.`,
);
