import React, { useEffect, useState } from "react";
import { CalendarDays, Bell } from "lucide-react";
import { api } from "../../api.js";
import { Field, ErrorBox, Submit } from "../../shared/ui.jsx";

export function EventForm({ onDone }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await api("/events", {
            method: "POST",
            body: Object.fromEntries(new FormData(e.target)),
          });
          onDone();
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Nombre del evento" name="title" required maxLength={150} />
      <div className="form-columns">
        <Field label="Fecha" name="date" type="date" required />
        <Field label="Hora de inicio" name="time" type="time" required />
      </div>
      <Field label="Lugar" name="place" required maxLength={150} />
      <Field label="Organiza" name="organizer" required maxLength={150} />
      <ErrorBox error={error} />
      <Submit busy={busy}>
        Publicar evento <CalendarDays size={18} />
      </Submit>
    </form>
  );
}

export function AlertForm({ onDone }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await api("/alerts", {
            method: "POST",
            body: Object.fromEntries(new FormData(e.target)),
          });
          onDone();
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="Categoría">
        <select name="category">
          {["Servicios", "Comunidad", "Tránsito"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="Título del aviso" name="title" required maxLength={150} />
      <Field label="Mensaje">
        <textarea name="body" required maxLength={2000} rows={5} />
      </Field>
      <ErrorBox error={error} />
      <Submit busy={busy}>
        Publicar aviso <Bell size={18} />
      </Submit>
    </form>
  );
}
