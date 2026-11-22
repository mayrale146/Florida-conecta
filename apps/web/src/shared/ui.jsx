import React, { useEffect, useState } from "react";
import { User, ArrowRight, X, Package, Info, LoaderCircle } from "lucide-react";

export function Empty({ icon: Icon = Package, title, text }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={34} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = [
          ...document.querySelectorAll(
            ".modal button,.modal input,.modal select,.modal textarea,.modal a",
          ),
        ].filter((x) => !x.disabled);
        if (!items.length) return;
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.querySelector(".modal input,.modal button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" aria-label="Cerrar" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}

export function ErrorBox({ error }) {
  return error ? (
    <div className="form-error" role="alert">
      <Info size={17} />
      {error}
    </div>
  ) : null;
}

export function Submit({ busy, children }) {
  return (
    <button disabled={busy} className="button primary submit" type="submit">
      {busy ? <LoaderCircle size={18} className="spin" /> : children}
    </button>
  );
}

export function LoginGate({ setModal }) {
  return (
    <div className="login-gate">
      <span className="empty-icon">
        <User size={34} />
      </span>
      <h2>Tu comunidad te espera</h2>
      <p>
        Inicia sesión para administrar tu perfil, hacer preguntas y publicar.
      </p>
      <button
        className="button primary"
        onClick={() => setModal({ type: "auth" })}
      >
        Iniciar sesión o crear cuenta <ArrowRight size={18} />
      </button>
    </div>
  );
}
