import type { PlatformType } from '../types/stash';

export interface ExtractedUrlInfo {
  isValid: boolean;
  rawUrl: string;
  normalizedUrl: string;
  platform: PlatformType;
  sourceHost: string;
  derivedTitle: string;
  faviconUrl: string;
  thumbnailUrl?: string;
  description?: string;
}

// Accept web links from any domain without trusting arbitrary executable schemes.
export function normalizeUrl(inputUrl: string): string {
  const value = inputUrl.trim();
  if (!value || /^(?!https?:)[a-z][a-z0-9+.-]*:/i.test(value)) throw new Error('Use an http or https web address.');
  const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) throw new Error('Please enter a valid web address without embedded credentials.');
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid', 'gclid', 'msclkid', 'igsh'].includes(key)) parsed.searchParams.delete(key);
  }
  return parsed.toString();
}

export function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s<>"“”]+|(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}(?::\d+)?(?:[/?#][^\s<>"“”]*)?/gi) || [];
  const urls = new Map<string,string>();
  for (let candidate of matches) {
    candidate = candidate.replace(/[.,!?;:'”]+$/, '');
    for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
      while (candidate.endsWith(close) && candidate.split(close).length > candidate.split(open).length) candidate = candidate.slice(0,-1);
    }
    try { const normalized = normalizeUrl(candidate); urls.set(normalized, normalized); } catch { /* Ignore malformed text fragments. */ }
  }
  return [...urls.values()];
}

export function extractUrlFromText(text: string): string | null {
  return extractUrlsFromText(text)[0] || null;
}

const matchesHost = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

export function detectPlatform(urlString: string): PlatformType {
  try {
    const parsed = new URL(normalizeUrl(urlString));
    const host = parsed.hostname.toLowerCase();
    const domains: [PlatformType, string[]][] = [
      ['instagram', ['instagram.com', 'instagr.am']],
      ['facebook', ['facebook.com', 'fb.com', 'fb.watch', 'fb.me']],
      ['snapchat', ['snapchat.com', 'snap.com']],
      ['whatsapp', ['whatsapp.com', 'whatsapp.net', 'wa.me']],
      ['threads', ['threads.net', 'threads.com']],
      ['x', ['twitter.com', 'x.com', 't.co']],
      ['youtube', ['youtube.com', 'youtu.be', 'youtube-nocookie.com']],
      ['spotify', ['spotify.com', 'spotify.link']],
      ['telegram', ['t.me', 'telegram.me', 'telegram.org']],
      ['linkedin', ['linkedin.com', 'lnkd.in']],
      ['tiktok', ['tiktok.com']],
      ['discord', ['discord.com', 'discord.gg']],
      ['github', ['github.com', 'github.io']],
      ['reddit', ['reddit.com', 'redd.it']],
      ['pinterest', ['pinterest.com', 'pin.it']]
    ];
    if (matchesHost(host, 'maps.app.goo.gl') || matchesHost(host, 'maps.google.com') || matchesHost(host, 'maps.google.co.in') || matchesHost(host, 'maps.apple.com') || (matchesHost(host, 'goo.gl') && parsed.pathname.startsWith('/maps')) || (/^(?:www\.)?google\.(?:com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host) && /^\/maps(?:\/|$)/.test(parsed.pathname))) return 'maps';
    for (const [platform, hosts] of domains) if (hosts.some(domain => matchesHost(host, domain))) return platform;
    return 'website';
  } catch { return 'website'; }
}

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  instagram: 'Instagram', facebook: 'Facebook', snapchat: 'Snapchat', whatsapp: 'WhatsApp', threads: 'Threads', x: 'X / Twitter', youtube: 'YouTube', spotify: 'Spotify', telegram: 'Telegram', linkedin: 'LinkedIn', tiktok: 'TikTok', discord: 'Discord', github: 'GitHub', reddit: 'Reddit', pinterest: 'Pinterest', maps: 'Maps', website: 'Website', note: 'Note', checklist: 'Checklist', location: 'Location', file: 'File'
};

// Derive a clean, human-readable title fallback based on platform and URL structure
export function deriveTitleFromUrl(urlString: string, platform: PlatformType): string {
  try {
    const parsed = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const host = parsed.hostname.replace(/^www\./, '');

    if (platform === 'youtube') {
      const v = parsed.searchParams.get('v');
      if (v) return `YouTube Video (${v})`;
      if (pathParts.includes('shorts')) return `YouTube Short (${pathParts[pathParts.indexOf('shorts') + 1] || ''})`;
      return 'YouTube Video';
    }

    if (platform === 'instagram') {
      if (pathParts.includes('p') || pathParts.includes('reel')) {
        const creator = pathParts[0] !== 'p' && pathParts[0] !== 'reel' ? `@${pathParts[0]}` : '';
        return creator ? `Instagram Post by ${creator}` : 'Instagram Reel / Post';
      }
      if (pathParts.length === 1) return `Instagram Profile (@${pathParts[0]})`;
      return 'Instagram Post';
    }

    if (platform === 'threads') {
      if (pathParts.length >= 1 && pathParts[0].startsWith('@')) {
        return `Threads Post by ${pathParts[0]}`;
      }
      return 'Threads Post';
    }

    if (platform === 'x') {
      if (pathParts.length >= 1) {
        return `Post on X (@${pathParts[0]})`;
      }
      return 'Post on X';
    }

    if (platform === 'github') {
      if (pathParts.length >= 2) {
        return `${pathParts[0]}/${pathParts[1]}`;
      }
      if (pathParts.length === 1) return `${pathParts[0]} (GitHub)`;
      return 'GitHub Repository';
    }

    if (platform === 'reddit') {
      if (pathParts.includes('r') && pathParts.length >= 2) {
        const sub = pathParts[pathParts.indexOf('r') + 1];
        const titleSlug = pathParts[pathParts.indexOf('r') + 3];
        if (titleSlug) {
          return `${formatSlug(titleSlug)} — r/${sub}`;
        }
        return `r/${sub} on Reddit`;
      }
      return 'Reddit Discussion';
    }

    if (platform === 'spotify') {
      if (pathParts.includes('track')) return `Spotify Track (${pathParts[pathParts.indexOf('track') + 1]})`;
      if (pathParts.includes('album')) return `Spotify Album`;
      if (pathParts.includes('playlist')) return `Spotify Playlist`;
      return 'Spotify Music';
    }

    if (platform === 'maps') {
      const q = parsed.searchParams.get('q') || parsed.searchParams.get('query');
      if (q) return decodeURIComponent(q);
      const placeIndex = pathParts.indexOf('place');
      if (placeIndex >= 0 && pathParts[placeIndex + 1]) return decodeURIComponent(pathParts[placeIndex + 1].replace(/\+/g, ' '));
      const appleName = parsed.searchParams.get('name');
      if (appleName) return appleName;
      return 'Google Maps Location';
    }

    if (['facebook', 'snapchat', 'whatsapp', 'telegram', 'linkedin', 'tiktok', 'discord'].includes(platform)) return `${PLATFORM_LABELS[platform]} Link`;

    // Generic Website: create clean title from pathname slug or domain
    if (pathParts.length > 0) {
      const lastSlug = pathParts[pathParts.length - 1];
      const cleaned = formatSlug(lastSlug);
      if (cleaned.length > 2) return `${cleaned} — ${host}`;
    }

    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return 'Saved Link';
  }
}

function formatSlug(slug: string): string {
  return slug
    .replace(/\.[a-zA-Z0-9]+$/, '') // remove extensions like .html
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Attempt to fetch safe metadata via public unauthenticated oEmbed or open metadata
export async function inspectUrl(input: string): Promise<ExtractedUrlInfo> {
  const extracted = extractUrlFromText(input) || input.trim();
  const normalized = normalizeUrl(extracted);
  const platform = detectPlatform(normalized);

  let host = '';
  try {
    host = new URL(normalized).hostname.replace(/^www\./, '');
  } catch {
    host = 'link';
  }

  const derivedTitle = deriveTitleFromUrl(normalized, platform);
  const faviconUrl = '';

  const result: ExtractedUrlInfo = {
    isValid: Boolean(normalized.startsWith('http://') || normalized.startsWith('https://')),
    rawUrl: normalized,
    normalizedUrl: normalized,
    platform,
    sourceHost: host,
    derivedTitle,
    faviconUrl
  };

  result.thumbnailUrl = getPublicThumbnail(normalized);
  return result;
}

// Public video artwork is available without sending links to a metadata proxy.
export function getPublicThumbnail(url: string): string | undefined {
  try {
    if (detectPlatform(url) !== 'youtube') return undefined;
    const parsed = new URL(normalizeUrl(url));
    const parts = parsed.pathname.split('/').filter(Boolean);
    const id = parsed.hostname === 'youtu.be' ? parts[0] : parsed.searchParams.get('v') || (['shorts','embed','live'].includes(parts[0]) ? parts[1] : '');
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  } catch { /* Use the platform artwork when a preview is unavailable. */ }
  return undefined;
}
