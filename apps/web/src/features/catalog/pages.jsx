import React, { useEffect, useState } from "react";
import {
  MapPin,
  ArrowUpRight,
  ArrowLeft,
  Heart,
  MessageCircle,
  ShieldCheck,
  LoaderCircle,
  Send,
} from "lucide-react";
import { api } from "../../api.js";
import { money } from "../../shared/format.js";
import { Empty } from "../../shared/ui.jsx";
import { ProductCard, Contact } from "./components.jsx";

export function ProductDetail({ id, ctx, offline }) {
  const [product, setProduct] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [question, setQuestion] = useState("");
  async function load() {
    setError("");
    try {
      setProduct(await api(`/products/${id}`));
    } catch (e) {
      const p = ctx.data.products.find((p) => p.id === id);
      if (p && offline)
        setProduct({
          ...p,
          seller: {
            id: p.owner_id,
            name: p.owner,
            business: p.business,
            sector: p.sector,
          },
          questions: [],
        });
      else setError(e.message);
    }
  }
  useEffect(() => {
    setProduct(null);
    load();
  }, [id]);
  if (error)
    return <Empty title="No pudimos abrir esta publicación" text={error} />;
  if (!product)
    return (
      <div className="empty">
        <LoaderCircle className="spin" />
      </div>
    );
  const p = product;
  async function ask(e) {
    e.preventDefault();
    ctx.requireUser(async () => {
      setBusy(true);
      try {
        await api(`/products/${id}/questions`, {
          method: "POST",
          body: { body: question },
        });
        setQuestion("");
        await load();
        ctx.notice("Tu pregunta fue enviada.");
      } catch (e) {
        ctx.notice(e.message);
      } finally {
        setBusy(false);
      }
    });
  }
  return (
    <>
      <button className="back-link" onClick={() => ctx.go("catalog")}>
        <ArrowLeft size={17} /> Volver al mercado
      </button>
      <div className="detail-layout">
        <div className="detail-photo">
          <img src={p.image} alt={p.title} />
          <button
            className={`save-button ${ctx.favorites.includes(p.id) ? "saved" : ""}`}
            aria-label="Guardar producto"
            onClick={() => ctx.favorite(p.id)}
          >
            <Heart
              fill={ctx.favorites.includes(p.id) ? "currentColor" : "none"}
            />
          </button>
        </div>
        <div className="detail-copy">
          <span className="tag">{p.category}</span>
          <h1>{p.title}</h1>
          <div className="detail-price">
            {money(p.price)} <span>COP</span>
          </div>
          <span className={p.stock ? "stock available" : "stock sold"}>
            <i />
            {p.stock ? `Disponible · ${p.stock} unidades` : "Agotado por ahora"}
          </span>
          <p className="detail-description">{p.description}</p>
          <button
            className="seller-box"
            onClick={() => ctx.go("business", p.owner_id)}
          >
            <span className="avatar">
              {p.business
                ?.split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("") || "FC"}
            </span>
            <span>
              <strong>{p.business || p.owner}</strong>
              <small>
                <MapPin size={13} />
                {p.sector || "Florida, Valle del Cauca"}
              </small>
            </span>
            <ArrowUpRight size={19} />
          </button>
          <Contact seller={p.seller} product={p} disabled={!p.stock} />
          <div className="detail-assurance">
            <ShieldCheck size={17} /> Compra directamente al emprendedor local.
            <br />
            Acuerda entrega y pago por el canal de contacto.
          </div>
        </div>
      </div>
      <section className="questions-section">
        <div className="section-heading">
          <h2>Conversemos sobre este producto</h2>
          <MessageCircle size={22} />
        </div>
        {p.questions?.map((q) => (
          <div className="question" key={q.id}>
            <strong>{q.body}</strong>
            <small>{q.name}</small>
            {q.answer ? (
              <p>
                <span>Vendedor</span> {q.answer}
              </p>
            ) : (
              <p className="muted">Esperando respuesta del vendedor</p>
            )}
          </div>
        ))}
        {!p.questions?.length && (
          <p className="muted">Sé la primera persona en preguntar.</p>
        )}
        <form className="ask-form" onSubmit={ask}>
          <input
            aria-label="Tu pregunta"
            placeholder="¿Qué te gustaría saber?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            required
          />
          <button className="button primary" disabled={busy || offline}>
            <Send size={17} /> Preguntar
          </button>
        </form>
      </section>
    </>
  );
}

export function Business({ id, ctx }) {
  const [business, setBusiness] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    setBusiness(null);
    setError("");
    api(`/business/${id}`)
      .then(setBusiness)
      .catch((e) => setError(e.message));
  }, [id]);
  if (error) return <Empty title="No pudimos abrir el negocio" text={error} />;
  if (!business)
    return (
      <div className="empty">
        <LoaderCircle className="spin" />
      </div>
    );
  return (
    <>
      <button className="back-link" onClick={() => ctx.go("catalog")}>
        <ArrowLeft size={17} /> Volver al mercado
      </button>
      <section className="business-hero">
        <span className="business-avatar">
          {business.business
            ?.split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("") || "FC"}
        </span>
        <span className="eyebrow purple">EMPRENDIMIENTO LOCAL</span>
        <h1>{business.business || business.name}</h1>
        <p>
          <MapPin size={16} />
          {business.sector || "Florida, Valle del Cauca"}
        </p>
        <p>
          {business.bio ||
            "Un emprendimiento que hace parte de nuestra comunidad."}
        </p>
        <Contact seller={business} />
      </section>
      <div className="section-heading">
        <h2>Hecho por {business.name.split(" ")[0]}</h2>
        <span>{business.products.length} publicaciones</span>
      </div>
      <div className="product-grid catalog-grid">
        {business.products.map((p) => (
          <ProductCard product={p} key={p.id} ctx={ctx} />
        ))}
      </div>
    </>
  );
}
