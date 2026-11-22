export const money = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
export function dateLabel(date) {
  return new Date(date + "T12:00:00").toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
}
