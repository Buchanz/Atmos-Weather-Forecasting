import { useEffect, useRef, useState } from "react";
import {
  LocateFixed,
  RefreshCw,
  X,
  ArrowUpRight,
  ArrowLeft,
  LoaderCircle,
} from "lucide-react";
import useWeather from "./hooks/useWeather";
import useCitySuggestions from "./hooks/useCitySuggestions";
import useNearbyCities from "./hooks/useNearbyCities";
import { prefetchCityPhoto } from "./services/cityPhotos";
import { WeatherIcon } from "./components/WeatherVisual";
import SceneBackground from "./components/SceneBackground";
import CitySearch from "./components/CitySearch";
import WeatherDetails from "./components/WeatherDetails";
import { HourlyForecast, DailyForecast } from "./components/Forecast";
import { localDate, clock, temperature } from "./services/weather";
import useCityPhoto from "./hooks/useCityPhoto";

const sections = [
  ["details", "Weather details"],
  ["hourly", "Next hours"],
  ["daily", "5-day forecast"],
];

export default function App() {
  const weather = useWeather();
  const nearby = useNearbyCities(weather.configured);
  const locatedInitially = useRef(null);
  useEffect(() => {
    if (
      weather.configured &&
      nearby.position &&
      locatedInitially.current !== nearby.position
    ) {
      locatedInitially.current = nearby.position;
      weather.select(nearby.position);
    }
  }, [weather.configured, nearby.position]);
  if (!weather.data)
    return (
      <main className="welcome-screen">
        <section className="welcome-card">
          <div className="wordmark">atmos.</div>
          <LocateFixed size={32} />
          <h1>
            {weather.loading && nearby.position
              ? "Loading your local weather"
              : "Weather where you are"}
          </h1>
          <p role="status">
            {weather.error ||
              nearby.message ||
              (nearby.position
                ? "Finding your city and its weather…"
                : "Allow location access to find the closest city with a photo, or search below.")}
          </p>
          {(weather.loading || nearby.pending) && (
            <LoaderCircle className="spin" size={20} />
          )}
          <CitySearch
            nearby={nearby}
            configured={weather.configured}
            disabled={weather.configured === null || weather.loading}
            onSelect={(place) => {
              locatedInitially.current = nearby.position;
              prefetchCityPhoto(place);
              weather.select(place);
            }}
          />
          <button
            className="welcome-locate"
            onClick={weather.locate}
            disabled={!weather.configured || weather.loading}
          >
            Use my location
          </button>
        </section>
      </main>
    );
  return <WeatherDashboard weather={weather} nearby={nearby} />;
}

function WeatherDashboard({ weather, nearby }) {
  const {
    data,
    loading,
    error,
    configured,
    select,
    locate,
    refresh,
    dismissError,
  } = weather;
  const citySuggestions = useCitySuggestions(data.place, configured);
  const [unit, setUnit] = useState("C");
  const [expanded, setExpanded] = useState(null);
  const [loadedPhoto, setLoadedPhoto] = useState(null);
  const panelRef = useRef(null);
  const headingRef = useRef(null);
  const lastTrigger = useRef(null);
  const { scene, photoLoading } = useCityPhoto(data.place);
  const locationKey = `${data.place.lat}:${data.place.lon}:${data.demo}`;
  const w = data.current;
  const night =
    w.weather[0].icon?.endsWith("n") ??
    (!data.demo && (w.dt < w.sys.sunrise || w.dt > w.sys.sunset));
  const places = citySuggestions.items.slice(0, 3);
  const summary = [
    ["Feels like", `${temperature(w.main.feels_like, unit)}°`],
    ["Humidity", `${w.main.humidity}%`],
    [
      "Wind",
      `${Math.round(w.wind.speed * (unit === "F" ? 2.23694 : 3.6))} ${unit === "F" ? "mph" : "km/h"}`,
    ],
    ["Rain chance", `${Math.round((data.list[0]?.pop || 0) * 100)}%`],
  ];

  useEffect(() => {
    if (!expanded) {
      lastTrigger.current?.focus({ preventScroll: true });
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === "Escape") {
        setExpanded(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);
  useEffect(() => {
    if (!expanded) return;
    const onOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target))
        setExpanded(null);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [expanded]);
  function openSection(section, event) {
    lastTrigger.current = event.currentTarget;
    setExpanded(section);
  }
  function closeSection() {
    setExpanded(null);
  }
  function choose(place) {
    prefetchCityPhoto(place);
    select(place);
    setExpanded(null);
  }

  return (
    <div
      className="weather-page"
      style={{ "--outer-scene": scene ? `url("${scene.src}")` : "none" }}
    >
      <main
        className={`weather-window ${expanded ? "is-expanded" : ""}`}
        aria-busy={loading}
      >
        <SceneBackground
          key={locationKey}
          scene={scene}
          onPhotoLoad={setLoadedPhoto}
        />
        <section className="scenic-view" aria-label="Current weather">
          <header className="scene-header">
            <a className="wordmark" href="/">
              atmos<span>.</span>
            </a>
            <span className="live-label">
              {loading ? (
                <>
                  <LoaderCircle size={12} className="spin" /> Updating
                </>
              ) : data.demo ? (
                "Sample weather"
              ) : (
                "Live weather"
              )}
            </span>
          </header>
          <div className="scene-summary" key={locationKey}>
            <div className="large-temperature">
              {temperature(w.main.temp, unit)}
              <span>°</span>
            </div>
            <div className="city-summary">
              <h1>{data.place.name}</h1>
              <p>
                {data.place.locationNote && (
                  <>
                    {data.place.locationNote}
                    <br />
                  </>
                )}
                {clock(w.dt, w.timezone)} ·{" "}
                {localDate(w.dt, w.timezone).toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  timeZone: "UTC",
                })}
              </p>
            </div>
            <div className="condition-summary">
              <WeatherIcon id={w.weather[0].id} night={night} size={66} />
              <span>{w.weather[0].description}</span>
            </div>
          </div>
          <div className="scene-footer">
            {scene && loadedPhoto === scene.src ? (
              <a
                href={scene.source}
                target="_blank"
                rel="noreferrer"
                title={`Photo by ${scene.photographer} · ${scene.provider || "Unsplash"}${scene.cropped ? " · Cropped to fit" : ""}`}
              >
                {scene.name}
                {scene.captureYear ? ` · ${scene.captureYear}` : ""} ·{" "}
                {scene.photographer}
                {scene.license ? ` · ${scene.license} · Cropped` : ""}{" "}
                <ArrowUpRight size={11} />
              </a>
            ) : (
              <span>
                {photoLoading ||
                (scene &&
                  loadedPhoto !== scene.src &&
                  loadedPhoto !== `failed:${scene.src}`)
                  ? "Loading city photo…"
                  : "City photo unavailable"}
              </span>
            )}
          </div>
        </section>

        <aside
          ref={panelRef}
          className="glass-panel"
          aria-label={
            expanded
              ? "Expanded weather information"
              : "Location and weather summary"
          }
        >
          <div className="collapsed-content" hidden={Boolean(expanded)}>
            <CitySearch
              nearby={citySuggestions}
              currentPlace={data.place}
              onSelect={choose}
              configured={configured}
              disabled={loading}
            />
            <div className="destination-list">
              {places.map((place) => (
                <button
                  key={`${place.lat}:${place.lon}`}
                  disabled={loading}
                  onClick={() => choose(place)}
                >
                  {place.name}
                  <ArrowUpRight size={14} />
                </button>
              ))}
              <button
                className="my-location"
                onClick={locate}
                disabled={loading}
              >
                <LocateFixed size={14} />
                Use my location
              </button>
            </div>
            <section
              className="summary-section"
              aria-label="Weather details preview"
            >
              <button
                className="section-link"
                onClick={(event) => openSection("details", event)}
                aria-expanded={expanded === "details"}
                aria-controls="expanded-content"
              >
                Weather details
                <ArrowUpRight size={17} />
              </button>
              <div className="summary-rows">
                {summary.map(([label, value]) => (
                  <button
                    className="summary-row"
                    key={label}
                    onClick={(event) => openSection("details", event)}
                  >
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </button>
                ))}
              </div>
            </section>
            <div className="forecast-links">
              <button
                onClick={(event) => openSection("hourly", event)}
                aria-controls="expanded-content"
              >
                Next hours
                <ArrowUpRight size={17} />
              </button>
              <button
                onClick={(event) => openSection("daily", event)}
                aria-controls="expanded-content"
              >
                5-day forecast
                <ArrowUpRight size={17} />
              </button>
            </div>
          </div>

          <div
            className="expanded-content"
            id="expanded-content"
            hidden={!expanded}
          >
            <div className="expansion-header">
              <button onClick={closeSection} className="back-button">
                <ArrowLeft size={17} />
                Back to view
              </button>
              <button
                className="close-button"
                onClick={closeSection}
                aria-label="Close expanded weather"
              >
                <X size={21} />
              </button>
            </div>
            <div className="expanded-title">
              <p>
                {data.place.name} · {data.place.country}
              </p>
              <h2 ref={headingRef} tabIndex={-1}>
                {sections.find(([id]) => id === expanded)?.[1]}
              </h2>
            </div>
            <nav className="detail-tabs" aria-label="Expanded weather sections">
              {sections.map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={expanded === id}
                  onClick={() => setExpanded(id)}
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="detail-body" key={`${expanded}:${locationKey}`}>
              {expanded === "details" && (
                <WeatherDetails data={data} unit={unit} />
              )}
              {expanded === "hourly" && (
                <HourlyForecast key={locationKey} data={data} unit={unit} />
              )}
              {expanded === "daily" && (
                <DailyForecast data={data} unit={unit} />
              )}
            </div>
          </div>
          <div className="panel-controls">
            <div className="units" aria-label="Temperature units">
              {["C", "F"].map((value) => (
                <button
                  key={value}
                  aria-pressed={unit === value}
                  onClick={() => setUnit(value)}
                >
                  °{value}
                </button>
              ))}
            </div>
            <button
              className="refresh-button"
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh weather"
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
            </button>
          </div>
        </aside>
        {error && (
          <div className="error-toast" role="alert">
            <span>{error}</span>
            <button onClick={dismissError} aria-label="Dismiss error">
              <X size={18} />
            </button>
          </div>
        )}
      </main>
      <footer className="page-footer">
        <span>
          {configured === false
            ? "Demo mode · Sample weather"
            : data.demo
              ? "Sample weather shown"
              : "Weather by OpenWeather"}{" "}
          · Photography is illustrative
        </span>
      </footer>
    </div>
  );
}
