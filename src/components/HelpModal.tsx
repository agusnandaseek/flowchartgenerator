import React, { useState } from 'react';
import {
  X,
  BookOpen,
  PlayCircle,
  ArrowRightToLine,
  Square,
  GitFork,
  Layers,
  RefreshCw,
  Disc,
  Circle,
  Table2,
  Link2,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'flowchart' | 'structure' | 'ipo';
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'flowchart',
}) => {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'structure' | 'ipo'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Panduan Simbol & Sintaks
              </h2>
              <p className="text-xs text-slate-500">
                Format penulisan Flowchart, Structure Chart & IPO Chart Builder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5 px-6">
          <button
            onClick={() => setActiveTab('flowchart')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'flowchart'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Panduan Flowchart
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'structure'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Structure Chart
          </button>
          <button
            onClick={() => setActiveTab('ipo')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'ipo'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            IPO Chart Builder
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs leading-relaxed">
          {activeTab === 'flowchart' && (
            <>
              {/* Flowchart Guide */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Simbol Dasar Flowchart
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <PlayCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Terminator (Start / End)</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Menandai awal atau akhir program. Ditulis dengan kata kunci <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-emerald-600 font-mono">START</code> atau <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-emerald-600 font-mono">END</code>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <ArrowRightToLine className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Input / Output</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Operasi masukan/keluaran. Ditulis dengan kata kunci <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-600 font-mono">INPUT</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-600 font-mono">READ</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-600 font-mono">OUTPUT</code>, atau <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-600 font-mono">PRINT</code>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <Square className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Process</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Perhitungan atau penugasan variabel. Contoh: <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">luas = panjang * lebar</code>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <GitFork className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Decision (Percabangan)</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Kondisi logika menggunakan <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-amber-600 font-mono">IF ... THEN ... ELSE ... ENDIF</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'structure' && (
            <>
              {/* Structure Chart Guide */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Standar Notasi Structure Chart
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <Layers className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Hierarki Indentasi Modul</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Induk modul didefinisikan paling kiri, modul anak menjorok 2 spasi di bawahnya.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Looping & Kondisi</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tambahkan tag <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-indigo-600 font-mono">[LOOP]</code> untuk busur perulangan, atau <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-indigo-600 font-mono">[COND]</code> untuk diamond kondisi.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <Circle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Data Couple (○──►)</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Gunakan baris <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-sky-600 font-mono">(DATA IN: var)</code> atau <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-sky-600 font-mono">(DATA OUT: var)</code> di bawah modul.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <Disc className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Control Flag (●──►)</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Gunakan baris <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-rose-600 font-mono">(FLAG IN: flag)</code> atau <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-rose-600 font-mono">(FLAG OUT: flag)</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'ipo' && (
            <>
              {/* IPO Chart Guide */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Panduan IPO Chart Builder (Manual Functional Design)
                </h3>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-bold text-slate-900 text-xs">1. Prinsip Kerja Manual (No AI Generator)</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Fitur ini dirancang sebagai sarana perancangan mandiri bagi mahasiswa/perancang program. Pengguna menentukan secara eksplisit: nama fungsi, input yang diperlukan, algoritma proses yang dilakukan, dan output yang dihasilkan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-blue-50/50">
                      <span className="font-mono font-bold text-blue-700 text-xs block mb-1">INPUT (25%)</span>
                      <p className="text-[11px] text-slate-600">
                        Parameter masukan atau data yang wajib diterima oleh function sebelum dieksekusi.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-amber-50/50">
                      <span className="font-mono font-bold text-amber-700 text-xs block mb-1">PROCESS (50%)</span>
                      <p className="text-[11px] text-slate-600">
                        Langkah-langkah logika, formula matematika, percabangan IF, atau pemanggilan fungsi.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-emerald-50/50">
                      <span className="font-mono font-bold text-emerald-700 text-xs block mb-1">OUTPUT (25%)</span>
                      <p className="text-[11px] text-slate-600">
                        Nilai kembalian, dokumen laporan, atau mutasi data yang dihasilkan oleh fungsi.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-indigo-600" />
                      <h4 className="font-bold text-slate-900 text-xs">2. Function Relationships (Ketergantungan Data)</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Gunakan tab <strong>Connections</strong> di panel kiri untuk mendefinisikan aliran data antar-fungsi (misal: <code>itemTotal</code> dari fungsi <code>calculateItemTotal</code> diteruskan sebagai input ke <code>applyLoyaltyDiscount</code>). Pada panel kanan, pilih mode <strong>[ Function Relationships ]</strong> untuk melihat diagram kotak fungsi dan panah terarah yang terbentuk.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Mengerti, Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
