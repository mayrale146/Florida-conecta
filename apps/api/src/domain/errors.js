export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function required(value, label, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new AppError(
      `${label}: ingresa un valor válido (máximo ${max} caracteres).`,
    );
  return value.trim();
}
export function integer(value, label, max = 100000000) {
  const n = Number(value);
  if (
    value === "" ||
    value == null ||
    !Number.isSafeInteger(n) ||
    n < 0 ||
    n > max
  )
    throw new AppError(`${label}: ingresa un número entero válido.`);
  return n;
}
