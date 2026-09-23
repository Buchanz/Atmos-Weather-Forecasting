import { apiUrl } from "../services/urls.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWeather, findLocations } from "../services/weather";
export default function useWeather() {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [choices, setChoices] = useState([]);
  const [configured, setConfigured] = useState(null);
  const controller = useRef(null);
  const commit = useCallback((result, signal) => {
    if (signal?.aborted) return;
    setData(result);
    setRecent((previous) =>
      [
        result,
        ...previous.filter(
          (x) =>
            x.place.lat !== result.place.lat ||
            x.place.lon !== result.place.lon,
        ),
      ].slice(0, 4),
    );
  }, []);
  const run = useCallback(async (action) => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      next.abort();
    }, 20000);
    setLoading(true);
    setError("");
    setChoices([]);
    try {
      await action(next.signal);
    } catch (e) {
      if (controller.current === next && !next.signal.aborted)
        setError(e.message);
      else if (controller.current === next && timedOut)
        setError("The request timed out. Please try again.");
    } finally {
      clearTimeout(timeout);
      if (controller.current === next) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const init = new AbortController();
    fetch(apiUrl("/api/status"), { signal: init.signal })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((status) => {
        if (init.signal.aborted) return;
        setConfigured(status.configured);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(
            "Unable to connect to the weather server. Refresh to try again.",
          );
          setLoading(false);
        }
      });
    return () => {
      init.abort();
      controller.current?.abort();
    };
  }, [commit, run]);
  function select(place) {
    if (configured === false) {
      setError(
        "The site owner must configure the weather API key before live weather can load.",
      );
      return;
    }
    run(async (signal) => commit(await fetchWeather(place, signal), signal));
  }
  function search(query) {
    if (!query.trim()) {
      setError("Enter a city name to search.");
      return;
    }
    if (configured === false) {
      setError("Live weather is not configured.");
      return;
    }
    run(async (signal) => {
      const results = await findLocations(query.trim(), signal);
      if (signal.aborted) return;
      if (results.length > 1) setChoices(results);
      else commit(await fetchWeather(results[0], signal), signal);
    });
  }
  function locate() {
    if (!configured) {
      setError(
        "Location weather will be available when live weather is configured.",
      );
      return;
    }
    if (!navigator.geolocation) {
      setError(
        "Your browser does not support location access. Search by city instead.",
      );
      return;
    }
    run(async (signal) => {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          resolve,
          () =>
            reject(
              new Error(
                "Location is unavailable. Allow access in your browser or search by city.",
              ),
            ),
          { timeout: 10000 },
        ),
      );
      if (!signal.aborted)
        commit(
          await fetchWeather(
            { lat: position.coords.latitude, lon: position.coords.longitude },
            signal,
          ),
          signal,
        );
    });
  }
  return {
    data,
    recent,
    loading,
    error,
    choices,
    configured,
    search,
    select,
    locate,
    refresh: () => select(data.place),
    dismissError: () => setError(""),
    dismissChoices: () => setChoices([]),
  };
}
