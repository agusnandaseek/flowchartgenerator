import React, { useState } from 'react';
import { X, BookOpen, Check, PlayCircle, ArrowRightToLine, Square, GitFork, Repeat, Layers, RefreshCw, Diamond, Disc, Circle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'flowchart' | 'structure';
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, initialTab = 'flowchart' }) => {
  const [activeTab, setActiveTab] = useState<'flowchart' | 'structure'>(initialTab);

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
                Format penulisan diagram Flowchart & Structure Chart standar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5 px-6">
          <button
            onClick={() => setActiveTab('flowchart')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'flowchart'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Panduan Flowchart
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'structure'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Panduan Structure Chart (Standar BINUS)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {activeTab === 'flowchart' ? (
            <>
              {/* Flowchart Section 1 */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                  Standar Bentuk Flowchart & Auto-Adjust
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-emerald-900 mb-1">
                      <PlayCircle className="w-4 h-4 text-emerald-600" />
                      <span>Oval / Kapsul (Terminator)</span>
                    </div>
                    <p className="text-emerald-800 text-[11px] mb-1.5">
                      Menandakan awal dan akhir dari sebuah alur program.
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-emerald-950 font-mono">
                      MULAI / START<br />
                      SELESAI / END
                    </code>
                  </div>

                  <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-sky-900 mb-1">
                      <ArrowRightToLine className="w-4 h-4 text-sky-600" />
                      <span>Jajar Genjang (Input / Output)</span>
                    </div>
                    <p className="text-sky-800 text-[11px] mb-1.5">
                      Menerima masukan dari pengguna atau mencetak hasil ke layar.
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-sky-950 font-mono">
                      MASUKKAN nama, nilai<br />
                      TAMPILKAN "Hasil: ", nilai
                    </code>
                  </div>

                  <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
                      <Square className="w-4 h-4 text-indigo-600" />
                      <span>Persegi Panjang (Proses)</span>
                    </div>
                    <p className="text-indigo-800 text-[11px] mb-1.5">
                      Perhitungan matematika, penugasan variabel, atau pemrosesan data.
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-indigo-950 font-mono">
                      luas = alas * tinggi / 2<br />
                      total = total + harga
                    </code>
                  </div>

                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                      <GitFork className="w-4 h-4 text-amber-600" />
                      <span>Belah Ketupat (Keputusan / If)</span>
                    </div>
                    <p className="text-amber-800 text-[11px] mb-1.5">
                      Evaluasi logika kondisi dengan 2 cabang keluaran: Ya dan Tidak.
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-amber-950 font-mono whitespace-pre">
{`JIKA nilai >= 75 MAKA
    TAMPILKAN "Lulus"
LAINNYA
    TAMPILKAN "Gagal"
AKHIR-JIKA`}
                    </code>
                  </div>
                </div>
              </div>

              {/* Loop Section */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                  Perulangan (Loop While / For)
                </h3>
                <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                  <div className="flex items-center gap-2 font-bold text-purple-900 mb-1">
                    <Repeat className="w-4 h-4 text-purple-600" />
                    <span>Sintaks Loop Berulang</span>
                  </div>
                  <p className="text-purple-800 text-[11px] mb-1.5">
                    Alur akan berputar kembali ke pengujian kondisi selama bernilai Ya (True), dan keluar saat Tidak (False).
                  </p>
                  <code className="block bg-white/80 p-2 rounded text-[11px] text-purple-950 font-mono whitespace-pre">
{`SELAMA counter <= 10 LAKUKAN
    TAMPILKAN counter
    counter = counter + 1
AKHIR-SELAMA`}
                  </code>
                </div>
              </div>

              {/* Fitur Auto-Adjust */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Fitur Auto-Adjust Teks
                </h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Setiap bentuk (Oval, Jajar Genjang, Persegi Panjang, dan Belah Ketupat) dirancang secara responsif untuk memperbesar ukuran secara otomatis agar teks tidak pernah terpotong.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Structure Chart Notations */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                  6 Simbol Standar Structure Chart
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* 1. Module */}
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                      <Square className="w-4 h-4 text-blue-600" />
                      <span>1. Modul (Module)</span>
                    </div>
                    <p className="text-blue-800 text-[11px] mb-1.5">
                      Persegi panjang dengan garis tepi biru solid merepresentasikan modul atau fungsi program.
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-blue-950 font-mono">
                      Order Processing System<br />
                      &nbsp;&nbsp;Verify Order
                    </code>
                  </div>

                  {/* 2. Library Module */}
                  <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>2. Library Module (Subrutin)</span>
                    </div>
                    <p className="text-indigo-800 text-[11px] mb-1.5">
                      Modul umum / pustaka yang digunakan kembali ditandai dengan <strong>dua garis vertikal</strong> di sisi kiri & kanan.
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-indigo-950 font-mono">
                      [LIB] Read Order Data<br />
                      atau || Read Order Data ||
                    </code>
                  </div>

                  {/* 3. Loop */}
                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-purple-900 mb-1">
                      <RefreshCw className="w-4 h-4 text-purple-600" />
                      <span>3. Loop (Perulangan)</span>
                    </div>
                    <p className="text-purple-800 text-[11px] mb-1.5">
                      Panah melengkung berputar di sekitar garis pemanggilan modul yang dipanggil berulang kali.
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-purple-950 font-mono">
                      &nbsp;&nbsp;[LOOP] Check Inventory
                    </code>
                  </div>

                  {/* 4. Conditional Line */}
                  <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-sky-900 mb-1">
                      <Diamond className="w-4 h-4 text-sky-600" />
                      <span>4. Pemanggilan Bersyarat (Diamond)</span>
                    </div>
                    <p className="text-sky-800 text-[11px] mb-1.5">
                      Simbol belah ketupat padat (◆) pada titik cabang pemanggilan menunjukkan modul dipanggil hanya jika kondisi tertentu terpenuhi.
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-sky-950 font-mono">
                      &nbsp;&nbsp;[COND] Apply Discount
                    </code>
                  </div>

                  {/* 5. Data Couple */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-emerald-900 mb-1">
                      <Circle className="w-4 h-4 text-emerald-600" />
                      <span>5. Data Couple (○---►)</span>
                    </div>
                    <p className="text-emerald-800 text-[11px] mb-1.5">
                      Panah sejajar dengan <strong>lingkaran kosong (hollow)</strong> di pangkalnya. Mengalirkan data murni antar modul.
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-emerald-950 font-mono">
                      (DATA OUT: Order Data)<br />
                      (DATA IN: Total Bill)
                    </code>
                  </div>

                  {/* 6. Control Couple */}
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                      <Disc className="w-4 h-4 text-amber-600" />
                      <span>6. Control Couple (●---►)</span>
                    </div>
                    <p className="text-amber-800 text-[11px] mb-1.5">
                      Panah sejajar dengan <strong>lingkaran padat hitam (solid)</strong> di pangkalnya. Mengalirkan kontrol / flag status (True/False).
                    </p>
                    <code className="block bg-white/80 p-1.5 rounded text-[11px] text-amber-950 font-mono">
                      (FLAG OUT: Valid Flag)<br />
                      (FLAG IN: EOF Status)
                    </code>
                  </div>
                </div>
              </div>

              {/* Indentation Rule */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-600" />
                  Hierarki Top-Down & Indentasi
                </h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Structure Chart menggunakan indentasi 2 atau 4 spasi untuk menentukan relasi modul induk (penelepon) dan modul bawahan (yang dipanggil). Modul di paling atas menjadi Root Controller, dan percabangan terhubung secara otomatis dari atas ke bawah (Top-Down).
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};

