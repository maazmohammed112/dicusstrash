import { inspectUrl, extractUrlFromText, normalizeUrl } from '../services/platformDetector';
import React, { useState, useEffect } from 'react';
import type { Collection, LocationData } from '../types/stash';
import { MapPin, Link2, Folder, FileText } from 'lucide-react';

interface LocationEditorProps {
  initialData?: LocationData;
  initialNote?: string;
  initialFolderId?: string;
  collections: Collection[];
  onSave: (data: {
    placeName: string;
    mapsUrl?: string;
    address?: string;
    note?: string;
    folderId: string;
  }) => void;
  onCancel: () => void;
}

export const LocationEditor: React.FC<LocationEditorProps> = ({
  initialData,
  initialNote = '',
  initialFolderId = 'unsorted',
  collections,
  onSave,
  onCancel
}) => {
  const [placeName, setPlaceName] = useState(initialData?.placeName || '');
  const [mapsUrl, setMapsUrl] = useState(initialData?.mapsUrl || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [note, setNote] = useState(initialNote);
  const [folderId, setFolderId] = useState(
    collections.some(c => c.id === initialFolderId) ? initialFolderId : 'unsorted'
  );

  useEffect(() => {
    if (initialData) {
      setPlaceName(initialData.placeName || ''); setMapsUrl(initialData.mapsUrl || ''); setAddress(initialData.address || '');
    }
  }, [initialData?.placeName, initialData?.mapsUrl, initialData?.address]);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim() && !mapsUrl.trim()) return;

    let normalizedMapsUrl: string | undefined;
    try { normalizedMapsUrl = mapsUrl.trim() ? normalizeUrl(mapsUrl.trim()) : undefined; }
    catch { setError('Please paste a valid map URL.'); return; }
    try { await onSave({
      placeName: placeName.trim() || 'Saved Location',
      mapsUrl: normalizedMapsUrl,
      address: address.trim() || undefined,
      note: note.trim() || undefined,
      folderId
    }); } catch { setError('The location could not be saved. Please try again.'); }
  };

  return (
    <form onSubmit={handleSubmit} className="location-editor flex flex-col gap-4">
      {error && <p role="alert" className="file-error">{error}</p>}
      <div>
        <label className="text-xs font-semibold text-[#77736C] flex items-center gap-1.5 mb-1.5">
          <MapPin size={13} />
          <span>Place Name</span>
        </label>
        <input
          type="text"
          value={placeName}
          onChange={e => setPlaceName(e.target.value)}
          placeholder="e.g. Blue Bottle Coffee, Tokyo"
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] font-semibold focus:outline-none focus:ring-2 focus:ring-[#151515]"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-[#77736C] flex items-center gap-1.5 mb-1.5">
          <Link2 size={13} />
          <span>Google Maps URL (Optional)</span>
        </label>
        <input
          type="text"
          value={mapsUrl}
          onChange={async e => {
            const value = e.target.value; setMapsUrl(value); setError('');
            const extracted = extractUrlFromText(value);
            if (extracted) {
              try { const info = await inspectUrl(extracted); if (info.platform === 'maps') setPlaceName(info.derivedTitle); } catch { /* Keep manual entry. */ }
            }
          }}
          placeholder="https://maps.app.goo.gl/..."
          className="w-full px-4 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] focus:outline-none focus:ring-2 focus:ring-[#151515]"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-[#77736C] flex items-center gap-1.5 mb-1.5">
          <span>Address or Landmark (Optional)</span>
        </label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Street, City, Neighborhood..."
          className="w-full px-4 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] focus:outline-none focus:ring-2 focus:ring-[#151515]"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-[#77736C] flex items-center gap-1.5 mb-1.5">
          <FileText size={13} />
          <span>Notes & Recommendations</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What to order, best time to visit, tip notes..."
          rows={3}
          className="w-full p-3 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-sm text-[#151515] focus:outline-none focus:ring-2 focus:ring-[#151515] resize-y"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-[#77736C] flex items-center gap-1.5 mb-1.5">
          <Folder size={13} />
          <span>Folder</span>
        </label>
        <select
          value={folderId}
          onChange={e => setFolderId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[rgba(21,21,21,0.12)] bg-white text-xs font-semibold text-[#151515] focus:outline-none cursor-pointer"
        >
          {collections.map(col => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2.5 pt-2">
        <button
          type="submit"
          disabled={!placeName.trim() && !mapsUrl.trim()}
          className="flex-1 py-3 px-5 rounded-full bg-[#151515] text-[#FFFEF7] font-semibold text-sm cursor-pointer disabled:opacity-30 hover:bg-[#252525] transition-all shadow-md"
        >
          Save Location
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="py-3 px-5 rounded-full text-sm font-medium text-[#77736C] hover:text-[#151515] transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
