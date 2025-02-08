import express from 'express';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile, unlink } from 'fs/promises';

const app = express();
app.use(express.json());
app.use(cors());

const execPath = '/usr/bin/google-chrome';

let bundled = null;
let compositions = null;

app.post('/api/render', async (req, res) => {
  try {
    console.log('✅ API appelée avec :', req.body);

    if (!bundled) {
      console.log('📦 Bundling Remotion project...');
      bundled = await bundle(join(__dirname, '../src/remotionEntry.tsx'));
    }

    if (!compositions) {
      console.log('🎬 Récupération des compositions...');
      compositions = await getCompositions(bundled);
      console.log('✔️ Compositions disponibles :', compositions);
    }

    if (!compositions.length) {
      throw new Error('Aucune composition trouvée dans Remotion. Vérifiez remotionEntry.tsx');
    }

    const outputPath = join(tmpdir(), `${Date.now()}.mp4`);
    console.log('🎥 Début du rendu vidéo...');

    await renderMedia({
      composition: compositions[0],
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: req.body,
      durationInFrames: req.body.duration * 30,
      fps: 30,
      executablePath: execPath,
      chromiumOptions: { noSandbox: true, disableWebSecurity: true, headless: true },
    });

    console.log('✔️ Rendu terminé. Lecture du fichier...');
    const video = await readFile(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.send(video);

    await unlink(outputPath);
    console.log('🗑️ Fichier temporaire supprimé.');
  } catch (error) {
    console.error('❌ Erreur lors du rendu vidéo :', error);
    res.status(500).json({ error: error.message || 'Failed to render video' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
