import React, { useState } from 'react';
import { X, Share2, Copy, Check, ExternalLink, Globe2, CheckCircle2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  projectId: string;
  projectName: string;
  mode?: 'flowchart' | 'structure' | 'ipo';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  projectId,
  projectName,
  mode = 'flowchart',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const modeTitle =
    mode === 'structure'
      ? 'Structure Chart'
      : mode === 'ipo'
      ? 'IPO Chart'
      : 'Flowchart';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
              mode === 'ipo'
                ? 'bg-emerald-600'
                : mode === 'structure'
                ? 'bg-blue-600'
                : 'bg-indigo-600'
            }`}>
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bagikan {modeTitle}</h2>
              <p className="text-[11px] text-slate-500">Tautan unik publik untuk proyek ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Nama Proyek
            </span>
            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{projectName}</p>
          </div>

          <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-900 flex items-center gap-1">
                <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                Kode Unik Proyek:
              </span>
              <span className="px-2 py-0.5 bg-indigo-600 text-white rounded font-mono font-bold text-xs shadow-2xs">
                {projectId}
              </span>
            </div>
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Orang lain yang membuka tautan ini dapat langsung melihat dan mempelajari diagram {modeTitle} yang Anda buat.
            </p>
          </div>

          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-[11px] leading-snug">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Semua data dan struktur otomatis tersinkronisasi saat tautan dibuka oleh siapa pun.</span>
          </div>

          {/* Share Link Field */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
              Tautan Proyek Publik
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 select-all outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              <span>Buka di tab baru</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
