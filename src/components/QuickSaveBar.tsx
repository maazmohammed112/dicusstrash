import React, { useState } from 'react';
import { Clipboard, X, Loader2, ArrowRight } from 'lucide-react';
import { readClipboardUrl } from '../services/clipboardService';
import { detectPlatform, extractUrlFromText } from '../services/platformDetector';

interface QuickSaveBarProps {
  onSaveUrl: (url: string) => Promise<void>;
  isLoading?: boolean;
  onMapsUrl?: (url: string) => void;
}

export const QuickSaveBar: React.FC<QuickSaveBarProps> = ({
  onSaveUrl,
  isLoading = false,
  onMapsUrl
}) => {
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePaste = async () => {
    const url = await readClipboardUrl();
    if (!url) return;
    setInputValue(url); setErrorMessage('');
    if (detectPlatform(url) === 'maps') onMapsUrl?.(url);
  };

  const handleClear = () => {
    setInputValue('');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const detected = extractUrlFromText(inputValue) || inputValue.trim();
    if (!detected || (!detected.includes('.') && !detected.startsWith('http'))) {
      setErrorMessage('Please enter a valid link or web address.');
      return;
    }

    try {
      setErrorMessage('');
      await onSaveUrl(detected);
      setInputValue('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save link.');
    }
  };

  return (
    <div className="quick-save w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full p-1.5 sm:p-2 rounded-full liquid-glass border border-[rgba(255,255,255,0.95)] shadow-[0_8px_32px_rgba(21,21,21,0.06)] focus-within:shadow-[0_12px_36px_rgba(21,21,21,0.1)] focus-within:border-[#151515] transition-all"
      >
        {/* Input */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            const url = extractUrlFromText(e.target.value);
            if (url && detectPlatform(url) === 'maps') onMapsUrl?.(url);
            if (errorMessage) setErrorMessage('');
          }}
          placeholder="Paste something worth keeping..."
          disabled={isLoading}
          className="flex-1 bg-transparent px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-[#151515] placeholder:text-[#77736C] placeholder:font-normal font-medium focus:outline-none min-w-0"
        />

        {/* Clear Button */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 sm:p-2 rounded-full text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF] transition-colors mr-1 cursor-pointer"
            title="Clear"
          >
            <X size={16} />
          </button>
        )}

        {/* Paste from clipboard button */}
        {!inputValue && (
          <button
            type="button"
            onClick={handlePaste}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#77736C] hover:text-[#151515] hover:bg-[#F6EDCF] transition-colors mr-2 cursor-pointer"
            title="Paste from clipboard"
          >
            <Clipboard size={14} />
            <span>Paste</span>
          </button>
        )}

        {/* Add / Submit Button */}
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="h-10 sm:h-11 px-4 sm:px-5 rounded-full bg-[#151515] text-[#FFFEF7] font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#252525] active:scale-95 shadow-md flex-shrink-0"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-white" />
          ) : (
            <>
              <span>Stash</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Validation / error message */}
      {errorMessage && (
        <p className="mt-2 text-xs font-medium text-[#F2755B] px-4 animate-fade-in">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
