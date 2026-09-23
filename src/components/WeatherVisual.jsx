import still0 from "@meteocons/svg-static/fill/clear-day.svg";
import still1 from "@meteocons/svg-static/fill/clear-night.svg";
import still2 from "@meteocons/svg-static/fill/partly-cloudy-day.svg";
import still3 from "@meteocons/svg-static/fill/partly-cloudy-night.svg";
import still4 from "@meteocons/svg-static/fill/cloudy.svg";
import still5 from "@meteocons/svg-static/fill/rain.svg";
import still6 from "@meteocons/svg-static/fill/snow.svg";
import still7 from "@meteocons/svg-static/fill/fog.svg";
import still8 from "@meteocons/svg-static/fill/thunderstorms-rain.svg";

const artwork = {
  "clear-day": still0,
  "clear-night": still1,
  "partly-cloudy-day": still2,
  "partly-cloudy-night": still3,
  cloudy: still4,
  rain: still5,
  snow: still6,
  fog: still7,
  "thunderstorms-rain": still8,
};

export function weatherArtwork(id, night = false) {
  if (id < 300) return "thunderstorms-rain";
  if (id < 600) return "rain";
  if (id < 700) return "snow";
  if (id < 800) return "fog";
  if (id === 800) return night ? "clear-night" : "clear-day";
  if (id === 801 || id === 802)
    return night ? "partly-cloudy-night" : "partly-cloudy-day";
  return "cloudy";
}
export function WeatherIcon({
  id = 800,
  night = false,
  size = 56,
  className = "",
}) {
  const name = weatherArtwork(id, night);
  return (
    <img
      className={`weather-icon ${className}`}
      src={artwork[name]}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  );
}
export default function WeatherVisual({ id = 803, night = false }) {
  return (
    <div className="weather-art" aria-hidden="true">
      <div className="art-glow" />
      <WeatherIcon id={id} night={night} size={320} />
    </div>
  );
}
