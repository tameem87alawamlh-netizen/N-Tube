// Minimal helpers (kept small for serverless function)
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

const MOCK_VIDEOS = [
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Hip Hop Radio 🌌 Beats to Relax, Study or Focus to',
    description: 'Fallback lofi radio',
    thumbnail: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
    duration: 'LIVE',
    views: '4.8M',
    likes: '120K',
    channelId: 'UC3H_K_G-Zz_W9_8Z1aYpXKg',
    channelTitle: 'Lofi Records',
    publishedAt: new Date().toISOString(),
    isShort: false
  }
];

export default async function handler(req: any, res: any) {
  const q = typeof req.query?.q === 'string' ? req.query.q : (req.query?.q ? String(req.query.q) : 'lofi hip hop');
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(200).json(MOCK_VIDEOS);
  }

  try {
    const trySearch = async (query: string, extraParams: Record<string,string> = {}) => {
      const params = new URLSearchParams({
        part: 'snippet',
        maxResults: '18',
        q: query,
        type: 'video',
        key: apiKey,
        ...extraParams
      } as Record<string,string>);
      const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
      const r = await fetch(url);
      if (!r.ok) {
        const txt = await r.text();
        console.error('YouTube search error', r.status, txt);
        return null;
      }
      const data = await r.json();
      return data.items || [];
    };

    // primary
    let items = await trySearch(q, { videoEmbeddable: 'true' }) || [];

    // If no results, broaden the query with helpful suffixes
    const fallbacks = ['trending', 'highlights', 'official', 'best', 'compilation', '2026'];
    for (const fb of fallbacks) {
      if (items && items.length > 0) break;
      items = await trySearch(`${q} ${fb}`) || [];
    }

    // If still empty, try without embeddable restriction
    if ((!items || items.length === 0)) {
      items = await trySearch(q) || [];
    }

    const videoIds = items.map((it: any) => it.id && (it.id.videoId || it.id)).filter(Boolean);

    // Fetch details for durations and stats
    const details: any = { items: [] };
    if (videoIds.length > 0) {
      const dparams = new URLSearchParams({ part: 'snippet,contentDetails,statistics', id: videoIds.join(','), key: apiKey });
      const durl = `https://www.googleapis.com/youtube/v3/videos?${dparams.toString()}`;
      const dr = await fetch(durl);
      if (dr.ok) details.items = (await dr.json()).items || [];
    }

    const detailMap: Map<string, any> = new Map((details.items || []).map((it: any) => [it.id, it]));

    const results = items.map((it: any) => {
      const vid = it.id.videoId || it.id;
      const snippet = it.snippet || {};
      const det: any = detailMap.get(vid) || {};
      const rawDuration = det?.contentDetails?.duration || snippet?.lengthText?.simpleText || '';
      const duration = det?.contentDetails?.duration ? formatDuration(det.contentDetails.duration) : (snippet?.lengthText?.simpleText || '10:00');
      const viewsRaw = det?.statistics?.viewCount || snippet?.viewCount || '0';

      return {
        id: vid,
        title: snippet.title || 'Untitled',
        description: snippet.description || '',
        thumbnail: getBestThumbnail(snippet.thumbnails),
        duration,
        views: formatCount(viewsRaw),
        likes: formatCount(det?.statistics?.likeCount || '0'),
        channelId: snippet.channelId || '',
        channelTitle: snippet.channelTitle || '',
        publishedAt: snippet.publishedAt || new Date().toISOString(),
        isShort: false
      };
    });

    return res.status(200).json(results.length ? results : MOCK_VIDEOS);
  } catch (err: any) {
    console.error('videos handler error', err);
    return res.status(500).json(MOCK_VIDEOS);
  }
}
