import { normalizeUrl } from './platformDetector';
// Read only after an explicit Add/Paste click, never on page load or app resume.
export async function readClipboardUrl(): Promise<string | null> {
  try {
    if (!navigator.clipboard?.readText) return null;
    const text = (await navigator.clipboard.readText()).trim();
    if (!text || /\s/.test(text)) return null;
    const url = normalizeUrl(text);
    if (!new URL(url).hostname.includes('.')) return null;
    return url;
  } catch { return null; }
}
