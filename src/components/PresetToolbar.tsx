import React from 'react';
import {
  PlayCircle,
  StopCircle,
  ArrowRightToLine,
  ArrowLeftFromLine,
  Square,
  GitFork,
  Repeat,
  type LucideIcon,
  Plus,
} from 'lucide-react';
import { FLOWCHART_PRESETS } from '../utils/presets';
import type { PresetItem } from '../types/flowchart';

interface PresetToolbarProps {
  onInsertSnippet: (snippet: string) => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  PlayCircle,
  StopCircle,
  ArrowRightToLine,
  ArrowLeftFromLine,
  Square,
  GitFork,
  Repeat,
};

export const PresetToolbar: React.FC<PresetToolbarProps> = ({ onInsertSnippet }) => {
  return (
    <div className="bg-slate-50 border-b border-slate-200 p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
          Preset Elemen Flowchart
        </span>
        <span className="text-[10px] text-slate-400">
          Klik tombol untuk menyisipkan ke kode
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {FLOWCHART_PRESETS.map((preset: PresetItem) => {
          const Icon = ICON_MAP[preset.iconName] || Plus;

          // Badges and colors per category
          let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
          let hoverBorder = 'hover:border-indigo-400 hover:bg-indigo-50/50';

          if (preset.id === 'start') {
            badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            hoverBorder = 'hover:border-emerald-400 hover:bg-emerald-50/50';
          } else if (preset.id === 'end') {
            badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
            hoverBorder = 'hover:border-rose-400 hover:bg-rose-50/50';
          } else if (preset.category === 'io') {
            badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
            hoverBorder = 'hover:border-sky-400 hover:bg-sky-50/50';
          } else if (preset.category === 'decision') {
            badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
            hoverBorder = 'hover:border-amber-400 hover:bg-amber-50/50';
          } else if (preset.category === 'loop') {
            badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
            hoverBorder = 'hover:border-purple-400 hover:bg-purple-50/50';
          }

          return (
            <button
              key={preset.id}
              onClick={() => onInsertSnippet(preset.snippet)}
              title={`${preset.label} (${preset.shapeName})\n${preset.description}`}
              className={`flex items-center gap-2 p-1.5 px-2 bg-white border border-slate-200 rounded-lg text-left transition-all group shadow-2xs ${hoverBorder}`}
            >
              <div
                className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${badgeColor}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                  {preset.label}
                </div>
                <div className="text-[9px] text-slate-400 truncate leading-none mt-0.5">
                  {preset.shapeName}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
