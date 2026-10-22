# Native Share into App setup

This repository provides a web app and Median JavaScript callback, not a compiled Android/iOS binary.

1. Deploy the complete `dist/` directory to your own HTTPS origin.
2. In Median App Studio, set that origin as the initial URL and enable the JavaScript Bridge and **Share into App** plugin.
3. Configure the native plugin to accept URL/text shares (`text/plain`) and its platform-specific Share Extension/intent settings. Keep the native wrapper on the same origin to retain its IndexedDB vault.
4. `public/bootstrap.js` registers `median_share_to_app` early. React takes over the callback once IndexedDB is initialized. Payloads use `url`, `subject` (or `title`) and `text`; a message may contain multiple links.
5. Incoming URLs default to Unsorted. Move destinations and collection sharing are managed inside the vault. Outbound sharing uses `median.share.sharePage`, then the Web Share API, with clipboard fallback.
6. Manually validate installed-app shares from WhatsApp, Instagram, Maps, Facebook, Snapchat and browsers on the actual target devices. The website cannot force an uninstalled or unconfigured wrapper to appear in another app's share menu.

PWA installations can receive text/link shares through `public/manifest.json` on supporting operating systems and browsers. PWA file-share ingestion is not advertised; original files are uploaded through the File editor.

Official configuration references:
- https://docs.median.co/docs/share-into-app
- https://docs.median.co/docs/prompt-share-dialogue
- https://developer.chrome.com/docs/capabilities/web-apis/web-share-target

No native app-store package, signing credentials or platform account configuration is included. No native-device certification or automated testing was performed.
