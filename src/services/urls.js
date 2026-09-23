// The public backend URL contains no API key. Local development stays same-origin.
export const apiUrl = (path) =>
  `${(import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "")}${path}`;
export const assetUrl = (path) =>
  path?.startsWith("/")
    ? `${import.meta.env?.BASE_URL || "/"}${path.slice(1)}`
    : path;
