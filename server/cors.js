/** Allow the configured Pages origin to read the backend's public weather API. */
export function applyCors(req, res, allowedOrigin = "") {
  if (!req.url.startsWith("/api/")) return false;
  res.setHeader("Vary", "Origin");
  if (allowedOrigin && req.headers.origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(
      req.headers.origin === allowedOrigin && allowedOrigin ? 204 : 403,
    );
    res.end();
    return true;
  }
  return false;
}
