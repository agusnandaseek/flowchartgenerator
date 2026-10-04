import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Layers } from 'lucide-react';
import type { IpoFunction } from '../types/ipoChart';

interface IpoFunctionNodeProps {
  data: {
    fn: IpoFunction;
    hasErrors?: boolean;
    errorCount?: number;
  };
  selected?: boolean;
}

export const IpoFunctionNode = memo(({ data, selected }: IpoFunctionNodeProps) => {
  const { fn, hasErrors } = data;

  return (
    <div
      className={`min-w-[200px] max-w-[260px] bg-white rounded-xl border-2 transition-all shadow-md select-none ${
        selected
          ? 'border-indigo-600 ring-4 ring-indigo-100 shadow-lg'
          : hasErrors
          ? 'border-amber-400 hover:border-amber-500'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      {/* Top Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-600 !border-2 !border-white !-top-1.5 transition-transform hover:scale-125"
      />

      {/* Function Title Header */}
      <div className="bg-slate-100 px-3 py-2 rounded-t-[10px] border-b border-slate-200 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-mono font-bold text-xs text-slate-800 truncate" title={`${fn.name}()`}>
            {fn.name ? `${fn.name}()` : '(untitled)'}
          </span>
        </div>
        {hasErrors && (
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Ada validasi yang belum lengkap" />
        )}
      </div>

      {/* Inputs & Outputs Summary Body */}
      <div className="p-2.5 space-y-2 text-[11px]">
        {/* Inputs */}
        <div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Input ({fn.inputs.length}):
          </span>
          {fn.inputs.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {fn.inputs.map((inp) => (
                <span
                  key={inp.id}
                  className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-[10px] truncate max-w-full"
                  title={inp.name}
                >
                  {inp.name || '...'}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic text-[10px]">Belum ada input</span>
          )}
        </div>

        {/* Outputs */}
        <div className="pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Output ({fn.outputs.length}):
          </span>
          {fn.outputs.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {fn.outputs.map((out) => (
                <span
                  key={out.id}
                  className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[10px] truncate max-w-full"
                  title={out.name}
                >
                  {out.name || '...'}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic text-[10px]">Belum ada output</span>
          )}
        </div>
      </div>

      {/* Bottom Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-600 !border-2 !border-white !-bottom-1.5 transition-transform hover:scale-125"
      />
    </div>
  );
});

IpoFunctionNode.displayName = 'IpoFunctionNode';
