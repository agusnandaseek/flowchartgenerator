import { memo, useMemo } from 'react';
import { Handle, Position, useNodeConnections } from '@xyflow/react';
import { Layers } from 'lucide-react';
import type { IpoFunction } from '../types/ipoChart';

interface IpoFunctionNodeProps {
  id?: string;
  data: {
    fn: IpoFunction;
    hasErrors?: boolean;
    errorCount?: number;
    connectedHandles?: string[];
  };
  selected?: boolean;
}

export const IpoFunctionNode = memo(({ id, data, selected }: IpoFunctionNodeProps) => {
  const { fn, hasErrors } = data;

  // Deteksi handle yang aktif terhubung ke garis
  const nodeConnections = useNodeConnections();
  const connectedHandleSet = useMemo(() => {
    const set = new Set<string>(data.connectedHandles || []);
    if (Array.isArray(nodeConnections)) {
      for (const c of nodeConnections) {
        if (c.source === id && c.sourceHandle) set.add(c.sourceHandle);
        if (c.target === id && c.targetHandle) set.add(c.targetHandle);
      }
    }
    return set;
  }, [data.connectedHandles, nodeConnections, id]);

  const isConnected = (handleId: string) => connectedHandleSet.has(handleId);

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
      {/* Top Target Handles (Distributed Anti-Overlap Slots) */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top-left"
        style={{ left: '25%' }}
        className={`transition-all ${
          isConnected('target-top-left')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-top-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        style={{ left: '50%' }}
        className={`transition-all ${
          isConnected('target-top')
            ? '!w-3 !h-3 !bg-indigo-600 !border-2 !border-white !-top-1.5 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top-right"
        style={{ left: '75%' }}
        className={`transition-all ${
          isConnected('target-top-right')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-top-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />

      {/* Left Target Handle (aligned with inputs) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        style={{ top: '35%' }}
        className={`transition-all ${
          isConnected('target-left')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-left-1.5 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />

      {/* Right Target Handle (aligned with inputs) */}
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        style={{ top: '35%' }}
        className={`transition-all ${
          isConnected('target-right')
            ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-right-1.5 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
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
            <div className="flex flex-wrap gap-1.5">
              {fn.inputs.map((inp) => (
                <div key={inp.id} className="relative inline-flex items-center group/inp">
                  <span
                    className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono text-[10px] truncate max-w-full"
                    title={`Input: ${inp.name}`}
                  >
                    {inp.name || '...'}
                  </span>
                  {/* Dedicated per-input target pin */}
                  <Handle
                    type="target"
                    position={Position.Top}
                    id={`target-in-${inp.id}`}
                    className={`!left-1/2 !-translate-x-1/2 transition-all ${
                      isConnected(`target-in-${inp.id}`)
                        ? '!w-2.5 !h-2.5 !bg-indigo-600 !border-2 !border-white !-top-1.5 opacity-100'
                        : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                    }`}
                    title={`Pin Target: ${inp.name}`}
                  />
                </div>
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
            <div className="flex flex-wrap gap-1.5">
              {fn.outputs.map((out) => (
                <div key={out.id} className="relative inline-flex items-center group/out">
                  <span
                    className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono text-[10px] truncate max-w-full"
                    title={`Output: ${out.name}`}
                  >
                    {out.name || '...'}
                  </span>
                  {/* Dedicated per-output source pin */}
                  <Handle
                    type="source"
                    position={Position.Bottom}
                    id={`source-out-${out.id}`}
                    className={`!left-1/2 !-translate-x-1/2 transition-all ${
                      isConnected(`source-out-${out.id}`)
                        ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-bottom-1.5 opacity-100'
                        : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
                    }`}
                    title={`Pin Output: ${out.name}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic text-[10px]">Belum ada output</span>
          )}
        </div>
      </div>

      {/* Left Source Handle (aligned with outputs) */}
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        style={{ top: '65%' }}
        className={`transition-all ${
          isConnected('source-left')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-left-1.5 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />

      {/* Right Source Handle (aligned with outputs) */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        style={{ top: '65%' }}
        className={`transition-all ${
          isConnected('source-right')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-right-1.5 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />

      {/* Bottom Source Handles (Distributed Anti-Overlap Slots) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom-left"
        style={{ left: '25%' }}
        className={`transition-all ${
          isConnected('source-bottom-left')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-bottom-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        style={{ left: '50%' }}
        className={`transition-all ${
          isConnected('source-bottom')
            ? '!w-3 !h-3 !bg-emerald-600 !border-2 !border-white !-bottom-1.5 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom-right"
        style={{ left: '75%' }}
        className={`transition-all ${
          isConnected('source-bottom-right')
            ? '!w-2.5 !h-2.5 !bg-emerald-600 !border-2 !border-white !-bottom-1 opacity-100'
            : '!w-2 !h-2 !bg-transparent !border-0 opacity-0 pointer-events-none'
        }`}
      />
    </div>
  );
});

IpoFunctionNode.displayName = 'IpoFunctionNode';
