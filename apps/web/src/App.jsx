import { Empty, Modal, LoginGate } from "./shared/ui.jsx";
import { Auth } from "./features/auth/Auth.jsx";
import { ProductCard } from "./features/catalog/components.jsx";
import { ProductDetail, Business } from "./features/catalog/pages.jsx";
import { Events, Alerts } from "./features/community/pages.jsx";
import { EventForm, AlertForm } from "./features/community/forms.jsx";
import { Profile, Manage } from "./features/account/pages.jsx";
import { ProductForm } from "./features/catalog/ProductForm.jsx";
import { Admin } from "./features/admin/Admin.jsx";
import { dateLabel } from "./shared/format.js";
import React, { useEffect, useState } from "react";
import { Home, LayoutGrid, CalendarDays, Bell, User, Search, MapPin, ArrowUpRight, ArrowRight, Plus, X, SlidersHorizontal, Leaf, Store, Sprout, Palette, Utensils, Wrench, Heart, WifiOff, ShieldCheck, Package, CheckCircle2, LoaderCircle, Download } from "lucide-react";
import { api, savedData, saveData } from "./api";

const icons = {
  Gastronomía: Utensils,
  Artesanías: Palette,
  "Productos agrícolas": Sprout,
  "Servicios técnicos": Wrench,
};
const nav = [
  ["home", "Inicio", Home],
  ["catalog", "Catálogo", LayoutGrid],
  ["events", "Eventos", CalendarDays],
  ["alerts", "Alertas", Bell],
  ["profile", "Mi perfil", User],
];
function initialRoute() {
  const h = location.hash.slice(1).split("/");
  return { page: h[0] || "home", id: Number(h[1]) || null };
}
export default function App() {
  const [route, setRoute] = useState(initialRoute),
    [user, setUser] = useState(null),
    [data, setData] = useState(
      savedData() || { products: [], categories: [], events: [], alerts: [] },
    ),
    [loading, setLoading] = useState(true),
    [offline, setOffline] = useState(!navigator.onLine),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("Todas"),
    [available, setAvailable] = useState(false),
    [sort, setSort] = useState("featured"),
    [maxPrice, setMaxPrice] = useState(""),
    [filters, setFilters] = useState(false),
    [modal, setModal] = useState(null),
    [favorites, setFavorites] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("fc-favorites") || "[]");
      } catch {
        return [];
      }
    }),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [install, setInstall] = useState(null);
  const go = (page, id) => {
    location.hash = `${page}${id ? `/${id}` : ""}`;
    setQuery("");
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const handle = () => setRoute(initialRoute());
    window.addEventListener("hashchange", handle);
    const online = () => {
      setOffline(!navigator.onLine);
      if (navigator.onLine) refresh();
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    const prompt = (e) => {
      e.preventDefault();
      setInstall(e);
    };
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      window.removeEventListener("hashchange", handle);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  async function refresh() {
    setError("");
    try {
      const [products, categories, events, alerts] = await Promise.all(
        ["/products", "/categories", "/events", "/alerts"].map((p) => api(p)),
      );
      const next = { products, categories, events, alerts };
      setData(next);
      saveData(next);
      setOffline(false);
    } catch (e) {
      setError(
        "No pudimos actualizar la información. Puedes consultar el contenido guardado.",
      );
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    api("/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    try {
      localStorage.setItem("fc-favorites", JSON.stringify(favorites));
    } catch {}
  }, [favorites]);
  const favorite = (id) =>
    setFavorites((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  const requireUser = (next) => {
    if (user) next();
    else setModal({ type: "auth" });
  };
  const notice = (message) => setToast(message);
  const publish = () =>
    requireUser(() =>
      user.role === "buyer"
        ? notice("Registra una cuenta de vendedor para publicar productos.")
        : setModal({ type: "product" }),
    );
  const filtered = data.products
    .filter(
      (p) =>
        (category === "Todas" || p.category === category) &&
        (!available || p.stock > 0) &&
        (!maxPrice || p.price <= Number(maxPrice)) &&
        (!onlyFavorites || favorites.includes(p.id)) &&
        `${p.title} ${p.business} ${p.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "newest"
            ? b.id - a.id
            : 0,
    );
  const ctx = {
    user,
    data,
    go,
    notice,
    refresh,
    setModal,
    requireUser,
    favorites,
    favorite,
  };
  const titles = {
    home: "Tu comunidad, más cerca.",
    catalog: "Descubre lo que hace Florida.",
    events: "Siempre hay un buen plan.",
    alerts: "Una comunidad informada.",
    profile: "Tu espacio en la comunidad.",
    business: "Hecho aquí, con mucho orgullo.",
    manage: "Hagamos crecer tu negocio.",
    admin: "Cuidemos nuestra comunidad.",
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="#home">
          <span className="brand-icon">
            fc<span>•</span>
          </span>
          <span>
            Florida
            <strong>
              Conecta<span>↗</span>
            </strong>
          </span>
        </a>
        <div className="community-label">TU COMUNIDAD DIGITAL</div>
        <nav>
          {nav.map(([key, label, Icon]) => (
            <a
              href={`#${key}`}
              key={key}
              className={route.page === key ? "nav-link active" : "nav-link"}
            >
              <Icon size={21} />
              {label}
              {key === "alerts" && (
                <span className="nav-count">{data.alerts.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-business">
          <span className="mini-icon">
            <Store size={22} />
          </span>
          <h3>
            Lo tuyo merece
            <br />
            ser descubierto.
          </h3>
          <p>Tu próximo cliente puede estar a la vuelta de la esquina.</p>
          <button onClick={publish}>
            Publicar un producto <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <MapPin size={17} />
          <span>
            Florida, Valle del Cauca
            <small>Hecho por y para nuestra gente</small>
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <a className="mobile-brand" href="#home">
            <span className="brand-icon">fc</span> Florida Conecta
          </a>
          <div className="breadcrumb">
            Comunidad <span>/</span>{" "}
            <strong>
              {nav.find((n) => n[0] === route.page)?.[1] ||
                {
                  manage: "Mi negocio",
                  admin: "Administración",
                  product: "Producto",
                  business: "Emprendimiento",
                }[route.page] ||
                "Florida Conecta"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="location">
              <span className="live-dot" /> Florida, Valle del Cauca
            </span>
            {install && (
              <button
                className="icon-button"
                aria-label="Instalar aplicación"
                onClick={() => install.prompt()}
              >
                <Download size={19} />
              </button>
            )}
            <button
              className="icon-button notification"
              aria-label="Ver alertas"
              onClick={() => go("alerts")}
            >
              <Bell size={20} />
              <i />
            </button>
            <button
              className="avatar"
              aria-label={user ? "Abrir mi perfil" : "Iniciar sesión"}
              onClick={() =>
                user ? go("profile") : setModal({ type: "auth" })
              }
            >
              {user ? (
                user.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
              ) : (
                <User size={20} />
              )}
            </button>
          </div>
        </header>
        <main>
          {offline && (
            <div className="offline-bar">
              <WifiOff size={18} />
              <span>
                {error || "Estás sin conexión. Mostrando contenido guardado."}
              </span>
              <button onClick={refresh}>Reintentar</button>
            </div>
          )}
          {!["product", "business"].includes(route.page) && (
            <div className="page-intro">
              <div>
                <div className="eyebrow">
                  <span /> LO NUESTRO NOS CONECTA
                </div>
                <h1>
                  {route.page === "home" ? (
                    <>
                      Hola, {user ? user.name.split(" ")[0] : "vecino"}{" "}
                      <span className="wave">✦</span>
                    </>
                  ) : (
                    {
                      catalog: "Nuestro mercado",
                      events: "Agenda de Florida",
                      alerts: "Alertas comunitarias",
                      profile: "Mi perfil",
                      manage: "Mi negocio",
                      admin: "Administración",
                    }[route.page] || "Florida Conecta"
                  )}
                </h1>
                <p>{titles[route.page]}</p>
              </div>
              {route.page === "home" || route.page === "catalog" ? (
                <button
                  className="button primary intro-publish"
                  onClick={publish}
                >
                  <Plus size={18} /> Publicar producto
                </button>
              ) : null}
            </div>
          )}
          {loading && !data.products.length ? (
            <div className="empty">
              <LoaderCircle className="spin" /> Conectando con Florida…
            </div>
          ) : (
            <>
              {route.page === "home" && (
                <>
                  <section className="hero">
                    <div className="hero-content">
                      <span className="hero-kicker">
                        <Leaf size={15} /> EL TALENTO ESTÁ AQUÍ
                      </span>
                      <h2>
                        De nuestra tierra.
                        <br />
                        <em>De nuestra gente.</em>
                      </h2>
                      <p>
                        Encuentra productos, apoya los negocios locales
                        <br className="desktop" /> y descubre todo lo que pasa
                        en Florida.
                      </p>
                      <button onClick={() => go("catalog")}>
                        Explorar el mercado <ArrowUpRight size={19} />
                      </button>
                      <div className="hero-proof">
                        <span className="stacked-avatars">
                          <i>MR</i>
                          <i>LP</i>
                          <i>AR</i>
                        </span>
                        <span>Una comunidad que crece contigo</span>
                      </div>
                    </div>
                    <div className="hero-photo">
                      <img
                        src="/images/campo.jpg"
                        alt="Campo al atardecer"
                      />
                      <span className="photo-label">
                        <MapPin size={14} /> Nuestra tierra, nuestro orgullo
                      </span>
                      <div className="floating-card">
                        <span>
                          <Sprout size={22} />
                        </span>
                        <div>
                          100% talento local
                          <small>De Florida, para Florida.</small>
                        </div>
                        <CheckCircle2 size={20} />
                      </div>
                    </div>
                  </section>
                  <section className="category-section">
                    <div className="section-heading">
                      <h2>¿Qué estás buscando?</h2>
                      <button
                        className="text-button"
                        onClick={() => {
                          setCategory("Todas");
                          go("catalog");
                        }}
                      >
                        Ver categorías <ArrowRight size={16} />
                      </button>
                    </div>
                    <div className="category-grid">
                      {data.categories.map((c) => {
                        const Icon = icons[c.name] || Package;
                        return (
                          <button
                            key={c.id}
                            onClick={() => {
                              setCategory(c.name);
                              go("catalog");
                            }}
                            className="category-tile"
                          >
                            <span className={`category-icon color-${c.id % 4}`}>
                              <Icon size={23} />
                            </span>
                            <div>
                              <strong>
                                {c.name === "Productos agrícolas"
                                  ? "Del campo"
                                  : c.name}
                              </strong>
                              <small>
                                {
                                  data.products.filter(
                                    (p) => p.category_id === c.id,
                                  ).length
                                }{" "}
                                publicaciones
                              </small>
                            </div>
                            <ArrowUpRight size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <div className="home-bottom">
                    <section className="featured-section">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow purple">
                            HECHO CON ORGULLO
                          </span>
                          <h2>
                            Descubrimientos locales{" "}
                            <span className="small-dot" />
                          </h2>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => go("catalog")}
                        >
                          Ver todo <ArrowRight size={16} />
                        </button>
                      </div>
                      <div className="product-grid home-products">
                        {data.products.slice(0, 3).map((p) => (
                          <ProductCard key={p.id} product={p} ctx={ctx} />
                        ))}
                      </div>
                    </section>
                    <aside className="community-column">
                      <div className="section-heading">
                        <h2>Nos encontramos</h2>
                        <CalendarDays size={19} />
                      </div>
                      {data.events[0] && (
                        <button
                          className="event-promo"
                          onClick={() => go("events")}
                        >
                          <span className="event-tag">PRÓXIMO EN FLORIDA</span>
                          <h3>{data.events[0].title}</h3>
                          <p>
                            <MapPin size={14} />
                            {data.events[0].place}
                          </p>
                          <div className="event-promo-footer">
                            <span>
                              {dateLabel(data.events[0].date)} ·{" "}
                              {data.events[0].time}
                            </span>
                            <span className="round-arrow">
                              <ArrowUpRight size={17} />
                            </span>
                          </div>
                        </button>
                      )}
                      {data.alerts[0] && (
                        <button
                          className="alert-preview"
                          onClick={() => go("alerts")}
                        >
                          <span>
                            <i className="live-dot" /> TU COMUNIDAD AL DÍA
                          </span>
                          <h3>{data.alerts[0].title}</h3>
                          <p>
                            Consulta las novedades <ArrowRight size={15} />
                          </p>
                        </button>
                      )}
                    </aside>
                  </div>
                  <section className="local-banner">
                    <Heart size={26} />
                    <div>
                      <h3>Cada compra local hace la diferencia.</h3>
                      <p>
                        Detrás de cada producto hay una historia, una familia y
                        un sueño.
                      </p>
                    </div>
                    <span>
                      Gracias por elegir lo nuestro <span>♡</span>
                    </span>
                  </section>
                </>
              )}
              {route.page === "catalog" && (
                <>
                  <div className="catalog-toolbar">
                    <label className="search">
                      <Search size={21} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Busca productos, servicios o emprendimientos…"
                        aria-label="Buscar productos"
                      />
                      {query && (
                        <button
                          aria-label="Limpiar búsqueda"
                          onClick={() => setQuery("")}
                        >
                          <X size={17} />
                        </button>
                      )}
                    </label>
                    <button
                      className={`button ${filters ? "selected" : ""}`}
                      onClick={() => setFilters(!filters)}
                    >
                      <SlidersHorizontal size={18} /> Filtros
                      {(available || maxPrice) && <i className="small-dot" />}
                    </button>
                    <button
                      className={`button favorite-filter ${onlyFavorites ? "selected" : ""}`}
                      onClick={() => setOnlyFavorites(!onlyFavorites)}
                    >
                      <Heart size={18} /> Guardados
                    </button>
                  </div>
                  {filters && (
                    <div className="filters-panel">
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={available}
                          onChange={(e) => setAvailable(e.target.checked)}
                        />{" "}
                        Solo disponibles
                      </label>
                      <label>
                        Precio máximo{" "}
                        <input
                          type="number"
                          min="0"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="Sin límite"
                        />
                      </label>
                      <button
                        className="text-button"
                        onClick={() => {
                          setAvailable(false);
                          setMaxPrice("");
                          setCategory("Todas");
                          setOnlyFavorites(false);
                        }}
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  )}
                  <div className="chips">
                    <button
                      className={category === "Todas" ? "chip active" : "chip"}
                      onClick={() => setCategory("Todas")}
                    >
                      Todos los productos
                    </button>
                    {data.categories.map((c) => (
                      <button
                        key={c.id}
                        className={category === c.name ? "chip active" : "chip"}
                        onClick={() => setCategory(c.name)}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <div className="results-line">
                    <p>
                      <strong>{filtered.length}</strong> publicaciones para
                      descubrir {offline && "· Guardadas en este dispositivo"}
                    </p>
                    <label>
                      Ordenar por{" "}
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="featured">Destacados</option>
                        <option value="newest">Más recientes</option>
                        <option value="price-asc">Menor precio</option>
                        <option value="price-desc">Mayor precio</option>
                      </select>
                    </label>
                  </div>
                  {filtered.length ? (
                    <div className="product-grid catalog-grid">
                      {filtered.map((p) => (
                        <ProductCard key={p.id} product={p} ctx={ctx} />
                      ))}
                    </div>
                  ) : (
                    <Empty
                      icon={Search}
                      title="No encontramos publicaciones"
                      text="Prueba otra palabra o cambia los filtros para descubrir más."
                    />
                  )}
                </>
              )}
              {route.page === "product" && (
                <ProductDetail id={route.id} ctx={ctx} offline={offline} />
              )}
              {route.page === "business" && (
                <Business id={route.id} ctx={ctx} />
              )}
              {route.page === "events" && <Events ctx={ctx} />}
              {route.page === "alerts" && <Alerts ctx={ctx} />}
              {route.page === "profile" && (
                <Profile ctx={ctx} setUser={setUser} />
              )}
              {route.page === "manage" &&
                (user ? (
                  <Manage ctx={ctx} />
                ) : (
                  <LoginGate setModal={setModal} />
                ))}
              {route.page === "admin" &&
                (user?.role === "admin" ? (
                  <Admin ctx={ctx} />
                ) : (
                  <Empty
                    icon={ShieldCheck}
                    title="Acceso de administración"
                    text="Inicia sesión con una cuenta de administración para continuar."
                  />
                ))}
              {![
                "home",
                "catalog",
                "product",
                "business",
                "events",
                "alerts",
                "profile",
                "manage",
                "admin",
              ].includes(route.page) && (
                <Empty
                  title="Página no encontrada"
                  text="Usa el menú para volver a tu comunidad."
                />
              )}
            </>
          )}
          <footer>
            <span>
              <span className="footer-brand">fc.</span> Florida Conecta
            </span>
            <p>
              Lo nuestro nos conecta. <span>Florida, Valle del Cauca.</span>
            </p>
            <span className="demo-label">Comunidad de demostración</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav">
        {nav.map(([key, label, Icon]) => (
          <a
            href={`#${key}`}
            key={key}
            className={route.page === key ? "active" : ""}
          >
            <Icon size={21} />
            <span>{label === "Mi perfil" ? "Perfil" : label}</span>
          </a>
        ))}
      </nav>
      {modal && (
        <Modal
          onClose={() => setModal(null)}
          title={
            {
              auth: "Bienvenido a Florida",
              product: modal.product
                ? "Editar publicación"
                : "Comparte lo que haces",
              event: "Un nuevo encuentro",
              alert: "Publicar aviso",
              privacy: "Tus datos, tu decisión",
            }[modal.type]
          }
        >
          {modal.type === "auth" ? (
            <Auth
              onSuccess={(u) => {
                setUser(u);
                setModal(null);
                notice("¡Qué bueno tenerte aquí!");
              }}
            />
          ) : modal.type === "product" ? (
            <ProductForm
              ctx={ctx}
              product={modal.product}
              onDone={() => {
                setModal(null);
                refresh();
                notice("Tu publicación está lista.");
                go("manage");
              }}
            />
          ) : modal.type === "event" ? (
            <EventForm
              onDone={() => {
                setModal(null);
                refresh();
                notice("Evento publicado.");
              }}
            />
          ) : modal.type === "alert" ? (
            <AlertForm
              onDone={() => {
                setModal(null);
                refresh();
                notice("Aviso publicado.");
              }}
            />
          ) : (
            <div className="privacy-copy">
              <p>
                Usamos tu nombre y correo para gestionar tu cuenta. El teléfono
                permite que los compradores contacten contigo y puedes ocultarlo
                desde tu perfil. El sector solo se muestra si lo autorizas.
              </p>
              <p>
                No publiques datos sensibles en preguntas o avisos. Esta
                instalación es una demostración; antes de recibir datos reales,
                el responsable debe configurar su política de tratamiento,
                contacto y mecanismo de eliminación de datos.
              </p>
            </div>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={21} />
          {toast}
          <button aria-label="Cerrar mensaje" onClick={() => setToast("")}>
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
