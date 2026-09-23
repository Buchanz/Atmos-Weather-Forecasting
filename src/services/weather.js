import { apiUrl } from "./urls.js";
import { prefetchCityPhoto } from "./cityPhotos.js";
export const temperature = (value, unit) =>
  Math.round(unit === "F" ? (value * 9) / 5 + 32 : value);
export const localDate = (dt, offset) => new Date((dt + offset) * 1000);
export const dateKey = (dt, offset) =>
  localDate(dt, offset).toISOString().slice(0, 10);
export const clock = (dt, offset) =>
  localDate(dt, offset).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
export function groupForecast(list, offset, now) {
  const groups = new Map();
  for (const item of list) {
    const key = dateKey(item.dt, offset);
    if (key <= dateKey(now, offset)) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups].slice(0, 5).map(([date, entries]) => ({
    date,
    dt: entries[0].dt,
    min: Math.min(...entries.map((x) => x.main.temp_min)),
    max: Math.max(...entries.map((x) => x.main.temp_max)),
    pop: Math.max(...entries.map((x) => x.pop || 0)),
    weather: entries.reduce((a, b) =>
      Math.abs(localDate(a.dt, offset).getUTCHours() - 12) <
      Math.abs(localDate(b.dt, offset).getUTCHours() - 12)
        ? a
        : b,
    ).weather[0],
    partial: entries.length < 8,
  }));
}
export function weatherTheme(id, night = false) {
  if (id < 300) return "storm";
  if (id < 600) return "rain";
  if (id < 700) return "snow";
  if (id < 800) return "mist";
  if (id === 800) return night ? "night" : "sunny";
  if (id === 801) return night ? "night" : "partly";
  return "cloudy";
}
async function request(path, params, signal) {
  let response;
  try {
    response = await fetch(apiUrl(`${path}?${new URLSearchParams(params)}`), {
      signal,
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error(
      "Unable to connect. Check your internet connection and try again.",
    );
  }
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.message || "Weather is temporarily unavailable.");
  return body;
}
export async function findLocations(query, signal) {
  const places = await request("/api/locations", { q: query }, signal);
  if (!places.length)
    throw new Error(
      "No matching city found. Try a city and country, such as London, GB.",
    );
  return places;
}
export async function fetchWeather(place, signal) {
  let selected = place;
  if (!place.name) {
    const places = await request(
      "/api/nearby",
      { lat: place.lat, lon: place.lon },
      signal,
    );
    if (!places.length)
      throw new Error("No supported city found. Search for a city.");
    selected = {
      ...places[0],
      locationNote: `Closest supported city · ${Math.round(places[0].distanceKm)} km from your location`,
    };
  }
  prefetchCityPhoto(selected);
  const params = { lat: selected.lat, lon: selected.lon };
  const [current, forecast] = await Promise.all([
    request("/api/current", params, signal),
    request("/api/forecast", params, signal),
  ]);
  if (!current.weather?.length || !forecast.list?.length)
    throw new Error(
      "The weather service returned incomplete data. Please try again.",
    );
  return {
    current,
    list: forecast.list,
    place: {
      ...selected,
      name: selected.name || current.name,
      country: selected.country || current.sys.country,
    },
    demo: false,
  };
}
