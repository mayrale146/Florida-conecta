import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { security } from "./security.js";
const hashPassword = (password) => security.hashPassword(password);

export function openDatabase(path, seed = false) {
  if (path !== ":memory:")
    mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('buyer','seller','admin')), phone TEXT DEFAULT '', sector TEXT DEFAULT 'Sector Centro', business TEXT DEFAULT '', bio TEXT DEFAULT '', show_phone INTEGER DEFAULT 1, show_sector INTEGER DEFAULT 1, active INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, active INTEGER DEFAULT 1);
    CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id), category_id INTEGER NOT NULL REFERENCES categories(id), title TEXT NOT NULL, description TEXT NOT NULL, price INTEGER NOT NULL CHECK(price>=0), stock INTEGER NOT NULL CHECK(stock>=0), image TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS questions(id INTEGER PRIMARY KEY, product_id INTEGER REFERENCES products(id) ON DELETE CASCADE, user_id INTEGER REFERENCES users(id), body TEXT NOT NULL, answer TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), title TEXT NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, place TEXT NOT NULL, organizer TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS alerts(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), category TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  `);
  if (seed && !db.prepare("SELECT id FROM users LIMIT 1").get()) {
    const insert = db.prepare(
      "INSERT INTO users(name,email,password,role,phone,business,bio) VALUES(?,?,?,?,?,?,?)",
    );
    insert.run(
      "Mayra Reyes",
      "mayra@florida.demo",
      hashPassword("Florida2026!"),
      "seller",
      "3000000000",
      "Finca La Esperanza",
      "Productos de panela y café de origen. Venta directa y sin intermediarios, desde el corazón de Florida.",
    );
    insert.run(
      "Ana Ríos",
      "vecino@florida.demo",
      hashPassword("Florida2026!"),
      "buyer",
      "",
      "",
      "",
    );
    insert.run(
      "Administración",
      "admin@florida.demo",
      hashPassword("Florida2026!"),
      "admin",
      "",
      "Florida Conecta",
      "",
    );
    insert.run(
      "Luis Pérez",
      "luis@florida.demo",
      hashPassword("Florida2026!"),
      "seller",
      "3000000001",
      "Artesanías Doña Marta",
      "Tradición tejida a mano en Florida, Valle del Cauca.",
    );
    for (const name of [
      "Gastronomía",
      "Artesanías",
      "Productos agrícolas",
      "Servicios técnicos",
    ])
      db.prepare("INSERT INTO categories(name) VALUES(?)").run(name);
    const products = [
      [
        1,
        3,
        "Panela artesanal 500 g",
        "Panela elaborada de forma artesanal con caña de la región. Presentación de 500 g, empacada al momento del pedido. Dulzura natural de nuestra tierra.",
        8500,
        24,
        "/images/panela.jpg",
      ],
      [
        1,
        3,
        "Café de origen 250 g",
        "Café de nuestras montañas, tostado artesanalmente. Notas de chocolate y caramelo. Molido, fresco y listo para preparar.",
        18000,
        9,
        "/images/cafe.jpg",
      ],
      [
        4,
        2,
        "Canasta en iraca tejida",
        "Hecha a mano por artesanas de Florida. Una pieza única para llevar contigo lo mejor de nuestra tradición.",
        45000,
        6,
        "/images/canasta.jpg",
      ],
      [
        4,
        1,
        "Almuerzo corriente del día",
        "Sabor de casa: arroz, ensalada, proteína del día y bebida natural. Preparado con ingredientes frescos de la región.",
        14000,
        15,
        "/images/almuerzo.jpg",
      ],
      [
        1,
        1,
        "Arepas de choclo × 6",
        "Seis arepas de maíz tierno, hechas a mano. Perfectas para compartir en familia.",
        9000,
        0,
        "/images/arepas.jpg",
      ],
      [
        1,
        3,
        "Miel de caña 330 ml",
        "Miel de caña de nuestra finca, sin aditivos. Un toque de tradición para tus recetas.",
        12000,
        12,
        "/images/miel.jpg",
      ],
    ];
    for (const p of products)
      db.prepare(
        "INSERT INTO products(owner_id,category_id,title,description,price,stock,image) VALUES(?,?,?,?,?,?,?)",
      ).run(...p);
    db.prepare(
      "INSERT INTO questions(product_id,user_id,body,answer) VALUES(1,2,?,?)",
    ).run(
      "¿Hacen entregas en el casco urbano?",
      "Sí, entregamos en el Centro sin costo. Escríbenos para coordinar.",
    );
    for (const e of [
      [
        "Mercado campesino de Florida",
        "2026-11-21",
        "08:00",
        "Parque principal",
        "Asociación de productores",
      ],
      [
        "Noche cultural y gastronómica",
        "2026-11-28",
        "18:00",
        "Casa de la Cultura",
        "Gestión cultural municipal",
      ],
      [
        "Feria de emprendimientos locales",
        "2026-12-05",
        "09:00",
        "Polideportivo",
        "Comité de emprendedores",
      ],
    ])
      db.prepare(
        "INSERT INTO events(user_id,title,date,time,place,organizer) VALUES(3,?,?,?,?,?)",
      ).run(...e);
    for (const a of [
      [
        "Servicios",
        "Suspensión temporal del servicio de agua en el sector Centro",
        "Se restablecerá en la tarde. Almacena agua para el uso básico.",
      ],
      [
        "Comunidad",
        "Nos vemos en el mercado campesino",
        "Este sábado apoya a los productores locales en el parque principal, de 8:00 a. m. a 2:00 p. m.",
      ],
      [
        "Tránsito",
        "Cierre parcial de vía por mantenimiento",
        "Se recomienda usar rutas alternas durante la mañana.",
      ],
    ])
      db.prepare(
        "INSERT INTO alerts(user_id,category,title,body) VALUES(3,?,?,?)",
      ).run(...a);
  }
  return db;
}
