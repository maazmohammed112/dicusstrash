import { useModalLifecycle } from '../hooks/useModalLifecycle';
import React, { useState, useEffect } from 'react';
import type { AppSettings, StorageStats, Collection } from '../types/stash';
import { exportDataToJson, validateBackupFile, executeRestore } from '../services/backupService';
import { computeStorageStats, requestPersistentStorage } from '../db/database';
import { ConfirmationModal } from './ConfirmationModal';
import { medianBridge } from '../services/medianBridge';
import {
  X,
  Database,
  Download,
  Upload,
  Trash2,
  Smartphone
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  collections: Collection[];
  onUpdateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  onEraseAll: () => Promise<void>;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onEraseAll,
  onClose,
  onRefreshData
}) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isPersisted, setIsPersisted] = useState(false);
  const [showEraseConfirm, setShowEraseConfirm] = useState(false);
  const [importNotice, setImportNotice] = useState<string>('');
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    const s = await computeStorageStats();
    setStats(s);

    if (navigator.storage && navigator.storage.persisted) {
      const persisted = await navigator.storage.persisted();
      setIsPersisted(persisted);
    }
  };

  useModalLifecycle(isOpen, onClose);

  if (!isOpen) return null;

  const handleExport = async () => {
    await exportDataToJson();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const validation = await validateBackupFile(file);

    if (!validation.isValid) {
      setImportNotice(`Error: ${validation.errorMessage}`);
      return;
    }

    setPendingRestoreData(validation.packageData);
    setShowRestoreModal(true);
    e.target.value = '';
  };

  const confirmRestore = async (mode: 'merge' | 'replace') => {
    if (!pendingRestoreData) return;
    const res = await executeRestore(pendingRestoreData, mode);
    setShowRestoreModal(false);
    setPendingRestoreData(null);
    setImportNotice(`Restored ${res.restoredItems} items & ${res.restoredCollections} collections!`);
    await onRefreshData();
    await loadStats();
  };

  const handleRequestPersist = async () => {
    const success = await requestPersistentStorage();
    setIsPersisted(success);
  };

  const isMedian = medianBridge.isMedianApp();

  return (
    <div
      role="presentation"
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{
        backgroundColor: 'rgba(21, 21, 21, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Settings and vault" tabIndex={-1}
        className="modal-panel settingsmodal animate-scale relative w-full max-w-xl max-h-[90vh] flex flex-col p-6 sm:p-8 rounded-[36px] overflow-hidden"
        style={{
          backgroundColor: '#FFFEF7',
          border: '1px solid rgba(21, 21, 21, 0.08)',
          boxShadow: '0 24px 64px rgba(21, 21, 21, 0.2)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[rgba(21,21,21,0.06)] mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#151515] tracking-tight">
              Settings & Vault
            </h2>
            <p className="text-xs text-[#77736C]">discuss/stash — local-first personal library</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full bg-[#F6EDCF] hover:bg-[#EADBAB] flex items-center justify-center text-[#151515] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Settings Groups */}
        <div className="modal-scroll flex-1 overflow-y-auto pr-1 flex flex-col gap-6">
          {/* GROUP 1: STORAGE & DIAGNOSTICS */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#FFF9EA] border border-[#EADBAB]">
            <div className="flex items-center gap-2 mb-3">
              <Database size={16} className="text-[#151515]" />
              <h3 className="text-sm font-bold text-[#151515] uppercase tracking-wider">
                Local Vault Storage
              </h3>
            </div>

            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3 text-center">
                <div className="p-2.5 rounded-2xl bg-white border border-[rgba(21,21,21,0.06)]">
                  <span className="text-lg font-bold text-[#151515] block">{stats.totalItems}</span>
                  <span className="text-[10px] font-semibold text-[#77736C]">Total Items</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-[rgba(21,21,21,0.06)]">
                  <span className="text-lg font-bold text-[#151515] block">{stats.totalCollections}</span>
                  <span className="text-[10px] font-semibold text-[#77736C]">Collections</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-[rgba(21,21,21,0.06)]">
                  <span className="text-lg font-bold text-[#151515] block">{stats.totalNotes}</span>
                  <span className="text-[10px] font-semibold text-[#77736C]">Notes</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-white border border-[rgba(21,21,21,0.06)]">
                  <span className="text-lg font-bold text-[#151515] block">
                    {(stats.estimatedTotalBytes / 1024).toFixed(0)} KB
                  </span>
                  <span className="text-[10px] font-semibold text-[#77736C]">Est. Size</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-[#77736C] pt-2 border-t border-[rgba(21,21,21,0.06)]">
              <span>Browser Persistence:</span>
              <span className="font-semibold text-[#151515]">
                {isPersisted ? 'Guaranteed (Active)' : 'Standard (Best Effort)'}
              </span>
            </div>
            {!isPersisted && (
              <button
                type="button"
                onClick={handleRequestPersist}
                className="mt-2 text-xs font-semibold text-[#151515] underline hover:text-[#F2755B] cursor-pointer"
              >
                Request permanent offline storage
              </button>
            )}
          </div>

          {/* GROUP 2: PREFERENCES */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#77736C] uppercase tracking-wider">
              Preferences
            </h3>

            <div className="preference-row"><div><span>Incoming shares</span><span>New links arrive in Unsorted. Use Move to collection to organize them.</span></div></div>

            {/* Share Signature Toggle */}
            <div className="preference-row">
              <div>
                <span className="text-sm font-bold text-[#151515] block">Include App Signature</span>
                <span className="text-xs text-[#77736C]">Attach "Saved with discuss/stash" to shared links</span>
              </div>
              <input
                type="checkbox"
                aria-label="Include app signature"
                checked={settings.includeShareSignature}
                onChange={e => onUpdateSettings({ includeShareSignature: e.target.checked })}
                className="w-5 h-5 rounded accent-[#151515] cursor-pointer"
              />
            </div>

            {/* Quick-Edit on Share Toggle */}
            <div className="preference-row">
              <div>
                <span className="text-sm font-bold text-[#151515] block">Quick-Edit on Share</span>
                <span className="text-xs text-[#77736C]">Show quick edit panel after saving from other apps</span>
              </div>
              <input
                type="checkbox"
                aria-label="Quick edit on share"
                checked={settings.showQuickEditOnShare}
                onChange={e => onUpdateSettings({ showQuickEditOnShare: e.target.checked })}
                className="w-5 h-5 rounded accent-[#151515] cursor-pointer"
              />
            </div>
          </div>

          {/* GROUP 3: BACKUP & RESTORE */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[#77736C] uppercase tracking-wider">
              Backup & Restore
            </h3>

            {importNotice && (
              <div className="p-3 rounded-2xl bg-[#FFF9EA] border border-[#FFD76D] text-xs text-[#151515] font-medium">
                {importNotice}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="p-3.5 rounded-2xl bg-white border border-[rgba(21,21,21,0.08)] hover:bg-[#F6EDCF] flex items-center justify-center gap-2 text-xs font-bold text-[#151515] transition-colors cursor-pointer"
              >
                <Download size={15} />
                <span>Export Backup (JSON)</span>
              </button>

              <label className="p-3.5 rounded-2xl bg-white border border-[rgba(21,21,21,0.08)] hover:bg-[#F6EDCF] flex items-center justify-center gap-2 text-xs font-bold text-[#151515] transition-colors cursor-pointer text-center">
                <Upload size={15} />
                <span>Restore Backup (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* GROUP 4: ANDROID & MEDIAN BRIDGE STATUS */}
          <div className="p-4 rounded-3xl bg-[#FFFDF6] border border-[rgba(21,21,21,0.08)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-[#151515]" />
                <h4 className="text-xs font-bold text-[#151515] uppercase tracking-wider">
                  Android & Median Integration
                </h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isMedian ? 'bg-[#B4E8C2] text-[#151515]' : 'bg-[#F6EDCF] text-[#77736C]'
                }`}
              >
                {isMedian ? 'Median Native Active' : 'PWA / Web Mode'}
              </span>
            </div>
            <p className="text-xs text-[#77736C] leading-relaxed">
              Native callback <code className="bg-[#F6EDCF] px-1 py-0.5 rounded text-[#151515]">median_share_to_app(data)</code> is active and listening for Android share events.
            </p>
          </div>

          {/* GROUP 5: DANGER ZONE */}
          <div className="pt-2 border-t border-[rgba(21,21,21,0.08)]">
            <button
              type="button"
              onClick={() => setShowEraseConfirm(true)}
              className="w-full py-3 px-4 rounded-full border border-dashed border-[#F2755B] text-[#F2755B] hover:bg-[rgba(242,117,91,0.08)] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
              <span>Erase Entire Vault (Reset)</span>
            </button>
          </div>

          {/* ABOUT FOOTER */}
          <div className="text-center pt-2 pb-4 text-xs text-[#77736C]">
            <p className="font-bold text-[#151515]">discuss/stash v1.0.0</p>
            <p className="mt-0.5">Part of the Discuss ecosystem • discussit.in</p>
            <p className="mt-1 text-[11px]">100% Local-first • No cloud tracking • No login</p>
          </div>
        </div>
      </div>

      {/* Erase confirmation requiring typing ERASE */}
      <ConfirmationModal
        isOpen={showEraseConfirm}
        title="Erase everything from this device?"
        description="Your saved links, collections, notes, and local attachments will be permanently removed. This cannot be recovered without a backup."
        requireTypingWord="ERASE"
        confirmText="Permanently Erase"
        onConfirm={async () => {
          setShowEraseConfirm(false);
          await onEraseAll();
          onClose();
        }}
        onCancel={() => setShowEraseConfirm(false)}
      />

      {/* Restore merge vs replace modal */}
      {showRestoreModal && pendingRestoreData && (
        <ConfirmationModal
          isOpen={showRestoreModal}
          title="Restore Backup"
          description={`Found ${pendingRestoreData.items?.length || 0} items and ${pendingRestoreData.collections?.length || 0} collections in backup. Would you like to merge with current items or replace completely?`}
          type="warning"
          isFolderDelete={true}
          confirmText="Replace All Data"
          alternativeText="Merge with Existing Data"
          onConfirmAlternative={() => confirmRestore('merge')}
          onConfirm={() => confirmRestore('replace')}
          onCancel={() => {
            setShowRestoreModal(false);
            setPendingRestoreData(null);
          }}
        />
      )}
    </div>
  );
};
