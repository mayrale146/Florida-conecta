import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, unlinkSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { AppError, required, integer } from "../domain/errors.js";

export function createApp(
  service,
  { uploadDir, webDir, secure = false, rateLimits = true } = {},
) {
  const app = express(),
    repo = service.repo;
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "img-src": ["'self'", "data:", "blob:"],
          "script-src": ["'self'"],
          "connect-src": ["'self'"],
          "upgrade-insecure-requests": secure ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", (req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers["sec-fetch-site"] === "cross-site"
    )
      return res
        .status(403)
        .json({ error: "Solicitud de otro sitio rechazada." });
    const cookie = req.headers.cookie
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("fc_session="));
    req.sessionToken = cookie?.slice(11);
    req.user = service.authenticate(req.sessionToken);
    next();
  });
  const auth = (req, res, next) =>
    req.user
      ? next()
      : next(new AppError("Inicia sesión para continuar.", 401));
  const admin = (req, res, next) =>
    req.user?.role === "admin"
      ? next()
      : next(
          new AppError("Solo administración puede realizar esta acción.", 403),
        );
  if (rateLimits)
    app.use(
      "/api/auth",
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 30,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { error: "Demasiados intentos. Intenta más tarde." },
      }),
    );
  const signIn = (method) => (req, res) => {
    const { token, user } = service[method](req.body);
    res
      .cookie("fc_session", token, {
        httpOnly: true,
        sameSite: "strict",
        secure,
        maxAge: 7 * 86400000,
        path: "/",
      })
      .json({ user });
  };
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.post("/api/auth/register", signIn("register"));
  app.post("/api/auth/login", signIn("login"));
  app.post("/api/auth/logout", (req, res) => {
    service.logout(req.sessionToken);
    res.clearCookie("fc_session", { path: "/" }).json({ ok: true });
  });
  app.get("/api/auth/me", (req, res) => res.json({ user: req.user }));
  app.put("/api/profile", auth, (req, res) =>
    res.json({ user: service.profile(req.body, req.user) }),
  );
  app.get("/api/categories", (req, res) =>
    res.json(repo.all("SELECT * FROM categories WHERE active=1")),
  );
  app.get("/api/products", (req, res) => res.json(repo.products()));
  app.get("/api/products/:id", (req, res) => {
    const product = repo.products().find((p) => p.id === Number(req.params.id));
    if (!product) throw new AppError("Producto no encontrado.", 404);
    res.json({
      ...product,
      seller: repo.publicUser(product.owner_id),
      questions: repo.all(
        "SELECT q.*,u.name FROM questions q JOIN users u ON u.id=q.user_id WHERE product_id=? ORDER BY q.id DESC",
        product.id,
      ),
    });
  });
  app.post("/api/products", auth, (req, res) =>
    res.status(201).json(service.product(req.body, req.user)),
  );
  app.put("/api/products/:id", auth, (req, res) =>
    res.json(service.product(req.body, req.user, Number(req.params.id))),
  );
  app.patch("/api/products/:id/stock", auth, (req, res) => {
    service.owns(Number(req.params.id), req.user);
    const stock = integer(req.body.stock, "Unidades", 100000);
    repo.run("UPDATE products SET stock=? WHERE id=?", stock, req.params.id);
    res.json({ stock });
  });
  app.delete("/api/products/:id", auth, (req, res) => {
    service.owns(Number(req.params.id), req.user);
    repo.run("DELETE FROM products WHERE id=?", req.params.id);
    res.json({ ok: true });
  });
  app.get("/api/business/:id", (req, res) => {
    const user = repo.publicUser(req.params.id);
    if (!user) throw new AppError("Negocio no encontrado.", 404);
    res.json({
      ...user,
      products: repo.products().filter((p) => p.owner_id === user.id),
    });
  });
  app.get("/api/my/products", auth, (req, res) =>
    res.json(
      repo.all(
        "SELECT p.*,c.name AS category FROM products p JOIN categories c ON c.id=p.category_id WHERE owner_id=? ORDER BY id DESC",
        req.user.id,
      ),
    ),
  );
  app.get("/api/my/questions", auth, (req, res) =>
    res.json(
      repo.all(
        "SELECT q.*,p.title,u.name FROM questions q JOIN products p ON p.id=q.product_id JOIN users u ON u.id=q.user_id WHERE p.owner_id=? ORDER BY q.id DESC",
        req.user.id,
      ),
    ),
  );
  app.post("/api/products/:id/questions", auth, (req, res) => {
    if (!repo.products().some((p) => p.id === Number(req.params.id)))
      throw new AppError("Producto no encontrado.", 404);
    repo.run(
      "INSERT INTO questions(product_id,user_id,body) VALUES(?,?,?)",
      req.params.id,
      req.user.id,
      required(req.body.body, "Pregunta", 500),
    );
    res.status(201).json({ ok: true });
  });
  app.put("/api/questions/:id", auth, (req, res) => {
    const q = repo.get("SELECT * FROM questions WHERE id=?", req.params.id);
    if (!q) throw new AppError("Pregunta no encontrada.", 404);
    service.owns(q.product_id, req.user);
    repo.run(
      "UPDATE questions SET answer=? WHERE id=?",
      required(req.body.answer, "Respuesta", 1000),
      q.id,
    );
    res.json({ ok: true });
  });
  app.get("/api/events", (req, res) =>
    res.json(repo.all("SELECT * FROM events ORDER BY date,time")),
  );
  app.post("/api/events", auth, (req, res) => {
    const d = req.body,
      date = required(d.date, "Fecha", 10),
      time = required(d.time, "Hora", 5);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    )
      throw new AppError("Fecha u hora inválida.");
    repo.run(
      "INSERT INTO events(user_id,title,date,time,place,organizer) VALUES(?,?,?,?,?,?)",
      req.user.id,
      required(d.title, "Título", 150),
      date,
      time,
      required(d.place, "Lugar", 150),
      required(d.organizer, "Organiza", 150),
    );
    res.status(201).json({ ok: true });
  });
  app.get("/api/alerts", (req, res) =>
    res.json(repo.all("SELECT * FROM alerts ORDER BY id DESC")),
  );
  app.post("/api/alerts", auth, admin, (req, res) => {
    const d = req.body;
    if (!["Servicios", "Comunidad", "Tránsito"].includes(d.category))
      throw new AppError("Categoría inválida.");
    repo.run(
      "INSERT INTO alerts(user_id,category,title,body) VALUES(?,?,?,?)",
      req.user.id,
      d.category,
      required(d.title, "Título", 150),
      required(d.body, "Mensaje", 2000),
    );
    res.status(201).json({ ok: true });
  });
  app.get("/api/admin", auth, admin, (req, res) =>
    res.json({
      users: repo.all("SELECT id,name,email,role,active FROM users"),
      categories: repo.all("SELECT * FROM categories"),
      products: repo.products(),
      events: repo.all("SELECT * FROM events"),
      alerts: repo.all("SELECT * FROM alerts"),
    }),
  );
  app.patch("/api/admin/users/:id", auth, admin, (req, res) => {
    if (Number(req.params.id) === req.user.id)
      throw new AppError("No puedes desactivar tu propia cuenta.");
    if (!repo.get("SELECT id FROM users WHERE id=?", req.params.id))
      throw new AppError("Usuario no encontrado.", 404);
    repo.run(
      "UPDATE users SET active=? WHERE id=?",
      req.body.active ? 1 : 0,
      req.params.id,
    );
    res.json({ ok: true });
  });
  app.patch("/api/admin/categories/:id", auth, admin, (req, res) => {
    repo.run(
      "UPDATE categories SET active=? WHERE id=?",
      req.body.active ? 1 : 0,
      req.params.id,
    );
    res.json({ ok: true });
  });
  app.post("/api/admin/categories", auth, admin, (req, res) => {
    const name = required(req.body.name, "Categoría", 60);
    if (repo.get("SELECT id FROM categories WHERE name=?", name))
      throw new AppError("La categoría ya existe.", 409);
    repo.run("INSERT INTO categories(name) VALUES(?)", name);
    res.status(201).json({ ok: true });
  });
  app.delete("/api/admin/content/:kind/:id", auth, admin, (req, res) => {
    const table = { products: "products", events: "events", alerts: "alerts" }[
      req.params.kind
    ];
    if (!table) throw new AppError("Contenido inválido.");
    repo.run(`DELETE FROM ${table} WHERE id=?`, req.params.id);
    res.json({ ok: true });
  });
  if (uploadDir) {
    mkdirSync(uploadDir, { recursive: true });
    const upload = multer({
      dest: uploadDir,
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    });
    app.post(
      "/api/uploads",
      auth,
      (req, res, next) => {
        if (!["seller", "admin"].includes(req.user.role))
          return next(new AppError("Necesitas una cuenta de vendedor.", 403));
        next();
      },
      upload.single("image"),
      async (req, res) => {
        if (!req.file) throw new AppError("Selecciona una imagen.");
        const bytes = readFileSync(req.file.path),
          jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
          png = bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
          webp =
            bytes.toString("ascii", 0, 4) === "RIFF" &&
            bytes.toString("ascii", 8, 12) === "WEBP";
        if (!jpg && !png && !webp) {
          unlinkSync(req.file.path);
          throw new AppError("Solo se permiten imágenes JPG, PNG o WebP.");
        }
        const { renameSync } = await import("node:fs");
        const name = `${randomUUID()}.${jpg ? "jpg" : png ? "png" : "webp"}`;
        renameSync(req.file.path, resolve(uploadDir, name));
        res.status(201).json({ url: `/uploads/${name}` });
      },
    );
    app.use(
      "/uploads",
      express.static(uploadDir, { maxAge: "7d", immutable: true }),
    );
  }
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "Ruta no encontrada." }),
  );
  if (webDir && existsSync(resolve(webDir, "index.html"))) {
    app.use(express.static(webDir));
    app.get("/{*path}", (req, res) =>
      res.sendFile(resolve(webDir, "index.html")),
    );
  }
  app.use((error, req, res, next) => {
    if (error.status >= 500 || !error.status) console.error(error);
    res
      .status(error.code === "LIMIT_FILE_SIZE" ? 400 : error.status || 500)
      .json({
        error:
          error.code === "LIMIT_FILE_SIZE"
            ? "La imagen supera 5 MB."
            : error.status && error.status < 500
              ? error.message
              : "No pudimos completar la solicitud. Intenta nuevamente.",
      });
  });
  return app;
}
