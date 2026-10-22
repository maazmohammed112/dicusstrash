# PRD: discuss/stash

## Overview
**discuss/stash** (`stash.discussit.in`) is a warm, editorial, playful, premium, futuristic, and minimal local-first personal bookmark and content repository. It runs as a full-viewport PWA, responsive web application, and Median.co Android WebView app. All data is stored in IndexedDB (offline-first, zero login/cloud account).

Visual theme: Warm light palette (Warm Ivory `#FFF9EA`, Soft Cream `#F6EDCF`, Deep Ink `#151515`, Soft Coral `#F2755B`, Butter Yellow `#FFD76D`, Powder Blue `#BFD9F8`, Soft Lavender `#DCCCF5`), rounded organic surfaces, floating liquid-glass navigation, hand-drawn flourishes (Caveat), Lucide icons + SVG platform logos, strictly NO emojis, NO stars, NO green dots, and NO dark mode.

---

## Task 1: Project Setup, Fonts, Tokens & Design System Foundation
- Install `dexie`, `lucide-react`, `canvas-confetti`.
- Configure Google Fonts: `Plus Jakarta Sans` for clean modern geometric typography and `Caveat` for handwritten accents and highlights.
- Create unified design system in `src/styles/tokens.css` and `src/styles/globals.css` with warm ivory/cream palette, liquid-glass blurs, elevation, rounded pill shapes, micro-animations, and responsive clamp typography.
- Setup safe PWA manifest (`public/manifest.json`), icons, and service worker registration with Web Share Target endpoint `/share-target`.

## Task 2: IndexedDB Local-First Database & Repositories
- Implement Dexie database `stash_db` with versioned schema:
  - `items`: id, type, originalUrl, normalizedUrl, title, description, note, platform, sourceHost, thumbnail, metadataStatus, folderId, tags, isFavorite, isArchived, checklist, locationData, attachmentId, createdAt, updatedAt, publishedAt.
  - `collections`: id, name, description, icon, color, sortOrder, createdAt, updatedAt.
  - `attachments`: id, itemId, fileName, fileType, fileSize, blob, createdAt.
  - `settings`: key, value.
- Seed default "Unsorted" folder (permanent built-in collection).
- Implement atomic CRUD operations, migration safe guards, and local storage statistics calculation.

## Task 3: Platform Detection, URL Normalization & Link Intelligence
- Support auto-detection of platforms: Instagram, Threads, X/Twitter, YouTube, Spotify, Google Maps, GitHub, Reddit, Pinterest, generic websites.
- Provide custom, balanced SVG platform marks.
- Implement robust URL normalization (removing tracking params like `utm_*`, `igsh`, `si`, while preserving essential video/post/map IDs).
- Duplicate check with warning: "This link is already in your stash" -> View Existing / Update / Keep Another Copy.
- Client-side safe metadata extraction with fallback hierarchy (cached thumbnail -> OpenGraph / favicon -> source logo -> warm editorial fallback).
- "Refresh Preview" action.

## Task 4: Liquid Glass App Shell, Navigation & Responsive Layout
- Full-viewport responsive app shell (`100dvh`, safe area insets).
- Mobile: Floating liquid-glass navigation bar with Home, Search, prominent black circular `+` (Add) button, Collections.
- Desktop & Tablet: Elegant responsive navigation rail / sidebar and wide multi-column layout (never a narrow centered mobile rectangle on desktop!).
- Header with editorial branding "discuss/stash", subtle status, and quick settings trigger.

## Task 5: Home Screen & Quick Save Experience
- Editorial expressive header: "Your little corner of the internet."
- Prominent Quick Save bar: "Paste something worth keeping..." with clipboard paste, auto-detect, clear button, instant Enter save.
- "Recently Saved" section: EXACTLY the latest 5 saved items, showing thumbnail/platform badge, title, collection pill, relative time, copy button, and context menu.
- Collections organic grid: Colorful rounded cards (butter yellow, soft coral, pastel blue, soft lavender, cream) showing folder icon, name, item count, contextual menu.
- Warm, playful empty states when the library is fresh.

## Task 6: Comprehensive Add Modal & Multi-Format Creators
- Floating liquid-glass sheet on mobile, centered modal on desktop.
- 5 creation modes:
  1. **Save a Link**: URL input, auto-fetch title/platform, folder picker, inline collection creation.
  2. **Write a Note**: Editorial note editor with title, multiline rich/highlighted text with marker pin style, hand-drawn flourishes, tags.
  3. **Create a Checklist**: Interactive to-do checklist with circular checks, add/remove/reorder items.
  4. **Save a Location**: Place name, address, Google Maps URL, notes, collection.
  5. **Attach a File**: Local file picker (PDF, image, audio, doc) stored safely as IndexedDB blob with file size/type info.

## Task 7: Collections & Folder Management
- Built-in "Unsorted" collection (permanent).
- Add new collection with custom name, icon, and curated pastel palette color.
- Edit collection (rename, change color/icon, change description).
- Collection detail view: list/grid of items inside the folder, search inside collection, sort.
- Safe folder deletion dialog: "Delete this collection?" -> Cancel / Move Items to Unsorted / Delete Collection and Its Items.

## Task 8: Item Detail View, Full Editing & Outward Sharing
- Polished editorial detail view with large typography, platform badge, thumbnail/preview, personal notes, tags, dates.
- Actions:
  - Open Original (safe external navigation)
  - Copy Link (1-tap with elegant toast notification)
  - Native Outbound Sharing (`navigator.share` or Median `median.share.sharePage` or formatted copy with optional "Saved with discuss/stash" signature)
  - Edit Item (with unsaved changes protection: "Discard your changes?")
  - Move to Collection
  - Favorite (heart toggle)
  - Archive / Restore
  - Refresh Preview
  - Delete (with custom destructive confirmation dialog)

## Task 9: Instant Offline Search, Filters & Bulk Multi-Select
- Instant offline search across titles, URLs, notes, tags, collection names, and platforms.
- Pill filters: All, Links, Notes, Locations, Checklists, Files, Favorites, Archived.
- Platform filter and Folder dropdown.
- Bulk Multi-Select mode (long press or select button) with floating liquid-glass contextual toolbar: Move Selected, Archive Selected, Delete Selected, Cancel.

## Task 10: Android Share-Into-App, PWA Share Target & Median.co Bridge
- PWA Web Share Target handler route (`/share-target`): parses incoming URL, title, text; auto-saves immediately before user edits; presents optional quick-edit sheet.
- Median.co JavaScript Bridge:
  - Registers `window.median_share_to_app(data)` callback on cold launch and app resume.
  - Unified `saveIncomingShare()` handler shared across PWA and Median wrapper.
  - In-app documentation and status checker for Median App Studio integration.

## Task 11: Settings, Storage Diagnostics, Backup & Restore
- General Settings: default save folder, quick-edit toggle on share, share signature toggle, auto-preview toggle.
- Storage Diagnostics: Total saved items, collections, notes, attachments, estimated storage used.
- Export Data: Versioned JSON export with all items, collections, notes, tags.
- Import Data: Validated JSON import with "Merge with Existing" or "Replace Existing" options.
- Clear preview cache & Erase All Data (deliberate confirmation requiring typing `ERASE`).

## Task 12: Visual Polish, CodeRabbit Review & End-to-End Verification
- Audit against the 4 reference images:
  - Warm cream background, deep ink typography, soft coral/butter yellow/powder blue accents.
  - Frosted liquid-glass pills, floating circular `+` button, marker highlight effect, hand-drawn circle/arrow doodles.
  - Zero emojis, zero stars, zero green dots.
- Automated tests and browser verification across mobile (360px, 390px, 430px) and desktop (1024px, 1440px).
- Verify all 12 key user journeys from the PRD.
