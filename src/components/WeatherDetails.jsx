import {
  Thermometer,
  Droplets,
  Wind,
  Umbrella,
  Sunrise,
  Sunset,
} from "lucide-react";
import { temperature, clock } from "../services/weather";

export default function WeatherDetails({ data, unit }) {
  const w = data.current;
  const details = [
    {
      label: "Feels like",
      value: `${temperature(w.main.feels_like, unit)}°`,
      Icon: Thermometer,
      note: "How it feels outside",
    },
    {
      label: "Rain chance",
      value: `${Math.round((data.list[0]?.pop || 0) * 100)}%`,
      Icon: Umbrella,
      note: "Next 3-hour forecast",
    },
    {
      label: "Wind",
      value: `${Math.round(w.wind.speed * (unit === "F" ? 2.23694 : 3.6))}`,
      suffix: unit === "F" ? "mph" : "km/h",
      Icon: Wind,
      note: "Current wind speed",
    },
    {
      label: "Humidity",
      value: `${w.main.humidity}%`,
      Icon: Droplets,
      note: "Moisture in the air",
    },
    {
      label: "Sunrise",
      value: clock(w.sys.sunrise, w.timezone),
      Icon: Sunrise,
      note: "Local time",
    },
    {
      label: "Sunset",
      value: clock(w.sys.sunset, w.timezone),
      Icon: Sunset,
      note: "Local time",
    },
  ];
  return (
    <div className="expanded-details">
      {details.map(({ label, value, suffix, Icon, note }) => (
        <article className="detail-tile" key={label}>
          <span className="detail-label">
            <Icon size={20} />
            {label}
          </span>
          <strong>
            {value}
            <small>{suffix}</small>
          </strong>
          <span className="detail-note">{note}</span>
        </article>
      ))}
    </div>
  );
}
