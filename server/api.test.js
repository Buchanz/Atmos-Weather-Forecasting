import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { createApiHandler } from "./api.js";
import { cities } from "../shared/cities.js";

async function call(handler, url, method = "GET") {
  let status, body;
  await handler(
    { url, method },
    {
      writeHead(code) {
        status = code;
      },
      end(value) {
        body = value ? JSON.parse(value) : null;
      },
    },
  );
  return { status, body };
}
const current = { main: { temp: 19 }, weather: [{ id: 800 }], dt: 1 };
const ok = (data) => ({ ok: true, json: async () => data });

test("status never exposes credentials; weather requires configuration", async () => {
  assert.deepEqual(
    (await call(createApiHandler({ key: "private-test-key" }), "/api/status"))
      .body,
    { configured: true },
  );
  assert.equal(
    (await call(createApiHandler(), "/api/current?lat=1&lon=2")).status,
    503,
  );
});
test("validates coordinates, methods, city queries and unknown routes", async () => {
  const api = createApiHandler({
    key: "private-test-key",
    fetcher: () => {
      throw new Error("must not call");
    },
  });
  for (const url of [
    "/api/current?lat=91&lon=2",
    "/api/current?lat=&lon=2",
    "/api/current?lat=foo&lon=2",
    "/api/current?lat=0&lon=181",
    "/api/locations?q=",
    "/api/suggestions?q=x",
  ])
    assert.equal((await call(api, url)).status, 400);
  assert.equal((await call(api, "/api/unknown")).status, 404);
  assert.equal((await call(api, "/api/current", "POST")).status, 405);
});
test("backend credentials stay upstream and cached requests avoid provider calls", async () => {
  let calls = 0;
  const api = createApiHandler({
    key: "private-test-key",
    fetcher: async (url) => {
      calls++;
      const parsed = new URL(url);
      assert.equal(parsed.hostname, "api.openweathermap.org");
      assert.equal(parsed.searchParams.get("appid"), "private-test-key");
      assert.equal(parsed.searchParams.get("units"), "metric");
      return ok(current);
    },
  });
  const first = await call(api, "/api/current?lat=49&lon=-123&appid=attacker");
  assert.equal(first.status, 200);
  assert.ok(!JSON.stringify(first).includes("private-test-key"));
  await call(api, "/api/current?lat=49&lon=-123");
  assert.equal(calls, 1);
});
test("simultaneous identical weather requests share one upstream call", async () => {
  let calls = 0;
  const api = createApiHandler({
    key: "key",
    fetcher: async () => {
      calls++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return ok(current);
    },
  });
  const results = await Promise.all(
    Array.from({ length: 5 }, () => call(api, "/api/current?lat=1&lon=2")),
  );
  assert.ok(results.every((r) => r.status === 200));
  assert.equal(calls, 1);
});
test("cache expires after five minutes", async () => {
  let clock = 0,
    calls = 0;
  const api = createApiHandler({
    key: "key",
    now: () => clock,
    fetcher: async () => {
      calls++;
      return ok(current);
    },
  });
  await call(api, "/api/current?lat=1&lon=2");
  clock = 300001;
  await call(api, "/api/current?lat=1&lon=2");
  assert.equal(calls, 2);
});
test("provider errors, malformed JSON and incomplete data return safe errors", async () => {
  for (const fetcher of [
    async () => ({ ok: false, status: 401 }),
    async () => {
      throw new Error("private-test-key");
    },
    async () => ok({}),
    async () => ({
      ok: true,
      json: async () => {
        throw new Error("invalid JSON");
      },
    }),
  ]) {
    const result = await call(
      createApiHandler({ key: "private-test-key", fetcher }),
      "/api/current?lat=1&lon=2",
    );
    assert.equal(result.status, 502);
    assert.ok(!JSON.stringify(result).includes("private-test-key"));
  }
});
test("rate limits uncached weather requests and resets after one minute", async () => {
  let clock = 0;
  const api = createApiHandler({
    key: "key",
    now: () => clock,
    fetcher: async () => ok(current),
  });
  for (let i = 0; i < 45; i++)
    assert.equal((await call(api, `/api/current?lat=${i}&lon=0`)).status, 200);
  assert.equal((await call(api, "/api/current?lat=46&lon=0")).status, 429);
  clock = 60001;
  assert.equal((await call(api, "/api/current?lat=46&lon=0")).status, 200);
});
test("search and nearby results only contain cities with assigned local photos", async () => {
  const api = createApiHandler({
    fetcher: () => {
      throw new Error("must not fetch");
    },
  });
  for (const city of cities) {
    await access(new URL(`../public${city.photo}`, import.meta.url));
    const result = await call(
      api,
      "/api/suggestions?" + new URLSearchParams({ q: city.name }),
    );
    assert.ok(
      result.body.some((p) => p.id === city.id),
      city.name,
    );
    assert.ok(result.body.every((p) => p.photo.startsWith("/scenes/")));
  }
  for (const [name, lat, lon] of [
    ["Vancouver", 49.28, -123.12],
    ["London", 51.5, -0.12],
    ["Remote island", -54.4, 3.35],
  ]) {
    const { body, status } = await call(
      api,
      "/api/nearby-cities?" + new URLSearchParams({ name, lat, lon }),
    );
    assert.equal(status, 200);
    assert.ok(body.length >= 2);
    assert.ok(body.every((p) => p.name !== name));
    assert.ok(
      body.every((p, i, all) => !i || p.distanceKm >= all[i - 1].distanceKm),
    );
  }
  assert.deepEqual((await call(api, "/api/suggestions?q=Area%20A")).body, []);
});
test("unsupported cities do not receive another city photo", async () => {
  const api = createApiHandler();
  assert.equal(
    (
      await call(
        api,
        "/api/city-photo?name=London&country=CA&lat=42.98&lon=-81.25",
      )
    ).body.scene,
    null,
  );
  assert.ok(
    (
      await call(
        api,
        "/api/city-photo?name=London&country=GB&lat=51.51&lon=-0.13",
      )
    ).body.scene,
  );
});

test("only the configured frontend origin receives cross-origin access", async () => {
  const { applyCors } = await import("./cors.js");
  const allowed = "https://example.github.io";
  function check(origin, method = "GET") {
    const headers = {};
    const res = {
      setHeader(k, v) {
        headers[k] = v;
      },
      writeHead(s) {
        this.status = s;
      },
      end() {},
    };
    const handled = applyCors(
      { url: "/api/current", method, headers: { origin } },
      res,
      allowed,
    );
    return { headers, status: res.status, handled };
  }
  assert.equal(check(allowed).headers["Access-Control-Allow-Origin"], allowed);
  assert.equal(
    check("https://other.example").headers["Access-Control-Allow-Origin"],
    undefined,
  );
  assert.equal(check(allowed, "OPTIONS").status, 204);
  assert.equal(check("https://other.example", "OPTIONS").status, 403);
});
