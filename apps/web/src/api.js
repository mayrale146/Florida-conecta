export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers:
      options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json", ...options.headers },
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "No pudimos completar la solicitud.");
  return result;
}
const key = "florida-public-v1";
export function savedData() {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
export function saveData(data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* Storage can be full or disabled. */
  }
}
