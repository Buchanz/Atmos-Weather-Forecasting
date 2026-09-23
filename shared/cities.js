import { scenes } from "../src/data/scenes.js";
export const normalize = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const countries = new Intl.DisplayNames(["en"], { type: "region" });
export const cities = scenes.map((scene) => ({
  id: scene.id,
  name: scene.name,
  country: scene.country,
  countryName: countries.of(scene.country),
  lat: scene.lat,
  lon: scene.lon,
  aliases: scene.aliases,
  photo: scene.src,
}));
export function searchCities(query) {
  const terms = normalize(query)
    .split(/[\s,]+/)
    .filter(Boolean);
  return cities
    .filter((city) =>
      terms.every((term) =>
        normalize(
          [city.name, city.country, city.countryName, ...city.aliases].join(
            " ",
          ),
        ).includes(term),
      ),
    )
    .sort(
      (a, b) =>
        Number(normalize(b.name).startsWith(normalize(query))) -
          Number(normalize(a.name).startsWith(normalize(query))) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 8);
}
export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  return (
    12742 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
            Math.cos(a.lat * rad) *
              Math.cos(b.lat * rad) *
              Math.sin(((b.lon - a.lon) * rad) / 2) ** 2,
        ),
      ),
    )
  );
}
export function closestCities(origin, excludeName = "", limit = 5) {
  return cities
    .map((city) => ({
      ...city,
      distanceKm: Math.round(distanceKm(origin, city) * 10) / 10,
    }))
    .filter(
      (city) =>
        !(
          normalize(city.name) === normalize(excludeName) &&
          city.distanceKm < 50
        ),
    )
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
