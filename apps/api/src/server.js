import { security } from "./infrastructure/security.js";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { openDatabase } from "./infrastructure/database.js";
import { Repository } from "./infrastructure/repository.js";
import { Service } from "./application/service.js";
import { createApp } from "./interfaces/app.js";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const db = openDatabase(
  resolve(root, process.env.DATABASE_PATH || "data/florida.sqlite"),
  process.env.SEED_DEMO !== "false",
);
const app = createApp(new Service(new Repository(db), security), {
  uploadDir: resolve(root, "data/uploads"),
  webDir: resolve(root, "apps/web/dist"),
  secure: process.env.COOKIE_SECURE === "true",
});
const server = app.listen(
  Number(process.env.PORT || 3001),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      `Florida Conecta API: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 3001}`,
    ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
