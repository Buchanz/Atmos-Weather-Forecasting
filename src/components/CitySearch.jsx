import { apiUrl } from "../services/urls.js";
import { useEffect, useId, useRef, useState } from "react";
import { Search, MapPin, ArrowUpRight, LoaderCircle } from "lucide-react";
import { cities } from "../../shared/cities";

export default function CitySearch({
  onSelect,
  configured,
  disabled,
  nearby,
  currentPlace,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState({
    query: "",
    items: [],
    pending: false,
    error: "",
  });
  const root = useRef(null);
  const input = useRef(null);
  const listId = useId();
  const text = query.trim();
  const current = result.query === text;
  const items = (
    !text
      ? currentPlace
        ? nearby.items
        : nearby.items.length
          ? nearby.items
          : cities.slice(0, 5)
      : current
        ? result.items
        : []
  ).filter(
    (place) =>
      !currentPlace ||
      !(
        place.name.toLowerCase() === currentPlace.name.toLowerCase() &&
        place.country === currentPlace.country
      ),
  );
  const pending = !text
    ? nearby.pending
    : text.length >= 2 && (!current || result.pending);
  const show = open;

  useEffect(() => {
    if (!open || text.length < 2) return;
    const controller = new AbortController();
    setResult({ query: text, items: [], pending: true, error: "" });
    const timer = setTimeout(async () => {
      try {
        let matches;
        const response = await fetch(
          apiUrl(`/api/suggestions?${new URLSearchParams({ q: text })}`),
          { signal: controller.signal },
        );
        const body = await response.json();
        if (!response.ok)
          throw new Error(
            body.message || "City search is temporarily unavailable.",
          );
        matches = body;
        if (!controller.signal.aborted)
          setResult({ query: text, items: matches, pending: false, error: "" });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            query: text,
            items: [],
            pending: false,
            error: error.message,
          });
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, open, configured, retry]);

  function choose(place) {
    setOpen(false);
    setQuery("");
    setActive(-1);
    onSelect(place);
    input.current?.focus();
    setOpen(false);
  }
  function submit(event) {
    event.preventDefault();
    if (disabled) return;
    if (show && active >= 0 && items[active]) return choose(items[active]);
    if (items.length === 1) return choose(items[0]);
    setOpen(true);
    setRetry((value) => value + 1);
    input.current?.focus();
  }
  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      setActive(-1);
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      if (items.length)
        setActive((index) =>
          event.key === "ArrowDown"
            ? (index + 1) % items.length
            : index < 0
              ? items.length - 1
              : (index - 1 + items.length) % items.length,
        );
    }
  }

  return (
    <div
      className="search-wrap"
      ref={root}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form className="search-form" onSubmit={submit}>
        <input
          ref={input}
          aria-label="Search city"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={show}
          aria-controls={listId}
          aria-activedescendant={
            show && active >= 0 && items[active]
              ? `${listId}-${active}`
              : undefined
          }
          autoComplete="off"
          placeholder="Another location"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          maxLength={100}
        />
        <button type="submit" aria-label="Search weather" disabled={disabled}>
          <Search size={23} />
        </button>
      </form>
      {show && (
        <div className="location-options autocomplete-menu">
          <div className="options-heading">
            {!text
              ? nearby.items.length
                ? currentPlace
                  ? `Near ${currentPlace.name}`
                  : "Near you"
                : "Suggested cities"
              : "Choose a city"}
            {pending && <LoaderCircle size={14} className="spin" />}
          </div>
          <div role="listbox" id={listId} aria-label="Matching cities">
            {items.map((place, index) => (
              <button
                type="button"
                role="option"
                aria-selected={active === index}
                tabIndex={-1}
                id={`${listId}-${index}`}
                key={`${place.lat}:${place.lon}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => !disabled && choose(place)}
                onPointerMove={() => setActive(index)}
              >
                <MapPin size={16} />
                <span>
                  <strong>{place.name}</strong>
                  <small>
                    {[
                      place.state,
                      place.countryName || place.country,
                      Number.isFinite(place.distanceKm)
                        ? `${Math.round(place.distanceKm)} km away`
                        : "",
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
          <div className="suggestion-status" role="status">
            {!text
              ? nearby.pending
                ? "Finding nearby places…"
                : nearby.message ||
                  "Select a nearby place, or type to search anywhere."
              : text.length < 2
                ? "Type at least 2 letters."
                : pending
                  ? "Finding cities…"
                  : current && result.error
                    ? result.error
                    : !items.length
                      ? "No photographed city matches yet. Try a nearby major city."
                      : `${items.length} ${items.length === 1 ? "city" : "cities"} found. Use ↑ ↓ and Enter to select.`}
          </div>
          <span className="search-credit">
            Only cities with assigned photographs are listed.
          </span>
        </div>
      )}
    </div>
  );
}
