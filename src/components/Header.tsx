import React, { useState, useRef, useEffect } from 'react';
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
  Table2,
  ChevronDown,
  Check,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { FLOWCHART_TEMPLATES } from '../utils/templates';
import { STRUCTURE_TEMPLATES } from '../utils/structureTemplates';
import { IPO_TEMPLATES } from '../utils/ipoTemplates';

interface HeaderProps {
  activeMode: 'flowchart' | 'structure' | 'ipo';
  onChangeMode: (mode: 'flowchart' | 'structure' | 'ipo') => void;
  projectName: string;
  onSetProjectName: (name: string) => void;
  onOpenProjectModal: () => void;
  onSelectTemplate: (code: string) => void;
  onSelectIpoTemplate?: (templateId: string) => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  direction: 'TB' | 'LR';
  onToggleDirection: () => void;
  onOpenHelp: () => void;
  isFullscreenFlowchart?: boolean;
  onToggleFullscreen?: () => void;
  onShareProject?: () => void;
  isSharing?: boolean;
  highlightExport?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onChangeMode,
  projectName,
  onSetProjectName,
  onOpenProjectModal,
  onSelectTemplate,
  onSelectIpoTemplate,
  onExportPNG,
  onExportJSON,
  direction,
  onToggleDirection,
  onOpenHelp,
  isFullscreenFlowchart,
  onToggleFullscreen,
  onShareProject,
  isSharing,
  highlightExport,
}) => {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsToolsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsToolsMenuOpen(false);
      }
    };

    if (isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isToolsMenuOpen]);

  const handleSelectFlowchartTemplate = (tplId: string) => {
    const tpl = FLOWCHART_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      onSelectTemplate(tpl.code);
      onSetProjectName(tpl.title.replace(/^\d+\.\s*/, ''));
      setIsToolsMenuOpen(false);
    }
  };

  const handleSelectStructureTemplate = (tplId: string) => {
    const tpl = STRUCTURE_TEMPLATES.find((t) => t.id === tplId);
    if (tpl) {
      onSelectTemplate(tpl.code);
      onSetProjectName(tpl.title.replace(/^\d+\.\s*/, ''));
      setIsToolsMenuOpen(false);
    }
  };

  const handleSelectIpoTemplateItem = (tplId: string) => {
    if (onSelectIpoTemplate) {
      onSelectIpoTemplate(tplId);
      setIsToolsMenuOpen(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-3 md:px-4 flex items-center justify-between shrink-0 select-none z-20 gap-2 relative">
      {/* 1. BRAND, PROJECT NAME & MANAJEMEN BERKAS (LEFT) */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs shrink-0 transition-colors ${
            activeMode === 'ipo'
              ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
              : activeMode === 'structure'
              ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
              : 'bg-gradient-to-br from-indigo-600 to-blue-700'
          }`}
        >
          {activeMode === 'ipo' ? (
            <Table2 className="w-4 h-4" />
          ) : activeMode === 'structure' ? (
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
              className="font-bold text-xs text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-indigo-500 max-w-[110px] sm:max-w-[160px] md:max-w-[190px] truncate"
            />
            <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0" />
          </div>

          {/* FITUR MANAJEMEN BERKAS: PROYEK & JSON DI NAVBAR */}
          <button
            onClick={onOpenProjectModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Buka atau Simpan Proyek (Lokal & Berkas JSON)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="hidden sm:inline">Proyek & JSON</span>
          </button>
        </div>
      </div>

      {/* 2. MODE SWITCHER TABS (CENTER) */}
      <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
        <button
          onClick={() => onChangeMode('flowchart')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'flowchart'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Beralih ke Diagram Flowchart Alur Logika"
        >
          <Workflow className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Flowchart</span>
        </button>

        <button
          onClick={() => onChangeMode('structure')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'structure'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Beralih ke Structure Chart Dekomposisi Modul"
        >
          <Network className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Structure</span>
        </button>

        <button
          onClick={() => onChangeMode('ipo')}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'ipo'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Beralih ke IPO Chart Builder (Input – Process – Output)"
        >
          <Table2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">IPO Chart</span>
        </button>
      </div>

      {/* 3. RIGHT CONTROLS: UNDUH JSON + TEMPLATE DROPDOWN + SHARE + EXPORT + HELP/TUTORIAL */}
      <div
        className={`flex items-center gap-1.5 shrink-0 transition-all rounded-xl p-0.5 ${
          highlightExport ? 'ring-2 ring-indigo-500 ring-offset-2 animate-pulse bg-indigo-50/50' : ''
        }`}
      >
        {/* FITUR MANAJEMEN BERKAS: UNDUH .JSON DI NAVBAR */}
        <button
          onClick={onExportJSON}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          title={`Unduh berkas konfigurasi ${activeMode} format JSON (.json)`}
        >
          <FileJson className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">Unduh .JSON</span>
        </button>

        {/* INTERACTIVE TEMPLATE & LAYOUT DROPDOWN */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              isToolsMenuOpen
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs'
            }`}
            title="Pilih Template Proyek & Pengaturan Tata Letak"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Template</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                isToolsMenuOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </button>

          {/* FLYOUT POPOVER: TEMPLATE & TATA LETAK */}
          {isToolsMenuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-3.5 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Flyout Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      Template & Tata Letak
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Mode:{' '}
                      <span className="font-semibold text-slate-700 uppercase">
                        {activeMode === 'flowchart'
                          ? 'Flowchart'
                          : activeMode === 'structure'
                          ? 'Structure Chart'
                          : 'IPO Chart'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsToolsMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* SECTION 1: TEMPLATE CARDS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Pilih Template Proyek
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Siap Pakai</span>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {activeMode === 'flowchart' &&
                    FLOWCHART_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleSelectFlowchartTemplate(tpl.id)}
                        className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/60 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 truncate">
                            {tpl.title}
                          </span>
                          <Sparkles className="w-3 h-3 text-amber-500 opacity-60 group-hover:opacity-100 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 group-hover:text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                          {tpl.description}
                        </p>
                      </button>
                    ))}

                  {activeMode === 'structure' &&
                    STRUCTURE_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleSelectStructureTemplate(tpl.id)}
                        className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/60 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900 truncate">
                            {tpl.title}
                          </span>
                          <Sparkles className="w-3 h-3 text-amber-500 opacity-60 group-hover:opacity-100 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 group-hover:text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                          {tpl.description}
                        </p>
                      </button>
                    ))}

                  {activeMode === 'ipo' &&
                    IPO_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleSelectIpoTemplateItem(tpl.id)}
                        className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/60 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 truncate">
                            {tpl.title}
                          </span>
                          <Sparkles className="w-3 h-3 text-amber-500 opacity-60 group-hover:opacity-100 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 group-hover:text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                          {tpl.description}
                        </p>
                      </button>
                    ))}
                </div>
              </div>

              {/* SECTION 2: TATA LETAK & KANVAS */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Tata Letak & Kanvas
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {/* Direction Switcher (Flowchart) */}
                  {activeMode === 'flowchart' ? (
                    <button
                      onClick={onToggleDirection}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                      title="Ubah Arah Alur Diagram"
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
                    <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{activeMode === 'structure' ? 'Top-Down Tree' : '3-Kolom IPO'}</span>
                    </div>
                  )}

                  {/* Fullscreen Toggle */}
                  {onToggleFullscreen && (
                    <button
                      onClick={() => {
                        onToggleFullscreen();
                        setIsToolsMenuOpen(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isFullscreenFlowchart
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isFullscreenFlowchart ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>Buka Editor</span>
                        </>
                      ) : (
                        <>
                          <Maximize className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Layar Penuh</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SHARE BUTTON (All modes) */}
        {onShareProject && (
          <button
            onClick={onShareProject}
            disabled={isSharing}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border rounded-xl text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 cursor-pointer ${
              activeMode === 'ipo'
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                : activeMode === 'structure'
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
            title={`Bagikan ${
              activeMode === 'ipo'
                ? 'IPO Chart'
                : activeMode === 'structure'
                ? 'Structure Chart'
                : 'Flowchart'
            } ini dengan Tautan Unik Publik`}
          >
            {isSharing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Bagikan</span>
          </button>
        )}

        {/* EXPORT PNG BUTTON */}
        <button
          onClick={onExportPNG}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all text-white cursor-pointer ${
            activeMode === 'ipo'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              : activeMode === 'structure'
              ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
          }`}
          title="Download gambar format PNG resolusi tinggi tanpa terpotong"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor PNG</span>
        </button>

        {/* HELP / TUTORIAL BUTTON (?) */}
        <button
          onClick={onOpenHelp}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs ml-0.5"
          title="Buka Tutorial Interaktif & Panduan Simbol (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
