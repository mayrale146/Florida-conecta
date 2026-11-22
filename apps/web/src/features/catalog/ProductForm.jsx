import React, { useEffect, useState } from "react";
import { ArrowUpRight, Camera } from "lucide-react";
import { api } from "../../api.js";
import { Field, ErrorBox, Submit } from "../../shared/ui.jsx";

export function ProductForm({ ctx, product: p, onDone }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [image, setImage] = useState(p?.image || "/images/campo.jpg"),
    [file, setFile] = useState(null);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let url = p?.image || "/images/campo.jpg";
      if (file) {
        const body = new FormData();
        body.append("image", file);
        url = (await api("/uploads", { method: "POST", body })).url;
      }
      const body = {
        ...Object.fromEntries(new FormData(e.target)),
        image: url,
      };
      await api(p ? `/products/${p.id}` : "/products", {
        method: p ? "PUT" : "POST",
        body,
      });
      localStorage.removeItem("fc-draft");
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  let draft = {};
  if (!p) {
    try {
      draft = JSON.parse(localStorage.getItem("fc-draft") || "{}");
    } catch {}
  }
  const item = p || draft;
  return (
    <form className="form-stack" onSubmit={submit}>
      <p className="form-intro">
        Una buena foto y tu historia hacen la diferencia.
      </p>
      <label className="upload-zone">
        <img src={image} alt="Vista previa de la publicación" />
        <span>
          <Camera size={23} />
          <strong>
            {file ? "Cambiar fotografía" : "Agregar una fotografía"}
          </strong>
          <small>JPG, PNG o WebP · hasta 5 MB</small>
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Fotografía del producto"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (f.size > 5 * 1024 * 1024) {
                setError("La imagen supera 5 MB.");
                return;
              }
              if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
                setError("Selecciona JPG, PNG o WebP.");
                return;
              }
              if (image.startsWith("blob:")) URL.revokeObjectURL(image);
              setFile(f);
              setImage(URL.createObjectURL(f));
              setError("");
            }
          }}
        />
      </label>
      <Field
        label="Título de la publicación"
        name="title"
        defaultValue={item.title}
        placeholder="Ej. Panela artesanal 500 g"
        required
        maxLength={120}
      />
      <Field label="Categoría">
        <select
          name="category_id"
          required
          defaultValue={item.category_id || ""}
        >
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {ctx.data.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="form-columns">
        <Field
          label="Precio (COP)"
          name="price"
          type="number"
          min="0"
          max="100000000"
          step="1"
          defaultValue={item.price}
          required
          placeholder="8500"
        />
        <Field
          label="Unidades disponibles"
          name="stock"
          type="number"
          min="0"
          max="100000"
          step="1"
          defaultValue={item.stock}
          required
          placeholder="24"
        />
      </div>
      <Field label="Descripción">
        <textarea
          name="description"
          placeholder="Cuéntanos qué hace especial a tu producto o servicio…"
          defaultValue={item.description}
          required
          maxLength={3000}
          rows={4}
        />
      </Field>
      <ErrorBox error={error} />
      <Submit busy={busy}>
        {p ? "Guardar publicación" : "Publicar producto"}{" "}
        <ArrowUpRight size={18} />
      </Submit>
      {!p && (
        <button
          type="button"
          className="button"
          onClick={(e) => {
            const form = e.currentTarget.form;
            localStorage.setItem(
              "fc-draft",
              JSON.stringify(Object.fromEntries(new FormData(form))),
            );
            ctx.notice(
              "Borrador guardado en este dispositivo. La foto se selecciona al publicar.",
            );
          }}
        >
          Guardar borrador
        </button>
      )}
    </form>
  );
}
