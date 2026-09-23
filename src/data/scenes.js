import { majorScenes } from "./majorScenes.js";
import { verifiedScenes } from "./verifiedScenes.js";
export const scenes = [
  ...majorScenes,
  ...verifiedScenes,
  {
    id: "vancouver",
    name: "Vancouver",
    country: "CA",
    lat: 49.28,
    lon: -123.12,
    aliases: ["vancouver"],
    src: "/scenes/vancouver-hd.jpg",
    photographer: "Albert Stoynov",
    source:
      "https://unsplash.com/photos/aerial-view-of-a-city-skyline-at-dusk-U-pEZZI4uF8",
    position: "50% 48%",
  },
  {
    id: "london",
    name: "London",
    country: "GB",
    lat: 51.51,
    lon: -0.13,
    aliases: ["london", "city of london"],
    src: "/scenes/london-hd.jpg",
    photographer: "Alev Takil",
    source:
      "https://unsplash.com/photos/london-skyline-with-gherkin-and-thames-7ojyp-IXW7w",
    position: "45% 50%",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "JP",
    lat: 35.68,
    lon: 139.69,
    aliases: ["tokyo", "tokyo-to", "東京都", "東京"],
    src: "/scenes/tokyo-hd.jpg",
    photographer: "Enes",
    source:
      "https://unsplash.com/photos/a-view-of-a-large-city-with-tall-buildings-dyF1Q8kc0Fw",
    position: "55% 50%",
  },
];
const normalize = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
export function sceneForPlace(place) {
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lon)) return null;
  // A same-named city in another region must never inherit this city's photograph.
  return (
    scenes.find(
      (scene) =>
        scene.country === place.country &&
        scene.aliases.includes(normalize(place.name)) &&
        Math.abs(scene.lat - place.lat) < 0.25 &&
        Math.abs(scene.lon - place.lon) < 0.25,
    ) || null
  );
}
