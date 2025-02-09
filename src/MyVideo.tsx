import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame(); // Récupère la frame actuelle de la vidéo
  const opacity = interpolate(frame, [0, 50, 100], [0, 1, 0]); // Interpolation de l'opacité pour un effet fade-in/fade-out

  return (
    <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center', display: 'flex', backgroundColor: 'white' }}>
      {/* Titre avec opacité dynamique */}
      <h1 style={{ opacity, fontSize: 60, color: 'red' }}>
        Bienvenue dans ma vidéo ! 🎬
      </h1>
    </div>
  );
};
