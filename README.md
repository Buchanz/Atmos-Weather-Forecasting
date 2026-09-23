# Atmos — React Weather Forecast

A photo-first weather application built with React and Vite, with a Node.js backend that keeps the OpenWeather API key out of the browser. Search and nearby suggestions use a shared catalog of cities with bundled photographs, so every selectable city has an assigned image.

## Run locally

Requires **Node.js 22.12 or newer** and npm.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Set `OPENWEATHER_API_KEY` in `.env.local` to your OpenWeather key.
4. Run `npm run dev` and open the localhost URL printed by Vite.

Register for a key at [OpenWeather](https://home.openweathermap.org/api_keys). Restart the development server after changing the key. Never use a `VITE_` prefix for this secret. `.env.local` is excluded from Git. Without a key, the app clearly explains that live weather is unavailable; it does not substitute fictional weather.

## Features and behavior

- Current temperature, conditions, feels-like temperature, humidity, wind, sunrise and sunset.
- Celsius/Fahrenheit toggle, including corresponding wind-speed units.
- Three-hour forecast intervals and five-day summaries, with partial days marked.
- City autocomplete with country labels, keyboard navigation and cancellation of stale searches.
- Nearby suggestions exclude the current city and rank other photographed cities by distance.
- On opening, the browser requests location access. The app loads the **closest supported photographed city**, and labels its distance from the user's position. No default Vancouver weather is shown. If permission is denied, manual search remains available.
- Local photographs with source, author and license credits. A plain background remains while a photo loads; there is no unrelated city or illustrated placeholder.
- Responsive full-screen layout, static weather icons, hover effects and smooth overlay/photo transitions. Click outside, Back, Close or Escape to collapse expanded details.
- Loading states and readable errors for invalid requests, timeouts, missing credentials, provider failures and denied location access.

### Scope and limitations

Search intentionally lists only cities in the photo catalog. It does not claim worldwide coverage. See [CITY-COVERAGE.md](CITY-COVERAGE.md) for the exact supported set. New cities must have a reviewed local photo and attribution before becoming selectable. Nearby results may be farther away in regions with limited coverage; distances are shown.

The five-day endpoint provides three-hour intervals, not five separate daily forecasts. Daily ranges and rain probabilities are aggregated from the available intervals; incomplete days are marked. Time labels use the provider's UTC offset, which does not predict future daylight-saving changes. Photos are illustrative, not live weather cameras. Capture years are shown where verified.

## Backend design

`server/api.js` is used by both Vite middleware and the production Node server. The browser contacts same-origin endpoints; only the backend sends the API key to OpenWeather.

| Endpoint                                                   | Purpose                                                   |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `GET /api/status`                                          | Whether a server key is configured; never returns the key |
| `GET /api/suggestions?q=...`                               | Search the photo-backed city catalog                      |
| `GET /api/locations?q=...`                                 | Catalog lookup                                            |
| `GET /api/nearby?lat=...&lon=...`                          | Closest supported cities for location access              |
| `GET /api/nearby-cities?lat=...&lon=...&name=...`          | Closest alternatives, excluding the current city          |
| `GET /api/current?lat=...&lon=...`                         | Current OpenWeather measurements                          |
| `GET /api/forecast?lat=...&lon=...`                        | OpenWeather five-day / three-hour forecast                |
| `GET /api/city-photo?name=...&country=...&lat=...&lon=...` | Strict catalog photo lookup                               |

Weather requests validate coordinates, time out after ten seconds, validate provider responses, cache successful results for five minutes, and share concurrent identical requests. The cache is bounded to 500 entries. At most 45 new upstream weather requests per minute are allowed per process. Errors never include upstream URLs or secrets. These in-memory limits reset on restart and are not distributed across multiple server instances; this is appropriate for the class deployment, not a multi-instance production service.

City suggestions and photographs are local and do not consume weather API calls. The server also supplies security headers, content types, cache headers, safe static paths and graceful shutdown.

## Code organization

- `src/App.jsx` — location welcome screen and weather dashboard.
- `src/components/` — search, weather details, forecasts, photo background and static weather icons.
- `src/hooks/` — weather requests, location permission, nearby suggestions and photo selection.
- `src/services/weather.js` — API calls, unit conversions and forecast/date aggregation.
- `src/data/` — reviewed photo catalogs and strict photo matching.
- `shared/cities.js` — the same searchable city catalog and distance calculations for client and server.
- `server/api.js` — weather proxy, validation, caching, deduplication and request limits.
- `server/start.js` — production HTTP server and static file serving.
- `public/scenes/` — bundled city images.
- `server/api.test.js`, `src/services/weather.test.js` — behavior-focused tests.

## Libraries and credits

React/React DOM provide components and hooks. Vite and its React plugin provide development and builds. Lucide React supplies interface icons. Static Meteocons SVGs by Bas Milius are MIT-licensed; see `METEOCONS-LICENSE.txt`. CSS handles layout and transitions. Prettier formats source files; tests use Node's built-in test runner. Google Fonts provides DM Sans and Manrope, with system fallbacks.

Photo authors, sources and license links are recorded in [PHOTO-CREDITS.md](PHOTO-CREDITS.md). Bundled images retain their original licenses; displayed crops are identified in the credits.

## Checks

```sh
npm test
npm run format:check
npm run build
```

Run `npm run format` after editing. The included GitHub Actions workflow runs these checks when the project is pushed to GitHub.

Before handing in, test location allow/deny, keyboard search, unit changes, all detail panels, and narrow-screen layouts in an actual browser. Automated tests and a successful build do not replace visual review.

## Production and submission

```sh
npm run build
npm start
```

The server listens on `PORT` (default 3000). Locally, it reads `.env.local` if no environment key is set. On a Node-capable host, set `OPENWEATHER_API_KEY` as a server-side environment secret and use `npm start`. Deploy the project with its `server`, `shared`, `src/data`, and built `dist` folders; do not upload the secret file. Static-only hosting cannot run this backend. Use HTTPS for browser location access outside localhost.

The assignment also requires a GitHub repository URL and a public website URL. These are still separate submission steps; a localhost link is not a published website. Add the final URLs and any instructor notes here before submitting.

## OpenWeather documentation

- [Current weather](https://openweathermap.org/current)
- [Five-day / three-hour forecast](https://openweathermap.org/forecast5)

## GitHub Pages deployment

Pages hosts the React interface only. The existing Node server must be hosted separately so the OpenWeatherMap key remains private.

1. Push this project to the repository's `main` branch. Never commit `.env.local`.
2. Deploy the same repository to a Node host with `npm ci && npm run build` as its build command and `npm start` as its start command. Use Node 22.12 or later.
3. On the backend host, set `OPENWEATHER_API_KEY` privately and `FRONTEND_ORIGIN` to the Pages origin, such as `https://YOUR-USERNAME.github.io` (no repository path or trailing slash).
4. In the GitHub repository's Actions variables, set `VITE_API_BASE_URL` to the backend HTTPS origin (no trailing path). This URL is public; it is not the API key.
5. In Settings → Pages, select GitHub Actions as the source, then run **Deploy GitHub Pages**. The workflow detects the repository base path and publishes `dist` after tests pass.
6. Check the public website's search, location permission, unit toggle, forecast, photographs, and mobile layout. Add the repository and website links to the submission.

The Pages workflow intentionally refuses to deploy without a backend URL. No OpenWeatherMap secret is needed in GitHub Actions or the browser build. Local `npm run dev` still runs the API on the same origin.

### Render backend for this repository

Use [Deploy to Render](https://dashboard.render.com/select-repo?type=blueprint&repo=https%3A%2F%2Fgithub.com%2FBuchanz%2FAtmos-Weather-Forecasting) to deploy the included `render.yaml`. Sign in, select this repository, and enter `OPENWEATHER_API_KEY` in Render's private environment-variable field when prompted. The blueprint selects a free Node web service and configures the allowed GitHub Pages origin. No database is required.

After the deployment succeeds, copy its actual HTTPS service URL into this GitHub repository's `VITE_API_BASE_URL` Actions variable, enable Pages with GitHub Actions, and run the Pages workflow. Do not guess the service URL; Render may add a suffix.

Render's free web service sleeps after 15 minutes without traffic. The initial connection can therefore take longer while the server wakes. See [Render's free service limits](https://render.com/docs/free).

Repository: https://github.com/Buchanz/Atmos-Weather-Forecasting

Expected Pages address after successful deployment: https://buchanz.github.io/Atmos-Weather-Forecasting/
