import { closestCities } from "../shared/cities.js";
export const nearestCities = (origin, name, limit = 5) =>
  closestCities(origin, name, limit);
export function createNearbyCitiesHandler() {
  return async (req, res) => {
    const q = new URL(req.url, "http://localhost").searchParams;
    const lat = Number(q.get("lat")),
      lon = Number(q.get("lon")),
      name = (q.get("name") || "").trim();
    const valid =
      q.get("lat")?.trim() &&
      q.get("lon")?.trim() &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      name.length <= 100;
    res.writeHead(valid ? 200 : 400, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(
      JSON.stringify(
        valid
          ? closestCities({ lat, lon }, name)
          : { message: "Provide valid city coordinates." },
      ),
    );
  };
}
