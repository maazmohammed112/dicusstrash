import { handleIncomingShare, type InboundShareResult } from './shareService';
export interface MedianShareData { url?: string; subject?: string; title?: string; text?: string; }
type ShareListener = (result: InboundShareResult) => void;
class MedianBridgeService {
  private listeners = new Set<ShareListener>();
  private queue: MedianShareData[] = [];
  private running = false;
  private initialized = false;
  init() {
    if (this.initialized) return;
    this.initialized = true;
    const appWindow = window as any;
    this.queue.push(...(appWindow.__stashPendingShares || []));
    appWindow.__stashPendingShares = [];
    appWindow.median_share_to_app = (data: MedianShareData) => this.handleNativeShare(data);
    const params = new URLSearchParams(location.search);
    if (params.has('url') || params.has('text') || params.has('subject') || params.has('title')) {
      this.queue.push({ url: params.get('url') || undefined, text: params.get('text') || undefined, subject: params.get('subject') || params.get('title') || undefined });
      history.replaceState({}, '', '/');
    }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void this.flushPending(); });
  }
  addListener(listener: ShareListener) { this.listeners.add(listener); void this.flushPending(); return () => { this.listeners.delete(listener); }; }
  async handleNativeShare(data: MedianShareData) {
    if (!data || typeof data !== 'object') return;
    this.queue.push(data);
    await this.flushPending();
  }
  private async flushPending() {
    if (this.running || !this.listeners.size) return;
    this.running = true;
    try {
      while (this.queue.length && this.listeners.size) {
        const payload = this.queue.shift()!;
        let result: InboundShareResult;
        try { result = await handleIncomingShare({ url: payload.url, title: payload.subject || payload.title, text: payload.text }); }
        catch { result = { status: 'error', message: 'Could not save the shared content. Check available device storage and try again.' }; }
        this.listeners.forEach(listener => listener(result));
      }
    } finally { this.running = false; }
  }
  isMedianApp() { return Boolean((window as any).median || (window as any).gonative || /Median|GoNative/.test(navigator.userAgent)); }
}
export const medianBridge = new MedianBridgeService();
