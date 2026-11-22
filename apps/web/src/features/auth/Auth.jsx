import React, { useEffect, useState } from "react";
import { User, ArrowRight, Store } from "lucide-react";
import { api } from "../../api.js";
import { Field, ErrorBox, Submit } from "../../shared/ui.jsx";

export function Auth({ onSuccess }) {
  const [register, setRegister] = useState(false),
    [role, setRole] = useState("buyer"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const d = Object.fromEntries(new FormData(e.target));
    try {
      const result = await api(`/auth/${register ? "register" : "login"}`, {
        method: "POST",
        body: { ...d, role, consent: d.consent === "on" },
      });
      onSuccess(result.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="form-intro">
        {register
          ? "Sé parte de la comunidad. Lo bueno empieza cerca."
          : "Tu gente, tus productos y tus planes, en un solo lugar."}
      </p>
      <div className="auth-tabs">
        <button
          className={!register ? "active" : ""}
          onClick={() => {
            setRegister(false);
            setError("");
          }}
        >
          Iniciar sesión
        </button>
        <button
          className={register ? "active" : ""}
          onClick={() => {
            setRegister(true);
            setError("");
          }}
        >
          Crear cuenta
        </button>
      </div>
      <form onSubmit={submit} className="form-stack">
        {register && (
          <>
            <div className="role-options">
              <button
                type="button"
                className={role === "buyer" ? "selected" : ""}
                onClick={() => setRole("buyer")}
              >
                <User size={21} />
                <strong>Vecino / Comprador</strong>
                <small>Descubre y apoya lo local</small>
              </button>
              <button
                type="button"
                className={role === "seller" ? "selected" : ""}
                onClick={() => setRole("seller")}
              >
                <Store size={21} />
                <strong>Vendedor</strong>
                <small>Comparte tus productos</small>
              </button>
            </div>
            <Field
              label="Nombre completo"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
            />
          </>
        )}
        <Field
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          required
        />
        {register && (
          <Field
            label="Teléfono móvil"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="300 000 0000"
            required
          />
        )}
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          placeholder="Mínimo 8 caracteres"
          minLength={register ? 8 : 1}
          maxLength={128}
          required
        />
        {register && (
          <label className="check-label">
            <input type="checkbox" name="consent" required /> Autorizo el uso de
            mis datos para gestionar mi cuenta y facilitar contactos en esta
            plataforma.
          </label>
        )}
        <ErrorBox error={error} />
        <Submit busy={busy}>
          {register ? "Crear mi cuenta" : "Iniciar sesión"}{" "}
          <ArrowRight size={17} />
        </Submit>
      </form>
      {!register && (
        <details className="demo-accounts">
          <summary>Explorar con cuentas de demostración</summary>
          <p>
            Contraseña: <code>Florida2026!</code>
          </p>
          <p>
            Vendedor: <code>mayra@florida.demo</code>
            <br />
            Comprador: <code>vecino@florida.demo</code>
            <br />
            Administración: <code>admin@florida.demo</code>
          </p>
          <small>Datos ficticios. No envíes información sensible.</small>
        </details>
      )}
    </>
  );
}
