import React from 'react';
import { Img, Audio, useCurrentFrame, interpolate } from 'remotion';

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame(); // Récupère la frame actuelle de la vidéo
  const opacity = interpolate(frame, [0, 50, 100], [0, 1, 0]); // Interpolation de l'opacité pour un effet fade-in/fade-out

  return (
    <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center', display: 'flex', backgroundColor: 'white' }}>
      <h1 style={{ opacity, fontSize: 60, color: 'red' }}>
        Bienvenue dans ma vidéo ! 🎬
      </h1>
      {/* Tu peux ajouter une image */}
      <Img src="https://url-de-ton-image.jpg" width={500} height={500} />
      {/* Ou ajouter de l'audio */}
      <Audio src="https://url-de-ton-audio.mp3" startFrom={0} />
    </div>
  );
};
