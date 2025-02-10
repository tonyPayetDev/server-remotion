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

const app = express();
app.use(express.json());
app.use(cors());

const execPath = '/usr/bin/chromium-browser'; // Spécifie le chemin vers ton installation de Chromium
app.get("/render-video", (req, res) => {
  const command = "npx remotion render src/remotionEntry.tsx MyVideo out/video.mp4";

  exec(command, { cwd: path.join(__dirname, "..") }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ message: "Vidéo générée avec succès !", output: stdout });
  });
});
// Endpoint pour générer la vidéo
app.post('/api/render', async (req, res) => {
  try {
    console.log('✅ API appelée avec :', req.body);

    // Bundle Remotion project et récupère les compositions
    const bundled = await bundle(join(__dirname, '../src/remotionEntry.tsx'));
    const compositions = await getCompositions(bundled);
    
    if (!compositions.length) {
      return res.status(400).json({ error: 'Aucune composition trouvée dans Remotion. Vérifiez remotionEntry.tsx' });
    }

    // Définir un nom de fichier unique pour éviter les conflits
    const outputPath = join(tmpdir(), `${Date.now()}.mp4`);
    console.log('🎥 Début du rendu vidéo...');

    // Lancer Puppeteer
    const browser = await puppeteer.launch({
      executablePath: execPath, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Désactiver les restrictions de sécurité
    });

    // Rendu vidéo avec Remotion et Puppeteer
    await renderMedia({
      composition: compositions[0],
      serveUrl: bundled,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: req.body,
      durationInFrames: req.body.duration * 30,
      fps: 30,
      executablePath: execPath,
      chromiumOptions: { noSandbox: true, disableWebSecurity: true, headless: true, browser }, 
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
    res.status(500).json({ error: error.message || 'Échec du rendu vidéo' });
  }
});

// Démarrer le serveur sur le port 3000 ou port d'environnement
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur sur http://localhost:${PORT}`));
