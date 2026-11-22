import { security } from "../src/infrastructure/security.js";
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { openDatabase } from "../src/infrastructure/database.js";
import { Repository } from "../src/infrastructure/repository.js";
import { Service } from "../src/application/service.js";
import { createApp } from "../src/interfaces/app.js";
let db, repo, service;
beforeEach(() => {
  db = openDatabase(":memory:", true);
  repo = new Repository(db);
  service = new Service(repo, security);
});
afterEach(() => db.close());
const login = (email) => service.login({ email, password: "Florida2026!" });
test("Passwords are salted and sessions are stored as hashes", () => {
  const { user, token } = login("mayra@florida.demo");
  assert.equal(user.role, "seller");
  assert.equal(user.password, undefined);
  assert.equal(service.authenticate(token).id, user.id);
  assert.notEqual(repo.get("SELECT token FROM sessions").token, token);
  assert.throws(
    () => service.login({ email: user.email, password: "wrong" }),
    /incorrectos/,
  );
  assert.equal(service.authenticate("invalid"), null);
});
test("Registration requires consent and cannot grant administrator role", () => {
  const d = {
    name: "Vecino nuevo",
    email: "nuevo@example.com",
    password: "ClaveSegura123",
    phone: "3001234567",
    role: "admin",
    consent: true,
  };
  assert.throws(() => service.register({ ...d, consent: false }), /autorizar/);
  assert.equal(service.register(d).user.role, "buyer");
  assert.throws(() => service.register(d), /registrado/);
});
test("Only owners and administrators can update inventory and products", () => {
  const seller = login("mayra@florida.demo").user,
    buyer = login("vecino@florida.demo").user,
    other = login("luis@florida.demo").user;
  assert.throws(() => service.product({ title: "Hack" }, buyer), /vendedor/);
  assert.throws(() => service.owns(1, other), /modificar/);
  assert.equal(service.owns(1, seller).owner_id, seller.id);
  assert.throws(() => service.owns(999, seller), /encontrada/);
});
test("Product validation rejects negative stock, fractions and external image URLs", () => {
  const user = login("mayra@florida.demo").user;
  const d = {
    title: "Panela",
    description: "Hecha en Florida",
    price: 8000,
    stock: 2,
    category_id: 3,
    image: "/images/panela.jpg",
  };
  assert.throws(() => service.product({ ...d, stock: -1 }, user), /entero/);
  assert.throws(() => service.product({ ...d, price: 1.5 }, user), /entero/);
  assert.throws(
    () => service.product({ ...d, image: "https://evil.example/x.svg" }, user),
    /Imagen/,
  );
  const { id } = service.product(d, user);
  assert.equal(repo.get("SELECT stock FROM products WHERE id=?", id).stock, 2);
  service.product({ ...d, stock: 0 }, user, id);
  assert.equal(repo.get("SELECT stock FROM products WHERE id=?", id).stock, 0);
});
test("Privacy choices apply to public seller and product responses", () => {
  const user = login("mayra@florida.demo").user;
  service.profile({ ...user, show_phone: false, show_sector: false }, user);
  assert.equal(repo.publicUser(user.id).phone, "");
  assert.equal(repo.publicUser(user.id).sector, "");
  assert.equal(repo.products().find((p) => p.owner_id === user.id).sector, "");
  assert.equal(repo.publicUser(user.id).email, undefined);
});
test("Inactive users and categories disappear from catalog and sessions", () => {
  const { token } = login("mayra@florida.demo");
  repo.run("UPDATE users SET active=0 WHERE id=1");
  assert.equal(service.authenticate(token), null);
  assert.ok(repo.products().every((p) => p.owner_id !== 1));
  repo.run("UPDATE categories SET active=0 WHERE id=2");
  assert.ok(repo.products().every((p) => p.category_id !== 2));
});
test("Expired sessions are rejected", () => {
  const { token } = login("mayra@florida.demo");
  repo.run("UPDATE sessions SET expires=0");
  assert.equal(service.authenticate(token), null);
});
test("Deleting product removes its questions through foreign keys", () => {
  assert.ok(repo.get("SELECT id FROM questions WHERE product_id=1"));
  repo.run("DELETE FROM products WHERE id=1");
  assert.equal(
    repo.get("SELECT id FROM questions WHERE product_id=1"),
    undefined,
  );
});
test("HTTP flows enforce auth, owner permissions, persistence and logout", async () => {
  const app = createApp(service, { rateLimits: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function req(path, method = "GET", body, cookie) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  try {
    assert.equal((await req("/my/products")).status, 401);
    const seller = await req("/auth/login", "POST", {
      email: "mayra@florida.demo",
      password: "Florida2026!",
    });
    assert.equal(seller.status, 200);
    assert.ok(seller.cookie.startsWith("fc_session="));
    const buyer = await req("/auth/login", "POST", {
      email: "vecino@florida.demo",
      password: "Florida2026!",
    });
    assert.equal(
      (await req("/products/1/stock", "PATCH", { stock: 0 }, buyer.cookie))
        .status,
      403,
    );
    assert.equal(
      (await req("/products/1/stock", "PATCH", { stock: 0 }, seller.cookie))
        .status,
      200,
    );
    assert.equal((await req("/products/1")).body.stock, 0);
    assert.equal((await req("/admin", "GET", null, seller.cookie)).status, 403);
    assert.equal(
      (await req("/alerts", "POST", { title: "fake" }, buyer.cookie)).status,
      403,
    );
    assert.equal(
      (
        await req(
          "/products/1/questions",
          "POST",
          { body: "¿Hay entrega?" },
          buyer.cookie,
        )
      ).status,
      201,
    );
    const q = repo.get("SELECT * FROM questions ORDER BY id DESC LIMIT 1");
    assert.equal(
      (
        await req(
          `/questions/${q.id}`,
          "PUT",
          { answer: "Claro" },
          buyer.cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await req(
          `/questions/${q.id}`,
          "PUT",
          { answer: "Claro" },
          seller.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (await req("/auth/logout", "POST", {}, seller.cookie)).status,
      200,
    );
    assert.equal(
      (await req("/my/products", "GET", null, seller.cookie)).status,
      401,
    );
  } finally {
    await new Promise((r) => server.close(r));
  }
});
