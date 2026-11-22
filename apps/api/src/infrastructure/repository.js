export class Repository {
  constructor(db) {
    this.db = db;
  }
  get(sql, ...args) {
    return this.db.prepare(sql).get(...args);
  }
  all(sql, ...args) {
    return this.db.prepare(sql).all(...args);
  }
  run(sql, ...args) {
    return this.db.prepare(sql).run(...args);
  }
  userByEmail(email) {
    return this.get("SELECT * FROM users WHERE email=?", email);
  }
  userById(id) {
    return this.get("SELECT * FROM users WHERE id=?", id);
  }
  createUser(u) {
    return Number(
      this.run(
        "INSERT INTO users(name,email,password,role,phone,business) VALUES(?,?,?,?,?,?)",
        u.name,
        u.email,
        u.password,
        u.role,
        u.phone,
        u.business,
      ).lastInsertRowid,
    );
  }
  createSession(token, id, expires) {
    this.run("DELETE FROM sessions WHERE expires < ?", Date.now());
    this.run(
      "INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)",
      token,
      id,
      expires,
    );
  }
  sessionUser(token, now) {
    return this.get(
      "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>? AND u.active=1",
      token,
      now,
    );
  }
  removeSession(token) {
    this.run("DELETE FROM sessions WHERE token=?", token);
  }
  activeCategory(id) {
    return this.get("SELECT id FROM categories WHERE id=? AND active=1", id);
  }
  productById(id) {
    return this.get("SELECT * FROM products WHERE id=?", id);
  }
  saveProduct(p, id) {
    if (id)
      this.run(
        "UPDATE products SET title=?,description=?,category_id=?,price=?,stock=?,image=? WHERE id=?",
        p.title,
        p.description,
        p.category_id,
        p.price,
        p.stock,
        p.image,
        id,
      );
    else
      id = Number(
        this.run(
          "INSERT INTO products(owner_id,title,description,category_id,price,stock,image) VALUES(?,?,?,?,?,?,?)",
          p.owner_id,
          p.title,
          p.description,
          p.category_id,
          p.price,
          p.stock,
          p.image,
        ).lastInsertRowid,
      );
    return id;
  }
  saveProfile(id, u) {
    this.run(
      "UPDATE users SET name=?,phone=?,sector=?,business=?,bio=?,show_phone=?,show_sector=? WHERE id=?",
      u.name,
      u.phone,
      u.sector,
      u.business,
      u.bio,
      u.show_phone,
      u.show_sector,
      id,
    );
  }
  products() {
    return this.all(
      `SELECT p.*, c.name AS category, u.business, u.name AS owner, CASE WHEN u.show_sector=1 THEN u.sector ELSE '' END AS sector FROM products p JOIN categories c ON c.id=p.category_id JOIN users u ON u.id=p.owner_id WHERE c.active=1 AND u.active=1 ORDER BY p.id DESC`,
    ).reverse();
  }
  publicUser(id) {
    return this.get(
      `SELECT id,name,business,bio,CASE WHEN show_phone=1 THEN phone ELSE '' END AS phone,CASE WHEN show_sector=1 THEN sector ELSE '' END AS sector FROM users WHERE id=? AND active=1`,
      id,
    );
  }
}
