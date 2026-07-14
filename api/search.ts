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
  const q = typeof req.query?.q === 'string' ? req.query.q.trim() : '';
  const isShort = String(req.query?.isShort) === 'true';
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!q) {
    return res.status(200).json(isShort ? MOCK_SHORTS : MOCK_VIDEOS);
  }

  if (!apiKey) {
    // Local fallback: filter mock lists
    const list = (isShort ? MOCK_SHORTS : MOCK_VIDEOS).filter(v =>
      v.title.toLowerCase().includes(q.toLowerCase()) || v.description.toLowerCase().includes(q.toLowerCase()) || v.channelTitle.toLowerCase().includes(q.toLowerCase())
    );
    return res.status(200).json(list.length ? list : (isShort ? MOCK_SHORTS : MOCK_VIDEOS));
  }

  const trySearch = async (query: string) => {
    const params = new URLSearchParams({ part: 'snippet', maxResults: '18', q: query, type: 'video', key: apiKey });
    if (isShort) params.set('videoDuration', 'short');
    const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    return data.items || [];
  };

  try {
    // Primary search
    let items = await trySearch(isShort ? `${q} shorts` : q);

    // If no items, broaden the query with common suffixes
    const fallbacks = ['trending', 'highlights', 'official', 'best', 'compilation'];
    for (const fb of fallbacks) {
      if (items && items.length > 0) break;
      items = await trySearch(`${q} ${fb}`);
    }

    // If still empty, try removing filters (no videoDuration)
    if ((!items || items.length === 0) && isShort) {
      items = await trySearch(q);
    }

    if (!items || items.length === 0) {
      // Final fallback: return mock filtered
      const list = (isShort ? MOCK_SHORTS : MOCK_VIDEOS).filter(v =>
        v.title.toLowerCase().includes(q.toLowerCase()) || v.description.toLowerCase().includes(q.toLowerCase()) || v.channelTitle.toLowerCase().includes(q.toLowerCase())
      );
      return res.status(200).json(list.length ? list : (isShort ? MOCK_SHORTS : MOCK_VIDEOS));
    }

    // Optionally fetch details for videos to get duration/stats
    const videoIds = items.map((it: any) => it.id?.videoId || it.id).filter(Boolean);
    let detailsMap = new Map<string, any>();
    if (videoIds.length > 0) {
      const dparams = new URLSearchParams({ part: 'snippet,contentDetails,statistics', id: videoIds.join(','), key: apiKey });
      const durl = `https://www.googleapis.com/youtube/v3/videos?${dparams.toString()}`;
      const dr = await fetch(durl);
      if (dr.ok) {
        const ddata = await dr.json();
        detailsMap = new Map((ddata.items || []).map((it: any) => [it.id, it]));
      }
    }

    const results = items.map((it: any) => {
      const vid = it.id?.videoId || it.id;
      const sn = it.snippet || {};
      const det = detailsMap.get(vid) || {};
      const duration = det?.contentDetails?.duration ? formatDuration(det.contentDetails.duration) : (sn?.lengthText?.simpleText || (isShort ? '0:30' : '10:00'));
      const viewsRaw = det?.statistics?.viewCount || '0';
      return {
        id: vid,
        title: sn.title || 'Untitled',
        description: sn.description || '',
        thumbnail: getBestThumbnail(sn.thumbnails),
        duration,
        views: formatCount(viewsRaw),
        likes: formatCount(det?.statistics?.likeCount || '0'),
        channelId: sn.channelId || '',
        channelTitle: sn.channelTitle || '',
        publishedAt: sn.publishedAt || new Date().toISOString(),
        isShort: isShort
      };
    });

    return res.status(200).json(results);
  } catch (err: any) {
    console.error('search handler error', err);
    return res.status(500).json(isShort ? MOCK_SHORTS : MOCK_VIDEOS);
  }
}
