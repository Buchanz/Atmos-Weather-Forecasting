import { searchCities, closestCities } from "../shared/cities.js";
import { sceneForPlace } from "../src/data/scenes.js";
import { createSuggestionHandler } from "./suggestions.js";
import { createNearbyCitiesHandler } from "./nearbyCities.js";

/** A single API handler shared by development and the production server. */
export function createApiHandler({
  key = "",
  fetcher = fetch,
  now = Date.now,
} = {}) {
  const suggestions = createSuggestionHandler();
  const nearby = createNearbyCitiesHandler();
  const cache = new Map(),
    pending = new Map();
  let windowStart = now(),
    requests = 0;
  return async (
    req,
    res,
    next = () => {
      res.writeHead(404);
      res.end();
    },
  ) => {
    const send = (status, data) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(data));
    };
    let url;
    try {
      url = new URL(req.url, "http://localhost");
    } catch {
      return send(400, { message: "Invalid request URL." });
    }
    if (!url.pathname.startsWith("/api/")) return next();
    if (req.method !== "GET")
      return send(405, { message: "Method not allowed." });
    if (url.pathname === "/api/status")
      return send(200, { configured: Boolean(key) });
    if (url.pathname === "/api/suggestions") return suggestions(req, res);
    if (url.pathname === "/api/nearby-cities") return nearby(req, res);
    if (url.pathname === "/api/locations") {
      const query = (url.searchParams.get("q") || "").trim();
      if (!query || query.length > 100)
        return send(400, {
          message: "Enter a city name of up to 100 characters.",
        });
      return send(200, searchCities(query));
    }
    const routes = { "/api/current": "weather", "/api/forecast": "forecast" };
    if (
      !routes[url.pathname] &&
      !["/api/nearby", "/api/city-photo"].includes(url.pathname)
    )
      return send(404, { message: "Unknown endpoint." });
    const latitude = url.searchParams.get("lat"),
      longitude = url.searchParams.get("lon");
    const lat = Number(latitude),
      lon = Number(longitude);
    if (
      !latitude?.trim() ||
      !longitude?.trim() ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      Math.abs(lat) > 90 ||
      Math.abs(lon) > 180
    )
      return send(400, { message: "Provide valid latitude and longitude." });
    if (url.pathname === "/api/nearby")
      return send(200, closestCities({ lat, lon }));
    if (url.pathname === "/api/city-photo")
      return send(200, {
        scene: sceneForPlace({
          name: url.searchParams.get("name") || "",
          country: url.searchParams.get("country") || "",
          lat,
          lon,
        }),
      });
    if (!key)
      return send(503, {
        message: "Live weather has not been configured by the site owner yet.",
      });
    const id = `${routes[url.pathname]}:${lat}:${lon}`,
      saved = cache.get(id);
    if (saved?.expires > now()) return send(200, saved.data);
    if (!pending.has(id)) {
      if (now() - windowStart >= 60000) {
        windowStart = now();
        requests = 0;
      }
      if (++requests > 45)
        return send(429, {
          message: "Weather is busy right now. Try again in a minute.",
        });
      pending.set(
        id,
        (async () => {
          try {
            const params = new URLSearchParams({
              lat: String(lat),
              lon: String(lon),
              units: "metric",
              appid: key,
            });
            const response = await fetcher(
              `https://api.openweathermap.org/data/2.5/${routes[url.pathname]}?${params}`,
              { signal: AbortSignal.timeout(10000) },
            );
            if (!response.ok)
              return {
                status: response.status === 429 ? 429 : 502,
                data: {
                  message:
                    response.status === 401
                      ? "The weather service credentials need attention from the site owner."
                      : "Weather is temporarily unavailable. Please try again shortly.",
                },
              };
            const data = await response.json();
            const readings =
              url.pathname === "/api/current" ? [data] : data.list;
            if (
              !Array.isArray(readings) ||
              !readings.length ||
              readings.some(
                (item) =>
                  !Number.isFinite(item.main?.temp) || !item.weather?.length,
              )
            )
              throw new Error("Incomplete weather");
            if (cache.size >= 500) cache.delete(cache.keys().next().value);
            cache.set(id, { data, expires: now() + 300000 });
            return { status: 200, data };
          } catch {
            return {
              status: 502,
              data: { message: "Unable to load weather. Please try again." },
            };
          }
        })().finally(() => pending.delete(id)),
      );
    }
    const result = await pending.get(id);
    return send(result.status, result.data);
  };
}
