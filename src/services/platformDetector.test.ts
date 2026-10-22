import { describe, it, expect } from 'vitest';
import {
  detectPlatform,
  normalizeUrl,
  extractUrlFromText,
  deriveTitleFromUrl
} from './platformDetector';

describe('platformDetector', () => {
  describe('detectPlatform', () => {
    it('identifies Instagram URLs correctly', () => {
      expect(detectPlatform('https://www.instagram.com/p/C3abc123/')).toBe('instagram');
      expect(detectPlatform('instagram.com/reel/C8xyz')).toBe('instagram');
    });

    it('identifies Threads URLs', () => {
      expect(detectPlatform('https://www.threads.net/@designer/post/123')).toBe('threads');
      expect(detectPlatform('https://threads.com/t/abc')).toBe('threads');
    });

    it('identifies X / Twitter URLs', () => {
      expect(detectPlatform('https://x.com/design_sprint/status/123')).toBe('x');
      expect(detectPlatform('https://twitter.com/discussit/status/456')).toBe('x');
    });

    it('identifies YouTube URLs', () => {
      expect(detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
      expect(detectPlatform('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
      expect(detectPlatform('https://youtube.com/shorts/abc123xyz')).toBe('youtube');
    });

    it('identifies Spotify URLs', () => {
      expect(detectPlatform('https://open.spotify.com/track/4cOdK2wGLEKBW3nevg')).toBe('spotify');
      expect(detectPlatform('https://open.spotify.com/album/3RQQmkQEvtn9')).toBe('spotify');
    });

    it('identifies Google Maps URLs', () => {
      expect(detectPlatform('https://maps.app.goo.gl/9ZpZ')).toBe('maps');
      expect(detectPlatform('https://www.google.com/maps/place/Tokyo')).toBe('maps');
    });

    it('identifies GitHub, Reddit, and Pinterest', () => {
      expect(detectPlatform('https://github.com/discussit/stash')).toBe('github');
      expect(detectPlatform('https://reddit.com/r/webdev/comments/123/slug')).toBe('reddit');
      expect(detectPlatform('https://pinterest.com/pin/123456')).toBe('pinterest');
    });

    it('identifies generic websites', () => {
      expect(detectPlatform('https://discussit.in')).toBe('website');
      expect(detectPlatform('https://linear.app/features')).toBe('website');
    });
  });

  describe('normalizeUrl', () => {
    it('strips marketing and tracking parameters', () => {
      const dirtyUrl = 'https://instagram.com/p/123?utm_source=share&utm_medium=ios_app&igsh=abcdef&fbclid=xyz';
      const clean = normalizeUrl(dirtyUrl);
      expect(clean).toBe('https://instagram.com/p/123');
    });

    it('preserves important identifiers like YouTube video id', () => {
      const ytUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter&si=tracking123';
      const clean = normalizeUrl(ytUrl);
      expect(clean).toContain('v=dQw4w9WgXcQ');
      expect(clean).not.toContain('utm_source');
      expect(clean).not.toContain('si=tracking123');
    });

    it('adds https scheme when protocol is omitted', () => {
      expect(normalizeUrl('discussit.in')).toBe('https://discussit.in');
    });
  });

  describe('extractUrlFromText', () => {
    it('extracts URL from shared messy text', () => {
      const text = 'Check out this amazing article: https://discussit.in/blog/local-first. Really cool!';
      const extracted = extractUrlFromText(text);
      expect(extracted).toBe('https://discussit.in/blog/local-first');
    });

    it('handles URLs without protocol in text', () => {
      const text = 'Visit discussit.in for more info';
      const extracted = extractUrlFromText(text);
      expect(extracted).toBe('discussit.in');
    });
  });

  describe('deriveTitleFromUrl', () => {
    it('derives human-readable title from GitHub URL', () => {
      const title = deriveTitleFromUrl('https://github.com/google/antigravity', 'github');
      expect(title).toBe('google/antigravity');
    });

    it('derives readable title from slugged article URL', () => {
      const title = deriveTitleFromUrl('https://stash.discussit.in/articles/local-first-personal-vault.html', 'website');
      expect(title).toBe('Local First Personal Vault — stash.discussit.in');
    });
  });
});
