import { ArrowLeft, Bookmark } from 'lucide-react';
export function NotFound() {
  return <main className="not-found-page"><a className="brand-lockup" href="/"><Bookmark size={24} />discuss/stash</a><div><span className="eyebrow">A LITTLE OUT OF PLACE</span><span className="not-found-number" aria-hidden="true">404</span><h1>This page isn’t in your stash.</h1><p>The link may have moved, or the address may be incomplete. Your saved items are still in your vault.</p><a className="pill-btn pill-btn-black" href="/"><ArrowLeft size={17} />Back to your vault</a></div></main>;
}
