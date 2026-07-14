function formatCount(numStr: string): string {
  const num = parseInt(String(numStr));
  if (isNaN(num)) return String(numStr);
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

function getBestThumbnail(thumbnails: any): string {
  if (!thumbnails) return '';
  return thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';
}

function formatDuration(iso: string): string {
  if (!iso) return '0:00';
  if (iso === 'LIVE') return 'LIVE';
  const m = String(iso).match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return iso;
  const hours = m[1] ? parseInt(m[1], 10) : 0;
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const seconds = m[3] ? parseInt(m[3], 10) : 0;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const MOCK_SHORTS = [
  {
    id: 'Y_S07u3GjM8',
    title: 'Insane Basketball Trickshot! 🏀😲',
    description: 'Fallback short',
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
    duration: '0:35',
    views: '3.4M',
    likes: '290K',
    channelId: 'ch_sports_unreal',
    channelTitle: 'Sports Spotlight',
    publishedAt: new Date().toISOString(),
    isShort: true
  }
];

export default async function handler(req: any, res: any) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const q = typeof req.query?.q === 'string' ? req.query.q : '';

  if (!apiKey) return res.status(200).json({ items: MOCK_SHORTS, nextPageToken: null });

  try {
    const params = new URLSearchParams({ part: 'snippet', maxResults: '15', q: q || 'shorts viral', type: 'video', videoDuration: 'short', key: apiKey });
    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const r = await fetch(url);
    if (!r.ok) {
      const txt = await r.text();
      console.error('YouTube shorts search error', r.status, txt);
      return res.status(502).json({ items: MOCK_SHORTS, nextPageToken: null });
    }

    const data = await r.json();
    const items = (data.items || []).map((it: any) => {
      const vid = it.id.videoId || it.id;
      const sn = it.snippet || {};
      return {
        id: vid,
        title: sn.title || 'Untitled',
        description: sn.description || '',
        thumbnail: getBestThumbnail(sn.thumbnails),
        duration: sn?.lengthText?.simpleText || '0:30',
        views: sn?.viewCount || '0',
        likes: '0',
        channelId: sn.channelId || '',
        channelTitle: sn.channelTitle || '',
        publishedAt: sn.publishedAt || new Date().toISOString(),
        isShort: true
      };
    });

    return res.status(200).json({ items: items.length ? items : MOCK_SHORTS, nextPageToken: data.nextPageToken || null });
  } catch (err: any) {
    console.error('shorts handler error', err);
    return res.status(500).json({ items: MOCK_SHORTS, nextPageToken: null });
  }
}
