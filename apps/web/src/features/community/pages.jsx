import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Bell,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  ShieldCheck,
  Info,
  Download,
} from "lucide-react";
import { Empty } from "../../shared/ui.jsx";

export function Events({ ctx }) {
  const [month, setMonth] = useState(() =>
      new Date().toISOString().slice(0, 7),
    ),
    [all, setAll] = useState(false);
  const events = ctx.data.events.filter((e) => all || e.date.startsWith(month));
  const shift = (n) => {
    const d = new Date(month + "-15T12:00:00");
    d.setMonth(d.getMonth() + n);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setAll(false);
  };
  return (
    <>
      <div className="section-toolbar">
        <div className="month-picker">
          <button aria-label="Mes anterior" onClick={() => shift(-1)}>
            <ChevronLeft size={19} />
          </button>
          <strong>
            {new Date(month + "-15T12:00:00").toLocaleDateString("es-CO", {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <button aria-label="Mes siguiente" onClick={() => shift(1)}>
            <ChevronRight size={19} />
          </button>
        </div>
        <button className="text-button" onClick={() => setAll(!all)}>
          {all ? "Ver este mes" : "Ver todos los eventos"}
        </button>
        <button
          className="button primary"
          onClick={() => ctx.requireUser(() => ctx.setModal({ type: "event" }))}
        >
          <Plus size={18} /> Publicar un evento
        </button>
      </div>
      <div className="events-layout">
        <div className="event-list">
          {events.map((e) => {
            const d = new Date(e.date + "T12:00:00");
            return (
              <article className="event-card" key={e.id}>
                <div className="date-block">
                  <strong>{d.getDate()}</strong>
                  <span>
                    {d
                      .toLocaleDateString("es-CO", { month: "short" })
                      .replace(".", "")}
                  </span>
                </div>
                <div>
                  <span className="tag light">ENCUENTRO LOCAL</span>
                  <h2>{e.title}</h2>
                  <p>
                    <Clock size={15} />
                    {e.time} <span>·</span>
                    <MapPin size={15} />
                    {e.place}
                  </p>
                  <small>Organiza: {e.organizer}</small>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Guardar ${e.title} en calendario`}
                  onClick={() => downloadEvent(e)}
                >
                  <Download size={20} />
                </button>
              </article>
            );
          })}
          {!events.length && (
            <Empty
              icon={CalendarDays}
              title="Un mes por llenar de encuentros"
              text="No hay eventos publicados para este mes. Explora los próximos o comparte un plan."
            />
          )}
        </div>
        <aside className="community-note">
          <CalendarDays size={35} />
          <h2>
            Los mejores planes
            <br />
            se viven cerca.
          </h2>
          <p>
            Ferias, cultura, sabores y encuentros. Este es el lugar para
            enterarte y participar.
          </p>
          <span>Nos vemos en Florida. ♡</span>
        </aside>
      </div>
    </>
  );
}

function downloadEvent(e) {
  const esc = (s) =>
    s.replace(/[\\;,\n]/g, (c) => "\\" + (c === "\n" ? "n" : c));
  const date =
    e.date.replaceAll("-", "") + "T" + e.time.replace(":", "") + "00";
  const content = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//FloridaConecta//ES\r\nBEGIN:VEVENT\r\nUID:event-${e.id}@floridaconecta.local\r\nDTSTAMP:${new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(
      /\.\d{3}/,
      "",
    )}\r\nDTSTART;TZID=America/Bogota:${date}\r\nSUMMARY:${esc(e.title)}\r\nLOCATION:${esc(e.place)}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/calendar;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `florida-evento-${e.id}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Alerts({ ctx }) {
  const [filter, setFilter] = useState("Todas");
  return (
    <>
      <div className="info-banner">
        <Info size={20} />
        <p>
          Información de carácter comunitario. No reemplaza las líneas oficiales
          de emergencia ni de seguridad.
        </p>
      </div>
      <div className="section-toolbar">
        <div className="chips">
          {["Todas", "Servicios", "Comunidad", "Tránsito"].map((c) => (
            <button
              key={c}
              className={c === filter ? "chip active" : "chip"}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
        {ctx.user?.role === "admin" && (
          <button
            className="button primary"
            onClick={() => ctx.setModal({ type: "alert" })}
          >
            <Plus size={17} /> Publicar aviso
          </button>
        )}
      </div>
      <div className="alerts-grid">
        {ctx.data.alerts
          .filter((a) => filter === "Todas" || a.category === filter)
          .map((a) => (
            <article key={a.id} className="alert-card">
              <span
                className={`tag ${a.category === "Tránsito" ? "orange" : ""}`}
              >
                {a.category}
              </span>
              <Bell size={20} className="alert-card-icon" />
              <h2>{a.title}</h2>
              <p>{a.body}</p>
              <small>
                <ShieldCheck size={14} /> Administración ·{" "}
                {new Date(
                  a.created_at.replace(" ", "T") + "Z",
                ).toLocaleDateString("es-CO")}
              </small>
            </article>
          ))}
      </div>
    </>
  );
}
