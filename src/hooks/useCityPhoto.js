import { sceneForPlace } from "../data/scenes.js";
import { assetUrl } from "../services/urls.js";
export default function useCityPhoto(place) {
  const scene = sceneForPlace(place);
  return {
    scene: scene ? { ...scene, src: assetUrl(scene.src) } : null,
    photoLoading: false,
  };
}
