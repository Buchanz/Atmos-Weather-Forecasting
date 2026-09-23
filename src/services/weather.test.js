import test from "node:test";
import assert from "node:assert/strict";
import {
  temperature,
  groupForecast,
  dateKey,
  weatherTheme,
  fetchWeather,
  findLocations,
} from "./weather.js";
test("Celsius and Fahrenheit conversions", () => {
  assert.equal(temperature(0, "F"), 32);
  assert.equal(temperature(100, "F"), 212);
  assert.equal(temperature(19.5, "C"), 20);
});
test("forecast respects destination dates and partial days", () => {
  const now = Date.UTC(2026, 8, 22, 20) / 1000,
    offset = 9 * 3600;
  const item = (dt, temp, pop) => ({
    dt,
    main: { temp_min: temp - 1, temp_max: temp + 1 },
    pop,
    weather: [{ id: 800 }],
  });
  assert.equal(dateKey(now, offset), "2026-09-23");
  const days = groupForecast(
    [
      item(now, 20, 0.1),
      item(now + 86400, 22, 0.2),
      item(now + 97200, 18, 0.6),
    ],
    offset,
    now,
  );
  assert.equal(days.length, 1);
  assert.equal(days[0].min, 17);
  assert.equal(days[0].max, 23);
  assert.equal(days[0].pop, 0.6);
  assert.equal(days[0].partial, true);
});
test("weather themes match API condition codes", () => {
  for (const [id, expected] of [
    [200, "storm"],
    [300, "rain"],
    [500, "rain"],
    [601, "snow"],
    [701, "mist"],
    [800, "sunny"],
    [801, "partly"],
    [803, "cloudy"],
  ])
    assert.equal(weatherTheme(id), expected);
  assert.equal(weatherTheme(800, true), "night");
});
test("browser requests only same-origin API endpoints, without credentials", async () => {
  const previous = globalThis.fetch;
  const urls = [];
  try {
    globalThis.fetch = async (url) => {
      urls.push(url);
      return {
        ok: true,
        json: async () =>
          url.includes("forecast")
            ? { list: [{ dt: 1 }] }
            : {
                weather: [{ id: 800 }],
                name: "London",
                sys: { country: "GB" },
              },
      };
    };
    const result = await fetchWeather({
      name: "London",
      country: "GB",
      lat: 51.5,
      lon: -0.1,
    });
    assert.equal(result.demo, false);
    for (const url of urls) {
      assert.ok(url.startsWith("/api/"));
      assert.ok(!url.includes("appid"));
    }
  } finally {
    globalThis.fetch = previous;
  }
});
test("empty geocoding results and backend errors are readable", async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => [] });
    await assert.rejects(findLocations("missing"), /No matching city/);
    globalThis.fetch = async () => ({
      ok: false,
      json: async () => ({ message: "Weather is busy." }),
    });
    await assert.rejects(findLocations("London"), /Weather is busy/);
  } finally {
    globalThis.fetch = previous;
  }
});

import { sceneForPlace } from "../data/scenes.js";
test("photos are restricted to the verified city, country and coordinates", () => {
  assert.equal(
    sceneForPlace({
      name: "Vancouver",
      country: "CA",
      lat: 49.28,
      lon: -123.12,
    }).id,
    "vancouver",
  );
  assert.equal(
    sceneForPlace({ name: "London", country: "GB", lat: 51.51, lon: -0.13 }).id,
    "london",
  );
  assert.equal(
    sceneForPlace({ name: "Tokyo", country: "JP", lat: 35.68, lon: 139.69 }).id,
    "tokyo",
  );
  for (const place of [
    { name: "London", country: "CA", lat: 42.98, lon: -81.25 },
    { name: "Vancouver", country: "US", lat: 45.64, lon: -122.66 },
    { name: "Vancouver Island", country: "CA", lat: 49.65, lon: -125.45 },
    { name: "Osaka", country: "JP", lat: 34.69, lon: 135.5 },
    { name: "London", country: "GB", lat: 55, lon: 1 },
    { name: "Vancouver", country: "CA" },
  ])
    assert.equal(sceneForPlace(place), null);
});

test("device location resolves to a photo-backed city before requesting its weather", async () => {
  const previous = globalThis.fetch,
    urls = [];
  try {
    globalThis.fetch = async (url) => {
      urls.push(url);
      return {
        ok: true,
        json: async () =>
          url.startsWith("/api/nearby")
            ? [
                {
                  name: "London",
                  country: "GB",
                  lat: 51.51,
                  lon: -0.13,
                  distanceKm: 12,
                },
              ]
            : url.includes("forecast")
              ? { list: [{ dt: 1 }] }
              : { weather: [{ id: 800 }], sys: { country: "GB" } },
      };
    };
    const result = await fetchWeather({ lat: 51.6, lon: -0.2 });
    assert.equal(result.place.name, "London");
    assert.ok(result.place.locationNote.includes("12 km"));
    assert.ok(
      urls
        .filter((url) => !url.startsWith("/api/nearby"))
        .every((url) => url.includes("lat=51.51") && url.includes("lon=-0.13")),
    );
  } finally {
    globalThis.fetch = previous;
  }
});
