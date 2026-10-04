import {
  Square,
  BookOpen,
  RotateCw,
  Diamond,
  Split,
  ArrowDownCircle,
  Flag,
} from 'lucide-react';

interface StructurePresetToolbarProps {
  onInsertSnippet: (snippet: string) => void;
}

export const StructurePresetToolbar: React.FC<StructurePresetToolbarProps> = ({
  onInsertSnippet,
}) => {
  const presets = [
    {
      id: 'module',
      label: 'Modul',
      shapeName: 'Kotak',
      snippet: '  Nama Modul\n',
      desc: 'Modul program standar',
      icon: Square,
      color: 'text-blue-700 bg-blue-50 border-blue-200 hover:border-blue-400',
    },
    {
      id: 'library',
      label: 'Library Modul',
      shapeName: 'Garis Ganda',
      snippet: '  || Modul Subroutine ||\n',
      desc: 'Subroutine / library berulang',
      icon: BookOpen,
      color: 'text-blue-800 bg-blue-50 border-blue-200 hover:border-blue-400',
    },
    {
      id: 'loop',
      label: 'Loop',
      shapeName: 'Panah Lengkung',
      snippet: ' [LOOP]',
      desc: 'Pemanggilan modul berulang',
      icon: RotateCw,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    },
    {
      id: 'conditional',
      label: 'Kondisi Tunggal',
      shapeName: '1 Diamond',
      snippet: ' [COND]',
      desc: 'Pemanggilan bersyarat tunggal',
      icon: Diamond,
      color: 'text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-400',
    },
    {
      id: 'cond-start',
      label: 'Mulai Grup Kondisi',
      shapeName: 'COND START',
      snippet: ' [COND START]',
      desc: 'Awal 2+ modul gabung dalam 1 diamond',
      icon: Split,
      color: 'text-amber-700 bg-amber-50 border-amber-200 hover:border-amber-400',
    },
    {
      id: 'cond-end',
      label: 'Akhir Grup Kondisi',
      shapeName: 'COND END',
      snippet: ' [COND END]',
      desc: 'Akhir dari grup modul bersyarat',
      icon: Diamond,
      color: 'text-amber-800 bg-amber-50 border-amber-200 hover:border-amber-400',
    },
    {
      id: 'data-couple',
      label: 'Data Couple',
      shapeName: 'Lingkaran Kosong',
      snippet: '    (DATA IN: nama_data)\n',
      desc: 'Aliran data (lingkaran putih o->)',
      icon: ArrowDownCircle,
      color: 'text-sky-600 bg-sky-50 border-sky-200 hover:border-sky-400',
    },
    {
      id: 'control-couple',
      label: 'Control Couple',
      shapeName: 'Lingkaran Padat',
      snippet: '    (FLAG OUT: nama_flag)\n',
      desc: 'Pesan / flag sistem (lingkaran padat ●->)',
      icon: Flag,
      color: 'text-slate-800 bg-slate-100 border-slate-300 hover:border-slate-400',
    },
  ];

  return (
    <div className="bg-slate-50/70 border-b border-slate-200 px-3 py-2 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          Notasi Simbol Structure Chart
        </span>
        <span className="text-[10px] text-slate-400">Klik untuk menyisipkan ke editor</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
        {presets.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onInsertSnippet(item.snippet)}
              title={`${item.label} (${item.shapeName}): ${item.desc}`}
              className={`flex items-center gap-1.5 p-1.5 bg-white border rounded-lg text-left transition-all hover:shadow-2xs group cursor-pointer ${item.color}`}
            >
              <div className="p-1 rounded-md bg-white/80 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                  {item.label}
                </div>
                <div className="text-[9px] text-slate-400 truncate leading-tight">
                  {item.shapeName}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
