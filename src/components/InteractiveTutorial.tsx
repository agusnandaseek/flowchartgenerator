import React, { useState, useEffect } from 'react';
import {
  TUTORIAL_CONFIGS,
  getAllTutorialProgress,
  saveTutorialProgress,
  resetTutorialProgress,
  type TutorialProgressState,
} from '../utils/tutorialData';
import {
  GraduationCap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Minus,
  Maximize2,
  Sparkles,
  FastForward,
  RotateCcw,
  Copy,
  Check,
  Code2,
  HelpCircle,
  Layers,
  BookOpen,
  MapPin,
  ArrowUp,
  ArrowLeft,
  ArrowUpRight,
} from 'lucide-react';

interface InteractiveTutorialProps {
  activeMode: 'flowchart' | 'structure' | 'ipo';
  isOpenOverride?: boolean;
  onCloseOverride?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onStepChange?: (step: number | null) => void;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  activeMode,
  isOpenOverride,
  onCloseOverride,
  onShowToast,
  onStepChange,
}) => {
  const config = TUTORIAL_CONFIGS[activeMode];

  const [progressState, setProgressState] = useState<TutorialProgressState>(() => {
    return getAllTutorialProgress()[activeMode];
  });

  const [copiedCode, setCopiedCode] = useState(false);
  const [summarySubTab, setSummarySubTab] = useState<'syntax' | 'blocks'>('blocks');
  const [showCheatsheetDirectly, setShowCheatsheetDirectly] = useState(false);

  // Sync state when activeMode changes
  useEffect(() => {
    const all = getAllTutorialProgress();
    setProgressState(all[activeMode]);
    setShowCheatsheetDirectly(false);
  }, [activeMode]);

  // When isOpenOverride is passed from Header (user clicked ?):
  useEffect(() => {
    if (isOpenOverride) {
      const all = getAllTutorialProgress();
      const current = all[activeMode];
      if (current.completed || current.skipped) {
        // If already completed or skipped before, open the cheatsheet directly!
        setShowCheatsheetDirectly(true);
      } else {
        setShowCheatsheetDirectly(false);
      }
      setProgressState((prev) => ({
        ...prev,
        skipped: false,
        isMinimized: false,
      }));
    }
  }, [isOpenOverride, activeMode]);

  const totalSteps = config.steps.length + 1; // 4 tasks + 1 summary step
  const currentStep = progressState.step;
  const isSummaryStep = currentStep >= config.steps.length;

  // Inform parent of current step for UI highlighting
  useEffect(() => {
    if (!progressState.isMinimized && !progressState.completed && !progressState.skipped && !showCheatsheetDirectly) {
      if (currentStep < config.steps.length) {
        onStepChange?.(currentStep);
      } else {
        onStepChange?.(null);
      }
    } else {
      onStepChange?.(null);
    }
  }, [currentStep, progressState.isMinimized, progressState.completed, progressState.skipped, showCheatsheetDirectly, onStepChange, config.steps.length]);

  // Don't show if completed or skipped, unless user explicitly opened via Header (?)
  const isVisible =
    isOpenOverride ||
    (!progressState.completed && !progressState.skipped) ||
    showCheatsheetDirectly;

  if (!isVisible) return null;

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      const next = currentStep + 1;
      const updated = saveTutorialProgress(activeMode, { step: next });
      setProgressState(updated[activeMode]);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      const updated = saveTutorialProgress(activeMode, { step: prev });
      setProgressState(updated[activeMode]);
    }
  };

  const handleSkipTutorial = () => {
    const updated = saveTutorialProgress(activeMode, { skipped: true, isMinimized: false });
    setProgressState(updated[activeMode]);
    setShowCheatsheetDirectly(false);
    onStepChange?.(null);
    if (onCloseOverride) onCloseOverride();
    if (onShowToast) {
      onShowToast(
        `Tutorial ${config.title} dilewati. Anda dapat membukanya kembali kapan saja lewat tombol (?) di navbar.`,
        'info'
      );
    }
  };

  const handleFinishTutorial = () => {
    const updated = saveTutorialProgress(activeMode, { completed: true, isMinimized: false });
    setProgressState(updated[activeMode]);
    setShowCheatsheetDirectly(false);
    onStepChange?.(null);
    if (onCloseOverride) onCloseOverride();
    if (onShowToast) {
      onShowToast(`🎉 Selamat! Anda telah menyelesaikan tutorial ${config.title}.`, 'success');
    }
  };

  const handleRestartTutorial = () => {
    const updated = resetTutorialProgress(activeMode);
    setProgressState(updated[activeMode]);
    setShowCheatsheetDirectly(false);
    if (onShowToast) {
      onShowToast(`Tutorial ${config.title} diulang dari langkah 1.`, 'info');
    }
  };

  const handleToggleMinimize = () => {
    const nextMinimized = !progressState.isMinimized;
    const updated = saveTutorialProgress(activeMode, { isMinimized: nextMinimized });
    setProgressState(updated[activeMode]);
  };

  const handleCopyExampleCode = () => {
    navigator.clipboard.writeText(config.pseudocodeSummary.exampleCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ------------------------------------------------------------------
  // 1. MINIMIZED FLOATING PILL (Bawah Kanan)
  // ------------------------------------------------------------------
  if (progressState.isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <button
          onClick={handleToggleMinimize}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-full shadow-2xl border-2 border-indigo-400 font-semibold text-xs transition-all hover:scale-105 cursor-pointer group"
          title="Klik untuk membuka tutorial kembali"
        >
          <GraduationCap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>
            Tutorial {config.title.split(' ')[0]}: Langkah {currentStep + 1}/{totalSteps}
          </span>
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 2. SUMMARY & CHEATSHEET MODAL (Centered Modal)
  // ------------------------------------------------------------------
  if (isSummaryStep || showCheatsheetDirectly) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Ringkasan & Panduan Simbol: {config.title}
                  </h2>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                    Panduan Lengkap
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Referensi cepat arti setiap bentuk diagram dan aturan format penulisan
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowCheatsheetDirectly(false);
                if (isSummaryStep) handleFinishTutorial();
                else if (onCloseOverride) onCloseOverride();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Tutup panduan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-tabs: Arti Blok vs Sintaks Kode */}
          <div className="px-6 pt-3 pb-2 bg-slate-100/60 border-b border-slate-200 flex items-center gap-2">
            <button
              onClick={() => setSummarySubTab('blocks')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                summarySubTab === 'blocks'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Arti Setiap Blok / Simbol ({config.blockMeanings.length})</span>
            </button>
            <button
              onClick={() => setSummarySubTab('syntax')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                summarySubTab === 'syntax'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Aturan Format & Contoh Valid</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            {summarySubTab === 'blocks' ? (
              <div className="space-y-3">
                <p className="text-slate-500 text-[11px] font-medium">
                  Setiap bentuk diagram memiliki makna semantik khusus dalam standar rekayasa perangkat lunak:
                </p>
                <div className="grid grid-cols-1 gap-2.5">
                  {config.blockMeanings.map((b, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border ${b.colorBg || 'bg-slate-50'} ${
                        b.colorBorder || 'border-slate-200'
                      } flex flex-col sm:flex-row sm:items-start justify-between gap-2.5`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{b.shapeName}</span>
                          <code className="px-1.5 py-0.5 bg-white/80 border border-slate-300 rounded text-[10px] font-mono text-slate-700 font-semibold">
                            {b.syntax}
                          </code>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1.5">
                    {config.pseudocodeSummary.title}
                  </h4>
                  <p className="text-slate-500 mb-3">{config.pseudocodeSummary.description}</p>
                  <ul className="space-y-1.5 list-disc pl-5 text-slate-600 text-[11px]">
                    {config.pseudocodeSummary.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>

                <div className="relative">
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                      Contoh Kode Valid
                    </span>
                    <button
                      onClick={handleCopyExampleCode}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                    {config.pseudocodeSummary.exampleCode}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <button
              onClick={handleRestartTutorial}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ulangi Langkah Tutorial (1-4)</span>
            </button>

            <div className="flex items-center gap-2">
              {isSummaryStep && (
                <button
                  onClick={handlePrevStep}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  Kembali ke Tugas 4
                </button>
              )}
              <button
                onClick={handleFinishTutorial}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesai & Mulai Mendesain</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 3. CONTEXTUAL FLOATING CARD POSITIONING
  // ------------------------------------------------------------------
  const currentTask = config.steps[currentStep];

  // Helper to determine position & visual pointer indicator
  const getContextualMeta = (step: number) => {
    switch (step) {
      case 0:
        // Step 1: Editor Pseudocode / Left Hierarchy Panel (anchored in left column)
        return {
          positionClass: 'top-24 left-4 sm:left-8',
          focusLabel:
            activeMode === 'ipo'
              ? 'Panel Fungsi IPO (Kiri)'
              : activeMode === 'structure'
              ? 'Editor Modul Hierarki (Kiri)'
              : 'Panel Editor Pseudocode (Kiri)',
          pointerIcon: <ArrowLeft className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />,
        };
      case 1:
        // Step 2: Preset Toolbar at the top of the editor
        return {
          positionClass: 'top-28 left-4 sm:left-10 md:left-16',
          focusLabel:
            activeMode === 'ipo'
              ? 'Tab Koneksi & Relasi Data (Kiri)'
              : activeMode === 'structure'
              ? 'Toolbar Notasi Simbol (Atas Editor)'
              : 'Toolbar Preset & Simbol (Atas Editor)',
          pointerIcon: <ArrowUp className="w-3.5 h-3.5 text-amber-400 animate-bounce" />,
        };
      case 2:
        // Step 3: Canvas Controls at the top of canvas preview
        return {
          positionClass: 'top-24 right-4 sm:right-12 md:right-[22%]',
          focusLabel:
            activeMode === 'ipo'
              ? 'Tab Pratinjau Tabel vs Graf (Atas Kanvas)'
              : activeMode === 'structure'
              ? 'Kanvas Pohon Modul (Kanan)'
              : 'Kontrol Tampilan & Kanvas (Atas Kanvas)',
          pointerIcon: <ArrowUp className="w-3.5 h-3.5 text-blue-400 animate-bounce" />,
        };
      case 3:
        // Step 4: Export PNG & Share at top-right navbar
        return {
          positionClass: 'top-16 right-4 sm:right-6',
          focusLabel:
            activeMode === 'ipo'
              ? 'Garis Interaktif & Ekspor Gambar (Kanan)'
              : 'Tombol Ekspor PNG & Bagikan (Kanan Atas)',
          pointerIcon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />,
        };
      default:
        return {
          positionClass: 'bottom-5 right-5',
          focusLabel: 'Alur Fitur Diagram',
          pointerIcon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
        };
    }
  };

  const { positionClass, focusLabel, pointerIcon } = getContextualMeta(currentStep);

  return (
    <div
      className={`fixed ${positionClass} z-40 w-[calc(100vw-32px)] sm:w-96 transition-all duration-300 ease-in-out animate-in fade-in duration-200`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-indigo-500 overflow-hidden flex flex-col">
        {/* Card Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold truncate">Tutorial {config.title.split(' ')[0]}</span>
                <span className="px-1.5 py-0.2 bg-indigo-500/40 border border-indigo-400/30 rounded text-[10px] font-mono text-indigo-200">
                  {currentStep + 1}/{totalSteps}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons: Open Cheatsheet, Skip, Minimize, Close */}
          <div className="flex items-center gap-1">
            {/* Quick Cheatsheet button */}
            <button
              onClick={() => setShowCheatsheetDirectly(true)}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Buka Ringkasan & Arti Blok Lengkap"
            >
              <BookOpen className="w-3 h-3" />
              <span className="hidden sm:inline">Arti Blok</span>
            </button>

            {/* Skip Button (Explicit user request) */}
            <button
              onClick={handleSkipTutorial}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-amber-200 hover:text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Lewati seluruh tutorial"
            >
              <FastForward className="w-3 h-3" />
              <span>Lewati</span>
            </button>

            {/* Minimize */}
            <button
              onClick={handleToggleMinimize}
              className="p-1 hover:bg-white/20 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Perkecil widget tutorial"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              onClick={handleSkipTutorial}
              className="p-1 hover:bg-white/20 text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Tutup tutorial"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Contextual Focus Callout */}
        <div className="px-3.5 py-1.5 bg-indigo-50/90 border-b border-indigo-100 flex items-center justify-between text-[11px] font-bold text-indigo-900">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">Fokus Fitur: {focusLabel}</span>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            {pointerIcon}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-indigo-600 h-1 transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3 text-slate-700 text-xs">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">
              {currentTask.title}
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5 leading-snug">
              {currentTask.task}
            </h3>
          </div>

          <p className="text-slate-600 text-xs leading-relaxed">
            {currentTask.description}
          </p>

          {currentTask.actionHint && (
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>{currentTask.actionHint}</span>
            </div>
          )}

          {currentTask.tip && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Tip: {currentTask.tip}</span>
            </div>
          )}
        </div>

        {/* Card Footer with Skip and Navigation */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={handleSkipTutorial}
            className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            Lewati Tutorial
          </button>

          <div className="flex items-center gap-1.5">
            {currentStep > 0 && (
              <button
                onClick={handlePrevStep}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Langkah sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleNextStep}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <span>{currentStep === config.steps.length - 1 ? 'Lihat Ringkasan' : 'Lanjut'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
