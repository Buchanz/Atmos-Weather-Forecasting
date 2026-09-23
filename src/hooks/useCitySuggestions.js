import { apiUrl } from "../services/urls.js";
import { useEffect, useState } from "react";
export default function useCitySuggestions(place, configured) {
  const key = JSON.stringify([place.name, place.lat, place.lon]);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!configured) return;
    const controller = new AbortController();
    fetch(
      apiUrl(
        `/api/nearby-cities?${new URLSearchParams({ name: place.name, lat: place.lat, lon: place.lon })}`,
      ),
      { signal: controller.signal },
    )
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message);
        return body;
      })
      .then((items) =>
        setResult({
          key,
          items,
          pending: false,
          message: items.length
            ? ""
            : "No other nearby cities found. Search for a city.",
        }),
      )
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ key, items: [], pending: false, message: error.message });
      });
    return () => controller.abort();
  }, [key, configured]);
  return result?.key === key
    ? result
    : { items: [], pending: Boolean(configured), message: "" };
}
