import { apiUrl } from "../services/urls.js";
import { useEffect, useState } from "react";
export default function useNearbyCities(configured) {
  const [state, setState] = useState({
    items: [],
    position: null,
    pending: true,
    message: "",
  });
  useEffect(() => {
    if (configured === null) return;
    let cancelled = false;
    const controller = new AbortController();
    let watch;
    const onPosition = async (position) => {
      if (cancelled) return;
      navigator.geolocation.clearWatch(watch);
      try {
        if (cancelled) return;
        const point = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setState({
          items: [],
          position: point,
          pending: Boolean(configured),
          message: "",
        });
        if (!configured) return;
        const response = await fetch(
          apiUrl(`/api/nearby?${new URLSearchParams(point)}`),
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(
            "Nearby places are unavailable. You can search for any city.",
          );
        const items = await response.json();
        if (!cancelled)
          setState({
            items: items.filter(
              (p, i, all) =>
                all.findIndex(
                  (q) => q.name === p.name && q.country === p.country,
                ) === i,
            ),
            position: point,
            pending: false,
            message: items.length
              ? ""
              : "No nearby places found. Search for a city.",
          });
      } catch (error) {
        onError(error);
      }
    };
    const onError = (error) => {
      if (!cancelled)
        setState((previous) => ({
          ...previous,
          pending: false,
          message:
            error.code === 1
              ? "Location access is off. Search for a city or allow location in your browser."
              : "Could not find nearby places. Search for any city.",
        }));
    };
    if (navigator.geolocation) {
      // Keep listening after a timeout so a delayed permission grant can succeed.
      watch = navigator.geolocation.watchPosition(onPosition, onError, {
        timeout: 20000,
        maximumAge: 60000,
        enableHighAccuracy: false,
      });
    } else onError(new Error("Unavailable"));
    let permission;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((result) => {
        if (cancelled) return;
        permission = result;
        permission.onchange = () => {
          if (permission.state === "granted") {
            navigator.geolocation.clearWatch(watch);
            watch = navigator.geolocation.watchPosition(onPosition, onError, {
              timeout: 20000,
              maximumAge: 60000,
            });
          }
        };
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      controller.abort();
      navigator.geolocation?.clearWatch(watch);
      if (permission) permission.onchange = null;
    };
  }, [configured]);
  return state;
}
