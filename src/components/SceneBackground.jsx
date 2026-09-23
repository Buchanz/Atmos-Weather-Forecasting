import { useState } from "react";

export default function SceneBackground({ scene, onPhotoLoad }) {
  const [loaded, setLoaded] = useState(null);
  const [failedThumbnail, setFailedThumbnail] = useState(null);
  const src =
    scene && failedThumbnail === scene.src
      ? scene.originalSrc || scene.src
      : scene?.src;
  return (
    <div className="scene-background" aria-hidden="true">
      {scene && (
        <img
          key={src}
          className={`scene-photo ${loaded === src ? "photo-ready" : "photo-loading"}`}
          src={src}
          style={{ objectPosition: scene.position }}
          onLoad={() => {
            setLoaded(src);
            onPhotoLoad(scene.src);
          }}
          onError={() => {
            setLoaded(null);
            if (scene.originalSrc && src !== scene.originalSrc)
              setFailedThumbnail(scene.src);
            else onPhotoLoad(`failed:${scene.src}`);
          }}
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      )}
      <div className="scene-shade" />
    </div>
  );
}
