import { applyCors } from "./cors.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { createApiHandler } from "./api.js";

const envFile = fileURLToPath(new URL("../.env.local", import.meta.url));
if (!process.env.OPENWEATHER_API_KEY && existsSync(envFile))
  process.loadEnvFile(envFile);
const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
const api = createApiHandler({ key: process.env.OPENWEATHER_API_KEY });
const server = createServer((req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "geolocation=(self)");
  if (applyCors(req, res, process.env.FRONTEND_ORIGIN)) return;
  api(req, res, async () => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end("Method not allowed");
      return;
    }
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      const target = resolve(
        dist,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (!target.startsWith(resolve(dist) + sep) || pathname.includes("\0")) {
        res.writeHead(400);
        res.end("Invalid path");
        return;
      }
      const info = await stat(target);
      if (!info.isFile()) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const cache = pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : pathname.startsWith("/scenes/")
          ? "public, max-age=86400"
          : "no-cache";
      res.writeHead(200, {
        "Content-Type": types[extname(target)] || "application/octet-stream",
        "Content-Length": info.size,
        "Cache-Control": cache,
      });
      res.end(req.method === "HEAD" ? undefined : await readFile(target));
    } catch (error) {
      res.writeHead(error instanceof URIError ? 400 : 404);
      res.end("Not found");
    }
  }).catch(() => {
    if (!res.headersSent)
      res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ message: "Something went wrong. Please try again." }),
    );
  });
});
server.listen(Number(process.env.PORT) || 3000, "0.0.0.0", () =>
  console.log("Atmos production server is running."),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => server.close(() => process.exit(0)));
