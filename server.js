import express from 'express';
import {
  extractYouTubeVideoId,
  findBestThumbnail,
  resolveYouTubeThumbnail
} from './youtube.js';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'thumbnail-maker-plugin' });
});

app.post('/youtube/thumbnail', async (req, res) => {
  try {
    const { youtube_url: youtubeUrl } = req.body ?? {};
    const { videoId, sourceUrl } = await resolveYouTubeThumbnail(youtubeUrl);

    res.json({
      video_id: videoId,
      source_url: sourceUrl,
      message: 'Thumbnail localizada com sucesso.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/youtube/thumbnail-file', async (req, res) => {
  try {
    const youtubeUrl = String(req.query.url || '');
    const videoId = extractYouTubeVideoId(youtubeUrl);
    const sourceUrl = await findBestThumbnail(videoId);
    const upstream = await fetch(sourceUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    });

    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ error: 'Falha ao baixar a thumbnail do YouTube.' });
    }

    res.status(200);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Disposition', `inline; filename="${videoId}.jpg"`);

    for await (const chunk of upstream.body) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/youtube/thumbnail-reference', async (req, res) => {
  try {
    const { youtube_url: youtubeUrl } = req.body ?? {};
    const { videoId, sourceUrl } = await resolveYouTubeThumbnail(youtubeUrl);

    res.json({
      video_id: videoId,
      image_url: sourceUrl,
      mime_type: 'image/jpeg',
      usage: 'Use esta URL como referência visual. GPT Actions não suportam retornar imagens/vídeos via openaiFileResponse; a geração/edição deve ocorrer com a ferramenta nativa de imagens do GPT.',
      message: 'Referência visual localizada com sucesso.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`thumbnail-maker-plugin ouvindo na porta ${PORT}`);
});
