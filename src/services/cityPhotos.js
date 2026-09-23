import { assetUrl } from "./urls.js";
import { sceneForPlace } from "../data/scenes.js";
export const photoKey = (place) =>
  `${place.country}:${place.name}:${place.lat}:${place.lon}`;
export const cachedPhoto = (place) => ({ scene: sceneForPlace(place) });
export const loadCityPhoto = (place) => Promise.resolve(sceneForPlace(place));
export function prefetchCityPhoto(place) {
  const scene = sceneForPlace(place);
  if (scene && typeof Image !== "undefined") {
    const image = new Image();
    image.src = assetUrl(scene.src);
  }
}
