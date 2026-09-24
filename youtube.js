const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be'
]);

export function extractYouTubeVideoId(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('youtube_url é obrigatório.');
  }

  let url;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error('URL do YouTube inválida.');
  }

  const host = url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    throw new Error('A URL informada não pertence ao YouTube.');
  }

  let videoId = null;

  if (host === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] || null;
  } else if (url.pathname === '/watch') {
    videoId = url.searchParams.get('v');
  } else {
    const parts = url.pathname.split('/').filter(Boolean);
    if (['shorts', 'live', 'embed'].includes(parts[0])) {
      videoId = parts[1] || null;
    }
  }

  if (!videoId || !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
    throw new Error('Não foi possível extrair um ID de vídeo válido.');
  }

  return videoId;
}

export function thumbnailCandidates(videoId) {
  return [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  ];
}

export async function findBestThumbnail(videoId) {
  for (const candidate of thumbnailCandidates(videoId)) {
    try {
      const response = await fetch(candidate, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(7000)
      });

      if (response.ok) return candidate;
    } catch {
      // Tenta a próxima qualidade.
    }
  }

  throw new Error('Nenhuma thumbnail disponível foi encontrada para este vídeo.');
}

export async function resolveYouTubeThumbnail(youtubeUrl) {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  const sourceUrl = await findBestThumbnail(videoId);
  return { videoId, sourceUrl };
}
