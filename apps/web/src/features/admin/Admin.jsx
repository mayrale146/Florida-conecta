import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../api.js";
import { ErrorBox } from "../../shared/ui.jsx";

export function Admin({ ctx }) {
  const [tab, setTab] = useState("categories"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(null);
  async function load() {
    try {
      setData(await api("/admin"));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [ctx.data]);
  async function action(path, method, body) {
    setError("");
    try {
      await api(path, { method, body });
      setConfirm(null);
      await load();
      ctx.refresh();
      ctx.notice("Cambio guardado.");
    } catch (e) {
      setError(e.message);
    }
  }
  if (!data) return <ErrorBox error={error} />;
  return (
    <>
      <div className="chips">
        {[
          ["categories", "Categorías"],
          ["users", "Usuarios"],
          ["content", "Contenido"],
        ].map(([key, label]) => (
          <button
            className={tab === key ? "chip active" : "chip"}
            key={key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorBox error={error} />
      {tab === "categories" && (
        <section className="panel admin-panel">
          <h2>Categorías del mercado</h2>
          {data.categories.map((c) => (
            <label className="toggle-row" key={c.id}>
              <strong>{c.name}</strong>
              <input
                type="checkbox"
                className="switch"
                checked={!!c.active}
                onChange={(e) =>
                  action(`/admin/categories/${c.id}`, "PATCH", {
                    active: e.target.checked,
                  })
                }
              />
            </label>
          ))}
          <form
            className="ask-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              action("/admin/categories", "POST", {
                name: new FormData(f).get("name"),
              });
              f.reset();
            }}
          >
            <input
              name="name"
              placeholder="Nueva categoría"
              required
              maxLength={60}
              aria-label="Nombre de nueva categoría"
            />
            <button className="button primary">
              <Plus size={17} /> Agregar
            </button>
          </form>
        </section>
      )}
      {tab === "users" && (
        <section className="panel">
          {data.users.map((u) => (
            <div className="admin-user" key={u.id}>
              <span className="avatar">
                {u.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <strong>{u.name}</strong>
                <small>
                  {u.email} ·{" "}
                  {
                    {
                      buyer: "Comprador",
                      seller: "Vendedor",
                      admin: "Administrador",
                    }[u.role]
                  }
                </small>
              </div>
              <button
                disabled={u.id === ctx.user.id}
                className={`button ${u.active ? "danger" : ""}`}
                onClick={() =>
                  action(`/admin/users/${u.id}`, "PATCH", { active: !u.active })
                }
              >
                {u.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          ))}
        </section>
      )}
      {tab === "content" && (
        <>
          {["products", "events", "alerts"].map((kind) => (
            <section className="panel" key={kind}>
              <h2>
                {
                  {
                    products: "Publicaciones",
                    events: "Eventos",
                    alerts: "Avisos",
                  }[kind]
                }
              </h2>
              {data[kind].map((item) => (
                <div className="admin-content" key={item.id}>
                  <strong>{item.title}</strong>
                  {confirm === `${kind}/${item.id}` ? (
                    <span className="delete-confirm">
                      ¿Eliminar?{" "}
                      <button
                        onClick={() =>
                          action(`/admin/content/${kind}/${item.id}`, "DELETE")
                        }
                      >
                        Sí
                      </button>
                      <button onClick={() => setConfirm(null)}>Cancelar</button>
                    </span>
                  ) : (
                    <button
                      className="icon-button danger-text"
                      aria-label={`Eliminar ${item.title}`}
                      onClick={() => setConfirm(`${kind}/${item.id}`)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </>
  );
}
