import express from 'express';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile, unlink } from 'fs/promises';
import cors from 'cors';

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
      bundled = await bundle(join(__dirname, '../src/remotionEntry.tsx'));
    }
    
    if (!compositions) {
      compositions = await getCompositions(bundled);
    }

    const outputPath = join(tmpdir(), `${Date.now()}.mp4`);

    await renderMedia({
      composition: compositions[0],
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: req.body,
      durationInFrames: req.body.duration * 30,
      fps: 30,
      executablePath: execPath,
      chromiumOptions: { noSandbox: true, headless: true },
    });

    const video = await readFile(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.send(video);

    await unlink(outputPath);
  } catch (error) {
    console.error('❌ Erreur rendu vidéo:', error);
    res.status(500).json({ error: 'Failed to render video' });
  }
});

app.listen(3000, () => console.log('🚀 Serveur sur http://localhost:3000'));
