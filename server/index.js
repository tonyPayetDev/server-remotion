import express from 'express';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile, unlink } from 'fs/promises';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer'; // Importation de Puppeteer

// Définition de __dirname pour modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';

// Définir la variable d'environnement PUPPETEER_SKIP_DOWNLOAD pour éviter le téléchargement de Chromium
process.env.PUPPETEER_SKIP_DOWNLOAD = 'true'; // Empêche Puppeteer de télécharger Chrome

const app = express();
app.use(express.json());
app.use(cors());

const execPath = '/usr/bin/chromium-browser'; // Spécifie le chemin vers ton installation de Chromium
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

    // Définir un nom de fichier unique pour éviter les conflits
    const outputPath = join(tmpdir(), `${Date.now()}.mp4`);
    console.log('🎥 Début du rendu vidéo...');

    // Utiliser Puppeteer pour démarrer un navigateur
    const browser = await puppeteer.launch({
      executablePath: execPath, // Utilise le chemin vers Chromium
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Désactive les restrictions de sécurité
    });

    await renderMedia({
      composition: compositions[0],
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: req.body,
      durationInFrames: req.body.duration * 30,
      fps: 30,
      executablePath: execPath, // Path vers Chromium
      chromiumOptions: { noSandbox: true, disableWebSecurity: true, headless: true, browser }, // Passer l'instance de browser
    });

    console.log('✔️ Rendu terminé. Lecture du fichier...');
    const video = await readFile(outputPath);

    // Envoie du fichier vidéo avec un nom de fichier pour le téléchargement
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
    res.send(video);

    // Supprimer le fichier temporaire après l'envoi
    await unlink(outputPath);
    console.log('🗑️ Fichier temporaire supprimé.');
    
    // Fermer le navigateur Puppeteer
    await browser.close();

  } catch (error) {
    console.error('❌ Erreur lors du rendu vidéo :', error);
    res.status(500).json({ error: error.message || 'Failed to render video' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
