import React from 'react';
import {
  Download,
  HelpCircle,
  Sparkles,
  ArrowDownUp,
  ArrowLeftRight,
  FileCode2,
  FolderOpen,
  FileJson,
  Edit2,
  Maximize,
  Minimize2,
  Share2,
  Loader2,
  Workflow,
  Network,
} from 'lucide-react';
import { FLOWCHART_TEMPLATES } from '../utils/templates';
import { STRUCTURE_TEMPLATES } from '../utils/structureTemplates';

interface HeaderProps {
  activeMode: 'flowchart' | 'structure';
  onChangeMode: (mode: 'flowchart' | 'structure') => void;
  projectName: string;
  onSetProjectName: (name: string) => void;
  onOpenProjectModal: () => void;
  onSelectTemplate: (code: string) => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  direction: 'TB' | 'LR';
  onToggleDirection: () => void;
  onOpenHelp: () => void;
  isFullscreenFlowchart?: boolean;
  onToggleFullscreen?: () => void;
  onShareProject?: () => void;
  isSharing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onChangeMode,
  projectName,
  onSetProjectName,
  onOpenProjectModal,
  onSelectTemplate,
  onExportPNG,
  onExportJSON,
  direction,
  onToggleDirection,
  onOpenHelp,
  isFullscreenFlowchart,
  onToggleFullscreen,
  onShareProject,
  isSharing,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 md:px-4 flex items-center justify-between shrink-0 select-none z-20 gap-2">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs shrink-0 transition-colors ${
          activeMode === 'structure'
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
            : 'bg-gradient-to-br from-indigo-600 to-blue-700'
        }`}>
          {activeMode === 'structure' ? (
            <Network className="w-4 h-4" />
          ) : (
            <FileCode2 className="w-4 h-4" />
          )}
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <div className="group flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <input
              type="text"
              value={projectName}
              onChange={(e) => onSetProjectName(e.target.value)}
              title="Klik untuk mengubah nama proyek"
              className="font-bold text-xs text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-indigo-500 max-w-[120px] sm:max-w-[170px] truncate"
            />
            <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
          </div>

          <button
            onClick={onOpenProjectModal}
            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg text-xs font-semibold transition-all shadow-2xs shrink-0"
            title="Buka atau Simpan Proyek (Lokal & Berkas JSON)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Proyek & JSON</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher: Flowchart vs Structure Chart */}
      <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
        <button
          onClick={() => onChangeMode('flowchart')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'flowchart'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Beralih ke Diagram Flowchart Alur Logika"
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Flowchart</span>
        </button>

        <button
          onClick={() => onChangeMode('structure')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'structure'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Beralih ke Structure Chart Dekomposisi Modul (Standar BINUS)"
        >
          <Network className="w-3.5 h-3.5" />
          <span>Structure Chart</span>
        </button>
      </div>

      {/* Center Controls: Templates & Direction */}
      <div className="hidden xl:flex items-center gap-2">
        {/* Template selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 ml-1.5 shrink-0" />
          <select
            className="bg-transparent text-xs text-slate-700 font-medium py-1 pr-2 outline-none cursor-pointer"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                if (activeMode === 'flowchart') {
                  const tpl = FLOWCHART_TEMPLATES.find((t) => t.id === e.target.value);
                  if (tpl) {
                    onSelectTemplate(tpl.code);
                    onSetProjectName(tpl.title.replace(/^\d+\.\s*/, ''));
                  }
                } else {
                  const tpl = STRUCTURE_TEMPLATES.find((t) => t.id === e.target.value);
                  if (tpl) {
                    onSelectTemplate(tpl.code);
                    onSetProjectName(tpl.title.replace(/^\d+\.\s*/, ''));
                  }
                }
                e.target.value = '';
              }
            }}
          >
            <option value="" disabled>
              {activeMode === 'flowchart' ? 'Pilih Template Flowchart...' : 'Pilih Template Structure Chart...'}
            </option>
            {(activeMode === 'flowchart' ? FLOWCHART_TEMPLATES : STRUCTURE_TEMPLATES).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Direction switch (Only active in Flowchart mode) */}
        {activeMode === 'flowchart' ? (
          <button
            onClick={onToggleDirection}
            title={`Arah Diagram: ${direction === 'TB' ? 'Atas ke Bawah (TB)' : 'Kiri ke Kanan (LR)'}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all"
          >
            {direction === 'TB' ? (
              <>
                <ArrowDownUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>Atas &rarr; Bawah</span>
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kiri &rarr; Kanan</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg shadow-2xs">
            <Network className="w-3.5 h-3.5 text-blue-600" />
            <span>Top-Down Tree</span>
          </div>
        )}
      </div>

      {/* Right Controls: Exports & Help */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Export JSON Quick button */}
        <button
          onClick={onExportJSON}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition-all"
          title="Unduh berkas pseudocode format JSON (.json)"
        >
          <FileJson className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">JSON</span>
        </button>

        {/* Fullscreen Flowchart button */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isFullscreenFlowchart
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title={
              isFullscreenFlowchart
                ? 'Tampilkan Menu Code (Keluar Layar Penuh)'
                : 'Layar Penuh Flowchart (Sembunyikan Menu Code)'
            }
          >
            {isFullscreenFlowchart ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tampilkan Code</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </>
            )}
          </button>
        )}

        {/* Share Button with Unique Code */}
        {onShareProject && (
          <button
            onClick={onShareProject}
            disabled={isSharing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
            title="Bagikan Flowchart ini dengan Tautan Unik Publik"
          >
            {isSharing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Bagikan</span>
          </button>
        )}

        {/* Export PNG */}
        <button
          onClick={onExportPNG}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all shadow-indigo-200"
          title="Download gambar Flowchart format PNG resolusi tinggi tanpa terpotong"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor PNG</span>
        </button>

        {/* Help button */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Panduan Sintaks & Bentuk Flowchart"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
