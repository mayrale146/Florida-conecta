import React, { useEffect, useState } from "react";
import {
  MapPin,
  ArrowUpRight,
  Heart,
  MessageCircle,
  Phone,
  ShieldCheck,
  Info,
} from "lucide-react";
import { money } from "../../shared/format.js";

export function ProductCard({ product: p, ctx }) {
  return (
    <article className="product-card">
      <div className="product-image">
        <button
          className="image-link"
          onClick={() => ctx.go("product", p.id)}
          aria-label={`Ver ${p.title}`}
        >
          <img src={p.image} alt={p.title} loading="lazy" />
        </button>
        <span className="image-category">{p.category}</span>
        <button
          className={`save-button ${ctx.favorites.includes(p.id) ? "saved" : ""}`}
          aria-label={
            ctx.favorites.includes(p.id)
              ? `Quitar ${p.title} de guardados`
              : `Guardar ${p.title}`
          }
          onClick={() => ctx.favorite(p.id)}
        >
          <Heart
            size={17}
            fill={ctx.favorites.includes(p.id) ? "currentColor" : "none"}
          />
        </button>
        {!p.stock && <span className="sold-overlay">Agotado por ahora</span>}
      </div>
      <div className="product-copy">
        <button
          className="seller-link"
          onClick={() => ctx.go("business", p.owner_id)}
        >
          <span className="tiny-avatar">{p.business?.[0] || "F"}</span>
          {p.business || p.owner}
          <ShieldCheck size={12} />
        </button>
        <button
          className="product-title"
          onClick={() => ctx.go("product", p.id)}
        >
          {p.title}
        </button>
        <div className="product-meta">
          <strong>
            {money(p.price)}
            <small> COP</small>
          </strong>
          <span className={p.stock ? "stock available" : "stock sold"}>
            <i />
            {p.stock ? "Disponible" : "Agotado"}
          </span>
        </div>
        <div className="product-location">
          <MapPin size={12} />
          {p.sector || "Florida, Valle"}
          <button
            aria-label={`Ver detalle de ${p.title}`}
            onClick={() => ctx.go("product", p.id)}
          >
            <ArrowUpRight size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

export function Contact({ seller, product, disabled = false }) {
  const phone = seller?.phone?.replace(/\D/g, "");
  const normalized = phone?.length === 10 ? `57${phone}` : phone;
  return (
    <div className="contact-actions">
      {normalized ? (
        <>
          <a
            className={`button whatsapp ${disabled ? "unavailable" : ""}`}
            href={`https://wa.me/${normalized}?text=${encodeURIComponent(`Hola, vi ${product?.title || "tu negocio"} en Florida Conecta. Me gustaría recibir más información.`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={19} />
            {disabled
              ? "Consultar próxima disponibilidad"
              : "Contactar por WhatsApp"}
          </a>
          <a
            className="button call"
            href={`tel:+${normalized}`}
            aria-label="Llamar al vendedor"
          >
            <Phone size={19} />
          </a>
        </>
      ) : (
        <p className="privacy-note">
          <Info size={17} /> El vendedor no tiene un teléfono público. Puedes
          dejar una pregunta en el producto.
        </p>
      )}
    </div>
  );
}
