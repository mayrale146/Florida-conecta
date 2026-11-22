import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Plus,
  Minus,
  Check,
  Store,
  MessageCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Package,
  Trash2,
  Info,
} from "lucide-react";
import { api } from "../../api.js";
import { money } from "../../shared/format.js";
import { Empty, Field, ErrorBox, Submit, LoginGate } from "../../shared/ui.jsx";

export function Profile({ ctx, setUser }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!ctx.user) return <LoginGate setModal={ctx.setModal} />;
  const u = ctx.user;
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const d = Object.fromEntries(new FormData(e.target));
    try {
      const r = await api("/profile", {
        method: "PUT",
        body: {
          ...d,
          show_phone: d.show_phone === "on",
          show_sector: d.show_sector === "on",
        },
      });
      setUser(r.user);
      ctx.refresh();
      ctx.notice("Tu perfil quedó actualizado.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="profile-layout">
      <section className="panel">
        <div className="profile-header">
          <span className="avatar large">
            {u.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <h2>{u.name}</h2>
            <span className="tag">
              {
                {
                  seller: "Vendedor / Emprendedor",
                  buyer: "Vecino / Comprador",
                  admin: "Administración",
                }[u.role]
              }
            </span>
          </div>
        </div>
        <form className="form-stack" key={u.id} onSubmit={save}>
          <Field
            label="Nombre completo"
            name="name"
            defaultValue={u.name}
            required
            maxLength={100}
          />
          <Field
            label="Correo electrónico"
            type="email"
            value={u.email}
            disabled
          />
          <Field
            label="Teléfono móvil"
            name="phone"
            type="tel"
            defaultValue={u.phone}
            required
          />
          <Field
            label="Sector o referencia en Florida"
            name="sector"
            defaultValue={u.sector}
            required
            maxLength={100}
          />
          {u.role !== "buyer" && (
            <>
              <Field
                label="Nombre de tu negocio"
                name="business"
                defaultValue={u.business}
                maxLength={120}
              />
              <Field label="Cuéntanos sobre tu negocio">
                <textarea name="bio" defaultValue={u.bio} maxLength={1000} />
              </Field>
            </>
          )}
          <h3>Tu privacidad</h3>
          <label className="toggle-row">
            <span>
              <strong>Mostrar mi teléfono</strong>
              <small>Para que puedan contactarte por WhatsApp.</small>
            </span>
            <input
              type="checkbox"
              className="switch"
              name="show_phone"
              defaultChecked={!!u.show_phone}
            />
          </label>
          <label className="toggle-row">
            <span>
              <strong>Mostrar mi sector</strong>
              <small>Será visible en tu perfil y publicaciones.</small>
            </span>
            <input
              type="checkbox"
              className="switch"
              name="show_sector"
              defaultChecked={!!u.show_sector}
            />
          </label>
          <ErrorBox error={error} />
          <Submit busy={busy}>
            Guardar cambios <Check size={17} />
          </Submit>
        </form>
      </section>
      <aside className="profile-actions">
        {u.role !== "buyer" && (
          <button className="action-card" onClick={() => ctx.go("manage")}>
            <Store size={26} />
            <span>
              <strong>Mi negocio</strong>
              <small>Publicaciones, inventario y preguntas</small>
            </span>
            <ArrowRight size={18} />
          </button>
        )}
        {u.role === "admin" && (
          <button className="action-card" onClick={() => ctx.go("admin")}>
            <Settings size={26} />
            <span>
              <strong>Administración</strong>
              <small>Usuarios, categorías y contenido</small>
            </span>
            <ArrowRight size={18} />
          </button>
        )}
        <button
          className="action-card"
          onClick={() => ctx.setModal({ type: "privacy" })}
        >
          <ShieldCheck size={26} />
          <span>
            <strong>Privacidad</strong>
            <small>Conoce cómo se usan tus datos</small>
          </span>
          <ArrowRight size={18} />
        </button>
        <button
          className="button danger"
          onClick={async () => {
            try {
              await api("/auth/logout", { method: "POST" });
              setUser(null);
              ctx.go("home");
              ctx.notice("Cerraste sesión. ¡Vuelve pronto!");
            } catch (e) {
              ctx.notice(e.message);
            }
          }}
        >
          <LogOut size={18} /> Cerrar sesión
        </button>
        <p className="muted">
          Estás en una comunidad de demostración.
          <br />
          Los negocios y teléfonos son datos de ejemplo.
        </p>
      </aside>
    </div>
  );
}

export function Manage({ ctx }) {
  const [products, setProducts] = useState([]),
    [questions, setQuestions] = useState([]),
    [busy, setBusy] = useState(null),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(null);
  async function load() {
    try {
      const [p, q] = await Promise.all([
        api("/my/products"),
        api("/my/questions"),
      ]);
      setProducts(p);
      setQuestions(q);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [ctx.data]);
  async function stock(p, n) {
    if (n < 0) return;
    setBusy(p.id);
    try {
      await api(`/products/${p.id}/stock`, {
        method: "PATCH",
        body: { stock: n },
      });
      await load();
      ctx.refresh();
    } catch (e) {
      ctx.notice(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <div className="stats-grid">
        <div>
          <span className="stat-icon green">
            <Package />
          </span>
          <strong>{products.filter((p) => p.stock > 0).length}</strong>
          <small>Publicaciones activas</small>
        </div>
        <div>
          <span className="stat-icon orange">
            <Store />
          </span>
          <strong>{products.filter((p) => !p.stock).length}</strong>
          <small>Productos agotados</small>
        </div>
        <div>
          <span className="stat-icon purple">
            <MessageCircle />
          </span>
          <strong>{questions.filter((q) => !q.answer).length}</strong>
          <small>Preguntas por responder</small>
        </div>
      </div>
      <ErrorBox error={error} />
      <div className="section-heading">
        <h2>Mis publicaciones</h2>
        <button
          className="button primary"
          onClick={() => ctx.setModal({ type: "product" })}
        >
          <Plus size={17} /> Nueva publicación
        </button>
      </div>
      <div className="inventory-list">
        {products.map((p) => (
          <article key={p.id} className="inventory-row">
            <img src={p.image} alt={p.title} />
            <div className="inventory-copy">
              <button
                className="product-title"
                onClick={() => ctx.go("product", p.id)}
              >
                {p.title}
              </button>
              <p>
                <strong>{money(p.price)}</strong>
                <span className={p.stock ? "stock available" : "stock sold"}>
                  <i />
                  {p.stock ? "Disponible" : "Agotado"}
                </span>
              </p>
            </div>
            <div className="stock-control">
              <small>Unidades</small>
              <div>
                <button
                  disabled={busy === p.id || !p.stock}
                  aria-label={`Quitar unidad de ${p.title}`}
                  onClick={() => stock(p, p.stock - 1)}
                >
                  <Minus size={15} />
                </button>
                <strong>{p.stock}</strong>
                <button
                  disabled={busy === p.id}
                  aria-label={`Agregar unidad de ${p.title}`}
                  onClick={() => stock(p, p.stock + 1)}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
            <button
              className="text-button"
              onClick={() => ctx.setModal({ type: "product", product: p })}
            >
              Editar
            </button>
            {confirm === p.id ? (
              <div className="delete-confirm">
                <span>¿Eliminar?</span>
                <button
                  onClick={async () => {
                    try {
                      await api(`/products/${p.id}`, { method: "DELETE" });
                      setConfirm(null);
                      load();
                      ctx.refresh();
                      ctx.notice("Publicación eliminada.");
                    } catch (e) {
                      ctx.notice(e.message);
                    }
                  }}
                >
                  Sí
                </button>
                <button onClick={() => setConfirm(null)}>No</button>
              </div>
            ) : (
              <button
                className="icon-button danger-text"
                aria-label={`Eliminar ${p.title}`}
                onClick={() => setConfirm(p.id)}
              >
                <Trash2 size={17} />
              </button>
            )}
          </article>
        ))}
      </div>
      {!products.length && (
        <Empty
          title="Aquí empieza tu negocio"
          text="Publica tu primer producto y deja que Florida descubra lo que haces."
        />
      )}
      <div className="info-banner">
        <Info size={18} />
        <p>
          Cuando una publicación llega a 0 unidades, aparece automáticamente
          como agotada.
        </p>
      </div>
      <div className="section-heading">
        <h2>Preguntas de la comunidad</h2>
        <MessageCircle size={20} />
      </div>
      {questions.map((q) => (
        <div className="question" key={q.id}>
          <small>
            {q.title} · {q.name}
          </small>
          <strong>{q.body}</strong>
          {q.answer ? (
            <p>
              <span>Tu respuesta</span> {q.answer}
            </p>
          ) : (
            <form
              className="ask-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                try {
                  await api(`/questions/${q.id}`, {
                    method: "PUT",
                    body: { answer: new FormData(form).get("answer") },
                  });
                  await load();
                  ctx.notice("Respuesta enviada.");
                } catch (e) {
                  ctx.notice(e.message);
                }
              }}
            >
              <input
                name="answer"
                required
                maxLength={1000}
                placeholder="Escribe tu respuesta"
                aria-label="Respuesta al comprador"
              />
              <button className="button primary">Responder</button>
            </form>
          )}
        </div>
      ))}
      {!questions.length && (
        <p className="muted">
          Las preguntas sobre tus productos aparecerán aquí.
        </p>
      )}
    </>
  );
}
