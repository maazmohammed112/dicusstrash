# discuss/stash

A responsive, light-theme personal vault built with React, TypeScript, Vite, Dexie and IndexedDB. Save links, notes, checklists, locations and original files. No account or application backend is required.

## Run and compile

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5174
npm run build
npm run preview
```

The build creates `dist/` and a revisioned offline asset manifest. Deploy the **whole dist folder**, including its service worker, manifest, icons, bootstrap and 404 page. Source and the lockfile are committed; generated bundles, dependencies, private environment files and local logs are ignored. No automated test suite was run for this delivery.

## Receiving links

- The installed PWA advertises `/share-target` with GET fields `url`, `title` and `text`. An HTTPS origin and a browser/OS supporting installed Web Share Targets are required. A normal browser tab cannot register itself in another app's share picker.
- Median's native Share into App plugin can call `window.median_share_to_app({ url, subject, text })`. Early native callbacks are queued until the local database and UI are ready. See `MEDIAN_INTEGRATION.md`.
- Incoming messages may contain multiple URLs. New URLs are saved into **Unsorted**; existing URLs are skipped. Open any item and choose **Move** to select its destination collection. The view updates after the local transaction finishes.
- Detection recognizes Instagram, Facebook, Snapchat, WhatsApp, Threads, X/Twitter, YouTube, Spotify, Google Maps/Apple Maps, GitHub, Reddit, Pinterest, Telegram, LinkedIn, TikTok and Discord. Other HTTP(S) websites use the Website icon. Short links are identified by their visible domain; the app does not follow redirects or claim to know their final destination.
- URL parsing runs on-device. It rejects executable schemes and embedded credentials. No private shared URL is submitted to a metadata proxy. Full original web links remain clickable; only known tracking parameters are removed.

## Sharing a collection

Open a collection and choose **Share all links**, or use the collection card's action menu. Review one message containing the folder name, titles, sources and all non-archived link/location URLs. Use the system share sheet (choose an installed app), Copy all, WhatsApp, or download a `.txt` file. Large messages can be copied or downloaded without truncation; receiving apps may impose their own limits. Instagram support depends on what its installed app accepts from the system share sheet.

## Local storage and files

Original images, PDFs, audio and documents are stored as Blobs in IndexedDB, not in the small synchronous localStorage API. Item details offer original-file downloads; supported raster images have contained previews. New attachment writes and item linkage are transactional. Older uploads without a linkage can still be recovered by item ID.

Version 2 JSON backups include attachments. Restore validates web URLs and applies changes in a transaction, with rollback on storage failure. Version 1 backups remain accepted, but those older exports do not contain original files. Backups are portable unencrypted copies and should be kept private. JSON export/import still needs memory proportional to backup size; very large file libraries can exceed available memory.

Capacity is controlled by the browser and device, not an arbitrary app limit. Settings shows estimated usage and lets the user request persistent storage. The app does not promise unlimited storage or encryption at rest. Clearing site data, uninstalling, private browsing or browser eviction can remove local data; export backups. Your vault belongs to its origin: `localhost`, `127.0.0.1`, a production hostname and a native webview can have separate storage. Use the same production HTTPS origin in the wrapper.

The UI renders saved items in batches of 60, with Show more for larger libraries. Search metadata is still loaded in memory. No external script is rendered from user notes or incoming share content.

## Hosting

Netlify/Cloudflare Pages: publish `dist/`; `_redirects` maps `/share-target` to the app shell and `404.html` handles unknown routes. Vercel: the included `vercel.json` sets the build directory and share route. Other static hosts must map `/share-target` to `/index.html`, serve `/sw.js` without stale caching, and serve `404.html` with status 404. Root-domain hosting is expected; GitHub repository-subpath hosting needs a base-path configuration before deployment.

The service worker precaches application assets, retains offline access, isolates this application's cache cleanup and does not cache arbitrary third-party URLs or uploaded files. The development origin disables service-worker registration to avoid stale Vite modules.

## Manual release review

On the actual HTTPS installation and final native wrapper, check inbound shares from each source app, duplicate/multi-link handling, folder moves, collection message sharing, file download, backup/restore, offline launch, storage exhaustion and 404 behavior. Platform share-picker and wrapper integration require device validation before app-store release.

## Compact cards, clipboard and pins

Library cards show a compact title, collection/source label and thumbnail. Notes, checklists and full details stay in the detail panel. Tap the thumbnail to follow a saved link or location; tap the title to view/edit its saved details. Raw URLs and separate Open/View controls are omitted from detail previews; Copy link is available in the toolbar or card menu.

Add/Plus reads the clipboard only in response to the click, and only fills a complete HTTP(S) web address, never ordinary text or a URL embedded in a message. It cannot determine clipboard age. Reading requires device/browser permission and support; a blank editor and manual paste remain available when access is denied. Maps links pasted into the home quick input or Add link field switch to the location editor. Readable map place names are derived from URL fields; opaque short links may need a name entered manually.

Thumbnail support includes existing saved preview images, public YouTube video artwork and locally uploaded raster images. Other sites use a platform illustration when actual preview artwork is unavailable; authenticated social posts are not scraped. Public thumbnail requests go directly to the image host with no referrer. There is no generic third-party metadata proxy.

Pin up to five active items per folder. Pinned items sort first in folder/search views and remain separate from favorites. Archiving clears the pin. Moving a pinned item to a folder whose five slots are occupied requires unpinning first. Deleting a collection and moving its items to Unsorted clears their folder-specific pins.
