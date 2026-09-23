import { ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { useState } from "react";
import { WeatherIcon } from "./WeatherVisual";
import { temperature, localDate, groupForecast } from "../services/weather";
export function HourlyForecast({ data, unit }) {
  const [page, setPage] = useState(0);
  const list = data.list.slice(page * 6, page * 6 + 6);
  return (
    <section className="hourly-section" aria-label="Hourly forecast">
      <div className="section-heading">
        <h2>
          Hourly forecast <span>3-hour intervals</span>
        </h2>
        <div className="section-controls">
          <button
            aria-label="Earlier forecast"
            disabled={page === 0}
            onClick={() => setPage(0)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Later forecast"
            disabled={page === 1}
            onClick={() => setPage(1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="hourly-list">
        {list.map((item, i) => (
          <article
            className={`hour-card ${i === 0 && page === 0 ? "next-hour" : ""}`}
            key={item.dt}
          >
            <span className="hour-time">
              {localDate(item.dt, data.current.timezone).toLocaleTimeString(
                "en-US",
                { hour: "numeric", timeZone: "UTC" },
              )}
            </span>
            <WeatherIcon id={item.weather[0].id} size={28} />
            <strong>{temperature(item.main.temp, unit)}°</strong>
            <small>
              <Droplets size={11} />
              {Math.round((item.pop || 0) * 100)}%
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
export function DailyForecast({ data, unit }) {
  const days = groupForecast(data.list, data.current.timezone, data.current.dt);
  return (
    <section className="daily-section" aria-label="Five-day forecast">
      <div className="section-heading">
        <h2>5-day forecast</h2>
        <span className="section-note">A little further ahead</span>
      </div>
      <div className="daily-list">
        {days.map((day, i) => (
          <article
            className="day-card"
            key={day.date}
            title={`${day.weather.description}${day.partial ? " · Partial day" : ""}`}
          >
            <span>
              {i === 0
                ? "Tomorrow"
                : localDate(day.dt, data.current.timezone).toLocaleDateString(
                    "en-US",
                    { weekday: "short", timeZone: "UTC" },
                  )}
            </span>
            <WeatherIcon id={day.weather.id} size={28} />
            <div className="day-temps">
              <strong>{temperature(day.max, unit)}°</strong>
              <small>{temperature(day.min, unit)}°</small>
            </div>
            <small className="day-rain">
              <Droplets size={11} />
              {Math.round(day.pop * 100)}%{day.partial ? " *" : ""}
            </small>
          </article>
        ))}
      </div>
      <p className="forecast-footnote">
        * Partial day · Ranges from available 3-hour readings
      </p>
    </section>
  );
}
